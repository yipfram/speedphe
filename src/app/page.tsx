import Link from 'next/link';
import { HomeExperience } from '@/components/home/HomeExperience';
import { CITIES } from '@/lib/cities';

export default function Home() {
  return (
    <main className="bg-[#f6f1e8] text-[#1f1a17]">
      <section className="border-b border-black/10 bg-[radial-gradient(circle_at_top_left,_rgba(204,120,52,0.18),_transparent_28%),linear-gradient(135deg,_#f7efe3_0%,_#efe4d3_48%,_#f8f4ee_100%)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#9a5320]">
              Measured cafe Wi-Fi for work
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[#241a14] md:text-6xl">
              Find cafes with the fastest Wi-Fi before you open your laptop.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#4f433b]">
              Casphe helps remote workers, freelancers, and students compare real speed test data
              from cafes. Start with Hanoi and Ho Chi Minh City, then explore nearby spots on the
              live map.
            </p>
          </div>

          <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2">
            {CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/cities/${city.slug}`}
                className="group rounded-[1.75rem] border border-black/10 bg-white/80 p-5 shadow-[0_10px_30px_rgba(31,26,23,0.08)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1"
              >
                <p className="text-sm font-medium text-[#9a5320]">City guide</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#241a14]">{city.name}</h2>
                <p className="mt-3 text-sm leading-6 text-[#5f5248]">{city.intro}</p>
                <p className="mt-4 text-sm font-semibold text-[#241a14] group-hover:text-[#9a5320]">
                  Explore {city.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#241a14]">Live cafe map</h2>
            <p className="max-w-3xl text-sm leading-6 text-[#5f5248]">
              Browse nearby cafes, submit new speed tests, and compare tested spots against newly
              discovered places from the map.
            </p>
          </div>
          <p className="text-sm text-[#7a6b61]">
            Speed-tested cafes stay pinned above untested discoveries.
          </p>
        </div>
        <div className="overflow-hidden rounded-[2rem] border border-black/10 shadow-[0_20px_50px_rgba(31,26,23,0.08)]">
          <HomeExperience />
        </div>
      </section>
    </main>
  );
}
