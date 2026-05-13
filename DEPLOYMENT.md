# Vital Sign · Ops — AWS Deployment Guide

> **One-stop setup script:** `setup-aws.sh` handles everything after your EC2 instance is running.  
> This guide walks you through creating that instance from scratch.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| AWS account | [Sign up free](https://aws.amazon.com/free/) |
| IAM user with EC2 permissions | Or use root (not recommended for production) |
| Key pair (.pem file) | Created in step 2 below |
| Domain name | Optional — required only for HTTPS/SSL |

---

## Step 1 — Sign in and choose a region

1. Go to **https://console.aws.amazon.com**
2. Sign in with your AWS account
3. In the top-right corner, click the **region selector** (e.g., `US East (N. Virginia)`)
4. Choose the region closest to your users

   > **Philippines recommendation:** `ap-southeast-1` (Singapore) — lowest latency from PH

---

## Step 2 — Create a Key Pair (one-time setup)

You need this to SSH into the instance. Skip if you already have one.

1. In the AWS Console search bar, type **EC2** and click it
2. In the left sidebar, under **Network & Security**, click **Key Pairs**
3. Click **Create key pair** (top right)
4. Fill in:
   - **Name:** `vitalsign-key`
   - **Key pair type:** RSA
   - **Private key file format:** `.pem` (Mac/Linux) or `.ppk` (Windows/PuTTY)
5. Click **Create key pair**
6. Your browser will automatically download `vitalsign-key.pem`

   > ⚠️ **Keep this file safe.** You cannot download it again. If lost, create a new key pair.

7. On Mac/Linux, set correct permissions:
   ```bash
   chmod 400 ~/Downloads/vitalsign-key.pem
   ```

---

## Step 3 — Create a Security Group

A security group is a virtual firewall. Create a dedicated one for the app.

1. In the EC2 Console left sidebar, under **Network & Security**, click **Security Groups**
2. Click **Create security group** (top right)
3. Fill in:
   - **Security group name:** `vitalsign-sg`
   - **Description:** `Vital Sign Ops firewall rules`
   - **VPC:** leave as default

4. Under **Inbound rules**, click **Add rule** and add these 4 rules:

   | Type | Protocol | Port | Source | Description |
   |---|---|---|---|---|
   | SSH | TCP | 22 | My IP | SSH admin access |
   | HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
   | HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic |
   | Custom TCP | TCP | 3000 | 0.0.0.0/0 | Direct app (no domain) |

   > **Note:** Port 3000 is only needed if you're accessing the app directly without a domain/Nginx.  
   > Once Nginx is configured, you can remove port 3000.

5. Leave **Outbound rules** as default (allow all)
6. Click **Create security group**
7. Note the **Security group ID** (e.g., `sg-0abc123def456`) — you'll need it later

---

## Step 4 — Launch the EC2 Instance

1. In the EC2 Console left sidebar, click **Instances**
2. Click **Launch instances** (top right, orange button)

### 4a — Name and tags
- **Name:** `vitalsign-ops`

### 4b — Application and OS Images (AMI)
- Click **Ubuntu**
- Select **Ubuntu Server 22.04 LTS (HVM), SSD Volume Type**
- Architecture: **64-bit (x86)**

   > Amazon Linux 2 also works. Ubuntu 22.04 is recommended for best compatibility.

### 4c — Instance type
Select based on expected load:

| Usage | Instance type | vCPU | RAM | Cost (ap-southeast-1) |
|---|---|---|---|---|
| Testing / low traffic | `t3.medium` | 2 | 4 GB | ~$0.052/hr |
| Production (small) | `t3.large` | 2 | 8 GB | ~$0.104/hr |
| Production (medium) | `t3.xlarge` | 4 | 16 GB | ~$0.208/hr |

> **Minimum:** `t3.medium` — Docker build requires at least 3 GB RAM

### 4d — Key pair
- Under **Key pair (login)**, select `vitalsign-key` (created in Step 2)

### 4e — Network settings
- Click **Edit**
- **VPC:** leave as default
- **Subnet:** leave as default (or choose a specific AZ)
- **Auto-assign public IP:** `Enable`
- **Firewall (security groups):** Select **Select existing security group**
- From the dropdown, select `vitalsign-sg` (created in Step 3)

### 4f — Configure storage
- **Size:** `30 GiB` minimum (Docker images + DB data)
- **Volume type:** `gp3`
- Check **Encrypt this volume** (recommended for production)

### 4g — Summary and launch
- Review the summary on the right side
- Click **Launch instance**
- Wait ~30 seconds for the instance to appear in the Instances list

---

## Step 5 — Find your Instance's Public IP

1. Go to **EC2 → Instances**
2. Click on `vitalsign-ops` in the list
3. In the **Details** tab, note:
   - **Public IPv4 address** — e.g., `54.123.45.67`
   - **Public IPv4 DNS** — e.g., `ec2-54-123-45-67.ap-southeast-1.compute.amazonaws.com`

> If you're using a custom domain, point your DNS A record to this IP now (Step 6).  
> DNS propagation takes 5–30 minutes — do it before running the setup script.

---

## Step 6 — (Optional) Point your Domain to the Instance

If you have a domain (e.g., `ops.medisupply.ph`), configure DNS before running setup.

### At your DNS provider (GoDaddy, Namecheap, Cloudflare, etc.):

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `ops` (or `@`) | `54.123.45.67` (your EC2 IP) | 300 |

> **Cloudflare users:** Set the proxy status to **DNS only** (grey cloud) during setup.  
> You can enable the orange cloud (proxied) after SSL is working.

Verify DNS is live before running the script:
```bash
nslookup ops.medisupply.ph
# Should return your EC2 IP
```

---

## Step 7 — Connect to the Instance via SSH

Wait 1–2 minutes after launch for the instance to finish booting, then:

### Mac / Linux
```bash
ssh -i ~/Downloads/vitalsign-key.pem ubuntu@54.123.45.67
```

### Windows (Command Prompt / PowerShell)
```powershell
ssh -i C:\Users\YourName\Downloads\vitalsign-key.pem ubuntu@54.123.45.67
```

### Windows (PuTTY)
1. Open PuTTY
2. **Host Name:** `ubuntu@54.123.45.67`
3. **Port:** 22
4. In the left tree: **Connection → SSH → Auth → Credentials**
5. Browse to your `.ppk` file
6. Click **Open**

> **First connection:** Type `yes` when asked "Are you sure you want to continue connecting?"

You should see the Ubuntu welcome banner and a prompt like:
```
ubuntu@ip-172-31-xx-xx:~$
```

---

## Step 8 — Run the Setup Script

You are now inside the EC2 instance. Run the one-stop setup script:

```bash
curl -fsSL https://raw.githubusercontent.com/melvin-akino/sales-order-inventory-accounting-lease-pms/main/setup-aws.sh -o setup-aws.sh
sudo bash setup-aws.sh
```

### What you'll be prompted for:

```
? Domain / subdomain for Nginx + SSL (blank = IP-only) []: ops.medisupply.ph
? Email address for Let's Encrypt []: admin@medisupply.ph

? Organisation name [MediSupply PH]:
? Tagline [Medical Equipment & Supplies]:
? Address [3F Greenfield Tower, Mandaluyong City, Metro Manila 1550]:
? Phone [+63 2 8123 4567]:
? Email [info@medisupply.ph]:
? TIN [123-456-789-000]:
? Website [www.medisupply.ph]:
? Brand accent color [#003087]:
? RDO code [044]:
? ZIP / postal code [1550]:
```

> Press **Enter** to accept any default value shown in brackets.

### What happens next (automated):

```
━━━  Generating Credentials  ━━━
  ✔ DB password  : aB3xK9mQ... (auto-generated)
  ✔ NextAuth secret generated (base64)

━━━  Installing System Dependencies  ━━━
  ✔ Docker 25.x installed
  ✔ All system dependencies installed

━━━  Cloning Repository  ━━━
  ✔ Repository ready at /opt/vitalsign

━━━  Writing Environment Files  ━━━
  ✔ .env written (chmod 600)
  ✔ docker-compose.override.yml written

━━━  Building & Starting Application  ━━━
  ⏳ Waiting… 180s   ← Docker build takes 5–15 min
  ✔ Application container is healthy

━━━  Configuring Nginx + SSL  ━━━
  ✔ Nginx configured
  ✔ SSL certificate installed — HTTPS enabled

━━━  Registering Systemd Service  ━━━
  ✔ vitalsign.service enabled (auto-starts on reboot)

━━━  Saving Credentials  ━━━
  ✔ Credentials saved → /root/vitalsign-credentials.txt
```

**Total time:** 10–20 minutes (mostly Docker image building)

---

## Step 9 — Verify the Deployment

### Open the application
- **With domain:** `https://ops.medisupply.ph`
- **Without domain:** `http://54.123.45.67:3000`

You should see the Vital Sign · Ops login page.

### Test login
| Role | Email | Password |
|---|---|---|
| Admin | `admin@medisupply.ph` | `password123` |
| Finance | `finance@medisupply.ph` | `password123` |
| Warehouse | `warehouse@medisupply.ph` | `password123` |
| Agent | `agent@medisupply.ph` | `password123` |

### Verify containers are running (SSH)
```bash
docker ps
```
Expected output:
```
NAMES            STATUS
vitalsign-ops    Up 5 minutes (healthy)
vitalsign-db     Up 5 minutes (healthy)
```

### View live logs
```bash
docker compose -C /opt/vitalsign logs -f app
```

---

## Step 10 — Post-Deployment Checklist

### ✅ Security (do immediately)

1. **Change all default passwords** — log in as admin and change passwords for all seeded accounts
2. **Read and store credentials file**, then delete it:
   ```bash
   cat /root/vitalsign-credentials.txt
   # Copy all values to a password manager (1Password, Bitwarden, etc.)
   rm /root/vitalsign-credentials.txt
   ```
3. **Remove port 3000 from Security Group** if Nginx/domain is configured:
   - Go to EC2 → Security Groups → `vitalsign-sg` → Inbound rules → Edit
   - Delete the Port 3000 rule

4. **Restrict SSH to your IP only** (already done in Step 3 if you selected "My IP")

### ✅ Reliability

5. **Enable EC2 termination protection:**
   - EC2 → Instances → `vitalsign-ops` → Actions → Instance settings → Change termination protection → Enable

6. **Set up an Elastic IP** to keep the same IP if the instance restarts:
   - EC2 → Elastic IPs → Allocate Elastic IP address → Associate with `vitalsign-ops`

7. **Configure automated backups:**
   ```bash
   # Add to root crontab: daily DB backup to /opt/backups
   (sudo crontab -l 2>/dev/null; echo "0 2 * * * mkdir -p /opt/backups && docker exec vitalsign-db pg_dump -U postgres vitalsign | gzip > /opt/backups/vitalsign-\$(date +\%Y\%m\%d).sql.gz && find /opt/backups -mtime +7 -delete") | sudo sort -u | sudo crontab -
   ```

### ✅ Updates

8. **To update the application** (pull latest code and rebuild):
   ```bash
   cd /opt/vitalsign
   git pull
   docker compose up -d --build app
   ```

---

## Troubleshooting

### App is not accessible
```bash
# Check container status
docker ps -a

# Check app logs
docker compose -C /opt/vitalsign logs --tail=50 app

# Check Nginx status
sudo systemctl status nginx

# Check if port is listening
sudo ss -tlnp | grep -E '80|443|3000'
```

### Database migration failed
```bash
# Re-run migrations manually
docker compose -C /opt/vitalsign run --rm migrate

# Or exec into the migrate container
docker compose -C /opt/vitalsign run --rm migrate sh
```

### SSL certificate issues
```bash
# Test Nginx config
sudo nginx -t

# Re-run Certbot manually
sudo certbot --nginx -d ops.medisupply.ph --email admin@medisupply.ph

# Check certificate status
sudo certbot certificates
```

### Instance ran out of disk space
```bash
# Check disk usage
df -h

# Clean unused Docker images
docker system prune -f

# Check what's using space
du -sh /opt/vitalsign/* | sort -rh | head -20
```

### Forgot credentials
```bash
# If credentials file was not deleted yet
cat /root/vitalsign-credentials.txt

# If deleted, check the .env file
cat /opt/vitalsign/.env
```

---

## Cost Estimate (ap-southeast-1 / Singapore)

| Resource | Spec | Monthly cost |
|---|---|---|
| EC2 `t3.medium` | 2 vCPU, 4 GB | ~$37 |
| EC2 `t3.large` | 2 vCPU, 8 GB | ~$75 |
| EBS `gp3` 30 GB | Storage | ~$2.40 |
| Elastic IP (attached) | Fixed IP | Free |
| Data transfer (10 GB out) | Outbound | ~$0.90 |
| **Total (t3.medium)** | | **~$40/month** |

> 💡 **Save ~40%** with a 1-year Reserved Instance commitment.  
> 💡 Use a **t3.small** ($18/mo) for low-traffic internal deployments.
