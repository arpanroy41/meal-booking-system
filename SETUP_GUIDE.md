# 🚀 Complete Setup Guide

This guide will walk you through setting up the Meal Booking System from scratch.

## Part 1: Supabase Setup (15 minutes)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Meal Booking System
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your location
5. Click "Create new project" and wait 2-3 minutes

### Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

### Step 3: Set Up Storage

1. Go to **Storage** in the sidebar
2. Click "Create a new bucket"
3. Name it: `bookings`
4. Set it to **Private** (not public)
5. Click "Create bucket"

### Step 4: Configure Storage Policies

1. Click on the `bookings` bucket
2. Go to "Policies" tab
3. Click "New Policy"

**Policy 1: Upload Images**
- Policy Name: `Allow authenticated uploads`
- Target Roles: `authenticated`
- Operation: `INSERT`
- Policy Definition:
```sql
bucket_id = 'bookings' AND auth.role() = 'authenticated'
```

**Policy 2: View Images**
- Policy Name: `Allow authenticated to view`
- Target Roles: `authenticated`
- Operation: `SELECT`
- Policy Definition:
```sql
bucket_id = 'bookings' AND auth.role() = 'authenticated'
```

### Step 5: Enable Email Auth

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider (should be on by default)
3. Optional: Disable email confirmation for easier testing
   - Go to **Authentication** > **Settings**
   - Under "User Signups", toggle off "Enable email confirmations"

### Step 6: Get API Keys

1. Go to **Settings** > **API**
2. Copy these values (you'll need them):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)

## Part 2: Local Development Setup (10 minutes)

### Step 1: Configure Environment Variables

1. Open the project folder
2. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

3. Edit `.env` with your values:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=Meal Booking System
VITE_COMPANY_DOMAIN=yourcompany.com
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

### Step 4: Create First User

1. Click "Sign up"
2. Fill in the form with your company email
3. Submit
4. You should be redirected to the employee dashboard

### Step 5: Create Admin User

You need to manually upgrade your first user to admin:

1. Go to your Supabase dashboard
2. Navigate to **Table Editor** > **employees**
3. Find your user row
4. Edit the `role` column from `employee` to `admin`
5. Save
6. Refresh your app and you should see admin options

## Part 3: GitLab Deployment (15 minutes)

### Step 1: Create GitLab Repository

1. Go to [https://gitlab.com](https://gitlab.com)
2. Click "New project" > "Create blank project"
3. Name it: `meal-booking-system`
4. Set visibility to "Private" or "Public" (your choice)
5. Click "Create project"

### Step 2: Push Code to GitLab

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Meal Booking System"

# Add GitLab remote (use your URL)
git remote add origin https://gitlab.com/your-username/meal-booking-system.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 3: Configure CI/CD Variables

1. In your GitLab project, go to **Settings** > **CI/CD**
2. Expand **Variables**
3. Add these variables:

| Key | Value | Protected | Masked |
|-----|-------|-----------|--------|
| `VITE_SUPABASE_URL` | Your Supabase URL | ✅ | ❌ |
| `VITE_SUPABASE_ANON_KEY` | Your anon key | ✅ | ✅ |
| `VITE_COMPANY_DOMAIN` | yourcompany.com | ✅ | ❌ |

### Step 4: Enable GitLab Pages

1. Go to **Settings** > **Pages**
2. Your site will be available at: `https://your-username.gitlab.io/meal-booking-system`
3. Wait for the CI/CD pipeline to complete (check **CI/CD** > **Pipelines**)

### Step 5: Configure Custom Domain (Optional)

If you want to use your own domain:

1. Go to **Settings** > **Pages**
2. Click "New Domain"
3. Enter your domain (e.g., `meals.yourcompany.com`)
4. Follow DNS configuration instructions

## Part 4: Initial Setup & Testing (10 minutes)

### Create Test Users

Create 3 test users with different roles:

1. **Admin User**
   - Sign up with: `admin@yourcompany.com`
   - Manually set role to `admin` in Supabase

2. **Vendor User**
   - Sign up with: `vendor@yourcompany.com`
   - Manually set role to `vendor` in Supabase

3. **Employee User**
   - Sign up with: `employee@yourcompany.com`
   - Role is `employee` by default

### Test the Flow

#### As Employee:
1. Log in as employee
2. Go to "Book Meal"
3. Select tomorrow's date
4. Choose meal type (Veg/Non-veg)
5. Upload a test payment screenshot
6. Submit booking
7. Note the receipt number

#### As Admin:
1. Log in as admin
2. Go to "Pending Approvals"
3. You should see the employee's booking
4. Click "Review"
5. View payment screenshot
6. Click "Approve"

#### As Vendor:
1. Log in as vendor
2. Go to "Today's Bookings" (if booking was for today)
3. View the summary (Veg: X, Non-Veg: Y)
4. Click "Print List"
5. Verify the print preview shows correctly

### Upload Real UPI QR Code

1. Generate your UPI QR code (use Google Pay, PhonePe, or Paytm)
2. Save the QR code image
3. Upload it to a public URL or your Supabase storage
4. Edit `src/components/booking/BookingForm.jsx`
5. Replace the placeholder URL with your actual QR code URL:
```javascript
// Line ~125
<img
  src="https://your-actual-qr-code-url.jpg"
  alt="UPI QR Code"
  style={{ maxWidth: '200px' }}
/>
```

## Part 5: Customization (Optional)

### Change Branding Colors

Edit `src/App.css` to match your company colors.

### Add Company Logo

1. Replace the placeholder logo in `src/pages/LoginPage.jsx`
2. Upload your logo to `/public/logo.png`
3. Update the `brandImgSrc` prop:
```javascript
brandImgSrc="/logo.png"
```

### Modify Booking Rules

Edit `src/components/booking/BookingForm.jsx`:

- **Change booking deadline**: Modify the `tomorrow` calculation
- **Allow weekend bookings**: Remove the `isWeekend` check
- **Add meal price**: Update the form and database schema

## 🎉 You're Done!

Your meal booking system is now live and ready to use!

## Next Steps

1. **Announce to employees**: Share the URL and instructions
2. **Train vendors**: Show them how to use the print feature
3. **Monitor usage**: Check admin dashboard daily
4. **Gather feedback**: Improve based on user feedback

## 📞 Need Help?

If you get stuck:

1. Check the main README.md for troubleshooting
2. Review Supabase logs in **Logs Explorer**
3. Check GitLab CI/CD pipeline logs
4. Review browser console for errors (F12)

## 🔄 Regular Maintenance

### Daily:
- Admin reviews and approves bookings before 6 PM

### Weekly:
- Check Supabase usage (should stay in free tier)
- Review any failed bookings

### Monthly:
- Export booking data for records
- Update dependencies: `npm update`

---

**Congratulations! Your meal booking system is ready! 🎉**

