"use client";

const industries = [
  "Information Technology",
  "Logistics",
  "Energy & Utilities",
  "Higher Education & Research",
  "Real Estate",
  "Pharma",
  "Manufacturing",
];

export default function FocusIndustries() {
  return (
    <section className="relative overflow-hidden bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center">
          <h2 className="text-5xl md:text-7xl font-bold text-slate-900">
            Focus Industries
          </h2>

          <p className="mt-4 text-lg text-slate-500">
            &ldquo;Accelerating Value Across Enterprise Landscapes.&rdquo;
          </p>
        </div>

        <div className="relative mt-16 overflow-hidden">

          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-linear-to-r from-white to-transparent" />

          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-linear-to-l from-white to-transparent" />

          <div className="flex animate-marquee w-max gap-4">

            {[...industries, ...industries].map((item, index) => (
              <div
                key={index}
                className="
                  whitespace-nowrap
                  rounded-full
                  bg-slate-200
                  px-8
                  py-2
                  text-lg
                  font-medium
                  text-slate-800
                  transition-all
                  duration-300
                  hover:bg-slate-900
                  hover:text-white
                "
              >
                {item}
              </div>
            ))}

          </div>

        </div>
      </div>
    </section>
  );
}