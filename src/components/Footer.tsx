"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#f7f7f7] text-slate-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">

        <div className="mb-16">
          <Image
  src="/logoo.png"
  alt="Techsuite"
  width={180}
  height={48}
  className="h-12 w-auto object-contain"
/>

          <p className="mt-3 text-3xl font-semibold leading-tight">
            Delivering Trust.
          </p>
        </div>

        <div className="grid gap-14 lg:grid-cols-4 md:grid-cols-2">

          <div>
            <h3 className="text-3xl font-medium mb-6">
              Company
            </h3>

            <div className="flex flex-col gap-4">

              <Link href="/" className="hover:text-indigo-600 transition">
                Home
              </Link>

              <Link href="/services" className="hover:text-indigo-600 transition">
                Services
              </Link>

              <Link href="/about" className="hover:text-indigo-600 transition">
                About Us
              </Link>

              <Link href="/contact" className="hover:text-indigo-600 transition">
                Contact Us
              </Link>

            </div>
          </div>

          <div>
            <h3 className="text-3xl font-medium mb-6">
              Services
            </h3>

            <div className="flex flex-col gap-4">

              <Link href="/services/erp" className="hover:text-indigo-600 transition">
                ERP Solutions
              </Link>

              <Link href="/services/cloud-services" className="hover:text-indigo-600 transition">
                Cloud Services - IaaS
              </Link>

              <Link href="/services/planning-analytics" className="hover:text-indigo-600 transition">
                Planning & Analytics
              </Link>

              <Link href="/services/ai-automation" className="hover:text-indigo-600 transition">
                AI & Intelligent Automation
              </Link>

              <Link href="/services/cybersecurity" className="hover:text-indigo-600 transition">
                Cybersecurity
              </Link>

              <Link href="/services/smart-spaces" className="hover:text-indigo-600 transition">
                Smart Spaces & IT Infrastructure
              </Link>

            </div>
          </div>

          <div className="lg:col-span-2">

            <h3 className="text-4xl font-medium mb-4">
              Stay up to date
            </h3>

            <p className="text-slate-600 text-lg mb-8">
              Get the latest updates and exclusive tips to boost your sales
            </p>

            <form className="flex flex-col sm:flex-row gap-4">

              <input
                type="email"
                placeholder="Enter your email"
                className="
                  flex-1
                  rounded-xl
                  bg-indigo-100
                  px-6
                  py-4
                  outline-none
                  focus:ring-2
                  focus:ring-indigo-500
                "
              />

              <button
                className="
                  rounded-xl
                  bg-indigo-500
                  hover:bg-indigo-600
                  text-white
                  px-10
                  py-4
                  font-semibold
                  transition
                "
              >
                Submit
              </button>

            </form>

          </div>

        </div>

        <div className="mt-20 border-t border-slate-300 pt-8">

          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">

            <p className="text-slate-700 text-center lg:text-left">
              © {new Date().getFullYear()} All rights reserved. Techsuite Systems
              Private Limited.
            </p>

            <div className="flex flex-col items-center lg:items-end gap-5">

              <a
                href="mailto:contact@techsuitesystems.com"
                className="font-semibold hover:text-indigo-600 transition"
              >
                contact@techsuitesystems.com
              </a>

              <div className="flex gap-5">

                <a
                  href="mailto:contact@techsuitesystems.com"
                  className="
                    h-11
                    w-11
                    rounded-full
                    bg-white
                    shadow
                    flex
                    items-center
                    justify-center
                    hover:bg-indigo-500
                    hover:text-white
                    transition
                  "
                >
                  <Mail size={20} />
                </a>

                

              </div>

            </div>

          </div>

        </div>

      </div>
    </footer>
  );
}