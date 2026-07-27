"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useI18n } from "@/i18n/provider";

export default function AuthForm() {
  const [supabase] = useState(createSupabaseBrowserClient);
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) setErr(error.message);
      else setSent(true);
    } catch (e: any) {
      setErr(e?.message ?? "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-4 text-4xl font-semibold text-halloweenAccent">
        {t("access")}
      </h1>

      {!sent ? (
        <form
          onSubmit={sendMagicLink}
          className="grid gap-3"
          aria-busy={loading}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="rounded-md border border-white/10 bg-gray-900 p-2 disabled:opacity-50"
            placeholder={t("emailPlaceholder")}
            aria-label={t("email")}
          />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-gray-900 disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 0116 0h-4a4 4 0 10-8 0H4z"
                  />
                </svg>
                {t("sending")}
              </>
            ) : (
              t("sendMagicLink")
            )}
          </button>

          {err && (
            <p
              className="text-sm text-red-400"
              role="alert"
              aria-live="assertive"
            >
              {err}
            </p>
          )}
        </form>
      ) : (
        <p className="text-green-400" role="status" aria-live="polite">
          {t("linkSent")}
        </p>
      )}
    </div>
  );
}
