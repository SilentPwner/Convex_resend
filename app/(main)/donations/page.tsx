// app/(main)/donations/page.tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DonationCard from "@/components/donations/DonationCard";

export default function DonationsPage() {
  const donations = useQuery(api.donationsQueries.getUserDonations, {
    userId: "current_user_id", // يجب استبدالها بمعرف المستخدم الفعلي
    limit: 10,
  });

  if (!donations) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">تبرعاتي</h1>
      <div className="space-y-4">
        {donations.map((donation) => (
          <DonationCard key={donation._id} donation={donation} />
        ))}
      </div>
    </div>
  );
}