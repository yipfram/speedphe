import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CityMap } from '@/components/cities/CityMap';
import { CITIES, getCityBySlug } from '@/lib/cities';
import { getCityPageData } from '@/lib/city-seo';

const BASE_URL = 'https://speedphe.rrchs.fr';

function formatNumber(value: number | null, digits = 1) {
  return value == null ? 'N/A' : value.toFixed(digits);
}

function formatDate(value: string | null) {
  if (!value) {
    return 'No tests yet';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function getAimLabel(score: number | null) {
  if (score == null) {
    return 'No score yet';
  }
  if (score >= 85) {
    return 'Excellent';
  }
  if (score >= 70) {
    return 'Strong';
  }
  if (score >= 55) {
    return 'Solid';
  }
  if (score >= 40) {
    return 'Mixed';
  }

  return 'Weak';
}

export async function generateStaticParams() {
  return CITIES.map((city) => ({
    citySlug: city.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}): Promise<Metadata> {
  const { citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    return {};
  }

  const url = `${BASE_URL}/cities/${city.slug}`;

  return {
    title: city.title,
    description: city.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: city.title,
      description: city.description,
      url,
      type: 'article',
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: `Casphe guide for cafes with fast Wi-Fi in ${city.name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: city.title,
      description: city.description,
      images: ['/opengraph-image'],
    },
    keywords: city.keywords,
  };
}

export default async function CityPage({ params }: { params: Promise<{ citySlug: string }> }) {
  const { citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    notFound();
  }

  const pageData = await getCityPageData(city);

  return (
    <main className="min-h-screen bg-[#f6f1e8] px-6 py-12 text-[#1f1a17] lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,_#f4ead9_0%,_#fffaf3_52%,_#f8efe3_100%)] p-8 shadow-[0_18px_40px_rgba(31,26,23,0.08)] md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9a5320]">
            Local SEO landing page
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[#241a14] md:text-5xl">
            {pageData.city.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[#584c43]">{pageData.city.intro}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] border border-black/8 bg-white/80 p-5">
              <p className="text-sm text-[#7d6c61]">Tested cafes</p>
              <p className="mt-2 text-3xl font-semibold text-[#241a14]">
                {pageData.stats.cafeCount}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-black/8 bg-white/80 p-5">
              <p className="text-sm text-[#7d6c61]">Average download</p>
              <p className="mt-2 text-3xl font-semibold text-[#241a14]">
                {formatNumber(pageData.stats.averageDownloadMbps)} Mbps
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-black/8 bg-white/80 p-5">
              <p className="text-sm text-[#7d6c61]">Average latency</p>
              <p className="mt-2 text-3xl font-semibold text-[#241a14]">
                {formatNumber(pageData.stats.averageLatencyMs, 0)} ms
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-black/8 bg-white/80 p-5">
              <p className="text-sm text-[#7d6c61]">Video call fit</p>
              <p className="mt-2 text-lg font-semibold text-[#241a14]">
                {getAimLabel(pageData.stats.averageRtcScore)}
                {pageData.stats.averageRtcScore != null
                  ? ` · ${formatNumber(pageData.stats.averageRtcScore, 0)}/100`
                  : ''}
              </p>
            </div>
          </div>
        </section>

        {!pageData.dataAvailable && (
          <section className="mt-6 rounded-[1.5rem] border border-amber-300 bg-amber-50 px-6 py-5 text-[#5f5248] shadow-[0_10px_24px_rgba(31,26,23,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9a5320]">
              Live data temporarily unavailable
            </p>
            <p className="mt-2 text-sm leading-6">
              We could not load the latest tested cafes for {pageData.city.name} right now.
              {pageData.dataError ? ` ${pageData.dataError}` : ''} The city page stays available,
              but rankings and map markers will appear again once the database responds.
            </p>
          </section>
        )}

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_18px_40px_rgba(31,26,23,0.08)]">
          <div className="border-b border-black/8 px-6 py-5 md:px-8">
            <h2 className="text-2xl font-semibold tracking-tight text-[#241a14]">
              Tested cafe map
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#5f5248]">
              View every tested cafe inside {pageData.city.regionName}. The map helps users explore
              spatially, while the ranking below turns the same data into an indexable city guide.
            </p>
          </div>
          <CityMap
            center={pageData.city.center}
            bounds={pageData.city.bounds}
            places={pageData.allPlaces}
          />
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_18px_40px_rgba(31,26,23,0.08)] md:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#241a14]">
                  Top tested cafes with the best Wi-Fi for work
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#5f5248]">
                  Ranked from real speed tests. Untested cafes are excluded from this list.
                </p>
              </div>
              <p className="text-sm text-[#7d6c61]">{pageData.topPlaces.length} cafes listed</p>
            </div>

            <div className="mt-6 space-y-4">
              {pageData.topPlaces.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-[#fcfaf7] p-6 text-sm text-[#5f5248]">
                  {pageData.dataAvailable
                    ? 'No tested cafes are available for this city yet.'
                    : 'Tested cafes could not be loaded right now.'}
                </div>
              ) : (
                pageData.topPlaces.map((place, index) => (
                  <article
                    key={place.id}
                    className="rounded-[1.5rem] border border-black/8 bg-[#fcfaf7] p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-2xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9a5320]">
                          Rank #{index + 1}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-[#241a14]">{place.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#5f5248]">
                          {place.address ?? 'Address unavailable'}
                        </p>
                      </div>
                      {place.limitedData && (
                        <span className="rounded-full bg-[#f9e4c6] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9a5320]">
                          Limited data
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <MetricCard
                        label="Download"
                        value={`${formatNumber(place.avg_download_mbps)} Mbps`}
                      />
                      <MetricCard
                        label="Upload"
                        value={`${formatNumber(place.avg_upload_mbps)} Mbps`}
                      />
                      <MetricCard
                        label="Latency"
                        value={`${formatNumber(place.avg_latency_ms, 0)} ms`}
                      />
                      <MetricCard
                        label="Tests"
                        value={`${place.test_count} · ${formatDate(place.last_tested_at)}`}
                      />
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <AimCard label="Streaming" score={place.avg_streaming_score} />
                      <AimCard label="Gaming" score={place.avg_gaming_score} />
                      <AimCard label="Video calls" score={place.avg_rtc_score} />
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <aside className="space-y-8">
            <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_18px_40px_rgba(31,26,23,0.08)]">
              <h2 className="text-xl font-semibold tracking-tight text-[#241a14]">How we rank</h2>
              <p className="mt-3 text-sm leading-6 text-[#5f5248]">
                The ranking favors measured download speed first, then upload speed, latency, and a
                small confidence boost from repeated tests.
              </p>
              <p className="mt-3 text-sm leading-6 text-[#5f5248]">
                AIM scores show how suitable a cafe is for streaming, gaming, and video calls based
                on the underlying speed test profile.
              </p>
              <p className="mt-3 text-sm leading-6 text-[#5f5248]">
                Cafes with too few tests stay visible but receive a{' '}
                <span className="font-semibold text-[#241a14]">Limited data</span> label so users
                can judge certainty.
              </p>
            </section>

            <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_18px_40px_rgba(31,26,23,0.08)]">
              <h2 className="text-xl font-semibold tracking-tight text-[#241a14]">City snapshot</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#5f5248]">
                <li>
                  {pageData.stats.totalTests} total speed tests recorded in {pageData.city.name}.
                </li>
                <li>
                  {formatNumber(pageData.stats.averageUploadMbps)} Mbps average upload across tested
                  cafes.
                </li>
                <li>
                  Average fit scores: {getAimLabel(pageData.stats.averageStreamingScore)} for
                  streaming, {getAimLabel(pageData.stats.averageGamingScore)} for gaming, and{' '}
                  {getAimLabel(pageData.stats.averageRtcScore)} for calls.
                </li>
                <li>
                  Freshness matters: rankings use the latest available test history for each cafe.
                </li>
                <li>Last city update: {formatDate(pageData.stats.lastTestedAt)}.</li>
              </ul>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-black/8 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8b7b6e]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#241a14]">{value}</p>
    </div>
  );
}

function AimCard({ label, score }: { label: string; score: number | null }) {
  return (
    <div className="rounded-[1.25rem] border border-black/8 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8b7b6e]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#241a14]">{getAimLabel(score)}</p>
      <p className="mt-1 text-xs text-[#7d6c61]">
        {score == null ? 'Waiting for compatible tests' : `${formatNumber(score, 0)}/100`}
      </p>
    </div>
  );
}
