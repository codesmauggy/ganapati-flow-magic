import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { formatCurrency } from "@/lib/mock-data";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses · Manish Kala Kendra ERP" },
      {
        name: "description",
        content:
          "Track colour, raw material and other workshop expenses by month, category and person.",
      },
    ],
  }),
  component: ExpensesPage,
});

const rows = [
  { date: "2026-07-18", category: "Colour", desc: "Golden paint 5L", amount: 8500, paidBy: "Manish" },
  { date: "2026-07-17", category: "Raw Material", desc: "Plaster of Paris (25 bags)", amount: 22500, paidBy: "Rupesh" },
  { date: "2026-07-16", category: "Transport", desc: "Tempo hire MH-12-AB-4521", amount: 4200, paidBy: "Eknath" },
  { date: "2026-07-15", category: "Colour", desc: "Red enamel paint", amount: 3400, paidBy: "Manish" },
  { date: "2026-07-14", category: "Utilities", desc: "Electricity bill (workshop)", amount: 12800, paidBy: "Manish" },
  { date: "2026-07-12", category: "Other", desc: "Packaging boxes", amount: 6100, paidBy: "Rupesh" },
];

function ExpensesPage() {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const byCategory = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + r.amount;
    return acc;
  }, {});

  return (
    <AppShell title="Expenses" subtitle="Monthly workshop expenses by category">
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile label="Month Total" value={formatCurrency(total)} accent />
        {Object.entries(byCategory).slice(0, 3).map(([k, v]) => (
          <Tile key={k} label={k} value={formatCurrency(v)} />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-tile)]">
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
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-muted/30">
                <td className="px-6 py-4 text-xs text-muted-foreground">{r.date}</td>
                <td className="px-6 py-4">
                  <span className="rounded bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                    {r.category}
                  </span>
                </td>
                <td className="px-6 py-4">{r.desc}</td>
                <td className="px-6 py-4 text-xs">{r.paidBy}</td>
                <td className="px-6 py-4 text-right font-semibold">
                  {formatCurrency(r.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
