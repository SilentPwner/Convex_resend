// components/DonationStats.tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function DonationStats({ campaignId }: { campaignId?: string }) {
  const stats = useQuery(api.donationsQueries.getDonationStats, {
    timeframe: "30d",
    campaignId,
  });

  if (!stats) return <div>Loading statistics...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard title="إجمالي التبرعات" value={stats.total} />
      <StatCard title="المكتملة" value={stats.completed} />
      <StatCard title="المعلقة" value={stats.pending} />
      <StatCard title="إجمالي المبلغ" value={`$${stats.totalAmount.toFixed(2)}`} />
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}