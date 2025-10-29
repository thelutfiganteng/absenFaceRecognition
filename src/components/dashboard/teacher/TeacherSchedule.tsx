import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const TeacherSchedule = () => {
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    fetchSchedules();

    // Set up real-time subscription for schedule updates
    const channel = supabase
      .channel('schedule-changes')
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("jadwal_mengajar")
      .select(`
        *,
        mata_pelajaran!fk_jadwal_mapel(nama_mapel),
        kelas!fk_jadwal_kelas(nama_kelas)
      `)
      .eq("id_guru", user.id)
      .order("hari");

    if (!error && data) {
      setSchedules(data);
    }
  };

  const groupSchedulesByDay = () => {
    const grouped: { [key: string]: any[] } = {};
    DAYS.forEach((day) => {
      grouped[day] = schedules.filter((s) => s.hari === day);
    });
    return grouped;
  };

  const groupedSchedules = groupSchedulesByDay();
  const today = DAYS[new Date().getDay() - 1];

  return (
    <div className="grid gap-4">
      {DAYS.map((day) => (
        <Card
          key={day}
          className={day === today ? "border-primary shadow-elegant" : ""}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {day}
              </div>
              {day === today && (
                <Badge className="bg-primary">Hari Ini</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {groupedSchedules[day].length === 0 ? (
              <p className="text-muted-foreground text-sm">Tidak ada jadwal</p>
            ) : (
              <div className="space-y-3">
                {groupedSchedules[day].map((schedule) => (
                  <div
                    key={schedule.id_jadwal}
                    className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {schedule.mata_pelajaran?.nama_mapel}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {schedule.kelas?.nama_kelas}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {schedule.jam_mulai} - {schedule.jam_selesai}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TeacherSchedule;
