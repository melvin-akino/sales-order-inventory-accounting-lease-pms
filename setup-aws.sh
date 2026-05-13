#!/usr/bin/env bash
# =============================================================================
#  Vital Sign · Ops — AWS One-Stop Setup Script
#  Supports: Ubuntu 20.04/22.04/24.04 LTS, Amazon Linux 2/2023
#
#  Usage:
#    sudo bash setup-aws.sh                     # interactive
#    sudo bash setup-aws.sh --non-interactive   # all defaults, no prompts
#
#  What this script does:
#    1. Installs Docker, Docker Compose, Git, Nginx, Certbot, UFW
#    2. Clones the application repository
#    3. Auto-generates DB password, NextAuth secret
#    4. Writes .env and docker-compose.override.yml
#    5. Builds and starts all containers (DB → migrate → app)
#    6. Configures Nginx reverse proxy (optional, requires domain)
#    7. Obtains Let's Encrypt SSL certificate (optional, requires domain)
#    8. Configures firewall (UFW / iptables)
#    9. Registers a systemd service for auto-start on reboot
#   10. Saves all credentials to /root/vitalsign-credentials.txt
# =============================================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
REPO_URL="https://github.com/melvin-akino/sales-order-inventory-accounting-lease-pms.git"
APP_DIR="/opt/vitalsign"
APP_PORT=3000
CREDS_FILE="/root/vitalsign-credentials.txt"
NON_INTERACTIVE=false
[[ "${1:-}" == "--non-interactive" ]] && NON_INTERACTIVE=true

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# ── Helpers ───────────────────────────────────────────────────────────────────
log()  { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $*"; }
ok()   { echo -e "  ${GREEN}✔${NC} $*"; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*"; }
die()  { echo -e "\n${RED}✖  $*${NC}\n" >&2; exit 1; }
banner() {
  echo -e "\n${CYAN}${BOLD}━━━  $*  ━━━${NC}\n"
}

ask() {
  # ask VAR_NAME "Prompt text" "default"
  local __var="$1" __prompt="$2" __default="$3" __val
  if $NON_INTERACTIVE; then
    eval "$__var='$__default'"
    return
  fi
  read -rp "$(echo -e "  ${YELLOW}?${NC} ${__prompt} [${CYAN}${__default}${NC}]: ")" __val
  eval "$__var='${__val:-$__default}'"
}

require_root() {
  [[ $EUID -eq 0 ]] || die "Run as root: sudo bash $0"
}

detect_os() {
  OS_ID=$(grep -oP '(?<=^ID=).+' /etc/os-release 2>/dev/null | tr -d '"' | head -1 || echo "unknown")
  OS_VER=$(grep -oP '(?<=^VERSION_ID=).+' /etc/os-release 2>/dev/null | tr -d '"' | head -1 || echo "0")
  IS_AMAZON=false; IS_UBUNTU=false; IS_DEBIAN=false
  case "$OS_ID" in
    amzn)                 IS_AMAZON=true ;;
    ubuntu)               IS_UBUNTU=true ;;
    debian)               IS_DEBIAN=true ;;
    *) warn "Unrecognised OS ($OS_ID). Assuming Debian-like." ; IS_DEBIAN=true ;;
  esac
}

gen_pass() {
  # 32-char alphanumeric password
  openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 32
}

gen_secret() {
  openssl rand -base64 48
}

# ─────────────────────────────────────────────────────────────────────────────
require_root
detect_os

echo -e "\n${CYAN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║        Vital Sign · Ops — AWS One-Stop Setup Script         ║"
echo "  ║        https://github.com/melvin-akino/...                  ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ── 0. Swap space (critical for t2.micro / 1 GB RAM) ─────────────────────────
banner "Checking Memory & Swap"

TOTAL_RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
TOTAL_SWAP_MB=$(free -m | awk '/^Swap:/{print $2}')

if [[ $TOTAL_RAM_MB -lt 2048 ]]; then
  warn "Low RAM detected: ${TOTAL_RAM_MB} MB (t2.micro / free tier)"
  warn "Docker builds require ~2 GB — adding 3 GB swap to compensate"

  if [[ $TOTAL_SWAP_MB -gt 0 ]]; then
    ok "Swap already active: ${TOTAL_SWAP_MB} MB"
  else
    log "Creating 3 GB swap file at /swapfile…"
    fallocate -l 3G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=3072 status=none
    chmod 600 /swapfile
    mkswap /swapfile -q
    swapon /swapfile
    # Persist across reboots
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    # Lower swappiness so RAM is preferred
    sysctl -w vm.swappiness=10 > /dev/null
    grep -q 'vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
    ok "3 GB swap created and enabled"
    ok "Effective memory: ${TOTAL_RAM_MB} MB RAM + 3072 MB swap"
  fi

  warn "Build will be slower than normal (~20–30 min on t2.micro) — this is expected"
else
  ok "RAM: ${TOTAL_RAM_MB} MB — sufficient"
fi

# ── 1. Interactive configuration ──────────────────────────────────────────────
banner "Configuration"

ask DOMAIN      "Domain / subdomain for Nginx + SSL (blank = IP-only)" ""
ask SSL_EMAIL   "Email address for Let's Encrypt (required if domain set)" "admin@example.com"

echo ""
echo -e "  ${BOLD}Branding / Organisation${NC}"
ask ORG_NAME     "Organisation name"       "MediSupply PH"
ask ORG_TAGLINE  "Tagline"                 "Medical Equipment & Supplies"
ask ORG_ADDRESS  "Address"                 "3F Greenfield Tower, Mandaluyong City, Metro Manila 1550"
ask ORG_PHONE    "Phone"                   "+63 2 8123 4567"
ask ORG_EMAIL    "Email"                   "info@medisupply.ph"
ask ORG_TIN      "TIN"                     "123-456-789-000"
ask ORG_WEBSITE  "Website"                 "www.medisupply.ph"
ask ORG_COLOR    "Brand accent color"      "#003087"
ask ORG_RDO      "RDO code"               "044"
ask ORG_ZIP      "ZIP / postal code"       "1550"

echo ""

# ── 2. Generate credentials ───────────────────────────────────────────────────
banner "Generating Credentials"

DB_PASSWORD=$(gen_pass)
NEXTAUTH_SECRET=$(gen_secret)

# Determine NextAuth URL
if [[ -n "$DOMAIN" ]]; then
  NEXTAUTH_URL="https://${DOMAIN}"
else
  # Try AWS EC2 metadata; fall back to public IP service; fall back to localhost
  PUBLIC_IP=$(curl -sf --max-time 3 http://169.254.169.254/latest/meta-data/public-ipv4 \
           || curl -sf --max-time 5 https://ifconfig.me \
           || hostname -I | awk '{print $1}')
  NEXTAUTH_URL="http://${PUBLIC_IP}:${APP_PORT}"
fi

ok "DB password  : ${DB_PASSWORD}"
ok "NextAuth URL : ${NEXTAUTH_URL}"
ok "NextAuth secret generated (base64)"

# ── 3. Install system dependencies ────────────────────────────────────────────
banner "Installing System Dependencies"

if $IS_AMAZON; then
  # ── Amazon Linux 2 / 2023 ────────────────────────────────────────────────
  log "Updating yum…"
  yum update -y -q

  log "Installing base packages…"
  yum install -y git curl wget unzip jq openssl

  # Docker (Amazon Linux 2)
  if [[ "$OS_VER" == "2" ]]; then
    amazon-linux-extras enable docker
    yum install -y docker
  else
    # Amazon Linux 2023
    yum install -y docker
  fi
  systemctl enable --now docker
  usermod -aG docker ec2-user 2>/dev/null || true

  # Docker Compose v2 plugin
  COMPOSE_DEST="/usr/local/lib/docker/cli-plugins"
  mkdir -p "$COMPOSE_DEST"
  COMPOSE_VER=$(curl -sf https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | sed 's/.*"\(v[^"]*\)".*/\1/')
  curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VER}/docker-compose-linux-x86_64" \
    -o "${COMPOSE_DEST}/docker-compose"
  chmod +x "${COMPOSE_DEST}/docker-compose"
  ln -sf "${COMPOSE_DEST}/docker-compose" /usr/local/bin/docker-compose
  ok "Docker Compose ${COMPOSE_VER} installed"

  # Nginx (Amazon Linux)
  amazon-linux-extras enable nginx1 2>/dev/null || yum install -y nginx
  yum install -y nginx
  systemctl enable --now nginx

else
  # ── Ubuntu / Debian ───────────────────────────────────────────────────────
  export DEBIAN_FRONTEND=noninteractive
  log "Updating apt…"
  apt-get update -qq

  log "Installing base packages…"
  apt-get install -y -qq \
    git curl wget unzip jq openssl ca-certificates gnupg lsb-release \
    nginx ufw certbot python3-certbot-nginx

  # Docker official repo
  log "Installing Docker…"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
  usermod -aG docker ubuntu 2>/dev/null || true

  ok "Docker $(docker --version | awk '{print $3}' | tr -d ',') installed"
fi

ok "All system dependencies installed"

# ── 4. Clone repository ───────────────────────────────────────────────────────
banner "Cloning Repository"

if [[ -d "$APP_DIR/.git" ]]; then
  warn "$APP_DIR already exists — pulling latest changes"
  git -C "$APP_DIR" pull --ff-only
else
  log "Cloning ${REPO_URL} → ${APP_DIR}…"
  git clone --depth 1 "$REPO_URL" "$APP_DIR"
fi
ok "Repository ready at $APP_DIR"

# ── 5. Write .env ─────────────────────────────────────────────────────────────
banner "Writing Environment Files"

cat > "$APP_DIR/.env" << ENVEOF
# ── Generated by setup-aws.sh on $(date) ─────────────────────────────────────

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db:5432/vitalsign"
DIRECT_URL="postgresql://postgres:${DB_PASSWORD}@db:5432/vitalsign"

# ── NextAuth ──────────────────────────────────────────────────────────────────
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="${NEXTAUTH_URL}"

# ── Supabase (placeholder — unused in Docker-only deploy) ─────────────────────
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder"

# ── App ────────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME="Vital Sign · Ops"
NEXT_PUBLIC_APP_ORG="${ORG_NAME}"

# ── Branding ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_ORG_NAME="${ORG_NAME}"
NEXT_PUBLIC_ORG_TAGLINE="${ORG_TAGLINE}"
NEXT_PUBLIC_ORG_ADDRESS="${ORG_ADDRESS}"
NEXT_PUBLIC_ORG_PHONE="${ORG_PHONE}"
NEXT_PUBLIC_ORG_EMAIL="${ORG_EMAIL}"
NEXT_PUBLIC_ORG_TIN="${ORG_TIN}"
NEXT_PUBLIC_ORG_WEBSITE="${ORG_WEBSITE}"
NEXT_PUBLIC_ORG_COLOR="${ORG_COLOR}"
NEXT_PUBLIC_ORG_RDO="${ORG_RDO}"
NEXT_PUBLIC_ORG_ZIP="${ORG_ZIP}"
ENVEOF
chmod 600 "$APP_DIR/.env"
ok ".env written (chmod 600)"

# ── 6. Write docker-compose.override.yml ─────────────────────────────────────

cat > "$APP_DIR/docker-compose.override.yml" << OVERRIDEEOF
version: "3.9"

# Auto-generated by setup-aws.sh — do not edit manually
# Regenerate by re-running: sudo bash ${APP_DIR}/setup-aws.sh

services:
  db:
    environment:
      POSTGRES_USER:     postgres
      POSTGRES_PASSWORD: "${DB_PASSWORD}"
      POSTGRES_DB:       vitalsign

  migrate:
    environment:
      DATABASE_URL:                "postgresql://postgres:${DB_PASSWORD}@db:5432/vitalsign"
      DIRECT_URL:                  "postgresql://postgres:${DB_PASSWORD}@db:5432/vitalsign"
      NEXTAUTH_SECRET:             "${NEXTAUTH_SECRET}"
      NEXTAUTH_URL:                "${NEXTAUTH_URL}"
      NEXT_PUBLIC_SUPABASE_URL:    "http://localhost:54321"
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder"

  app:
    environment:
      DATABASE_URL:                "postgresql://postgres:${DB_PASSWORD}@db:5432/vitalsign"
      DIRECT_URL:                  "postgresql://postgres:${DB_PASSWORD}@db:5432/vitalsign"
      NEXTAUTH_SECRET:             "${NEXTAUTH_SECRET}"
      NEXTAUTH_URL:                "${NEXTAUTH_URL}"
      NEXT_PUBLIC_SUPABASE_URL:    "http://localhost:54321"
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder"
      NEXT_PUBLIC_APP_NAME:        "Vital Sign · Ops"
      NEXT_PUBLIC_APP_ORG:         "${ORG_NAME}"
      NEXT_PUBLIC_ORG_NAME:        "${ORG_NAME}"
      NEXT_PUBLIC_ORG_TAGLINE:     "${ORG_TAGLINE}"
      NEXT_PUBLIC_ORG_ADDRESS:     "${ORG_ADDRESS}"
      NEXT_PUBLIC_ORG_PHONE:       "${ORG_PHONE}"
      NEXT_PUBLIC_ORG_EMAIL:       "${ORG_EMAIL}"
      NEXT_PUBLIC_ORG_TIN:         "${ORG_TIN}"
      NEXT_PUBLIC_ORG_WEBSITE:     "${ORG_WEBSITE}"
      NEXT_PUBLIC_ORG_COLOR:       "${ORG_COLOR}"
      NEXT_PUBLIC_ORG_RDO:         "${ORG_RDO}"
      NEXT_PUBLIC_ORG_ZIP:         "${ORG_ZIP}"
OVERRIDEEOF
chmod 600 "$APP_DIR/docker-compose.override.yml"
ok "docker-compose.override.yml written"

# ── 7. Build and start containers ─────────────────────────────────────────────
banner "Building & Starting Application"

cd "$APP_DIR"
log "Running docker compose up --build (first run takes 5–15 minutes)…"
docker compose up -d --build

# Wait for healthy with spinner
log "Waiting for application health check…"
WAIT=0
MAX_WAIT=300  # 5 minutes
until [[ "$(docker inspect --format='{{.State.Health.Status}}' vitalsign-ops 2>/dev/null)" == "healthy" ]]; do
  sleep 5
  WAIT=$((WAIT + 5))
  printf "\r  ${CYAN}⏳${NC} Waiting… %ds" "$WAIT"
  if [[ $WAIT -ge $MAX_WAIT ]]; then
    echo ""
    warn "Health check timeout after ${MAX_WAIT}s. Check logs: docker compose logs app"
    break
  fi
done
echo ""
STATUS=$(docker inspect --format='{{.State.Health.Status}}' vitalsign-ops 2>/dev/null || echo "unknown")
if [[ "$STATUS" == "healthy" ]]; then
  ok "Application container is healthy"
else
  warn "Container status: ${STATUS} — the app may still be starting"
fi

# ── 8. Nginx reverse proxy ────────────────────────────────────────────────────
if [[ -n "$DOMAIN" ]]; then
  banner "Configuring Nginx + SSL for ${DOMAIN}"

  NGINX_CONF="/etc/nginx/sites-available/vitalsign"
  NGINX_ENABLED="/etc/nginx/sites-enabled/vitalsign"

  # Disable default site if it exists
  [[ -f /etc/nginx/sites-enabled/default ]] && rm -f /etc/nginx/sites-enabled/default

  cat > "$NGINX_CONF" << NGINXEOF
# Vital Sign · Ops — Nginx config (generated by setup-aws.sh)
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Allow large file uploads (attachments)
    client_max_body_size 50M;

    location / {
        proxy_pass          http://127.0.0.1:${APP_PORT};
        proxy_http_version  1.1;
        proxy_set_header    Upgrade           \$http_upgrade;
        proxy_set_header    Connection        'upgrade';
        proxy_set_header    Host              \$host;
        proxy_set_header    X-Real-IP         \$remote_addr;
        proxy_set_header    X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto \$scheme;
        proxy_cache_bypass  \$http_upgrade;
        proxy_read_timeout  120s;
        proxy_send_timeout  120s;
    }
}
NGINXEOF

  ln -sf "$NGINX_CONF" "$NGINX_ENABLED"
  nginx -t && systemctl reload nginx
  ok "Nginx configured for ${DOMAIN}"

  # Let's Encrypt SSL
  log "Obtaining SSL certificate (Let's Encrypt) for ${DOMAIN}…"
  if certbot --nginx -d "$DOMAIN" \
      --non-interactive --agree-tos \
      --email "$SSL_EMAIL" \
      --redirect 2>&1 | tail -5; then
    ok "SSL certificate installed — HTTPS enabled"
    NEXTAUTH_URL="https://${DOMAIN}"
    # Update the override with https URL
    sed -i "s|NEXTAUTH_URL:.*|NEXTAUTH_URL:                \"https://${DOMAIN}\"|g" \
      "$APP_DIR/docker-compose.override.yml"
    sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=\"https://${DOMAIN}\"|g" \
      "$APP_DIR/.env"
    # Auto-renew cron
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") \
      | sort -u | crontab -
    ok "Let's Encrypt auto-renewal cron registered"
  else
    warn "SSL certificate failed. Ensure DNS for ${DOMAIN} points to this server, then run:"
    warn "  certbot --nginx -d ${DOMAIN} --email ${SSL_EMAIL}"
  fi
else
  warn "No domain provided — skipping Nginx & SSL setup."
  warn "App is accessible at: ${NEXTAUTH_URL}"
fi

# ── 9. Firewall ───────────────────────────────────────────────────────────────
banner "Configuring Firewall"

if command -v ufw &>/dev/null; then
  ufw --force enable
  ufw allow ssh       comment "SSH"
  ufw allow 80/tcp    comment "HTTP"
  ufw allow 443/tcp   comment "HTTPS"
  [[ -z "$DOMAIN" ]] && ufw allow "${APP_PORT}/tcp" comment "App direct"
  ufw reload
  ok "UFW firewall configured"
elif command -v iptables &>/dev/null; then
  iptables -I INPUT -p tcp --dport 22  -j ACCEPT
  iptables -I INPUT -p tcp --dport 80  -j ACCEPT
  iptables -I INPUT -p tcp --dport 443 -j ACCEPT
  [[ -z "$DOMAIN" ]] && iptables -I INPUT -p tcp --dport "$APP_PORT" -j ACCEPT
  ok "iptables rules added"
else
  warn "No firewall tool found — configure your AWS Security Group manually"
fi

# ── 10. Systemd service (auto-start on reboot) ───────────────────────────────
banner "Registering Systemd Service"

cat > /etc/systemd/system/vitalsign.service << UNITEOF
[Unit]
Description=Vital Sign Ops (Docker Compose)
Documentation=https://github.com/melvin-akino/sales-order-inventory-accounting-lease-pms
After=docker.service network-online.target
Requires=docker.service
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${APP_DIR}
ExecStartPre=/usr/bin/docker compose pull --ignore-pull-failures
ExecStart=/usr/bin/docker compose up -d --remove-orphans
ExecStop=/usr/bin/docker compose down
ExecReload=/usr/bin/docker compose restart app
TimeoutStartSec=600
TimeoutStopSec=60
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
UNITEOF

systemctl daemon-reload
systemctl enable vitalsign.service
ok "vitalsign.service enabled (auto-starts on reboot)"

# ── 11. Save credentials ──────────────────────────────────────────────────────
banner "Saving Credentials"

cat > "$CREDS_FILE" << CREDSEOF
╔══════════════════════════════════════════════════════════════════════════════╗
║           Vital Sign · Ops — Deployment Credentials                        ║
║           Generated: $(date)
╚══════════════════════════════════════════════════════════════════════════════╝

APPLICATION
  URL:               ${NEXTAUTH_URL}
  Directory:         ${APP_DIR}
  Logs:              docker compose -C ${APP_DIR} logs -f app
  Restart:           docker compose -C ${APP_DIR} restart app
  Stop:              docker compose -C ${APP_DIR} down

DATABASE (PostgreSQL — internal Docker network only)
  Host:              db
  Port:              5432
  Database:          vitalsign
  Username:          postgres
  Password:          ${DB_PASSWORD}
  Connection string: postgresql://postgres:${DB_PASSWORD}@db:5432/vitalsign

NEXTAUTH
  Secret:            ${NEXTAUTH_SECRET}
  URL:               ${NEXTAUTH_URL}

SEEDED LOGIN ACCOUNTS (all use password: password123)
  Admin:             admin@medisupply.ph        / password123   (role: ADMIN)
  Finance:           finance@medisupply.ph      / password123   (role: FINANCE)
  Agent:             agent@medisupply.ph        / password123   (role: AGENT)
  Warehouse:         warehouse@medisupply.ph    / password123   (role: WAREHOUSE)
  Technician:        tech@medisupply.ph         / password123   (role: TECHNICIAN)
  Driver:            driver@medisupply.ph       / password123   (role: DRIVER)
  Customer:          procurement@stlukes.com.ph / password123   (role: CUSTOMER)

ORGANISATION BRANDING
  Name:              ${ORG_NAME}
  Tagline:           ${ORG_TAGLINE}
  Address:           ${ORG_ADDRESS}
  Phone:             ${ORG_PHONE}
  Email:             ${ORG_EMAIL}
  TIN:               ${ORG_TIN}
  Website:           ${ORG_WEBSITE}
  Color:             ${ORG_COLOR}

AWS SECURITY GROUP — ensure these inbound rules exist:
  Port 22   (SSH)  — your IP
  Port 80   (HTTP) — 0.0.0.0/0
  Port 443  (HTTPS)— 0.0.0.0/0
$([ -z "$DOMAIN" ] && echo "  Port ${APP_PORT} (App) — 0.0.0.0/0")

USEFUL COMMANDS
  View logs:         docker compose -C ${APP_DIR} logs -f
  Restart app:       docker compose -C ${APP_DIR} restart app
  Full restart:      systemctl restart vitalsign
  Update app:        cd ${APP_DIR} && git pull && docker compose up -d --build app
  Backup DB:         docker exec vitalsign-db pg_dump -U postgres vitalsign > backup.sql
  Restore DB:        docker exec -i vitalsign-db psql -U postgres vitalsign < backup.sql

⚠  SECURITY: This file contains plain-text credentials.
   Store them in a secrets manager and delete this file.
   rm -f ${CREDS_FILE}
CREDSEOF

chmod 600 "$CREDS_FILE"
ok "Credentials saved → $CREDS_FILE (chmod 600)"

# ── Final summary ─────────────────────────────────────────────────────────────

echo -e "\n${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║                  🎉  Setup complete!                        ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  ${CYAN}${BOLD}Application URL:${NC}   ${NEXTAUTH_URL}"
echo ""
echo -e "  ${CYAN}${BOLD}Login accounts${NC} (all password: ${YELLOW}password123${NC})"
echo -e "    Admin     →  admin@medisupply.ph"
echo -e "    Finance   →  finance@medisupply.ph"
echo -e "    Warehouse →  warehouse@medisupply.ph"
echo ""
echo -e "  ${CYAN}${BOLD}Database password:${NC} ${YELLOW}${DB_PASSWORD}${NC}"
echo -e "  ${CYAN}${BOLD}Credentials file:${NC}  ${CREDS_FILE}"
echo ""
echo -e "  ${YELLOW}${BOLD}⚠  AWS Security Group must allow:${NC}"
echo -e "     Port 22 (SSH), 80 (HTTP), 443 (HTTPS)"
[[ -z "$DOMAIN" ]] && echo -e "     Port ${APP_PORT} (direct app access)"
echo ""
echo -e "  ${CYAN}Useful commands:${NC}"
echo -e "    docker compose -C ${APP_DIR} logs -f app        # live logs"
echo -e "    docker compose -C ${APP_DIR} restart app        # restart app"
echo -e "    systemctl restart vitalsign                      # full restart"
echo -e "    cat ${CREDS_FILE}                               # view credentials"
echo ""
