"use client";

import { Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { useRouter } from "next/navigation";

export default function LanguageSelector() {
  const { locale, t } = useI18n();
  const router = useRouter();

  const change = (next: Locale) => {
    document.cookie = `locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <label className="inline-flex items-center gap-2 text-sm text-white/80">
      <span>{t("language")}</span>
      <select
        value={locale}
        onChange={(event) => change(event.target.value as Locale)}
        className="rounded-md border border-white/15 bg-gray-950 px-2 py-1 text-white"
        aria-label={t("language")}
      >
        <option value="es">{t("spanish")}</option>
        <option value="en">{t("english")}</option>
      </select>
    </label>
  );
}
