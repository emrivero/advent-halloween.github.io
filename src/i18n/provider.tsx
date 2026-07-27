"use client";

import { createContext, useCallback, useContext } from "react";
import { Locale, MessageKey, translate } from "./config";

const I18nContext = createContext<Locale>("es");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <I18nContext.Provider value={locale}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const locale = useContext(I18nContext);
  const t = useCallback(
    (key: MessageKey, values?: Record<string, string | number>) =>
      translate(locale, key, values),
    [locale]
  );
  return {
    locale,
    t,
  };
}
