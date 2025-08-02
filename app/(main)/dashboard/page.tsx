// app/(main)/dashboard/page.tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export default function DashboardPage() {
  const stats = useQuery(api.dashboardQueries.getDashboardStats, {
    timeRange: "7d",
  });
  const activities = useQuery(api.dashboardQueries.getRecentActivities, {
    limit: 10,
  });

  if (!stats || !activities) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">لوحة التحكم</h1>
      
      <DashboardCards stats={stats.overview} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <ActivityFeed activities={activities.donations} title="آخر التبرعات" />
        <ActivityFeed activities={activities.aiActivities} title="نشاط الذكاء الاصطناعي" />
      </div>
    </div>
  );
}