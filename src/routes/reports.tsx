import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, AsyncState } from "@/components/app-shell";
import { bookingsQuery, dashboardQuery, modelsQuery, workersQuery } from "@/lib/api/queries";
import { formatCurrency } from "@/lib/types";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports · Manish Kala Kendra" },
      {
        name: "description",
        content: "Business, financial, inventory, collector and sales reports for the Ganapati season.",
      },
      { property: "og:title", content: "Reports · Manish Kala Kendra" },
      { property: "og:description", content: "Business, financial, inventory, collector and sales reports for the Ganapati season." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const dq = useQuery(dashboardQuery);
  const mq = useQuery(modelsQuery);
  const bq = useQuery(bookingsQuery);
  const wq = useQuery(workersQuery);

  const k = dq.data;
  const models = mq.data ?? [];
  const bookings = bq.data ?? [];
  const workers = wq.data ?? [];

  const salesByCategory = models.reduce<Record<string, number>>((acc, m) => {
    const sold = m.wholesaleSold + m.retailSold;
    acc[m.category] = (acc[m.category] ?? 0) + sold * m.sellingPrice;
    return acc;
  }, {});
  const collectors = bookings.reduce<Record<string, { collected: number; pending: number }>>(
    (acc, b) => {
      const c = acc[b.collector_fullName || b.collector] ?? { collected: 0, pending: 0 };
      c.collected += b.advance;
      c.pending += b.amount - b.advance;
      acc[b.collector_fullName || b.collector] = c;
      return acc;
    },
    {},
  );

  const anyLoading = dq.isLoading || mq.isLoading || bq.isLoading || wq.isLoading;
  const anyError = dq.isError || mq.isError || bq.isError || wq.isError;
  const firstError = dq.error || mq.error || bq.error || wq.error;

  return (
    <AppShell title="Reports" subtitle="Financial, sales, collectors and inventory">
      <AsyncState isLoading={anyLoading} isError={anyError} error={firstError}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Financial Summary">
            {k && (
              <>
                <Row label="Revenue" value={formatCurrency(k.wholesaleValue + k.retailValue)} />
                <Row label="Expenses" value={formatCurrency(k.expenses)} />
                <Row label="Staff Payments" value={formatCurrency(k.staffPayments)} />
                <Row label="Net Profit" value={formatCurrency(k.netProfit)} accent />
              </>
            )}
          </Card>

          <Card title="Sales by Category">
            {Object.entries(salesByCategory).map(([cat, val]) => (
              <Row key={cat} label={cat} value={formatCurrency(val)} />
            ))}
          </Card>

          <Card title="Collectors">
            {Object.entries(collectors).map(([name, v]) => (
              <div
                key={name}
                className="flex items-center justify-between border-b border-border py-3 last:border-0"
              >
                <p className="text-sm font-semibold">{name}</p>
                <div className="text-right text-xs">
                  <p className="text-emerald-700">Collected {formatCurrency(v.collected)}</p>
                  <p className="text-secondary">Pending {formatCurrency(v.pending)}</p>
                </div>
              </div>
            ))}
          </Card>

          <Card title="Inventory Valuation">
            <Row
              label="Total Stock"
              value={`${models.reduce((s, m) => s + m.available, 0).toLocaleString("en-IN")} units`}
            />
            <Row
              label="Stock Value (Selling)"
              value={formatCurrency(models.reduce((s, m) => s + m.available * m.sellingPrice, 0))}
            />
            <Row
              label="Raw Material Value"
              value={formatCurrency(models.reduce((s, m) => s + m.available * m.rawMaterialCost, 0))}
            />
            <Row label="Active Workers" value={String(workers.length)} />
          </Card>
        </div>
      </AsyncState>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-tile)]">
      <h3 className="mb-4 font-display text-lg">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`font-display text-lg ${accent ? "text-secondary" : ""}`}>{value}</p>
    </div>
  );
}
