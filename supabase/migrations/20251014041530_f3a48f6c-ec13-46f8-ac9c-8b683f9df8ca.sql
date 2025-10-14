-- Add subscription plan tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN subscription_plan text DEFAULT 'free' CHECK (subscription_plan IN ('free', 'premium')),
ADD COLUMN stripe_customer_id text UNIQUE,
ADD COLUMN stripe_subscription_id text UNIQUE;