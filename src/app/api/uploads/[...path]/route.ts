import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, resolve } from "path";
const MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  webp: "image/webp", svg: "image/svg+xml", gif: "image/gif",
  pdf: "application/pdf",
};
function mimeFor(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME[ext] ?? "application/octet-stream";
}

const UPLOAD_ROOT = resolve(join(process.cwd(), "uploads"));

/**
 * Serves files from the /app/uploads Docker volume.
 * The volume is mounted read-only by the filesystem route but writable by
 * server actions. This replaces serving from public/ which is read-only in
 * the Next.js standalone production image.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Prevent path traversal attacks
  const relative = params.path.join("/");
  const absolute = resolve(join(UPLOAD_ROOT, relative));
  if (!absolute.startsWith(UPLOAD_ROOT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const bytes = await readFile(absolute);
    const mime = mimeFor(absolute);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
