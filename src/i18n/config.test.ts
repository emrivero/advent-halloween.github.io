import { describe, expect, it } from "vitest";
import { isLocale, localeFromRequest, messages, translate } from "./config";

describe("i18n", () => {
  it("mantiene las mismas claves en español e inglés", () => {
    expect(Object.keys(messages.en).sort()).toEqual(
      Object.keys(messages.es).sort()
    );
  });

  it("traduce e interpola valores", () => {
    expect(translate("es", "day", { day: 31 })).toBe("Día 31");
    expect(translate("en", "day", { day: 31 })).toBe("Day 31");
    expect(translate("en", "welcome", { email: "boo@example.com" })).toBe(
      "Welcome, boo@example.com"
    );
  });

  it("sólo acepta los idiomas soportados", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("resuelve el idioma desde cookie o cabecera", () => {
    expect(
      localeFromRequest(
        new Request("http://test", { headers: { cookie: "locale=en" } })
      )
    ).toBe("en");
    expect(
      localeFromRequest(
        new Request("http://test", {
          headers: { "accept-language": "en-US,en;q=0.9" },
        })
      )
    ).toBe("en");
  });
});
