import {
  SkyPlan,
  Worker,
  Machine,
  ApprovalRecord,
  ProtectionRecord,
  ChangeRecord,
  ArchiveFile,
  SkyPlanStatus,
} from '../types';

const STORAGE_KEY = 'railway_sky_plans';

const generateId = () => Math.random().toString(36).substring(2, 11);

const now = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const formatDateTime = (d: Date) => d.toISOString().slice(0, 16).replace('T', ' ');

const mockWorkers: Worker[] = [
  { id: generateId(), name: '张三', position: '施工负责人', idCard: '110101199001011234', phone: '13800138001' },
  { id: generateId(), name: '李四', position: '技术员', idCard: '110101199002022345', phone: '13800138002' },
  { id: generateId(), name: '王五', position: '安全员', idCard: '110101199003033456', phone: '13800138003' },
];

const mockMachines: Machine[] = [
  { id: generateId(), name: '捣固车', model: 'DCL-32', quantity: 2, inspector: '李四' },
  { id: generateId(), name: '稳定车', model: 'WD-320', quantity: 1, inspector: '王五' },
];

const createMockPlans = (): SkyPlan[] => {
  const plans: SkyPlan[] = [];
  
  for (let i = 0; i < 15; i++) {
    const dayOffset = Math.floor(Math.random() * 30) - 10;
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    
    const startHour = 0 + Math.floor(Math.random() * 4);
    const endHour = startHour + 2 + Math.floor(Math.random() * 2);
    
    const start = new Date(date);
    start.setHours(startHour, 0, 0, 0);
    const end = new Date(date);
    end.setHours(endHour, 0, 0, 0);
    
    const statuses: SkyPlanStatus[] = [
      'draft', 'pending', 'approved1', 'approved', 'commanded',
      'signin', 'executing', 'signout', 'completed', 'archived'
    ];
    const status = statuses[i % statuses.length];
    
    plans.push({
      id: generateId(),
      projectName: [`京沪线${dayOffset > 0 ? '下行' : '上行'}线路维修`, '接触网检修', '道岔更换施工'][i % 3] + ` #${i + 1}`,
      constructionUnit: ['北京工务段', '上海工务段', '郑州工务段'][i % 3],
      personInCharge: ['张三', '李四', '王五'][i % 3],
      phone: `1380013800${(i % 9) + 1}`,
      applyDate: formatDate(date),
      startTime: formatDateTime(start),
      endTime: formatDateTime(end),
      lineSection: ['京沪线', '京广线', '京哈线'][i % 3],
      mileageStart: `K${100 + i * 10}+000`,
      mileageEnd: `K${100 + i * 10 + 5}+000`,
      affectedStations: ['北京站', '天津站', '济南站'].slice(0, (i % 3) + 1),
      constructionType: ['线路维修', '接触网检修', '信号设备检修'][i % 3],
      workers: mockWorkers,
      machines: mockMachines,
      riskMeasures: '1. 施工前进行安全技术交底；\n2. 设置现场防护员；\n3. 按规定设置防护信号；\n4. 施工完毕确认线路开通条件。',
      status,
      currentApprovalLevel: status === 'pending' ? 1 : status === 'approved1' ? 2 : 3,
      hasConflict: i % 7 === 0,
      conflictDesc: i % 7 === 0 ? '与相邻天窗时间重叠' : undefined,
      commandNo: status !== 'draft' && status !== 'pending' && status !== 'rejected' ? `SKY${formatDate(date).replace(/-/g, '')}${String(i + 1).padStart(3, '0')}` : undefined,
      signinTime: ['signin', 'executing', 'signout', 'completed', 'archived'].includes(status) ? formatDateTime(start) : undefined,
      signoutTime: ['signout', 'completed', 'archived'].includes(status) ? formatDateTime(end) : undefined,
      createdAt: formatDateTime(new Date(date.getTime() - 86400000)),
      updatedAt: formatDateTime(new Date()),
    });
  }
  
  return plans;
};

export const mockApprovals: ApprovalRecord[] = [
  { id: generateId(), planId: '', level: 1, levelName: '车间审批', approver: '王主任', approvalTime: formatDateTime(new Date()), opinion: '同意，请严格按照安全规范执行', result: 'approved' },
  { id: generateId(), planId: '', level: 2, levelName: '段级审批', approver: '李段长', approvalTime: formatDateTime(new Date()), opinion: '同意，注意施工质量', result: 'approved' },
  { id: generateId(), planId: '', level: 3, levelName: '调度审批', approver: '张调度', approvalTime: formatDateTime(new Date()), opinion: '同意，请按时销记', result: 'pending' },
];

export const mockProtections: ProtectionRecord[] = [
  { id: generateId(), planId: '', protector: '赵防护', contactTime: formatDateTime(new Date(Date.now() - 3600000)), content: '现场防护设置完毕，人员已就位', isAbnormal: false },
  { id: generateId(), planId: '', protector: '赵防护', contactTime: formatDateTime(new Date(Date.now() - 1800000)), content: '施工正常进行，无异常情况', isAbnormal: false },
  { id: generateId(), planId: '', protector: '钱防护', contactTime: formatDateTime(new Date()), content: '发现设备异常，已上报', isAbnormal: true, abnormalDesc: '接触网支柱有倾斜迹象' },
];

export const mockChanges: ChangeRecord[] = [
  { id: generateId(), planId: '', changeType: 'delay', changeTypeName: '延期', reason: '现场天气原因，大风预警', oldContent: '结束时间：04:00', newContent: '结束时间：05:00', status: 'pending', applyTime: formatDateTime(new Date()) },
  { id: generateId(), planId: '', changeType: 'scope', changeTypeName: '范围变更', reason: '发现额外病害需要处理', oldContent: '里程范围：K100+000-K105+000', newContent: '里程范围：K100+000-K108+000', status: 'approved', applyTime: formatDateTime(new Date(Date.now() - 86400000)) },
];

export const mockArchiveFiles: ArchiveFile[] = [
  { id: generateId(), planId: '', fileName: '施工方案.pdf', fileType: 'pdf', fileSize: 2048000, uploader: '张三', uploadTime: formatDateTime(new Date()) },
  { id: generateId(), planId: '', fileName: '签到记录.xlsx', fileType: 'xlsx', fileSize: 102400, uploader: '李四', uploadTime: formatDateTime(new Date()) },
  { id: generateId(), planId: '', fileName: '验收报告.docx', fileType: 'docx', fileSize: 512000, uploader: '王五', uploadTime: formatDateTime(new Date()) },
];

export const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createMockPlans()));
  }
};

export const getPlans = (): SkyPlan[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const plans = createMockPlans();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    return plans;
  }
  return JSON.parse(data);
};

export const savePlans = (plans: SkyPlan[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
};

export const addPlan = (plan: Omit<SkyPlan, 'id' | 'createdAt' | 'updatedAt'>): SkyPlan => {
  const plans = getPlans();
  const newPlan: SkyPlan = {
    ...plan,
    id: generateId(),
    createdAt: formatDateTime(new Date()),
    updatedAt: formatDateTime(new Date()),
  };
  plans.push(newPlan);
  savePlans(plans);
  return newPlan;
};

export const updatePlan = (id: string, updates: Partial<SkyPlan>): SkyPlan | null => {
  const plans = getPlans();
  const index = plans.findIndex(p => p.id === id);
  if (index === -1) return null;
  plans[index] = { ...plans[index], ...updates, updatedAt: formatDateTime(new Date()) };
  savePlans(plans);
  return plans[index];
};

export const deletePlan = (id: string): boolean => {
  const plans = getPlans();
  const filtered = plans.filter(p => p.id !== id);
  if (filtered.length === plans.length) return false;
  savePlans(filtered);
  return true;
};

export const getPlanById = (id: string): SkyPlan | undefined => {
  return getPlans().find(p => p.id === id);
};

export const detectConflicts = (plan: Partial<SkyPlan>, excludeId?: string): { hasConflict: boolean; desc: string } => {
  const plans = getPlans().filter(p => p.id !== excludeId);
  if (!plan.startTime || !plan.endTime || !plan.lineSection) {
    return { hasConflict: false, desc: '' };
  }
  
  const newStart = new Date(plan.startTime).getTime();
  const newEnd = new Date(plan.endTime).getTime();
  
  for (const p of plans) {
    if (p.lineSection !== plan.lineSection) continue;
    if (['draft', 'rejected', 'archived'].includes(p.status)) continue;
    
    const existStart = new Date(p.startTime).getTime();
    const existEnd = new Date(p.endTime).getTime();
    
    if (newStart < existEnd && newEnd > existStart) {
      const overlapStations = p.affectedStations.filter(s => plan.affectedStations?.includes(s));
      if (overlapStations.length > 0 || plan.mileageStart && plan.mileageEnd) {
        return {
          hasConflict: true,
          desc: `与计划【${p.projectName}】存在时间/空间冲突，影响车站：${overlapStations.join('、') || '线路区间重叠'}`,
        };
      }
    }
  }
  
  return { hasConflict: false, desc: '' };
};

export const getMonthlyStats = (year: number, month: number) => {
  const plans = getPlans();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  
  const monthPlans = plans.filter(p => p.applyDate.startsWith(monthStr));
  
  const total = monthPlans.length;
  const completed = monthPlans.filter(p => ['completed', 'archived', 'signout'].includes(p.status)).length;
  const canceled = monthPlans.filter(p => p.status === 'rejected').length;
  const fulfillmentRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const dailyData: Record<string, { total: number; completed: number }> = {};
  for (let i = 1; i <= 31; i++) {
    const dayStr = `${monthStr}-${String(i).padStart(2, '0')}`;
    dailyData[dayStr] = { total: 0, completed: 0 };
  }
  
  monthPlans.forEach(p => {
    const day = p.applyDate;
    if (dailyData[day]) {
      dailyData[day].total++;
      if (['completed', 'archived', 'signout'].includes(p.status)) {
        dailyData[day].completed++;
      }
    }
  });
  
  return {
    total,
    completed,
    canceled,
    fulfillmentRate,
    dailyData,
    byType: constructionTypes.map(type => ({
      type,
      count: monthPlans.filter(p => p.constructionType === type).length,
    })),
  };
};

const constructionTypes = [
  '线路维修',
  '桥梁施工',
  '隧道施工',
  '接触网检修',
  '信号设备检修',
  '通信设备检修',
  '其他',
];
