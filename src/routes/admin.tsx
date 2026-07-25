import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Receipt, ShieldCheck, Trash2, Truck, Users } from "lucide-react";
import { AppShell, AsyncState, CategoryChip, StatusPill, TagChip } from "@/components/app-shell";
import {
  bookingsQuery,
  createExpense,
  createModel,
  createWorker,
  customerKeys,
  customersQuery,
  deleteCustomer,
  deleteExpense,
  deleteModel,
  deleteWorker,
  expensesQuery,
  modelsQuery,
  qk,
  updateBookingStatus,
  updateCustomer,
  updateModel,
  updateWorker,
  workersQuery,
  type ExpenseInput,
  type ModelInput,
  type WorkerInput,
} from "@/lib/api/queries";
import { formatCurrency, formatDate, type BookingStatus, type Category } from "@/lib/types";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console · Manish Kala Kendra ERP" },
      {
        name: "description",
        content:
          "Admin console for master data entry and modification — customers, idol models, workshop staff, expenses and booking status overrides.",
      },
      { property: "og:title", content: "Admin Console · Manish Kala Kendra ERP" },
      {
        property: "og:description",
        content:
          "Admin console for master data entry and modification — customers, idol models, workshop staff, expenses and booking status overrides.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const TABS = [
  { id: "customers", label: "Customers", icon: Users },
  { id: "models", label: "Models & Stock", icon: Package },
  { id: "workers", label: "Staff", icon: Users },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "bookings", label: "Bookings", icon: Truck },
] as const;

type TabId = (typeof TABS)[number]["id"];

const STATUSES: BookingStatus[] = [
  "Booked",
  "Advance Paid",
  "Loading",
  "Dispatched",
  "Delivered",
  "Pending",
];

function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("customers");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const isAdmin = user?.role === "admin";

  const flash = (kind: "ok" | "err", text: string) => {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 3500);
  };

  return (
    <AppShell title="Admin Console" subtitle="Master data entry, corrections and status overrides">
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-tile)]">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="text-sm">
          <p className="font-semibold">
            Signed in as {user?.fullName || user?.username} · <span className="capitalize">{user?.role}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            {isAdmin
              ? "You have full write access. All changes are written straight to the backend database."
              : "Write access is enforced server-side by role — non-admin edits will be rejected by the API."}
          </p>
        </div>
      </div>

      {msg && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            msg.kind === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                tab === t.id
                  ? "inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                  : "inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "customers" && <CustomersAdmin flash={flash} />}
      {tab === "models" && <ModelsAdmin flash={flash} />}
      {tab === "workers" && <WorkersAdmin flash={flash} />}
      {tab === "expenses" && <ExpensesAdmin flash={flash} />}
      {tab === "bookings" && <BookingsAdmin flash={flash} />}
    </AppShell>
  );
}

type Flash = (kind: "ok" | "err", text: string) => void;
const errText = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-tile)]">
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <h2 className="font-display text-lg">{title}</h2>
        {subtitle ? <p className="text-[11px] text-muted-foreground">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function IconButton({ onClick, disabled, label }: { onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

/* ------------------------------- Customers ------------------------------- */

function CustomersAdmin({ flash }: { flash: Flash }) {
  const queryClient = useQueryClient();
  const cq = useQuery(customersQuery);
  const rows = cq.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: customerKeys.all });

  const toggle = useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      invalidate();
      flash("ok", "Customer updated.");
    },
    onError: (e) => flash("err", errText(e, "Could not update the customer.")),
  });

  const remove = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      invalidate();
      flash("ok", "Customer deleted.");
    },
    onError: (e) => flash("err", errText(e, "Could not delete the customer.")),
  });

  return (
    <Panel title="Customer records" subtitle="Change tag, activate or remove records. Add customers from the Customers page.">
      <AsyncState isLoading={cq.isLoading} isError={cq.isError} error={cq.error} empty={rows.length === 0} emptyLabel="No customers yet.">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3 sm:px-6">Customer</th>
                <th className="px-4 py-3 sm:px-6">Tag</th>
                <th className="px-4 py-3 sm:px-6">Ref By</th>
                <th className="px-4 py-3 text-right sm:px-6">Balance</th>
                <th className="px-4 py-3 sm:px-6">Active</th>
                <th className="px-4 py-3 sm:px-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 sm:px-6">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.contact}</p>
                  </td>
                  <td className="px-4 py-3 sm:px-6">
                    <select
                      className="input h-8 py-0 text-xs"
                      value={c.tag}
                      onChange={(e) => toggle.mutate({ id: c.id, tag: e.target.value as "Retail" | "Wholesale" })}
                    >
                      <option value="Retail">Retail</option>
                      <option value="Wholesale">Wholesale</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs sm:px-6">{c.refBy || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs sm:px-6">{formatCurrency(c.balance)}</td>
                  <td className="px-4 py-3 sm:px-6">
                    <button
                      type="button"
                      onClick={() => toggle.mutate({ id: c.id, isActive: !c.isActive })}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right sm:px-6">
                    <IconButton label={`Delete ${c.name}`} disabled={remove.isPending} onClick={() => remove.mutate(c.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncState>
    </Panel>
  );
}

/* --------------------------------- Models -------------------------------- */

const emptyModel: ModelInput = {
  sku: "",
  name: "",
  category: "Ganapati",
  size: "",
  photo: "",
  purchasePrice: 0,
  sellingPrice: 0,
  rawMaterialCost: 0,
  available: 0,
  lowStockAt: 0,
};

function ModelsAdmin({ flash }: { flash: Flash }) {
  const queryClient = useQueryClient();
  const mq = useQuery(modelsQuery);
  const [form, setForm] = useState<ModelInput>(emptyModel);
  const rows = mq.data ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.models });
    queryClient.invalidateQueries({ queryKey: qk.dashboard });
  };

  const add = useMutation({
    mutationFn: createModel,
    onSuccess: () => {
      invalidate();
      setForm(emptyModel);
      flash("ok", "Model added.");
    },
    onError: (e) => flash("err", errText(e, "Could not add the model.")),
  });
  const patch = useMutation({
    mutationFn: updateModel,
    onSuccess: () => {
      invalidate();
      flash("ok", "Model updated.");
    },
    onError: (e) => flash("err", errText(e, "Could not update the model.")),
  });
  const remove = useMutation({
    mutationFn: deleteModel,
    onSuccess: () => {
      invalidate();
      flash("ok", "Model deleted.");
    },
    onError: (e) => flash("err", errText(e, "Could not delete the model.")),
  });

  return (
    <div className="space-y-6">
      <Panel title="Add model / SKU">
        <form
          className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.sku.trim() || !form.name.trim()) return;
            add.mutate({ ...form, photo: form.photo || undefined });
          }}
        >
          <Field label="SKU">
            <input required className="input" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="GN-24-DG" />
          </Field>
          <Field label="Name">
            <input required className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Category">
            <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}>
              <option value="Ganapati">Ganapati</option>
              <option value="Gauri">Gauri</option>
              <option value="Devi">Devi</option>
            </select>
          </Field>
          <Field label="Size">
            <input className="input" value={form.size} onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))} placeholder="24 inch" />
          </Field>
          <Field label="Photo URL">
            <input className="input" value={form.photo} onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))} placeholder="https://…" />
          </Field>
          <Field label="Purchase price">
            <input type="number" min={0} className="input" value={form.purchasePrice || ""} onChange={(e) => setForm((f) => ({ ...f, purchasePrice: Number(e.target.value) || 0 }))} />
          </Field>
          <Field label="Selling price">
            <input type="number" min={0} className="input" value={form.sellingPrice || ""} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: Number(e.target.value) || 0 }))} />
          </Field>
          <Field label="Raw material cost">
            <input type="number" min={0} className="input" value={form.rawMaterialCost || ""} onChange={(e) => setForm((f) => ({ ...f, rawMaterialCost: Number(e.target.value) || 0 }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Available">
              <input type="number" min={0} className="input" value={form.available || ""} onChange={(e) => setForm((f) => ({ ...f, available: Number(e.target.value) || 0 }))} />
            </Field>
            <Field label="Low stock at">
              <input type="number" min={0} className="input" value={form.lowStockAt || ""} onChange={(e) => setForm((f) => ({ ...f, lowStockAt: Number(e.target.value) || 0 }))} />
            </Field>
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={add.isPending}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {add.isPending ? "Saving…" : "Add Model"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Existing models" subtitle="Stock and price edits save on blur.">
        <AsyncState isLoading={mq.isLoading} isError={mq.isError} error={mq.error} empty={rows.length === 0} emptyLabel="No models yet.">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Model</th>
                  <th className="px-4 py-3 sm:px-6">Category</th>
                  <th className="px-4 py-3 sm:px-6">Selling ₹</th>
                  <th className="px-4 py-3 sm:px-6">Available</th>
                  <th className="px-4 py-3 sm:px-6">Low at</th>
                  <th className="px-4 py-3 sm:px-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {rows.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 sm:px-6">
                      <p className="font-semibold">{m.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{m.sku} · {m.size}</p>
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <CategoryChip category={m.category} />
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <input
                        type="number"
                        defaultValue={m.sellingPrice}
                        onBlur={(e) => {
                          const v = Number(e.target.value) || 0;
                          if (v !== m.sellingPrice) patch.mutate({ id: m.id, sellingPrice: v });
                        }}
                        className="input h-8 w-24 py-0 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <input
                        type="number"
                        defaultValue={m.available}
                        onBlur={(e) => {
                          const v = Number(e.target.value) || 0;
                          if (v !== m.available) patch.mutate({ id: m.id, available: v });
                        }}
                        className="input h-8 w-20 py-0 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <input
                        type="number"
                        defaultValue={m.lowStockAt}
                        onBlur={(e) => {
                          const v = Number(e.target.value) || 0;
                          if (v !== m.lowStockAt) patch.mutate({ id: m.id, lowStockAt: v });
                        }}
                        className="input h-8 w-20 py-0 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3 text-right sm:px-6">
                      <IconButton label={`Delete ${m.name}`} disabled={remove.isPending} onClick={() => remove.mutate(m.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </Panel>
    </div>
  );
}

/* --------------------------------- Staff --------------------------------- */

const emptyWorker: WorkerInput = {
  name: "",
  role: "",
  category: "Production",
  operation: "",
  pieceRate: 0,
};

function WorkersAdmin({ flash }: { flash: Flash }) {
  const queryClient = useQueryClient();
  const wq = useQuery(workersQuery);
  const [form, setForm] = useState<WorkerInput>(emptyWorker);
  const rows = wq.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.workers });

  const add = useMutation({
    mutationFn: createWorker,
    onSuccess: () => {
      invalidate();
      setForm(emptyWorker);
      flash("ok", "Worker added.");
    },
    onError: (e) => flash("err", errText(e, "Could not add the worker.")),
  });
  const patch = useMutation({
    mutationFn: updateWorker,
    onSuccess: () => {
      invalidate();
      flash("ok", "Worker updated.");
    },
    onError: (e) => flash("err", errText(e, "Could not update the worker.")),
  });
  const remove = useMutation({
    mutationFn: deleteWorker,
    onSuccess: () => {
      invalidate();
      flash("ok", "Worker removed.");
    },
    onError: (e) => flash("err", errText(e, "Could not remove the worker.")),
  });

  return (
    <div className="space-y-6">
      <Panel title="Add workshop staff">
        <form
          className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) return;
            add.mutate(form);
          }}
        >
          <Field label="Name">
            <input required className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Role">
            <input className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="Polish / Painter" />
          </Field>
          <Field label="Category">
            <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as "Production" | "Painter" }))}>
              <option value="Production">Production</option>
              <option value="Painter">Painter</option>
            </select>
          </Field>
          <Field label="Operation">
            <input className="input" value={form.operation} onChange={(e) => setForm((f) => ({ ...f, operation: e.target.value }))} placeholder="Eye Drawing" />
          </Field>
          <Field label="Piece rate ₹">
            <input type="number" min={0} className="input" value={form.pieceRate || ""} onChange={(e) => setForm((f) => ({ ...f, pieceRate: Number(e.target.value) || 0 }))} />
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={add.isPending}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {add.isPending ? "Saving…" : "Add Worker"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Staff records" subtitle="Piece rate and attendance edits save immediately.">
        <AsyncState isLoading={wq.isLoading} isError={wq.isError} error={wq.error} empty={rows.length === 0} emptyLabel="No staff yet.">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Worker</th>
                  <th className="px-4 py-3 sm:px-6">Operation</th>
                  <th className="px-4 py-3 sm:px-6">Piece rate</th>
                  <th className="px-4 py-3 sm:px-6">Attendance</th>
                  <th className="px-4 py-3 text-right sm:px-6">Pending salary</th>
                  <th className="px-4 py-3 sm:px-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {rows.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 sm:px-6">
                      <p className="font-semibold">{w.name}</p>
                      <p className="text-[10px] text-muted-foreground">{w.id} · {w.category}</p>
                    </td>
                    <td className="px-4 py-3 text-xs sm:px-6">{w.operation}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <input
                        type="number"
                        defaultValue={w.pieceRate}
                        onBlur={(e) => {
                          const v = Number(e.target.value) || 0;
                          if (v !== w.pieceRate) patch.mutate({ id: w.id, pieceRate: v });
                        }}
                        className="input h-8 w-20 py-0 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <select
                        className="input h-8 py-0 text-xs"
                        value={w.attendance}
                        onChange={(e) => patch.mutate({ id: w.id, attendance: e.target.value })}
                      >
                        {["Present", "Half Day", "Late", "Absent"].map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs sm:px-6">{formatCurrency(w.pendingSalary)}</td>
                    <td className="px-4 py-3 text-right sm:px-6">
                      <IconButton label={`Remove ${w.name}`} disabled={remove.isPending} onClick={() => remove.mutate(w.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </Panel>
    </div>
  );
}

/* -------------------------------- Expenses ------------------------------- */

function ExpensesAdmin({ flash }: { flash: Flash }) {
  const queryClient = useQueryClient();
  const eq = useQuery(expensesQuery);
  const [form, setForm] = useState<ExpenseInput>({ date: "", category: "Colour", description: "", amount: 0 });
  const rows = eq.data ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.expenses });
    queryClient.invalidateQueries({ queryKey: qk.dashboard });
  };

  const add = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      invalidate();
      setForm({ date: "", category: "Colour", description: "", amount: 0 });
      flash("ok", "Expense recorded.");
    },
    onError: (e) => flash("err", errText(e, "Could not record the expense.")),
  });
  const remove = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      invalidate();
      flash("ok", "Expense deleted.");
    },
    onError: (e) => flash("err", errText(e, "Could not delete the expense.")),
  });

  return (
    <div className="space-y-6">
      <Panel title="Add expense">
        <form
          className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.description.trim() || form.amount <= 0) return;
            add.mutate({ ...form, date: form.date || new Date().toISOString().slice(0, 10) });
          }}
        >
          <Field label="Date">
            <input type="date" className="input" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Category">
            <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {["Colour", "Raw Material", "Transport", "Utility", "Labour", "Other"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Description">
            <input required className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <Field label="Amount ₹">
            <input type="number" min={1} className="input" value={form.amount || ""} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) || 0 }))} />
          </Field>
          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={add.isPending}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {add.isPending ? "Saving…" : "Add Expense"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Expense records">
        <AsyncState isLoading={eq.isLoading} isError={eq.isError} error={eq.error} empty={rows.length === 0} emptyLabel="No expenses yet.">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Date</th>
                  <th className="px-4 py-3 sm:px-6">Category</th>
                  <th className="px-4 py-3 sm:px-6">Description</th>
                  <th className="px-4 py-3 text-right sm:px-6">Amount</th>
                  <th className="px-4 py-3 sm:px-6">Paid by</th>
                  <th className="px-4 py-3 sm:px-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {rows.map((x) => (
                  <tr key={x.id} className="hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground sm:px-6">{formatDate(x.date)}</td>
                    <td className="px-4 py-3 text-xs sm:px-6">{x.category}</td>
                    <td className="px-4 py-3 text-xs sm:px-6">{x.description}</td>
                    <td className="px-4 py-3 text-right font-semibold sm:px-6">{formatCurrency(x.amount)}</td>
                    <td className="px-4 py-3 text-xs sm:px-6">{x.paidBy}</td>
                    <td className="px-4 py-3 text-right sm:px-6">
                      <IconButton label="Delete expense" disabled={remove.isPending} onClick={() => remove.mutate(x.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </Panel>
    </div>
  );
}

/* -------------------------------- Bookings ------------------------------- */

function BookingsAdmin({ flash }: { flash: Flash }) {
  const queryClient = useQueryClient();
  const bq = useQuery(bookingsQuery);
  const rows = bq.data ?? [];

  const patch = useMutation({
    mutationFn: updateBookingStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.bookings });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      flash("ok", "Booking status updated.");
    },
    onError: (e) => flash("err", errText(e, "Could not update the booking.")),
  });

  return (
    <Panel title="Bookings" subtitle="Override order status as tempos load and dispatch.">
      <AsyncState isLoading={bq.isLoading} isError={bq.isError} error={bq.error} empty={rows.length === 0} emptyLabel="No bookings yet.">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3 sm:px-6">Invoice</th>
                <th className="px-4 py-3 sm:px-6">Customer</th>
                <th className="px-4 py-3 sm:px-6">Channel</th>
                <th className="px-4 py-3 text-right sm:px-6">Amount</th>
                <th className="px-4 py-3 sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {rows.map((b) => (
                <tr key={b.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground sm:px-6">{b.id}</td>
                  <td className="px-4 py-3 sm:px-6">
                    <p className="font-semibold">{b.customer}</p>
                    <p className="text-[10px] text-muted-foreground">{b.modelName} × {b.qty}</p>
                  </td>
                  <td className="px-4 py-3 sm:px-6">
                    <TagChip tag={b.channel} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold sm:px-6">{formatCurrency(b.amount)}</td>
                  <td className="px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2">
                      <StatusPill status={b.status} />
                      <select
                        className="input h-8 py-0 text-xs"
                        value={b.status}
                        onChange={(e) => patch.mutate({ id: b.id, status: e.target.value as BookingStatus })}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncState>
    </Panel>
  );
}
