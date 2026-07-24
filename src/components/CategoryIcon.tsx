import type { LucideIcon } from "lucide-react";
import {
  Apple,
  Bean,
  Beef,
  Carrot,
  Drumstick,
  FishSymbol,
  Milk,
  Package,
  PawPrint,
  ShoppingBasket,
  Wheat,
} from "lucide-react";

type CategoryIconProps = {
  name: string;
  slug?: string | null;
  className?: string;
};

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

const icons: Record<string, LucideIcon> = {
  meat: Beef,
  chicken: Drumstick,
  fish: FishSymbol,
  "canned-food": Package,
  "pet-food": PawPrint,
  "pet-foods": PawPrint,
  vegetables: Carrot,
  fruits: Apple,
  legumes: Bean,
  pastas: Wheat,
  pasta: Wheat,
  dairy: Milk,
};

export function CategoryIcon({ name, slug, className }: CategoryIconProps) {
  const key = normalizeKey(slug || name);
  const Icon = icons[key] ?? ShoppingBasket;

  return <Icon className={className} strokeWidth={2} aria-hidden="true" />;
}
