// lifesync/app/(main)/reports/page.tsx

import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

// Dynamic imports
const ReportGenerator = dynamic(
  () => import("@/components/reports/ReportGenerator"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" /> }
);

const DataVisualization = dynamic(
  () => import("@/components/reports/DataVisualization"),
  { ssr: false }
);

export default function ReportsPage() {
  const { user } = useUser();
  const [reportType, setReportType] = useState<'health' | 'financial' | 'activity'>('health');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date()
  });

  // Fetch reports data
  const reportsData = useQuery(api.queries.reports.getAggregatedData, {
    userId: user?.id,
    reportType,
    dateRange
  });

  // Generate report mutation
  const generateReport = useMutation(api.actions.resend.reports.generate);

  // Send report via email
  const sendReport = useMutation(api.actions.resend.reports.send);

  const handleGenerateReport = async (format: 'pdf' | 'csv') => {
    try {
      const reportId = await generateReport({
        userId: user?.id,
        type: reportType,
        format,
        dateRange
      });
      
      toast.success(`Report generated successfully!`);
      return reportId;
    } catch (error) {
      toast.error("Failed to generate report");
      console.error(error);
    }
  };

  const handleSendEmail = async () => {
    try {
      const reportId = await handleGenerateReport('pdf');
      if (!reportId) return;
      
      await sendReport({ 
        userId: user?.id,
        reportId,
        email: user?.primaryEmailAddress?.emailAddress 
      });
      toast.success("Report sent to your email!");
    } catch (error) {
      toast.error("Failed to send report");
      console.error(error);
    }
  };

  // Track report views
  useEffect(() => {
    if (user?.id) {
      api.actions.ai.analysis.trackReportView({
        userId: user.id,
        reportType,
        date: new Date().toISOString()
      });
    }
  }, [reportType, user?.id]);

  if (!reportsData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-gray-500">Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Analytics Reports</h1>
        <p className="text-gray-600">Comprehensive insights from your LifeSync data</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report Controls Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">Report Type</h2>
              <div className="space-y-2">
                {['health', 'financial', 'activity'].map((type) => (
                  <button
                    key={type}
                    className={`btn btn-block justify-start ${reportType === type ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setReportType(type as any)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)} Report
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">Date Range</h2>
              <input 
                type="date" 
                className="input input-bordered w-full"
                value={dateRange.from.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({...dateRange, from: new Date(e.target.value)})}
              />
              <input 
                type="date" 
                className="input input-bordered w-full mt-2"
                value={dateRange.to.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({...dateRange, to: new Date(e.target.value)})}
              />
            </div>
          </div>

          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">Actions</h2>
              <button 
                className="btn btn-primary btn-block mb-2"
                onClick={handleSendEmail}
              >
                Send to Email
              </button>
              <button 
                className="btn btn-outline btn-block mb-2"
                onClick={() => handleGenerateReport('pdf')}
              >
                Download PDF
              </button>
              <button 
                className="btn btn-outline btn-block"
                onClick={() => handleGenerateReport('csv')}
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Main Report Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportsData.summary.map((item) => (
              <div key={item.title} className="card bg-base-100 shadow">
                <div className="card-body">
                  <h3 className="text-sm font-semibold text-gray-500">{item.title}</h3>
                  <p className="text-2xl font-bold">{item.value}</p>
                  {item.change && (
                    <p className={`text-sm ${item.change > 0 ? 'text-success' : 'text-error'}`}>
                      {item.change > 0 ? '↑' : '↓'} {Math.abs(item.change)}% from last period
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Report Generator */}
          <ReportGenerator 
            data={reportsData} 
            type={reportType}
          />

          {/* Data Visualization */}
          <DataVisualization 
            data={reportsData.analytics} 
            type={reportType}
          />

          {/* AI Analysis Section */}
          {reportsData.insights && (
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title">AI Insights</h2>
                <div className="prose max-w-none">
                  <p>{reportsData.insights}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}