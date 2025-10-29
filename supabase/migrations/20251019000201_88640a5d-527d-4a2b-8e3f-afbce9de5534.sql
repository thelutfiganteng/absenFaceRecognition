-- Add foreign key constraints to jadwal_mengajar table
ALTER TABLE public.jadwal_mengajar
ADD CONSTRAINT fk_jadwal_guru 
FOREIGN KEY (id_guru) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.jadwal_mengajar
ADD CONSTRAINT fk_jadwal_mapel 
FOREIGN KEY (id_mapel) REFERENCES public.mata_pelajaran(id_mapel) ON DELETE CASCADE;

ALTER TABLE public.jadwal_mengajar
ADD CONSTRAINT fk_jadwal_kelas 
FOREIGN KEY (id_kelas) REFERENCES public.kelas(id_kelas) ON DELETE CASCADE;

-- Add foreign key constraint to presensi_mengajar table
ALTER TABLE public.presensi_mengajar
ADD CONSTRAINT fk_presensi_guru 
FOREIGN KEY (id_guru) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.presensi_mengajar
ADD CONSTRAINT fk_presensi_jadwal 
FOREIGN KEY (id_jadwal) REFERENCES public.jadwal_mengajar(id_jadwal) ON DELETE CASCADE;