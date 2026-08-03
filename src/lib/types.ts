// Shared domain types. All monetary values are integers (rupees).

export type Category = "Ganapati" | "Gauri" | "Devi";

export interface Model {
  id: string;
  sku: string;
  name: string;
  category: Category;
  size: string;
  photo: string;
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
  bookingId: string;          // e.g. "BK-0001"
  customer: string;           // customer ID
  customerName: string;       // full name
  mobile: string;
  village: string;
  model: string;              // model ID (retail only)
  modelName: string;
  qty: number;
  amount: number;
  advance: number;
  status: BookingStatus;
  channel: Channel;
  collector: string;          // user ID
  collectorFullName?: string; // full name (camelCase from backend)
  date: string;
  pickupDate?: string;
  notes?: string;
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
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  fullName: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'wholesaler' | 'customer';
  is_active?: boolean;
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

// Customers (CRM)
export type CustomerTag = "Retail" | "Wholesale";

export interface Customer {
  id: string;
  name: string;
  contact: string;
  altContact?: string;
  address: string;
  village?: string;
  city?: string;
  tag: CustomerTag;
  dob?: string;
  gstin?: string;
  refBy: string;
  refById?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  totalBilled: number;
  totalPaid: number;
  balance: number;
  bookingsCount: number;
  lastTransactionDate?: string;
}

export type LedgerEntryType = "Booking" | "Payment" | "Adjustment" | "Return";

export interface CustomerTransaction {
  id: string;
  customerId: string;
  date: string;
  type: LedgerEntryType;
  reference?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  recordedBy: string;
}

export type PaymentMode = "Cash" | "UPI" | "Bank Transfer" | "Cheque" | "Card";

export interface CustomerPayment {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  mode: PaymentMode;
  reference?: string;
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