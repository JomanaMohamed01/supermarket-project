export type Category = {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
  sort_order: number | null;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  unit: string | null;
  is_available: boolean | null;
};

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
};

export type Order = {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  created_at: string;
};
