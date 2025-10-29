-- Add column to store lateness duration in minutes
ALTER TABLE public.presensi_mengajar 
ADD COLUMN keterlambatan_menit INTEGER DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN public.presensi_mengajar.keterlambatan_menit IS 'Duration of lateness in minutes. 0 = on time, positive = late';