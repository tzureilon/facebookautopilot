'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';

export default function CampaignsPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadCampaigns();
  }, [isAuthenticated, router]);

  const loadCampaigns = async () => {
    try {
      const data = await apiClient.getCampaigns();
      setCampaigns(data);
    } catch (error: any) {
      toast.error('Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    try {
      await apiClient.updateCampaignStatus(campaignId, newStatus);
      toast.success(`Campaign ${newStatus.toLowerCase()} successfully`);
      loadCampaigns();
    } catch (error: any) {
      toast.error('Failed to update campaign status');
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      await apiClient.deleteCampaign(campaignId);
      toast.success('Campaign deleted successfully');
      loadCampaigns();
    } catch (error: any) {
      toast.error('Failed to delete campaign');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading campaigns...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <button
            onClick={() => router.push('/questionnaire')}
            className="btn-primary"
          >
            Create New Campaign
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No campaigns yet</p>
            <button
              onClick={() => router.push('/questionnaire')}
              className="btn-primary"
            >
              Create Your First Campaign
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign._id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {campaign.name}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Objective: {campaign.objective}
                    </p>
                    <div className="mt-2 flex items-center space-x-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          campaign.status
                        )}`}
                      >
                        {campaign.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        Created: {new Date(campaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Ad Sets</p>
                        <p className="text-lg font-semibold">
                          {campaign.adSets?.length || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Meta Campaign ID</p>
                        <p className="text-sm font-mono">
                          {campaign.metaCampaignId || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Budget Remaining</p>
                        <p className="text-lg font-semibold">
                          ${campaign.budgetRemaining?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col space-y-2">
                    {campaign.status === 'PAUSED' && (
                      <button
                        onClick={() => handleStatusChange(campaign._id, 'ACTIVE')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Activate
                      </button>
                    )}
                    {campaign.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusChange(campaign._id, 'PAUSED')}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                      >
                        Pause
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/campaigns/${campaign._id}`)}
                      className="btn-secondary"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDelete(campaign._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
