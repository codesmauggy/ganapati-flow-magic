import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Pencil, X } from "lucide-react";
import { AppShell, AsyncState, CategoryChip } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { createModel, deleteModel, modelsQuery, qk, updateModel, type ModelInput } from "@/lib/api/queries";
import { formatCurrency, type Category, type Model } from "@/lib/types";
import { ApiError } from "@/lib/api-client";

export const Route = createFileRoute("/stock")({
  head: () => ({
    meta: [
      { title: "Stock Inventory · Manish Kala Kendra" },
      {
        name: "description",
        content:
          "Ganapati, Gauri and Devi models with photos, live stock, purchase and selling prices, and low-stock alerts.",
      },
      { property: "og:title", content: "Stock Inventory · Manish Kala Kendra" },
      { property: "og:description", content: "Ganapati, Gauri and Devi models with photos, live stock, purchase and selling prices, and low-stock alerts." },
    ],
  }),
  component: StockPage,
});

const categories: (Category | "All")[] = ["All", "Ganapati", "Gauri", "Devi"];

// Fields that can be edited inline
type UpdatableFields = Pick<Model, 'purchasePrice' | 'sellingPrice' | 'available' | 'lowStockAt' | 'size' | 'name'>;
type UpdatableFieldKey = keyof UpdatableFields;

const emptyModel: ModelInput = {
  sku: "",
  name: "",
  category: "Ganapati",
  size: "",
  photo: "",
  purchasePrice: 0,
  sellingPrice: 0,
  rawMaterialCost: 0,
  available: 0,
  lowStockAt: 0,
};

function StockPage() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<Category | "All">("All");
  const [query, setQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newModel, setNewModel] = useState<ModelInput>(emptyModel);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [confirmState, setConfirmState] = useState<{ id: string; name: string } | null>(null);

  const flash = (kind: "ok" | "err", text: string) => {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // Queries
  const q = useQuery(modelsQuery);
  const models = q.data ?? [];

  // Mutations
  const create = useMutation({
    mutationFn: createModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.models });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      setShowAddForm(false);
      setNewModel(emptyModel);
      flash("ok", "Model created.");
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Could not create model.";
      flash("err", msg);
    },
  });

  const update = useMutation({
    mutationFn: updateModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.models });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      setEditingId(null);
      flash("ok", "Model updated.");
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Could not update model.";
      flash("err", msg);
    },
  });

  const remove = useMutation({
    mutationFn: deleteModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.models });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      flash("ok", "Model deleted.");
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Could not delete model.";
      flash("err", msg);
    },
  });

  // Filter logic
  const filtered = useMemo(() => {
    return models.filter((m) => {
      const catOk = category === "All" || m.category === category;
      const s = query.trim().toLowerCase();
      const qOk = !s || m.name.toLowerCase().includes(s) || m.sku.toLowerCase().includes(s);
      return catOk && qOk;
    });
  }, [category, query, models]);

  // Totals
  const totals = useMemo(
    () => ({
      count: filtered.reduce((s, m) => s + m.available, 0),
      value: filtered.reduce((s, m) => s + m.available * m.sellingPrice, 0),
      raw: filtered.reduce((s, m) => s + m.available * m.rawMaterialCost, 0),
    }),
    [filtered],
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.sku.trim() || !newModel.name.trim()) {
      flash("err", "SKU and Name are required.");
      return;
    }
    create.mutate(newModel);
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmState({ id, name });
  };

  const confirmDelete = () => {
    if (confirmState) {
      remove.mutate(confirmState.id);
      setConfirmState(null);
    }
  };

  const startEditing = (id: string) => setEditingId(id);
  const cancelEditing = () => setEditingId(null);

  // Save a field on blur – only for updatable fields
  const saveField = (id: string, field: UpdatableFieldKey, value: string | number) => {
    const model = models.find((m) => m.id === id);
    if (!model) return;
    const current = model[field];
    if (String(current) === String(value)) return;
    const payload: Partial<UpdatableFields> = { [field]: value };
    update.mutate({ id, ...payload });
  };

  return (
    <AppShell
      title="Stock Inventory"
      subtitle="Manage models, stock levels, and pricing"
      actions={
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? "Cancel" : "New Model"}
        </button>
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

      {/* Add Model Form */}
      {showAddForm && (
        <div className="mb-6 rounded-xl border border-border bg-surface p-6 shadow-(--shadow-tile)">
          <h3 className="mb-4 font-display text-lg">Add New Model</h3>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Field label="SKU">
              <input
                required
                className="input"
                value={newModel.sku}
                onChange={(e) => setNewModel((f) => ({ ...f, sku: e.target.value }))}
                placeholder="GN-24-DG"
              />
            </Field>
            <Field label="Name">
              <input
                required
                className="input"
                value={newModel.name}
                onChange={(e) => setNewModel((f) => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <Field label="Category">
              <select
                className="input"
                value={newModel.category}
                onChange={(e) => setNewModel((f) => ({ ...f, category: e.target.value as Category }))}
              >
                <option value="Ganapati">Ganapati</option>
                <option value="Gauri">Gauri</option>
                <option value="Devi">Devi</option>
              </select>
            </Field>
            <Field label="Size">
              <input
                className="input"
                value={newModel.size}
                onChange={(e) => setNewModel((f) => ({ ...f, size: e.target.value }))}
                placeholder="24 inch"
              />
            </Field>
            <Field label="Photo">
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setNewModel((f) => ({ ...f, photo: file || '' }));
                }}
              />
              {newModel.photo instanceof File && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Selected: {newModel.photo.name}
                </p>
              )}
            </Field>
            <Field label="Purchase price">
              <input
                type="number"
                min={0}
                className="input"
                value={newModel.purchasePrice || ""}
                onChange={(e) => setNewModel((f) => ({ ...f, purchasePrice: Number(e.target.value) || 0 }))}
              />
            </Field>
            <Field label="Selling price">
              <input
                type="number"
                min={0}
                className="input"
                value={newModel.sellingPrice || ""}
                onChange={(e) => setNewModel((f) => ({ ...f, sellingPrice: Number(e.target.value) || 0 }))}
              />
            </Field>
            <Field label="Raw material cost">
              <input
                type="number"
                min={0}
                className="input"
                value={newModel.rawMaterialCost || ""}
                onChange={(e) => setNewModel((f) => ({ ...f, rawMaterialCost: Number(e.target.value) || 0 }))}
              />
            </Field>
            <Field label="Available">
              <input
                type="number"
                min={0}
                className="input"
                value={newModel.available || ""}
                onChange={(e) => setNewModel((f) => ({ ...f, available: Number(e.target.value) || 0 }))}
              />
            </Field>
            <Field label="Low stock at">
              <input
                type="number"
                min={0}
                className="input"
                value={newModel.lowStockAt || ""}
                onChange={(e) => setNewModel((f) => ({ ...f, lowStockAt: Number(e.target.value) || 0 }))}
              />
            </Field>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={create.isPending}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {create.isPending ? "Saving…" : "Add Model"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Tiles */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryTile label="Total Available Units" value={totals.count.toLocaleString("en-IN")} />
        <SummaryTile label="Current Stock Value" value={formatCurrency(totals.value)} />
        <SummaryTile label="Raw Material Value" value={formatCurrency(totals.raw)} />
      </div>

      {/* Filter Bar */}
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

      {/* Models Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-(--shadow-tile)">
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
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filtered.map((m) => {
                  const low = m.available < m.lowStockAt;
                  const isEditing = editingId === m.id;
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
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {isEditing ? (
                          <input
                            type="text"
                            defaultValue={m.size}
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v !== m.size) saveField(m.id, "size", v);
                            }}
                            className="input h-8 w-24 py-0 text-xs"
                            autoFocus
                          />
                        ) : (
                          m.size
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            defaultValue={m.purchasePrice}
                            onBlur={(e) => {
                              const v = Number(e.target.value) || 0;
                              if (v !== m.purchasePrice) saveField(m.id, "purchasePrice", v);
                            }}
                            className="input h-8 w-20 py-0 text-xs text-right"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">{formatCurrency(m.purchasePrice)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            defaultValue={m.sellingPrice}
                            onBlur={(e) => {
                              const v = Number(e.target.value) || 0;
                              if (v !== m.sellingPrice) saveField(m.id, "sellingPrice", v);
                            }}
                            className="input h-8 w-20 py-0 text-xs text-right font-semibold"
                          />
                        ) : (
                          <span className="font-semibold">{formatCurrency(m.sellingPrice)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            defaultValue={m.available}
                            onBlur={(e) => {
                              const v = Number(e.target.value) || 0;
                              if (v !== m.available) saveField(m.id, "available", v);
                            }}
                            className="input h-8 w-20 py-0 text-xs text-right"
                          />
                        ) : (
                          <span className="font-medium">
                            {m.available}
                            {low && <span className="ml-2 text-[10px] font-bold text-secondary">LOW</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs">
                        {formatCurrency(m.available * m.sellingPrice)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <button
                              onClick={cancelEditing}
                              className="text-muted-foreground hover:text-foreground"
                              title="Cancel editing"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => startEditing(m.id)}
                              className="text-muted-foreground hover:text-primary"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(m.id, m.name)}
                            className="text-muted-foreground hover:text-rose-600"
                            title="Delete"
                            disabled={remove.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </div>

      <ConfirmDialog
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={confirmDelete}
        title="Delete Model"
        message={`Are you sure you want to delete "${confirmState?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
      />
    </AppShell>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-(--shadow-tile)">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
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