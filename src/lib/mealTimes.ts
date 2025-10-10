export type MealType = "breakfast" | "lunch" | "snacks" | "dinner" | "all_day";

export function getCurrentMealType(): MealType {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 10) return "breakfast";
  if (hour >= 10 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 18) return "snacks";
  if (hour >= 18 && hour < 22) return "dinner";
  
  return "all_day";
}

export function getMealTypeLabel(mealType: MealType): string {
  const labels: Record<MealType, string> = {
    breakfast: "Breakfast (6 AM - 10 AM)",
    lunch: "Lunch (10 AM - 3 PM)",
    snacks: "Snacks (3 PM - 6 PM)",
    dinner: "Dinner (6 PM - 10 PM)",
    all_day: "All Day",
  };
  return labels[mealType];
}

export function getMealTypeIcon(mealType: MealType): string {
  const icons: Record<MealType, string> = {
    breakfast: "🌅",
    lunch: "☀️",
    snacks: "🥤",
    dinner: "🌙",
    all_day: "⏰",
  };
  return icons[mealType];
}
