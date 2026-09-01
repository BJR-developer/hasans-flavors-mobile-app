import { create } from 'zustand';
import { TableSession } from '@/types';

interface TableState {
  currentTable: string | null;
  guestCount: number;
  tables: TableSession[];
  
  // Actions
  setTable: (tableNumber: string, guestCount?: number) => void;
  clearTable: () => void;
  updateGuestCount: (count: number) => void;
  getTableSession: (tableNumber: string) => TableSession | undefined;
}

const INITIAL_TABLES: TableSession[] = Array.from({ length: 15 }, (_, i) => {
  const tableNumber = `Table ${(i + 1).toString().padStart(2, '0')}`;
  const isOccupied = i === 3 || i === 6; // Tables 04 and 07
  return {
    tableNumber,
    guestCount: isOccupied ? (i === 3 ? 4 : 2) : 0,
    status: isOccupied ? 'occupied' : 'available',
    activeOrderId: i === 3 ? 'ord-101' : (i === 6 ? 'ord-103' : undefined),
    joinedAt: isOccupied ? new Date(Date.now() - (i === 3 ? 25 : 40) * 60 * 1000).toISOString() : undefined,
  };
});

export const useTableStore = create<TableState>((set, get) => ({
  currentTable: null,
  guestCount: 2,
  tables: INITIAL_TABLES,

  setTable: (tableNumber, guestCount = 2) => {
    set((state) => ({
      currentTable: tableNumber,
      guestCount,
      tables: state.tables.map((t) =>
        t.tableNumber === tableNumber
          ? { ...t, status: 'occupied', guestCount, joinedAt: new Date().toISOString() }
          : t
      ),
    }));
  },

  clearTable: () => {
    set({ currentTable: null, guestCount: 1 });
  },

  updateGuestCount: (count) => {
    set({ guestCount: Math.max(1, count) });
  },

  getTableSession: (tableNumber) => {
    return get().tables.find((t) => t.tableNumber === tableNumber);
  },
}));
