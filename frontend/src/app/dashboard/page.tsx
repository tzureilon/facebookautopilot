'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import { useClientStore } from '@/store/clientStore';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { selectedClientId, getSelectedClient } = useClientStore();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadDashboard();
  }, [isAuthenticated, router, selectedClientId]);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const params = selectedClientId ? { clientId: selectedClientId } : {};
      const data = await apiClient.getDashboard(params);
      setDashboardData(data);
    } catch (error: any) {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedClient = getSelectedClient();

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Campaign Performance',
      },
    },
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          {selectedClient && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <p className="text-sm text-gray-600">Viewing data for:</p>
              <p className="font-semibold text-blue-900">{selectedClient.name}</p>
            </div>
          )}
          {!selectedClient && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <p className="text-sm font-medium text-gray-700">All Clients View</p>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Total Spend</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              ${dashboardData?.summary?.totalSpend?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Total Clicks</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {dashboardData?.summary?.totalClicks?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Average CTR</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {dashboardData?.summary?.averageCTR?.toFixed(2) || '0.00'}%
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500">Average ROAS</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {dashboardData?.summary?.averageROAS?.toFixed(2) || '0.00'}x
            </p>
          </div>
        </div>

        {/* Performance Chart */}
        {dashboardData?.chartData && (
          <div className="card">
            <Line options={chartOptions} data={dashboardData.chartData} />
          </div>
        )}

        {/* Recent Alerts */}
        {dashboardData?.recentAlerts?.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Recent Alerts</h2>
            <div className="space-y-2">
              {dashboardData.recentAlerts.map((alert: any) => (
                <div
                  key={alert._id}
                  className={`p-3 rounded-lg ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border border-red-200'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/questionnaire')}
              className="btn-primary"
            >
              Create New Campaign
            </button>
            <button
              onClick={() => router.push('/campaigns')}
              className="btn-secondary"
            >
              View All Campaigns
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
