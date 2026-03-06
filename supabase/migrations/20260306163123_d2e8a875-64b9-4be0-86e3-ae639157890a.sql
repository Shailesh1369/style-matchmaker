
CREATE TABLE public.outfit_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prompt_hash text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(prompt_hash)
);

ALTER TABLE public.outfit_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own outfit images"
ON public.outfit_images FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outfit images"
ON public.outfit_images FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outfit images"
ON public.outfit_images FOR DELETE TO authenticated
USING (auth.uid() = user_id);
