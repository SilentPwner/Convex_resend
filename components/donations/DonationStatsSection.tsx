import { DonationStats } from '@/convex/schema';

export default function DonationStatsSection({ 
  stats,
  loading 
}: {
  stats?: DonationStats;
  loading: boolean;
}) {
  if (loading) return null;

  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold mb-4">Donation Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* ... إحصائيات التبرع ... */}
      </div>
      {/* ... الرسوم البيانية ... */}
    </section>
  );
}