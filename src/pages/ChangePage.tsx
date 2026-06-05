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
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  TimePicker,
  Descriptions,
} from 'antd';
import {
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  Plus,
  Eye,
  FileDiff,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { statusMap, lineSections, constructionTypes } from '../types';
import type { SkyPlan, ChangeRecord, ChangeType } from '../types';

const { TextArea } = Input;
const { Option } = Select;

const ChangePage = () => {
  const { plans, getAllChanges, addChange, updateChange, currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState('pending');
  const [applyModal, setApplyModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SkyPlan | null>(null);
  const [selectedChange, setSelectedChange] = useState<ChangeRecord | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectForm] = Form.useForm();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const changeablePlans = useMemo(() =>
    plans.filter(p => ['approved', 'commanded', 'signin', 'executing'].includes(p.status)),
    [plans]
  );

  const allChanges = useMemo(() => getAllChanges(), [getAllChanges]);
  const pendingChanges = useMemo(() => allChanges.filter(c => c.status === 'pending'), [allChanges]);
  const approvedChanges = useMemo(() => allChanges.filter(c => c.status === 'approved'), [allChanges]);
  const rejectedChanges = useMemo(() => allChanges.filter(c => c.status === 'rejected'), [allChanges]);

  const getPlanById = (id: string) => plans.find(p => p.id === id);

  const getChangeTypeColor = (type: ChangeType) => {
    const colors: Record<ChangeType, string> = {
      time: 'blue',
      scope: 'purple',
      delay: 'orange',
      cancel: 'red',
    };
    return colors[type];
  };

  const getTypeNames = (type: ChangeType) => {
    const names: Record<ChangeType, string> = {
      time: '时间变更',
      scope: '范围变更',
      delay: '延期申请',
      cancel: '取消申请',
    };
    return names[type];
  };

  const handleApply = (plan?: SkyPlan) => {
    if (plan) {
      setSelectedPlan(plan);
      form.setFieldsValue({ planId: plan.id });
    } else {
      setSelectedPlan(null);
    }
    form.resetFields();
    setApplyModal(true);
  };

  const handleViewDetail = (change: ChangeRecord) => {
    setSelectedChange(change);
    setSelectedPlan(getPlanById(change.planId) || null);
    setDetailModal(true);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      const plan = plans.find(p => p.id === values.planId);
      if (!plan) return;

      let oldContent = '';
      let newContent = '';

      switch (values.changeType) {
        case 'time':
          oldContent = `开始时间：${plan.startTime}`;
          newContent = values.newDate && values.newTime
            ? `开始时间：${values.newDate.format('YYYY-MM-DD')} ${values.newTime.format('HH:mm')}`
            : '时间变更';
          break;
        case 'delay':
          oldContent = `结束时间：${plan.endTime}`;
          newContent = values.newDate && values.newTime
            ? `结束时间：${values.newDate.format('YYYY-MM-DD')} ${values.newTime.format('HH:mm')}`
            : '延期';
          break;
        case 'scope':
          oldContent = `里程范围：${plan.mileageStart} - ${plan.mileageEnd}`;
          newContent = values.newMileageStart && values.newMileageEnd
            ? `里程范围：${values.newMileageStart} - ${values.newMileageEnd}`
            : '范围变更';
          break;
        case 'cancel':
          oldContent = '正常执行';
          newContent = '取消本次施工';
          break;
      }

      addChange({
        planId: values.planId,
        changeType: values.changeType,
        changeTypeName: getTypeNames(values.changeType),
        reason: values.reason,
        oldContent,
        newContent,
        status: 'pending',
        applyTime: dayjs().format('YYYY-MM-DD HH:mm'),
      });

      message.success('变更申请已提交，等待审批');
      setApplyModal(false);
      setActiveTab('pending');
    } catch (error) {
      console.error(error);
      message.error('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = (change: ChangeRecord) => {
    Modal.confirm({
      title: '批准变更申请',
      content: '确定批准该变更申请吗？批准后将自动通知相关人员。',
      okText: '确认批准',
      onOk: () => {
        updateChange(change.id, { status: 'approved' });
        message.success('变更已批准');
      },
    });
  };

  const handleReject = (change: ChangeRecord) => {
    setSelectedChange(change);
    rejectForm.resetFields();
    setRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedChange) return;
    try {
      const values = await rejectForm.validateFields();
      updateChange(selectedChange.id, { status: 'rejected' });
      message.success('变更已驳回');
      setRejectModal(false);
    } catch {
      message.error('请输入驳回原因');
    }
  };

  const columns = [
    {
      title: '项目名称',
      key: 'projectName',
      width: 220,
      render: (_: any, record: ChangeRecord) => {
        const plan = getPlanById(record.planId);
        return <span className="font-medium">{plan?.projectName || '未知项目'}</span>;
      },
    },
    {
      title: '变更类型',
      dataIndex: 'changeTypeName',
      width: 120,
      render: (name: string, record: ChangeRecord) => (
        <Tag color={getChangeTypeColor(record.changeType)}>{name}</Tag>
      ),
    },
    {
      title: '变更内容',
      key: 'content',
      width: 320,
      render: (_: any, record: ChangeRecord) => (
        <div className="text-sm">
          <div className="text-gray-500 line-through">{record.oldContent}</div>
          <div className="text-blue-600 font-medium mt-1">→ {record.newContent}</div>
        </div>
      ),
    },
    {
      title: '变更原因',
      dataIndex: 'reason',
      width: 200,
      ellipsis: true,
    },
    {
      title: '申请人',
      key: 'applicant',
      width: 100,
      render: () => currentUser.name,
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      width: 160,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          pending: { label: '待审批', color: 'warning' },
          approved: { label: '已批准', color: 'success' },
          rejected: { label: '已驳回', color: 'error' },
        };
        const info = statusMap[status] || { label: status, color: 'default' };
        return <Tag color={info.color as any}>{info.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: ChangeRecord) => (
        <Space size="small">
          <Button type="link" size="small" icon={<Eye size={14} />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button type="link" size="small" type="primary" onClick={() => handleApprove(record)}>
                批准
              </Button>
              <Button type="link" size="small" danger onClick={() => handleReject(record)}>
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const planColumns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      width: 220,
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: '施工类型',
      dataIndex: 'constructionType',
      width: 120,
    },
    {
      title: '施工时间',
      key: 'time',
      width: 200,
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
      title: '施工地点',
      key: 'location',
      width: 200,
      render: (_: any, record: SkyPlan) => (
        <div className="text-sm">
          <div>{record.lineSection}</div>
          <div className="text-gray-500">{record.mileageStart} - {record.mileageEnd}</div>
        </div>
      ),
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
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: SkyPlan) => (
        <Button type="primary" size="small" onClick={() => handleApply(record)}>
          申请变更
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'pending',
      label: <span className="flex items-center gap-2">待审批 <Badge count={pendingChanges.length} size="small" /></span>,
      children: (
        <Table
          columns={columns}
          dataSource={pendingChanges}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
        />
      ),
    },
    {
      key: 'approved',
      label: <span className="flex items-center gap-2">已批准 <Check size={16} className="text-green-500" /></span>,
      children: (
        <Table
          columns={columns}
          dataSource={approvedChanges}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
        />
      ),
    },
    {
      key: 'rejected',
      label: <span className="flex items-center gap-2">已驳回 <X size={16} className="text-red-500" /></span>,
      children: (
        <Table
          columns={columns}
          dataSource={rejectedChanges}
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
            <Statistic title="待审批变更" value={pendingChanges.length} valueStyle={{ color: '#FAAD14' }} prefix={<RefreshCw size={18} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="本月变更" value={allChanges.length} valueStyle={{ color: '#165DFF' }} prefix={<FileDiff size={18} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="已批准" value={approvedChanges.length} valueStyle={{ color: '#00B42A' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="变更率" value={plans.length > 0 ? Math.round((allChanges.length / plans.length) * 100) : 0} suffix="%" valueStyle={{ color: '#FF7D00' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="可变更计划列表"
        extra={
          <Button type="primary" icon={<Plus size={16} />} onClick={() => handleApply()}>
            发起变更
          </Button>
        }
      >
        <Table
          columns={planColumns}
          dataSource={changeablePlans}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Card title="变更申请记录">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title="发起变更申请"
        open={applyModal}
        onCancel={() => setApplyModal(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText="提交申请"
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="planId"
            label="选择施工计划"
            rules={[{ required: true, message: '请选择施工计划' }]}
          >
            <Select placeholder="请选择需要变更的施工计划">
              {changeablePlans.map(plan => (
                <Option key={plan.id} value={plan.id}>
                  {plan.projectName} - {plan.lineSection}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="changeType"
            label="变更类型"
            rules={[{ required: true, message: '请选择变更类型' }]}
          >
            <Select placeholder="请选择变更类型">
              <Option value="time">时间变更</Option>
              <Option value="scope">范围变更</Option>
              <Option value="delay">延期申请</Option>
              <Option value="cancel">取消申请</Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.changeType !== curr.changeType}>
            {({ getFieldValue }) => {
              const type = getFieldValue('changeType');
              if (type === 'time' || type === 'delay') {
                return (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="newDate"
                        label="新日期"
                        rules={[{ required: true, message: '请选择日期' }]}
                      >
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="newTime"
                        label={type === 'delay' ? '新结束时间' : '新开始时间'}
                        rules={[{ required: true, message: '请选择时间' }]}
                      >
                        <TimePicker style={{ width: '100%' }} format="HH:mm" />
                      </Form.Item>
                    </Col>
                  </Row>
                );
              }
              if (type === 'scope') {
                return (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="newMileageStart"
                        label="新起始里程"
                        rules={[{ required: true, message: '请输入起始里程' }]}
                      >
                        <Input placeholder="例如：K100+000" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="newMileageEnd"
                        label="新结束里程"
                        rules={[{ required: true, message: '请输入结束里程' }]}
                      >
                        <Input placeholder="例如：K105+000" />
                      </Form.Item>
                    </Col>
                  </Row>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item
            name="reason"
            label="变更原因"
            rules={[{ required: true, message: '请输入变更原因' }]}
          >
            <TextArea rows={4} placeholder="请详细说明变更的原因和依据" />
          </Form.Item>

          <Form.Item
            name="impact"
            label="影响范围说明（选填）"
          >
            <TextArea rows={2} placeholder="请说明本次变更对运输、其他施工的影响及应对措施" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        width={700}
        footer={
          selectedChange?.status === 'pending' ? (
            <Space>
              <Button danger onClick={() => { setDetailModal(false); handleReject(selectedChange); }}>驳回</Button>
              <Button type="primary" onClick={() => { setDetailModal(false); handleApprove(selectedChange); }}>批准</Button>
            </Space>
          ) : null
        }
      >
        {selectedChange && selectedPlan && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Tag color={getChangeTypeColor(selectedChange.changeType)} className="text-base px-3 py-1">
                {selectedChange.changeTypeName}
              </Tag>
              <Tag color={selectedChange.status === 'pending' ? 'warning' : selectedChange.status === 'approved' ? 'success' : 'error'}>
                {selectedChange.status === 'pending' ? '待审批' : selectedChange.status === 'approved' ? '已批准' : '已驳回'}
              </Tag>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="项目名称">{selectedPlan.projectName}</Descriptions.Item>
              <Descriptions.Item label="施工单位">{selectedPlan.constructionUnit}</Descriptions.Item>
              <Descriptions.Item label="申请人">{currentUser.name}</Descriptions.Item>
              <Descriptions.Item label="申请时间">{selectedChange.applyTime}</Descriptions.Item>
            </Descriptions>

            <div>
              <h4 className="font-medium mb-3">变更内容对比</h4>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">变更前</div>
                  <div className="line-through text-gray-500">{selectedChange.oldContent}</div>
                </div>
                <div className="text-center text-gray-400">
                  <FileDiff size={20} />
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-xs text-blue-500 mb-1">变更后</div>
                  <div className="text-blue-700 font-medium">{selectedChange.newContent}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">变更原因</h4>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">{selectedChange.reason}</div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-start gap-2 text-yellow-800">
                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">注意事项</div>
                  <div className="text-sm mt-1">
                    变更申请批准后，将自动通知相关部门和人员。请确保变更后的安全措施已落实。
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="驳回变更申请"
        open={rejectModal}
        onCancel={() => setRejectModal(false)}
        onOk={handleConfirmReject}
        okText="确认驳回"
        okType="danger"
        width={500}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="驳回原因"
            rules={[{ required: true, message: '请输入驳回原因' }]}
          >
            <TextArea rows={4} placeholder="请详细说明驳回该变更申请的原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChangePage;
