// Shared domain types. These mirror the Django REST serializer shapes
// described in BACKEND_API.md. All monetary values are integers (rupees).

export type Category = "Ganapati" | "Gauri" | "Devi";

export interface Model {
  id: string;
  sku: string;
  name: string;
  category: Category;
  size: string;
  photo: string; // absolute URL served by Django /media/ or a CDN
  purchasePrice: number;
  sellingPrice: number;
  rawMaterialCost: number;
  available: number;
  lowStockAt: number;
  wholesaleSold: number;
  retailSold: number;
}

export type BookingStatus =
  | "Booked"
  | "Advance Paid"
  | "Loading"
  | "Dispatched"
  | "Delivered"
  | "Pending";

export type Channel = "Wholesale" | "Retail";

export interface Booking {
  id: string;
  customer: string;
  village: string;
  mobile: string;
  modelSku: string;
  modelName: string;
  qty: number;
  amount: number;
  advance: number;
  status: BookingStatus;
  channel: Channel;
  collector: string;
  date: string; // ISO date
}

export type Attendance = "Present" | "Half Day" | "Absent" | "Late";

export interface Worker {
  id: string;
  name: string;
  role: string;
  category: "Production" | "Painter";
  operation: string;
  pieceRate: number;
  todayProduction: number;
  monthlyProduction: number;
  attendance: Attendance;
  pendingSalary: number;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paidBy: string;
}

export interface Tempo {
  id: string;
  tempo: string;
  place: string;
  items: number;
  status: BookingStatus;
}

export interface DashboardKpis {
  totalStock: number;
  totalModels: number;
  wholesaleValue: number;
  retailValue: number;
  wholesaleCount: number;
  retailCount: number;
  collection: number;
  pending: number;
  expenses: number;
  staffPayments: number;
  netProfit: number;
  lowStockCount: number;
}

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: "admin" | "wholesale" | "retail" | "staff";
  email?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export const formatCurrency = (n: number) =>
  n >= 100000
    ? `₹ ${(n / 100000).toFixed(2)} L`
    : n >= 1000
      ? `₹ ${n.toLocaleString("en-IN")}`
      : `₹ ${n}`;
