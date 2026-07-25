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

// ---------------------------------------------------------------------------
// Customers (CRM) — master record + full transaction / payment history
// ---------------------------------------------------------------------------

export type CustomerTag = "Retail" | "Wholesale";

export interface Customer {
  id: string;
  name: string;
  contact: string; // primary mobile
  altContact?: string;
  address: string;
  village?: string;
  city?: string;
  tag: CustomerTag;
  dob?: string; // ISO date
  gstin?: string;
  refBy: string; // full name of the user who registered the customer
  refById?: string; // user id (server-derived from request.user)
  notes?: string;
  isActive: boolean;
  createdAt: string; // ISO datetime
  // Server-computed history aggregates
  totalBilled: number;
  totalPaid: number;
  balance: number; // totalBilled - totalPaid
  bookingsCount: number;
  lastTransactionDate?: string;
}

export type LedgerEntryType = "Booking" | "Payment" | "Adjustment" | "Return";

export interface CustomerTransaction {
  id: string;
  customerId: string;
  date: string; // ISO date
  type: LedgerEntryType;
  reference?: string; // booking id / receipt no
  description: string;
  debit: number; // billed to customer
  credit: number; // received from customer
  balance: number; // running balance after this entry
  recordedBy: string;
}

export type PaymentMode = "Cash" | "UPI" | "Bank Transfer" | "Cheque" | "Card";

export interface CustomerPayment {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  mode: PaymentMode;
  reference?: string; // UTR / cheque no
  bookingId?: string;
  receivedBy: string;
  note?: string;
}

export interface CustomerLedger {
  customer: Customer;
  transactions: CustomerTransaction[];
  payments: CustomerPayment[];
  bookings: Booking[];
}

export const PAYMENT_MODES: PaymentMode[] = [
  "Cash",
  "UPI",
  "Bank Transfer",
  "Cheque",
  "Card",
];

export const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
