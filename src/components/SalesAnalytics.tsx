import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, ShoppingBag, Users } from "lucide-react";

interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  popularItems: { name: string; count: number }[];
}

export function SalesAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    popularItems: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Get all orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("total_amount, status");

      if (ordersError) throw ordersError;

      // Get popular items
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(
          `
          quantity,
          menu_items (
            name
          )
        `
        );

      if (itemsError) throw itemsError;

      // Calculate analytics
      const totalOrders = orders?.length || 0;
      const totalRevenue =
        orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const pendingOrders =
        orders?.filter((order) => order.status === "pending").length || 0;

      // Calculate popular items
      const itemCounts: Record<string, number> = {};
      orderItems?.forEach((item: any) => {
        const name = item.menu_items.name;
        itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
      });

      const popularItems = Object.entries(itemCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setAnalytics({
        totalOrders,
        totalRevenue,
        pendingOrders,
        popularItems,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting preparation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹
              {analytics.totalOrders > 0
                ? (analytics.totalRevenue / analytics.totalOrders).toFixed(2)
                : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Per order average</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Most Ordered Items</CardTitle>
          <CardDescription>Based on total quantity ordered</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.popularItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No orders yet
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.popularItems.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item.count} orders
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
