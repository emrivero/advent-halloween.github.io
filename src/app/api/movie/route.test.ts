import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseServerClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

function movieCache(cache: unknown = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: cache });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const upsert = vi.fn(() => ({
    select: () => ({ limit: vi.fn().mockResolvedValue({ data: [] }) }),
  }));
  return { from: vi.fn(() => ({ select, upsert })), upsert };
}

describe("GET /api/movie", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    process.env.TMDB_API_KEY = "v3-key";
  });

  it("rechaza una petición que no permite resolver un id", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://test/api/movie"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "No se pudo resolver tmdb_id",
    });
  });

  it("rechaza identificadores y años mal formados", async () => {
    const { GET } = await import("./route");
    const invalidId = await GET(
      new Request("http://test/api/movie?tmdb=-20")
    );
    const invalidYear = await GET(
      new Request("http://test/api/movie?title=Alien&year=dosmil")
    );
    expect(invalidId.status).toBe(400);
    expect(invalidYear.status).toBe(400);
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("devuelve el modelo público desde una caché vigente", async () => {
    createSupabaseServerClient.mockResolvedValue(
      movieCache({
        tmdb_id: 42,
        imdb_id: "tt42",
        title_es: "La película",
        overview_es: "Sinopsis",
        poster_path: "/poster.jpg",
        release_date: "1999-03-31",
        runtime_min: 99,
        genres_es: ["Terror"],
        updated_at: new Date().toISOString(),
      })
    );
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://test/api/movie?tmdb=42")
    );

    expect(await response.json()).toEqual({
      tmdb_id: 42,
      imdb: "tt42",
      title: "La película",
      year: "1999",
      overview: "Sinopsis",
      runtime_min: 99,
      genres: ["Terror"],
      released: "1999-03-31",
      poster_url: "https://image.tmdb.org/t/p/w500/poster.jpg",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resuelve por título y año, carga detalle y actualiza la caché", async () => {
    const client = movieCache(null);
    createSupabaseServerClient.mockResolvedValue(client);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [
              { id: 1, release_date: "2023-01-01" },
              { id: 2, release_date: "1982-06-25" },
            ],
          })
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            imdb_id: "tt0084787",
            title: "La cosa",
            overview: "Antártida",
            poster_path: "/thing.jpg",
            release_date: "1982-06-25",
            runtime: 109,
            genres: [{ name: "Terror" }, { name: "Ciencia ficción" }],
          })
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://test/api/movie?title=The%20Thing&year=1982")
    );
    const body = await response.json();

    expect(body).toMatchObject({
      tmdb_id: 2,
      imdb: "tt0084787",
      title: "La cosa",
      year: "1982",
      genres: ["Terror", "Ciencia ficción"],
    });
    expect(fetchMock.mock.calls[0][0]).toContain("api_key=v3-key");
    expect(fetchMock.mock.calls[1][0]).toContain("/movie/2?");
    expect(client.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ tmdb_id: 2, runtime_min: 109 })
    );
  });
});
