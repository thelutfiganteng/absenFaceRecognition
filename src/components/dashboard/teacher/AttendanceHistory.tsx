import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { MapPin, Image } from "lucide-react";

const AttendanceHistory = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("presensi_mengajar")
      .select(`
        *,
        jadwal_mengajar!fk_presensi_jadwal(
          jam_mulai,
          mata_pelajaran!fk_jadwal_mapel(nama_mapel),
          kelas!fk_jadwal_kelas(nama_kelas)
        )
      `)
      .eq("id_guru", user.id)
      .order("tanggal", { ascending: false })
      .limit(20);

    if (!error && data) {
      setAttendanceRecords(data);
    }
  };

  const calculateLateness = (record: any) => {
    if (!record.jadwal_mengajar?.jam_mulai || !record.jam) return 0;
    
    // Parse scheduled start time (HH:MM:SS)
    const [schedHours, schedMinutes] = record.jadwal_mengajar.jam_mulai.split(':').map(Number);
    const scheduledStartTime = new Date();
    scheduledStartTime.setHours(schedHours, schedMinutes, 0, 0);
    
    // Parse actual check-in time (HH:MM:SS or HH:MM)
    const timeParts = record.jam.split(':').map(Number);
    const [actHours, actMinutes] = timeParts;
    const actualCheckInTime = new Date();
    actualCheckInTime.setHours(actHours, actMinutes, 0, 0);
    
    // Calculate difference in minutes (check-in - scheduled start)
    const diffMs = actualCheckInTime.getTime() - scheduledStartTime.getTime();
    const delayMinutes = Math.floor(diffMs / (1000 * 60));
    
    return delayMinutes;
  };

  const getStatusBadge = (record: any) => {
    const delayMinutes = record.keterlambatan_menit !== undefined 
      ? record.keterlambatan_menit 
      : calculateLateness(record);
    
    if (delayMinutes <= 0) {
      return (
        <Badge className="bg-green-600 hover:bg-green-700 text-white">
          ✅ Tepat Waktu
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
          🕒 Terlambat {delayMinutes} menit
        </Badge>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Presensi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Foto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.map((record) => (
                <TableRow key={record.id_presensi}>
                  <TableCell>
                    {format(new Date(record.tanggal), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>{record.jam}</TableCell>
                  <TableCell>
                    {record.jadwal_mengajar?.mata_pelajaran?.nama_mapel}
                  </TableCell>
                  <TableCell>
                    {record.jadwal_mengajar?.kelas?.nama_kelas}
                  </TableCell>
                  <TableCell>{getStatusBadge(record)}</TableCell>
                  <TableCell>
                    {record.latitude && record.longitude ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                        </span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {record.foto_absen_url ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Image className="h-4 w-4 mr-2" />
                            Lihat
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Foto Presensi</DialogTitle>
                          </DialogHeader>
                          <img 
                            src={record.foto_absen_url} 
                            alt="Foto Presensi" 
                            className="w-full h-auto rounded-lg"
                          />
                          <div className="text-sm text-muted-foreground">
                            <p>Tanggal: {format(new Date(record.tanggal), "dd MMM yyyy")}</p>
                            <p>Jam: {record.jam}</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceHistory;
