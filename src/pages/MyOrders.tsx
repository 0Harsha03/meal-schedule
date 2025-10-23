import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, Package, CheckCircle, Leaf, Loader2, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Order {
  id: string;
  total_amount: number;
  pickup_time: string;
  byoc_discount: boolean;
  status: "pending" | "preparing" | "ready" | "completed";
  payment_status: string;
  created_at: string;
  order_items: {
    quantity: number;
    price_at_time: number;
    menu_items: {
      name: string;
    };
  }[];
}

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();

    // Set up realtime subscription for order updates
    const channel = supabase
      .channel("user-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${user?.id}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            quantity,
            price_at_time,
            menu_items (
              name
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as any) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      preparing: "bg-blue-500",
      ready: "bg-green-500",
      completed: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pending",
      preparing: "Preparing",
      ready: "Ready for Pickup",
      completed: "Completed",
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "preparing":
        return <Package className="h-4 w-4" />;
      case "ready":
        return <CheckCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    const colors: Record<string, string> = {
      paid: "bg-green-500",
      pending: "bg-yellow-500",
      failed: "bg-red-500",
      refunded: "bg-gray-500",
    };
    return colors[paymentStatus] || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground">Track your current and past orders</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Place your first order to see it here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <Card
              key={order.id}
              className={`hover:shadow-lg transition-shadow ${
                order.status === "ready" ? "border-2 border-green-500" : ""
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">
                    Order #{order.id.slice(0, 8)}
                  </CardTitle>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                      {getStatusIcon(order.status)}
                      {getStatusLabel(order.status)}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`${getPaymentStatusColor(order.payment_status)} text-white flex items-center gap-1`}
                    >
                      <CreditCard className="h-3 w-3" />
                      {order.payment_status || 'pending'}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="space-y-1">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Clock className="h-4 w-4" />
                    Pickup: {new Date(order.pickup_time).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ordered: {new Date(order.created_at).toLocaleString()}
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
                        <span className="text-muted-foreground">
                          x{item.quantity} (₹{item.price_at_time.toFixed(2)})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-primary">
                      ₹{order.total_amount.toFixed(2)}
                    </p>
                    {order.byoc_discount && (
                      <div className="flex items-center gap-1 text-xs text-secondary">
                        <Leaf className="h-3 w-3" />
                        <span>BYOC Discount Applied</span>
                      </div>
                    )}
                  </div>
                </div>

                {order.status === "ready" && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                      ✅ Your order is ready for pickup!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
