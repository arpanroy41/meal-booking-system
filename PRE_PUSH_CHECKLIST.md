# ✅ Pre-Push Checklist for GitHub

Complete this checklist before pushing to GitHub to ensure security and quality.

## 🔒 Security Check

- [x] `.env` file is in `.gitignore`
- [x] No API keys or secrets in code
- [x] All credentials use environment variables
- [x] `.env.example` has placeholder values only
- [ ] Verified `.env` is NOT in git status

**Run this command to verify:**
```bash
git status
```
Make sure `.env` is NOT listed!

---

## 📁 Files Updated for GitHub

### New Files Created:
1. ✅ `CONTRIBUTING.md` - Contribution guidelines
2. ✅ `DEPLOYMENT.md` - Deployment instructions
3. ✅ `.github/workflows/deploy.yml` - GitHub Actions CI/CD
4. ✅ `.env.example` - Enhanced with documentation

### Files Updated:
1. ✅ `README.md` - Added GitHub-specific instructions
2. ✅ `.gitignore` - Enhanced with extra protections

---

## 🚀 Ready to Push?

### Step 1: Verify No Sensitive Data

```bash
# Check what will be committed
git status

# Verify .env is NOT in the list
# Verify only source code and config files are shown
```

### Step 2: Initialize Git (if not done)

```bash
cd /Users/arproy/Projects/meal-booking-system
git init
git branch -M main
```

### Step 3: Stage All Files

```bash
git add .
```

### Step 4: Final Check

```bash
# See what will be committed
git status

# Review the changes
git diff --cached
```

### Step 5: Commit

```bash
git commit -m "Initial commit: Meal Booking System

- Complete meal booking system with React & Supabase
- Role-based access (Employee, Admin, Vendor)
- PatternFly UI components
- Real-time booking updates
- Payment screenshot upload
- Admin approval workflow
- Vendor meal management
- Mobile responsive design"
```

### Step 6: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `meal-booking-system`
3. Description: "🍽️ A modern meal booking system for office cafeterias"
4. **IMPORTANT:** Choose "Public" or "Private"
5. **DO NOT** initialize with README (you already have one)
6. Click "Create repository"

### Step 7: Push to GitHub

```bash
# Replace 'yourusername' with your GitHub username
git remote add origin https://github.com/yourusername/meal-booking-system.git
git push -u origin main
```

### Step 8: Configure GitHub Secrets

Go to: `Settings > Secrets and variables > Actions`

Add these secrets:
- `VITE_SUPABASE_URL` → Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` → Your Supabase anon key  
- `VITE_COMPANY_DOMAIN` → Your company domain

### Step 9: Enable GitHub Pages

Go to: `Settings > Pages`
- Source: `GitHub Actions`
- Save

### Step 10: Deploy! 🚀

```bash
# Any push to main will auto-deploy
git push origin main
```

Check the "Actions" tab to see deployment progress!

---

## 📊 What Will Be Public on GitHub?

### ✅ SAFE (will be pushed):
- Source code (.jsx, .js files)
- Configuration files (package.json, vite.config.js)
- Database schema (supabase-schema.sql)
- Documentation (README.md, guides)
- GitIgnore file
- License file
- GitHub Actions workflow

### ❌ PROTECTED (will NOT be pushed):
- `.env` file (your Supabase credentials)
- `node_modules/` directory
- `dist/` build output
- `.DS_Store` and other OS files
- Any `.key`, `.pem`, `.p12` files

---

## 🎯 After Pushing

1. ✅ Check your repository on GitHub
2. ✅ Verify `.env` is NOT visible
3. ✅ Read the Actions tab for deployment
4. ✅ Visit your deployed site
5. ✅ Test login and functionality
6. ✅ Share with your team!

---

## 🆘 Emergency: Accidentally Pushed .env?

If you accidentally committed .env:

```bash
# Remove from git history
git rm .env --cached
git commit -m "Remove .env from tracking"
git push origin main

# IMPORTANT: Rotate your Supabase keys immediately!
# Go to Supabase Dashboard > Settings > API > Reset keys
```

---

## 📝 Optional: Add a LICENSE

If you want to make it open source, add a license:

```bash
# MIT License is common for open source projects
# GitHub will help you choose when creating the repo
```

---

## 🎉 You're Ready!

Everything is set up for a secure GitHub push. Your sensitive data is protected, and your code is ready to share with the world (or your team)!

**Questions?** Check the main README.md or DEPLOYMENT.md

Good luck! 🚀

---

**Guide by:** Arpan Roy

