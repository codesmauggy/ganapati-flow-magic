// src/lib/api/queries.ts
import { queryOptions } from "@tanstack/react-query";
import { api } from "../api-client";
import { toSnakeCase } from "../utils";

import type {
  AuthUser,
  Booking,
  BookingStatus,
  Customer,
  CustomerLedger,
  CustomerPayment,
  CustomerTag,
  DashboardKpis,
  Expense,
  Model,
  PaymentMode,
  Tempo,
  Worker,
} from "../types";

export const qk = {
  models: ["models"] as const,
  retailBookings: ["retail-bookings"] as const,
  wholesaleBookings: ["wholesale-bookings"] as const,
  bookings: ["bookings"] as const,
  workers: ["workers"] as const,
  expenses: ["expenses"] as const,
  tempos: ["tempos"] as const,
  dashboard: ["dashboard"] as const,
};

// ------------------------------------------------------------
// Models
// ------------------------------------------------------------
export const modelsQuery = queryOptions({
  queryKey: qk.models,
  queryFn: () => api.get<Model[]>("/api/models/"),
});

// ------------------------------------------------------------
// Settings
// ------------------------------------------------------------
export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: () => api.get<any>("/api/settings/"),
});

// ------------------------------------------------------------
// Bookings – separate retail / wholesale endpoints + combined list
// ------------------------------------------------------------
export const retailBookingsQuery = queryOptions({
  queryKey: qk.retailBookings,
  queryFn: () => api.get<Booking[]>("/api/retail-bookings/"),
});

export const wholesaleBookingsQuery = queryOptions({
  queryKey: qk.wholesaleBookings,
  queryFn: () => api.get<Booking[]>("/api/wholesale-bookings/"),
});

// Combined bookings – fetch both and merge (sorted by date desc)
export const bookingsQuery = queryOptions({
  queryKey: qk.bookings,
  queryFn: async () => {
    const [retail, wholesale] = await Promise.all([
      api.get<Booking[]>("/api/retail-bookings/"),
      api.get<Booking[]>("/api/wholesale-bookings/"),
    ]);
    return [...retail, ...wholesale].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },
});

// ------------------------------------------------------------
// Create booking – routes to correct endpoint based on channel
// ------------------------------------------------------------
export type CreateBookingInput = {
  customer: string;
  customerId?: string;
  mobile?: string;
  village?: string;
  modelSku?: string;          // required for retail
  qty?: number;               // required for retail
  amount?: number;            // retail optional, wholesale per item
  advance?: number;           // retail advance, or total advance for wholesale
  channel: "Wholesale" | "Retail";
  pickupDate?: string;
  notes?: string;
  items?: Array<{ modelSku: string; qty: number; amount: number }>;
};

export const createBooking = (input: CreateBookingInput) => {
  // Build payload with only fields that have values
  const payload: any = {
    status: "Booked",
  };

  // Customer fields
  if (input.customerId) {
    payload.customer_id = input.customerId;
  }
  const trimmedName = input.customer?.trim();
  if (trimmedName) {
    payload.customer_name = trimmedName;
  }
  const trimmedMobile = input.mobile?.trim();
  if (trimmedMobile) {
    payload.mobile = trimmedMobile;
  }
  const trimmedVillage = input.village?.trim();
  if (trimmedVillage) {
    payload.village = trimmedVillage;
  }

  // Advance, pickup, notes
  if (input.advance !== undefined && input.advance > 0) {
    payload.advance = input.advance;
  }
  if (input.pickupDate) {
    payload.pickup_date = input.pickupDate;
  }
  if (input.notes?.trim()) {
    payload.notes = input.notes.trim();
  }

  // Retail specific
  if (input.channel === "Retail") {
    if (!input.modelSku) throw new Error("modelSku required for retail");
    payload.model_sku = input.modelSku;
    payload.qty = input.qty ?? 1;
    if (input.amount !== undefined && input.amount > 0) {
      payload.amount = input.amount;
    }
    // If no customerId, ensure name and mobile are present
    if (!input.customerId) {
      if (!payload.customer_name || !payload.mobile) {
        throw new Error("Both customer name and mobile are required for new customer.");
      }
    }
    return api.post<Booking>("/api/retail-bookings/", toSnakeCase(payload));
  }

  // Wholesale
  if (!input.items || input.items.length === 0) {
    throw new Error("items required for wholesale");
  }
  payload.items = input.items.map((item) => ({
    model_sku: item.modelSku,
    qty: item.qty,
    amount: item.amount,
  }));
  if (!input.customerId) {
    if (!payload.customer_name || !payload.mobile) {
      throw new Error("Both customer name and mobile are required for new customer.");
    }
  }
  return api.post<Booking>("/api/wholesale-bookings/", toSnakeCase(payload));
};

// ------------------------------------------------------------
// Workers
// ------------------------------------------------------------
export const workersQuery = queryOptions({
  queryKey: qk.workers,
  queryFn: () => api.get<Worker[]>("/api/workers/"),
});

// ------------------------------------------------------------
// Expenses
// ------------------------------------------------------------
export const expensesQuery = queryOptions({
  queryKey: qk.expenses,
  queryFn: () => api.get<Expense[]>("/api/expenses/"),
});

// ------------------------------------------------------------
// Tempos
// ------------------------------------------------------------
export const temposQuery = queryOptions({
  queryKey: qk.tempos,
  queryFn: () => api.get<Tempo[]>("/api/tempos/"),
});

// ------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------
export const dashboardQuery = queryOptions({
  queryKey: qk.dashboard,
  queryFn: () => api.get<DashboardKpis>("/api/dashboard/"),
});

// ------------------------------------------------------------
// Customers (CRM) + transaction / payment history
// ------------------------------------------------------------
export const customerKeys = {
  all: ["customers"] as const,
  detail: (id: string) => ["customers", id] as const,
  ledger: (id: string) => ["customers", id, "ledger"] as const,
};

export const customersQuery = queryOptions({
  queryKey: customerKeys.all,
  queryFn: () => api.get<Customer[]>("/api/customers/"),
});

export const customerQuery = (id: string) =>
  queryOptions({
    queryKey: customerKeys.detail(id),
    queryFn: () => api.get<Customer>(`/api/customers/${id}/`),
  });

export const customerLedgerQuery = (id: string) =>
  queryOptions({
    queryKey: customerKeys.ledger(id),
    queryFn: () => api.get<CustomerLedger>(`/api/customers/${id}/ledger/`),
  });

export type CustomerInput = {
  name: string;
  contact: string;
  altContact?: string;
  address: string;
  village?: string;
  city?: string;
  tag: CustomerTag;
  dob?: string;
  gstin?: string;
  notes?: string;
  isActive?: boolean;
};

export const createCustomer = (input: CustomerInput) =>
  api.post<Customer>("/api/customers/", input);

export const updateCustomer = ({ id, ...input }: Partial<CustomerInput> & { id: string }) =>
  api.patch<Customer>(`/api/customers/${id}/`, input);

export const deleteCustomer = (id: string) => api.delete<void>(`/api/customers/${id}/`);

export type PaymentInput = {
  customerId: string;
  amount: number;
  mode: PaymentMode;
  date?: string;
  reference?: string;
  bookingId?: string;
  note?: string;
};

export const createPayment = (input: PaymentInput) =>
  api.post<CustomerPayment>("/api/payments/", input);

// ------------------------------------------------------------
// Admin data entry — master records (models, workers, expenses, bookings)
// ------------------------------------------------------------
export type ModelInput = {
  sku: string;
  name: string;
  category: "Ganapati" | "Gauri" | "Devi";
  size: string;
  photo?: string | File | null;
  purchasePrice: number;
  sellingPrice: number;
  rawMaterialCost: number;
  available: number;
  lowStockAt: number;
};

export const createModel = (input: ModelInput) => {
  const hasFile = input.photo instanceof File;
  if (hasFile) {
    // Use FormData for file upload – DO NOT set Content-Type manually
    const formData = new FormData();
    const snake = (key: string) => key.replace(/([A-Z])/g, "_$1").toLowerCase();
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined || value === null) continue;
      if (key === "photo" && value instanceof File) {
        formData.append(snake(key), value);
      } else {
        formData.append(snake(key), String(value));
      }
    }
    return api.post<Model>("/api/models/", formData);
  } else {
    const payload = { ...input };
    if (!payload.photo) delete payload.photo;
    return api.post<Model>("/api/models/", toSnakeCase(payload));
  }
};

export const updateModel = ({ id, ...input }: Partial<ModelInput> & { id: string }) => {
  const hasFile = input.photo instanceof File;
  if (hasFile) {
    const formData = new FormData();
    const snake = (key: string) => key.replace(/([A-Z])/g, "_$1").toLowerCase();
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined || value === null) continue;
      if (key === "photo" && value instanceof File) {
        formData.append(snake(key), value);
      } else {
        formData.append(snake(key), String(value));
      }
    }
    return api.patch<Model>(`/api/models/${id}/`, formData);
  } else {
    const payload = { ...input };
    if (payload.photo === null || payload.photo === "") delete payload.photo;
    return api.patch<Model>(`/api/models/${id}/`, toSnakeCase(payload));
  }
};

export const deleteModel = (id: string) => api.delete<void>(`/api/models/${id}/`);

export type WorkerInput = {
  name: string;
  role: string;
  category: "Production" | "Painter";
  operation: string;
  pieceRate: number;
  attendance?: string;
};

export const createWorker = (input: WorkerInput) => api.post<Worker>("/api/workers/", input);
export const updateWorker = ({ id, ...input }: Partial<WorkerInput> & { id: string }) =>
  api.patch<Worker>(`/api/workers/${id}/`, input);
export const deleteWorker = (id: string) => api.delete<void>(`/api/workers/${id}/`);

export type ExpenseInput = {
  date: string;
  category: string;
  description: string;
  amount: number;
  paidBy?: string;
};

export const createExpense = (input: ExpenseInput) => api.post<Expense>("/api/expenses/", input);
export const updateExpense = ({ id, ...input }: Partial<ExpenseInput> & { id: string }) =>
  api.patch<Expense>(`/api/expenses/${id}/`, input);
export const deleteExpense = (id: string) => api.delete<void>(`/api/expenses/${id}/`);

export const updateBookingStatus = ({ id, status }: { id: string; status: BookingStatus }) =>
  api.patch<Booking>(`/api/bookings/${id}/`, { status });

// ------------------------------------------------------------
// Users / Profile
// ------------------------------------------------------------
export type UserUpdateInput = {
  first_name?: string;
  last_name?: string;
  email?: string;
};

export const updateUserProfile = (input: UserUpdateInput) =>
  api.patch<AuthUser>("/api/auth/me/", input);

export const usersQuery = queryOptions({
  queryKey: ["users"],
  queryFn: () => api.get<AuthUser[]>("/api/users/"),
});

export type UserInput = {
  username: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: AuthUser["role"];
  is_active?: boolean;
};

export const createUser = (input: UserInput) =>
  api.post<AuthUser>("/api/users/", input);

export const updateUser = ({ id, ...input }: Partial<UserInput> & { id: string }) =>
  api.patch<AuthUser>(`/api/users/${id}/`, input);

export const deleteUser = (id: string) => api.delete<void>(`/api/users/${id}/`);