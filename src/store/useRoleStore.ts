import { create } from 'zustand';
import { UserRole } from '@/types';

interface RoleState {
  currentRole: UserRole;
  isPinModalOpen: boolean;
  targetRole: UserRole | null;
  
  // Actions
  setRole: (role: UserRole) => void;
  requestRoleChange: (role: UserRole) => void;
  closePinModal: () => void;
  verifyPin: (pin: string) => boolean;
}

export const useRoleStore = create<RoleState>((set, get) => ({
  currentRole: 'customer',
  isPinModalOpen: false,
  targetRole: null,

  setRole: (role) => {
    set({ currentRole: role, isPinModalOpen: false, targetRole: null });
  },

  requestRoleChange: (role) => {
    if (role === 'customer') {
      set({ currentRole: 'customer', isPinModalOpen: false, targetRole: null });
    } else {
      // Staff roles require PIN check or direct access
      set({ isPinModalOpen: true, targetRole: role });
    }
  },

  closePinModal: () => {
    set({ isPinModalOpen: false, targetRole: null });
  },

  verifyPin: (pin) => {
    // Default staff PIN: 1234 or 8888 (Owner)
    const { targetRole } = get();
    if (pin === '1234' || pin === '8888' || pin === '0000') {
      if (targetRole) {
        set({ currentRole: targetRole, isPinModalOpen: false, targetRole: null });
      }
      return true;
    }
    return false;
  },
}));
