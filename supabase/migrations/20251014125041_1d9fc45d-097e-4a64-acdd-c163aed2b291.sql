-- Create a separate table for payment credentials (defense-in-depth)
-- This isolates sensitive payment identifiers from general user profile data
CREATE TABLE IF NOT EXISTS public.payment_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on payment_credentials
ALTER TABLE public.payment_credentials ENABLE ROW LEVEL SECURITY;

-- No direct user access - only service role can access this table
-- This ensures payment credentials are never exposed to client-side code
CREATE POLICY "No direct user access to payment credentials"
ON public.payment_credentials
FOR ALL
USING (false);

-- Migrate existing payment data from profiles to payment_credentials
INSERT INTO public.payment_credentials (user_id, stripe_customer_id, stripe_subscription_id)
SELECT id, stripe_customer_id, stripe_subscription_id
FROM public.profiles
WHERE stripe_customer_id IS NOT NULL OR stripe_subscription_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Remove payment credential columns from profiles table
-- Keep subscription_plan as it's not sensitive (just 'free' or 'premium')
ALTER TABLE public.profiles DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS stripe_subscription_id;

-- Create function to update payment credentials timestamp
CREATE OR REPLACE FUNCTION public.update_payment_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_payment_credentials_timestamp
BEFORE UPDATE ON public.payment_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_payment_credentials_updated_at();