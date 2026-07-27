import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/stories/search", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("no consulta Open Library para búsquedas demasiado cortas", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(
      new Request("http://test/api/stories/search?q=a")
    );
    expect(await response.json()).toEqual({ results: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mapea obras y construye enlaces y portadas seguros", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            docs: [
              {
                key: "/works/OL45804W",
                title: "Carmilla",
                author_name: ["J. Sheridan Le Fanu"],
                first_publish_year: 1872,
                cover_i: 123,
                number_of_pages_median: 100,
              },
            ],
          })
        )
      )
    );
    const response = await GET(
      new Request("http://test/api/stories/search?q=Carmilla", {
        headers: { cookie: "locale=en" },
      })
    );
    expect(await response.json()).toEqual({
      results: [
        {
          open_library_id: "OL45804W",
          title: "Carmilla",
          author: "J. Sheridan Le Fanu",
          year: 1872,
          reading_min: 180,
          cover_url: "https://covers.openlibrary.org/b/id/123-M.jpg",
          source_url: "https://openlibrary.org/works/OL45804W",
        },
      ],
    });
  });

  it("localiza los errores del proveedor", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    const response = await GET(
      new Request("http://test/api/stories/search?q=ghost", {
        headers: { cookie: "locale=en" },
      })
    );
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Open Library search failed.",
    });
  });
});
