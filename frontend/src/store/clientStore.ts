import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Client {
  id: string;
  clientName: string;
  company?: string;
  status: string;
  metaAdAccountId: string;
}

interface ClientState {
  selectedClient: Client | null;
  clients: Client[];
  setSelectedClient: (client: Client | null) => void;
  setClients: (clients: Client[]) => void;
  clearClient: () => void;
}

export const useClientStore = create<ClientState>()(
  persist(
    (set) => ({
      selectedClient: null,
      clients: [],
      setSelectedClient: (client) => set({ selectedClient: client }),
      setClients: (clients) => set({ clients }),
      clearClient: () => set({ selectedClient: null }),
    }),
    {
      name: 'client-storage',
    }
  )
);
