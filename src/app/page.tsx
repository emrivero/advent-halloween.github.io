import PlanButtonClient from "@/components/PlanButtonClient";
import Link from "next/link";
import LanguageSelector from "@/components/LanguageSelector";
import { getI18n } from "@/i18n/server";

export default async function HomePage() {
  const { t } = await getI18n();
  return (
    <div className="mx-auto max-w-6xl py-10">
      {/* Hero */}
      <section className="grid gap-6 text-center">
        <div className="flex justify-end"><LanguageSelector /></div>
        <h1 className="text-4xl md:text-5xl font-bold text-halloweenAccent font-werebeast">
          {t("homeTitle")}
        </h1>
        <p className="mx-auto max-w-2xl text-white/80">
          {t("homeLead")}
        </p>
        <p className="mx-auto max-w-2xl text-white/80">
          {t("homeIntro")}
        </p>
      </section>

      {/* Cards */}
      <section className="mt-10 grid gap-6 md:grid-cols-2">
        {/* FULL (destacada) */}
        <div
          className="
          relative overflow-hidden rounded-2xl p-1 
          bg-gradient-to-br from-halloweenUnlocked/70 via-halloweenAccent/60 to-halloweenLocked/60
          shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        >
          <div className="rounded-2xl bg-gray-950/95 p-6 md:p-7 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-semibold text-[#f0a500]">
                {t("fullVersion")}
              </h2>
              <span className="rounded-full bg-halloweenUnlocked/20 text-halloweenUnlocked px-3 py-1 text-xs tracking-wide">
                {t("recommended")}
              </span>
            </div>
            <p className="mt-3 text-white/80">
              {t("fullDescription")}
            </p>

            <ul className="mt-5 space-y-2 text-left text-white/80">
              <li>• {t("fullFeature1")}</li>
              <li>• {t("fullFeature2")}</li>
              <li>• {t("fullFeature3")}</li>
            </ul>

            <PlanButtonClient />
          </div>
        </div>

        {/* SIMPLE (demo) */}
        <div className="rounded-2xl border border-white/10 bg-gray-950/70 p-6 md:p-7">
          <h2 className="text-2xl md:text-3xl font-semibold">{t("simpleVersion")}</h2>
          <p className="mt-3 text-white/80">
            {t("simpleDescription")}
          </p>

          <ul className="mt-5 space-y-2 text-left text-white/80">
            <li>• {t("simpleFeature1")}</li>
            <li>• {t("simpleFeature2")}</li>
            <li>• {t("simpleFeature3")}</li>
          </ul>

          <div className="mt-6">
            <Link
              href="/halloween"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              {t("tryVersion")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
