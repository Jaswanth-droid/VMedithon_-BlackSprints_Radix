"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Grip } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 w-full pt-6">
      <div className="w-full flex justify-center px-3 sm:px-5 lg:px-6">
        <nav
          className={`relative mx-auto w-full max-w-6xl rounded-[14px]
          bg-white/15
          backdrop-blur-[6px]
          border border-black/4
          
          transition-all duration-300
          overflow-hidden
          px-4 sm:px-6 lg:px-8
          ${open ? "py-1" : "py-0.5"}`}
        >
          <div className="flex items-center justify-between">

            
            <Link href="/" className="flex items-center">
              <Image
  src="/logoo.png"
  alt="TechSuite System Logo"
  width={180}
  height={48}
  priority
  className="h-10 w-auto object-contain sm:h-11 lg:h-12"
/>
            </Link>

            
            <div className="hidden lg:flex items-center gap-10 xl:gap-14 text-[15px] font-medium">

              <Link
                href="/"
                className="group relative inline-block h-6 overflow-hidden text-slate-700 hover:text-black"
              >
                <span className="block transition-transform duration-300 group-hover:-translate-y-6">
                  <span className="block h-6 font-bold leading-6">Home</span>
                  <span className="block h-6 font-bold leading-6">Home</span>
                </span>
              </Link>

              <Link
                href="/services"
                className="group relative inline-block h-6 overflow-hidden text-slate-700 hover:text-black"
              >
                <span className="block transition-transform duration-300 group-hover:-translate-y-6">
                  <span className="block h-6 font-bold leading-6">Services</span>
                  <span className="block h-6 font-bold leading-6">Services</span>
                </span>
              </Link>

              <Link
                href="/about"
                className="group relative inline-block h-6 overflow-hidden text-slate-700 hover:text-black"
              >
                <span className="block transition-transform duration-300 group-hover:-translate-y-6">
                  <span className="block h-6 font-bold leading-6">About Us</span>
                  <span className="block h-6 font-bold leading-6">About Us</span>
                </span>
              </Link>

            </div>

        
            <div className="flex items-center gap-3">

              <Link
                href="/contact"
                className="hidden lg:inline-flex items-center gap-2  bg-slate-900 px-2 py-1 rounded-md text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-black"
              >
                <span>Contact Us</span>
                <span className="text-lg">›</span>
              </Link>

              <button
                aria-label="Open Menu"
                onClick={() => setOpen(!open)}
                className="lg:hidden inline-flex h-5 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-800 transition hover:bg-white/20"
              >
                <Grip size={22} />
              </button>

            </div>

          </div>

          
          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              open
                ? "max-h-72 opacity-100 mt-4"
                : "max-h-0 opacity-0"
            }`}
          >
            <nav className="flex flex-col gap-2">

            <Link
                href="/"
                className="block rounded-xl py-3 text-center font-medium text-slate-700 transition hover:bg-white/20"
                onClick={() => setOpen(false)}
              >
                Home
              </Link>

              <Link
                href="/services"
                className="block rounded-xl py-3 text-center font-medium text-slate-700 transition hover:bg-white/20"
                onClick={() => setOpen(false)}
              >
                Services
              </Link>

              <Link
                href="/about"
                className="block rounded-xl py-3 text-center font-medium text-slate-700 transition hover:bg-white/20"
                onClick={() => setOpen(false)}
              >
                About Us
              </Link>

              <Link
                href="/contact"
                className="mx-auto mt-2 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:scale-105 hover:bg-black"
                onClick={() => setOpen(false)}
              >
                Contact Us
              </Link>
            </nav>
          </div>
        </nav>
      </div>
    </div>
  );
}
