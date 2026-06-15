import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import WhatsAppChannel from "@/components/WhatsAppChannel";
import Footer from "@/components/Footer";


export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <WhatsAppChannel />
      <Footer />
    </main>
  );
}
