'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import { useClientStore } from '@/store/clientStore';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';

export default function ClientsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { clients, setClients, setSelectedClient } = useClientStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [formData, setFormData] = useState({
    clientName: '',
    metaAdAccountId: '',
    metaAccessToken: '',
    status: 'active',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'agency' && user?.role !== 'admin') {
      router.push('/dashboard');
      toast.error('Access denied. Agency role required.');
      return;
    }

    loadClients();
  }, [isAuthenticated, user, router]);

  const loadClients = async () => {
    try {
      const data = await apiClient.getClients();
      setClients(data);
    } catch (error: any) {
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (client?: any) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        clientName: client.clientName,
        metaAdAccountId: client.metaAdAccountId,
        metaAccessToken: client.metaAccessToken,
        status: client.status,
      });
    } else {
      setEditingClient(null);
      setFormData({
        clientName: '',
        metaAdAccountId: '',
        metaAccessToken: '',
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({
      clientName: '',
      metaAdAccountId: '',
      metaAccessToken: '',
      status: 'active',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingClient) {
        await apiClient.updateClient(editingClient._id, formData);
        toast.success('Client updated successfully');
      } else {
        await apiClient.createClient(formData);
        toast.success('Client created successfully');
      }
      handleCloseModal();
      loadClients();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save client');
    }
  };

  const handleUpdateStatus = async (clientId: string, newStatus: string) => {
    try {
      await apiClient.updateClientStatus(clientId, newStatus);
      toast.success('Client status updated');
      loadClients();
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteClient(clientId);
      toast.success('Client deleted successfully');
      loadClients();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete client');
    }
  };

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    toast.success(`Switched to ${client.clientName}`);
    router.push('/dashboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading clients...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            Add New Client
          </button>
        </div>

        {clients.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No clients yet</p>
            <button onClick={() => handleOpenModal()} className="btn-primary">
              Create Your First Client
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {clients.map((client: any) => (
              <div key={client._id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {client.clientName}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          client.status
                        )}`}
                      >
                        {client.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Meta Ad Account</p>
                        <p className="font-medium text-gray-900">{client.metaAdAccountId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Created</p>
                        <p className="font-medium text-gray-900">
                          {new Date(client.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Updated</p>
                        <p className="font-medium text-gray-900">
                          {new Date(client.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col space-y-2">
                    <button
                      onClick={() => handleSelectClient(client)}
                      className="btn-primary whitespace-nowrap"
                    >
                      Select Client
                    </button>
                    <button
                      onClick={() => handleOpenModal(client)}
                      className="btn-secondary whitespace-nowrap"
                    >
                      Edit
                    </button>
                    {client.status === 'active' ? (
                      <button
                        onClick={() => handleUpdateStatus(client._id, 'inactive')}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 whitespace-nowrap"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(client._id, 'active')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(client._id)}
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

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Ad Account ID
                </label>
                <input
                  type="text"
                  value={formData.metaAdAccountId}
                  onChange={(e) =>
                    setFormData({ ...formData, metaAdAccountId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Access Token
                </label>
                <input
                  type="password"
                  value={formData.metaAccessToken}
                  onChange={(e) =>
                    setFormData({ ...formData, metaAccessToken: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required={!editingClient}
                  placeholder={editingClient ? 'Leave blank to keep current token' : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingClient ? 'Update Client' : 'Create Client'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
