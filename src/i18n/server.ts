import { cookies } from "next/headers";
import { defaultLocale, isLocale, translate } from "./config";

export async function getLocale() {
  const value = (await cookies()).get("locale")?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: translate.bind(null, locale) };
}
