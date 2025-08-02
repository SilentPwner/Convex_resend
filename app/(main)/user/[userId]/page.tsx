// app/(main)/user/[userId]/page.tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserProfile } from "@/components/dashboard/UserProfile";
import { UserStats } from "@/components/dashboard/UserStats";

export default function UserDashboardPage({ params }: { params: { userId: string } }) {
  const userData = useQuery(api.dashboardQueries.getUserDashboard, {
    userId: params.userId,
    timeRange: "30d",
  });

  if (!userData) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-8">
      <UserProfile user={userData.user} />
      <UserStats stats={userData} />
    </div>
  );
}