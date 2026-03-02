
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS subscription_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_ends_at timestamp with time zone;
