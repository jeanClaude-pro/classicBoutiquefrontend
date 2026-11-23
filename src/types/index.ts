export interface Product {
  _id: string;
  name: string;
  description: string;
  /** Every amount of a product is FC (normal selling price). */
  currency?: "FC";
  price: number;
  priceEnteredAmount?: number;
  priceEnteredCurrency?: "FC";
  priceFC?: number;
  category: string;
  mainCategory?: "CLOTHES" | "SHOES";
  subcategory?: string;
  purchasedQuantity?: number;
  totalAcquisitionCost?: number;
  totalAcquisitionCostFC?: number;
  unitCost?: number;
  unitCostEnteredAmount?: number;
  unitCostEnteredCurrency?: "FC";
  unitCostFC?: number;
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
