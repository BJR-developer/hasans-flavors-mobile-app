import { create } from 'zustand';
import { TableSession } from '@/types';
import { supabase } from '@/lib/supabase';

interface TableState {
  currentTable: string | null;
  guestCount: number;
  tables: TableSession[];
  isLoading: boolean;

  // Actions
  fetchTables: () => Promise<void>;
  setTable: (tableNumber: string, guestCount?: number) => Promise<void>;
  clearTable: () => void;
  updateGuestCount: (count: number) => void;
  getTableSession: (tableNumber: string) => TableSession | undefined;
}

let realtimeSubscribed = false;

export const useTableStore = create<TableState>((set, get) => ({
  currentTable: null,
  guestCount: 2,
  tables: [],
  isLoading: false,

  fetchTables: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('dining_tables')
        .select('*')
        .order('id');

      if (!error && data && data.length > 0) {
        const mapped: TableSession[] = data.map((row: any) => ({
          tableNumber: row.table_number,
          guestCount: row.guest_count || 4,
          status: row.status as 'available' | 'occupied' | 'billing',
          activeOrderId: row.current_order_id || undefined,
          joinedAt: row.updated_at,
        }));
        set({ tables: mapped, isLoading: false });
      } else {
        set({ isLoading: false });
      }

      // Realtime subscription
      if (!realtimeSubscribed) {
        realtimeSubscribed = true;
        supabase
          .channel('mobile:public:dining_tables')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'dining_tables' },
            (payload) => {
              const currentTables = get().tables;
              if (payload.eventType === 'UPDATE') {
                const updatedRow: any = payload.new;
                set({
                  tables: currentTables.map((t) =>
                    t.tableNumber === updatedRow.table_number
                      ? {
                          ...t,
                          status: updatedRow.status,
                          guestCount: updatedRow.guest_count || t.guestCount,
                          activeOrderId: updatedRow.current_order_id || undefined,
                        }
                      : t
                  ),
                });
              } else if (payload.eventType === 'INSERT') {
                const newRow: any = payload.new;
                set({
                  tables: [
                    ...currentTables,
                    {
                      tableNumber: newRow.table_number,
                      guestCount: newRow.guest_count || 4,
                      status: newRow.status,
                      activeOrderId: newRow.current_order_id || undefined,
                    },
                  ],
                });
              }
            }
          )
          .subscribe();
      }
    } catch (e) {
      console.warn('Error loading dining tables from Supabase:', e);
      set({ isLoading: false });
    }
  },

  setTable: async (tableNumber: string, guestCount = 2) => {
    set((state) => ({
      currentTable: tableNumber,
      guestCount,
      tables: state.tables.map((t) =>
        t.tableNumber === tableNumber
          ? { ...t, status: 'occupied', guestCount, joinedAt: new Date().toISOString() }
          : t
      ),
    }));

    try {
      await supabase
        .from('dining_tables')
        .update({
          status: 'occupied',
          guest_count: guestCount,
          updated_at: new Date().toISOString(),
        })
        .eq('table_number', tableNumber);
    } catch (e) {
      console.error('Failed to update table in Supabase:', e);
    }
  },

  clearTable: () => {
    set({ currentTable: null, guestCount: 1 });
  },

  updateGuestCount: (count: number) => {
    set({ guestCount: Math.max(1, count) });
  },

  getTableSession: (tableNumber: string) => {
    return get().tables.find((t) => t.tableNumber === tableNumber);
  },
}));
