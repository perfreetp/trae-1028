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
  Timeline,
  message,
  Row,
  Col,
  Statistic,
  Checkbox,
  Badge,
  Select,
  DatePicker,
  Avatar,
} from 'antd';
import {
  Shield,
  Phone,
  AlertTriangle,
  Check,
  Plus,
  User,
  Clock,
  Eye,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { statusMap } from '../types';
import type { SkyPlan, ProtectionRecord } from '../types';

const { TextArea } = Input;
const { Option } = Select;

const SafetyPage = () => {
  const {
    plans,
    addProtection,
    getProtectionsByPlanId,
    getProtectionChecks,
    toggleProtectionCheck,
    currentUser,
  } = useAppStore();

  const [selectedPlan, setSelectedPlan] = useState<SkyPlan | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [recordModal, setRecordModal] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [, forceUpdate] = useState({});

  const activePlans = useMemo(() =>
    plans.filter(p => ['commanded', 'signin', 'executing'].includes(p.status)),
    [plans]
  );

  const getProtectionRecords = (planId: string): ProtectionRecord[] => {
    const records = getProtectionsByPlanId(planId);
    return records;
  };

  const handleViewDetail = (plan: SkyPlan) => {
    setSelectedPlan(plan);
    setDetailModal(true);
  };

  const handleAddRecord = (plan: SkyPlan) => {
    setSelectedPlan(plan);
    form.resetFields();
    form.setFieldsValue({ contactTime: dayjs() });
    setRecordModal(true);
  };

  const handleSubmitRecord = async () => {
    if (!selectedPlan) return;
    try {
      setSubmitting(true);
      const values = await form.validateFields();

      addProtection({
        planId: selectedPlan.id,
        protector: values.protector,
        contactTime: values.contactTime
          ? values.contactTime.format('YYYY-MM-DD HH:mm')
          : dayjs().format('YYYY-MM-DD HH:mm'),
        content: values.content,
        isAbnormal: values.isAbnormal || false,
        abnormalDesc: values.isAbnormal ? values.abnormalDesc : undefined,
      });

      message.success('防护记录已添加');
      setRecordModal(false);
      forceUpdate({});
    } catch (error) {
      message.error('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckItem = (planId: string, checkId: string) => {
    toggleProtectionCheck(planId, checkId);
    forceUpdate({});
    message.success('防护措施已确认');
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      width: 220,
      render: (text: string, record: SkyPlan) => {
        const hasAbnormal = getProtectionRecords(record.id).some(r => r.isAbnormal);
        return (
          <div className="font-medium">
            {hasAbnormal && (
              <Badge status="error" className="mr-2" />
            )}
            {text}
          </div>
        );
      },
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
      title: '施工时间',
      key: 'time',
      width: 200,
      render: (_: any, record: SkyPlan) => (
        <div className="text-sm">
          <div>{dayjs(record.startTime).format('MM-DD')}</div>
          <div className="text-gray-500">
            {dayjs(record.startTime).format('HH:mm')} - {dayjs(record.endTime).format('HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: '负责人/防护员',
      key: 'person',
      width: 180,
      render: (_: any, record: SkyPlan) => (
        <div className="text-sm">
          <div>负责人：{record.personInCharge}</div>
          <div className="text-gray-500">防护员：{record.workers.filter(w => w.position.includes('防护')).map(w => w.name).join('、') || '待配置'}</div>
        </div>
      ),
    },
    {
      title: '联络记录',
      key: 'records',
      width: 150,
      render: (_: any, record: SkyPlan) => {
        const records = getProtectionRecords(record.id);
        const abnormalCount = records.filter(r => r.isAbnormal).length;
        return (
          <Space>
            <Tag color="blue">{records.length} 条记录</Tag>
            {abnormalCount > 0 && (
              <Tag color="red" icon={<AlertTriangle size={12} />}>
                {abnormalCount} 异常
              </Tag>
            )}
          </Space>
        );
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
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: SkyPlan) => (
        <Space>
          <Button type="link" size="small" icon={<Eye size={14} />} onClick={() => handleViewDetail(record)}>
            防护详情
          </Button>
          <Button type="link" size="small" icon={<Plus size={14} />} onClick={() => handleAddRecord(record)}>
            添加记录
          </Button>
        </Space>
      ),
    },
  ];

  const stats = {
    total: activePlans.length,
    normal: activePlans.filter(p => !getProtectionRecords(p.id).some(r => r.isAbnormal)).length,
    abnormal: activePlans.filter(p => getProtectionRecords(p.id).some(r => r.isAbnormal)).length,
    records: activePlans.reduce((sum, p) => sum + getProtectionRecords(p.id).length, 0),
  };

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="进行中施工" value={stats.total} prefix={<Shield size={18} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="正常" value={stats.normal} valueStyle={{ color: '#00B42A' }} prefix={<Check size={18} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="存在异常" value={stats.abnormal} valueStyle={{ color: '#F53F3F' }} prefix={<AlertTriangle size={18} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="联络记录" value={stats.records} valueStyle={{ color: '#165DFF' }} prefix={<Phone size={18} />} />
          </Card>
        </Col>
      </Row>

      <Card title="安全防护监控">
        <Table
          columns={columns}
          dataSource={activePlans}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="防护详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        width={800}
        footer={
          <Button type="primary" onClick={() => { setDetailModal(false); selectedPlan && handleAddRecord(selectedPlan); }}>
            添加联络记录
          </Button>
        }
      >
        {selectedPlan && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">施工信息</h4>
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">项目名称</div>
                  <div className="font-medium">{selectedPlan.projectName}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">施工地点</div>
                  <div className="font-medium">{selectedPlan.lineSection} {selectedPlan.mileageStart} - {selectedPlan.mileageEnd}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">施工时间</div>
                  <div className="font-medium">{selectedPlan.startTime} ~ {selectedPlan.endTime}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">施工负责人</div>
                  <div className="font-medium">{selectedPlan.personInCharge}</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">防护员联络记录</h4>
              <div className="max-h-[300px] overflow-y-auto pr-2">
                {getProtectionRecords(selectedPlan.id).length > 0 ? (
                  <Timeline
                    items={getProtectionRecords(selectedPlan.id)
                      .sort((a, b) => dayjs(b.contactTime).valueOf() - dayjs(a.contactTime).valueOf())
                      .map(record => ({
                        color: record.isAbnormal ? 'red' : 'green',
                        dot: record.isAbnormal ? <AlertTriangle size={14} /> : <Phone size={14} />,
                        children: (
                          <div className="pb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{record.protector}</span>
                              {record.isAbnormal && <Tag color="red">异常</Tag>}
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock size={12} />
                                {record.contactTime}
                              </span>
                            </div>
                            <div className="text-sm">{record.content}</div>
                            {record.isAbnormal && record.abnormalDesc && (
                              <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                                <AlertTriangle size={14} className="inline mr-1" />
                                {record.abnormalDesc}
                              </div>
                            )}
                          </div>
                        ),
                      }))}
                  />
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    暂无联络记录
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">安全防护措施检查</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {getProtectionChecks(selectedPlan.id).map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <Checkbox
                      checked={item.checked}
                      onChange={() => handleCheckItem(selectedPlan.id, item.id)}
                    >
                      <span className={item.checked ? 'text-gray-500 line-through' : ''}>
                        {item.label}
                      </span>
                    </Checkbox>
                    {item.checked && (
                      <Tag color="success" className="ml-auto flex items-center gap-1">
                        <Check size={12} /> 已确认
                      </Tag>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">作业人员防护配置</h4>
              <div className="grid grid-cols-2 gap-3">
                {selectedPlan.workers.map(w => (
                  <div key={w.id} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${w.position.includes('防护') ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <div>
                      <div className="font-medium text-sm">{w.name}</div>
                      <div className="text-xs text-gray-500">{w.position}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="添加防护联络记录"
        open={recordModal}
        onCancel={() => setRecordModal(false)}
        onOk={handleSubmitRecord}
        confirmLoading={submitting}
        okText="提交记录"
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="protector"
            label="防护员"
            rules={[{ required: true, message: '请选择防护员' }]}
          >
            <Select placeholder="请选择防护员">
              <Option value="赵防护">赵防护</Option>
              <Option value="钱防护">钱防护</Option>
              <Option value="孙防护">孙防护</Option>
              <Option value="李防护">李防护</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="contactTime"
            label="联络时间"
            rules={[{ required: true, message: '请选择联络时间' }]}
            initialValue={dayjs()}
          >
            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item
            name="content"
            label="联络内容"
            rules={[{ required: true, message: '请输入联络内容' }]}
          >
            <TextArea rows={4} placeholder="请详细描述现场情况" />
          </Form.Item>
          <Form.Item
            name="isAbnormal"
            valuePropName="checked"
          >
            <Checkbox>
              <span className="text-red-500 flex items-center gap-1">
                <AlertTriangle size={14} />
                存在异常情况
              </span>
            </Checkbox>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.isAbnormal !== curr.isAbnormal}>
            {({ getFieldValue }) =>
              getFieldValue('isAbnormal') && (
                <Form.Item
                  name="abnormalDesc"
                  label="异常情况描述"
                  rules={[{ required: true, message: '请描述异常情况' }]}
                >
                  <TextArea rows={3} placeholder="请详细描述异常情况及处置措施" />
                </Form.Item>
              )
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SafetyPage;
