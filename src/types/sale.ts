export interface Sale {
  id: string;
  customer_name: string;
  phone?: string | null;
  date: string;
  shop?: 'Mini Tech' | 'T.M. Communication';
  remarks?: string;
  laptop_id?: string | null;
  sale_price?: number | null;
  items?: {
    laptop_id: string;
    quantity: number;
    unit_price: number;
  }[];
  created_at?: string;
  sale_type?: 'single' | 'batch';
}
