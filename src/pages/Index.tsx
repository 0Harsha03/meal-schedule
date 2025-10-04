import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, Clock, Leaf, Shield, Loader2 } from "lucide-react";

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && userRole) {
      if (userRole === "admin") {
        navigate("/admin");
      } else if (userRole === "staff") {
        navigate("/staff");
      } else if (userRole === "customer") {
        navigate("/order");
      }
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary mb-6">
            <UtensilsCrossed className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold mb-4">Canteen Pre-Order System</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Order ahead, skip the line, and enjoy your meal on your schedule
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
              Get Started
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardContent className="pt-6 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Schedule Pickup</h3>
              <p className="text-muted-foreground">
                Choose your exact pickup time and have your meal ready when you arrive
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-secondary transition-colors">
            <CardContent className="pt-6 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-secondary/10 mb-4">
                <Leaf className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sustainability</h3>
              <p className="text-muted-foreground">
                Bring your own container and save 5% while supporting SDG 12
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-accent transition-colors">
            <CardContent className="pt-6 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent/10 mb-4">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Easy</h3>
              <p className="text-muted-foreground">
                Safe payments and simple ordering process for everyone
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
