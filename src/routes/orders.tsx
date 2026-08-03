import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Plus, Search, X, Loader2, FileText } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, AsyncState, StatusPill } from "@/components/app-shell";
import {
  bookingsQuery,
  createBooking,
  customerKeys,
  customersQuery,
  modelsQuery,
  qk,
} from "@/lib/api/queries";
import { formatCurrency } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders · Manish Kala Kendra" },
      { name: "description", content: "Manage all retail and wholesale orders in one place." },
      { property: "og:title", content: "Orders · Manish Kala Kendra" },
      { property: "og:description", content: "Manage all retail and wholesale orders in one place." },
    ],
  }),
  component: OrdersPage,
});

type Tab = "all" | "retail" | "wholesale";

type WholesaleItem = {
  id: string;
  sku: string;
  modelName: string;
  qty: number;
  price: number;
  amount: number;
};

function OrdersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const bq = useQuery(bookingsQuery);
  const mq = useQuery(modelsQuery);
  const cq = useQuery(customersQuery);

  const allBookings = bq.data ?? [];
  const models = mq.data ?? [];
  const customers = cq.data ?? [];

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filteredRows = useMemo(() => {
    let rows = allBookings;
    if (activeTab !== "all") {
      const channel = activeTab === "retail" ? "Retail" : "Wholesale";
      rows = rows.filter((b) => b.channel === channel);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      rows = rows.filter((b) =>
        [b.id, b.customerName, b.mobile, b.village, b.modelName, b.collector, b.notes]
          .some((field) => field?.toLowerCase().includes(term))
      );
    }
    return rows;
  }, [allBookings, activeTab, searchTerm]);

  const totalAmount = filteredRows.reduce((s, b) => s + b.amount, 0);
  const totalAdvance = filteredRows.reduce((s, b) => s + b.advance, 0);
  const totalPending = filteredRows.reduce((s, b) => s + (b.amount - b.advance), 0);

  const handleFormSuccess = () => setShowForm(false);

  return (
    <AppShell
      title="Orders"
      subtitle="All retail and wholesale orders"
      actions={
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition hover:opacity-90 ${
            showForm
              ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Order
            </>
          )}
        </button>
      }
    >
      {showForm && (
        <div className="mb-8 rounded-xl border border-border bg-surface p-6 shadow-(--shadow-tile)">
          <NewOrderForm
            models={models}
            customers={customers}
            user={user}
            onSuccess={handleFormSuccess}
          />
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Tile label="Total Sales" value={formatCurrency(totalAmount)} />
        <Tile label="Collected" value={formatCurrency(totalAdvance)} tone="success" />
        <Tile label="Pending" value={formatCurrency(totalPending)} tone="secondary" />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(["all", "retail", "wholesale"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            className="input pl-9 w-full"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-(--shadow-tile)">
        <AsyncState
          isLoading={bq.isLoading}
          isError={bq.isError}
          error={bq.error}
          empty={filteredRows.length === 0}
          emptyLabel={
            searchTerm
              ? "No orders match your search."
              : `No ${activeTab === "all" ? "" : activeTab} orders yet.`
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Booking</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3 text-right">Qty</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-right">Advance</th>
                  <th className="px-6 py-3 text-right">Pending</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredRows.map((b) => (
                  <tr key={b.bookingId} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      <p className="font-mono text-xs text-muted-foreground">{b.id}</p>
                      <p className="text-[10px] text-muted-foreground">{b.channel}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">{b.customerName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {b.village} · {b.mobile}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {b.modelName}
                      <span className="text-muted-foreground"> × {b.qty}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{b.qty}</td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {formatCurrency(b.amount)}
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {formatCurrency(b.advance)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-secondary">
                      {formatCurrency(b.amount - b.advance)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      {b.notes ? (
                        <span
                          className="cursor-help text-muted-foreground hover:text-foreground"
                          title={b.notes}
                        >
                          <FileText className="inline h-4 w-4" />
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background-color: var(--color-muted);
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: color-mix(in oklab, var(--color-primary) 45%, transparent);
          background-color: var(--color-surface);
        }
        textarea.input {
          resize: vertical;
        }
      `}</style>
    </AppShell>
  );
}

// ----- New Order Form -----
function NewOrderForm({
  models,
  customers,
  user,
  onSuccess,
}: {
  models: any[];
  customers: any[];
  user: any;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  const [orderType, setOrderType] = useState<"Retail" | "Wholesale">("Retail");

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [village, setVillage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [pickupDate, setPickupDate] = useState("");
  const [notes, setNotes] = useState("");

  const [modelSearch, setModelSearch] = useState("");
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState(1);
  const [amount, setAmount] = useState(0);
  const [advance, setAdvance] = useState(0);

  const [wholesaleAdvance, setWholesaleAdvance] = useState(0);
  const [items, setItems] = useState<WholesaleItem[]>([]);

  useEffect(() => {
    if (orderType === "Wholesale" && items.length === 0) {
      addItem();
    }
  }, [orderType]);

  const create = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.bookings });
      queryClient.invalidateQueries({ queryKey: qk.models });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      resetForm();
      onSuccess();
    },
    onError: (err) => {
      // --- Enhanced logging and error parsing ---
      console.error("Full error object:", err);
      if (err instanceof ApiError) {
        console.log("Status:", err.status);
        console.log("Body:", err.body);
        console.log("Message:", err.message);
      }

      let msg = "Could not create booking.";
      if (err instanceof ApiError) {
        const body = err.body as any;
        if (typeof body === "string") {
          msg = body;
        } else if (body && typeof body === "object") {
          if (body.detail) {
            msg = body.detail;
          } else if (body.error) {
            msg = body.error;
          } else if (body.message) {
            msg = body.message;
          } else {
            // Build from field errors (e.g., { "customer_name": ["This field is required."] })
            const parts = Object.entries(body)
              .filter(([_, val]) => val !== null && val !== undefined)
              .map(([key, val]) => {
                const value = Array.isArray(val) ? val.join(", ") : String(val);
                return `${key}: ${value}`;
              });
            if (parts.length) {
              msg = parts.join("; ");
            } else {
              // If nothing else, show the stringified body
              msg = JSON.stringify(body);
            }
          }
        } else {
          msg = err.message;
        }
      }
      alert(msg); // Show to user
    },
  });

  const isSubmitting = create.isPending;

  const resetForm = () => {
    setCustomerId("");
    setCustomerName("");
    setMobile("");
    setVillage("");
    setSearchTerm("");
    setPickupDate("");
    setNotes("");
    setSku("");
    setModelSearch("");
    setQty(1);
    setAmount(0);
    setAdvance(0);
    setWholesaleAdvance(0);
    setItems([]);
  };

  const handleCustomerSelect = (c: any) => {
    setCustomerId(c.id);
    setCustomerName(c.name);
    setMobile(c.contact);
    setVillage(c.village ?? "");
    setSearchTerm(c.name);
    setShowSuggestions(false);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        sku: "",
        modelName: "",
        qty: 1,
        price: 0,
        amount: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      const item = items.find((i) => i.id === id);
      if (item) {
        updateItem(id, "sku", "");
        updateItem(id, "modelName", "");
        updateItem(id, "qty", 1);
        updateItem(id, "price", 0);
        updateItem(id, "amount", 0);
      }
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = <K extends keyof WholesaleItem>(
    id: string,
    field: K,
    value: WholesaleItem[K]
  ) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "qty" || field === "price") {
          updated.amount = updated.qty * updated.price;
        }
        return updated;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = customerName.trim();
    const trimmedMobile = mobile.trim();
    const trimmedVillage = village.trim();

    if (!trimmedName) {
      alert("Customer name is required.");
      return;
    }

    if (!customerId && !trimmedMobile) {
      alert("Please provide a mobile number for the new customer.");
      return;
    }

    if (!customerId && (!trimmedName || !trimmedMobile)) {
      alert("Both name and mobile are required for a new customer.");
      return;
    }

    // Build payload
    let payload: any;
    if (orderType === "Retail") {
      if (!sku) {
        alert("Please select a model.");
        return;
      }
      payload = {
        customerId: customerId || undefined,
        customer: trimmedName,
        mobile: trimmedMobile || undefined,
        village: trimmedVillage || undefined,
        modelSku: sku,
        qty,
        amount: amount || undefined,
        advance: advance || undefined,
        channel: "Retail" as const,
        pickupDate: pickupDate || undefined,
        notes: notes.trim() || undefined,
      };
    } else {
      const invalid = items.some(
        (item) => !item.sku || item.qty < 1 || item.price <= 0
      );
      if (invalid) {
        alert("Please fill all item fields correctly (SKU, Qty > 0, Price > 0).");
        return;
      }
      const wholesaleItems = items.map((item) => ({
        modelSku: item.sku,
        qty: item.qty,
        amount: item.amount,
      }));
      payload = {
        customerId: customerId || undefined,
        customer: trimmedName,
        mobile: trimmedMobile || undefined,
        village: trimmedVillage || undefined,
        channel: "Wholesale" as const,
        advance: wholesaleAdvance || 0,
        items: wholesaleItems,
        pickupDate: pickupDate || undefined,
        notes: notes.trim() || undefined,
      };
    }

    // Log the payload before sending
    console.log("Submitting payload:", payload);
    create.mutate(payload);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact.includes(searchTerm)
  );

  const filteredModels = models.filter(
    (m) =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.sku.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-1 rounded-lg border border-border p-1 w-fit">
        <button
          type="button"
          onClick={() => setOrderType("Retail")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
            orderType === "Retail"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          Retail
        </button>
        <button
          type="button"
          onClick={() => setOrderType("Wholesale")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
            orderType === "Wholesale"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          Wholesale
        </button>
      </div>

      <Field label="Customer Search">
        <div className="relative">
          <input
            type="text"
            className="input"
            placeholder="Search customer…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {showSuggestions && searchTerm.trim() !== "" && (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg">
              {filteredCustomers.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  No matching customers – you can type a new name below.
                </li>
              ) : (
                filteredCustomers.map((c) => (
                  <li
                    key={c.id}
                    className="cursor-pointer px-3 py-2 text-sm hover:bg-primary/10"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCustomerSelect(c);
                    }}
                  >
                    {c.name} · {c.contact} ({c.tag})
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </Field>

      <Field label="Customer Name *">
        <input
          required
          className="input"
          value={customerName}
          onChange={(e) => {
            setCustomerName(e.target.value);
            setCustomerId("");
          }}
          placeholder="e.g. Rahul Rasal"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Mobile">
          <input
            className="input"
            value={mobile}
            onChange={(e) => {
              setMobile(e.target.value);
              setCustomerId("");
            }}
            placeholder="98XXXXXXXX"
          />
        </Field>
        <Field label="Village">
          <input
            className="input"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="Optional"
          />
        </Field>
      </div>

      {orderType === "Retail" && (
        <>
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-4">
              <Field label="Model">
                <div className="relative">
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Search model by name or SKU…"
                    value={modelSearch}
                    onChange={(e) => {
                      setModelSearch(e.target.value);
                      setShowModelSuggestions(true);
                    }}
                    onFocus={() => setShowModelSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowModelSuggestions(false), 200)
                    }
                    disabled={models.length === 0}
                  />
                  {showModelSuggestions && modelSearch.trim() !== "" && (
                    <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg">
                      {filteredModels.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-muted-foreground">
                          No matching models
                        </li>
                      ) : (
                        filteredModels.map((m) => (
                          <li
                            key={m.sku}
                            className="cursor-pointer px-3 py-2 text-sm hover:bg-primary/10"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSku(m.sku);
                              setModelSearch(m.name);
                              setShowModelSuggestions(false);
                            }}
                          >
                            {m.name} — {formatCurrency(m.sellingPrice)}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              </Field>
            </div>
            <div className="col-span-1">
              <Field label="Qty">
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </Field>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount">
              <input
                type="number"
                min={0}
                className="input"
                value={amount || ""}
                onChange={(e) =>
                  setAmount(Math.max(0, Number(e.target.value) || 0))
                }
                placeholder="₹"
              />
            </Field>
            <Field label="Advance">
              <input
                type="number"
                min={0}
                className="input"
                value={advance || ""}
                onChange={(e) =>
                  setAdvance(Math.max(0, Number(e.target.value) || 0))
                }
                placeholder="₹"
              />
            </Field>
          </div>
        </>
      )}

      {orderType === "Wholesale" && (
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Line Items
          </label>
          {items.map((item) => (
            <div key={item.id} className="mt-2 rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium">
                  Item #{items.indexOf(item) + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-rose-500 hover:text-rose-700"
                  title={items.length === 1 ? "Clear fields" : "Remove item"}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2">
                  <Field label="Model">
                    <div className="relative">
                      <input
                        type="text"
                        className="input w-full"
                        placeholder="Search model…"
                        value={item.modelName}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateItem(item.id, "modelName", val);
                          if (val !== item.modelName) {
                            updateItem(item.id, "sku", "");
                            updateItem(item.id, "price", 0);
                          }
                        }}
                        onFocus={() => setShowModelSuggestions(true)}
                        onBlur={() =>
                          setTimeout(() => setShowModelSuggestions(false), 200)
                        }
                      />
                      {showModelSuggestions && (
                        <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg">
                          {models
                            .filter(
                              (m) =>
                                m.name
                                  .toLowerCase()
                                  .includes(item.modelName.toLowerCase()) ||
                                m.sku
                                  .toLowerCase()
                                  .includes(item.modelName.toLowerCase())
                            )
                            .map((m) => (
                              <li
                                key={m.sku}
                                className="cursor-pointer px-3 py-2 text-sm hover:bg-primary/10"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  updateItem(item.id, "sku", m.sku);
                                  updateItem(item.id, "modelName", m.name);
                                  updateItem(item.id, "price", m.sellingPrice);
                                  setShowModelSuggestions(false);
                                }}
                              >
                                {m.name} — {formatCurrency(m.sellingPrice)}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  </Field>
                </div>
                <div>
                  <Field label="Qty">
                    <input
                      type="number"
                      min={1}
                      className="input"
                      value={item.qty}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "qty",
                          Math.max(1, Number(e.target.value) || 1)
                        )
                      }
                    />
                  </Field>
                </div>
                <div>
                  <Field label="Price (per unit)">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="input"
                      value={item.price || ""}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "price",
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                      placeholder="₹"
                    />
                  </Field>
                </div>
              </div>
              <div className="mt-2 flex justify-end text-sm">
                <span className="font-medium">Line Total: </span>
                <span className="ml-2 font-bold">{formatCurrency(item.amount)}</span>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="mt-3 inline-flex items-center gap-1 rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Item
          </button>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/30 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Amount
              </span>
              <p className="text-lg font-semibold">{formatCurrency(totalAmount)}</p>
            </div>
            <Field label="Advance (Total)">
              <input
                type="number"
                min={0}
                className="input"
                value={wholesaleAdvance || ""}
                onChange={(e) =>
                  setWholesaleAdvance(Math.max(0, Number(e.target.value) || 0))
                }
                placeholder="₹"
              />
            </Field>
          </div>
        </div>
      )}

      <Field label="Notes (optional)">
        <textarea
          className="input"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special instructions or remarks…"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Pickup date">
          <input
            type="date"
            className="input"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
          />
        </Field>
        <Field label="Collector">
          <div className="rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground">
            {user?.fullName || user?.username || "—"}
          </div>
        </Field>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        ) : (
          "Confirm Order"
        )}
      </button>
    </form>
  );
}

// Helpers
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
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
    <div className="rounded-xl border border-border bg-surface p-5 shadow-(--shadow-tile)">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 font-display text-2xl ${cls}`}>{value}</p>
    </div>
  );
}