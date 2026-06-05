import { create } from 'zustand';
import { SkyPlan, ApprovalRecord, ProtectionRecord, ChangeRecord, ArchiveFile } from '../types';
import { getPlans, addPlan, updatePlan, deletePlan, initializeData, detectConflicts } from '../services/mockData';

interface AppState {
  plans: SkyPlan[];
  currentUser: {
    id: string;
    name: string;
    role: string;
    roleName: string;
  };
  loading: boolean;
  selectedPlan: SkyPlan | null;
  approvals: ApprovalRecord[];
  protections: ProtectionRecord[];
  changes: ChangeRecord[];
  archives: ArchiveFile[];
  
  initData: () => void;
  loadPlans: () => void;
  addNewPlan: (plan: Omit<SkyPlan, 'id' | 'createdAt' | 'updatedAt'>) => SkyPlan;
  updateExistingPlan: (id: string, updates: Partial<SkyPlan>) => SkyPlan | null;
  removePlan: (id: string) => boolean;
  setSelectedPlan: (plan: SkyPlan | null) => void;
  checkConflicts: (plan: Partial<SkyPlan>, excludeId?: string) => { hasConflict: boolean; desc: string };
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  plans: [],
  currentUser: {
    id: '1',
    name: '管理员',
    role: 'admin',
    roleName: '系统管理员',
  },
  loading: false,
  selectedPlan: null,
  approvals: [],
  protections: [],
  changes: [],
  archives: [],

  initData: () => {
    initializeData();
    get().loadPlans();
  },

  loadPlans: () => {
    set({ loading: true });
    const plans = getPlans();
    set({ plans, loading: false });
  },

  addNewPlan: (plan) => {
    const newPlan = addPlan(plan);
    set(state => ({ plans: [...state.plans, newPlan] }));
    return newPlan;
  },

  updateExistingPlan: (id, updates) => {
    const updated = updatePlan(id, updates);
    if (updated) {
      set(state => ({
        plans: state.plans.map(p => p.id === id ? updated : p),
        selectedPlan: state.selectedPlan?.id === id ? updated : state.selectedPlan,
      }));
    }
    return updated;
  },

  removePlan: (id) => {
    const success = deletePlan(id);
    if (success) {
      set(state => ({
        plans: state.plans.filter(p => p.id !== id),
        selectedPlan: state.selectedPlan?.id === id ? null : state.selectedPlan,
      }));
    }
    return success;
  },

  setSelectedPlan: (plan) => {
    set({ selectedPlan: plan });
  },

  checkConflicts: (plan, excludeId) => {
    return detectConflicts(plan, excludeId);
  },

  setLoading: (loading) => {
    set({ loading });
  },
}));
