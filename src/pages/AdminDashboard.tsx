import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesAnalytics } from "@/components/SalesAnalytics";
import { UserManagement } from "@/components/UserManagement";
import { getMealTypeLabel, type MealType } from "@/lib/mealTimes";
import { menuItemSchema } from "@/lib/validations";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  allergy_labels: string | null;
  meal_type: MealType;
}

export default function AdminDashboard() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    is_available: true,
    allergy_labels: "",
    meal_type: "all_day" as MealType,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    const { data, error } = await supabase.from("menu_items").select("*").order("name");

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

  const resetForm = () => {
    setFormData({ name: "", price: "", is_available: true, allergy_labels: "", meal_type: "all_day" });
    setEditingItem(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with Zod
    const validation = menuItemSchema.safeParse({
      name: formData.name,
      price: parseFloat(formData.price),
      is_available: formData.is_available,
      allergy_labels: formData.allergy_labels || null,
      meal_type: formData.meal_type,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    const itemData = validation.data;

    try {
      if (editingItem) {
        const { error } = await supabase.from("menu_items").update(itemData).eq("id", editingItem.id);
        if (error) throw error;
        toast({ title: "Success", description: "Menu item updated successfully" });
      } else {
        const { error } = await supabase.from("menu_items").insert([itemData]);
        if (error) throw error;
        toast({ title: "Success", description: "Menu item created successfully" });
      }

      fetchMenuItems();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      is_available: item.is_available,
      allergy_labels: item.allergy_labels || "",
      meal_type: item.meal_type,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase.from("menu_items").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Menu item deleted" });
      fetchMenuItems();
    }
  };

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="menu">Menu Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <SalesAnalytics />
        </TabsContent>

        <TabsContent value="menu">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Menu Items</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Update the menu item details below" : "Create a new menu item for today's menu"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
                {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal_type">Meal Type</Label>
                <Select
                  value={formData.meal_type}
                  onValueChange={(value: MealType) => setFormData({ ...formData, meal_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">{getMealTypeLabel("breakfast")}</SelectItem>
                    <SelectItem value="lunch">{getMealTypeLabel("lunch")}</SelectItem>
                    <SelectItem value="snacks">{getMealTypeLabel("snacks")}</SelectItem>
                    <SelectItem value="dinner">{getMealTypeLabel("dinner")}</SelectItem>
                    <SelectItem value="all_day">{getMealTypeLabel("all_day")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergy">Allergy Labels (optional)</Label>
                <Textarea
                  id="allergy"
                  placeholder="e.g., Contains nuts, dairy, gluten"
                  value={formData.allergy_labels}
                  onChange={(e) => setFormData({ ...formData, allergy_labels: e.target.value })}
                />
                {errors.allergy_labels && <p className="text-sm text-destructive">{errors.allergy_labels}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
                <Label htmlFor="available">Available</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingItem ? "Update Item" : "Create Item"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{item.name}</span>
                <span className="text-primary">₹{item.price.toFixed(2)}</span>
              </CardTitle>
              <CardDescription className="space-y-1">
                <div>
                  {item.is_available ? (
                    <span className="text-secondary font-medium">Available</span>
                  ) : (
                    <span className="text-destructive font-medium">Unavailable</span>
                  )}
                </div>
                <div className="text-xs">
                  {getMealTypeLabel(item.meal_type)}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.allergy_labels && (
                <p className="text-sm text-muted-foreground">
                  <strong>Allergens:</strong> {item.allergy_labels}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="flex-1">
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)} className="flex-1">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}