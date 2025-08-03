// lifesync/app/(main)/donations/page.tsx

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
import * as Papa from 'papaparse';

// Dynamic imports for heavy components
const DonationStatsSection = dynamic(() => import('@/components/donations/DonationStatsSection'));
const DonationListSection = dynamic(() => import('@/components/donations/DonationListSection'));
const BitcoinDonation = dynamic(
  () => import('@/components/crypto/BitcoinDonation'),
  { ssr: false, loading: () => <div className="h-32 bg-gray-100 rounded-lg animate-pulse" /> }
);

// Skeleton components
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
    ))}
  </div>
);

const DonationListSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
    ))}
  </div>
);

type DonationFilter = 'all' | 'recurring' | 'failed';

export default function DonationsPage() {
  const { user } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const [activeTab, setActiveTab] = useState<DonationFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<[Date?, Date?]>([undefined, undefined]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingCrypto, setIsProcessingCrypto] = useState(false);
  const itemsPerPage = 10;

  // Fetch data
  const { results: donations, status: donationsStatus } = useQuery(
    api.queries.donations.paginatedList,
    {
      userId: user?.id,
      page,
      itemsPerPage,
      filter: activeTab,
      searchTerm,
      dateRange,
    }
  );

  const stats = useQuery(api.queries.donations.getStats, { userId: user?.id });
  const createDonation = useMutation(api.actions.resend.donations.create);

  // Realtime updates
  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = api.queries.donations.list.onUpdate(() => {
        // Invalidate queries or update state as needed
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  // Analytics
  useEffect(() => {
    if (donations && user?.id) {
      analytics.track('DonationsPageView', {
        totalDonations: stats?.total,
        userId: user.id,
      });
    }
  }, [donations, user?.id, stats?.total]);

  // Handlers
  const handleNewDonation = async (amount: number, recurring: boolean) => {
    setError(null);
    try {
      await createDonation({
        userId: user?.id,
        amount,
        recurring,
        currency: 'USD',
      });
      toast.success('Donation recorded successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process donation');
      toast.error('Donation failed');
    }
  };

  const exportToCSV = () => {
    if (!donations) return;
    
    const csvData = donations.map(d => ({
      Date: new Date(d._creationTime).toLocaleDateString(),
      Amount: d.amount,
      Currency: d.currency,
      Type: d.recurring ? 'Recurring' : 'One-time',
      Status: d.status || 'Completed',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `donations-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading state
  if (donationsStatus === 'LoadingFirstPage' || !stats) {
    return (
      <div className="space-y-8 p-4">
        <StatsSkeleton />
        <DonationListSkeleton />
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Donation Management</h1>
        <div className="flex gap-2">
          <button 
            onClick={exportToCSV}
            className="btn btn-outline"
            aria-label="Export to CSV"
          >
            Export CSV
          </button>
        </div>
      </header>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">
            Dismiss
          </button>
        </div>
      )}

      <DonationStatsSection 
        stats={stats} 
        loading={!stats}
      />

      <DonationListSection
        donations={donations}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        currentPage={page}
        totalPages={Math.ceil((stats?.totalCount || 0) / itemsPerPage)}
        onPageChange={setPage}
      />

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Crypto Donations</h2>
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <BitcoinDonation
              userId={user?.id}
              onSuccess={() => {
                setIsProcessingCrypto(false);
                toast.success('Crypto donation received!');
              }}
              onProcessing={() => setIsProcessingCrypto(true)}
            />
            {isProcessingCrypto && (
              <div className="text-center text-sm text-gray-500 mt-2">
                Processing blockchain transaction...
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}