export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'instructor' | 'learner' | null;
          onboarded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'instructor' | 'learner' | null;
          onboarded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'instructor' | 'learner' | null;
          onboarded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          instructor_id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          status: 'draft' | 'published' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          instructor_id: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          status?: 'draft' | 'published' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          instructor_id?: string;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          status?: 'draft' | 'published' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'courses_instructor_id_fkey';
            columns: ['instructor_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      enrollments: {
        Row: {
          id: string;
          course_id: string;
          learner_id: string;
          enrolled_at: string;
        };
        Insert: {
          id: string;
          course_id: string;
          learner_id: string;
          enrolled_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          learner_id?: string;
          enrolled_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'enrollments_course_id_fkey';
            columns: ['course_id'];
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'enrollments_learner_id_fkey';
            columns: ['learner_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      assignments: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          due_date: string;
          allow_late_submission: boolean;
          late_submission_deadline: string | null;
          status: 'draft' | 'published' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          course_id: string;
          title: string;
          description?: string | null;
          due_date: string;
          allow_late_submission?: boolean;
          late_submission_deadline?: string | null;
          status?: 'draft' | 'published' | 'closed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string;
          allow_late_submission?: boolean;
          late_submission_deadline?: string | null;
          status?: 'draft' | 'published' | 'closed';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'assignments_course_id_fkey';
            columns: ['course_id'];
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
        ];
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          learner_id: string;
          content: string | null;
          file_url: string | null;
          submitted_at: string;
          is_late: boolean;
          status: 'submitted' | 'graded' | 'resubmit_requested';
          resubmission_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          assignment_id: string;
          learner_id: string;
          content?: string | null;
          file_url?: string | null;
          submitted_at?: string;
          is_late?: boolean;
          status?: 'submitted' | 'graded' | 'resubmit_requested';
          resubmission_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          learner_id?: string;
          content?: string | null;
          file_url?: string | null;
          submitted_at?: string;
          is_late?: boolean;
          status?: 'submitted' | 'graded' | 'resubmit_requested';
          resubmission_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'submissions_assignment_id_fkey';
            columns: ['assignment_id'];
            referencedRelation: 'assignments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'submissions_learner_id_fkey';
            columns: ['learner_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      grades: {
        Row: {
          id: string;
          submission_id: string;
          score: number | null;
          feedback: string | null;
          graded_at: string;
          graded_by: string | null;
          graded_by_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          submission_id: string;
          score?: number | null;
          feedback?: string | null;
          graded_at?: string;
          graded_by?: string | null;
          graded_by_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          score?: number | null;
          feedback?: string | null;
          graded_at?: string;
          graded_by?: string | null;
          graded_by_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'grades_submission_id_fkey';
            columns: ['submission_id'];
            referencedRelation: 'submissions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'grades_graded_by_fkey';
            columns: ['graded_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

export type SupabaseUserMetadata = Record<string, unknown>;
