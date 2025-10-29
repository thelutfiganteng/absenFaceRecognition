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

const SubjectsManagement = () => {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [formData, setFormData] = useState({ nama_mapel: "" });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from("mata_pelajaran")
      .select("*")
      .order("nama_mapel");

    if (!error && data) {
      setSubjects(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingSubject) {
      const { error } = await supabase
        .from("mata_pelajaran")
        .insert({ nama_mapel: formData.nama_mapel });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
    } else {
      const { error } = await supabase
        .from("mata_pelajaran")
        .update({ nama_mapel: formData.nama_mapel })
        .eq("id_mapel", editingSubject.id_mapel);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
    }

    toast({
      title: "Berhasil",
      description: editingSubject
        ? "Mata pelajaran berhasil diupdate"
        : "Mata pelajaran berhasil ditambahkan",
    });

    setIsDialogOpen(false);
    resetForm();
    fetchSubjects();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus mata pelajaran ini?")) return;

    const { error } = await supabase
      .from("mata_pelajaran")
      .delete()
      .eq("id_mapel", id);

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
      description: "Mata pelajaran berhasil dihapus",
    });

    fetchSubjects();
  };

  const resetForm = () => {
    setFormData({ nama_mapel: "" });
    setEditingSubject(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manajemen Mata Pelajaran</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Mapel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama_mapel">Nama Mata Pelajaran</Label>
                <Input
                  id="nama_mapel"
                  value={formData.nama_mapel}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_mapel: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingSubject ? "Update" : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Mata Pelajaran</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject.id_mapel}>
                <TableCell>{subject.nama_mapel}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingSubject(subject);
                      setFormData({ nama_mapel: subject.nama_mapel });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(subject.id_mapel)}
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

export default SubjectsManagement;
