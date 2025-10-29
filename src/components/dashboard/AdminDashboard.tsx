import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Users, BookOpen, School, Calendar } from "lucide-react";
import TeachersManagement from "./admin/TeachersManagement";
import SubjectsManagement from "./admin/SubjectsManagement";
import ClassesManagement from "./admin/ClassesManagement";
import SchedulesManagement from "./admin/SchedulesManagement";
import AttendanceReports from "./admin/AttendanceReports";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("teachers");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout berhasil",
      description: "Sampai jumpa kembali!",
    });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <School className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Sistem Presensi Mengajar</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="teachers" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Guru</span>
            </TabsTrigger>
            <TabsTrigger value="subjects" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Mata Pelajaran</span>
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-2">
              <School className="h-4 w-4" />
              <span className="hidden sm:inline">Kelas</span>
            </TabsTrigger>
            <TabsTrigger value="schedules" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Jadwal</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Laporan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teachers" className="space-y-4">
            <TeachersManagement />
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <SubjectsManagement />
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            <ClassesManagement />
          </TabsContent>

          <TabsContent value="schedules" className="space-y-4">
            <SchedulesManagement />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <AttendanceReports />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
