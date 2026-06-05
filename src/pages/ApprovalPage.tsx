import { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Tabs,
  Badge,
  message,
  Timeline,
  Row,
  Col,
  Statistic,
  Tooltip,
} from 'antd';
import {
  Check,
  X,
  Clock,
  User,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { statusMap } from '../types';
import type { SkyPlan, ApprovalRecord } from '../types';

const { TextArea } = Input;

const ApprovalPage = () => {
  const { plans, updateExistingPlan, addApproval, getApprovalsByPlanId, currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPlan, setSelectedPlan] = useState<SkyPlan | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [approvalModal, setApprovalModal] = useState(false);
  const [approvalType, setApprovalType] = useState<'approved' | 'rejected'>('approved');
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const pendingPlans = useMemo(() => plans.filter(p => ['pending', 'approved1', 'approved'].includes(p.status)), [plans]);
  const approvedPlans = useMemo(() => plans.filter(p => ['commanded', 'signin', 'executing', 'signout', 'completed', 'archived'].includes(p.status)), [plans]);
  const rejectedPlans = useMemo(() => plans.filter(p => p.status === 'rejected'), [plans]);

  const getApprovalLevel = (status: SkyPlan['status']) => {
    switch (status) {
      case 'pending': return { level: 1, levelName: '车间审批', nextStatus: 'approved1' as SkyPlan['status'] };
      case 'approved1': return { level: 2, levelName: '段级审批', nextStatus: 'approved' as SkyPlan['status'] };
      case 'approved': return { level: 3, levelName: '调度审批', nextStatus: 'commanded' as SkyPlan['status'] };
      default: return { level: 3, levelName: '调度审批', nextStatus: 'commanded' as SkyPlan['status'] };
    }
  };

  const getApprovalList = (plan: SkyPlan): ApprovalRecord[] => {
    const existingApprovals = getApprovalsByPlanId(plan.id);
    
    if (existingApprovals.length > 0) {
      const sorted = existingApprovals.sort((a, b) => a.level - b.level);
      const hasRejected = sorted.some(a => a.result === 'rejected');
      if (hasRejected) {
        return sorted;
      }
      
      const result: ApprovalRecord[] = [...sorted];
      const maxLevel = Math.max(...sorted.map(a => a.level));
      
      if (maxLevel < 3 && plan.status !== 'rejected') {
        const nextLevels = [
          { level: 1, levelName: '车间审批' },
          { level: 2, levelName: '段级审批' },
          { level: 3, levelName: '调度审批' },
        ];
        
        for (let i = maxLevel + 1; i <= 3; i++) {
          const levelInfo = nextLevels.find(l => l.level === i);
          if (levelInfo) {
            result.push({
              id: `pending-${i}`,
              planId: plan.id,
              level: i,
              levelName: levelInfo.levelName,
              approver: '',
              approvalTime: '',
              opinion: '',
              result: 'pending',
            });
          }
        }
      }
      
      return result;
    }
    
    const approvals: ApprovalRecord[] = [];
    if (plan.status === 'rejected') {
      approvals.push({
        id: '1',
        planId: plan.id,
        level: 1,
        levelName: '车间审批',
        approver: '王主任',
        approvalTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
        opinion: '施工范围不明确，人员配置不足，请补充完善后重新提交',
        result: 'rejected',
      });
      return approvals;
    }
    
    const currentLevel = getApprovalLevel(plan.status).level;
    
    for (let i = 1; i <= 3; i++) {
      const levelInfo = [
        { level: 1, levelName: '车间审批', approver: '王主任', opinion: '同意，各项准备工作就绪，请上级审批' },
        { level: 2, levelName: '段级审批', approver: '李段长', opinion: '同意，注意施工质量和安全防护' },
        { level: 3, levelName: '调度审批', approver: '张调度', opinion: '同意，已下达封锁命令，请按时执行并销记' },
      ].find(l => l.level === i)!;
      
      if (i < currentLevel) {
        approvals.push({
          id: String(i),
          planId: plan.id,
          level: i,
          levelName: levelInfo.levelName,
          approver: levelInfo.approver,
          approvalTime: dayjs().subtract(4 - i, i === 1 ? 'day' : 'hour').format('YYYY-MM-DD HH:mm'),
          opinion: levelInfo.opinion,
          result: 'approved',
        });
      } else if (i === currentLevel) {
        approvals.push({
          id: String(i),
          planId: plan.id,
          level: i,
          levelName: levelInfo.levelName,
          approver: '',
          approvalTime: '',
          opinion: '',
          result: 'pending',
        });
      } else {
        approvals.push({
          id: String(i),
          planId: plan.id,
          level: i,
          levelName: levelInfo.levelName,
          approver: '',
          approvalTime: '',
          opinion: '',
          result: 'pending',
        });
      }
    }
    
    return approvals;
  };

  const handleViewDetail = (plan: SkyPlan) => {
    setSelectedPlan(plan);
    setDetailModal(true);
  };

  const handleApproval = (plan: SkyPlan, type: 'approved' | 'rejected') => {
    setSelectedPlan({ ...plan });
    setApprovalType(type);
    form.resetFields();
    setApprovalModal(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedPlan) return;
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      const { level, levelName, nextStatus } = getApprovalLevel(selectedPlan.status);
      
      addApproval({
        planId: selectedPlan.id,
        level,
        levelName,
        approver: currentUser.name,
        approvalTime: dayjs().format('YYYY-MM-DD HH:mm'),
        opinion: values.opinion || '',
        result: approvalType,
      });

      if (approvalType === 'rejected') {
        updateExistingPlan(selectedPlan.id, {
          status: 'rejected',
        });
        message.success(`${levelName}已驳回`);
        setActiveTab('rejected');
      } else {
        const commandNo = level === 3
          ? `SKY${dayjs().format('YYYYMMDD')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
          : undefined;
        
        updateExistingPlan(selectedPlan.id, {
          status: nextStatus,
          currentApprovalLevel: level + 1,
          ...(commandNo ? { commandNo } : {}),
        });
        message.success(`${levelName}已通过`);
        if (level === 3) {
          setActiveTab('approved');
        }
      }

      setApprovalModal(false);
      setDetailModal(false);
      setSelectedPlan(null);
    } catch (error) {
      message.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      width: 250,
      render: (text: string, record: SkyPlan) => (
        <div className="font-medium">
          {record.hasConflict && (
            <Tooltip title={record.conflictDesc}>
              <Badge status="error" className="mr-2" />
            </Tooltip>
          )}
          {text}
        </div>
      ),
    },
    {
      title: '施工单位',
      dataIndex: 'constructionUnit',
      width: 150,
    },
    {
      title: '施工时间',
      key: 'time',
      width: 220,
      render: (_: any, record: SkyPlan) => (
        <div className="text-sm">
          <div>{dayjs(record.startTime).format('YYYY-MM-DD')}</div>
          <div className="text-gray-500">
            {dayjs(record.startTime).format('HH:mm')} - {dayjs(record.endTime).format('HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: '线路/区间',
      key: 'line',
      width: 180,
      render: (_: any, record: SkyPlan) => (
        <div className="text-sm">
          <div>{record.lineSection}</div>
          <div className="text-gray-500">{record.mileageStart} - {record.mileageEnd}</div>
        </div>
      ),
    },
    {
      title: '当前审批节点',
      key: 'approvalLevel',
      width: 150,
      render: (_: any, record: SkyPlan) => {
        const { levelName } = getApprovalLevel(record.status);
        return <Tag color="blue">{levelName}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (status: SkyPlan['status']) => (
        <Tag color={statusMap[status].color as any}>{statusMap[status].label}</Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (time: string) => <span className="text-sm text-gray-500">{time}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: SkyPlan) => (
        <Space size="small">
          <Button type="link" size="small" icon={<Eye size={14} />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {['pending', 'approved1', 'approved'].includes(record.status) && (
            <>
              <Button type="link" size="small" type="primary" onClick={() => handleApproval(record, 'approved')}>
                通过
              </Button>
              <Button type="link" size="small" danger onClick={() => handleApproval(record, 'rejected')}>
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'pending',
      label: <span className="flex items-center gap-2">待我审批 <Badge count={pendingPlans.length} size="small" /></span>,
      children: (
        <Table
          columns={columns}
          dataSource={pendingPlans}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
        />
      ),
    },
    {
      key: 'approved',
      label: <span className="flex items-center gap-2">已审批 <CheckCircle size={16} className="text-green-500" /></span>,
      children: (
        <Table
          columns={columns}
          dataSource={approvedPlans}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
        />
      ),
    },
    {
      key: 'rejected',
      label: <span className="flex items-center gap-2">已驳回 <XCircle size={16} className="text-red-500" /></span>,
      children: (
        <Table
          columns={columns}
          dataSource={rejectedPlans}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="待审批数量" value={pendingPlans.length} valueStyle={{ color: '#FAAD14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="今日需处理" value={Math.ceil(pendingPlans.length / 3)} valueStyle={{ color: '#FF7D00' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="本月已审批" value={approvedPlans.length} valueStyle={{ color: '#00B42A' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic 
              title="审批及时率" 
              value={pendingPlans.length + approvedPlans.length > 0 ? Math.round((approvedPlans.length / (pendingPlans.length + approvedPlans.length)) * 100) : 100} 
              suffix="%"
              valueStyle={{ color: '#165DFF' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title="计划详情"
        open={detailModal}
        onCancel={() => {
          setDetailModal(false);
          if (!approvalModal) {
            setSelectedPlan(null);
          }
        }}
        width={800}
        footer={
          selectedPlan && ['pending', 'approved1', 'approved'].includes(selectedPlan.status) ? (
            <Space>
              <Button danger onClick={() => { setDetailModal(false); handleApproval(selectedPlan, 'rejected'); }}>
                驳回
              </Button>
              <Button type="primary" onClick={() => { setDetailModal(false); handleApproval(selectedPlan, 'approved'); }}>
                通过
              </Button>
            </Space>
          ) : null
        }
      >
        {selectedPlan && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Tag color={statusMap[selectedPlan.status].color as any} className="text-base px-3 py-1">
                {statusMap[selectedPlan.status].label}
              </Tag>
              {selectedPlan.hasConflict && (
                <Tag color="error" className="flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {selectedPlan.conflictDesc}
                </Tag>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 mb-1">项目名称</div>
                <div className="font-medium">{selectedPlan.projectName}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">施工类型</div>
                <div className="font-medium">{selectedPlan.constructionType}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">施工单位</div>
                <div className="font-medium">{selectedPlan.constructionUnit}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">负责人</div>
                <div className="font-medium">{selectedPlan.personInCharge} {selectedPlan.phone}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">施工时间</div>
                <div className="font-medium">{selectedPlan.startTime} ~ {selectedPlan.endTime}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">线路/里程</div>
                <div className="font-medium">{selectedPlan.lineSection} {selectedPlan.mileageStart}-{selectedPlan.mileageEnd}</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500 mb-1">影响车站</div>
                <div className="flex flex-wrap gap-1">
                  {selectedPlan.affectedStations.map(s => <Tag key={s}>{s}</Tag>)}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">审批流程</h4>
              <Timeline
                items={getApprovalList(selectedPlan).map(approval => ({
                  color: approval.result === 'approved' ? 'green' : approval.result === 'rejected' ? 'red' : 'blue',
                  dot: approval.result === 'approved' ? <Check size={14} /> : approval.result === 'rejected' ? <X size={14} /> : <Clock size={14} />,
                  children: (
                    <div className="pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{approval.levelName}</span>
                        <Tag color={approval.result === 'approved' ? 'success' : approval.result === 'rejected' ? 'error' : 'processing'}>
                          {approval.result === 'approved' ? '已通过' : approval.result === 'rejected' ? '已驳回' : '待审批'}
                        </Tag>
                      </div>
                      {approval.approver && (
                        <div className="text-sm text-gray-500 mb-1">
                          <User size={12} className="inline mr-1" />
                          {approval.approver} · {approval.approvalTime}
                        </div>
                      )}
                      {approval.opinion && (
                        <div className="text-sm bg-gray-50 rounded p-2 mt-2">{approval.opinion}</div>
                      )}
                      {approval.result === 'pending' && !approval.approver && (
                        <div className="text-sm text-gray-400">等待审批...</div>
                      )}
                    </div>
                  ),
                }))}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={approvalType === 'approved' ? '审批通过' : '审批驳回'}
        open={approvalModal}
        onCancel={() => {
          setApprovalModal(false);
          setSelectedPlan(null);
        }}
        onOk={handleSubmitApproval}
        confirmLoading={submitting}
        okText={approvalType === 'approved' ? '确认通过' : '确认驳回'}
        okButtonProps={{ danger: approvalType === 'rejected' }}
        width={520}
      >
        {selectedPlan && (
          <Form form={form} layout="vertical">
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="font-medium mb-2">{selectedPlan.projectName}</div>
              <div className="text-sm text-gray-500">
                {selectedPlan.lineSection} · {dayjs(selectedPlan.startTime).format('MM-DD HH:mm')} - {dayjs(selectedPlan.endTime).format('HH:mm')}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                当前节点：{getApprovalLevel(selectedPlan.status).levelName}
              </div>
            </div>
            <Form.Item
              name="opinion"
              label={approvalType === 'approved' ? '审批意见' : '驳回原因'}
              rules={[
                { required: approvalType === 'rejected', message: `请输入${approvalType === 'approved' ? '审批意见' : '驳回原因'}` },
              ]}
            >
              <TextArea rows={4} placeholder={approvalType === 'approved' ? '请输入审批意见（选填）' : '请输入驳回原因（必填）'} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalPage;
