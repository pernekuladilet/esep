import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Audience } from "@/components/landing/audience";
import { Pricing } from "@/components/landing/pricing";
import { Faq } from "@/components/landing/faq";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <>
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <Audience />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
