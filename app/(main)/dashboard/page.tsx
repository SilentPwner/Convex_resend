// lifesync/app/(main)/dashboard/page.tsx

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import MetricsCard from "@/components/dashboard/MetricsCard";
import PriceTracker from "@/components/dashboard/PriceTracker";
import DonationMap from "@/components/dashboard/DonationMap";

export default function DashboardPage() {
  // جلب بيانات لوحة التحكم من convex
  const dashboardData = useQuery(api.queries.dashboard.getMetrics);
  
  if (!dashboardData) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* بطاقات المقاييس */}
        <MetricsCard 
          title="Total Donations"
          value={dashboardData.totalDonations}
          change={dashboardData.donationChange}
        />
        
        <MetricsCard 
          title="Active Products"
          value={dashboardData.activeProducts}
          change={dashboardData.productsChange}
        />
        
        <MetricsCard 
          title="Alerts Sent"
          value={dashboardData.alertsSent}
          change={dashboardData.alertsChange}
        />

        {/* Price Tracker */}
        <div className="lg:col-span-2">
          <PriceTracker prices={dashboardData.cryptoPrices} />
        </div>

        {/* Donation Map */}
        <div className="lg:col-span-1">
          <DonationMap donations={dashboardData.recentDonations} />
        </div>
      </div>
    </DashboardLayout>
  );
}