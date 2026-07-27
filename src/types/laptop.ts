export interface Laptop {
  id: string;
  name: string;
  price: number;
  sale_price?: number | null;
  cost_price?: number | null;
  quantity?: number;
  specs: string;
  shop_name: 'Mini Tech' | 'T.M. Communication';
  series: string;
  slug: string;
  dealer_ids?: string[];
  date?: string;
  is_sold?: boolean;
  created_at?: string;
}

