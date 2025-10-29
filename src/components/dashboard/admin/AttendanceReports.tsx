import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

const AttendanceReports = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchAttendance();
  }, [startDate, endDate]);

  const fetchAttendance = async () => {
    let query = supabase
      .from("presensi_mengajar")
      .select(`
        *,
        profiles!fk_presensi_guru(nama),
        jadwal_mengajar!fk_presensi_jadwal(
          mata_pelajaran!fk_jadwal_mapel(nama_mapel),
          kelas!fk_jadwal_kelas(nama_kelas)
        )
      `)
      .order("tanggal", { ascending: false });

    if (startDate) {
      query = query.gte("tanggal", startDate);
    }
    if (endDate) {
      query = query.lte("tanggal", endDate);
    }

    const { data, error } = await query;

    if (!error && data) {
      setAttendanceRecords(data);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Hadir":
        return <Badge className="bg-success">{status}</Badge>;
      case "Terlambat":
        return <Badge className="bg-warning">{status}</Badge>;
      case "Tidak Hadir":
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Presensi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Tanggal Mulai</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">Tanggal Akhir</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Guru</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell>{record.profiles?.nama}</TableCell>
                  <TableCell>
                    {record.jadwal_mengajar?.mata_pelajaran?.nama_mapel}
                  </TableCell>
                  <TableCell>
                    {record.jadwal_mengajar?.kelas?.nama_kelas}
                  </TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>
                    {record.foto_absen_url ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Image className="h-4 w-4 mr-2" />
                            Lihat Foto
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Foto Presensi - {record.profiles?.nama}</DialogTitle>
                          </DialogHeader>
                          <img 
                            src={record.foto_absen_url} 
                            alt="Foto Presensi" 
                            className="w-full h-auto rounded-lg"
                          />
                          <div className="text-sm text-muted-foreground">
                            <p>Tanggal: {format(new Date(record.tanggal), "dd MMM yyyy")}</p>
                            <p>Jam: {record.jam}</p>
                            {record.latitude && record.longitude && (
                              <p>Lokasi: {record.latitude}, {record.longitude}</p>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span className="text-muted-foreground text-sm">Tidak ada foto</span>
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

export default AttendanceReports;
