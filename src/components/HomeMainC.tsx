"use client";

import React from "react";
import Link from "next/link";

interface Service {
  id: string;
  title: string;
  desc: string;
  linkText: string;
  route: string;
  icon: React.ReactNode;
}

export default function Services() {
  const services: Service[] = [
    {
      id: "erp",
      title: "ERP Solutions",
      desc: "Seamlessly implement and optimize SAP ERP systems for scalable business operations.",
      linkText: "Explore ERP Services",
      route: "/services/erp",
      icon: (
        <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9h.008v.008H12V9zm-3 0h.008v.008H9V9zm6 0h.008v.008H15V9z" />
        </svg>
      )
    },
    {
      id: "cloud",
      title: "Cloud Services",
      desc: "Secure, scalable, and cost-effective infrastructure for your digital workloads.",
      linkText: "Explore Cloud Services",
      route: "/services/cloud-services",
      icon: (
        <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
        </svg>
      )
    },
    {
      id: "analytics",
      title: "Planning & Analytics",
      desc: "Turn real-time SAP data into powerful insights with actionable dashboards.",
      linkText: "Explore Analytics",
      route: "/services/planning-analytics",
      icon: (
        <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
      )
    },
    {
      id: "automation",
      title: "AI & Intelligent Automation",
      desc: "Streamline operations using AI-driven digital workers and intelligent workflows.",
      linkText: "Explore Automation",
      route: "/services/ai-automation",
      icon: (
        <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M12 15H8a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1zm8.25-3h-1.5M4.5 12H3m15-5.25l-1.5 1.5M6.75 6.75l1.5 1.5m8.25 7.5l-1.5-1.5M6.75 17.25l1.5-1.5" />
        </svg>
      )
    },
    {
      id: "cybersecurity",
      title: "Cyber Security",
      desc: "End-to-end protection across SAP, cloud, and IT environments.",
      linkText: "Explore Cybersecurity",
      route: "/services/cybersecurity",
      icon: (
        <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )
    },
    {
      id: "infrastructure",
      title: "Smart Spaces & IT Infrastructure",
      desc: "Integrated infrastructure and IoT solutions to power smart enterprise environments.",
      linkText: "Explore Smart Infrastructure",
      route: "/services/smart-spaces",
      icon: (
        <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M9 16.5h1.5m3 0h1.5" />
        </svg>
      )
    }
  ];

  return (
    <section id="services" className="relative w-full py-24 px-4 sm:px-6 bg-white overflow-hidden">
      {/* Subtle Hexagonal Background Pattern Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
              <path d="M25 0 L50 14.4 L50 43.4 L25 57.8 L0 43.4 L0 14.4 Z" fill="none" stroke="currentColor" strokeWidth="1" />
              <path d="M25 43.4 L50 57.8 L50 86.8 L25 101.2 L0 86.8 L0 57.8 Z" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl relative z-10">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-20 relative">
          {/* Honeycomb Pattern behind/above the Title */}
          <div className="absolute left-1/2 -top-16 -translate-x-1/2 w-72 h-36 pointer-events-none opacity-[0.08] hidden sm:block">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
              <defs>
                <pattern id="title-hexagons" width="20" height="17.32" patternUnits="userSpaceOnUse">
                  <path d="M10 0 L20 5.77 L20 17.32 L10 23.09 L0 17.32 L0 5.77 Z" fill="none" stroke="#4f46e5" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#title-hexagons)" />
            </svg>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-slate-100/80 border border-slate-200 px-4 py-1.5 rounded-full mb-6 relative z-10">
            <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-[12px] font-semibold text-slate-700 tracking-wide uppercase">
              What We Do?
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight relative z-10">
            Services
          </h2>
          
          <p className="mt-4 text-[14px] sm:text-[15px] text-slate-500 font-medium italic max-w-2xl mx-auto leading-relaxed relative z-10">
            "We help businesses scale with cloud-native ERP, advanced analytics, intelligent automation, and secure digital infrastructure."
          </p>
        </div>

        {/* 3x2 Grid of Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.id}
              className="group relative rounded-2xl bg-white border border-slate-100 p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(79,70,229,0.08)] hover:border-indigo-100 transition-all duration-500 flex flex-col items-center text-center"
            >
              {/* Icon Container with Wings */}
              <div className="relative mb-6">
                {/* Left Wing */}
                <div className="absolute inset-0 bg-[#4f46e5]/10 rounded-[18px] transition-all duration-500 ease-out transform scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:-translate-x-3 group-hover:-rotate-12 z-0"></div>
                {/* Right Wing */}
                <div className="absolute inset-0 bg-[#4f46e5]/10 rounded-[18px] transition-all duration-500 ease-out transform scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-3 group-hover:rotate-12 z-0"></div>
                
                {/* Icon box container (Main Card) */}
                <div className="relative z-10 w-16 h-16 rounded-[18px] bg-blue-50/50 border border-blue-100/60 flex items-center justify-center shadow-sm transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_12px_24px_rgba(79,70,229,0.15)] group-hover:border-indigo-300 bg-white">
                  <div className="transition-transform duration-500 group-hover:scale-110">
                    {service.icon}
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-[18px] sm:text-[20px] font-bold text-[#4f46e5] group-hover:text-indigo-600 transition-colors mb-3">
                {service.title}
              </h3>

              {/* Description */}
              <p className="text-[13px] sm:text-[14px] text-slate-500 font-normal leading-relaxed mb-6 flex-1 max-w-xs">
                {service.desc}
              </p>

              {/* Route Link */}
              <Link
                href={service.route}
                className="text-[13px] font-bold text-slate-800 hover:text-[#4f46e5] inline-flex items-center gap-1.5 transition-colors group/link cursor-pointer"
              >
                <span>{service.linkText}</span>
                <span className="transform group-hover/link:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
