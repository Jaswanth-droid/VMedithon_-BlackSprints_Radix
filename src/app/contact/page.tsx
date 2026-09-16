import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Reg from "@/components/Reg";


export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900">
      <Navbar />


      <section className="px-6 md:px-16 py-20 text-center">
        <div className="mb-6">
            <span className="bg-[#6875f5] text-white px-4 py-1.5 rounded-md text-xs font-semibold">
              Contact us
            </span>
          </div>
<h1 className=" font-bold tracking-tight text-[#2d2d2d] leading-[1.1] md:leading-[1.05] ">
        <span className="bg-linear-to-r from-orange-400 via-pink-400 to-indigo-500 bg-clip-text text-transparent pb-2 text-[65px] sm:text-[60px] lg:text-[68px]">
              Get In Touch With Us
            </span></h1>

        <p className=" max-w-xl text-center text-[15px] sm:text-[20px] text-slate-500 font-normal leading-relaxed mx-auto">
          Have questions? Let us know by filling out the form, and we will be in touch!
        </p>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto">


          <Reg />

        </div>
      </section>

      <Footer />
    </div>
  );
}