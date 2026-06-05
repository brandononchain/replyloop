"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] underline"
    >
      Sign out
    </button>
  );
}
