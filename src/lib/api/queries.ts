// src/lib/api/queries.ts
import { queryOptions } from "@tanstack/react-query";
import { api } from "../api-client";
import { toSnakeCase, toSnakeCaseFormData } from "../utils";
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
  customerId?: string;
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

// ... (imports and other exports unchanged)

export type ModelInput = {
  sku: string;
  name: string;
  category: "Ganapati" | "Gauri" | "Devi";
  size: string;
  photo?: string | File | null;   // allow File or URL
  purchasePrice: number;
  sellingPrice: number;
  rawMaterialCost: number;
  available: number;
  lowStockAt: number;
};

export const createModel = (input: ModelInput) => {
  const hasFile = input.photo instanceof File;
  if (hasFile) {
    const formData = toSnakeCaseFormData(input, 'photo');
    // ✅ Do NOT set Content-Type header – browser will set it with boundary
    return api.post<Model>("/api/models/", formData);
  } else {
    const payload = { ...input };
    if (!payload.photo) delete payload.photo; // avoid sending empty string
    return api.post<Model>("/api/models/", toSnakeCase(payload));
  }
};

export const updateModel = ({ id, ...input }: Partial<ModelInput> & { id: string }) => {
  const hasFile = input.photo instanceof File;
  if (hasFile) {
    const formData = toSnakeCaseFormData(input, 'photo');
    return api.patch<Model>(`/api/models/${id}/`, formData);
  } else {
    const payload = { ...input };
    if (payload.photo === null || payload.photo === '') delete payload.photo;
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
