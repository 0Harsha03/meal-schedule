import { z } from "zod";

export const menuItemSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  price: z.number()
    .positive("Price must be positive")
    .max(10000, "Price must be less than ₹10,000"),
  allergy_labels: z.string()
    .max(500, "Allergy labels must be less than 500 characters")
    .optional()
    .nullable(),
  is_available: z.boolean(),
  meal_type: z.enum(["breakfast", "lunch", "snacks", "dinner", "all_day"]),
});

export const orderSchema = z.object({
  pickup_time: z.date()
    .refine((date) => date > new Date(), "Pickup time must be in the future")
    .refine(
      (date) => {
        const hours = date.getHours();
        return hours >= 6 && hours <= 21;
      },
      "Pickup time must be between 6 AM and 9 PM"
    ),
  byoc_discount: z.boolean(),
  items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    quantity: z.number().int().positive().max(50, "Maximum 50 items per order"),
  })).min(1, "Order must contain at least one item"),
});

export const authSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type AuthInput = z.infer<typeof authSchema>;
