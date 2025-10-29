-- Remove duplicate foreign key constraints that are causing ambiguity
-- Keep only the explicitly named ones we created

-- Check and drop old unnamed foreign keys if they exist
DO $$ 
BEGIN
    -- Drop old mata_pelajaran foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'jadwal_mengajar_id_mapel_fkey'
    ) THEN
        ALTER TABLE public.jadwal_mengajar 
        DROP CONSTRAINT jadwal_mengajar_id_mapel_fkey;
    END IF;

    -- Drop old kelas foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'jadwal_mengajar_id_kelas_fkey'
    ) THEN
        ALTER TABLE public.jadwal_mengajar 
        DROP CONSTRAINT jadwal_mengajar_id_kelas_fkey;
    END IF;

    -- Drop old guru foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'jadwal_mengajar_id_guru_fkey'
    ) THEN
        ALTER TABLE public.jadwal_mengajar 
        DROP CONSTRAINT jadwal_mengajar_id_guru_fkey;
    END IF;
END $$;