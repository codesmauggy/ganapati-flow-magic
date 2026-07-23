import { createFileRoute } from "@tanstack/react-router";
import { Plus, Truck } from "lucide-react";
import { AppShell, StatusPill } from "@/components/app-shell";
import { bookings, formatCurrency } from "@/lib/mock-data";

export const Route = createFileRoute("/wholesale")({
  head: () => ({
    meta: [
      { title: "Wholesale Orders · Manish Kala Kendra ERP" },
      {
        name: "description",
        content:
          "Wholesale customer master, tempo loading, invoices, ledger and collection tracking.",
      },
      { property: "og:title", content: "Wholesale Orders · Manish Kala Kendra ERP" },
      { property: "og:description", content: "Wholesale customer master, tempo loading, invoices, ledger and collection tracking." },
    ],
  }),
  component: WholesalePage,
});

function WholesalePage() {
  const rows = bookings.filter((b) => b.channel === "Wholesale");
  const total = rows.reduce((s, b) => s + b.amount, 0);
  const collected = rows.reduce((s, b) => s + b.advance, 0);
  const pending = total - collected;

  return (
    <AppShell
      title="Wholesale Orders"
      subtitle="Tempo loading, invoicing, and customer ledger"
      actions={
        <button className="hidden items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 md:inline-flex">
          <Plus className="h-4 w-4" />
          New Order
        </button>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Tile label="Total Wholesale" value={formatCurrency(total)} />
        <Tile label="Collected" value={formatCurrency(collected)} tone="success" />
        <Tile label="Pending" value={formatCurrency(pending)} tone="secondary" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-tile)] lg:col-span-2">
          <div className="border-b border-border px-6 py-4">
            <h3 className="font-display text-lg">Open Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Invoice</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3 text-right">Qty</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-right">Pending</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {rows.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {b.id}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">{b.customer}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {b.village} · {b.mobile}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs">{b.modelName}</td>
                    <td className="px-6 py-4 text-right font-medium">{b.qty}</td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {formatCurrency(b.amount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-secondary">
                      {formatCurrency(b.amount - b.advance)}
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

        <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-tile)]">
          <div className="mb-4 flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Tempo Loading
            </h3>
          </div>
          <ul className="space-y-4 text-sm">
            {[
              { tempo: "MH-12-AB-4521", place: "Pune Hub", items: 45, status: "Loading" },
              { tempo: "MH-14-GH-8890", place: "Satara", items: 12, status: "Delivered" },
              { tempo: "MH-12-AZ-4421", place: "Nashik", items: 32, status: "Dispatched" },
              { tempo: "MH-13-EE-2098", place: "Kolhapur", items: 24, status: "Booked" },
            ].map((t) => (
              <li key={t.tempo} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{t.tempo}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.place} · {t.items} items
                  </p>
                </div>
                <StatusPill status={t.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "secondary";
}) {
  const cls =
    tone === "secondary"
      ? "text-secondary"
      : tone === "success"
        ? "text-emerald-700"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-tile)]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 font-display text-2xl ${cls}`}>{value}</p>
    </div>
  );
}
