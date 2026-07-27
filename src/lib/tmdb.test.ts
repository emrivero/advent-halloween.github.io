import { describe, expect, it } from "vitest";
import {
  buildPosterUrl,
  MOVIE_TTL_MS,
  normalizeQuery,
  SEARCH_TTL_MS,
} from "./tmdb";

describe("TMDB helpers", () => {
  it("normaliza mayúsculas, extremos y espacios repetidos", () => {
    expect(normalizeQuery("  The   NIGHT\tHouse ")).toBe("the night house");
  });

  it("construye URLs de póster y tolera rutas ausentes", () => {
    expect(buildPosterUrl("/poster.jpg")).toBe(
      "https://image.tmdb.org/t/p/w500/poster.jpg"
    );
    expect(buildPosterUrl(null)).toBeNull();
    expect(buildPosterUrl("")).toBeNull();
  });

  it("mantiene ambos TTL en treinta días", () => {
    expect(SEARCH_TTL_MS).toBe(30 * 24 * 60 * 60 * 1000);
    expect(MOVIE_TTL_MS).toBe(SEARCH_TTL_MS);
  });
});
