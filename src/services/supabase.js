import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
export const TABLES = {
  EMPLOYEES: 'employees',
  BOOKINGS: 'bookings',
  SETTINGS: 'settings',
};

// User roles
export const ROLES = {
  EMPLOYEE: 'employee',
  ADMIN: 'admin',
  VENDOR: 'vendor',
};

// Booking status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SERVED: 'served',
};

// Meal types
export const MEAL_TYPES = {
  VEG: 'veg',
  NON_VEG: 'non_veg',
};

