"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const plan = params.get("plan");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard${
          plan ? `?plan=${plan}` : ""
        }`,
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push(`/dashboard${plan ? `?plan=${plan}` : ""}`);
      router.refresh();
    } else {
      setInfo("Check your inbox to confirm your email, then sign in.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="sans text-sm text-[color:var(--text-muted)]">
          ← Replyloop
        </Link>
        <h1 className="text-3xl mt-6 mb-1">Create your account</h1>
        <p className="sans text-sm text-[color:var(--text-secondary)] mb-8">
          {plan
            ? `Start your free 14-day trial of the ${plan} plan.`
            : "Free forever. Upgrade when you need more."}
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-[color:var(--bg-elevated)] border border-[color:var(--border)] rounded text-sm"
            />
            <span className="block text-xs text-[color:var(--text-muted)] mt-1">8+ characters</span>
          </label>

          {error && <p className="text-sm text-[color:var(--negative)]">{error}</p>}
          {info && <p className="text-sm text-[color:var(--positive)]">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[color:var(--text-primary)] text-[color:var(--bg-primary)] rounded text-sm hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="sans text-sm text-[color:var(--text-secondary)] mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
