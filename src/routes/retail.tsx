import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Truck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, AsyncState, StatusPill } from "@/components/app-shell";
import { bookingsQuery, createBooking, customerKeys, customersQuery, modelsQuery, qk } from "@/lib/api/queries";
import { formatCurrency } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";

export const Route = createFileRoute("/retail")({
  head: () => ({
    meta: [
      { title: "Retail Orders · Manish Kala Kendra" },
      {
        name: "description",
        content: "Quick retail booking, advance payments, and collector-assigned invoices for walk-in customers.",
      },
      { property: "og:title", content: "Retail Orders · Manish Kala Kendra" },
      { property: "og:description", content: "Quick retail booking, advance payments, and collector-assigned invoices for walk-in customers." },
    ],
  }),
  component: RetailPage,
});

function RetailPage() {
  const { user } = useAuth();
  const bq = useQuery(bookingsQuery);
  const mq = useQuery(modelsQuery);
  const cq = useQuery(customersQuery);
  const queryClient = useQueryClient();

  const rows = (bq.data ?? []).filter((b) => b.channel === "Retail");
  const models = mq.data ?? [];

  const total = rows.reduce((s, b) => s + b.amount, 0);
  const collected = rows.reduce((s, b) => s + b.advance, 0);

  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState("");
  const [mobile, setMobile] = useState("");
  const [village, setVillage] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState(1);
  const [amount, setAmount] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [pickup, setPickup] = useState("");
  const [notes, setNotes] = useState("");   // new state
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const create = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.bookings });
      queryClient.invalidateQueries({ queryKey: qk.models });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      setMsg({ kind: "ok", text: `Booking created for ${customer}.` });
      setCustomerId("");
      setCustomer("");
      setMobile("");
      setVillage("");
      setQty(1);
      setAmount(0);
      setAdvance(0);
      setPickup("");
      setNotes("");           // clear notes
      setTimeout(() => setMsg(null), 3500);
    },
    onError: (err) => {
      setMsg({
        kind: "err",
        text: err instanceof ApiError ? err.message : "Could not create the booking.",
      });
    },
  });

  const activeSku = sku || models[0]?.sku || "";

  return (
    <AppShell
      title="Retail Orders"
      subtitle="Walk-in bookings · Collector auto-assigned from login"
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Tile label="Today's Bookings" value={String(rows.length)} />
        <Tile label="Retail Sales" value={formatCurrency(total)} />
        <Tile label="Advance Collected" value={formatCurrency(collected)} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Bookings Table - unchanged */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-tile)] lg:col-span-2">
          <div className="border-b border-border px-6 py-4">
            <h3 className="font-display text-lg">Recent Retail Bookings</h3>
          </div>
          <AsyncState
            isLoading={bq.isLoading}
            isError={bq.isError}
            error={bq.error}
            empty={rows.length === 0}
            emptyLabel="No retail bookings yet."
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3">Booking</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Model</th>
                    <th className="px-6 py-3">Collector</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {rows.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{b.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">{b.customer}</p>
                        <p className="text-[10px] text-muted-foreground">{b.village} · {b.mobile}</p>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {b.modelName} <span className="text-muted-foreground">× {b.qty}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {b.collector_fullName || b.collector}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold">{formatCurrency(b.amount)}</p>
                        <p className="text-[10px] text-muted-foreground">Adv {formatCurrency(b.advance)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AsyncState>
        </div>

        {/* Quick Booking Form */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-tile)]">
          <h3 className="mb-4 font-display text-lg">Quick Booking</h3>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!customer.trim() || !activeSku) return;
              create.mutate({
                customerId: customerId || undefined,
                customer: customer.trim(),
                mobile: mobile.trim() || undefined,
                village: village.trim() || undefined,
                modelSku: activeSku,
                qty,
                amount: amount || undefined,
                advance: advance || undefined,
                channel: "Retail",
                pickupDate: pickup || undefined,
                notes: notes.trim() || undefined,
              });
            }}
          >
            {/* Customer Search */}
            <Field label="Customer Search">
              <div className="relative">
                <input
                  type="text"
                  className="input"
                  placeholder="Type to search customer..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                />
                {showSuggestions && searchTerm.trim() !== "" && (
                  <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg">
                    {(cq.data ?? [])
                      .filter((c) =>
                        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.contact.includes(searchTerm)
                      )
                      .map((c) => (
                        <li
                          key={c.id}
                          className="cursor-pointer px-3 py-2 text-sm hover:bg-primary/10"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCustomerId(c.id);
                            setCustomer(c.name);
                            setMobile(c.contact);
                            setVillage(c.village ?? "");
                            setSearchTerm(c.name);
                            setShowSuggestions(false);
                          }}
                        >
                          {c.name} · {c.contact} ({c.tag})
                        </li>
                      ))}
                    {((cq.data ?? []).filter(
                      (c) =>
                        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.contact.includes(searchTerm)
                    ).length === 0) && (
                      <li className="px-3 py-2 text-sm text-muted-foreground">
                        No matching customers – you can type a new name below.
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </Field>

            {/* Customer Name */}
            <Field label="Customer Name (required)">
              <input
                required
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="input"
                placeholder="e.g. Rahul Rasal"
              />
            </Field>

            {/* Mobile & Village */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mobile">
                <input className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="98XXXXXXXX" />
              </Field>
              <Field label="Village">
                <input className="input" value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Optional" />
              </Field>
            </div>

            {/* Model & Qty */}
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
                      onBlur={() => setTimeout(() => setShowModelSuggestions(false), 200)}
                      disabled={models.length === 0}
                    />
                    {showModelSuggestions && modelSearch.trim() !== "" && (
                      <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg">
                        {models
                          .filter((m) =>
                            m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
                            m.sku.toLowerCase().includes(modelSearch.toLowerCase())
                          )
                          .map((m) => (
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
                          ))}
                        {models.filter(
                          (m) =>
                            m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
                            m.sku.toLowerCase().includes(modelSearch.toLowerCase())
                        ).length === 0 && (
                          <li className="px-3 py-2 text-sm text-muted-foreground">
                            No matching models
                          </li>
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
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  />
                </Field>
              </div>
            </div>

            {/* Amount & Advance */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount">
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={amount || ""}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="₹"
                />
              </Field>
              <Field label="Advance">
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={advance || ""}
                  onChange={(e) => setAdvance(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="₹"
                />
              </Field>
            </div>

            {/* Notes */}
            <Field label="Notes (optional)">
              <textarea
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any special instructions or remarks..."
              />
            </Field>

            {/* Pickup Date & Collector combined */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pickup date">
                <input type="date" className="input" value={pickup} onChange={(e) => setPickup(e.target.value)} />
              </Field>
              <Field label="Collector">
                <div className="rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground">
                  {user?.fullName || user?.username || "—"}
                </div>
              </Field>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={create.isPending || models.length === 0}
              className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {create.isPending ? "Saving…" : "Confirm Booking"}
            </button>
            {msg && (
              <p
                className={`rounded-md px-3 py-2 text-xs font-medium ${
                  msg.kind === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
              >
                {msg.text}
              </p>
            )}
          </form>

          <style>{`
            .input {
              width: 100%;
              padding: 0.5rem 0.75rem;
              background-color: var(--color-muted);
              border: 1px solid var(--color-border);
              border-radius: 0.5rem;
              font-size: 0.875rem;
              outline: none;
            }
            .input:focus {
              border-color: color-mix(in oklab, var(--color-primary) 45%, transparent);
              background-color: var(--color-surface);
            }
            textarea.input {
              resize: vertical;
            }
          `}</style>
        </div>
      </div>
    </AppShell>
  );
}

// Helper components remain unchanged
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-tile)]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl ${tone === "success" ? "text-emerald-700" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}