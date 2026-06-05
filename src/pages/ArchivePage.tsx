import { useState, useMemo, useEffect } from 'react';
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
  Upload,
  message,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Progress,
  List,
  Avatar,
  Tooltip,
} from 'antd';
import {
  Archive,
  FileText,
  Upload as UploadIcon,
  Download,
  Eye,
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  File,
  Image,
  FileSpreadsheet,
  Calendar,
  Search,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { statusMap, constructionTypes, lineSections } from '../types';
import type { SkyPlan, ArchiveFile } from '../types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const categoryMap: Record<string, string> = {
  plan: '施工方案',
  record: '施工记录',
  check: '检查记录',
  accept: '验收报告',
  photo: '现场照片',
  other: '其他资料',
};

const ArchivePage = () => {
  const { plans, addArchive, getArchivesByPlanId, currentUser, archives } = useAppStore();
  const [activeTab, setActiveTab] = useState('stats');
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [detailModal, setDetailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SkyPlan | null>(null);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [form] = Form.useForm();

  const archivedPlans = useMemo(() => 
    plans.filter(p => ['signout', 'completed', 'archived'].includes(p.status)),
    [plans]
  );

  const monthlyStats = useMemo(() => {
    const monthStr = selectedMonth.format('YYYY-MM');
    const monthPlans = plans.filter(p => p.applyDate.startsWith(monthStr));
    
    const total = monthPlans.length;
    const completed = monthPlans.filter(p => ['signout', 'completed', 'archived'].includes(p.status)).length;
    const canceled = monthPlans.filter(p => p.status === 'rejected').length;
    const fulfillmentRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const dailyData: { date: string; total: number; completed: number }[] = [];
    const daysInMonth = selectedMonth.daysInMonth();
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = `${monthStr}-${String(i).padStart(2, '0')}`;
      const dayPlans = monthPlans.filter(p => p.applyDate === dayStr);
      dailyData.push({
        date: `${i}日`,
        total: dayPlans.length,
        completed: dayPlans.filter(p => ['signout', 'completed', 'archived'].includes(p.status)).length,
      });
    }

    const typeStats = constructionTypes.map(type => ({
      type,
      count: monthPlans.filter(p => p.constructionType === type).length,
      completed: monthPlans.filter(p => p.constructionType === type && ['signout', 'completed', 'archived'].includes(p.status)).length,
    }));

    const lineStats = lineSections.map(line => ({
      line,
      count: monthPlans.filter(p => p.lineSection === line).length,
    }));

    return { total, completed, canceled, fulfillmentRate, dailyData, typeStats, lineStats };
  }, [plans, selectedMonth]);

  const planArchiveFiles = useMemo(() => {
    if (!selectedPlan) return [];
    return getArchivesByPlanId(selectedPlan.id);
  }, [selectedPlan, getArchivesByPlanId, archives, detailModal]);

  const handlePreview = (file: ArchiveFile) => {
    message.info(`正在预览：${file.fileName}`);
  };

  const handleDownload = (file: ArchiveFile) => {
    message.success(`已开始下载：${file.fileName}`);
  };

  const handleUploadSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (fileList.length === 0) {
        message.error('请选择要上传的文件');
        return;
      }

      setUploading(true);
      const wasFromDetail = selectedPlan !== null;
      const planId = selectedPlan!.id;

      for (const file of fileList) {
        const fileName = file.name;
        const fileExt = fileName.split('.').pop()?.toLowerCase() || 'other';
        
        addArchive({
          planId,
          fileName,
          fileType: fileExt,
          fileSize: file.size || 102400,
          uploader: currentUser.name,
          uploadTime: dayjs().format('YYYY-MM-DD HH:mm'),
          description: values.description || '',
          category: values.fileType,
        });
      }

      message.success(`成功上传 ${fileList.length} 个文件`);
      setUploadModal(false);
      setFileList([]);
      form.resetFields();

      if (wasFromDetail) {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
          setSelectedPlan({ ...plan });
          setTimeout(() => setDetailModal(true), 150);
        }
      }
    } catch (error) {
      console.error(error);
      message.error('上传失败，请检查表单信息');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText size={20} className="text-red-500" />;
      case 'xlsx': case 'xls': return <FileSpreadsheet size={20} className="text-green-500" />;
      case 'jpg': case 'png': case 'jpeg': return <Image size={20} className="text-blue-500" />;
      default: return <File size={20} className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleViewDetail = (plan: SkyPlan) => {
    setSelectedPlan(plan);
    setDetailModal(true);
  };

  const handleUpload = (plan: SkyPlan) => {
    setSelectedPlan(plan);
    setFileList([]);
    form.resetFields();
    setUploadModal(true);
  };

  const handleExport = () => {
    message.success('报表已导出');
  };

  const fulfillmentChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['计划数量', '完成数量'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: monthlyStats.dailyData.map(d => d.date),
      axisLabel: { interval: 3 },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '计划数量',
        type: 'bar',
        data: monthlyStats.dailyData.map(d => d.total),
        itemStyle: { color: '#91CAFF' },
      },
      {
        name: '完成数量',
        type: 'bar',
        data: monthlyStats.dailyData.map(d => d.completed),
        itemStyle: { color: '#165DFF' },
      },
    ],
  };

  const typeChartOption = {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '施工类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: monthlyStats.typeStats.filter(t => t.count > 0).map(t => ({
          value: t.count,
          name: t.type,
        })),
      },
    ],
  };

  const archiveColumns = useMemo(() => [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      width: 220,
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: '施工单位',
      dataIndex: 'constructionUnit',
      width: 150,
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
      title: '资料数量',
      key: 'fileCount',
      width: 100,
      render: (_: any, record: SkyPlan) => (
        <Tag color="blue">{getArchivesByPlanId(record.id).length} 份</Tag>
      ),
    },
    {
      title: '归档时间',
      key: 'archiveTime',
      width: 160,
      render: (_: any, record: SkyPlan) => (
        <span className="text-sm text-gray-500">{record.signoutTime || record.updatedAt}</span>
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
            查看
          </Button>
          <Button type="link" size="small" icon={<UploadIcon size={14} />} onClick={() => handleUpload(record)}>
            上传
          </Button>
        </Space>
      ),
    },
  ], [getArchivesByPlanId, archives]);

  const tabItems = [
    {
      key: 'stats',
      label: <span className="flex items-center gap-2"><BarChart3 size={16} /> 统计报表</span>,
      children: (
        <div className="space-y-6">
          <Row gutter={16}>
            <Col span={6}>
              <Card className="text-center">
                <Statistic
                  title="本月计划总数"
                  value={monthlyStats.total}
                  prefix={<Calendar size={18} />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="text-center">
                <Statistic
                  title="已完成"
                  value={monthlyStats.completed}
                  valueStyle={{ color: '#00B42A' }}
                  prefix={<CheckCircle size={18} />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="text-center">
                <Statistic
                  title="未执行"
                  value={monthlyStats.canceled}
                  valueStyle={{ color: '#F53F3F' }}
                  prefix={<XCircle size={18} />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="text-center">
                <Statistic
                  title="月度兑现率"
                  value={monthlyStats.fulfillmentRate}
                  suffix="%"
                  valueStyle={{ color: '#165DFF' }}
                  prefix={<TrendingUp size={18} />}
                />
                <Progress
                  percent={monthlyStats.fulfillmentRate}
                  size="small"
                  showInfo={false}
                  className="mt-2"
                  strokeColor="#165DFF"
                />
              </Card>
            </Col>
          </Row>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">月度兑现率趋势</h3>
            <Space>
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={(date) => date && setSelectedMonth(date)}
              />
              <Button icon={<Download size={16} />} onClick={handleExport}>
                导出报表
              </Button>
            </Space>
          </div>

          <Row gutter={16}>
            <Col span={16}>
              <Card title="每日计划完成情况">
                <ReactECharts option={fulfillmentChartOption} style={{ height: 350 }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card title="施工类型分布">
                <ReactECharts option={typeChartOption} style={{ height: 350 }} />
              </Card>
            </Col>
          </Row>

          <Card title="各线路计划统计">
            <Row gutter={[16, 16]}>
              {monthlyStats.lineStats.filter(l => l.count > 0).map(line => (
                <Col span={8} key={line.line}>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{line.line}</span>
                      <Tag color="blue">{line.count} 个</Tag>
                    </div>
                    <Progress percent={Math.round((line.count / monthlyStats.total) * 100)} size="small" />
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: 'archive',
      label: <span className="flex items-center gap-2"><Archive size={16} /> 资料归档</span>,
      children: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <Select placeholder="施工类型" style={{ width: 150 }} allowClear>
                {constructionTypes.map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
              <Select placeholder="线路区间" style={{ width: 150 }} allowClear>
                {lineSections.map(line => (
                  <Option key={line} value={line}>{line}</Option>
                ))}
              </Select>
              <RangePicker />
              <Button icon={<Search size={16} />}>搜索</Button>
            </div>
          </div>
          <Table
            columns={archiveColumns}
            dataSource={archivedPlans}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title="档案详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        width={800}
        footer={null}
      >
        {selectedPlan && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Tag color={statusMap[selectedPlan.status].color as any} className="text-base px-3 py-1">
                {statusMap[selectedPlan.status].label}
              </Tag>
              <span className="font-semibold text-lg">{selectedPlan.projectName}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 mb-1">施工单位</div>
                <div className="font-medium">{selectedPlan.constructionUnit}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">负责人</div>
                <div className="font-medium">{selectedPlan.personInCharge}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">施工时间</div>
                <div className="font-medium">{selectedPlan.startTime} ~ {selectedPlan.endTime}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">施工地点</div>
                <div className="font-medium">{selectedPlan.lineSection} {selectedPlan.mileageStart}-{selectedPlan.mileageEnd}</div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">归档资料（{planArchiveFiles.length}份）</h4>
                <Button size="small" icon={<UploadIcon size={14} />} onClick={() => { setDetailModal(false); handleUpload(selectedPlan); }}>
                  上传资料
                </Button>
              </div>
              <List
                dataSource={planArchiveFiles}
                locale={{ emptyText: '暂无归档资料，请点击上方按钮上传' }}
                renderItem={file => (
                  <List.Item
                    actions={[
                      <Button type="link" size="small" icon={<Eye size={14} />} onClick={() => handlePreview(file)}>预览</Button>,
                      <Button type="link" size="small" icon={<Download size={14} />} onClick={() => handleDownload(file)}>下载</Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={getFileIcon(file.fileType)} style={{ backgroundColor: 'transparent' }} />}
                      title={
                        <div className="flex items-center gap-2">
                          <span>{file.fileName}</span>
                          {file.category && (
                            <Tag color="blue" size="small">{categoryMap[file.category] || file.category}</Tag>
                          )}
                        </div>
                      }
                      description={
                        <div className="text-sm text-gray-500 flex items-center gap-4 flex-wrap">
                          <span>{formatFileSize(file.fileSize)}</span>
                          <span>上传人：{file.uploader}</span>
                          <span>{file.uploadTime}</span>
                          {file.description && <span className="text-gray-400">备注：{file.description}</span>}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="上传资料"
        open={uploadModal}
        onCancel={() => { 
          setUploadModal(false); 
          setFileList([]); 
          form.resetFields();
        }}
        onOk={handleUploadSubmit}
        okText="上传"
        confirmLoading={uploading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="fileType"
            label="资料类型"
            rules={[{ required: true, message: '请选择资料类型' }]}
          >
            <Select placeholder="请选择资料类型">
              <Option value="plan">施工方案</Option>
              <Option value="record">施工记录</Option>
              <Option value="check">检查记录</Option>
              <Option value="accept">验收报告</Option>
              <Option value="photo">现场照片</Option>
              <Option value="other">其他资料</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="资料说明"
          >
            <Input.TextArea rows={3} placeholder="请输入资料说明（选填）" />
          </Form.Item>
          <Form.Item label="上传文件">
            <Upload.Dragger
              multiple
              fileList={fileList}
              beforeUpload={(file) => {
                setFileList([...fileList, file]);
                return false;
              }}
              onRemove={(file) => {
                setFileList(fileList.filter(f => f.uid !== file.uid));
              }}
            >
              <p className="ant-upload-drag-icon">
                <UploadIcon size={48} className="text-blue-500" />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
              <p className="ant-upload-hint">支持 PDF、Word、Excel、图片等格式</p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ArchivePage;
