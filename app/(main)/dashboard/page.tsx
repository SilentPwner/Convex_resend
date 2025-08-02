// app/(main)/dashboard/page.tsx
import { DashboardHeader } from "@/components/dashboard/header";
import { MetricsGrid } from "@/components/dashboard/metrics";
import { PriceTracker } from "@/components/dashboard/price-tracker";
import { DonationImpact } from "@/components/dashboard/donation-impact";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <MetricsGrid />
          <PriceTracker />
        </div>
        
        <div className="space-y-6">
          <DonationImpact />
          <BitcoinDonationWidget />
        </div>
      </div>
    </div>
  );
}