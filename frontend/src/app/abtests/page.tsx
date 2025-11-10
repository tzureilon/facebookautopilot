'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';

export default function ABTestsPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [tests, setTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadTests();
  }, [isAuthenticated, router]);

  const loadTests = async () => {
    try {
      const data = await apiClient.getABTests();
      setTests(data);
    } catch (error: any) {
      toast.error('Failed to load A/B tests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = async (testId: string) => {
    try {
      await apiClient.startABTest(testId);
      toast.success('Test started successfully');
      loadTests();
    } catch (error: any) {
      toast.error('Failed to start test');
    }
  };

  const handlePauseTest = async (testId: string) => {
    try {
      await apiClient.pauseABTest(testId);
      toast.success('Test paused successfully');
      loadTests();
    } catch (error: any) {
      toast.error('Failed to pause test');
    }
  };

  const handleDelete = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      await apiClient.deleteABTest(testId);
      toast.success('Test deleted successfully');
      loadTests();
    } catch (error: any) {
      toast.error('Failed to delete test');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading A/B tests...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">A/B Tests</h1>
          <button
            onClick={() => router.push('/abtests/new')}
            className="btn-primary"
          >
            Create New Test
          </button>
        </div>

        {tests.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No A/B tests yet</p>
            <button
              onClick={() => router.push('/abtests/new')}
              className="btn-primary"
            >
              Create Your First Test
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {tests.map((test) => (
              <div key={test._id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {test.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          test.status
                        )}`}
                      >
                        {test.status.toUpperCase()}
                      </span>
                      {test.winnerVariantId && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          Winner Declared
                        </span>
                      )}
                    </div>
                    {test.description && (
                      <p className="text-gray-600 mt-2">{test.description}</p>
                    )}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Test Type</p>
                        <p className="font-medium">{test.testType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Target Metric</p>
                        <p className="font-medium">{test.targetMetric.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Variants</p>
                        <p className="font-medium">{test.variants.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Confidence Level</p>
                        <p className="font-medium">{test.confidenceLevel}%</p>
                      </div>
                    </div>

                    {/* Variants Summary */}
                    {test.status !== 'draft' && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Variant Performance:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {test.variants.map((variant: any) => (
                            <div
                              key={variant._id}
                              className={`p-3 rounded-lg border-2 ${
                                variant.status === 'winner'
                                  ? 'border-green-500 bg-green-50'
                                  : variant.status === 'loser'
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-gray-200'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <p className="font-medium">{variant.name}</p>
                                {variant.status === 'winner' && (
                                  <span className="text-green-600 text-xl">👑</span>
                                )}
                              </div>
                              <div className="mt-2 text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Impressions:</span>
                                  <span className="font-medium">
                                    {variant.metrics.impressions.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Clicks:</span>
                                  <span className="font-medium">
                                    {variant.metrics.clicks.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">CTR:</span>
                                  <span className="font-medium">
                                    {variant.metrics.ctr.toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col space-y-2">
                    <button
                      onClick={() => router.push(`/abtests/${test._id}`)}
                      className="btn-secondary whitespace-nowrap"
                    >
                      View Report
                    </button>
                    {test.status === 'draft' && (
                      <button
                        onClick={() => handleStartTest(test._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                      >
                        Start Test
                      </button>
                    )}
                    {test.status === 'running' && (
                      <button
                        onClick={() => handlePauseTest(test._id)}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 whitespace-nowrap"
                      >
                        Pause Test
                      </button>
                    )}
                    {test.status === 'paused' && (
                      <button
                        onClick={() => handleStartTest(test._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                      >
                        Resume Test
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(test._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 whitespace-nowrap"
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
