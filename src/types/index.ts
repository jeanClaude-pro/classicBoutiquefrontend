export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  priceEnteredAmount?: number;
  priceEnteredCurrency?: "USD" | "FC";
  priceFC?: number;
  priceExchangeRate?: number;
  category: string;
  mainCategory?: "CLOTHES" | "SHOES";
  subcategory?: string;
  purchasedQuantity?: number;
  totalAcquisitionCost?: number;
  totalAcquisitionCostFC?: number;
  unitCost?: number;
  unitCostEnteredAmount?: number;
  unitCostEnteredCurrency?: "USD" | "FC";
  unitCostFC?: number;
  unitCostExchangeRate?: number;
  brand: string;
  stock: number;
  minStock: number;
  unit: string;
  weight: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
}
