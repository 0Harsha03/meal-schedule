import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, User, Package, CheckCircle, Leaf } from "lucide-react";

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  pickup_time: string;
  byoc_discount: boolean;
  status: "pending" | "preparing" | "ready" | "completed";
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
  order_items: {
    quantity: number;
    menu_items: {
      name: string;
    };
  }[];
}

export default function StaffDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        profiles!orders_customer_id_fkey (
          full_name,
          email
        ),
        order_items (
          quantity,
          menu_items (
            name
          )
        )
      `
      )
      .in("status", ["pending", "preparing", "ready"])
      .order("pickup_time", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } else {
      setOrders(data as any || []);
    }
  };

  const updateOrderStatus = async (orderId: string, currentStatus: string) => {
    const statusMap: Record<string, "pending" | "preparing" | "ready" | "completed"> = {
      pending: "preparing",
      preparing: "ready",
      ready: "completed",
    };

    const newStatus = statusMap[currentStatus as keyof typeof statusMap];

    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status updated",
        description: `Order is now ${newStatus}`,
      });
      fetchOrders();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      preparing: "bg-blue-500",
      ready: "bg-green-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pending",
      preparing: "Preparing",
      ready: "Ready for Pickup",
    };
    return labels[status] || status;
  };

  const getNextAction = (status: string) => {
    const actions: Record<string, string> = {
      pending: "Start Preparing",
      preparing: "Mark Ready",
      ready: "Complete",
    };
    return actions[status] || "Update";
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <h1 className="mb-8 text-4xl font-bold">Order Management</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">No active orders</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                  <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                </div>
                <CardDescription className="space-y-1">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <User className="h-4 w-4" />
                    {order.profiles.full_name || order.profiles.email}
                  </div>
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Clock className="h-4 w-4" />
                    {new Date(order.pickup_time).toLocaleString()}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Items:</p>
                  <ul className="text-sm space-y-1">
                    {order.order_items.map((item, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>{item.menu_items.name}</span>
                        <span className="text-muted-foreground">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-primary">${order.total_amount.toFixed(2)}</p>
                    {order.byoc_discount && (
                      <div className="flex items-center gap-1 text-xs text-secondary">
                        <Leaf className="h-3 w-3" />
                        <span>BYOC Applied</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button onClick={() => updateOrderStatus(order.id, order.status)} className="w-full" size="lg">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {getNextAction(order.status)}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}