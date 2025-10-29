import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const TeachersManagement = () => {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nama: "",
    nip: "",
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    // First get all teacher user IDs from user_roles
    const { data: teacherRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "teacher");

    if (rolesError || !teacherRoles) {
      console.error("Error fetching teacher roles:", rolesError);
      return;
    }

    // Then get profiles for those user IDs
    const teacherIds = teacherRoles.map(r => r.user_id);
    if (teacherIds.length === 0) {
      setTeachers([]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("id", teacherIds);

    if (!error && data) {
      setTeachers(data);
    } else {
      console.error("Error fetching teacher profiles:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTeacher) {
      // Create new teacher using edge function to avoid logging out admin
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-teacher`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            nama: formData.nama,
            nip: formData.nip,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Gagal menambahkan guru",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Update existing teacher
      await supabase
        .from("profiles")
        .update({
          nama: formData.nama,
          nip: formData.nip,
        })
        .eq("id", editingTeacher.id);
    }

    toast({
      title: "Berhasil",
      description: editingTeacher ? "Guru berhasil diupdate" : "Guru berhasil ditambahkan",
    });

    setIsDialogOpen(false);
    resetForm();
    fetchTeachers();
  };

  const handleDelete = async (teacherId: string) => {
    if (!confirm("Yakin ingin menghapus guru ini?")) return;

    const { error } = await supabase.auth.admin.deleteUser(teacherId);

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
      description: "Guru berhasil dihapus",
    });

    fetchTeachers();
  };

  const resetForm = () => {
    setFormData({ email: "", password: "", nama: "", nip: "" });
    setEditingTeacher(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manajemen Guru</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Guru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTeacher ? "Edit Guru" : "Tambah Guru Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nip">NIP</Label>
                <Input
                  id="nip"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                />
              </div>
              {!editingTeacher && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                </>
              )}
              <Button type="submit" className="w-full">
                {editingTeacher ? "Update" : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>NIP</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell>{teacher.nama}</TableCell>
                <TableCell>{teacher.nip || "-"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingTeacher(teacher);
                      setFormData({
                        email: "",
                        password: "",
                        nama: teacher.nama,
                        nip: teacher.nip || "",
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(teacher.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TeachersManagement;
