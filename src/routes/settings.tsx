// src/routes/settings.tsx

import { createFileRoute } from "@tanstack/react-router";
import { AppShell, AsyncState } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/api/queries";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Manish Kala Kendra" },
      { name: "description", content: "Configure company details, collectors, categories and payment modes — the master data that powers every module of the workshop ERP." },
      { property: "og:title", content: "Settings · Manish Kala Kendra" },
      { property: "og:description", content: "Configure company details, collectors, categories and payment modes — the master data that powers every module of the workshop ERP." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data, isLoading, isError, error } = useQuery(settingsQuery);

  return (
    <AppShell title="Settings" subtitle="Company, users and master data">
      <AsyncState isLoading={isLoading} isError={isError} error={error}>
        {data && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card
              title="Company"
              rows={[
                ["Name", data.company.name],
                ["Since", data.company.since],
                ["Address", data.company.address],
                ["GST", data.company.gst],
              ]}
            />
            <Card
              title="Collectors"
              rows={data.collectors.map((c: any) => [c.name, c.role])}
            />
            <Card
              title="Categories"
              rows={data.categories.map((c: any) => [c.name, c.type])}
            />
            <Card
              title="Payment Modes"
              rows={data.paymentModes.map((p: any) => [p.name, p.enabled ? "Enabled" : "Disabled"])}
            />
          </div>
        )}
      </AsyncState>
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