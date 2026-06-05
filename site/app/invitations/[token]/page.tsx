"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function InvitationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<"loading" | "needs-auth" | "accepting" | "done" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setState("needs-auth");
        return;
      }
      setState("accepting");
      const res = await fetch(`/api/invitations/${params.token}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to accept invitation");
        setState("error");
        return;
      }
      setState("done");
      setTimeout(() => router.push("/dashboard"), 1000);
    })();
  }, [params.token, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 sans">
      <div className="max-w-md text-center">
        {state === "loading" && <p>Loading…</p>}
        {state === "needs-auth" && (
          <>
            <h1 className="text-2xl mb-2" style={{ fontFamily: "Newsreader, serif" }}>You've been invited</h1>
            <p className="text-sm text-[color:var(--text-secondary)] mb-6">
              Sign in or create an account with the email this invitation was sent to.
            </p>
            <a
              href={`/signup?next=/invitations/${params.token}`}
              className="inline-block px-4 py-2 bg-[color:var(--text-primary)] text-[color:var(--bg-primary)] rounded text-sm"
            >
              Create account
            </a>
            <a
              href={`/login?next=/invitations/${params.token}`}
              className="inline-block ml-3 text-sm underline"
            >
              Sign in
            </a>
          </>
        )}
        {state === "accepting" && <p>Accepting invitation…</p>}
        {state === "done" && <p>Welcome aboard. Redirecting to your dashboard…</p>}
        {state === "error" && (
          <>
            <h1 className="text-2xl mb-2" style={{ fontFamily: "Newsreader, serif" }}>Couldn't accept</h1>
            <p className="text-sm text-[color:var(--negative)]">{error}</p>
          </>
        )}
      </div>
    </main>
  );
}
