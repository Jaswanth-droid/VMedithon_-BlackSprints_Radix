"use client";

import React from "react";
import Link from "next/link";

export default function Hero() {
  const [isHeaderVisible, setIsHeaderVisible] = React.useState(false);
  const [isSubtextVisible, setIsSubtextVisible] = React.useState(false);

  React.useEffect(() => {
    const headerTimer = setTimeout(() => {
      setIsHeaderVisible(true);
    }, 500);

    const subtextTimer = setTimeout(() => {
      setIsSubtextVisible(true);
    }, 1500);

    return () => {
      clearTimeout(headerTimer);
      clearTimeout(subtextTimer);
    };
  }, []);

  return (
    <section className="relative w-full bg-white pt-10 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Main Headings */}
        <h1 
          className="flex flex-col text-[50px] sm:text-[70px] lg:text-[85px] font-bold tracking-tight text-[#2d2d2d] leading-[1.1] md:leading-[1.05] transition-opacity duration-1000"
          style={{ opacity: isHeaderVisible ? 1 : 0 }}
        >
          <span>Innovative</span>
          <span>Reliable</span>
          <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-indigo-500 bg-clip-text text-transparent pb-2">
            Client-Centric
          </span>
        </h1>

        {/* Subtext */}
        <p 
          className="mt-8 max-w-4xl text-[15px] sm:text-[17px] text-slate-500 font-normal leading-relaxed transition-opacity duration-1000"
          style={{ opacity: isSubtextVisible ? 1 : 0 }}
        >
          We specialise in SAP Functional and Technical Consulting - from Implementations and Integrations to AI, Automation, and Data Intelligence
          <br className="hidden sm:inline" />
          {" "}- helping clients streamline operations, boost decision-making, and drive measurable business results.
        </p>

        {/* Explore Button */}
        <div className="mt-8">
          <Link
            href="#services"
            className="inline-flex items-center justify-center rounded-full bg-[#292929] hover:bg-black px-10 py-3.5 text-[16px] font-medium text-white shadow-sm transition-all duration-200"
          >
            Explore Now
          </Link>
        </div>

        {/* Trusted By Subheading */}
        <div className="mt-20 text-[28px] sm:text-[38px] lg:text-[45px] font-bold tracking-tight text-slate-900 leading-[1.2]">
          <h2>Trusted by leading enterprises across</h2>
          <h2>industries worldwide.</h2>
        </div>

      </div>
    </section>
  );
}
