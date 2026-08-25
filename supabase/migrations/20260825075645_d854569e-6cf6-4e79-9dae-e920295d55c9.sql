CREATE TYPE public.app_role AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'ADMIN'));

CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'OTHER',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'NEW',
  page text,
  gallery_name text,
  artwork_id text,
  device text,
  browser text,
  viewport text,
  app_version text,
  screenshot_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.feedback TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send feedback" ON public.feedback
  FOR INSERT TO anon, authenticated WITH CHECK (char_length(message) BETWEEN 1 AND 4000);
CREATE POLICY "Admins read feedback" ON public.feedback
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admins update feedback" ON public.feedback
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admins delete feedback" ON public.feedback
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER feedback_updated_at BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Anyone can upload feedback screenshots" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'feedback-screenshots');
CREATE POLICY "Admins read feedback screenshots" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'feedback-screenshots' AND public.has_role(auth.uid(), 'ADMIN'));