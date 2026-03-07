export interface Budget {
  id: number;
  user_id: string;
  category_name: string;
  amount: number;
  period: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  user_id: string | null;
}

export interface BudgetWithSpending extends Budget {
  spent: number;
}

export interface Receipt {
  id: number;
  store_name: string;
  date: string;
  total_amount: number;
  category: string;
  isVisible: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  receipt_id: number;
  name: string;
  price: number;
  category: string;
  quantity?: number;
  unit_price?: number;
  tags?: string[];
  created_at?: string;
  receipts?: { date: string }[];
}

export interface FavoriteProduct {
  id: number;
  user_id: string;
  name: string;
  category: string;
  average_price: number;
  last_price: number;
  price_history: Array<{
    price: number;
    date: string;
  }>;
  created_at: string;
  updated_at: string;
}
