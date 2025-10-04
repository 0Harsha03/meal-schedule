import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Minus, Plus, Clock, Leaf, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  allergy_labels: string | null;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function CustomerOrder() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pickupTime, setPickupTime] = useState("");
  const [byoc, setByoc] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive",
      });
    } else {
      setMenuItems(data || []);
    }
  };

  const addToCart = (item: MenuItem) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(cart.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(
      cart
        .map((item) => (item.id === itemId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = byoc ? subtotal * 0.05 : 0;
    return (subtotal - discount).toFixed(2);
  };

  const handleCheckout = async () => {
    if (!pickupTime) {
      toast({
        title: "Pickup time required",
        description: "Please select a pickup time",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to your order",
        variant: "destructive",
      });
      return;
    }

    try {
      const total = parseFloat(calculateTotal());

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user!.id,
          total_amount: total,
          pickup_time: new Date(pickupTime).toISOString(),
          byoc_discount: byoc,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Order placed!",
        description: `Your order total is $${total}. We'll have it ready at ${new Date(pickupTime).toLocaleTimeString()}.`,
      });

      setCart([]);
      setPickupTime("");
      setByoc(false);
    } catch (error: any) {
      toast({
        title: "Order failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <h1 className="mb-8 text-4xl font-bold">Order Your Meal</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Today's Menu</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {menuItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription className="text-xl font-bold text-primary">
                    ${item.price.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.allergy_labels && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{item.allergy_labels}</span>
                    </div>
                  )}
                  <Button onClick={() => addToCart(item)} className="w-full">
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Your Cart
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm flex-1">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-medium w-16 text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-3 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="pickup-time" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pickup Time
                      </Label>
                      <Input
                        id="pickup-time"
                        type="datetime-local"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>

                    <div className="flex items-center space-x-2 bg-secondary/30 p-3 rounded-lg">
                      <Checkbox id="byoc" checked={byoc} onCheckedChange={(checked) => setByoc(checked as boolean)} />
                      <label
                        htmlFor="byoc"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                      >
                        <Leaf className="h-4 w-4 text-secondary" />
                        Bring Your Own Container (Save 5%)
                      </label>
                    </div>

                    <div className="flex justify-between text-lg font-bold pt-2">
                      <span>Total:</span>
                      <span className="text-primary">${calculateTotal()}</span>
                    </div>

                    <Button onClick={handleCheckout} className="w-full" size="lg">
                      Pay Now
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}