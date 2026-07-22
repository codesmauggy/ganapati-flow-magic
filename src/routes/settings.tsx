import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Manish Kala Kendra ERP" },
      { name: "description", content: "Company, users and configurable master data." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Company, users and master data">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Company"
          rows={[
            ["Name", "Manish Kala Kendra"],
            ["Since", "1989"],
            ["Address", "Pune, Maharashtra"],
            ["GST", "27ABCDE1234F1Z5"],
          ]}
        />
        <Card
          title="Collectors"
          rows={[
            ["Manish", "Administrator"],
            ["Rupesh", "Wholesale"],
            ["Eknath", "Retail"],
          ]}
        />
        <Card
          title="Categories"
          rows={[
            ["Ganapati", "Primary"],
            ["Gauri", "Seasonal"],
            ["Devi", "Year-round"],
          ]}
        />
        <Card
          title="Payment Modes"
          rows={[
            ["Cash", "Enabled"],
            ["UPI", "Enabled"],
            ["Bank Transfer", "Enabled"],
            ["Cheque", "Enabled"],
          ]}
        />
      </div>
    </AppShell>
  );
}

function Card({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-tile)]">
      <h3 className="mb-4 font-display text-lg">{title}</h3>
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between border-b border-border py-3 last:border-0">
          <p className="text-sm text-muted-foreground">{k}</p>
          <p className="text-sm font-semibold">{v}</p>
        </div>
      ))}
    </div>
  );
}
