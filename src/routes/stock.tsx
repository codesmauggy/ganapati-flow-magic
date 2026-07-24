import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { AppShell, AsyncState, CategoryChip } from "@/components/app-shell";
import { modelsQuery } from "@/lib/api/queries";
import { formatCurrency, type Category } from "@/lib/types";

export const Route = createFileRoute("/stock")({
  head: () => ({
    meta: [
      { title: "Stock Inventory · Manish Kala Kendra ERP" },
      {
        name: "description",
        content:
          "Ganapati, Gauri and Devi models with photos, live stock, purchase and selling prices, and low-stock alerts.",
      },
      { property: "og:title", content: "Stock Inventory · Manish Kala Kendra ERP" },
      { property: "og:description", content: "Ganapati, Gauri and Devi models with photos, live stock, purchase and selling prices, and low-stock alerts." },
    ],
  }),
  component: StockPage,
});

const categories: (Category | "All")[] = ["All", "Ganapati", "Gauri", "Devi"];

function StockPage() {
  const [category, setCategory] = useState<Category | "All">("All");
  const [query, setQuery] = useState("");
  const q = useQuery(modelsQuery);
  const models = q.data ?? [];

  const filtered = useMemo(() => {
    return models.filter((m) => {
      const catOk = category === "All" || m.category === category;
      const s = query.trim().toLowerCase();
      const qOk = !s || m.name.toLowerCase().includes(s) || m.sku.toLowerCase().includes(s);
      return catOk && qOk;
    });
  }, [category, query, models]);

  const totals = useMemo(
    () => ({
      count: filtered.reduce((s, m) => s + m.available, 0),
      value: filtered.reduce((s, m) => s + m.available * m.sellingPrice, 0),
      raw: filtered.reduce((s, m) => s + m.available * m.rawMaterialCost, 0),
    }),
    [filtered],
  );

  return (
    <AppShell
      title="Stock Inventory"
      subtitle="Every model, live availability and valuation"
      actions={
        <button className="hidden items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 md:inline-flex">
          <Plus className="h-4 w-4" />
          New Model
        </button>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryTile label="Total Available Units" value={totals.count.toLocaleString("en-IN")} />
        <SummaryTile label="Current Stock Value" value={formatCurrency(totals.value)} />
        <SummaryTile label="Raw Material Value" value={formatCurrency(totals.raw)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={
                category === c
                  ? "rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
              }
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by model or SKU..."
            className="h-9 w-72 rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary/40"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-tile)]">
        <AsyncState
          isLoading={q.isLoading}
          isError={q.isError}
          error={q.error}
          empty={filtered.length === 0}
          emptyLabel="No models match your filter."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Size</th>
                  <th className="px-6 py-3 text-right">Purchase</th>
                  <th className="px-6 py-3 text-right">Selling</th>
                  <th className="px-6 py-3 text-right">Available</th>
                  <th className="px-6 py-3 text-right">Stock Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filtered.map((m) => {
                  const low = m.available < m.lowStockAt;
                  return (
                    <tr key={m.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={m.photo}
                            alt={m.name}
                            width={44}
                            height={44}
                            loading="lazy"
                            className="h-11 w-11 rounded-md object-cover outline-1 -outline-offset-1 outline-black/5"
                          />
                          <div>
                            <p className="font-semibold">{m.name}</p>
                            <p className="text-[10px] text-muted-foreground">SKU: {m.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <CategoryChip category={m.category} />
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{m.size}</td>
                      <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                        {formatCurrency(m.purchasePrice)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatCurrency(m.sellingPrice)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium">{m.available}</span>
                        {low ? <span className="ml-2 text-[10px] font-bold text-secondary">LOW</span> : null}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs">
                        {formatCurrency(m.available * m.sellingPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </div>
    </AppShell>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-tile)]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}
