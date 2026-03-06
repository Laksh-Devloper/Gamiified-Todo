# 🌸 Gamiified Todo — KimetsuTask Garden

> **Bloom Every Day. Slay Every Task.** ✨

A kawaii-themed, gamified anime todo app inspired by Demon Slayer. Complete missions, earn XP, level up, and maintain your daily streak — all wrapped in a beautiful pink & lavender aesthetic with falling sakura petals.

---

## ✨ Features

- 🔐 **Authentication** — Register / Login with JWT cookies
- 🎀 **Character Selection** — Choose Tanjiro, Nezuko, Zenitsu, or Inosuke as your avatar
- 📸 **Custom Avatar Upload** — Upload your own profile picture
- 🌱 **Gamified Todos** — Priorities: Sprout 🌱 · Blossom 🌸 · Star ⭐ · Epic 🦋
- ⭐ **XP & Leveling** — Earn XP for completing tasks; level up through 12 titles
- 🔥 **Real-time Streak** — Updates on login, dashboard load, AND task completion
- 🏅 **Achievements** — 6 unlockable badges: First Blossom, Rainbow Streak, and more
- 🌸 **Sakura Particles** — Animated falling petals on every page
- 💫 **Sparkle Animations** — Visual feedback on task completion & level up

---

## 🛠️ Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | Next.js 14 (App Router), TypeScript, CSS |
| Backend   | Node.js, Express, TypeScript |
| Database  | PostgreSQL (Neon / Render) |
| Auth      | JWT + httpOnly cookies |
| Fonts     | Nunito, Quicksand, Cinzel (Google Fonts) |

---

## 🚀 Local Setup

### 1. Clone & Install

```bash
git clone https://github.com/Laksh-Devloper/Gamiified-Todo.git
cd Gamiified-Todo

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in your DATABASE_URL, JWT_SECRET, etc.

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 3. Run

```bash
# Terminal 1 — Backend (port 5001)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

Open **http://localhost:3000** 🌸

---

## 🗄️ Database

Uses PostgreSQL. Recommended free options:
- **[Neon](https://neon.tech)** — Serverless Postgres (great for dev)
- **[Render](https://render.com)** — Managed Postgres (great for deployment)

The backend auto-creates tables on startup. No migrations needed!

---

## 🌐 Deployment (Render)

Uses `render.yaml` for one-click Blueprint deployment:

1. Push to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com) → New → Blueprint
3. Connect this repo
4. Set environment variables:
   - `JWT_SECRET` (generate a strong random string)
   - `DATABASE_URL` (auto-filled by Render's managed DB)

---

## 🎀 Level Titles

| Level | Title |
|-------|-------|
| 1  | Little Sprout 🌱 |
| 2  | Flower Bud 🌷 |
| 3  | Blooming 🌸 |
| 4  | Daydreamer 🌼 |
| 5  | Star Gazer ⭐ |
| 6  | Moon Dancer 🌙 |
| 7  | Rainbow Chaser 🌈 |
| 8  | Cloud Rider ☁️ |
| 9  | Dream Weaver 🦋 |
| 10 | Petal Master 🌺 |
| 11 | Sakura Queen 🌸 |
| 12 | Cosmic Star 💫 |

---

Made with 🌸 by Laksh
