import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, AsyncState, CategoryChip, StatusPill } from "@/components/app-shell";
import { bookingsQuery, dashboardQuery, modelsQuery, temposQuery } from "@/lib/api/queries";
import { formatCurrency } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Manish Kala Kendra ERP" },
      {
        name: "description",
        content:
          "Live overview of stock, wholesale, retail, collections and net profit for the current Ganapati season.",
      },
      { property: "og:title", content: "Dashboard · Manish Kala Kendra ERP" },
      { property: "og:description", content: "Live overview of stock, wholesale, retail, collections and net profit for the current Ganapati season." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const kpisQ = useQuery(dashboardQuery);
  const bookingsQ = useQuery(bookingsQuery);
  const modelsQ = useQuery(modelsQuery);
  const temposQ = useQuery(temposQuery);

  const k = kpisQ.data;
  const bookings = bookingsQ.data ?? [];
  const models = modelsQ.data ?? [];
  const tempos = temposQ.data ?? [];
  const low = models.filter((m) => m.available < m.lowStockAt);

  const kpis = k
    ? [
        { label: "Total Stock", value: `${k.totalStock.toLocaleString("en-IN")}`, unit: "units", meta: "Across all SKUs" },
        { label: "Active Models", value: `${k.totalModels}`, unit: "SKUs", meta: `${k.lowStockCount} low stock` },
        { label: "Wholesale Business", value: formatCurrency(k.wholesaleValue), meta: `${k.wholesaleCount} orders` },
        { label: "Retail Business", value: formatCurrency(k.retailValue), meta: `${k.retailCount} bookings` },
        { label: "Total Collection", value: formatCurrency(k.collection), meta: "Advance + partial" },
        { label: "Pending Amount", value: formatCurrency(k.pending), meta: "Across all orders", accent: true },
        { label: "Expenses (MTD)", value: formatCurrency(k.expenses), meta: "Colour + other" },
        { label: "Staff Payments Due", value: formatCurrency(k.staffPayments), meta: "Piece-rate ledger" },
      ]
    : [];

  return (
    <AppShell title="Operational Overview" subtitle="Ganapati Season · Pune Workshop">
      <AsyncState isLoading={kpisQ.isLoading} isError={kpisQ.isError} error={kpisQ.error}>
        {k && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:mb-8 md:grid-cols-3 xl:grid-cols-4">
            {kpis.map((tile) => (
              <div
                key={tile.label}
                className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-tile)] sm:p-5"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                  {tile.label}
                </p>
                <h3 className={`mt-1 font-display text-xl sm:text-2xl ${tile.accent ? "text-secondary" : "text-foreground"}`}>
                  {tile.value}
                  {tile.unit && (
                    <span className="ml-1 font-sans text-xs text-muted-foreground">{tile.unit}</span>
                  )}
                </h3>
                <p className="mt-3 text-[10px] text-muted-foreground">{tile.meta}</p>
              </div>
            ))}

            <div className="col-span-2 rounded-xl bg-secondary p-4 text-white shadow-[var(--shadow-accent)] sm:p-5 md:col-span-3 xl:col-span-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                    Net Profit (Season to date)
                  </p>
                  <h3 className="mt-1 font-display text-3xl sm:text-4xl">{formatCurrency(k.netProfit)}</h3>
                </div>
                <div className="text-right text-[11px] text-white/80 sm:text-xs">
                  <p>Revenue: {formatCurrency(k.wholesaleValue + k.retailValue)}</p>
                  <p>Cost + Salary: {formatCurrency(k.expenses + k.staffPayments)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </AsyncState>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-tile)] lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h3 className="font-display text-lg">Recent Bookings</h3>
            <Link
              to="/wholesale"
              className="rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              View all orders
            </Link>
          </div>
          <AsyncState
            isLoading={bookingsQ.isLoading}
            isError={bookingsQ.isError}
            error={bookingsQ.error}
            empty={bookings.length === 0}
            emptyLabel="No bookings yet."
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3">Booking</th>
                    <th className="px-6 py-3">Customer / Village</th>
                    <th className="px-6 py-3">Model</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {bookings.slice(0, 5).map((b) => (
                    <tr key={b.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs text-muted-foreground">{b.id}</p>
                        <p className="text-[10px] text-muted-foreground">{b.channel}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">{b.customer}</p>
                        <p className="text-[10px] text-muted-foreground">{b.village}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium">{b.modelName}</p>
                        <p className="text-[10px] text-muted-foreground">Qty {b.qty} · {b.collector}</p>
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

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-tile)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Low Stock Alerts
              </h3>
              <Link to="/stock" className="text-[10px] font-semibold text-primary">
                Manage
              </Link>
            </div>
            <AsyncState
              isLoading={modelsQ.isLoading}
              isError={modelsQ.isError}
              error={modelsQ.error}
              empty={low.length === 0}
              emptyLabel="All stock levels are healthy."
            >
              <div className="space-y-3">
                {low.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <img
                      src={m.photo}
                      alt={m.name}
                      width={40}
                      height={40}
                      loading="lazy"
                      className="h-10 w-10 rounded-md object-cover outline-1 -outline-offset-1 outline-black/5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        SKU {m.sku} · <CategoryChip category={m.category} />
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg text-secondary">{m.available}</p>
                      <p className="text-[10px] text-muted-foreground">left</p>
                    </div>
                  </div>
                ))}
              </div>
            </AsyncState>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-tile)]">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Tempo Loading
            </h3>
            <AsyncState
              isLoading={temposQ.isLoading}
              isError={temposQ.isError}
              error={temposQ.error}
              empty={tempos.length === 0}
              emptyLabel="No tempos on the road."
            >
              <ul className="space-y-4 text-sm">
                {tempos.map((t) => (
                  <li key={t.id} className="flex items-center justify-between">
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
            </AsyncState>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
