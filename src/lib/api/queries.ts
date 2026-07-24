// Centralized React Query "queryOptions" for the ERP.
// Every list/detail read used across the app funnels through here so cache
// keys stay consistent and mutations can invalidate precisely.

import { queryOptions } from "@tanstack/react-query";
import { api } from "../api-client";
import type {
  Booking,
  DashboardKpis,
  Expense,
  Model,
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
