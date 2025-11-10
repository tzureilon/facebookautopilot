'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientStore, Client } from '@/store/clientStore';
import api from '@/lib/api';

export default function ClientsPage() {
  const router = useRouter();
  const {
    clients,
    addClient,
    updateClient,
    removeClient,
    setClients,
    selectClient,
    setLoading,
    setError,
  } = useClientStore();

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    industry: '',
    metaCredentials: {
      accessToken: '',
      adAccountId: '',
      pixelId: '',
      pageId: '',
    },
    billingInfo: {
      currency: 'USD',
      monthlyBudget: '',
    },
    notes: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients');
      setClients(response.data.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      setError(error.response?.data?.message || 'Failed to fetch clients');
      setLoading(false);
    }
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        company: client.company || '',
        website: client.website || '',
        industry: client.industry || '',
        metaCredentials: {
          accessToken: '',
          adAccountId: client.metaCredentials.adAccountId,
          pixelId: client.metaCredentials.pixelId || '',
          pageId: client.metaCredentials.pageId || '',
        },
        billingInfo: {
          currency: client.billingInfo?.currency || 'USD',
          monthlyBudget: client.billingInfo?.monthlyBudget?.toString() || '',
        },
        notes: client.notes || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        website: '',
        industry: '',
        metaCredentials: {
          accessToken: '',
          adAccountId: '',
          pixelId: '',
          pageId: '',
        },
        billingInfo: {
          currency: 'USD',
          monthlyBudget: '',
        },
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        billingInfo: {
          ...formData.billingInfo,
          monthlyBudget: formData.billingInfo.monthlyBudget
            ? parseFloat(formData.billingInfo.monthlyBudget)
            : undefined,
        },
      };

      if (editingClient) {
        const response = await api.put(`/clients/${editingClient._id}`, payload);
        updateClient(editingClient._id, response.data.data);
        alert('Client updated successfully');
      } else {
        const response = await api.post('/clients', payload);
        addClient(response.data.data);
        alert('Client created successfully');
      }

      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving client:', error);
      alert(error.response?.data?.message || 'Failed to save client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      await api.delete(`/clients/${clientId}`);
      removeClient(clientId);
      alert('Client deleted successfully');
    } catch (error: any) {
      console.error('Error deleting client:', error);
      alert(error.response?.data?.message || 'Failed to delete client');
    }
  };

  const handleToggleStatus = async (clientId: string) => {
    try {
      const response = await api.post(`/clients/${clientId}/toggle-status`);
      updateClient(clientId, { status: response.data.data.status });
      alert(response.data.message);
    } catch (error: any) {
      console.error('Error toggling status:', error);
      alert(error.response?.data?.message || 'Failed to toggle client status');
    }
  };

  const handleSelectClient = (clientId: string) => {
    selectClient(clientId);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Client Management</h1>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
          >
            + Add New Client
          </button>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client._id}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{client.name}</h3>
                  <p className="text-gray-400 text-sm">{client.email}</p>
                  {client.company && (
                    <p className="text-gray-400 text-sm">{client.company}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    client.status === 'active'
                      ? 'bg-green-900 text-green-300'
                      : client.status === 'inactive'
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-red-900 text-red-300'
                  }`}
                >
                  {client.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {client.industry && (
                  <p className="text-sm text-gray-300">
                    <span className="text-gray-500">Industry:</span> {client.industry}
                  </p>
                )}
                <p className="text-sm text-gray-300">
                  <span className="text-gray-500">Ad Account:</span>{' '}
                  {client.metaCredentials.adAccountId}
                </p>
                {client.billingInfo?.monthlyBudget && (
                  <p className="text-sm text-gray-300">
                    <span className="text-gray-500">Monthly Budget:</span>{' '}
                    {client.billingInfo.currency} {client.billingInfo.monthlyBudget}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectClient(client._id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                >
                  Select
                </button>
                <button
                  onClick={() => handleOpenModal(client)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(client._id)}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-sm"
                >
                  {client.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(client._id)}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {clients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">No clients found</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
            >
              Create Your First Client
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Industry</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                  />
                </div>
              </div>

              <hr className="border-gray-700 my-6" />
              <h3 className="text-lg font-semibold mb-4">Meta Credentials</h3>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Meta Access Token *
                </label>
                <input
                  type="password"
                  required={!editingClient}
                  value={formData.metaCredentials.accessToken}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metaCredentials: {
                        ...formData.metaCredentials,
                        accessToken: e.target.value,
                      },
                    })
                  }
                  placeholder={editingClient ? 'Leave blank to keep existing' : ''}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ad Account ID * (act_XXXXX)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.metaCredentials.adAccountId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metaCredentials: {
                          ...formData.metaCredentials,
                          adAccountId: e.target.value,
                        },
                      })
                    }
                    placeholder="act_123456789"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Pixel ID</label>
                  <input
                    type="text"
                    value={formData.metaCredentials.pixelId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metaCredentials: {
                          ...formData.metaCredentials,
                          pixelId: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Page ID</label>
                <input
                  type="text"
                  value={formData.metaCredentials.pageId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metaCredentials: {
                        ...formData.metaCredentials,
                        pageId: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                />
              </div>

              <hr className="border-gray-700 my-6" />
              <h3 className="text-lg font-semibold mb-4">Billing Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <input
                    type="text"
                    value={formData.billingInfo.currency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingInfo: {
                          ...formData.billingInfo,
                          currency: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Monthly Budget
                  </label>
                  <input
                    type="number"
                    value={formData.billingInfo.monthlyBudget}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingInfo: {
                          ...formData.billingInfo,
                          monthlyBudget: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingClient ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
