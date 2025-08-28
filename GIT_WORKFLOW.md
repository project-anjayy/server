# Git Workflow Guide - Sports Event Platform

## 🌟 Alur Kerja Git untuk Tim

### Struktur Branch:
- `main` - Production ready code
- `development` - Integration branch untuk semua fitur
- `feat/nama-fitur` - Branch untuk mengembangkan fitur spesifik

---

## � PENTING: Workflow Branch yang Benar

### Urutan Branch:
1. `main` → Branch utama (production)
2. `development` → **HARUS** di-merge dari `initial-commit` dulu
3. `initial-commit` → Berisi struktur project lengkap
4. `feat/nama-fitur` → Branch fitur individual

### ⚠️ SEBELUM MULAI DEVELOPMENT:
**Pastikan `development` sudah berisi initial commit!**

```bash
# Cek apakah development sudah berisi file project
git checkout development
git pull origin development
ls -la  # Harus ada folder src/, package.json, etc

# Jika development masih kosong, minta team lead untuk:
# git merge initial-commit
# git push origin development
```

---

## 🤖 AI PROMPTS untuk Menghindari Conflict

### 🔑 Untuk Fitur LOGIN:
```
Saya sedang mengerjakan proyek Sports Event Platform dalam tim. Saya bertanggung jawab untuk fitur LOGIN saja.

KONTEKS PROJECT:
- Tech stack: React (client) + Node.js/Express (server)  
- Structure: /client dan /server folder terpisah
- Database: PostgreSQL dengan JWT authentication

TANGGUNG JAWAB SAYA (LOGIN):
- Frontend: src/pages/Login.jsx, src/components/LoginForm.jsx
- Backend: src/routes/auth.js (hanya endpoint POST /api/auth/login)
- Context: src/contexts/AuthContext.jsx (hanya fungsi login)
- Service: src/services/api.js (hanya authService.login function)

FILE YANG TIDAK BOLEH SAYA SENTUH (dikerjakan orang lain):
- src/pages/Register.jsx 
- src/components/RegisterForm.jsx
- Endpoint POST /api/auth/register
- authService.register function
- Fungsi register di AuthContext

INSTRUKSI:
1. Hanya generate code untuk fitur LOGIN
2. Jangan buat code untuk register/signup
3. Gunakan placeholder comment untuk fungsi register: // TODO: Register function (handled by other team member)
4. Fokus pada: form validation, API integration, error handling untuk login
5. Gunakan TailwindCSS untuk styling
6. Implementasi JWT token handling setelah login berhasil

Tolong bantu saya implement fitur login yang tidak akan conflict dengan anggota tim lain.
```

### 📝 Untuk Fitur REGISTER:
```
Saya sedang mengerjakan proyek Sports Event Platform dalam tim. Saya bertanggung jawab untuk fitur REGISTER saja.

KONTEKS PROJECT:
- Tech stack: React (client) + Node.js/Express (server)
- Structure: /client dan /server folder terpisah  
- Database: PostgreSQL dengan JWT authentication

TANGGUNG JAWAB SAYA (REGISTER):
- Frontend: src/pages/Register.jsx, src/components/RegisterForm.jsx
- Backend: src/routes/auth.js (hanya endpoint POST /api/auth/register)
- Context: src/contexts/AuthContext.jsx (hanya fungsi register)
- Service: src/services/api.js (hanya authService.register function)

FILE YANG TIDAK BOLEH SAYA SENTUH (dikerjakan orang lain):
- src/pages/Login.jsx
- src/components/LoginForm.jsx  
- Endpoint POST /api/auth/login
- authService.login function
- Fungsi login di AuthContext

INSTRUKSI:
1. Hanya generate code untuk fitur REGISTER
2. Jangan buat code untuk login/signin
3. Gunakan placeholder comment untuk fungsi login: // TODO: Login function (handled by other team member)
4. Fokus pada: form validation, password confirmation, API integration, error handling untuk register
5. Gunakan TailwindCSS untuk styling
6. Implementasi auto-login setelah register berhasil (JWT token handling)

Tolong bantu saya implement fitur register yang tidak akan conflict dengan anggota tim lain.
```

### 📋 Untuk Fitur EVENT LIST:
```
Saya sedang mengerjakan proyek Sports Event Platform dalam tim. Saya bertanggung jawab untuk fitur EVENT LIST saja.

KONTEKS PROJECT:
- Tech stack: React (client) + Node.js/Express (server)
- Structure: /client dan /server folder terpisah
- Database: PostgreSQL

TANGGUNG JAWAB SAYA (EVENT LIST):
- Frontend: src/pages/Events.jsx, src/components/EventCard.jsx, src/components/EventFilter.jsx
- Backend: src/routes/events.js (hanya endpoint GET /api/events dengan query filters)
- Service: src/services/api.js (hanya eventService.getEvents function)

FILE YANG TIDAK BOLEH SAYA SENTUH (dikerjakan orang lain):
- src/pages/EventDetail.jsx
- src/pages/Login.jsx, src/pages/Register.jsx
- POST/PUT/DELETE endpoints untuk events
- RSVP related functions

INSTRUKSI:
1. Hanya generate code untuk menampilkan daftar events
2. Implementasi filtering by category (soccer, basketball, running)
3. Implementasi search by location
4. Gunakan placeholder untuk fitur lain: // TODO: RSVP function (handled by other team member)
5. Fokus pada: responsive grid layout, filtering, search, loading states
6. Gunakan TailwindCSS untuk styling

Tolong bantu saya implement fitur event list yang tidak akan conflict dengan anggota tim lain.
```

### 🎯 GENERAL RULES untuk SEMUA ANGGOTA TIM:
**Sebelum minta AI generate code, selalu mention:**
1. "Saya hanya bertanggung jawab untuk fitur [NAMA_FITUR]"
2. "Jangan generate code untuk fitur lain yang dikerjakan tim member lain"
3. "Gunakan TODO comments untuk fitur yang dikerjakan orang lain"
4. "Fokus hanya pada file-file yang menjadi tanggung jawab saya"

---

## �📋 Setup Awal untuk Anggota Tim

### 1. Clone Repository

**Server Repository:**
```bash
git clone https://github.com/project-anjayy/server.git
cd server
```

**Client Repository:**
```bash
git clone https://github.com/project-anjayy/client.git
cd client
```

### 2. Setup Branch Tracking
```bash
# Pastikan di branch development
git checkout development
git pull origin development

# Verify branch structure
git branch -a
```

---

## 🚀 Workflow untuk Setiap Fitur

### Step 1: Buat Branch Fitur Baru
```bash
# Pastikan di branch development dan update
git checkout development
git pull origin development

# Buat branch fitur baru
git checkout -b feat/nama-fitur
# Contoh: git checkout -b feat/login
# Contoh: git checkout -b feat/event-list
# Contoh: git checkout -b feat/rsvp-system
```

### Step 2: Kerjakan Fitur
```bash
# Coding...
# Edit files, tambah fitur, dll

# Check status
git status

# Add files yang sudah diubah
git add .
# atau spesifik file: git add src/components/Login.jsx

# Commit dengan pesan yang jelas
git commit -m "feat: implement user login functionality

- Add login form component
- Add login API endpoint
- Add JWT token handling
- Add error handling for invalid credentials"
```

### Step 3: Push Branch Fitur
```bash
# Push branch fitur ke remote
git push -u origin feat/nama-fitur
```

### Step 4: Buat Pull Request
1. Buka GitHub repository
2. Klik "Compare & pull request"
3. **Base branch: `development`** ← **Compare branch: `feat/nama-fitur`**
4. Tulis deskripsi yang jelas
5. Request review dari anggota tim
6. Assign reviewer

### Step 5: Merge ke Development
Setelah review dan approval:
1. Merge pull request ke `development`
2. Delete branch fitur di GitHub
3. Delete branch lokal:

```bash
# Kembali ke development
git checkout development
git pull origin development
```

---

## 🔄 Contoh Alur Lengkap

### Contoh: Mengerjakan Fitur Login

```bash
# 1. Update development
git checkout development
git pull origin development

# 2. Buat branch fitur
git checkout -b feat/login

# 3. Kerjakan fitur login
# ... edit files ...

# 4. Commit
git add .
git commit -m "feat: implement login system

- Add login form with validation
- Add login API integration
- Add authentication context
- Add protected route handling"

# 5. Push
git push -u origin feat/login

# 6. Buat PR di GitHub: feat/login → development
# 7. Review & merge
# 8. Cleanup
git checkout development
git pull origin development
git branch -d feat/login
```

---

## 📝 Penamaan Branch yang Konsisten

### Format: `type/description`

**Types:**
- `feat/` - Fitur baru (feat/login, feat/event-list)
- `fix/` - Bug fix (fix/login-error, fix/socket-connection)
- `docs/` - Dokumentasi (docs/api-documentation)
- `style/` - Styling/UI (style/responsive-design)
- `refactor/` - Refactor code (refactor/auth-service)

**Contoh Branch Names:**
- `feat/user-registration`
- `feat/event-discovery`
- `feat/rsvp-system`
- `feat/real-time-notifications`
- `feat/ai-recommendations`
- `feat/feedback-rating`
- `fix/socket-disconnect`
- `style/mobile-responsive`

---

## 💡 Best Practices

### Commit Messages
```bash
# ✅ Good
git commit -m "feat: add user authentication

- Implement login/register endpoints
- Add JWT token generation
- Add password hashing with bcrypt
- Add input validation"

# ❌ Bad
git commit -m "login stuff"
git commit -m "fix"
git commit -m "update"
```

### Before Starting Work
```bash
# Selalu update development sebelum buat branch baru
git checkout development
git pull origin development
git checkout -b feat/new-feature
```

### Resolve Conflicts
Jika ada conflict saat merge:
```bash
# Update branch dengan latest development
git checkout development
git pull origin development
git checkout feat/your-feature
git merge development

# Resolve conflicts manually
# Commit resolved conflicts
git add .
git commit -m "resolve: merge conflicts with development"
git push origin feat/your-feature
```

---

## 🎯 Pembagian Fitur untuk Tim

### Frontend (Client)
- `feat/auth-pages` - Login/Register pages
- `feat/event-list` - Event discovery & filtering
- `feat/event-detail` - Event detail & RSVP
- `feat/user-dashboard` - User profile & joined events
- `feat/ai-chat` - AI recommendation chat
- `feat/real-time-ui` - Socket.IO integration
- `feat/responsive-design` - Mobile responsive

### Backend (Server)
- `feat/auth-api` - Authentication endpoints
- `feat/event-api` - Event CRUD endpoints
- `feat/rsvp-api` - RSVP system
- `feat/feedback-api` - Rating & feedback
- `feat/socket-handlers` - Real-time features
- `feat/ai-integration` - OpenAI integration
- `feat/database-setup` - PostgreSQL setup

---

## 🚨 Rules & Guidelines

1. **NEVER push directly to `main` or `development`**
2. **Always create PR for review**
3. **Update development before creating new branch**
4. **Write descriptive commit messages**
5. **Test your code before committing**
6. **Keep branches focused on single feature**
7. **Delete merged branches**

---

## 📞 Troubleshooting

### Forgot to create branch from development
```bash
# If you already made changes on development
git stash
git checkout -b feat/your-feature
git stash pop
```

### Need to switch branch with uncommitted changes
```bash
git stash
git checkout other-branch
# Later when you come back
git checkout your-branch
git stash pop
```

### Update forked repository
```bash
git remote add upstream https://github.com/project-anjayy/server.git
git fetch upstream
git checkout development
git merge upstream/development
git push origin development
```
