'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';

interface QuestionnaireForm {
  businessName: string;
  industry: string;
  products: string;
  website?: string;
  description?: string;
  ageMin: number;
  ageMax: number;
  gender: 'male' | 'female' | 'all';
  locations: string;
  interests: string;
  budgetType: 'daily' | 'lifetime';
  budgetAmount: number;
  campaignGoals: string[];
  headline: string;
  primaryText: string;
  description2?: string;
  callToAction: string;
  linkUrl?: string;
  accessToken: string;
  adAccountId: string;
  pixelId?: string;
  pageId?: string;
}

export default function QuestionnairePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedAssets, setUploadedAssets] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuestionnaireForm>();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploadPromises = Array.from(files).map((file) =>
        apiClient.uploadAsset(file)
      );
      const results = await Promise.all(uploadPromises);
      setUploadedAssets([...uploadedAssets, ...results]);
      toast.success('Files uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload files');
    }
  };

  const onSubmit = async (data: QuestionnaireForm) => {
    setIsLoading(true);
    try {
      // Format questionnaire data
      const questionnaireData = {
        businessInfo: {
          businessName: data.businessName,
          industry: data.industry,
          products: data.products.split(',').map((p) => p.trim()),
          website: data.website,
          description: data.description,
        },
        targetAudience: {
          ageRange: {
            min: data.ageMin,
            max: data.ageMax,
          },
          gender: data.gender,
          locations: data.locations.split(',').map((l) => l.trim()),
          interests: data.interests.split(',').map((i) => i.trim()),
        },
        budget: {
          type: data.budgetType,
          amount: data.budgetAmount,
          currency: 'USD',
        },
        campaignGoals: data.campaignGoals,
        creatives: [
          {
            headline: data.headline,
            primaryText: data.primaryText,
            description: data.description2,
            callToAction: data.callToAction,
            assets: uploadedAssets,
            linkUrl: data.linkUrl,
          },
        ],
        metaCredentials: {
          accessToken: data.accessToken,
          adAccountId: data.adAccountId,
          pixelId: data.pixelId,
          pageId: data.pageId,
        },
      };

      // Submit questionnaire
      const questionnaire = await apiClient.createQuestionnaire(questionnaireData);
      await apiClient.submitQuestionnaire(questionnaire._id);

      toast.success('Questionnaire submitted! Creating campaign...');

      // Create campaign
      const campaign = await apiClient.createCampaign(questionnaire._id);

      toast.success('Campaign created successfully!');
      router.push(`/campaigns/${campaign._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create campaign');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Create New Campaign
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Business Information */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Business Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Name *
                </label>
                <input
                  {...register('businessName', { required: 'Business name is required' })}
                  className="input-field"
                />
                {errors.businessName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.businessName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Industry *
                </label>
                <input
                  {...register('industry', { required: 'Industry is required' })}
                  className="input-field"
                />
                {errors.industry && (
                  <p className="text-red-500 text-sm mt-1">{errors.industry.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Products/Services * (comma-separated)
                </label>
                <input
                  {...register('products', { required: 'Products are required' })}
                  className="input-field"
                  placeholder="Product 1, Product 2, Product 3"
                />
                {errors.products && (
                  <p className="text-red-500 text-sm mt-1">{errors.products.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input {...register('website')} className="input-field" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea {...register('description')} className="input-field" rows={3} />
              </div>
            </div>
          </div>

          {/* Target Audience */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Target Audience</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Age Min *
                  </label>
                  <input
                    {...register('ageMin', {
                      required: 'Age minimum is required',
                      min: 18,
                      max: 65,
                    })}
                    type="number"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Age Max *
                  </label>
                  <input
                    {...register('ageMax', {
                      required: 'Age maximum is required',
                      min: 18,
                      max: 65,
                    })}
                    type="number"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gender *
                </label>
                <select {...register('gender', { required: true })} className="input-field">
                  <option value="all">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Locations * (comma-separated country codes)
                </label>
                <input
                  {...register('locations', { required: 'Locations are required' })}
                  className="input-field"
                  placeholder="US, GB, CA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interests * (comma-separated)
                </label>
                <input
                  {...register('interests', { required: 'Interests are required' })}
                  className="input-field"
                  placeholder="Technology, Shopping, Travel"
                />
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Budget</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Budget Type *
                </label>
                <select
                  {...register('budgetType', { required: true })}
                  className="input-field"
                >
                  <option value="daily">Daily Budget</option>
                  <option value="lifetime">Lifetime Budget</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount (USD) *
                </label>
                <input
                  {...register('budgetAmount', {
                    required: 'Budget amount is required',
                    min: 1,
                  })}
                  type="number"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Campaign Goals */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Campaign Goals</h2>
            <div className="space-y-2">
              {[
                'BRAND_AWARENESS',
                'REACH',
                'TRAFFIC',
                'ENGAGEMENT',
                'LEAD_GENERATION',
                'CONVERSIONS',
              ].map((goal) => (
                <label key={goal} className="flex items-center">
                  <input
                    type="checkbox"
                    value={goal}
                    {...register('campaignGoals', {
                      required: 'Select at least one goal',
                    })}
                    className="mr-2"
                  />
                  {goal.replace(/_/g, ' ')}
                </label>
              ))}
            </div>
          </div>

          {/* Creative Assets */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Creative Assets</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Headline *
                </label>
                <input
                  {...register('headline', { required: 'Headline is required' })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Primary Text *
                </label>
                <textarea
                  {...register('primaryText', { required: 'Primary text is required' })}
                  className="input-field"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Call to Action *
                </label>
                <select
                  {...register('callToAction', { required: true })}
                  className="input-field"
                >
                  <option value="Learn More">Learn More</option>
                  <option value="Shop Now">Shop Now</option>
                  <option value="Sign Up">Sign Up</option>
                  <option value="Download">Download</option>
                  <option value="Contact Us">Contact Us</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload Images/Videos
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="input-field"
                />
                {uploadedAssets.length > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    {uploadedAssets.length} file(s) uploaded
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Link URL
                </label>
                <input {...register('linkUrl')} className="input-field" />
              </div>
            </div>
          </div>

          {/* Meta API Credentials */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Meta API Credentials</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Access Token *
                </label>
                <input
                  {...register('accessToken', { required: 'Access token is required' })}
                  type="password"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ad Account ID *
                </label>
                <input
                  {...register('adAccountId', { required: 'Ad account ID is required' })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Page ID
                </label>
                <input {...register('pageId')} className="input-field" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pixel ID
                </label>
                <input {...register('pixelId')} className="input-field" />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/campaigns')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Creating Campaign...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
