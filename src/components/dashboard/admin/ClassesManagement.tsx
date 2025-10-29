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

const ClassesManagement = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [formData, setFormData] = useState({ nama_kelas: "" });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from("kelas")
      .select("*")
      .order("nama_kelas");

    if (!error && data) {
      setClasses(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingClass) {
      const { error } = await supabase
        .from("kelas")
        .insert({ nama_kelas: formData.nama_kelas });

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
        .from("kelas")
        .update({ nama_kelas: formData.nama_kelas })
        .eq("id_kelas", editingClass.id_kelas);

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
      description: editingClass
        ? "Kelas berhasil diupdate"
        : "Kelas berhasil ditambahkan",
    });

    setIsDialogOpen(false);
    resetForm();
    fetchClasses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kelas ini?")) return;

    const { error } = await supabase.from("kelas").delete().eq("id_kelas", id);

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
      description: "Kelas berhasil dihapus",
    });

    fetchClasses();
  };

  const resetForm = () => {
    setFormData({ nama_kelas: "" });
    setEditingClass(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manajemen Kelas</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kelas
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClass ? "Edit Kelas" : "Tambah Kelas Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama_kelas">Nama Kelas</Label>
                <Input
                  id="nama_kelas"
                  value={formData.nama_kelas}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_kelas: e.target.value })
                  }
                  placeholder="Contoh: 10 IPA 1"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingClass ? "Update" : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Kelas</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((classItem) => (
              <TableRow key={classItem.id_kelas}>
                <TableCell>{classItem.nama_kelas}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingClass(classItem);
                      setFormData({ nama_kelas: classItem.nama_kelas });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(classItem.id_kelas)}
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

export default ClassesManagement;
