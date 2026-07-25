import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, IndianRupee, Pencil, Save } from "lucide-react";
import { AppShell, AsyncState, StatusPill, TagChip } from "@/components/app-shell";
import {
  createPayment,
  customerKeys,
  customerLedgerQuery,
  qk,
  updateCustomer,
  type CustomerInput,
} from "@/lib/api/queries";
import { PAYMENT_MODES, formatCurrency, formatDate, type CustomerTag, type PaymentMode } from "@/lib/types";
import { ApiError } from "@/lib/api-client";

export const Route = createFileRoute("/customers/$customerId")({
  head: () => ({
    meta: [
      { title: "Customer Ledger · Manish Kala Kendra ERP" },
      {
        name: "description",
        content:
          "Single customer profile with running ledger, booking history, payment receipts and outstanding balance.",
      },
      { property: "og:title", content: "Customer Ledger · Manish Kala Kendra ERP" },
      {
        property: "og:description",
        content:
          "Single customer profile with running ledger, booking history, payment receipts and outstanding balance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CustomerDetailPage,
});

function CustomerDetailPage() {
  const { customerId } = Route.useParams();
  const queryClient = useQueryClient();
  const lq = useQuery(customerLedgerQuery(customerId));

  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<Partial<CustomerInput>>({});
  const [amount, setAmount] = useState<number>(0);
  const [mode, setMode] = useState<PaymentMode>("Cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: customerKeys.all });
    queryClient.invalidateQueries({ queryKey: customerKeys.ledger(customerId) });
    queryClient.invalidateQueries({ queryKey: qk.dashboard });
  };

  const pay = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      invalidate();
      setAmount(0);
      setReference("");
      setNote("");
      setMsg({ kind: "ok", text: "Payment recorded." });
      setTimeout(() => setMsg(null), 3000);
    },
    onError: (err) =>
      setMsg({ kind: "err", text: err instanceof ApiError ? err.message : "Could not record the payment." }),
  });

  const save = useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      invalidate();
      setEdit(false);
      setDraft({});
      setMsg({ kind: "ok", text: "Customer details updated." });
      setTimeout(() => setMsg(null), 3000);
    },
    onError: (err) =>
      setMsg({ kind: "err", text: err instanceof ApiError ? err.message : "Could not update the customer." }),
  });

  const c = lq.data?.customer;
  const transactions = lq.data?.transactions ?? [];
  const payments = lq.data?.payments ?? [];
  const bookings = lq.data?.bookings ?? [];

  return (
    <AppShell
      title={c?.name ?? "Customer"}
      subtitle="Profile · ledger · payment history"
      actions={
        <Link
          to="/customers"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">All customers</span>
        </Link>
      }
    >
      {msg && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            msg.kind === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <AsyncState isLoading={lq.isLoading} isError={lq.isError} error={lq.error} empty={!c} emptyLabel="Customer not found.">
        {c && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <Tile label="Total Billed" value={formatCurrency(c.totalBilled)} />
              <Tile label="Total Paid" value={formatCurrency(c.totalPaid)} tone="success" />
              <Tile label="Balance Due" value={formatCurrency(c.balance)} tone="secondary" />
              <Tile label="Bookings" value={String(c.bookingsCount)} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <section className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-tile)] sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-lg">Profile</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setEdit((s) => !s);
                      setDraft({
                        name: c.name,
                        contact: c.contact,
                        altContact: c.altContact ?? "",
                        address: c.address ?? "",
                        village: c.village ?? "",
                        city: c.city ?? "",
                        tag: c.tag,
                        dob: c.dob ?? "",
                        gstin: c.gstin ?? "",
                        notes: c.notes ?? "",
                      });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {edit ? "Cancel" : "Edit"}
                  </button>
                </div>

                {edit ? (
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      save.mutate({ id: c.id, ...draft });
                    }}
                  >
                    <Field label="Name">
                      <input className="input" value={draft.name ?? ""} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Contact">
                        <input className="input" value={draft.contact ?? ""} onChange={(e) => setDraft((d) => ({ ...d, contact: e.target.value }))} />
                      </Field>
                      <Field label="Alternate">
                        <input className="input" value={draft.altContact ?? ""} onChange={(e) => setDraft((d) => ({ ...d, altContact: e.target.value }))} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Tag">
                        <select className="input" value={draft.tag ?? "Retail"} onChange={(e) => setDraft((d) => ({ ...d, tag: e.target.value as CustomerTag }))}>
                          <option value="Retail">Retail</option>
                          <option value="Wholesale">Wholesale</option>
                        </select>
                      </Field>
                      <Field label="DOB">
                        <input type="date" className="input" value={draft.dob ?? ""} onChange={(e) => setDraft((d) => ({ ...d, dob: e.target.value }))} />
                      </Field>
                    </div>
                    <Field label="Address">
                      <input className="input" value={draft.address ?? ""} onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Village">
                        <input className="input" value={draft.village ?? ""} onChange={(e) => setDraft((d) => ({ ...d, village: e.target.value }))} />
                      </Field>
                      <Field label="City">
                        <input className="input" value={draft.city ?? ""} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} />
                      </Field>
                    </div>
                    <Field label="GSTIN">
                      <input className="input" value={draft.gstin ?? ""} onChange={(e) => setDraft((d) => ({ ...d, gstin: e.target.value }))} />
                    </Field>
                    <Field label="Notes">
                      <textarea className="input min-h-20" value={draft.notes ?? ""} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} />
                    </Field>
                    <button
                      type="submit"
                      disabled={save.isPending}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {save.isPending ? "Saving…" : "Save changes"}
                    </button>
                  </form>
                ) : (
                  <dl className="space-y-3 text-sm">
                    <Row label="Tag" value={<TagChip tag={c.tag} />} />
                    <Row label="Contact" value={c.contact} />
                    {c.altContact && <Row label="Alternate" value={c.altContact} />}
                    <Row label="Address" value={[c.address, c.village, c.city].filter(Boolean).join(", ") || "—"} />
                    <Row label="Date of birth" value={formatDate(c.dob)} />
                    {c.gstin && <Row label="GSTIN" value={c.gstin} />}
                    <Row label="Ref by" value={c.refBy || "—"} />
                    <Row label="Registered" value={formatDate(c.createdAt)} />
                    <Row label="Status" value={c.isActive ? "Active" : "Inactive"} />
                    {c.notes && <Row label="Notes" value={c.notes} />}
                  </dl>
                )}
              </section>

              <div className="space-y-6 lg:col-span-2">
                <section className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-tile)] sm:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-primary" />
                    <h2 className="font-display text-lg">Record Payment</h2>
                  </div>
                  <form
                    className="grid grid-cols-1 gap-3 sm:grid-cols-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (amount <= 0) return;
                      pay.mutate({
                        customerId: c.id,
                        amount,
                        mode,
                        reference: reference || undefined,
                        note: note || undefined,
                      });
                    }}
                  >
                    <Field label="Amount">
                      <input
                        type="number"
                        min={1}
                        className="input"
                        value={amount || ""}
                        onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                        placeholder="₹"
                      />
                    </Field>
                    <Field label="Mode">
                      <select className="input" value={mode} onChange={(e) => setMode(e.target.value as PaymentMode)}>
                        {PAYMENT_MODES.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Reference">
                      <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UTR / Cheque" />
                    </Field>
                    <Field label="Note">
                      <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
                    </Field>
                    <div className="sm:col-span-4">
                      <button
                        type="submit"
                        disabled={pay.isPending || amount <= 0}
                        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                      >
                        {pay.isPending ? "Saving…" : "Add Payment"}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-tile)]">
                  <div className="border-b border-border px-4 py-4 sm:px-6">
                    <h2 className="font-display text-lg">Transaction Ledger</h2>
                    <p className="text-[11px] text-muted-foreground">Every booking, payment, return and adjustment</p>
                  </div>
                  {transactions.length === 0 ? (
                    <p className="p-8 text-center text-sm text-muted-foreground">No transactions yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 sm:px-6">Date</th>
                            <th className="px-4 py-3 sm:px-6">Type</th>
                            <th className="px-4 py-3 sm:px-6">Particulars</th>
                            <th className="px-4 py-3 text-right sm:px-6">Debit</th>
                            <th className="px-4 py-3 text-right sm:px-6">Credit</th>
                            <th className="px-4 py-3 text-right sm:px-6">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-sm">
                          {transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-muted/30">
                              <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground sm:px-6">{formatDate(t.date)}</td>
                              <td className="px-4 py-3 sm:px-6">
                                <StatusPill status={t.type === "Payment" ? "Delivered" : t.type === "Return" ? "Pending" : "Booked"} />
                                <span className="ml-2 text-[11px] text-muted-foreground">{t.type}</span>
                              </td>
                              <td className="px-4 py-3 text-xs sm:px-6">
                                {t.description}
                                {t.reference ? <span className="ml-1 font-mono text-[10px] text-muted-foreground">({t.reference})</span> : null}
                              </td>
                              <td className="px-4 py-3 text-right text-xs sm:px-6">{t.debit ? formatCurrency(t.debit) : "—"}</td>
                              <td className="px-4 py-3 text-right text-xs text-emerald-700 sm:px-6">{t.credit ? formatCurrency(t.credit) : "—"}</td>
                              <td className="px-4 py-3 text-right font-mono text-xs sm:px-6">{formatCurrency(t.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-tile)]">
                    <div className="border-b border-border px-4 py-4 sm:px-6">
                      <h2 className="font-display text-lg">Payment History</h2>
                    </div>
                    {payments.length === 0 ? (
                      <p className="p-8 text-center text-sm text-muted-foreground">No payments received yet.</p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {payments.map((p) => (
                          <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">{formatCurrency(p.amount)}</p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {formatDate(p.date)} · {p.mode}
                                {p.reference ? ` · ${p.reference}` : ""}
                              </p>
                            </div>
                            <p className="shrink-0 text-[11px] text-muted-foreground">{p.receivedBy}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-tile)]">
                    <div className="border-b border-border px-4 py-4 sm:px-6">
                      <h2 className="font-display text-lg">Bookings</h2>
                    </div>
                    {bookings.length === 0 ? (
                      <p className="p-8 text-center text-sm text-muted-foreground">No bookings yet.</p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {bookings.map((b) => (
                          <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{b.modelName}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {b.id} · {formatDate(b.date)} · × {b.qty}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-semibold">{formatCurrency(b.amount)}</p>
                              <StatusPill status={b.status} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              </div>
            </div>
          </>
        )}
      </AsyncState>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm">{value}</dd>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "success" | "secondary" }) {
  const cls = tone === "secondary" ? "text-secondary" : tone === "success" ? "text-emerald-700" : "";
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-tile)] sm:p-5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[11px]">{label}</p>
      <p className={`mt-1 font-display text-xl sm:text-2xl ${cls}`}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
