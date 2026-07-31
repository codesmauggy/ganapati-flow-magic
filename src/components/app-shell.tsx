import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingBag,
  Users,
  Receipt,
  BarChart3,
  Contact,
  ShieldCheck,
  Settings,
  Search,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { modelsQuery } from "@/lib/api/queries";
import { useAuth } from "@/lib/auth";
import LoadingGif from "@/assets/LoadingScreen.gif";

export function AppShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Auth gate: send unauthenticated users to /login (client-side)
  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: "/login", replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Live low-stock count for the sidebar alert
  const { data: models } = useQuery({ ...modelsQuery, enabled: !!user });
  const lowCount = (models ?? []).filter((m) => m.available < m.lowStockAt).length;

  // ---------- DYNAMIC NAV ----------
  // Compute whether the user is an admin (adjust the role property as needed)
  const isAdmin = user?.role === "admin";

  // Build the navigation array inside the component so it can access isAdmin
  const nav = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/stock", label: "Stock Inventory", icon: Package },
    { to: "/wholesale", label: "Wholesale Orders", icon: Truck },
    { to: "/retail", label: "Retail Orders", icon: ShoppingBag },
    { to: "/customers", label: "Customers", icon: Contact },
    { to: "/staff", label: "Staff & Salary", icon: Users },
    { to: "/expenses", label: "Expenses", icon: Receipt },
    { to: "/reports", label: "Reports", icon: BarChart3 },
    // Conditional entry: admin gets Admin Console, others get My Profile
    {
      to: isAdmin ? "/admin" : "/profile",
      label: isAdmin ? "Admin Console" : "My Profile",
      icon: ShieldCheck,
    },
  ] as const;

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const initials = (user.fullName || user.username)
  .split(" ")
  .map((s) => s[0])
  .slice(0, 2)
  .join("")
  .toUpperCase();

  // ---------- SIDEBAR (no changes, just uses the local `nav`) ----------
  const sidebar = (
    <>
      <div className="flex items-center justify-between border-b border-border p-4 sm:p-6">
        <div className="min-w-0">
          <div className="truncate font-display text-lg tracking-tight text-secondary sm:text-xl">
            Manish Kala Kendra
          </div>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
            · Since 1989 ·
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 sm:p-4">
        {nav.map((item) => {
          const active =
            item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={
                active
                  ? "flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
                  : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-border p-3 sm:p-4">
        {lowCount > 0 && (
          <Link
            to="/stock"
            className="block rounded-lg bg-secondary/5 p-3 transition-colors hover:bg-secondary/10"
          >
            <p className="text-xs font-semibold text-secondary">System Alert</p>
            <p className="mt-1 text-[11px] text-secondary/70">
              {lowCount} items below safety stock level.
            </p>
          </Link>
        )}
        <Link
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            void navigate({ to: "/login", replace: true });
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </>
  );

  // ---------- MAIN LAYOUT (unchanged) ----------
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        {sidebar}
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface transition-transform duration-200 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        {sidebar}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface px-3 sm:h-16 sm:px-4 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-base leading-tight sm:text-lg">
                {title}
              </h1>
              {subtitle ? (
                <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {actions}
            <div className="hidden text-right md:block">
              <p className="text-xs font-bold">{user.fullName || user.username}</p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {user.role} · on duty
              </p>
            </div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {initials || "US"}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// ... the rest (CategoryChip, TagChip, StatusPill, AsyncState) remain unchanged

export function CategoryChip({ category }: { category: "Ganapati" | "Gauri" | "Devi" }) {
  const map = {
    Ganapati: "bg-cat-ganapati text-cat-ganapati-foreground",
    Gauri: "bg-cat-gauri text-cat-gauri-foreground",
    Devi: "bg-cat-devi text-cat-devi-foreground",
  } as const;
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${map[category]}`}
    >
      {category}
    </span>
  );
}

export function TagChip({ tag }: { tag: "Retail" | "Wholesale" }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        tag === "Wholesale" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
      }`}
    >
      {tag}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Delivered: "bg-emerald-50 text-emerald-700",
    Dispatched: "bg-emerald-50 text-emerald-700",
    Loading: "bg-amber-50 text-amber-700",
    "Advance Paid": "bg-orange-50 text-orange-700",
    Booked: "bg-slate-100 text-slate-600",
    Pending: "bg-rose-50 text-rose-700",
    Present: "bg-emerald-50 text-emerald-700",
    Late: "bg-amber-50 text-amber-700",
    "Half Day": "bg-orange-50 text-orange-700",
    Absent: "bg-rose-50 text-rose-700",
  };
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[status] ?? "bg-slate-100 text-slate-600"}`}
    >
      {status}
    </span>
  );
}

// Small helpers shared across pages
export function AsyncState({
  isLoading,
  isError,
  error,
  empty,
  emptyLabel,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  empty?: boolean;
  emptyLabel?: string;
  children: ReactNode;
  minDisplayMs?: number;
}) {

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <img
          src={LoadingGif}
          alt="Loading..."
          className="mx-auto h-12 w-12 object-contain" // adjust size as needed
        />
      </div>
    );
  }
  // if (isLoading) {
  //   return <div className="p-8 text-center text-sm text-muted-foreground">Loading Details</div>;
  // }
  if (isError) {
    const msg = error instanceof Error ? error.message : "Something went wrong.";
    return (
      <div className="p-8 text-center text-sm text-rose-700">
        {msg}
        <p className="mt-1 text-[11px] text-muted-foreground">
          Ensure the Django backend at <code>VITE_API_BASE_URL</code> is running and reachable.
        </p>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        {emptyLabel ?? "No records yet."}
      </div>
    );
  }
  return <>{children}</>;
}


interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isDestructive = true,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
              isDestructive ? "bg-rose-600 hover:bg-rose-700" : "bg-primary hover:opacity-90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
