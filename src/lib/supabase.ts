import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface AlumniProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  cohort_year: number;
  program: string;
  current_profession?: string;
  current_organization?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  location?: string;
  profile_photo_url?: string;
  cv_url?: string;
  social_links: Record<string, string>;
  is_approved: boolean;
  is_public: boolean;
  profile_views: number;
  profile_shares: number;
  created_at: string;
  updated_at: string;
}

export interface WorkExperience {
  id: string;
  alumni_id: string;
  organization_name: string;
  position_title: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  created_at: string;
}

export interface ProfileView {
  id: string;
  profile_id: string;
  viewer_ip?: string;
  viewer_id?: string;
  viewed_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  permissions: string[];
  created_at: string;
}