
"use client";

import CountUp from "react-countup";

interface StatsCardProps {
  title: string;
  end: number;
  suffix?: string;
}

export default function StatsCard({
  title,
  end,
  suffix = "",
}: StatsCardProps) {
  return (
    <div className="bg-slate-100 rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 h-52 flex flex-col justify-between">
      <div>
        <span className="inline-block bg-slate-200 text-slate-700 text-sm font-medium px-3 py-1 rounded-lg">
          {title}
        </span>
      </div>

      <div>
        <h2 className="text-5xl md:text-6xl font-bold text-slate-900">
          <CountUp end={end} duration={4} />
          {suffix}
        </h2>
      </div>
    </div>
  );
}