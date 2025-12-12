# ⚡ Quick Start Guide

Get your Meal Booking System up and running in under 20 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works great!)
- A GitLab account (for deployment)

## Step 1: Clone & Install (2 minutes)

```bash
# Navigate to your projects folder
cd ~/Projects

# If you haven't cloned yet
git clone <your-repo-url>
cd meal-booking-system

# Install dependencies
npm install
```

## Step 2: Set Up Supabase (10 minutes)

### Create Project
1. Go to https://supabase.com
2. Create new project (wait 2-3 minutes for setup)
3. Go to SQL Editor
4. Copy & paste contents of `supabase-schema.sql`
5. Run the query

### Set Up Storage
1. Go to Storage
2. Create bucket named `bookings` (set to Private)
3. Add storage policies (see SETUP_GUIDE.md for details)

### Get Your Keys
1. Go to Settings > API
2. Copy `Project URL` and `anon public` key

## Step 3: Configure Environment (1 minute)

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your favorite editor
nano .env  # or vim, code, etc.
```

Add your values:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_COMPANY_DOMAIN=yourcompany.com
```

## Step 4: Run Locally (1 minute)

```bash
npm run dev
```

Visit http://localhost:5173

## Step 5: Create Your First Admin (3 minutes)

1. Click "Sign up" in the app
2. Create an account with your email
3. Go to Supabase Dashboard > Table Editor > employees
4. Find your user and change `role` from `employee` to `admin`
5. Refresh the app - you now have admin access!

## Step 6: Deploy to GitLab Pages (5 minutes)

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit"

# Add GitLab remote
git remote add origin https://gitlab.com/your-username/meal-booking-system.git

# Push to main
git branch -M main
git push -u origin main
```

### Configure GitLab Variables

1. Go to your GitLab project
2. Settings > CI/CD > Variables
3. Add these variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your anon key (mark as masked)
   - `VITE_COMPANY_DOMAIN`: Your company domain

The pipeline will run automatically. Your app will be live at:
`https://your-username.gitlab.io/meal-booking-system`

## 🎉 You're Live!

Your meal booking system is now deployed and ready to use!

## Next Steps

### Customize Your App

1. **Add Real UPI QR Code**
   - Edit `src/components/booking/BookingForm.jsx` (line ~124)
   - Replace placeholder image URL with your actual QR code

2. **Update Branding**
   - Edit `src/pages/LoginPage.jsx` to change logo
   - Edit `src/App.css` for colors

3. **Create More Users**
   - Sign up additional test accounts
   - Promote some to `vendor` role in Supabase

### Test the Flow

1. **As Employee**: Create a booking
2. **As Admin**: Approve the booking
3. **As Vendor**: View and print the list

## Common Issues

### Build fails with module errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Can't log in
- Check that your email matches the company domain in `.env`
- Verify Supabase Auth is enabled

### Environment variables not working
- Ensure `.env` file exists (not just `.env.example`)
- Restart dev server after changing `.env`
- Variables must start with `VITE_` in Vite

## Support

- 📖 Full setup guide: `SETUP_GUIDE.md`
- 📚 Main documentation: `README.md`
- 🔧 Database schema: `supabase-schema.sql`

## Success Checklist

- [ ] Project running locally on http://localhost:5173
- [ ] Can sign up and log in
- [ ] Admin user created and can access admin panel
- [ ] Supabase database created with schema
- [ ] Storage bucket created
- [ ] Deployed to GitLab Pages
- [ ] GitLab CI/CD variables configured

If all boxes are checked, you're ready to launch! 🚀

---

**Need help?** Check the full SETUP_GUIDE.md for detailed instructions.

