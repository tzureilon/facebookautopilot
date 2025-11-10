'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useClientStore } from '@/store/clientStore';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { selectedClient, clients, setSelectedClient, setClients } = useClientStore();
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  // Load clients on mount for agency users
  useEffect(() => {
    if (user?.role === 'agency' || user?.role === 'admin') {
      loadClients();
    }
  }, [user]);

  const loadClients = async () => {
    try {
      const data = await apiClient.getClients();
      setClients(data);

      // If no client selected but clients exist, select the first one
      if (!selectedClient && data.length > 0) {
        setSelectedClient(data[0]);
      }
    } catch (error: any) {
      toast.error('Failed to load clients');
    }
  };

  const handleClientChange = (client: any) => {
    setSelectedClient(client);
    setIsClientDropdownOpen(false);
    toast.success(`Switched to ${client.clientName}`);

    // Reload the current page to refresh data with new client context
    router.refresh();
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-primary-600">
                  Meta Automation
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/campaigns"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Campaigns
                </Link>
                <Link
                  href="/abtests"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  A/B Tests
                </Link>
                <Link
                  href="/alerts"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Alerts
                </Link>
                <Link
                  href="/questionnaire"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  New Campaign
                </Link>
                {(user?.role === 'agency' || user?.role === 'admin') && (
                  <Link
                    href="/clients"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Clients
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Client Switcher Dropdown */}
              {(user?.role === 'agency' || user?.role === 'admin') && (
                <div className="relative">
                  <button
                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  >
                    <span className="text-gray-700">
                      {selectedClient ? selectedClient.clientName : 'Select Client'}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isClientDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-1 max-h-64 overflow-y-auto">
                        {clients.length === 0 ? (
                          <div className="px-4 py-2 text-sm text-gray-500 text-center">
                            No clients available
                          </div>
                        ) : (
                          clients.map((client: any) => (
                            <button
                              key={client._id}
                              onClick={() => handleClientChange(client)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                selectedClient?._id === client._id ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                              }`}
                            >
                              <div className="font-medium">{client.clientName}</div>
                              <div className="text-xs text-gray-500">{client.metaAdAccountId}</div>
                            </button>
                          ))
                        )}
                      </div>
                      <div className="border-t border-gray-200">
                        <button
                          onClick={() => {
                            setIsClientDropdownOpen(false);
                            router.push('/clients');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-gray-100"
                        >
                          Manage Clients
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <span className="text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
