-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher');

-- Create enum for attendance status
CREATE TYPE public.attendance_status AS ENUM ('Hadir', 'Terlambat', 'Tidak Hadir');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama VARCHAR(100) NOT NULL,
  nip VARCHAR(30),
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create mata_pelajaran (subjects) table
CREATE TABLE public.mata_pelajaran (
  id_mapel UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_mapel VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mata_pelajaran ENABLE ROW LEVEL SECURITY;

-- Create kelas (classes) table
CREATE TABLE public.kelas (
  id_kelas UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kelas VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;

-- Create jadwal_mengajar (teaching schedule) table
CREATE TABLE public.jadwal_mengajar (
  id_jadwal UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_guru UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  id_mapel UUID REFERENCES public.mata_pelajaran(id_mapel) ON DELETE CASCADE NOT NULL,
  id_kelas UUID REFERENCES public.kelas(id_kelas) ON DELETE CASCADE NOT NULL,
  hari VARCHAR(20) NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.jadwal_mengajar ENABLE ROW LEVEL SECURITY;

-- Create presensi_mengajar (attendance) table
CREATE TABLE public.presensi_mengajar (
  id_presensi UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_jadwal UUID REFERENCES public.jadwal_mengajar(id_jadwal) ON DELETE CASCADE NOT NULL,
  id_guru UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tanggal DATE NOT NULL,
  jam TIME NOT NULL,
  status attendance_status NOT NULL,
  foto_absen_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.presensi_mengajar ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for mata_pelajaran
CREATE POLICY "Subjects viewable by authenticated users"
  ON public.mata_pelajaran FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage subjects"
  ON public.mata_pelajaran FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for kelas
CREATE POLICY "Classes viewable by authenticated users"
  ON public.kelas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage classes"
  ON public.kelas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for jadwal_mengajar
CREATE POLICY "Schedules viewable by authenticated users"
  ON public.jadwal_mengajar FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage schedules"
  ON public.jadwal_mengajar FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for presensi_mengajar
CREATE POLICY "Attendance viewable by authenticated users"
  ON public.presensi_mengajar FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can create own attendance"
  ON public.presensi_mengajar FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id_guru AND public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Admins can manage all attendance"
  ON public.presensi_mengajar FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-photos', 'attendance-photos', true);

-- Storage policies for attendance photos
CREATE POLICY "Photos viewable by authenticated users"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'attendance-photos');

CREATE POLICY "Teachers can upload attendance photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'attendance-photos' AND public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Admins can manage all photos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'attendance-photos' AND public.has_role(auth.uid(), 'admin'));

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nama)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();