import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, LogOut, ShoppingBag, Users, Settings, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Canteen Pre-Order</span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            {userRole === "customer" && (
              <>
                <Button variant="ghost" onClick={() => navigate("/order")}>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Order
                </Button>
                <Button variant="ghost" onClick={() => navigate("/my-orders")}>
                  <Receipt className="h-4 w-4 mr-2" />
                  My Orders
                </Button>
              </>
            )}
            {userRole === "staff" && (
              <Button variant="ghost" onClick={() => navigate("/staff")}>
                <Users className="h-4 w-4 mr-2" />
                Orders
              </Button>
            )}
            {userRole === "admin" && (
              <Button variant="ghost" onClick={() => navigate("/admin")}>
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};