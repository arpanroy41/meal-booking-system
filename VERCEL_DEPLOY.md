# Vercel Deployment Quick Start

This project is configured for Vercel deployment with zero configuration needed.

## 🚀 Deploy in 3 Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Import to Vercel
- Go to [vercel.com](https://vercel.com)
- Sign in with GitHub
- Click "Add New..." → "Project"
- Import your repository
- Vercel auto-detects Vite ✅

### 3. Add Environment Variables
In Vercel Dashboard: **Settings > Environment Variables**

Add these for all environments (Production, Preview, Development):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_COMPANY_DOMAIN=yourcompany.com
```

Then click **Deploy**! 🎉

---

## ✨ What's Already Configured

✅ `vercel.json` - Handles client-side routing  
✅ `vite.config.js` - Optimized build settings  
✅ Clean URLs (no base path needed)  
✅ Environment variable placeholders

---

## 🔄 Automatic Deployments

- **Push to main** → Production deployment
- **Pull request** → Preview deployment with unique URL
- **No manual builds needed!**

---

## 📱 Your App Will Be Live At

```
https://meal-booking-system-<your-username>.vercel.app
```

Or add a custom domain in Vercel settings!

---

## 🆘 Need Help?

Check the full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Built with ❤️ by Arpan Roy**

