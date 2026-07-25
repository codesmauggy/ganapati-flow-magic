// Centralized React Query "queryOptions" for the ERP.
// Every list/detail read used across the app funnels through here so cache
// keys stay consistent and mutations can invalidate precisely.

import { queryOptions } from "@tanstack/react-query";
import { api } from "../api-client";
import type {
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
  bookings: ["bookings"] as const,
  workers: ["workers"] as const,
  expenses: ["expenses"] as const,
  tempos: ["tempos"] as const,
  dashboard: ["dashboard"] as const,
};

export const modelsQuery = queryOptions({
  queryKey: qk.models,
  queryFn: () => api.get<Model[]>("/api/models/"),
});

export const bookingsQuery = queryOptions({
  queryKey: qk.bookings,
  queryFn: () => api.get<Booking[]>("/api/bookings/"),
});

export const workersQuery = queryOptions({
  queryKey: qk.workers,
  queryFn: () => api.get<Worker[]>("/api/workers/"),
});

export const expensesQuery = queryOptions({
  queryKey: qk.expenses,
  queryFn: () => api.get<Expense[]>("/api/expenses/"),
});

export const temposQuery = queryOptions({
  queryKey: qk.tempos,
  queryFn: () => api.get<Tempo[]>("/api/tempos/"),
});

export const dashboardQuery = queryOptions({
  queryKey: qk.dashboard,
  queryFn: () => api.get<DashboardKpis>("/api/dashboard/"),
});

export type CreateBookingInput = {
  customer: string;
  customerId?: string; // link to an existing Customer record (preferred)
  mobile?: string;
  village?: string;
  modelSku: string;
  qty: number;
  advance?: number;
  channel: "Wholesale" | "Retail";
  pickupDate?: string;
};

export const createBooking = (input: CreateBookingInput) =>
  api.post<Booking>("/api/bookings/", input);

// ---------------------------------------------------------------------------
// Customers (CRM) + transaction / payment history
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Admin data entry — master records (models, workers, expenses, bookings)
// ---------------------------------------------------------------------------

export type ModelInput = {
  sku: string;
  name: string;
  category: "Ganapati" | "Gauri" | "Devi";
  size: string;
  photo?: string;
  purchasePrice: number;
  sellingPrice: number;
  rawMaterialCost: number;
  available: number;
  lowStockAt: number;
};

export const createModel = (input: ModelInput) => api.post<Model>("/api/models/", input);
export const updateModel = ({ id, ...input }: Partial<ModelInput> & { id: string }) =>
  api.patch<Model>(`/api/models/${id}/`, input);
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
