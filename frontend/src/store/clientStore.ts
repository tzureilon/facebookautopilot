import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  industry?: string;
  status: 'active' | 'inactive' | 'suspended';
  metaCredentials: {
    adAccountId: string;
    pixelId?: string;
    pageId?: string;
    hasAccessToken: boolean;
  };
  billingInfo?: {
    currency: string;
    monthlyBudget?: number;
    billingCycle?: 'monthly' | 'quarterly' | 'annual';
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ClientState {
  clients: Client[];
  selectedClientId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (clientId: string, updates: Partial<Client>) => void;
  removeClient: (clientId: string) => void;
  selectClient: (clientId: string | null) => void;
  getSelectedClient: () => Client | null;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearClients: () => void;
}

export const useClientStore = create<ClientState>()(
  persist(
    (set, get) => ({
      clients: [],
      selectedClientId: null,
      isLoading: false,
      error: null,

      setClients: (clients) => set({ clients, error: null }),

      addClient: (client) =>
        set((state) => ({
          clients: [client, ...state.clients],
          error: null,
        })),

      updateClient: (clientId, updates) =>
        set((state) => ({
          clients: state.clients.map((client) =>
            client._id === clientId ? { ...client, ...updates } : client
          ),
          error: null,
        })),

      removeClient: (clientId) =>
        set((state) => ({
          clients: state.clients.filter((client) => client._id !== clientId),
          selectedClientId:
            state.selectedClientId === clientId ? null : state.selectedClientId,
          error: null,
        })),

      selectClient: (clientId) =>
        set({
          selectedClientId: clientId,
          error: null,
        }),

      getSelectedClient: () => {
        const state = get();
        if (!state.selectedClientId) return null;
        return state.clients.find((c) => c._id === state.selectedClientId) || null;
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      clearClients: () =>
        set({
          clients: [],
          selectedClientId: null,
          error: null,
          isLoading: false,
        }),
    }),
    {
      name: 'client-storage',
      partialize: (state) => ({
        selectedClientId: state.selectedClientId,
      }),
    }
  )
);
