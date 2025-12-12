# 🚀 Deployment Guide

Quick guide to deploy your Meal Booking System to production.

## Vercel (⭐ Recommended - Zero Configuration)

Vercel is the easiest and most reliable option with perfect client-side routing support.

### Prerequisites
- GitHub account
- Vercel account (free tier available)
- Supabase project set up

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/meal-booking-system.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click **"Add New..." → "Project"**
   - Select your `meal-booking-system` repository
   - Vercel will auto-detect it's a Vite project ✅

3. **Add Environment Variables**
   
   In Vercel dashboard: `Settings > Environment Variables`
   
   Add these variables for **Production**, **Preview**, and **Development**:
   - `VITE_SUPABASE_URL` → Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → Your Supabase anon key
   - `VITE_COMPANY_DOMAIN` → Your company domain (e.g., `company.com`)

4. **Deploy**
   
   Click **Deploy**! 🚀
   
   Your app will be live at: `https://meal-booking-system.vercel.app`
   
   **Automatic Deployments:**
   - Every push to `main` → Production deployment
   - Every pull request → Preview deployment with unique URL

### CLI Deployment (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

---

## GitHub Pages

### Prerequisites
- GitHub account
- Supabase project set up

### Configuration Changes Required

**Important:** The current codebase is configured for Vercel. To deploy to GitHub Pages, you need to:

1. **Update `vite.config.js`:**
   ```javascript
   export default defineConfig({
     plugins: [react()],
     base: '/meal-booking-system/', // Add this line
     build: {
       outDir: 'dist',
       assetsDir: 'assets',
       sourcemap: false,
     },
   })
   ```

2. **Update `src/App.jsx`:**
   ```javascript
   <Router basename="/meal-booking-system">
   ```

3. **Create `public/404.html`** for client-side routing support

4. **Add redirect script to `index.html`** (see GitHub Pages SPA guide)

### Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Configure for GitHub Pages"
   git push origin main
   ```

2. **Configure GitHub Secrets**
   
   Go to: `Settings > Secrets and variables > Actions > New repository secret`
   
   Add these secrets:
   - `VITE_SUPABASE_URL` → Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → Your Supabase anon key
   - `VITE_COMPANY_DOMAIN` → Your company domain

3. **Create GitHub Actions Workflow**
   
   Create `.github/workflows/deploy.yml` with build and deploy steps

4. **Enable GitHub Pages**
   
   Go to: `Settings > Pages`
   - Source: `GitHub Actions`
   - Save

5. **Deploy**
   
   Push to main branch:
   ```bash
   git push origin main
   ```
   
   Your app will be live at: `https://yourusername.github.io/meal-booking-system`

---

### Steps

1. **Push to GitLab**
   ```bash
   git remote add origin https://gitlab.com/yourusername/meal-booking-system.git
   git push -u origin main
   ```

2. **Configure CI/CD Variables**
   
   Go to: `Settings > CI/CD > Variables`
   
   Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_COMPANY_DOMAIN`

3. **Deploy**
   
   The `.gitlab-ci.yml` file handles deployment automatically.
   
   Your app will be live at: `https://yourusername.gitlab.io/meal-booking-system`

---

## Netlify

### Steps

1. **Push to GitHub** (see above)

2. **Import to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site"
   - Import from GitHub
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Add Environment Variables**
   
   In Netlify project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_COMPANY_DOMAIN`

4. **Deploy**
   
   Click Deploy!
   
   Your app will be live at: `https://your-project.netlify.app`

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] `.env` is in `.gitignore`
- [ ] No hardcoded credentials in code
- [ ] Supabase RLS policies are enabled
- [ ] Storage bucket policies are configured
- [ ] Email verification enabled (optional)
- [ ] CORS configured in Supabase
- [ ] SSL/HTTPS enabled (automatic with all platforms above)

---

## 🌐 Custom Domain

### GitHub Pages
1. Go to `Settings > Pages`
2. Add your custom domain
3. Update DNS records

### Vercel/Netlify
1. Go to project settings
2. Add custom domain
3. Follow DNS instructions

---

## 📊 Monitoring

### Check Deployment Status

**GitHub Pages:** Actions tab  
**Vercel:** Dashboard > Deployments  
**GitLab:** CI/CD > Pipelines  
**Netlify:** Deploys tab

### View Logs

All platforms provide real-time build logs for debugging.

---

## 🆘 Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify all secrets are added
- Check build logs for specific errors

### Blank Page After Deploy
- Check browser console for errors
- Verify Supabase URL and key are correct
- Check CORS settings in Supabase

### 404 on Refresh
- **Vercel:** Already handled by `vercel.json` ✅
- **Netlify:** Add `netlify.toml` with rewrites
- **GitHub Pages:** Requires `404.html` and redirect script

---

## 🎯 Recommended for Different Use Cases

- **Production app (best choice):** ⭐ **Vercel** - Zero config, perfect routing
- **Quick prototype:** Netlify or GitHub Pages  
- **Enterprise/self-hosted:** Custom server or Docker
- **Team with existing GitLab:** GitLab Pages

---

Happy deploying! 🚀

Need help? Check the main README or open an issue.

---

**Created by:** Arpan Roy

