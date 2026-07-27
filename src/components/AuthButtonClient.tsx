"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthButtonClient() {
  const [supabase] = useState(createSupabaseBrowserClient);
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};

    (async () => {
      // 1) Sesión actual
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      setLoading(false);

      // 2) Suscripción a cambios (login/logout/refresh)
      const { data: sub } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setEmail(session?.user?.email ?? null);
          // Forzamos un refresh de datos del servidor si lo necesitas:
          router.refresh();
        }
      );
      unsub = () => sub.subscription.unsubscribe();
    })();

    return () => unsub();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="h-9 w-28 animate-pulse rounded-md border border-white/10 bg-white/5" />
    );
  }

  if (email) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-white/80 text-sm">
          Bienvenid@, <strong>{email}</strong>
        </span>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.refresh(); // actualiza server components
          }}
          className="rounded-md border border-white/15 px-3 py-1 text-sm hover:bg-white/5"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <Link href="/auth" className="rounded-md bg-white px-4 py-2 text-gray-900">
      Entrar
    </Link>
  );
}
