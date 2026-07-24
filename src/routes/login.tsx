import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Manish Kala Kendra ERP" },
      { name: "description", content: "Collector and administrator sign-in for the Manish Kala Kendra manufacturing ERP." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Sign in · Manish Kala Kendra ERP" },
      { property: "og:description", content: "Collector and administrator sign-in for the Manish Kala Kendra manufacturing ERP." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    // Already signed in — bounce to dashboard.
    void navigate({ to: "/", replace: true });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username.trim(), password);
      await navigate({ to: "/", replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 401 ? "Invalid username or password." : err.message);
      } else {
        setError("Could not reach the server. Check your connection and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl text-secondary">Manish Kala Kendra</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Manufacturing ERP · Since 1989
          </p>
        </div>
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-tile)]"
        >
          <h2 className="font-display text-xl">Sign in</h2>
          <div>
            <label htmlFor="username" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Username
            </label>
            <input
              id="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary/40 focus:bg-surface"
              placeholder="e.g. manish"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm outline-none focus:border-primary/40 focus:bg-surface"
            />
          </div>
          {error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-[11px] text-muted-foreground">
            Access is provisioned by the workshop administrator. Contact Manish for a login.
          </p>
        </form>
      </div>
    </div>
  );
}
