-- Enable realtime for jadwal_mengajar table
ALTER TABLE public.jadwal_mengajar REPLICA IDENTITY FULL;

-- Add table to realtime publication if not already added
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'jadwal_mengajar'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.jadwal_mengajar;
    END IF;
END $$;

-- Enable realtime for presensi_mengajar table
ALTER TABLE public.presensi_mengajar REPLICA IDENTITY FULL;

-- Add table to realtime publication if not already added
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'presensi_mengajar'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.presensi_mengajar;
    END IF;
END $$;