import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const SchedulesManagement = () => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [formData, setFormData] = useState({
    id_guru: "",
    id_mapel: "",
    id_kelas: "",
    hari: "",
    jam_mulai: "",
    jam_selesai: "",
  });

  useEffect(() => {
    fetchSchedules();
    fetchTeachers();
    fetchSubjects();
    fetchClasses();

    // Set up real-time subscription for schedule updates
    const channel = supabase
      .channel('admin-schedule-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jadwal_mengajar',
        },
        () => {
          console.log('Schedule updated, refetching...');
          fetchSchedules();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from("jadwal_mengajar")
      .select(`
        *,
        profiles!fk_jadwal_guru(nama),
        mata_pelajaran!fk_jadwal_mapel(nama_mapel),
        kelas!fk_jadwal_kelas(nama_kelas)
      `)
      .order("hari");

    if (!error && data) {
      setSchedules(data);
    }
  };

  const fetchTeachers = async () => {
    // First get all teacher user IDs from user_roles
    const { data: teacherRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "teacher");

    if (!teacherRoles || teacherRoles.length === 0) {
      setTeachers([]);
      return;
    }

    // Then get profiles for those user IDs
    const teacherIds = teacherRoles.map(r => r.user_id);
    const { data } = await supabase
      .from("profiles")
      .select("id, nama")
      .in("id", teacherIds);
    
    if (data) setTeachers(data);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from("mata_pelajaran").select("*");
    if (data) setSubjects(data);
  };

  const fetchClasses = async () => {
    const { data } = await supabase.from("kelas").select("*");
    if (data) setClasses(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!formData.id_guru || !formData.id_mapel || !formData.id_kelas || 
        !formData.hari || !formData.jam_mulai || !formData.jam_selesai) {
      toast({
        title: "Error",
        description: "⚠️ Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    // Validate time
    if (formData.jam_mulai >= formData.jam_selesai) {
      toast({
        title: "Error",
        description: "⚠️ Jam mulai harus lebih awal dari jam selesai",
        variant: "destructive",
      });
      return;
    }

    console.log('Submitting schedule:', formData);

    if (!editingSchedule) {
      const { data, error } = await supabase
        .from("jadwal_mengajar")
        .insert(formData)
        .select();

      if (error) {
        console.error('Insert error:', error);
        toast({
          title: "Error",
          description: "Gagal menambahkan jadwal: " + error.message,
          variant: "destructive",
        });
        return;
      }
      console.log('Schedule inserted:', data);
    } else {
      const { data, error } = await supabase
        .from("jadwal_mengajar")
        .update(formData)
        .eq("id_jadwal", editingSchedule.id_jadwal)
        .select();

      if (error) {
        console.error('Update error:', error);
        toast({
          title: "Error",
          description: "Gagal mengupdate jadwal: " + error.message,
          variant: "destructive",
        });
        return;
      }
      console.log('Schedule updated:', data);
    }

    toast({
      title: "✅ Berhasil",
      description: editingSchedule
        ? "Jadwal berhasil diupdate dan tersinkron ke guru"
        : "Jadwal berhasil ditambahkan dan tersinkron ke guru",
    });

    setIsDialogOpen(false);
    resetForm();
    fetchSchedules(); // Refetch to ensure latest data
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus jadwal ini?")) return;

    const { error } = await supabase
      .from("jadwal_mengajar")
      .delete()
      .eq("id_jadwal", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: "Jadwal berhasil dihapus",
    });

    fetchSchedules();
  };

  const resetForm = () => {
    setFormData({
      id_guru: "",
      id_mapel: "",
      id_kelas: "",
      hari: "",
      jam_mulai: "",
      jam_selesai: "",
    });
    setEditingSchedule(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manajemen Jadwal Mengajar</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Jadwal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? "Edit Jadwal" : "Tambah Jadwal Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Guru</Label>
                <Select
                  value={formData.id_guru}
                  onValueChange={(value) =>
                    setFormData({ ...formData, id_guru: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Guru" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mata Pelajaran</Label>
                <Select
                  value={formData.id_mapel}
                  onValueChange={(value) =>
                    setFormData({ ...formData, id_mapel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Mata Pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id_mapel} value={subject.id_mapel}>
                        {subject.nama_mapel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select
                  value={formData.id_kelas}
                  onValueChange={(value) =>
                    setFormData({ ...formData, id_kelas: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id_kelas} value={classItem.id_kelas}>
                        {classItem.nama_kelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Hari</Label>
                <Select
                  value={formData.hari}
                  onValueChange={(value) =>
                    setFormData({ ...formData, hari: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Hari" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jam_mulai">Jam Mulai</Label>
                  <Input
                    id="jam_mulai"
                    type="time"
                    value={formData.jam_mulai}
                    onChange={(e) =>
                      setFormData({ ...formData, jam_mulai: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jam_selesai">Jam Selesai</Label>
                  <Input
                    id="jam_selesai"
                    type="time"
                    value={formData.jam_selesai}
                    onChange={(e) =>
                      setFormData({ ...formData, jam_selesai: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingSchedule ? "Update" : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hari</TableHead>
                <TableHead>Guru</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id_jadwal}>
                  <TableCell>{schedule.hari}</TableCell>
                  <TableCell>{schedule.profiles?.nama}</TableCell>
                  <TableCell>{schedule.mata_pelajaran?.nama_mapel}</TableCell>
                  <TableCell>{schedule.kelas?.nama_kelas}</TableCell>
                  <TableCell>
                    {schedule.jam_mulai} - {schedule.jam_selesai}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingSchedule(schedule);
                        setFormData({
                          id_guru: schedule.id_guru,
                          id_mapel: schedule.id_mapel,
                          id_kelas: schedule.id_kelas,
                          hari: schedule.hari,
                          jam_mulai: schedule.jam_mulai,
                          jam_selesai: schedule.jam_selesai,
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(schedule.id_jadwal)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

export default SchedulesManagement;
