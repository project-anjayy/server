# 🚀 Deployment Guide - Sports Event Platform

## Prerequisites
- Node.js 18+ 
- npm atau yarn
- Supabase account dan database
- OpenAI API key (untuk AI features)

## 📋 Step-by-Step Deployment

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd server
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.production .env

# Edit .env dengan values yang sebenarnya:
# - DATABASE_URL dari Supabase
# - JWT_SECRET (buat random string yang kuat)
# - OPENAI_API_KEY
# - CLIENT_URL (URL frontend Anda)
```

### 3. Database Setup
```bash
# Run migrations ke Supabase
npm run migrate

# Optional: Run seeds jika ada
npm run seed
```

### 4. Start Production Server
```bash
npm start
```

## 🌐 Platform Deployment Options

### Option 1: Railway
1. Connect your GitHub repo
2. Set environment variables di Railway dashboard
3. Deploy otomatis

### Option 2: Render
1. Connect GitHub repo
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables

### Option 3: Heroku
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set OPENAI_API_KEY=your-key
git push heroku main
```

### Option 4: VPS/DigitalOcean
```bash
# Di server
git clone <repo>
cd server
npm install
cp .env.production .env
# Edit .env dengan values yang benar
npm run migrate
pm2 start src/index.js --name sports-api
```

## 🗄️ Supabase Setup

1. Buat project di [supabase.com](https://supabase.com)
2. Ambil DATABASE_URL dari Settings > Database
3. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

## ⚡ Environment Variables Required

```bash
# Essential
DATABASE_URL=your_supabase_url
JWT_SECRET=your_secret_key
NODE_ENV=production

# Optional
PORT=3001
OPENAI_API_KEY=your_openai_key
CLIENT_URL=https://your-frontend.com
```

## 🔍 Health Check

Setelah deploy, test endpoints:
- `GET /` - Basic info
- `GET /api/health` - Health status  
- `GET /api/test-db` - Database connection

## 🛠️ Troubleshooting

### Database Connection Issues
- Check DATABASE_URL format
- Verify Supabase credentials
- Ensure SSL is enabled for production

### Migration Issues
```bash
# Check migration status
npm run migrate -- --env production

# Rollback if needed  
npm run migrate:undo
```

### Port Issues
- Ensure PORT environment variable is set
- Check platform-specific port requirements

## 📈 Monitoring
- Check logs dengan `heroku logs --tail` atau platform equivalent
- Monitor database performance di Supabase dashboard
- Set up error tracking (Sentry, LogRocket, etc.)
