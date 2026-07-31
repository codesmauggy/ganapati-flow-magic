import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import {
  updateUserProfile,
  type UserUpdateInput,
} from "@/lib/api/queries";
import { AuthUser } from "@/lib/types";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile · Manish Kala Kendra" },
      {
        name: "description",
        content: "View and update your personal information.",
      },
      { property: "og:title", content: "My Profile · Manish Kala Kendra" },
      { property: "og:description", content: "View and update your personal information." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const flash: Flash = (kind, text) => {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 3500);
  };

  return (
    <AppShell
      title="My Profile"
      subtitle="View and update your personal information"
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
      <MyProfile user={user} flash={flash} />
    </AppShell>
  );
}

export type Flash = (kind: "ok" | "err", text: string) => void;

const errText = (err: unknown, fallback: string) =>
  err instanceof ApiError ? err.message : fallback;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export function MyProfile({ user, flash }: { user: AuthUser | null; flash: Flash }) {
  const { setUser } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
  });

  const displayFullName = user?.fullName || "Not set";

  const update = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setForm({
        first_name: updatedUser.first_name || "",
        last_name: updatedUser.last_name || "",
        email: updatedUser.email || "",
      });
      flash("ok", "Profile updated successfully.");
    },
    onError: (e) => flash("err", errText(e, "Could not update profile.")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UserUpdateInput = {};
    if (form.first_name !== user?.first_name) payload.first_name = form.first_name;
    if (form.last_name !== user?.last_name) payload.last_name = form.last_name;
    if (form.email !== user?.email) payload.email = form.email;
    if (Object.keys(payload).length === 0) {
      flash("ok", "No changes to save.");
      return;
    }
    update.mutate(payload);
  };

  return (
    <div className="max-w-md rounded-xl border border-border bg-surface p-6 shadow-(--shadow-tile)">
      <h3 className="mb-4 font-display text-lg">Your Profile</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Username">
          <input
            className="input bg-muted/50"
            value={user?.username || ""}
            disabled
            readOnly
          />
        </Field>

        <Field label="Role">
          <input
            className="input bg-muted/50 capitalize"
            value={user?.role || ""}
            disabled
            readOnly
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name">
            <input
              className="input"
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              placeholder="First name"
            />
          </Field>
          <Field label="Last Name">
            <input
              className="input"
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              placeholder="Last name"
            />
          </Field>
        </div>

        <Field label="Full Name (auto‑generated)">
          <input
            className="input bg-muted/50"
            value={displayFullName}
            disabled
            readOnly
          />
        </Field>

        <Field label="Email">
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder={user?.email || "your@email.com"}
          />
        </Field>

        <button
          type="submit"
          disabled={update.isPending}
          className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {update.isPending ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}