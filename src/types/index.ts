export type SkyPlanStatus =
  | 'draft'
  | 'pending'
  | 'approved1'
  | 'rejected'
  | 'approved'
  | 'commanded'
  | 'signin'
  | 'executing'
  | 'signout'
  | 'completed'
  | 'archived';

export interface Worker {
  id: string;
  name: string;
  position: string;
  idCard: string;
  phone: string;
}

export interface Machine {
  id: string;
  name: string;
  model: string;
  quantity: number;
  inspector: string;
}

export interface ApprovalRecord {
  id: string;
  planId: string;
  level: number;
  levelName: string;
  approver: string;
  approvalTime: string;
  opinion: string;
  result: 'approved' | 'rejected' | 'pending';
}

export interface ProtectionRecord {
  id: string;
  planId: string;
  protector: string;
  contactTime: string;
  content: string;
  isAbnormal: boolean;
  abnormalDesc?: string;
}

export interface ChangeRecord {
  id: string;
  planId: string;
  changeType: 'time' | 'scope' | 'delay' | 'cancel';
  changeTypeName: string;
  reason: string;
  oldContent: string;
  newContent: string;
  status: 'pending' | 'approved' | 'rejected';
  applyTime: string;
}

export interface ArchiveFile {
  id: string;
  planId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploader: string;
  uploadTime: string;
}

export interface SkyPlan {
  id: string;
  projectName: string;
  constructionUnit: string;
  personInCharge: string;
  phone: string;
  applyDate: string;
  startTime: string;
  endTime: string;
  lineSection: string;
  mileageStart: string;
  mileageEnd: string;
  affectedStations: string[];
  constructionType: string;
  workers: Worker[];
  machines: Machine[];
  riskMeasures: string;
  status: SkyPlanStatus;
  currentApprovalLevel: number;
  hasConflict: boolean;
  conflictDesc?: string;
  commandNo?: string;
  signinTime?: string;
  signoutTime?: string;
  createdAt: string;
  updatedAt: string;
}

export type ChangeType = 'time' | 'scope' | 'delay' | 'cancel';

export const statusMap: Record<SkyPlanStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  pending: { label: '待审批', color: 'warning' },
  approved1: { label: '一级审批通过', color: 'processing' },
  rejected: { label: '已驳回', color: 'error' },
  approved: { label: '审批通过', color: 'success' },
  commanded: { label: '命令已下达', color: 'processing' },
  signin: { label: '已签到', color: 'processing' },
  executing: { label: '执行中', color: 'processing' },
  signout: { label: '已销记', color: 'success' },
  completed: { label: '已完成', color: 'success' },
  archived: { label: '已归档', color: 'default' },
};

export const constructionTypes = [
  '线路维修',
  '桥梁施工',
  '隧道施工',
  '接触网检修',
  '信号设备检修',
  '通信设备检修',
  '其他',
];

export const lineSections = [
  '京沪线',
  '京广线',
  '京哈线',
  '陇海线',
  '沪昆线',
  '京九线',
];

export const stations = [
  '北京站',
  '北京西站',
  '北京南站',
  '上海站',
  '上海虹桥站',
  '广州站',
  '广州南站',
  '深圳北站',
  '成都东站',
  '武汉站',
  '郑州东站',
  '西安北站',
];
