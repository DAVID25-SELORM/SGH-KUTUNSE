import { Hero } from "@/components/home/Hero";
import { QuickAccess } from "@/components/home/QuickAccess";
import { TrustSection } from "@/components/home/TrustSection";
import { FeaturedServices } from "@/components/home/FeaturedServices";
import { CareStories } from "@/components/home/CareStories";
import { HospitalFacts } from "@/components/home/HospitalFacts";
import { PatientJourney } from "@/components/home/PatientJourney";
import { InsuranceStrip } from "@/components/home/InsuranceStrip";
import { CorporateTeaser } from "@/components/home/CorporateTeaser";
import { ArticlesPreview } from "@/components/home/ArticlesPreview";
import { AppointmentCTA } from "@/components/home/AppointmentCTA";
import { MapContactSection } from "@/components/home/MapContactSection";

export default function Home() {
  return (
    <>
      <Hero />
      <QuickAccess />
      <TrustSection />
      <FeaturedServices />
      <CareStories />
      <HospitalFacts />
      <PatientJourney />
      <InsuranceStrip />
      <CorporateTeaser />
      <ArticlesPreview />
      <AppointmentCTA />
      <MapContactSection />
    </>
  );
}
