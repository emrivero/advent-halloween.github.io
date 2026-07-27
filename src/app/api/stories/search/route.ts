import { localeFromRequest, translate } from "@/i18n/config";
import { allowRequest } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const OPEN_LIBRARY_SEARCH = "https://openlibrary.org/search.json";

export async function GET(request: Request) {
  const locale = localeFromRequest(request);
  if (!allowRequest(request, "open-library", 30))
    return NextResponse.json(
      { error: translate(locale, "tooManyRequests") },
      { status: 429 }
    );

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ results: [] });
  if (query.length > 120)
    return NextResponse.json(
      { error: translate(locale, "searchTooLong") },
      { status: 400 }
    );

  const params = new URLSearchParams({
    q: query,
    lang: locale,
    limit: "12",
    fields:
      "key,title,author_name,first_publish_year,cover_i,number_of_pages_median,ebook_access",
  });

  try {
    const response = await fetch(`${OPEN_LIBRARY_SEARCH}?${params}`, {
      headers: {
        accept: "application/json",
        "user-agent": "AdventHalloween/1.0 (reading-calendar)",
      },
      next: { revalidate: 3600 },
    });
    if (!response.ok)
      return NextResponse.json(
        { error: translate(locale, "storySearchError") },
        { status: 502 }
      );

    const payload = await response.json();
    const docs = Array.isArray(payload?.docs) ? payload.docs : [];
    const results = docs
      .filter((doc: any) => typeof doc?.key === "string" && doc?.title)
      .slice(0, 12)
      .map((doc: any) => {
        const workId = String(doc.key).replace("/works/", "");
        const pages = Number(doc.number_of_pages_median);
        return {
          open_library_id: workId,
          title: String(doc.title),
          author: Array.isArray(doc.author_name)
            ? doc.author_name.slice(0, 3).join(", ")
            : translate(locale, "unknownAuthor"),
          year: Number.isInteger(doc.first_publish_year)
            ? doc.first_publish_year
            : null,
          reading_min:
            Number.isFinite(pages) && pages > 0
              ? Math.max(10, Math.round(pages * 1.8))
              : 30,
          cover_url: doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
            : null,
          source_url: `https://openlibrary.org/works/${workId}`,
        };
      });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: translate(locale, "storySearchError") },
      { status: 502 }
    );
  }
}
