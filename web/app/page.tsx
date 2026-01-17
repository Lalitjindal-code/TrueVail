import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import BrainFeatures from "@/components/BrainFeatures";
import FeaturesSection from "@/components/FeaturesSection";
import DemoTerminal from "@/components/DemoTerminal"; 
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0A121F] text-white overflow-x-hidden">
      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-[100] mix-blend-overlay"
        style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
      ></div>

      <Navbar />

      <div className="flex flex-col">
        <HeroSection />
        <BrainFeatures />
        <FeaturesSection />
         <DemoTerminal /> 
      </div>

      <Footer />
    </main>
  );
}
