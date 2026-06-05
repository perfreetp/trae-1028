import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Button,
  Steps,
  Table,
  Space,
  Alert,
  message,
  Divider,
  InputNumber,
  Tag,
} from 'antd';
import {
  FileText,
  MapPin,
  Users,
  Shield,
  Plus,
  Trash2,
  Save,
  Send,
  AlertTriangle,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { lineSections, stations, constructionTypes } from '../types';
import type { Worker, Machine, SkyPlan } from '../types';

const { TextArea } = Input;
const { Option } = Select;

const ApplicationPage = () => {
  const { addNewPlan, checkConflicts } = useAppStore();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [conflictInfo, setConflictInfo] = useState<{ hasConflict: boolean; desc: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const steps = [
    { title: '基本信息', icon: <FileText size={18} /> },
    { title: '施工范围', icon: <MapPin size={18} /> },
    { title: '人员机具', icon: <Users size={18} /> },
    { title: '风险措施', icon: <Shield size={18} /> },
  ];

  const generateId = () => Math.random().toString(36).substring(2, 11);

  const addWorker = () => {
    setWorkers([...workers, { id: generateId(), name: '', position: '', idCard: '', phone: '' }]);
  };

  const removeWorker = (id: string) => {
    setWorkers(workers.filter(w => w.id !== id));
  };

  const updateWorker = (id: string, field: keyof Worker, value: string) => {
    setWorkers(workers.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const addMachine = () => {
    setMachines([...machines, { id: generateId(), name: '', model: '', quantity: 1, inspector: '' }]);
  };

  const removeMachine = (id: string) => {
    setMachines(machines.filter(m => m.id !== id));
  };

  const updateMachine = (id: string, field: keyof Machine, value: string | number) => {
    setMachines(machines.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const checkForConflicts = async () => {
    const values = await form.validateFields();
    const planData = {
      startTime: values.applyDate.format('YYYY-MM-DD') + ' ' + values.startTime.format('HH:mm'),
      endTime: values.applyDate.format('YYYY-MM-DD') + ' ' + values.endTime.format('HH:mm'),
      lineSection: values.lineSection,
      affectedStations: values.affectedStations || [],
      mileageStart: values.mileageStart,
      mileageEnd: values.mileageEnd,
    };
    const result = checkConflicts(planData);
    setConflictInfo(result);
    return result;
  };

  const handleNext = async () => {
    try {
      if (currentStep === 1) {
        const result = await checkForConflicts();
        if (result.hasConflict) {
          message.warning('检测到冲突，请确认后继续');
        }
      }
      await form.validateFields();
      setCurrentStep(currentStep + 1);
    } catch {
      message.error('请完善当前步骤信息');
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();

      const validWorkers = workers.filter(w => 
        w.name && w.name.trim() && w.position && w.position.trim()
      );
      const validMachines = machines.filter(m => 
        m.name && m.name.trim()
      );

      if (validWorkers.length === 0 && validMachines.length === 0) {
        message.error('请填写有效的作业人员或施工机具信息（空白行或仅空格不算有效数据）');
        setCurrentStep(2);
        setSubmitting(false);
        return;
      }
      
      const planData: Omit<SkyPlan, 'id' | 'createdAt' | 'updatedAt'> = {
        projectName: values.projectName,
        constructionUnit: values.constructionUnit,
        personInCharge: values.personInCharge,
        phone: values.phone,
        applyDate: values.applyDate.format('YYYY-MM-DD'),
        startTime: values.applyDate.format('YYYY-MM-DD') + ' ' + values.startTime.format('HH:mm:00'),
        endTime: values.applyDate.format('YYYY-MM-DD') + ' ' + values.endTime.format('HH:mm:00'),
        lineSection: values.lineSection,
        mileageStart: values.mileageStart,
        mileageEnd: values.mileageEnd,
        affectedStations: values.affectedStations || [],
        constructionType: values.constructionType,
        workers: validWorkers,
        machines: validMachines,
        riskMeasures: values.riskMeasures || '',
        status: 'pending',
        currentApprovalLevel: 1,
        hasConflict: conflictInfo?.hasConflict || false,
        conflictDesc: conflictInfo?.desc,
      };

      addNewPlan(planData);
      message.success('申请提交成功，已进入审批流程');
      
      form.resetFields();
      setWorkers([]);
      setMachines([]);
      setConflictInfo(null);
      setCurrentStep(0);
    } catch (error) {
      console.error(error);
      message.error('提交失败，请检查表单信息');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const values = form.getFieldsValue();
      const planData: Omit<SkyPlan, 'id' | 'createdAt' | 'updatedAt'> = {
        projectName: values.projectName || '',
        constructionUnit: values.constructionUnit || '',
        personInCharge: values.personInCharge || '',
        phone: values.phone || '',
        applyDate: values.applyDate ? values.applyDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        startTime: values.applyDate && values.startTime ? values.applyDate.format('YYYY-MM-DD') + ' ' + values.startTime.format('HH:mm:00') : '',
        endTime: values.applyDate && values.endTime ? values.applyDate.format('YYYY-MM-DD') + ' ' + values.endTime.format('HH:mm:00') : '',
        lineSection: values.lineSection || '',
        mileageStart: values.mileageStart || '',
        mileageEnd: values.mileageEnd || '',
        affectedStations: values.affectedStations || [],
        constructionType: values.constructionType || '',
        workers,
        machines,
        riskMeasures: values.riskMeasures || '',
        status: 'draft',
        currentApprovalLevel: 0,
        hasConflict: false,
      };

      addNewPlan(planData);
      message.success('草稿保存成功');
    } catch (error) {
      console.error(error);
      message.error('保存失败');
    }
  };

  const workerColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      render: (_: any, record: Worker) => (
        <Input
          size="small"
          value={record.name}
          onChange={(e) => updateWorker(record.id, 'name', e.target.value)}
          placeholder="请输入姓名"
        />
      ),
    },
    {
      title: '岗位',
      dataIndex: 'position',
      render: (_: any, record: Worker) => (
        <Select
          size="small"
          value={record.position}
          onChange={(v) => updateWorker(record.id, 'position', v)}
          placeholder="选择岗位"
          style={{ width: '100%' }}
        >
          <Option value="施工负责人">施工负责人</Option>
          <Option value="技术员">技术员</Option>
          <Option value="安全员">安全员</Option>
          <Option value="防护员">防护员</Option>
          <Option value="作业人员">作业人员</Option>
        </Select>
      ),
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      render: (_: any, record: Worker) => (
        <Input
          size="small"
          value={record.idCard}
          onChange={(e) => updateWorker(record.id, 'idCard', e.target.value)}
          placeholder="请输入身份证号"
        />
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      render: (_: any, record: Worker) => (
        <Input
          size="small"
          value={record.phone}
          onChange={(e) => updateWorker(record.id, 'phone', e.target.value)}
          placeholder="请输入联系电话"
        />
      ),
    },
    {
      title: '操作',
      width: 80,
      render: (_: any, record: Worker) => (
        <Button type="text" danger size="small" icon={<Trash2 size={14} />} onClick={() => removeWorker(record.id)} />
      ),
    },
  ];

  const machineColumns = [
    {
      title: '机具名称',
      dataIndex: 'name',
      render: (_: any, record: Machine) => (
        <Input
          size="small"
          value={record.name}
          onChange={(e) => updateMachine(record.id, 'name', e.target.value)}
          placeholder="请输入机具名称"
        />
      ),
    },
    {
      title: '型号',
      dataIndex: 'model',
      render: (_: any, record: Machine) => (
        <Input
          size="small"
          value={record.model}
          onChange={(e) => updateMachine(record.id, 'model', e.target.value)}
          placeholder="请输入型号"
        />
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 100,
      render: (_: any, record: Machine) => (
        <InputNumber
          size="small"
          min={1}
          value={record.quantity}
          onChange={(v) => updateMachine(record.id, 'quantity', v || 1)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '检查人',
      dataIndex: 'inspector',
      render: (_: any, record: Machine) => (
        <Input
          size="small"
          value={record.inspector}
          onChange={(e) => updateMachine(record.id, 'inspector', e.target.value)}
          placeholder="请输入检查人"
        />
      ),
    },
    {
      title: '操作',
      width: 80,
      render: (_: any, record: Machine) => (
        <Button type="text" danger size="small" icon={<Trash2 size={14} />} onClick={() => removeMachine(record.id)} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <Steps current={currentStep} items={steps} className="mb-8" />

        {currentStep === 0 && (
          <Form form={form} layout="vertical">
            <div className="grid grid-cols-2 gap-6">
              <Form.Item
                name="projectName"
                label="项目名称"
                rules={[{ required: true, message: '请输入项目名称' }]}
              >
                <Input placeholder="请输入施工项目名称" size="large" />
              </Form.Item>
              <Form.Item
                name="constructionType"
                label="施工类型"
                rules={[{ required: true, message: '请选择施工类型' }]}
              >
                <Select placeholder="请选择施工类型" size="large">
                  {constructionTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="constructionUnit"
                label="施工单位"
                rules={[{ required: true, message: '请输入施工单位' }]}
              >
                <Input placeholder="请输入施工单位名称" size="large" />
              </Form.Item>
              <Form.Item
                name="personInCharge"
                label="项目负责人"
                rules={[{ required: true, message: '请输入负责人姓名' }]}
              >
                <Input placeholder="请输入负责人姓名" size="large" />
              </Form.Item>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                ]}
              >
                <Input placeholder="请输入联系电话" size="large" />
              </Form.Item>
            </div>
          </Form>
        )}

        {currentStep === 1 && (
          <Form form={form} layout="vertical">
            {conflictInfo && conflictInfo.hasConflict && (
              <Alert
                message={<span className="flex items-center gap-2"><AlertTriangle size={18} /> 冲突检测警告</span>}
                description={conflictInfo.desc}
                type="warning"
                showIcon
                className="mb-6"
              />
            )}
            
            <div className="grid grid-cols-2 gap-6">
              <Form.Item
                name="applyDate"
                label="施工日期"
                rules={[{ required: true, message: '请选择施工日期' }]}
              >
                <DatePicker style={{ width: '100%' }} size="large" placeholder="选择施工日期" />
              </Form.Item>
              <Form.Item
                name="lineSection"
                label="线路区间"
                rules={[{ required: true, message: '请选择线路区间' }]}
              >
                <Select placeholder="请选择线路区间" size="large">
                  {lineSections.map(line => (
                    <Option key={line} value={line}>{line}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="startTime"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker style={{ width: '100%' }} size="large" format="HH:mm" placeholder="选择开始时间" />
              </Form.Item>
              <Form.Item
                name="endTime"
                label="结束时间"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <TimePicker style={{ width: '100%' }} size="large" format="HH:mm" placeholder="选择结束时间" />
              </Form.Item>
              <Form.Item
                name="mileageStart"
                label="起始里程"
                rules={[{ required: true, message: '请输入起始里程' }]}
              >
                <Input placeholder="例如：K100+000" size="large" />
              </Form.Item>
              <Form.Item
                name="mileageEnd"
                label="结束里程"
                rules={[{ required: true, message: '请输入结束里程' }]}
              >
                <Input placeholder="例如：K105+000" size="large" />
              </Form.Item>
              <Form.Item
                name="affectedStations"
                label="影响车站"
                className="col-span-2"
                rules={[{ required: true, message: '请选择影响车站' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择影响的车站（可多选）"
                  size="large"
                  optionRender={({ label }) => <Tag>{label}</Tag>}
                >
                  {stations.map(station => (
                    <Option key={station} value={station}>{station}</Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            
            <Button type="dashed" block onClick={checkForConflicts} className="mt-2">
              检测冲突
            </Button>
          </Form>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">作业人员登记</h4>
                <Button type="primary" icon={<Plus size={16} />} onClick={addWorker}>
                  添加人员
                </Button>
              </div>
              <Table
                dataSource={workers}
                columns={workerColumns}
                pagination={false}
                rowKey="id"
                locale={{ emptyText: '暂无作业人员，请点击上方按钮添加' }}
              />
            </div>

            <Divider />

            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">施工机具清单</h4>
                <Button type="primary" icon={<Plus size={16} />} onClick={addMachine}>
                  添加机具
                </Button>
              </div>
              <Table
                dataSource={machines}
                columns={machineColumns}
                pagination={false}
                rowKey="id"
                locale={{ emptyText: '暂无施工机具，请点击上方按钮添加' }}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <Form form={form} layout="vertical">
            <Form.Item
              name="riskMeasures"
              label="安全风险及防护措施"
              rules={[{ required: true, message: '请填写安全风险及防护措施' }]}
            >
              <TextArea
                rows={12}
                placeholder="请详细描述：&#10;1. 主要危险源识别&#10;2. 安全防护措施&#10;3. 应急预案及处置流程"
                size="large"
              />
            </Form.Item>
            
            <div className="bg-blue-50 rounded-lg p-4 mt-4">
              <h5 className="font-medium text-blue-800 mb-2">填写提示</h5>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>请识别施工过程中可能存在的各类安全风险</li>
                <li>针对每项风险制定具体的防护措施，落实到人</li>
                <li>制定应急预案，明确应急处置流程和联系人</li>
                <li>确保所有作业人员均已接受安全技术交底</li>
              </ul>
            </div>
          </Form>
        )}

        <Divider />

        <div className="flex justify-between">
          <Space>
            <Button icon={<Save size={16} />} onClick={handleSaveDraft}>
              保存草稿
            </Button>
          </Space>
          <Space>
            {currentStep > 0 && (
              <Button onClick={handlePrev}>
                上一步
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            ) : (
              <Button type="primary" icon={<Send size={16} />} onClick={handleSubmit} loading={submitting}>
                提交审批
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ApplicationPage;
