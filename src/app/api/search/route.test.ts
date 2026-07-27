import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseServerClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

function cacheClient(cache: unknown = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: cache });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const upsert = vi.fn(() => ({
    select: () => ({ limit: vi.fn().mockResolvedValue({ data: [] }) }),
  }));
  return {
    from: vi.fn(() => ({ select, upsert })),
    spies: { maybeSingle, upsert },
  };
}

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    delete process.env.TMDB_API_KEY;
  });

  it("devuelve una lista vacía sin consultar servicios para una query vacía", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://test/api/search?q=%20"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ results: [] });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("sirve una entrada de caché vigente sin llamar a TMDB", async () => {
    const results = [{ tmdb_id: 1, title: "Alien" }];
    const client = cacheClient({
      results,
      updated_at: new Date().toISOString(),
    });
    createSupabaseServerClient.mockResolvedValue(client);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://test/api/search?q=%20ALIEN%20")
    );

    expect(await response.json()).toEqual({ results });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mapea, limita y guarda resultados obtenidos con token v4", async () => {
    process.env.TMDB_API_KEY = "ey-token";
    const lookup = cacheClient(null);
    const write = cacheClient(null);
    createSupabaseServerClient
      .mockResolvedValueOnce(lookup)
      .mockResolvedValueOnce(write);
    const rawResults = Array.from({ length: 12 }, (_, id) => ({
      id,
      title: `Film ${id}`,
      release_date: "2020-10-31",
      poster_path: `/p${id}.jpg`,
      overview: "Terror",
      vote_average: 7,
    }));
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: rawResults }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://test/api/search?q=Night%20House")
    );
    const body = await response.json();

    expect(body.results).toHaveLength(10);
    expect(body.results[0]).toMatchObject({
      tmdb_id: 0,
      title: "Film 0",
      year: "2020",
      poster_url: "https://image.tmdb.org/t/p/w500/p0.jpg",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("query=Night%20House"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer ey-token" }),
      })
    );
    expect(write.spies.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ q_normalized: "night house" })
    );
  });

  it("informa de la configuración ausente tras comprobar la caché", async () => {
    createSupabaseServerClient.mockResolvedValue(cacheClient(null));
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://test/api/search?q=Alien")
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Falta configurar TMDB_API_KEY",
    });
  });

  it("rechaza búsquedas excesivamente largas antes de consultar Supabase", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request(`http://test/api/search?q=${"a".repeat(121)}`)
    );
    expect(response.status).toBe(400);
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });
});
