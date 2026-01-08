# 🍽️ Meal Booking System

A modern, serverless meal booking system for office cafeterias. Built with React, PatternFly, and Supabase.

## 🎯 Features

### For Employees
- 📅 Book meals one day in advance
- 🥗 Choose between Veg and Non-Veg options
- 💳 Pay via UPI QR code and upload payment proof
- 📱 View booking history and receipt numbers
- ❌ Cancel pending bookings

### For Admins
- ✅ Review and approve/reject meal bookings
- 📊 View daily summaries and statistics
- 👥 Manage user roles (Employee, Admin, Vendor)
- 📈 Real-time booking updates

### For Vendors
- 📋 View today's approved bookings with meal counts
- 🖨️ Print organized lists for meal preparation
- 📅 Check upcoming bookings for planning
- ✓ Mark meals as served

## 🛠️ Tech Stack

- **Frontend**: React 18.3.1
- **UI Framework**: PatternFly 6.x (Enterprise-grade components)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel (recommended) / Netlify / GitHub Pages
- **Build Tool**: Vite
- **State Management**: React Context API

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- A Supabase account (free tier available)
- A Vercel account (for deployment, optional)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd meal-booking-system
npm install
```

### 2. Set Up Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Create a storage bucket named `bookings` (private)
4. Get your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=Meal Booking System
VITE_COMPANY_DOMAIN=yourcompany.com
```

### 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:5173`

## 📦 Deployment Options

### Option 1: Deploy to Vercel (Recommended) ⭐

Vercel offers the best experience with zero configuration for client-side routing.

#### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Meal booking system"
git branch -M main
git remote add origin https://github.com/yourusername/meal-booking-system.git
git push -u origin main
```

#### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..." → "Project"**
3. Import your `meal-booking-system` repository
4. Vercel will auto-detect it's a Vite project ✅

#### 3. Configure Environment Variables

In Vercel project settings (**Settings > Environment Variables**), add:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `VITE_COMPANY_DOMAIN`: Your company email domain

#### 4. Deploy

Click **Deploy**! 🚀

Your app will be available at: `https://meal-booking-system.vercel.app`

**Benefits:**
- ✅ Automatic deployments on every push to main
- ✅ Preview deployments for pull requests
- ✅ Perfect client-side routing support (no 404 issues)
- ✅ Built-in CDN and SSL
- ✅ Zero configuration needed

---

### Option 2: Deploy to GitHub Pages

#### 1. Update Configuration

You'll need to add back GitHub Pages specific configuration:

1. Add `base: '/meal-booking-system/'` to `vite.config.js`
2. Add `basename="/meal-booking-system"` to Router in `src/App.jsx`
3. Create `public/404.html` for client-side routing support

#### 2. Configure GitHub Secrets

Go to your GitHub repository: **Settings > Secrets and variables > Actions**

Add the following secrets:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `VITE_COMPANY_DOMAIN`: Your company email domain

#### 3. Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml` (or check DEPLOYMENT.md for details)

#### 4. Enable GitHub Pages

- Go to **Settings > Pages**
- Source: GitHub Actions
- Your app will be available at: `https://yourusername.github.io/meal-booking-system`

---

### Option 3: Deploy to Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Import your GitHub repository
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Add environment variables in Netlify dashboard
7. Deploy! ✨

Netlify will automatically deploy on every push to main.

## 📋 Database Schema

### Tables

1. **employees**
   - User profiles with roles (employee, admin, vendor)
   - Links to Supabase Auth

2. **bookings**
   - Meal bookings with payment info
   - Receipt numbers and status tracking

3. **settings**
   - Application configuration (future use)

### Row Level Security (RLS)

All tables have RLS policies to ensure:
- Users can only view/edit their own data
- Admins have full access
- Vendors can view bookings but not user details

## 🔐 Authentication Flow

1. User signs up with company email
2. Email verification (optional)
3. Auto-create employee profile with "employee" role
4. Admin can upgrade roles via User Management

### Creating First Admin

After signing up your first user, manually update their role in Supabase:

```sql
UPDATE employees 
SET role = 'admin' 
WHERE email = 'your-admin@company.com';
```

## 📱 User Roles

### Employee (Default)
- Book meals
- View own bookings
- Cancel pending bookings

### Admin
- All employee permissions
- Approve/reject bookings
- View statistics
- Manage user roles

### Vendor
- View approved bookings
- Print meal lists
- Mark meals as served

## 🎨 Customization

### Change Company Branding

Edit the logo in:
- `src/pages/LoginPage.jsx` (line with `brandImgSrc`)

### Modify Payment QR Code

Update the QR code image URL in:
- `src/components/booking/BookingForm.jsx`

### Adjust Booking Rules

Edit validation in:
- `src/components/booking/BookingForm.jsx`
- Booking deadline, weekend restrictions, etc.

## 🐛 Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure `.env` file exists with correct values
   - Restart dev server after changing `.env`

2. **Authentication not working**
   - Check Supabase Auth is enabled
   - Verify email domain restrictions if set

3. **Storage upload fails**
   - Ensure `bookings` storage bucket exists
   - Check storage policies are applied

4. **GitLab Pages shows blank page**
   - Check GitLab CI/CD variables are set
   - Verify `base: './'` in `vite.config.js`

## 📚 Project Structure

```
meal-booking-system/
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── booking/       # Employee booking components
│   │   ├── admin/         # Admin dashboard components
│   │   ├── vendor/        # Vendor dashboard components
│   │   └── common/        # Shared components
│   ├── contexts/          # React contexts (Auth)
│   ├── pages/             # Main page components
│   ├── services/          # Supabase client & API
│   └── utils/             # Helper functions
├── public/                # Static assets
├── supabase-schema.sql    # Database schema
├── .gitlab-ci.yml         # CI/CD configuration
└── vite.config.js         # Build configuration
```

## 🤝 Contributing

This is an open-source project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 👨‍💻 Author

**Arpan Roy**

- GitHub: [@arpanroy41](https://github.com/arpanroy41)

## 📄 License

MIT License - feel free to use this project for your organization.

Copyright (c) 2025 Arpan Roy

## 🙏 Acknowledgments

- Built with [PatternFly](https://www.patternfly.org/) - Enterprise-grade UI components
- Powered by [Supabase](https://supabase.com/) - Open source Firebase alternative
- Icons from [PatternFly Icons](https://www.patternfly.org/v4/guidelines/icons/)

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review [Supabase documentation](https://supabase.com/docs)
3. Check [PatternFly documentation](https://www.patternfly.org/)
4. Open an issue on GitHub

## ⚠️ Security Note

**NEVER commit your `.env` file to version control!**

The `.env` file is already in `.gitignore`. Always use:
- Environment variables for local development
- Vercel Environment Variables for Vercel deployment
- GitHub Secrets for GitHub Actions CI/CD
- Netlify Environment Variables for Netlify

## 🔄 Updates & Maintenance

To update dependencies:

```bash
npm update
npm audit fix
```

To upgrade PatternFly:

```bash
npm install @patternfly/react-core@latest
```

---

**Built with ❤️ by Arpan Roy for better workplace meal management**

*Star ⭐ this repo if you find it helpful!*
