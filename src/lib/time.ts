// src/lib/time.ts
import { formatInTimeZone } from "date-fns-tz";

const APP_TZ = "Europe/Madrid"; // o "Europe/Lisbon" si prefieres

export async function getEffectiveToday() {
  return formatInTimeZone(new Date(), APP_TZ, "yyyy-MM-dd");
}
