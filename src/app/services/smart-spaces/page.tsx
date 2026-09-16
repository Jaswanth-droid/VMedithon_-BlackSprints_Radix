import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SmartSpacesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900">
      <Navbar />
      <main className="flex-1">
        {/* Smart Spaces page content goes here */}
      </main>
      <Footer />
    </div>
  );
}
