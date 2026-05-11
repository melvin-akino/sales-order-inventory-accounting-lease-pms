import { prisma } from "@/lib/prisma";
import { brand as envBrand } from "@/lib/brand";

export type OrgBrand = {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  tin: string;
  website: string;
  color: string;
  rdo: string;
  zip: string;
};

const ENV_DEFAULTS: OrgBrand = {
  name:    envBrand.name,
  tagline: envBrand.tagline,
  address: envBrand.address,
  phone:   envBrand.phone,
  email:   envBrand.email,
  tin:     envBrand.tin,
  website: envBrand.website,
  color:   envBrand.color,
  rdo:     process.env.NEXT_PUBLIC_ORG_RDO ?? "044",
  zip:     process.env.NEXT_PUBLIC_ORG_ZIP ?? "1550",
};

export async function getOrgSettings(): Promise<OrgBrand> {
  try {
    const row = await prisma.orgSettings.findUnique({ where: { id: "singleton" } });
    if (row) return { name: row.name, tagline: row.tagline, address: row.address, phone: row.phone, email: row.email, tin: row.tin, website: row.website, color: row.color, rdo: row.rdo, zip: row.zip };
  } catch {}
  return ENV_DEFAULTS;
}

export { ENV_DEFAULTS as envBrandDefaults };
