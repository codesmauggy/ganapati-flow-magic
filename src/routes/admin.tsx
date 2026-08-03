import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Receipt, ShieldCheck, Trash2, Truck, Users, X, Pencil, Plus, Search, UserPlus, Loader2, FileText } from "lucide-react";
import { AppShell, AsyncState, CategoryChip, StatusPill, TagChip, ConfirmDialog } from "@/components/app-shell";
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
  usersQuery,
  createUser,
  updateUser,
  deleteUser,
  createBooking,
  createCustomer,
  type ExpenseInput,
  type ModelInput,
  type WorkerInput,
  type UserInput,
  type CustomerInput,
} from "@/lib/api/queries";
import { AuthUser, formatCurrency, formatDate, type BookingStatus, type Category, type CustomerTag } from "@/lib/types";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { MyProfile, type Flash } from "./profile";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console · Manish Kala Kendra" },
      {
        name: "description",
        content:
          "Admin console for master data entry and modification — customers, idol models, workshop staff, expenses and booking status overrides.",
      },
      { property: "og:title", content: "Admin Console · Manish Kala Kendra" },
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
  { id: "users", label: "Users", icon: Users },
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
  const isAdmin = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  const flash: Flash = (kind, text) => {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 3500);
  };

  if (!isAdmin) {
    return (
      <AppShell title="My Profile" subtitle="View and update your personal information">
        {msg && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              msg.kind === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {msg.text}
          </div>
        )}
        <MyProfile user={user} flash={flash} />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Admin Console"
      subtitle="Master data entry, corrections and status overrides"
    >
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-(--shadow-tile)">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="text-sm">
          <p className="font-semibold">
            Signed in as {user?.fullName || user?.username} · <span className="capitalize">{user?.role}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            {user?.role === "admin"
              ? "You have full write access. All changes are written straight to the backend database."
              : "Write access is enforced server‑side by role — non‑admin edits will be rejected by the API."}
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
      {tab === "users" && <UsersAdmin flash={flash} />}
    </AppShell>
  );
}

// ------------------------------------------------------------
// Helper components
// ------------------------------------------------------------

const errText = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

function Panel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-(--shadow-tile)">
      <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
        <div>
          <h2 className="font-display text-lg">{title}</h2>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
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

// ------------------------------------------------------------
// Admin panels (Customers, Models, Workers, Expenses, Bookings, Users)
// ------------------------------------------------------------

/* ------------------------------- Customers ------------------------------- */

function CustomersAdmin({ flash }: { flash: Flash }) {
  const queryClient = useQueryClient();
  const cq = useQuery(customersQuery);
  const rows = cq.data ?? [];
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();

  const emptyForm: CustomerInput = {
    name: "",
    contact: "",
    altContact: "",
    address: "",
    village: "",
    city: "",
    tag: "Retail",
    dob: "",
    gstin: "",
    notes: "",
  };
  const [form, setForm] = useState<CustomerInput>(emptyForm);

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

  const create = useMutation({
    mutationFn: createCustomer,
    onSuccess: (c) => {
      invalidate();
      setForm(emptyForm);
      setShowForm(false);
      flash("ok", `${c.name} added to the customer master.`);
    },
    onError: (e) => flash("err", errText(e, "Could not save the customer.")),
  });

  const handleDelete = (id: string, name: string) => setConfirmDelete({ id, name });
  const confirmDeleteAction = () => {
    if (confirmDelete) {
      remove.mutate(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const setField = (k: keyof CustomerInput) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const toggleButton = (
    <button
      type="button"
      onClick={() => setShowForm(!showForm)}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
    >
      {showForm ? "Cancel" : "Add Customer"}
    </button>
  );

  return (
    <>
      <Panel title="Customer records" subtitle="Change tag, activate or remove records. Add customers from the Customers page." action={toggleButton}>
        {showForm && (
          <section className="border-b border-border p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg">Add Customer</h2>
            </div>
            <form
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.name.trim() || !form.contact.trim()) {
                  flash("err", "Name and contact are required.");
                  return;
                }
                create.mutate({
                  ...form,
                  name: form.name.trim(),
                  contact: form.contact.trim(),
                  address: form.address.trim(),
                  altContact: form.altContact || undefined,
                  village: form.village || undefined,
                  city: form.city || undefined,
                  dob: form.dob || undefined,
                  gstin: form.gstin || undefined,
                  notes: form.notes || undefined,
                });
              }}
            >
              <Field label="Name (required)">
                <input required className="input" value={form.name} onChange={(e) => setField("name")(e.target.value)} placeholder="e.g. Rahul Rasal" />
              </Field>
              <Field label="Contact (required)">
                <input required className="input" value={form.contact} onChange={(e) => setField("contact")(e.target.value)} placeholder="98XXXXXXXX" />
              </Field>
              <Field label="Alternate contact">
                <input className="input" value={form.altContact} onChange={(e) => setField("altContact")(e.target.value)} />
              </Field>
              <Field label="Tag">
                <select className="input" value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value as CustomerTag }))}>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                </select>
              </Field>
              <Field label="Date of birth">
                <input type="date" className="input" value={form.dob} onChange={(e) => setField("dob")(e.target.value)} />
              </Field>
              <Field label="GSTIN (wholesale)">
                <input className="input" value={form.gstin} onChange={(e) => setField("gstin")(e.target.value)} />
              </Field>
              <Field label="Village / Taluka">
                <input className="input" value={form.village} onChange={(e) => setField("village")(e.target.value)} />
              </Field>
              <Field label="City / District">
                <input className="input" value={form.city} onChange={(e) => setField("city")(e.target.value)} />
              </Field>
              <Field label="Address">
                <input className="input" value={form.address} onChange={(e) => setField("address")(e.target.value)} placeholder="Street, landmark" />
              </Field>
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Notes">
                  <textarea className="input min-h-20" value={form.notes} onChange={(e) => setField("notes")(e.target.value)} />
                </Field>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground sm:col-span-2 lg:col-span-3">
                <span className="font-semibold text-foreground">Ref by:</span>{" "}
                {user?.fullName || user?.username || "—"} (set from the logged-in user on the server)
              </div>
              <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={create.isPending}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
                >
                  {create.isPending ? "Saving…" : "Save Customer"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

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
                      <IconButton label={`Delete ${c.name}`} disabled={remove.isPending} onClick={() => handleDelete(c.id, c.name)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </Panel>
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="Delete Customer"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
      />
    </>
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
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.models });
    queryClient.invalidateQueries({ queryKey: qk.dashboard });
  };

  const add = useMutation({
    mutationFn: createModel,
    onSuccess: () => {
      invalidate();
      setForm(emptyModel);
      setShowForm(false);
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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      flash("err", "SKU and Name are required.");
      return;
    }
    add.mutate(form);
  };

  const handleDelete = (id: string, name: string) => setConfirmDelete({ id, name });
  const confirmDeleteAction = () => {
    if (confirmDelete) {
      remove.mutate(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string, field: keyof ModelInput, currentValue: any) => {
    if (e.key === 'Enter') {
      const input = e.currentTarget;
      const value = field === 'sellingPrice' || field === 'available' || field === 'lowStockAt' || field === 'purchasePrice' || field === 'rawMaterialCost'
        ? Number(input.value) || 0
        : input.value;
      if (value !== currentValue) {
        patch.mutate({ id, [field]: value });
      }
      input.blur();
    }
  };

  const toggleButton = (
    <button
      type="button"
      onClick={() => setShowForm(!showForm)}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
    >
      {showForm ? "Cancel" : "Add Model"}
    </button>
  );

  return (
    <div className="space-y-6">
      <Panel title="Add New Model" action={toggleButton}>
        {showForm && (
          <form
            onSubmit={handleAddSubmit}
            className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4 sm:p-6 border-b border-border"
          >
            <Field label="SKU">
              <input
                required
                className="input"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                placeholder="GN-24-DG"
              />
            </Field>
            <Field label="Name">
              <input
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <Field label="Category">
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
              >
                <option value="Ganapati">Ganapati</option>
                <option value="Gauri">Gauri</option>
                <option value="Devi">Devi</option>
              </select>
            </Field>
            <Field label="Size">
              <input
                className="input"
                value={form.size}
                onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                placeholder="24 inch"
              />
            </Field>
            <Field label="Photo">
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setForm((f) => ({ ...f, photo: file || "" }));
                }}
              />
              {form.photo instanceof File && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Selected: {form.photo.name}
                </p>
              )}
            </Field>
            <Field label="Purchase price">
              <input
                type="number"
                min={0}
                className="input"
                value={form.purchasePrice || ""}
                onChange={(e) => setForm((f) => ({ ...f, purchasePrice: Number(e.target.value) || 0 }))}
              />
            </Field>
            <Field label="Selling price">
              <input
                type="number"
                min={0}
                className="input"
                value={form.sellingPrice || ""}
                onChange={(e) => setForm((f) => ({ ...f, sellingPrice: Number(e.target.value) || 0 }))}
              />
            </Field>
            <Field label="Raw material cost">
              <input
                type="number"
                min={0}
                className="input"
                value={form.rawMaterialCost || ""}
                onChange={(e) => setForm((f) => ({ ...f, rawMaterialCost: Number(e.target.value) || 0 }))}
              />
            </Field>
            <Field label="Available">
              <input
                type="number"
                min={0}
                className="input"
                value={form.available || ""}
                onChange={(e) => setForm((f) => ({ ...f, available: Number(e.target.value) || 0 }))}
              />
            </Field>
            <Field label="Low stock at">
              <input
                type="number"
                min={0}
                className="input"
                value={form.lowStockAt || ""}
                onChange={(e) => setForm((f) => ({ ...f, lowStockAt: Number(e.target.value) || 0 }))}
              />
            </Field>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={add.isPending}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {add.isPending ? "Saving…" : "Add Model"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

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
                        onKeyDown={(e) => handleKeyDown(e, m.id, 'sellingPrice', m.sellingPrice)}
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
                        onKeyDown={(e) => handleKeyDown(e, m.id, 'available', m.available)}
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
                        onKeyDown={(e) => handleKeyDown(e, m.id, 'lowStockAt', m.lowStockAt)}
                        onBlur={(e) => {
                          const v = Number(e.target.value) || 0;
                          if (v !== m.lowStockAt) patch.mutate({ id: m.id, lowStockAt: v });
                        }}
                        className="input h-8 w-20 py-0 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3 text-right sm:px-6">
                      <IconButton label={`Delete ${m.name}`} disabled={remove.isPending} onClick={() => handleDelete(m.id, m.name)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </Panel>
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="Delete Model"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
      />
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
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.workers });

  const add = useMutation({
    mutationFn: createWorker,
    onSuccess: () => {
      invalidate();
      setForm(emptyWorker);
      setShowForm(false);
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

  const handleDelete = (id: string, name: string) => setConfirmDelete({ id, name });
  const confirmDeleteAction = () => {
    if (confirmDelete) {
      remove.mutate(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const toggleButton = (
    <button
      type="button"
      onClick={() => setShowForm(!showForm)}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
    >
      {showForm ? "Cancel" : "Add Worker"}
    </button>
  );

  return (
    <div className="space-y-6">
      <Panel title="Add workshop staff" action={toggleButton}>
        {showForm && (
          <form
            className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 sm:p-6 border-b border-border"
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
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={add.isPending}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {add.isPending ? "Saving…" : "Add Worker"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

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
                      <IconButton label={`Remove ${w.name}`} disabled={remove.isPending} onClick={() => handleDelete(w.id, w.name)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </Panel>
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="Delete Worker"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
      />
    </div>
  );
}

/* -------------------------------- Expenses ------------------------------- */

function ExpensesAdmin({ flash }: { flash: Flash }) {
  const queryClient = useQueryClient();
  const eq = useQuery(expensesQuery);
  const [form, setForm] = useState<ExpenseInput>({ date: "", category: "Colour", description: "", amount: 0 });
  const rows = eq.data ?? [];
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; description: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.expenses });
    queryClient.invalidateQueries({ queryKey: qk.dashboard });
  };

  const add = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      invalidate();
      setForm({ date: "", category: "Colour", description: "", amount: 0 });
      setShowForm(false);
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

  const handleDelete = (id: string, description: string) => setConfirmDelete({ id, description });
  const confirmDeleteAction = () => {
    if (confirmDelete) {
      remove.mutate(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const toggleButton = (
    <button
      type="button"
      onClick={() => setShowForm(!showForm)}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
    >
      {showForm ? "Cancel" : "Add Expense"}
    </button>
  );

  return (
    <div className="space-y-6">
      <Panel title="Add expense" action={toggleButton}>
        {showForm && (
          <form
            className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-4 sm:p-6 border-b border-border"
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
            <div className="sm:col-span-4 flex items-center gap-2">
              <button
                type="submit"
                disabled={add.isPending}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {add.isPending ? "Saving…" : "Add Expense"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

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
                      <IconButton label="Delete expense" disabled={remove.isPending} onClick={() => handleDelete(x.id, x.description)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </Panel>
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="Delete Expense"
        message={`Are you sure you want to delete "${confirmDelete?.description}"?`}
        confirmLabel="Delete"
        isDestructive
      />
    </div>
  );
}

/* -------------------------------- Bookings ------------------------------- */

// ----- Types for wholesale items (local to this file) -----
type WholesaleItem = {
  id: string;
  sku: string;
  modelName: string;
  qty: number;
  amount: number;
};

type DistributedItem = WholesaleItem & { advance: number };

function BookingsAdmin({ flash }: { flash: Flash }) {
  const queryClient = useQueryClient();
  const bq = useQuery(bookingsQuery);
  const mq = useQuery(modelsQuery);
  const cq = useQuery(customersQuery);
  const { user } = useAuth();

  const rows = bq.data ?? [];
  const models = mq.data ?? [];
  const customers = cq.data ?? [];

  const [showForm, setShowForm] = useState(false);

  const patch = useMutation({
    mutationFn: updateBookingStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.bookings });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      flash("ok", "Booking status updated.");
    },
    onError: (e) => flash("err", errText(e, "Could not update the booking.")),
  });

  const toggleButton = (
    <button
      type="button"
      onClick={() => setShowForm(!showForm)}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
    >
      {showForm ? "Cancel" : "New Order"}
    </button>
  );

  return (
    <>
      <Panel title="Bookings" subtitle="Override order status as tempos load and dispatch." action={toggleButton}>
        {showForm && (
          <div className="border-b border-border p-4 sm:p-6">
            <NewOrderForm
              models={models}
              customers={customers}
              user={user}
              flash={flash}
              onSuccess={() => {
                setShowForm(false);
                queryClient.invalidateQueries({ queryKey: qk.bookings });
                queryClient.invalidateQueries({ queryKey: qk.models });
                queryClient.invalidateQueries({ queryKey: qk.dashboard });
                queryClient.invalidateQueries({ queryKey: customerKeys.all });
              }}
            />
          </div>
        )}

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
    </>
  );
}

/* -------------------------------- Users -------------------------------- */

function UsersAdmin({ flash }: { flash: Flash }) {
  const queryClient = useQueryClient();
  const uq = useQuery(usersQuery);
  const users = uq.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; username: string } | null>(null);

  const emptyUser: UserInput = {
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "staff",
    is_active: true,
  };
  const [newUser, setNewUser] = useState<UserInput>(emptyUser);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const create = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      invalidate();
      setNewUser(emptyUser);
      setShowForm(false);
      flash("ok", "User created.");
    },
    onError: (e) => flash("err", errText(e, "Could not create user.")),
  });

  const update = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      flash("ok", "User updated.");
    },
    onError: (e) => flash("err", errText(e, "Could not update user.")),
  });

  const remove = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      invalidate();
      flash("ok", "User deleted.");
    },
    onError: (e) => flash("err", errText(e, "Could not delete user.")),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username.trim() || !newUser.password) {
      flash("err", "Username and password are required.");
      return;
    }
    create.mutate(newUser);
  };

  const startEdit = (id: string) => setEditingId(id);
  const cancelEdit = () => setEditingId(null);

  const saveField = (id: string, field: keyof UserInput, value: any) => {
    const user = users.find((u) => String(u.id) === id);
    if (!user) return;
    const current = user[field as keyof AuthUser];
    if (String(current) === String(value)) return;
    update.mutate({ id, [field]: value });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, id: string, field: keyof UserInput, currentValue: any) => {
    if (e.key === 'Enter') {
      const target = e.currentTarget as HTMLInputElement;
      const value = target.value;
      if (value !== currentValue) {
        update.mutate({ id, [field]: value });
      }
      target.blur();
    }
  };

  const handleDelete = (id: string, username: string) => setConfirmDelete({ id, username });
  const confirmDeleteAction = () => {
    if (confirmDelete) {
      remove.mutate(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  const toggleButton = (
    <button
      type="button"
      onClick={() => setShowForm(!showForm)}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
    >
      {showForm ? "Cancel" : "Add User"}
    </button>
  );

  return (
    <>
      <Panel title="User accounts" subtitle="Manage system users and their roles." action={toggleButton}>
        {showForm && (
          <form onSubmit={handleCreate} className="border-b border-border p-4 sm:p-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Username">
              <input
                required
                className="input"
                value={newUser.username}
                onChange={(e) => setNewUser((f) => ({ ...f, username: e.target.value }))}
              />
            </Field>
            <Field label="Password">
              <input
                required
                type="password"
                className="input"
                value={newUser.password}
                onChange={(e) => setNewUser((f) => ({ ...f, password: e.target.value }))}
              />
            </Field>
            <Field label="Role">
              <select
                className="input"
                value={newUser.role}
                onChange={(e) => setNewUser((f) => ({ ...f, role: e.target.value as AuthUser["role"] }))}
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="wholesaler">Wholesaler</option>
                <option value="customer">Customer</option>
              </select>
            </Field>
            <Field label="First Name">
              <input
                className="input"
                value={newUser.first_name || ""}
                onChange={(e) => setNewUser((f) => ({ ...f, first_name: e.target.value }))}
              />
            </Field>
            <Field label="Last Name">
              <input
                className="input"
                value={newUser.last_name || ""}
                onChange={(e) => setNewUser((f) => ({ ...f, last_name: e.target.value }))}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className="input"
                value={newUser.email || ""}
                onChange={(e) => setNewUser((f) => ({ ...f, email: e.target.value }))}
              />
            </Field>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={create.isPending}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {create.isPending ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <AsyncState
          isLoading={uq.isLoading}
          isError={uq.isError}
          error={uq.error}
          empty={users.length === 0}
          emptyLabel="No users yet."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Username</th>
                  <th className="px-4 py-3 sm:px-6">Full Name</th>
                  <th className="px-4 py-3 sm:px-6">Email</th>
                  <th className="px-4 py-3 sm:px-6">Role</th>
                  <th className="px-4 py-3 sm:px-6">Active</th>
                  <th className="px-4 py-3 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {users.map((u) => {
                  const id = String(u.id);
                  const isEditing = editingId === id;
                  return (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 sm:px-6">
                        {isEditing ? (
                          <input
                            type="text"
                            defaultValue={u.username}
                            onKeyDown={(e) => handleKeyDown(e, id, 'username', u.username)}
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v && v !== u.username) saveField(id, 'username', v);
                            }}
                            className="input h-8 py-0 text-xs"
                          />
                        ) : (
                          <span className="font-mono text-xs">{u.username}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              defaultValue={u.first_name || ""}
                              onKeyDown={(e) => handleKeyDown(e, id, 'first_name', u.first_name)}
                              onBlur={(e) => {
                                const v = e.target.value;
                                if (v !== u.first_name) saveField(id, 'first_name', v);
                              }}
                              className="input h-8 py-0 text-xs w-20"
                              placeholder="First"
                            />
                            <input
                              type="text"
                              defaultValue={u.last_name || ""}
                              onKeyDown={(e) => handleKeyDown(e, id, 'last_name', u.last_name)}
                              onBlur={(e) => {
                                const v = e.target.value;
                                if (v !== u.last_name) saveField(id, 'last_name', v);
                              }}
                              className="input h-8 py-0 text-xs w-20"
                              placeholder="Last"
                            />
                          </div>
                        ) : (
                          `${u.fullName}`.trim() || "—"
                        )}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        {isEditing ? (
                          <input
                            type="email"
                            defaultValue={u.email || ""}
                            onKeyDown={(e) => handleKeyDown(e, id, 'email', u.email)}
                            onBlur={(e) => {
                              const v = e.target.value;
                              if (v !== u.email) saveField(id, 'email', v);
                            }}
                            className="input h-8 py-0 text-xs w-32"
                          />
                        ) : (
                          u.email || "—"
                        )}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        {isEditing ? (
                          <select
                            className="input h-8 py-0 text-xs"
                            defaultValue={u.role}
                            onChange={(e) => {
                              const v = e.target.value as AuthUser["role"];
                              if (v !== u.role) {
                                update.mutate({ id, role: v });
                              }
                            }}
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="staff">Staff</option>
                            <option value="wholesaler">Wholesaler</option>
                            <option value="customer">Customer</option>
                          </select>
                        ) : (
                          <span className="capitalize">{u.role}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <button
                          type="button"
                          onClick={() => {
                            const newActive = !u.is_active;
                            update.mutate({ id, is_active: newActive });
                          }}
                          className={`text-[11px] font-semibold ${
                            u.is_active ? "text-emerald-600" : "text-rose-600"
                          } hover:underline`}
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right sm:px-6">
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <button
                              onClick={cancelEdit}
                              className="text-muted-foreground hover:text-foreground"
                              title="Cancel editing"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => startEdit(id)}
                              className="text-muted-foreground hover:text-primary"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(id, u.username)}
                            className="text-muted-foreground hover:text-rose-600"
                            title="Delete"
                            disabled={remove.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </Panel>
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="Delete User"
        message={`Are you sure you want to delete "${confirmDelete?.username}"?`}
        confirmLabel="Delete"
        isDestructive
      />
    </>
  );
}

// ------------------------------------------------------------
// New Order Form (with flash support and explicit types)
// ------------------------------------------------------------

function NewOrderForm({
  models,
  customers,
  user,
  flash,
  onSuccess,
}: {
  models: any[];
  customers: any[];
  user: any;
  flash?: (kind: "ok" | "err", text: string) => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  const [orderType, setOrderType] = useState<"Retail" | "Wholesale">("Retail");

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [village, setVillage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [pickupDate, setPickupDate] = useState("");
  const [notes, setNotes] = useState("");

  const [modelSearch, setModelSearch] = useState("");
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState(1);
  const [amount, setAmount] = useState(0);
  const [advance, setAdvance] = useState(0);

  const [wholesaleAdvance, setWholesaleAdvance] = useState(0);
  const [items, setItems] = useState<WholesaleItem[]>([]);

  useEffect(() => {
    if (orderType === "Wholesale" && items.length === 0) {
      addItem();
    }
  }, [orderType]);

  const create = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.bookings });
      queryClient.invalidateQueries({ queryKey: qk.models });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      if (flash) flash("ok", "Order created successfully.");
      resetForm();
      onSuccess();
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Could not create booking.";
      if (flash) flash("err", msg);
      else alert(msg);
    },
  });

  const isSubmitting = create.isPending;

  const resetForm = () => {
    setCustomerId("");
    setCustomerName("");
    setMobile("");
    setVillage("");
    setSearchTerm("");
    setPickupDate("");
    setNotes("");
    setSku("");
    setModelSearch("");
    setQty(1);
    setAmount(0);
    setAdvance(0);
    setWholesaleAdvance(0);
    setItems([]);
  };

  const handleCustomerSelect = (c: any) => {
    setCustomerId(c.id);
    setCustomerName(c.name);
    setMobile(c.contact);
    setVillage(c.village ?? "");
    setSearchTerm(c.name);
    setShowSuggestions(false);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        sku: "",
        modelName: "",
        qty: 1,
        amount: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      const item = items.find((i) => i.id === id);
      if (item) {
        updateItem(id, "sku", "");
        updateItem(id, "modelName", "");
        updateItem(id, "qty", 1);
        updateItem(id, "amount", 0);
      }
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = <K extends keyof WholesaleItem>(
    id: string,
    field: K,
    value: WholesaleItem[K]
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const distributeAdvance = (items: WholesaleItem[], totalAdvance: number): DistributedItem[] => {
    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
    if (totalAmount === 0) {
      return items.map((i) => ({ ...i, advance: 0 }));
    }
    let remaining = totalAdvance;
    return items.map((item, index) => {
      const share = Math.round((item.amount / totalAmount) * totalAdvance);
      if (index === items.length - 1) {
        return { ...item, advance: remaining };
      }
      remaining -= share;
      return { ...item, advance: share };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      const msg = "Customer name is required.";
      if (flash) flash("err", msg);
      else alert(msg);
      return;
    }

    if (orderType === "Retail") {
      if (!sku) {
        const msg = "Please select a model.";
        if (flash) flash("err", msg);
        else alert(msg);
        return;
      }
      create.mutate({
        customerId: customerId || undefined,
        customer: customerName.trim(),
        mobile: mobile.trim() || undefined,
        village: village.trim() || undefined,
        modelSku: sku,
        qty,
        amount: amount || undefined,
        advance: advance || undefined,
        channel: "Retail",
        pickupDate: pickupDate || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      const invalid = items.some(
        (item) => !item.sku || item.qty < 1 || item.amount < 0
      );
      if (invalid) {
        const msg = "Please fill all item fields correctly.";
        if (flash) flash("err", msg);
        else alert(msg);
        return;
      }

      const distributedItems = distributeAdvance(items, wholesaleAdvance);

      const promises = distributedItems.map((item) =>
        create.mutateAsync({
          customerId: customerId || undefined,
          customer: customerName.trim(),
          mobile: mobile.trim() || undefined,
          village: village.trim() || undefined,
          modelSku: item.sku,
          qty: item.qty,
          amount: item.amount,
          advance: item.advance,
          channel: "Wholesale",
          pickupDate: pickupDate || undefined,
          notes: notes.trim() || undefined,
        })
      );
      Promise.all(promises)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: qk.bookings });
          queryClient.invalidateQueries({ queryKey: qk.models });
          queryClient.invalidateQueries({ queryKey: qk.dashboard });
          queryClient.invalidateQueries({ queryKey: customerKeys.all });
          if (flash) flash("ok", "Wholesale orders created successfully.");
          resetForm();
          onSuccess();
        })
        .catch((err) => {
          const msg = err instanceof ApiError ? err.message : "Could not create wholesale order.";
          if (flash) flash("err", msg);
          else alert(msg);
        });
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact.includes(searchTerm)
  );

  const filteredModels = models.filter(
    (m) =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.sku.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-1 rounded-lg border border-border p-1 w-fit">
        <button
          type="button"
          onClick={() => setOrderType("Retail")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
            orderType === "Retail"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          Retail
        </button>
        <button
          type="button"
          onClick={() => setOrderType("Wholesale")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
            orderType === "Wholesale"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          Wholesale
        </button>
      </div>

      <Field label="Customer Search">
        <div className="relative">
          <input
            type="text"
            className="input"
            placeholder="Search customer…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {showSuggestions && searchTerm.trim() !== "" && (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg">
              {filteredCustomers.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  No matching customers – you can type a new name below.
                </li>
              ) : (
                filteredCustomers.map((c) => (
                  <li
                    key={c.id}
                    className="cursor-pointer px-3 py-2 text-sm hover:bg-primary/10"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCustomerSelect(c);
                    }}
                  >
                    {c.name} · {c.contact} ({c.tag})
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </Field>

      <Field label="Customer Name *">
        <input
          required
          className="input"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="e.g. Rahul Rasal"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Mobile">
          <input
            className="input"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="98XXXXXXXX"
          />
        </Field>
        <Field label="Village">
          <input
            className="input"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="Optional"
          />
        </Field>
      </div>

      {orderType === "Retail" && (
        <>
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-4">
              <Field label="Model">
                <div className="relative">
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Search model by name or SKU…"
                    value={modelSearch}
                    onChange={(e) => {
                      setModelSearch(e.target.value);
                      setShowModelSuggestions(true);
                    }}
                    onFocus={() => setShowModelSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowModelSuggestions(false), 200)
                    }
                    disabled={models.length === 0}
                  />
                  {showModelSuggestions && modelSearch.trim() !== "" && (
                    <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg">
                      {filteredModels.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-muted-foreground">
                          No matching models
                        </li>
                      ) : (
                        filteredModels.map((m) => (
                          <li
                            key={m.sku}
                            className="cursor-pointer px-3 py-2 text-sm hover:bg-primary/10"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSku(m.sku);
                              setModelSearch(m.name);
                              setShowModelSuggestions(false);
                            }}
                          >
                            {m.name} — {formatCurrency(m.sellingPrice)}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              </Field>
            </div>
            <div className="col-span-1">
              <Field label="Qty">
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </Field>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount">
              <input
                type="number"
                min={0}
                className="input"
                value={amount || ""}
                onChange={(e) =>
                  setAmount(Math.max(0, Number(e.target.value) || 0))
                }
                placeholder="₹"
              />
            </Field>
            <Field label="Advance">
              <input
                type="number"
                min={0}
                className="input"
                value={advance || ""}
                onChange={(e) =>
                  setAdvance(Math.max(0, Number(e.target.value) || 0))
                }
                placeholder="₹"
              />
            </Field>
          </div>
        </>
      )}

      {orderType === "Wholesale" && (
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Line Items
          </label>
          {items.map((item) => (
            <div key={item.id} className="mt-2 rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium">
                  Item #{items.indexOf(item) + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-rose-500 hover:text-rose-700"
                  title={items.length === 1 ? "Clear fields" : "Remove item"}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Field label="Model">
                    <div className="relative">
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="Search model…"
                        value={item.modelName}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateItem(item.id, "modelName", val);
                        }}
                        onFocus={() => setShowModelSuggestions(true)}
                        onBlur={() =>
                          setTimeout(() => setShowModelSuggestions(false), 200)
                        }
                      />
                      {showModelSuggestions && (
                        <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg">
                          {models
                            .filter(
                              (m) =>
                                m.name
                                  .toLowerCase()
                                  .includes(item.modelName.toLowerCase()) ||
                                m.sku
                                  .toLowerCase()
                                  .includes(item.modelName.toLowerCase())
                            )
                            .map((m) => (
                              <li
                                key={m.sku}
                                className="cursor-pointer px-3 py-2 text-sm hover:bg-primary/10"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  updateItem(item.id, "sku", m.sku);
                                  updateItem(item.id, "modelName", m.name);
                                }}
                              >
                                {m.name} — {formatCurrency(m.sellingPrice)}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  </Field>
                </div>
                <div>
                  <Field label="Qty">
                    <input
                      type="number"
                      min={1}
                      className="input"
                      value={item.qty}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "qty",
                          Math.max(1, Number(e.target.value) || 1)
                        )
                      }
                    />
                  </Field>
                </div>
                <div>
                  <Field label="Amount">
                    <input
                      type="number"
                      min={0}
                      className="input"
                      value={item.amount || ""}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "amount",
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                      placeholder="₹"
                    />
                  </Field>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="mt-3 inline-flex items-center gap-1 rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Item
          </button>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/30 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Amount
              </span>
              <p className="text-lg font-semibold">{formatCurrency(totalAmount)}</p>
            </div>
            <Field label="Advance (Total)">
              <input
                type="number"
                min={0}
                className="input"
                value={wholesaleAdvance || ""}
                onChange={(e) =>
                  setWholesaleAdvance(Math.max(0, Number(e.target.value) || 0))
                }
                placeholder="₹"
              />
            </Field>
          </div>
        </div>
      )}

      <Field label="Notes (optional)">
        <textarea
          className="input"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special instructions or remarks…"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Pickup date">
          <input
            type="date"
            className="input"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
          />
        </Field>
        <Field label="Collector">
          <div className="rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground">
            {user?.fullName || user?.username || "—"}
          </div>
        </Field>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        ) : (
          "Confirm Order"
        )}
      </button>
    </form>
  );
}