import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, UserPlus } from "lucide-react";
import { AppShell, AsyncState, TagChip } from "@/components/app-shell";
import {
  createCustomer,
  customerKeys,
  customersQuery,
  type CustomerInput,
} from "@/lib/api/queries";
import { formatCurrency, formatDate, type CustomerTag } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";

export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [
      { title: "Customers · Manish Kala Kendra" },
      {
        name: "description",
        content:
          "Customer master with contact, address, retail or wholesale tag, birthday, referrer and full transaction plus payment history.",
      },
      { property: "og:title", content: "Customers · Manish Kala Kendra" },
      {
        property: "og:description",
        content:
          "Customer master with contact, address, retail or wholesale tag, birthday, referrer and full transaction plus payment history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomersPage,
});

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

function CustomersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const cq = useQuery(customersQuery);

  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"All" | CustomerTag>("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CustomerInput>(emptyForm);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const create = useMutation({
    mutationFn: createCustomer,
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      setForm(emptyForm);
      setShowForm(false);
      setMsg({ kind: "ok", text: `${c.name} added to the customer master.` });
      setTimeout(() => setMsg(null), 3500);
    },
    onError: (err) =>
      setMsg({
        kind: "err",
        text: err instanceof ApiError ? err.message : "Could not save the customer.",
      }),
  });

  const all = cq.data ?? [];
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((c) => {
      if (tab !== "All" && c.tag !== tab) return false;
      if (!needle) return true;
      return (
        c.name.toLowerCase().includes(needle) ||
        c.contact.toLowerCase().includes(needle) ||
        (c.village ?? "").toLowerCase().includes(needle) ||
        (c.address ?? "").toLowerCase().includes(needle)
      );
    });
  }, [all, q, tab]);

  const billed = rows.reduce((s, c) => s + c.totalBilled, 0);
  const paid = rows.reduce((s, c) => s + c.totalPaid, 0);

  const set = (k: keyof CustomerInput) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <AppShell
      title="Customers"
      subtitle="Customer master · ledger, payments and referral tracking"
      actions={
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Customer</span>
        </button>
      }
    >
      {msg && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            msg.kind === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Tile label="Customers" value={String(rows.length)} />
        <Tile
          label="Wholesale / Retail"
          value={`${all.filter((c) => c.tag === "Wholesale").length} / ${all.filter((c) => c.tag === "Retail").length}`}
        />
        <Tile label="Total Billed" value={formatCurrency(billed)} />
        <Tile label="Outstanding" value={formatCurrency(billed - paid)} tone="secondary" />
      </div>

      {showForm && (
        <section className="mb-6 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-tile)] sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg">Add Customer</h2>
          </div>
          <form
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name.trim() || !form.contact.trim()) return;
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
              <input required className="input" value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Rahul Rasal" />
            </Field>
            <Field label="Contact (required)">
              <input required className="input" value={form.contact} onChange={(e) => set("contact")(e.target.value)} placeholder="98XXXXXXXX" />
            </Field>
            <Field label="Alternate contact">
              <input className="input" value={form.altContact} onChange={(e) => set("altContact")(e.target.value)} />
            </Field>
            <Field label="Tag">
              <select className="input" value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value as CustomerTag }))}>
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
              </select>
            </Field>
            <Field label="Date of birth">
              <input type="date" className="input" value={form.dob} onChange={(e) => set("dob")(e.target.value)} />
            </Field>
            <Field label="GSTIN (wholesale)">
              <input className="input" value={form.gstin} onChange={(e) => set("gstin")(e.target.value)} />
            </Field>
            <Field label="Village / Taluka">
              <input className="input" value={form.village} onChange={(e) => set("village")(e.target.value)} />
            </Field>
            <Field label="City / District">
              <input className="input" value={form.city} onChange={(e) => set("city")(e.target.value)} />
            </Field>
            <Field label="Address">
              <input className="input" value={form.address} onChange={(e) => set("address")(e.target.value)} placeholder="Street, landmark" />
            </Field>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Notes">
                <textarea className="input min-h-20" value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["All", "Retail", "Wholesale"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                tab === t
                  ? "rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  : "rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
              }
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, mobile, village…"
            className="input pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-tile)]">
        <AsyncState
          isLoading={cq.isLoading}
          isError={cq.isError}
          error={cq.error}
          empty={rows.length === 0}
          emptyLabel="No customers match this filter yet."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 sm:px-6">Customer</th>
                  <th className="px-4 py-3 sm:px-6">Tag</th>
                  <th className="px-4 py-3 sm:px-6">Address</th>
                  <th className="px-4 py-3 sm:px-6">Ref By</th>
                  <th className="px-4 py-3 text-right sm:px-6">Billed</th>
                  <th className="px-4 py-3 text-right sm:px-6">Balance</th>
                  <th className="px-4 py-3 sm:px-6">Last Txn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {rows.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-4 sm:px-6">
                      <Link
                        to="/customers/$customerId"
                        params={{ customerId: c.id }}
                        className="font-semibold text-foreground hover:text-primary"
                      >
                        {c.name}
                      </Link>
                      <p className="text-[10px] text-muted-foreground">
                        {c.contact}
                        {c.dob ? ` · DOB ${formatDate(c.dob)}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <TagChip tag={c.tag} />
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground sm:px-6">
                      {[c.village, c.city].filter(Boolean).join(", ") || c.address || "—"}
                    </td>
                    <td className="px-4 py-4 text-xs sm:px-6">{c.refBy || "—"}</td>
                    <td className="px-4 py-4 text-right font-semibold sm:px-6">{formatCurrency(c.totalBilled)}</td>
                    <td
                      className={`px-4 py-4 text-right font-mono text-xs sm:px-6 ${
                        c.balance > 0 ? "text-secondary" : "text-emerald-700"
                      }`}
                    >
                      {formatCurrency(c.balance)}
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground sm:px-6">
                      {formatDate(c.lastTransactionDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </div>
    </AppShell>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "secondary" }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-tile)] sm:p-5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[11px]">{label}</p>
      <p className={`mt-1 font-display text-xl sm:text-2xl ${tone === "secondary" ? "text-secondary" : ""}`}>{value}</p>
    </div>
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
