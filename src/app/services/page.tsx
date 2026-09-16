"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ServicesPage() {
  const items = [
    {
      id: "erp",
      title: "ERP SOLUTION",
      tagline: "EMPOWERING YOUR BUSINESS WITH INTELLIGENT ERP ADOPTION.",
      desc: "At TechSuite, We Bring Deep Domain Knowledge And SAP Expertise To Help Organizations Streamline Operations, Reduce Manual Overhead, And Unlock Real-Time Insights Through ERP Modernization.",
      linkText: "Explore ERP Services",
      route: "/services/erp",
      side: "right",
      icon: (
        <svg className="w-12 h-12 text-[#6875f5]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="12" width="48" height="32" rx="4" stroke="currentColor" strokeWidth="2.5" />
          <path d="M24 44L20 52H44L40 44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M32 44V52" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="20" cy="28" r="3" fill="currentColor" />
          <circle cx="32" cy="22" r="3" fill="currentColor" />
          <circle cx="44" cy="28" r="3" fill="currentColor" />
          <path d="M23 28H29L32 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M41 28H35L32 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: "cloud",
      title: "CLOUD SERVICES – IAAS",
      tagline: "SECURE, SCALABLE INFRASTRUCTURE THAT GROWS WITH YOUR NEEDS.",
      desc: "We Help Businesses Modernize Their IT Backbone By Enabling Secure, Cost-Effective, And Highly Available Cloud Hosting Environments For SAP And Enterprise Workloads.",
      linkText: "Explore Cloud Services",
      route: "/services/cloud-services",
      side: "left",
      icon: (
        <svg className="w-12 h-12 text-[#6875f5]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 38C15 38 12 35.5 12 32C12 28.5 15 26 18 26C19 21 23 18 29 18C35 18 39 22 40 26C44 26 48 28.5 48 32C48 35.5 44 38 41 38H18Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="20" y="32" width="24" height="12" rx="2" stroke="currentColor" strokeWidth="2.5" />
          <line x1="24" y1="38" x2="26" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="30" y1="38" x2="32" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: "analytics",
      title: "PLANNING & ANALYTICS",
      tagline: "TURN INSIGHTS INTO IMPACT WITH REAL-TIME ANALYTICS AND PLANNING.",
      desc: "We Empower Organizations To Move From Spreadsheets To Insights By Delivering Data Visualization, Planning, And Forecasting Solutions Integrated With SAP And Microsoft Platforms.",
      linkText: "Explore Analytics",
      route: "/services/planning-analytics",
      side: "right",
      icon: (
        <svg className="w-12 h-12 text-[#6875f5]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 48H52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M16 40L28 28L38 34L48 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="48" cy="20" r="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="36" cy="28" r="6" stroke="currentColor" strokeWidth="2" />
          <line x1="40.5" y1="32.5" x2="46" y2="38" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    },
    {
      id: "automation",
      title: "AI & INTELLIGENT AUTOMATION",
      tagline: "AUTOMATE WITH CONFIDENCE USING AI-POWERED DIGITAL WORKERS.",
      desc: "We Implement Intelligent Automation That Frees Up Your Workforce, Enhances Accuracy, And Speeds Up Time-To-Value—Powered By SS&C Blue Prism.",
      linkText: "Explore Automation",
      route: "/services/ai-automation",
      side: "left",
      icon: (
        <svg className="w-12 h-12 text-[#6875f5]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="16" y="16" width="32" height="32" rx="8" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="26" cy="28" r="3" fill="currentColor" />
          <circle cx="38" cy="28" r="3" fill="currentColor" />
          <path d="M26 38C26 38 29 41 32 41C35 41 38 38 38 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12" y1="28" x2="16" y2="28" stroke="currentColor" strokeWidth="2.5" />
          <line x1="12" y1="34" x2="16" y2="34" stroke="currentColor" strokeWidth="2.5" />
          <line x1="48" y1="28" x2="52" y2="28" stroke="currentColor" strokeWidth="2.5" />
          <line x1="48" y1="34" x2="52" y2="34" stroke="currentColor" strokeWidth="2.5" />
          <path d="M32 16V10M30 10H34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    },
    {
      id: "cybersecurity",
      title: "CYBER SECURITY",
      tagline: "ENSURE DATA INTEGRITY WITH NEXT-GEN SECURITY MEASURES.",
      desc: "We Help Protect Your Data, Infrastructure, And User Access With Our Suite Of Cybersecurity Services Tailored For SAP, Enterprise IT, And Hybrid Cloud Environments.",
      linkText: "Explore Cybersecurity",
      route: "/services/cybersecurity",
      side: "right",
      icon: (
        <svg className="w-12 h-12 text-[#6875f5]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 12C32 12 44 15 44 24V36C44 44 32 50 32 50C32 50 20 44 20 36V24C20 15 32 12 32 12Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="27" y="28" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
          <path d="M29 28V25C29 23.3 30.3 22 32 22C33.7 22 35 23.3 35 25V28" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    },
    {
      id: "infrastructure",
      title: "SMART SPACES & IT INFRASTRUCTURE",
      tagline: "DESIGNING INTELLIGENT WORKSPACES AND RESILIENT IT ENVIRONMENTS.",
      desc: "We Design And Implement Robust, Scalable IT Infrastructure And Smart Workplace Environments—Laying The Foundation For Seamless Digital Operations.",
      linkText: "Explore Smart Infrastructure",
      route: "/services/smart-spaces",
      side: "left",
      icon: (
        <svg className="w-12 h-12 text-[#6875f5]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="22" y="24" width="8" height="24" stroke="currentColor" strokeWidth="2" />
          <rect x="34" y="16" width="10" height="32" stroke="currentColor" strokeWidth="2" />
          <path d="M12 48H52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M14 26C16 23 20 23 22 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 22C16 18 22 18 26 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="16" cy="34" r="2" fill="currentColor" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900">
      <Navbar />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center">

          {/* Services Badge */}
          <div className="mb-6">
            <span className="bg-[#6875f5] text-white px-4 py-1.5 rounded-md text-xs font-semibold">
              Services
            </span>
          </div>

          {/* Heading */}
          <h1 className="flex flex-col text-center text-[45px] sm:text-[60px] lg:text-[70px] font-bold tracking-tight text-[#2d2d2d] leading-[1.1] md:leading-[1.05]">
            <span>Innovative Reliable</span>
            <span className="bg-linear-to-r from-orange-400 via-pink-400 to-indigo-500 bg-clip-text text-transparent pb-2">
              Client-Centric
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-8 max-w-3xl text-center text-[15px] sm:text-[16px] text-slate-500 font-normal leading-relaxed">
            At TechSuite, our vision is to empower businesses with transformative technology that drives efficiency, agility, and innovation. We are committed to delivering trust, excellence, and customer success through cutting-edge solutions in ERP, Analytics, AI, and Cloud Services.
          </p>

          {/* Timeline Section */}
          <div className="relative mt-24 w-full max-w-5xl">

            {/* Center Vertical Timeline Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-linear-to-b from-[#6875f5] via-pink-400 to-indigo-500 transform -translate-x-1/2 hidden md:block"></div>

            <div className="space-y-16 md:space-y-24 relative">
              {items.map((item) => {
                const isRight = item.side === "right";
                return (
                  <div key={item.id} className="relative flex flex-col md:flex-row items-stretch w-full">

                    {/* Timeline Node Point (Hidden on mobile) */}
                    <div className="absolute left-1/2 top-[52px] w-3.5 h-3.5 rounded-full bg-[#6875f5] border-2 border-white transform -translate-x-1/2 z-10 hidden md:block shadow-[0_2px_4px_rgba(0,0,0,0.1)]"></div>

                    {/* Left Column */}
                    <div className={`w-full md:w-1/2 flex-col items-start md:items-end text-left md:text-right md:pr-16 group ${isRight ? "hidden md:flex" : "flex"}`}>
                      {!isRight && (
                        <>
                          {/* Icon Container with Wings */}
                          <div className="relative mb-6">
                            {/* Left Wing */}
                            <div className="absolute inset-0 bg-[#6875f5]/70 rounded-2xl transition-all duration-500 ease-out transform scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:-translate-x-5 group-hover:-rotate-12 z-0"></div>
                            {/* Right Wing */}
                            <div className="absolute inset-0 bg-[#6875f5]/70 rounded-2xl transition-all duration-500 ease-out transform scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-5 group-hover:rotate-12 z-0"></div>
                            
                            {/* Main Card */}
                            <div className="relative z-10 flex items-center justify-center w-28 h-28 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(104,117,245,0.12)] group-hover:border-[#6875f5]/30">
                              <div className="transition-transform duration-500 group-hover:scale-110">
                                {item.icon}
                              </div>
                            </div>
                          </div>
                          
                          <h2 className="text-[#6875f5] text-[28px] sm:text-[32px] font-bold tracking-tight mb-2 uppercase transition-colors duration-300 group-hover:text-indigo-600">
                            {item.title}
                          </h2>
                          <p className="text-slate-800 text-[13px] sm:text-[14px] font-bold tracking-wider mb-4 uppercase">
                            {item.tagline}
                          </p>
                          <p className="text-slate-500 text-[14px] sm:text-[15px] leading-relaxed mb-6 max-w-md">
                            {item.desc}
                          </p>
                          <Link
                            href={item.route}
                            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-[#6875f5] font-semibold text-[14px] transition-colors group/link"
                          >
                            <span>{item.linkText}</span>
                            <span className="text-[16px] transform transition-transform duration-300 group-hover/link:translate-x-1.5">→</span>
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className={`w-full md:w-1/2 flex-col items-start text-left md:pl-16 group ${!isRight ? "hidden md:flex" : "flex"}`}>
                      {isRight && (
                        <>
                          {/* Icon Container with Wings */}
                          <div className="relative mb-6">
                            {/* Left Wing */}
                            <div className="absolute inset-0 bg-[#6875f5]/70 rounded-2xl transition-all duration-500 ease-out transform scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:-translate-x-5 group-hover:-rotate-12 z-0"></div>
                            {/* Right Wing */}
                            <div className="absolute inset-0 bg-[#6875f5]/70 rounded-2xl transition-all duration-500 ease-out transform scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-5 group-hover:rotate-12 z-0"></div>
                            
                            {/* Main Card */}
                            <div className="relative z-10 flex items-center justify-center w-28 h-28 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(104,117,245,0.12)] group-hover:border-[#6875f5]/30">
                              <div className="transition-transform duration-500 group-hover:scale-110">
                                {item.icon}
                              </div>
                            </div>
                          </div>
                          
                          <h2 className="text-[#6875f5] text-[28px] sm:text-[32px] font-bold tracking-tight mb-2 uppercase transition-colors duration-300 group-hover:text-indigo-600">
                            {item.title}
                          </h2>
                          <p className="text-slate-800 text-[13px] sm:text-[14px] font-bold tracking-wider mb-4 uppercase">
                            {item.tagline}
                          </p>
                          <p className="text-slate-500 text-[14px] sm:text-[15px] leading-relaxed mb-6 max-w-md">
                            {item.desc}
                          </p>
                          <Link
                            href={item.route}
                            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-[#6875f5] font-semibold text-[14px] transition-colors group/link"
                          >
                            <span>{item.linkText}</span>
                            <span className="text-[16px] transform transition-transform duration-300 group-hover/link:translate-x-1.5">→</span>
                          </Link>
                        </>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
