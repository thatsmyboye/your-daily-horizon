-- Add badges column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN badges JSONB DEFAULT '[]'::jsonb;