import type { Database } from '@/lib/supabase/types';

export type CourseRow = Database['public']['Tables']['courses']['Row'];
export type CourseInsert = Database['public']['Tables']['courses']['Insert'];
export type CourseUpdate = Database['public']['Tables']['courses']['Update'];

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
