import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { TableSession } from '@/types';
import { supabase } from '@/lib/supabase';

const STORAGE_KEYS = {
  CURRENT_TABLE: '@hasan_current_table_v1',
  GUEST_COUNT: '@hasan_guest_count_v1',
};

const safeGetItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web' && typeof window === 'undefined') return null;
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web' && typeof window === 'undefined') return;
  try {
    await AsyncStorage.setItem(key, value);
  } catch {}
};

const safeRemoveItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web' && typeof window === 'undefined') return;
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
};

interface TableState {
  currentTable: string | null;
  guestCount: number;
  tables: TableSession[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initializeTable: () => Promise<void>;
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
  isInitialized: false,

  initializeTable: async () => {
    try {
      const [savedTable, savedCount] = await Promise.all([
        safeGetItem(STORAGE_KEYS.CURRENT_TABLE),
        safeGetItem(STORAGE_KEYS.GUEST_COUNT),
      ]);
      set({
        currentTable: savedTable || null,
        guestCount: savedCount ? parseInt(savedCount, 10) || 2 : 2,
        isInitialized: true,
      });
    } catch {
      set({ isInitialized: true });
    }
  },

  fetchTables: async () => {
    try {
      set({ isLoading: true });
      if (!get().isInitialized) {
        await get().initializeTable();
      }
      const { data, error } = await supabase
        .from('dining_tables')
        .select('*')
        .order('id');

      if (!error && data && data.length > 0) {
        const mapped: TableSession[] = data
          .map((row: any) => ({
            id: row.id,
            tableNumber: row.table_number,
            capacity: Number(row.capacity || row.guest_count || 4),
            guestCount: Number(row.guest_count || row.capacity || 4),
            status: row.status as 'available' | 'occupied' | 'billing',
            activeOrderId: row.current_order_id || undefined,
            joinedAt: row.updated_at,
          }))
          .sort((a, b) => {
            const numA = parseInt(a.tableNumber.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.tableNumber.replace(/\D/g, ''), 10) || 0;
            return numA - numB;
          });
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
                          capacity: Number(updatedRow.capacity || updatedRow.guest_count || t.capacity || 4),
                          guestCount: Number(updatedRow.guest_count || updatedRow.capacity || t.guestCount || 4),
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
                      id: newRow.id,
                      tableNumber: newRow.table_number,
                      capacity: Number(newRow.capacity || newRow.guest_count || 4),
                      guestCount: Number(newRow.guest_count || newRow.capacity || 4),
                      status: newRow.status,
                      activeOrderId: newRow.current_order_id || undefined,
                    },
                  ],
                });
              } else if (payload.eventType === 'DELETE') {
                const oldRow: any = payload.old;
                set({
                  tables: currentTables.filter(
                    (t) => t.tableNumber !== oldRow.table_number && t.id !== oldRow.id
                  ),
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
    await Promise.all([
      safeSetItem(STORAGE_KEYS.CURRENT_TABLE, tableNumber),
      safeSetItem(STORAGE_KEYS.GUEST_COUNT, guestCount.toString()),
    ]);

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

  clearTable: async () => {
    const current = get().currentTable;
    await Promise.all([
      safeRemoveItem(STORAGE_KEYS.CURRENT_TABLE),
      safeRemoveItem(STORAGE_KEYS.GUEST_COUNT),
    ]);
    set({ currentTable: null, guestCount: 1 });

    if (current) {
      try {
        await supabase
          .from('dining_tables')
          .update({
            status: 'available',
            current_order_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('table_number', current);
      } catch (e) {
        console.error('Failed to release table in Supabase:', e);
      }
    }
  },

  updateGuestCount: (count: number) => {
    set({ guestCount: Math.max(1, count) });
  },

  getTableSession: (tableNumber: string) => {
    return get().tables.find((t) => t.tableNumber === tableNumber);
  },
}));
