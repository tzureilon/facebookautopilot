'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClientStore } from '@/store/clientStore';
import api from '@/lib/api';

export default function ClientSelector() {
  const router = useRouter();
  const {
    clients,
    selectedClientId,
    isLoading,
    setClients,
    selectClient,
    setLoading,
    setError,
  } = useClientStore();

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

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value || null;
    selectClient(clientId);

    // Refresh the current page to reload data with new client context
    router.refresh();
  };

  const handleManageClients = () => {
    router.push('/clients');
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span className="text-sm text-gray-300">Loading clients...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <label htmlFor="client-select" className="text-sm font-medium text-gray-300">
          Client:
        </label>
        <select
          id="client-select"
          value={selectedClientId || ''}
          onChange={handleClientChange}
          className="bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Clients</option>
          {clients.map((client) => (
            <option key={client._id} value={client._id}>
              {client.name}
              {client.status !== 'active' && ` (${client.status})`}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleManageClients}
        className="text-sm text-blue-400 hover:text-blue-300 underline"
      >
        Manage Clients
      </button>

      {clients.length === 0 && !isLoading && (
        <span className="text-sm text-yellow-400">
          No clients found. Create your first client!
        </span>
      )}
    </div>
  );
}
