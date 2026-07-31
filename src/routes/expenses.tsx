import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, AsyncState } from "@/components/app-shell";
import { expensesQuery } from "@/lib/api/queries";
import { formatCurrency } from "@/lib/types";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses · Manish Kala Kendra" },
      {
        name: "description",
        content: "Track colour, raw material and other workshop expenses by month, category and person.",
      },
      { property: "og:title", content: "Expenses · Manish Kala Kendra" },
      { property: "og:description", content: "Track colour, raw material and other workshop expenses by month, category and person." },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const q = useQuery(expensesQuery);
  const rows = q.data ?? [];
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const byCategory = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + r.amount;
    return acc;
  }, {});

  return (
    <AppShell title="Expenses" 
    subtitle="Monthly workshop expenses by category"
    actions={
      <button className="hidden items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 md:inline-flex">
        <Plus className="h-4 w-4" />
        New Expense
      </button>
    }
    >
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile label="Month Total" value={formatCurrency(total)} accent />
        {Object.entries(byCategory).slice(0, 3).map(([k, v]) => (
          <Tile key={k} label={k} value={formatCurrency(v)} />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-tile)]">
        <AsyncState
          isLoading={q.isLoading}
          isError={q.isError}
          error={q.error}
          empty={rows.length === 0}
          emptyLabel="No expenses recorded this month."
        >
          <table className="w-full text-left">
            <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Paid By</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 text-xs text-muted-foreground">{r.date}</td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                      {r.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">{r.description}</td>
                  <td className="px-6 py-4 text-xs">{r.paidBy}</td>
                  <td className="px-6 py-4 text-right font-semibold">{formatCurrency(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AsyncState>
      </div>
    </AppShell>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-tile)]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl ${accent ? "text-secondary" : ""}`}>{value}</p>
    </div>
  );
}
