import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, MapPin, Loader2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TARGET_LAT = -2.979616780962736;
const TARGET_LON = 104.73174075157662; 
const MAX_DISTANCE = 150; // meters, 
// -3.0000965401243174; 104.8085441647851;
const AttendanceForm = () => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<{
    valid: boolean;
    distance?: number;
    message: string;
  } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  // Camera state management
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'ready' | 'error'>('idle');
  const [cameraError, setCameraError] = useState<string>('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [debugInfo, setDebugInfo] = useState({
    videoRefReady: false,
    srcObjectSet: false,
    videoDimensions: '0 x 0',
    videoReadyState: 0,
    streamActive: false,
    photoCaptured: false,
  });

  useEffect(() => {
    fetchTodaySchedules();
    checkLocation();

    // Set up real-time subscription for schedule updates
    const channel = supabase
      .channel('jadwal-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jadwal_mengajar',
        },
        () => {
          console.log('Schedule updated, refetching...');
          fetchTodaySchedules();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        console.log('🎥 Cleanup: Camera stopped on unmount');
      }
    };
  }, [stream]);

  // Update debug info whenever relevant states change
  useEffect(() => {
    setDebugInfo({
      videoRefReady: videoRef.current !== null,
      srcObjectSet: videoRef.current?.srcObject !== null && videoRef.current?.srcObject !== undefined,
      videoDimensions: `${videoRef.current?.videoWidth || 0} x ${videoRef.current?.videoHeight || 0}`,
      videoReadyState: videoRef.current?.readyState || 0,
      streamActive: stream !== null && stream?.active,
      photoCaptured: photoDataUrl !== '',
    });
  }, [stream, cameraState, photoDataUrl]);

  const fetchTodaySchedules = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user:', userError);
        toast({
          title: "Error",
          description: "Gagal mengambil data user",
          variant: "destructive",
        });
        return;
      }

      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const today = days[new Date().getDay()];

      console.log('Fetching schedules for:', { userId: user.id, day: today });

      const { data, error } = await supabase
        .from("jadwal_mengajar")
        .select(`
          *,
          mata_pelajaran!fk_jadwal_mapel(nama_mapel),
          kelas!fk_jadwal_kelas(nama_kelas)
        `)
        .eq("id_guru", user.id)
        .eq("hari", today);

      if (error) {
        console.error('Error fetching schedules:', error);
        toast({
          title: "Error",
          description: "Gagal mengambil jadwal: " + error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('Schedules fetched:', data);
      setSchedules(data || []);

      if (!data || data.length === 0) {
        toast({
          title: "Info",
          description: `Tidak ada jadwal untuk hari ${today}`,
        });
      }
    } catch (error: any) {
      console.error('Exception fetching schedules:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengambil jadwal",
        variant: "destructive",
      });
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const checkLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus({
        valid: false,
        message: "Geolocation tidak didukung oleh browser Anda",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });

        const distance = calculateDistance(latitude, longitude, TARGET_LAT, TARGET_LON);

        if (distance <= MAX_DISTANCE) {
          setLocationStatus({
            valid: true,
            distance: Math.round(distance),
            message: `Lokasi valid (${Math.round(distance)}m dari sekolah)`,
          });
        } else {
          setLocationStatus({
            valid: false,
            distance: Math.round(distance),
            message: `Anda terlalu jauh dari sekolah (${Math.round(distance)}m)`,
          });
        }
      },
      (error) => {
        setLocationStatus({
          valid: false,
          message: "Gagal mendapatkan lokasi. Pastikan GPS aktif.",
        });
      }
    );
  };

  // Stop camera and cleanup
  const stopCamera = () => {
    console.log('🎥 Stopping camera...');
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('🎥 Camera track stopped:', track.label);
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      console.log('🎥 Video srcObject cleared');
    }
    setCameraState('idle');
    setCameraError('');
  };

  // Start camera with robust retry mechanism
  const startCamera = async () => {
    console.log('🎥 [STEP 1] Starting camera request...');
    setCameraState('starting');
    setCameraError('');
    
    try {
      // Check browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera');
      }
      
      console.log('🎥 [STEP 2] Requesting camera permission...');
      
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      console.log('🎥 [STEP 3] ✅ Camera stream received!');
      console.log('🎥 Stream details:', {
        id: mediaStream.id,
        active: mediaStream.active,
        tracks: mediaStream.getTracks().length,
        videoTracks: mediaStream.getVideoTracks().map(t => ({
          id: t.id,
          label: t.label,
          enabled: t.enabled,
          readyState: t.readyState,
          muted: t.muted
        }))
      });

      // Store stream in state
      setStream(mediaStream);
      
      console.log('🎥 [STEP 4] Attempting to attach stream to video element...');

      // Robust video attachment with retry mechanism
      const attachStreamToVideo = (retryCount = 0): Promise<void> => {
        return new Promise((resolve, reject) => {
          console.log(`🎥 [RETRY ${retryCount + 1}/15] Checking video element...`);
          console.log('🎥 videoRef.current:', videoRef.current ? '✅ EXISTS' : '❌ NULL');
          
          if (!videoRef.current) {
            console.warn(`🎥 ⚠️ videoRef is null on attempt ${retryCount + 1}`);
            
            if (retryCount < 15) {
              // Use requestAnimationFrame for the first few attempts, then setTimeout
              const retryFn = retryCount < 5 
                ? (cb: () => void) => requestAnimationFrame(cb)
                : (cb: () => void) => setTimeout(cb, 100);
                
              retryFn(() => {
                attachStreamToVideo(retryCount + 1).then(resolve).catch(reject);
              });
            } else {
              const error = new Error('Video element not available after 15 retries');
              console.error('🎥 ❌ FATAL:', error.message);
              reject(error);
            }
            return;
          }

          const video = videoRef.current;
          
          console.log('🎥 [STEP 5] Video element found! Attaching stream...');
          console.log('🎥 Video element details:', {
            nodeName: video.nodeName,
            readyState: video.readyState,
            paused: video.paused,
            muted: video.muted,
            autoplay: video.autoplay,
            playsInline: video.playsInline
          });
          
          // Attach stream to video element
          video.srcObject = mediaStream;
          
          console.log('🎥 [STEP 6] ✅ Stream attached to video.srcObject');
          console.log('🎥 Video srcObject:', video.srcObject ? '✅ SET' : '❌ NULL');

          // Use requestAnimationFrame to ensure DOM is ready, then play
          requestAnimationFrame(() => {
            console.log('🎥 [STEP 7] RAF callback - attempting to play video...');
            
            if (!videoRef.current) {
              const error = new Error('Video ref lost after RAF');
              console.error('🎥 ❌', error.message);
              reject(error);
              return;
            }

            console.log('🎥 Calling video.play()...');
            videoRef.current.play()
              .then(() => {
                console.log('🎥 [STEP 8] ✅✅✅ VIDEO IS PLAYING! ✅✅✅');
                console.log('🎥 Final video state:', {
                  videoWidth: videoRef.current?.videoWidth,
                  videoHeight: videoRef.current?.videoHeight,
                  readyState: videoRef.current?.readyState,
                  paused: videoRef.current?.paused,
                  currentTime: videoRef.current?.currentTime
                });
                
                setCameraState('ready');
                toast({
                  title: '✅ Kamera Aktif',
                  description: 'Kamera siap digunakan. Ambil foto sekarang.',
                });
                resolve();
              })
              .catch((playError) => {
                console.error('🎥 ⚠️ Play error (non-fatal):', playError);
                console.log('🎥 Setting state to ready anyway (autoPlay might work)');
                // Even if play() fails, srcObject is set and autoPlay might work
                setCameraState('ready');
                resolve();
              });
          });
        });
      };

      await attachStreamToVideo();

    } catch (error: any) {
      console.error('🎥 ❌ CAMERA ERROR:', error);
      console.error('🎥 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      let errorMsg = 'Gagal mengakses kamera';
      
      if (error.name === 'NotAllowedError') {
        errorMsg = '❌ Izin kamera ditolak. Klik ikon kamera di browser dan izinkan akses.';
      } else if (error.name === 'NotFoundError') {
        errorMsg = '❌ Kamera tidak ditemukan di perangkat Anda.';
      } else if (error.name === 'NotReadableError') {
        errorMsg = '❌ Kamera sedang digunakan aplikasi lain.';
      } else if (error.name === 'OverconstrainedError') {
        errorMsg = '❌ Pengaturan kamera tidak didukung perangkat Anda.';
      }
      
      setCameraError(errorMsg);
      setCameraState('error');
      
      toast({
        title: 'Error Kamera',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    console.log('📸 [CAPTURE] Starting photo capture...');
    console.log('📸 videoRef.current:', videoRef.current ? 'EXISTS' : 'NULL');
    console.log('📸 canvasRef.current:', canvasRef.current ? 'EXISTS' : 'NULL');
    
    if (!videoRef.current) {
      console.error('📸 Video element not found');
      toast({
        title: 'Error',
        description: 'Video element tidak ditemukan',
        variant: 'destructive',
      });
      return;
    }

    const video = videoRef.current;
    console.log('📸 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    console.log('📸 Video readyState:', video.readyState);
    console.log('📸 Video paused:', video.paused);
    console.log('📸 Video srcObject:', video.srcObject ? 'SET' : 'NULL');

    // Check if video has loaded properly
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('📸 Video dimensions are 0 - video not ready');
      toast({
        title: 'Error',
        description: 'Video belum siap. Tunggu beberapa detik dan coba lagi.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Use the canvas ref or create a new one
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log('📸 Canvas dimensions set to:', canvas.width, 'x', canvas.height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas 2d context');
      }

      // Draw video frame to canvas (flip horizontally to match preview)
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
      console.log('📸 Image drawn to canvas');

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      console.log('📸 DataURL created, length:', dataUrl.length);
      setPhotoDataUrl(dataUrl);

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          setPhotoBlob(blob);
          console.log('📸 ✅ Photo captured successfully:', blob.size, 'bytes');
          
          toast({
            title: '✅ Foto Berhasil',
            description: 'Foto telah diambil. Periksa dan gunakan atau ambil ulang.',
          });
        } else {
          console.error('📸 Failed to create blob from canvas');
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('📸 Capture error:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil foto: ' + (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  // Retake photo
  const retakePhoto = () => {
    console.log('🔄 Retaking photo...');
    if (photoDataUrl) {
      URL.revokeObjectURL(photoDataUrl);
    }
    setPhotoDataUrl('');
    setPhotoBlob(null);
    
    // Restart camera if it was stopped
    if (cameraState === 'idle') {
      startCamera();
    }
    
    toast({
      title: '🔄 Ambil Foto Lagi',
      description: 'Kamera aktif kembali. Ambil foto baru.',
    });
  };

  // Confirm photo usage
  const confirmPhoto = () => {
    if (photoDataUrl && photoBlob) {
      toast({
        title: '✅ Foto Dikonfirmasi',
        description: 'Foto siap digunakan untuk presensi.',
      });
    }
  };

  const handleSubmit = async () => {
    // Validation 1: Schedule selected
    if (!selectedSchedule) {
      toast({
        title: "Error",
        description: "⚠️ Pilih jadwal terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    // Validation 2: Location valid
    if (!locationStatus?.valid) {
      toast({
        title: "Error",
        description: `📍 Lokasi tidak valid. Anda harus berada dalam radius ${MAX_DISTANCE}m dari sekolah`,
        variant: "destructive",
      });
      return;
    }

    // Validation 3: Photo captured
    if (!photoDataUrl || !photoBlob) {
      toast({
        title: "Error",
        description: "📸 Ambil foto terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      console.log('Submitting attendance with:', {
        scheduleId: selectedSchedule,
        userId: user.id,
        location: currentLocation,
        photoSize: photoBlob.size
      });

      // Upload photo to storage
      const fileName = `${user.id}_${Date.now()}.jpg`;
      console.log('Uploading photo:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("attendance-photos")
        .upload(fileName, photoBlob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Gagal upload foto: ' + uploadError.message);
      }

      console.log('Photo uploaded:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("attendance-photos")
        .getPublicUrl(fileName);

      console.log('Photo URL:', publicUrl);

      // Determine status and calculate lateness based on time
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM
      const schedule = schedules.find(s => s.id_jadwal === selectedSchedule);
      let status: "Hadir" | "Terlambat" | "Tidak Hadir" = "Hadir";
      let keterlambatanMenit = 0;
      
      if (schedule) {
        // Parse scheduled start time (HH:MM:SS)
        const [schedHours, schedMinutes] = schedule.jam_mulai.split(':').map(Number);
        const scheduledStartTime = new Date();
        scheduledStartTime.setHours(schedHours, schedMinutes, 0, 0);
        
        // Parse actual check-in time (HH:MM)
        const [actHours, actMinutes] = currentTime.split(':').map(Number);
        const actualTime = new Date();
        actualTime.setHours(actHours, actMinutes, 0, 0);
        
        // Calculate difference in minutes (check-in - scheduled start)
        const diffMs = actualTime.getTime() - scheduledStartTime.getTime();
        const delayMinutes = Math.floor(diffMs / (1000 * 60));
        
        // Simple logic: if check-in is after start time, it's late
        if (delayMinutes <= 0) {
          status = "Hadir";
          keterlambatanMenit = 0;
        } else {
          status = "Terlambat";
          keterlambatanMenit = delayMinutes;
        }
      }

      // Save attendance record
      const attendanceData = {
        id_jadwal: selectedSchedule,
        id_guru: user.id,
        tanggal: new Date().toISOString().split("T")[0],
        jam: currentTime,
        status,
        keterlambatan_menit: keterlambatanMenit,
        foto_absen_url: publicUrl,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
      };

      console.log('Inserting attendance:', attendanceData);

      const { data: insertData, error: insertError } = await supabase
        .from("presensi_mengajar")
        .insert([attendanceData])
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Gagal menyimpan presensi: ' + insertError.message);
      }

      console.log('Attendance saved:', insertData);

      toast({
        title: "✅ Berhasil",
        description: status === "Terlambat" 
          ? `Presensi tercatat - Terlambat ${keterlambatanMenit} menit`
          : "Presensi tercatat - Tepat waktu",
      });

      // Stop camera and cleanup
      stopCamera();
      if (photoDataUrl) {
        URL.revokeObjectURL(photoDataUrl);
      }
      setPhotoDataUrl('');
      setPhotoBlob(null);

      // Reset form
      setSelectedSchedule("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Presensi Mengajar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Status */}
        <Alert variant={locationStatus?.valid ? "default" : "destructive"}>
          <div className="flex items-center gap-2">
            {locationStatus?.valid ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <AlertDescription>
              {locationStatus?.message || "Memeriksa lokasi..."}
            </AlertDescription>
          </div>
        </Alert>

        {/* Schedule Selection */}
        <div className="space-y-2">
          <Label>Pilih Jadwal Hari Ini</Label>
          <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jadwal" />
            </SelectTrigger>
            <SelectContent>
              {schedules.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  Tidak ada jadwal untuk hari ini
                </div>
              ) : (
                schedules.map((schedule) => (
                  <SelectItem key={schedule.id_jadwal} value={schedule.id_jadwal}>
                    {schedule.mata_pelajaran?.nama_mapel} -{" "}
                    {schedule.kelas?.nama_kelas} ({schedule.jam_mulai} -{" "}
                    {schedule.jam_selesai})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Camera Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">📷 Foto Presensi</Label>
            {cameraState === 'ready' && !photoDataUrl && (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                Kamera Aktif
              </span>
            )}
          </div>
          
          {/* Debug Info Panel */}
          <div className="text-xs font-mono bg-muted p-3 rounded-lg border space-y-1">
            <p className="font-bold text-primary mb-2">🔧 Debug Info Panel:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <p>• Camera State:</p>
              <p className="font-bold text-primary">{cameraState}</p>
              
              <p>• Video Ref:</p>
              <p className={debugInfo.videoRefReady ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {debugInfo.videoRefReady ? '✅ Ready' : '❌ Null'}
              </p>
              
              <p>• Stream Active:</p>
              <p className={debugInfo.streamActive ? 'text-green-600 font-bold' : 'text-gray-500'}>
                {debugInfo.streamActive ? '✅ Yes' : '❌ No'}
              </p>
              
              <p>• srcObject Set:</p>
              <p className={debugInfo.srcObjectSet ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {debugInfo.srcObjectSet ? '✅ Set' : '❌ Not Set'}
              </p>
              
              <p>• Video Dimensions:</p>
              <p className="font-bold">{debugInfo.videoDimensions}</p>
              
              <p>• ReadyState:</p>
              <p className="font-bold">
                {debugInfo.videoReadyState} 
                {debugInfo.videoReadyState === 4 && ' ✅ (HAVE_ENOUGH_DATA)'}
              </p>
              
              <p>• Photo Captured:</p>
              <p className={debugInfo.photoCaptured ? 'text-green-600 font-bold' : 'text-gray-500'}>
                {debugInfo.photoCaptured ? '✅ Yes' : '❌ No'}
              </p>
            </div>
          </div>
          
          {/* Camera Error */}
          {cameraState === 'error' && cameraError && (
            <Alert variant="destructive">
              <AlertDescription className="space-y-2">
                <p className="font-semibold">{cameraError}</p>
                <Button 
                  onClick={startCamera} 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  🔄 Coba Lagi
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Camera Display */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video border-2">
            {photoDataUrl ? (
              /* Show captured photo */
              <div className="relative w-full h-full">
                <img
                  src={photoDataUrl}
                  alt="Foto Presensi"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                  ✓ TERSIMPAN
                </div>
              </div>
            ) : cameraState === 'ready' || cameraState === 'starting' ? (
              /* Show live video (render during 'starting' so ref is available) */
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                  onLoadedMetadata={() => {
                    console.log('🎥 Video onLoadedMetadata event');
                    console.log('🎥 Video dimensions after metadata:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
                  }}
                  onCanPlay={() => console.log('🎥 Video onCanPlay event')}
                  onPlay={() => console.log('🎥 Video onPlay event')}
                  onPause={() => console.log('🎥 Video onPause event')}
                  onError={(e) => console.error('🎥 Video error event:', e)}
                />
                {cameraState === 'starting' && (
                  /* Loading overlay while starting */
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                    <Loader2 className="h-20 w-20 text-primary animate-spin mb-4" />
                    <p className="text-white text-sm">
                      Membuka kamera...
                    </p>
                  </div>
                )}
                {cameraState === 'ready' && (
                  <>
                    <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse shadow-lg">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      LIVE
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm backdrop-blur">
                      Posisikan wajah Anda di tengah
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Show start button */
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8 bg-muted">
                <Camera className="h-20 w-20 text-muted-foreground" />
                <p className="text-center text-sm text-muted-foreground max-w-xs">
                  Klik tombol di bawah untuk mengaktifkan kamera dan mengambil foto presensi
                </p>
              </div>
            )}
          </div>
          
          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Camera Controls */}
          {cameraState === 'idle' && !photoDataUrl && (
            <Button 
              onClick={startCamera}
              size="lg"
              className="w-full"
            >
              <Camera className="h-5 w-5 mr-2" />
              🎥 Buka Kamera
            </Button>
          )}
          
          {cameraState === 'starting' && (
            <Button 
              disabled
              size="lg"
              className="w-full"
            >
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Membuka Kamera...
            </Button>
          )}
          
          {cameraState === 'ready' && !photoDataUrl && (
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={capturePhoto}
                size="lg"
                className="w-full"
              >
                <Camera className="h-5 w-5 mr-2" />
                📸 Ambil Foto
              </Button>
              <Button 
                onClick={() => {
                  stopCamera();
                  toast({
                    title: 'Kamera Ditutup',
                    description: 'Kamera berhasil dinonaktifkan',
                  });
                }}
                variant="outline"
                size="lg"
              >
                Tutup Kamera
              </Button>
            </div>
          )}
          
          {photoDataUrl && (
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={retakePhoto}
                variant="outline"
                size="lg"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Ulangi Foto
              </Button>
              <Button 
                onClick={confirmPhoto}
                size="lg"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Gunakan Foto Ini
              </Button>
            </div>
          )}
          
          {/* Instructions */}
          {cameraState === 'ready' && !photoDataUrl && (
            <Alert>
              <AlertDescription className="text-xs">
                <p className="font-semibold mb-1">💡 Tips:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>Pastikan wajah terlihat jelas</li>
                  <li>Gunakan pencahayaan yang baik</li>
                  <li>Posisikan di tengah frame</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {photoDataUrl && (
            <Alert>
              <AlertDescription className="text-xs">
                ✅ <strong>Foto berhasil diambil!</strong> Periksa foto di atas. Jika sudah sesuai, klik "Gunakan Foto Ini", lalu pilih jadwal dan submit presensi.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Submit Button */}
        <div className="space-y-2">
          {/* Status Checklist */}
          <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
            <p className="font-semibold">Persyaratan Presensi:</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {locationStatus?.valid ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className={locationStatus?.valid ? "text-success" : "text-destructive"}>
                  Lokasi dalam radius sekolah
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedSchedule ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={selectedSchedule ? "text-success" : "text-muted-foreground"}>
                  Jadwal dipilih
                </span>
              </div>
              <div className="flex items-center gap-2">
                {photoDataUrl ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={photoDataUrl ? "text-success" : "text-muted-foreground"}>
                  Foto tersimpan
                </span>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!locationStatus?.valid || !photoDataUrl || !selectedSchedule || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memproses Presensi...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                📝 Catat Presensi
              </>
            )}
          </Button>
          
          {(!locationStatus?.valid || !photoDataUrl || !selectedSchedule) && (
            <p className="text-xs text-center text-muted-foreground">
              Lengkapi semua persyaratan di atas untuk melanjutkan
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceForm;
