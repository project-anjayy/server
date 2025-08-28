# 🚀 AWS EC2 Deployment Guide - Sports Event Platform

## Prerequisites
- AWS EC2 instance (Ubuntu 20.04+ recommended)
- Node.js 18+ installed di EC2
- PM2 untuk process management
- Nginx untuk reverse proxy
- Supabase database
- Domain name (optional)

## 🖥️ EC2 Instance Setup

### 1. Launch EC2 Instance
```bash
# Instance recommendations:
# - t3.micro (1GB RAM) untuk testing
# - t3.small (2GB RAM) untuk production kecil
# - t3.medium+ untuk production dengan traffic tinggi
# - Ubuntu 22.04 LTS
```

### 2. Security Group Settings
```
Inbound Rules:
- SSH: Port 22 (dari IP Anda)
- HTTP: Port 80 (0.0.0.0/0)
- HTTPS: Port 443 (0.0.0.0/0)
- Custom: Port 3001 (untuk testing, nanti bisa dimatikan)
```

## 🔧 Server Setup

### 1. Connect ke EC2 & Update System
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update system
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install PM2
```bash
sudo npm install -g pm2
```

### 4. Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 📁 Deploy Your Application

### 1. Clone Repository
```bash
cd /home/ubuntu
git clone https://github.com/project-anjayy/server.git
cd server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
```bash
# Copy environment template
cp .env.production .env

# Edit environment variables
nano .env
```

**Fill in your .env:**
```bash
NODE_ENV=production
DATABASE_URL=your_supabase_database_url
JWT_SECRET=your_super_secret_jwt_key
PORT=3001
OPENAI_API_KEY=your_openai_api_key
CLIENT_URL=https://your-domain.com  # atau http://your-ec2-ip
```

### 4. Run Database Migrations
```bash
npm run migrate
```

### 5. Start with PM2
```bash
# Start aplikasi
pm2 start src/index.js --name "sports-api"

# Save PM2 config
pm2 save

# Setup PM2 startup script
pm2 startup
# Copy & paste command yang muncul, lalu jalankan
```

## 🌐 Nginx Configuration

### 1. Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/sports-api
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # ganti dengan domain Anda atau EC2 public IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Enable Site
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/sports-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 🔒 SSL Certificate (Optional but Recommended)

### Using Certbot (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal setup (already configured by default)
sudo systemctl status certbot.timer
```

## 🔄 Deployment Workflow

### 1. Create Update Script
```bash
nano /home/ubuntu/update-app.sh
```

```bash
#!/bin/bash
cd /home/ubuntu/server

echo "🔄 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Running migrations..."
npm run migrate

echo "🔄 Restarting application..."
pm2 restart sports-api

echo "✅ Deployment completed!"
pm2 status
```

```bash
chmod +x /home/ubuntu/update-app.sh
```

### 2. Deploy Updates
```bash
./update-app.sh
```

## 📊 Monitoring & Maintenance

### PM2 Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs sports-api

# Restart app
pm2 restart sports-api

# Stop app
pm2 stop sports-api

# Monitor resources
pm2 monit
```

### System Monitoring
```bash
# Check disk usage
df -h

# Check memory usage
free -m

# Check system processes
htop
```

### Log Management
```bash
# Setup log rotation for PM2
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## 🛡️ Security Best Practices

### 1. Firewall Setup
```bash
# Enable UFW
sudo ufw enable

# Allow necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS

# Check status
sudo ufw status
```

### 2. Disable Direct API Access
Setelah Nginx setup, block direct access ke port 3001:
```bash
sudo ufw deny 3001
```

### 3. Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
cd /home/ubuntu/server && npm audit fix
```

## 🔍 Troubleshooting

### Application Issues
```bash
# Check PM2 logs
pm2 logs sports-api --lines 100

# Restart application
pm2 restart sports-api

# Check if port is in use
sudo netstat -tulpn | grep :3001
```

### Database Issues
```bash
# Test database connection
npm run migrate -- --env production

# Check environment variables
cat .env
```

### Nginx Issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t
```

## 📋 Quick Deployment Checklist

- [ ] EC2 instance running
- [ ] Security group configured
- [ ] Node.js & PM2 installed
- [ ] Repository cloned
- [ ] .env configured with Supabase URL
- [ ] Database migrations run
- [ ] Application started with PM2
- [ ] Nginx configured & restarted
- [ ] SSL certificate installed (optional)
- [ ] Testing endpoints work

## 🌐 Access Your API

After successful deployment:
- **API Base URL:** `https://your-domain.com` or `http://your-ec2-ip`
- **Health Check:** `GET /api/health`
- **Test Database:** `GET /api/test-db`

Your Sports Event Platform API is now live on AWS EC2! 🎉
