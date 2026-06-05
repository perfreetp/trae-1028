import { create } from 'zustand';
import {
  SkyPlan,
  ApprovalRecord,
  ProtectionRecord,
  ChangeRecord,
  ArchiveFile,
  ProtectionCheckItem,
} from '../types';
import { getPlans, addPlan, updatePlan, deletePlan, initializeData, detectConflicts } from '../services/mockData';

const STORAGE_PREFIX = 'railway_';

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, data: T) => {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
};

const generateId = () => Math.random().toString(36).substring(2, 11);
const nowFormat = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

interface AppState {
  plans: SkyPlan[];
  approvals: ApprovalRecord[];
  protections: ProtectionRecord[];
  changes: ChangeRecord[];
  archives: ArchiveFile[];
  protectionChecks: Record<string, ProtectionCheckItem[]>;
  currentUser: {
    id: string;
    name: string;
    role: string;
    roleName: string;
  };
  loading: boolean;
  selectedPlan: SkyPlan | null;

  initData: () => void;
  loadPlans: () => void;

  addNewPlan: (plan: Omit<SkyPlan, 'id' | 'createdAt' | 'updatedAt'>) => SkyPlan;
  updateExistingPlan: (id: string, updates: Partial<SkyPlan>) => SkyPlan | null;
  removePlan: (id: string) => boolean;
  setSelectedPlan: (plan: SkyPlan | null) => void;
  checkConflicts: (plan: Partial<SkyPlan>, excludeId?: string) => { hasConflict: boolean; desc: string };

  addApproval: (approval: Omit<ApprovalRecord, 'id'>) => ApprovalRecord;
  getApprovalsByPlanId: (planId: string) => ApprovalRecord[];

  addProtection: (protection: Omit<ProtectionRecord, 'id'>) => ProtectionRecord;
  getProtectionsByPlanId: (planId: string) => ProtectionRecord[];

  addChange: (change: Omit<ChangeRecord, 'id'>) => ChangeRecord;
  updateChange: (id: string, updates: Partial<ChangeRecord>) => ChangeRecord | null;
  getChangesByPlanId: (planId: string) => ChangeRecord[];
  getAllChanges: () => ChangeRecord[];

  addArchive: (archive: Omit<ArchiveFile, 'id'>) => ArchiveFile;
  getArchivesByPlanId: (planId: string) => ArchiveFile[];

  getProtectionChecks: (planId: string) => ProtectionCheckItem[];
  toggleProtectionCheck: (planId: string, checkId: string) => void;

  setLoading: (loading: boolean) => void;
}

const defaultCheckItems: ProtectionCheckItem[] = [
  { id: '1', label: '现场防护员已按规定设置', checked: false },
  { id: '2', label: '防护信号（红旗/信号灯）已按规定设置', checked: false },
  { id: '3', label: '驻站联络员已在行车室登记', checked: false },
  { id: '4', label: '所有作业人员已佩戴安全防护用品', checked: false },
  { id: '5', label: '施工负责人已进行安全技术交底', checked: false },
  { id: '6', label: '应急救援设备已到位', checked: false },
];

export const useAppStore = create<AppState>((set, get) => ({
  plans: [],
  approvals: loadFromStorage<ApprovalRecord[]>('approvals', []),
  protections: loadFromStorage<ProtectionRecord[]>('protections', []),
  changes: loadFromStorage<ChangeRecord[]>('changes', []),
  archives: loadFromStorage<ArchiveFile[]>('archives', []),
  protectionChecks: loadFromStorage<Record<string, ProtectionCheckItem[]>>('protectionChecks', {}),
  currentUser: {
    id: '1',
    name: '管理员',
    role: 'admin',
    roleName: '系统管理员',
  },
  loading: false,
  selectedPlan: null,

  initData: () => {
    initializeData();
    get().loadPlans();
    
    const plans = getPlans();
    const existingChecks = loadFromStorage<Record<string, ProtectionCheckItem[]>>('protectionChecks', {});
    const newChecks = { ...existingChecks };
    
    plans.forEach(plan => {
      if (!newChecks[plan.id]) {
        newChecks[plan.id] = defaultCheckItems.map(item => ({ ...item }));
      }
    });
    
    if (Object.keys(newChecks).length > Object.keys(existingChecks).length) {
      saveToStorage('protectionChecks', newChecks);
      set({ protectionChecks: newChecks });
    }
  },

  loadPlans: () => {
    set({ loading: true });
    const plans = getPlans();
    set({ plans, loading: false });
  },

  addNewPlan: (plan) => {
    const newPlan = addPlan(plan);
    const newChecks = { ...get().protectionChecks, [newPlan.id]: defaultCheckItems.map(item => ({ ...item })) };
    saveToStorage('protectionChecks', newChecks);
    set(state => ({ plans: [...state.plans, newPlan], protectionChecks: newChecks }));
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

  addApproval: (approval) => {
    const newApproval: ApprovalRecord = {
      ...approval,
      id: generateId(),
    };
    const approvals = [...get().approvals, newApproval];
    saveToStorage('approvals', approvals);
    set({ approvals });
    return newApproval;
  },

  getApprovalsByPlanId: (planId) => {
    return get().approvals.filter(a => a.planId === planId);
  },

  addProtection: (protection) => {
    const newProtection: ProtectionRecord = {
      ...protection,
      id: generateId(),
    };
    const protections = [...get().protections, newProtection];
    saveToStorage('protections', protections);
    set({ protections });
    return newProtection;
  },

  getProtectionsByPlanId: (planId) => {
    return get().protections.filter(p => p.planId === planId);
  },

  addChange: (change) => {
    const newChange: ChangeRecord = {
      ...change,
      id: generateId(),
    };
    const changes = [...get().changes, newChange];
    saveToStorage('changes', changes);
    set({ changes });
    return newChange;
  },

  updateChange: (id, updates) => {
    const changes = get().changes.map(c => c.id === id ? { ...c, ...updates } : c);
    saveToStorage('changes', changes);
    set({ changes });
    return changes.find(c => c.id === id) || null;
  },

  getChangesByPlanId: (planId) => {
    return get().changes.filter(c => c.planId === planId);
  },

  getAllChanges: () => {
    return get().changes;
  },

  addArchive: (archive) => {
    const newArchive: ArchiveFile = {
      ...archive,
      id: generateId(),
    };
    const archives = [...get().archives, newArchive];
    saveToStorage('archives', archives);
    set({ archives });
    return newArchive;
  },

  getArchivesByPlanId: (planId) => {
    return get().archives.filter(a => a.planId === planId);
  },

  getProtectionChecks: (planId) => {
    return get().protectionChecks[planId] || defaultCheckItems.map(item => ({ ...item }));
  },

  toggleProtectionCheck: (planId, checkId) => {
    const currentChecks = get().protectionChecks;
    const planChecks = currentChecks[planId] || defaultCheckItems.map(item => ({ ...item }));
    const updatedChecks = planChecks.map(item =>
      item.id === checkId ? { ...item, checked: !item.checked } : item
    );
    const newChecks = { ...currentChecks, [planId]: updatedChecks };
    saveToStorage('protectionChecks', newChecks);
    set({ protectionChecks: newChecks });
  },

  setLoading: (loading) => {
    set({ loading });
  },
}));
