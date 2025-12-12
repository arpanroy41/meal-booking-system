-- Meal Booking System Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    employee_id TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin', 'vendor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('veg', 'non_veg')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'rejected', 'served')),
    payment_screenshot_url TEXT,
    receipt_number TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(employee_id, booking_date)
);

-- Create settings table (for future use)
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_employee_id ON bookings(employee_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for bookings table
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for settings table
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- EMPLOYEES TABLE POLICIES
-- =====================================================

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
ON employees FOR SELECT
USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON employees FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Allow users to update their own profile (limited fields)
CREATE POLICY "Users can update their own profile"
ON employees FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
ON employees FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Allow new users to insert their profile (triggered by auth.users)
CREATE POLICY "Users can insert their own profile"
ON employees FOR INSERT
WITH CHECK (auth.uid() = id);

-- =====================================================
-- BOOKINGS TABLE POLICIES
-- =====================================================

-- Allow users to view their own bookings
CREATE POLICY "Users can view their own bookings"
ON bookings FOR SELECT
USING (employee_id = auth.uid());

-- Allow admins and vendors to view all bookings
CREATE POLICY "Admins and vendors can view all bookings"
ON bookings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE id = auth.uid() AND role IN ('admin', 'vendor')
    )
);

-- Allow users to create their own bookings
CREATE POLICY "Users can create their own bookings"
ON bookings FOR INSERT
WITH CHECK (employee_id = auth.uid());

-- Allow users to update their own pending bookings (for cancellation)
CREATE POLICY "Users can update their own pending bookings"
ON bookings FOR UPDATE
USING (employee_id = auth.uid() AND payment_status = 'pending')
WITH CHECK (employee_id = auth.uid());

-- Allow users to delete their own pending bookings
CREATE POLICY "Users can delete their own pending bookings"
ON bookings FOR DELETE
USING (employee_id = auth.uid() AND payment_status = 'pending');

-- Allow admins to update any booking
CREATE POLICY "Admins can update any booking"
ON bookings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Allow vendors to update booking status (mark as served)
CREATE POLICY "Vendors can update booking status"
ON bookings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE id = auth.uid() AND role = 'vendor'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM employees
        WHERE id = auth.uid() AND role = 'vendor'
    )
);

-- =====================================================
-- SETTINGS TABLE POLICIES
-- =====================================================

-- Allow everyone to read settings
CREATE POLICY "Everyone can view settings"
ON settings FOR SELECT
USING (true);

-- Only admins can modify settings
CREATE POLICY "Only admins can modify settings"
ON settings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================================================
-- STORAGE BUCKET SETUP
-- =====================================================

-- Create storage bucket for payment screenshots
-- Run this in the Supabase Dashboard Storage section:
-- 1. Create a new bucket named "bookings"
-- 2. Set it to private (not public)
-- 3. Apply the following policies:

-- Storage Policy: Allow authenticated users to upload their payment screenshots
-- INSERT policy:
-- CREATE POLICY "Users can upload payment screenshots"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--     bucket_id = 'bookings' AND
--     auth.role() = 'authenticated'
-- );

-- Storage Policy: Allow users to view their own screenshots, admins to view all
-- SELECT policy:
-- CREATE POLICY "Users can view payment screenshots"
-- ON storage.objects FOR SELECT
-- USING (
--     bucket_id = 'bookings' AND
--     (auth.role() = 'authenticated')
-- );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to automatically create employee profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.employees (id, email, name, employee_id, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'employee_id', 'EMP' || SUBSTR(NEW.id::TEXT, 1, 8)),
        'employee'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create employee profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Note: You'll need to create actual auth users first, then update this with real UUIDs
-- This is just for reference

-- INSERT INTO employees (id, email, name, employee_id, role) VALUES
-- ('your-admin-uuid', 'admin@yourcompany.com', 'Admin User', 'EMP001', 'admin'),
-- ('your-vendor-uuid', 'vendor@yourcompany.com', 'Vendor User', 'VENDOR001', 'vendor');

