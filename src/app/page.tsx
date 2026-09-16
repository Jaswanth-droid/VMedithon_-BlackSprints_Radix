import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/HomeMainC";
import StatsCard from "@/components/countups";
import FocusIndustries from "@/components/FocusIndustries";

function StatsSection() {
  const stats = [
    {
      title: "Satisfied Customers",
      end: 30,
      suffix: "+",
    },
    {
      title: "Years of Experience",
      end: 10,
      suffix: "+",
    },
    {
      title: "Industry Verticals",
      end: 8,
      suffix: "+",
    },
    {
      title: "Countries",
      end: 4,
      suffix: "",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <StatsCard
            key={item.title}
            title={item.title}
            end={item.end}
            suffix={item.suffix}
          />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-white">
      <Navbar />

      <main className="flex-1">
        <Hero />
        <StatsSection />
        <Services />
      </main>
      <FocusIndustries />
      <Footer />
    </div>
  );
}