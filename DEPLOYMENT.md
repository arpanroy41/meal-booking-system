# 🚀 Deployment Guide

Quick guide to deploy your Meal Booking System to production.

## GitHub Pages (Recommended for Simple Deployment)

### Prerequisites
- GitHub account
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

2. **Configure GitHub Secrets**
   
   Go to: `Settings > Secrets and variables > Actions > New repository secret`
   
   Add these secrets:
   - `VITE_SUPABASE_URL` → Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → Your Supabase anon key
   - `VITE_COMPANY_DOMAIN` → Your company domain (optional)

3. **Enable GitHub Pages**
   
   Go to: `Settings > Pages`
   - Source: `GitHub Actions`
   - Save

4. **Deploy**
   
   Push to main branch:
   ```bash
   git push origin main
   ```
   
   Check Actions tab for deployment progress.
   
   Your app will be live at: `https://yourusername.github.io/meal-booking-system`

---

## Vercel (Easiest - Recommended for Production)

### Steps

1. **Push to GitHub** (see above)

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite

3. **Add Environment Variables**
   
   In Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_COMPANY_DOMAIN`

4. **Deploy**
   
   Click Deploy! 🚀
   
   Your app will be live at: `https://your-project.vercel.app`
   
   **Bonus:** Vercel auto-deploys on every push to main!

---

## GitLab Pages

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
- GitHub Pages: Handled by `404.html` (already configured)
- Vercel: Add `vercel.json` with rewrites
- Netlify: Add `_redirects` file

---

## 🎯 Recommended for Different Use Cases

- **Quick prototype:** GitHub Pages
- **Production app:** Vercel or Netlify
- **Enterprise/self-hosted:** GitLab Pages or custom server
- **Team with CI/CD needs:** Any platform works!

---

Happy deploying! 🚀

Need help? Check the main README or open an issue.

---

**Created by:** Arpan Roy

