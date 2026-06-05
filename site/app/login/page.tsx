"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="sans text-sm text-[color:var(--text-muted)]">
          ← Replyloop
        </Link>
        <h1 className="text-3xl mt-6 mb-1">Welcome back</h1>
        <p className="sans text-sm text-[color:var(--text-secondary)] mb-8">
          Sign in to manage your reviews.
        </p>

        <form onSubmit={onSubmit} className="space-y-4 sans">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-[color:var(--text-muted)]">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-[color:var(--bg-elevated)] border border-[color:var(--border)] rounded text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-[color:var(--text-muted)]">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-[color:var(--bg-elevated)] border border-[color:var(--border)] rounded text-sm"
            />
          </label>

          {error && <p className="text-sm text-[color:var(--negative)]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[color:var(--text-primary)] text-[color:var(--bg-primary)] rounded text-sm hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="sans text-sm text-[color:var(--text-secondary)] mt-6 text-center">
          No account?{" "}
          <Link href="/signup" className="underline">Sign up</Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
