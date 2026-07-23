import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, StatusPill } from "@/components/app-shell";
import { bookings, formatCurrency, models } from "@/lib/mock-data";

export const Route = createFileRoute("/retail")({
  head: () => ({
    meta: [
      { title: "Retail Counter · Manish Kala Kendra ERP" },
      {
        name: "description",
        content:
          "Quick retail booking, advance payments, and collector-assigned invoices for walk-in customers.",
      },
      { property: "og:title", content: "Retail Counter · Manish Kala Kendra ERP" },
      { property: "og:description", content: "Quick retail booking, advance payments, and collector-assigned invoices for walk-in customers." },
    ],
  }),
  component: RetailPage,
});

function RetailPage() {
  const rows = bookings.filter((b) => b.channel === "Retail");
  const [saved, setSaved] = useState<string | null>(null);
  const [customer, setCustomer] = useState("");

  const total = rows.reduce((s, b) => s + b.amount, 0);
  const collected = rows.reduce((s, b) => s + b.advance, 0);

  return (
    <AppShell
      title="Retail Counter"
      subtitle="Walk-in bookings · Collector auto-assigned from login"
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Tile label="Today's Bookings" value={String(rows.length)} />
        <Tile label="Retail Sales" value={formatCurrency(total)} />
        <Tile label="Advance Collected" value={formatCurrency(collected)} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-tile)] lg:col-span-2">
          <div className="border-b border-border px-6 py-4">
            <h3 className="font-display text-lg">Recent Retail Bookings</h3>
          </div>
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
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {b.id}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">{b.customer}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {b.village} · {b.mobile}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {b.modelName}{" "}
                      <span className="text-muted-foreground">× {b.qty}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">{b.collector}</td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold">{formatCurrency(b.amount)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Adv {formatCurrency(b.advance)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-tile)]">
          <h3 className="mb-4 font-display text-lg">Quick Booking</h3>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!customer.trim()) return;
              setSaved(`Booking created for ${customer}. Assigned to Manish.`);
              setCustomer("");
              setTimeout(() => setSaved(null), 3000);
            }}
          >
            <Field label="Customer Name (required)">
              <input
                required
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="input"
                placeholder="e.g. Rohit Jadhav"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mobile">
                <input className="input" placeholder="98XXXXXXXX" />
              </Field>
              <Field label="Village">
                <input className="input" placeholder="Optional" />
              </Field>
            </div>
            <Field label="Model">
              <select className="input" defaultValue={models[0].sku}>
                {models.map((m) => (
                  <option key={m.sku} value={m.sku}>
                    {m.name} — {formatCurrency(m.sellingPrice)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Advance">
                <input type="number" className="input" placeholder="₹" />
              </Field>
              <Field label="Pickup date">
                <input type="date" className="input" />
              </Field>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Collector:</span>{" "}
              Manish K. Salunke (from login)
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              Confirm Booking
            </button>
            {saved && (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                {saved}
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
          `}</style>
        </div>
      </div>
    </AppShell>
  );
}

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

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success";
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-tile)]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-2xl ${tone === "success" ? "text-emerald-700" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}
