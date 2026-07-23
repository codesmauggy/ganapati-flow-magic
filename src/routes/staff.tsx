import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusPill } from "@/components/app-shell";
import { formatCurrency, workers } from "@/lib/mock-data";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff & Salary · Manish Kala Kendra ERP" },
      {
        name: "description",
        content:
          "Workshop staff, attendance, piece-rate production and salary ledger with carry-forward.",
      },
      { property: "og:title", content: "Staff & Salary · Manish Kala Kendra ERP" },
      { property: "og:description", content: "Workshop staff, attendance, piece-rate production and salary ledger with carry-forward." },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  const totalDue = workers.reduce((s, w) => s + w.pendingSalary, 0);
  const producedToday = workers.reduce((s, w) => s + w.todayProduction, 0);
  const present = workers.filter((w) => w.attendance === "Present").length;

  return (
    <AppShell
      title="Staff & Salary"
      subtitle="Piece-rate production, attendance and salary ledger"
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Tile label="Total Workers" value={String(workers.length)} />
        <Tile label="Present Today" value={`${present} / ${workers.length}`} />
        <Tile label="Idols Produced Today" value={producedToday.toLocaleString("en-IN")} />
        <Tile label="Salary Due" value={formatCurrency(totalDue)} tone="secondary" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-tile)]">
        <div className="border-b border-border px-6 py-4">
          <h3 className="font-display text-lg">Workshop Roster</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Worker</th>
                <th className="px-6 py-3">Operation</th>
                <th className="px-6 py-3">Attendance</th>
                <th className="px-6 py-3 text-right">Piece Rate</th>
                <th className="px-6 py-3 text-right">Today</th>
                <th className="px-6 py-3 text-right">Today's Earning</th>
                <th className="px-6 py-3 text-right">Pending Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {workers.map((w) => (
                <tr key={w.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {w.name
                          .split(" ")
                          .map((s) => s[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <p className="font-semibold">{w.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {w.id} · {w.category}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs">{w.operation}</td>
                  <td className="px-6 py-4">
                    <StatusPill status={w.attendance} />
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs">
                    ₹ {w.pieceRate}/pc
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {w.todayProduction}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">
                    {formatCurrency(w.todayProduction * w.pieceRate)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-secondary">
                    {formatCurrency(w.pendingSalary)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  tone?: "secondary";
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-tile)]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-2xl ${tone === "secondary" ? "text-secondary" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}
