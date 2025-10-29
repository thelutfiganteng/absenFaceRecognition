import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, MapPin, Camera, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-primary rounded-2xl shadow-elegant">
              <GraduationCap className="h-16 w-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Sistem Presensi Mengajar
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Sistem presensi berbasis facial recognition dan GPS untuk memastikan kehadiran guru yang akurat dan terpercaya
          </p>
          <Button onClick={() => navigate("/auth")} size="lg" className="shadow-elegant">
            Masuk ke Sistem
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="shadow-card-custom hover:shadow-elegant transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">Facial Recognition</h3>
              <p className="text-muted-foreground text-center text-sm">
                Verifikasi identitas menggunakan teknologi pengenalan wajah untuk keamanan maksimal
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card-custom hover:shadow-elegant transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <MapPin className="h-8 w-8 text-secondary" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">GPS Validation</h3>
              <p className="text-muted-foreground text-center text-sm">
                Memastikan presensi dilakukan di lokasi sekolah dengan radius 150 meter
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card-custom hover:shadow-elegant transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-accent/20 rounded-lg">
                  <Users className="h-8 w-8 text-accent-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">Multi-Role System</h3>
              <p className="text-muted-foreground text-center text-sm">
                Dashboard terpisah untuk Admin dan Guru dengan fitur yang sesuai kebutuhan
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
