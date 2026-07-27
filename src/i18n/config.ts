import en from "./dictionaries/en.json";
import es from "./dictionaries/es.json";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

export const messages = { es, en } as const;
export type MessageKey = keyof typeof es;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

export function localeFromRequest(request: Request): Locale {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("locale="))
    ?.slice("locale=".length);
  if (isLocale(cookie)) return cookie;
  const language = request.headers.get("accept-language")?.toLowerCase();
  return language?.startsWith("en") ? "en" : defaultLocale;
}

export function translate(
  locale: Locale,
  key: MessageKey,
  values: Record<string, string | number> = {}
) {
  let output: string = messages[locale][key];
  for (const [name, value] of Object.entries(values))
    output = output.replaceAll(`{${name}}`, String(value));
  return output;
}
