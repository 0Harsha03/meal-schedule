import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  allergy_labels: string | null;
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
  });
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
    setFormData({ name: "", price: "", is_available: true, allergy_labels: "" });
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemData = {
      name: formData.name,
      price: parseFloat(formData.price),
      is_available: formData.is_available,
      allergy_labels: formData.allergy_labels || null,
    };

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
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Menu Management</h1>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergy">Allergy Labels (optional)</Label>
                <Textarea
                  id="allergy"
                  placeholder="e.g., Contains nuts, dairy, gluten"
                  value={formData.allergy_labels}
                  onChange={(e) => setFormData({ ...formData, allergy_labels: e.target.value })}
                />
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
              <CardDescription>
                {item.is_available ? (
                  <span className="text-secondary font-medium">Available</span>
                ) : (
                  <span className="text-destructive font-medium">Unavailable</span>
                )}
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
    </div>
  );
}