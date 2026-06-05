import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Space,
  Timeline,
  message,
  Statistic,
  Row,
  Col,
  Progress,
  Avatar,
  Tooltip,
  Badge,
} from 'antd';
import {
  Play,
  Square,
  Check,
  Clock,
  MapPin,
  User,
  FileCheck,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { statusMap } from '../types';
import type { SkyPlan } from '../types';

const ExecutionPage = () => {
  const { plans, updateExistingPlan } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<SkyPlan | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [actionModal, setActionModal] = useState(false);
  const [actionType, setActionType] = useState<'command' | 'signin' | 'signout'>('command');
  const [currentTime, setCurrentTime] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const executablePlans = useMemo(() => 
    plans.filter(p => ['approved', 'commanded', 'signin', 'executing'].includes(p.status)),
    [plans]
  );

  const executingPlans = useMemo(() => 
    plans.filter(p => ['signin', 'executing'].includes(p.status)),
    [plans]
  );

  const todayCompleted = useMemo(() => 
    plans.filter(p => 
      ['signout', 'completed', 'archived'].includes(p.status) && 
      dayjs(p.startTime).isSame(dayjs(), 'day')
    ),
    [plans]
  );

  const getTimeLeft = (plan: SkyPlan) => {
    if (!plan.endTime) return { minutes: 0, percent: 0 };
    const end = dayjs(plan.endTime);
    const now = currentTime;
    const diff = end.diff(now, 'minute');
    
    const start = dayjs(plan.startTime);
    const total = end.diff(start, 'minute');
    const elapsed = now.diff(start, 'minute');
    const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));
    
    return { minutes: Math.max(0, diff), percent };
  };

  const handleViewDetail = (plan: SkyPlan) => {
    setSelectedPlan(plan);
    setDetailModal(true);
  };

  const handleAction = (plan: SkyPlan, type: 'command' | 'signin' | 'signout') => {
    setSelectedPlan(plan);
    setActionType(type);
    setActionModal(true);
  };

  const handleConfirmAction = () => {
    if (!selectedPlan) return;
    
    let updates: Partial<SkyPlan> = {};
    const now = currentTime.format('YYYY-MM-DD HH:mm:ss');
    
    switch (actionType) {
      case 'command':
        updates = { 
          status: 'commanded', 
          commandNo: `SKY${dayjs().format('YYYYMMDD')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}` 
        };
        message.success('封锁命令已下达');
        break;
      case 'signin':
        updates = { status: 'signin', signinTime: now };
        message.success('开工签到成功');
        break;
      case 'signout':
        updates = { status: 'signout', signoutTime: now };
        message.success('销记确认成功');
        break;
    }
    
    updateExistingPlan(selectedPlan.id, updates);
    setActionModal(false);
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      width: 220,
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
      title: '封锁命令号',
      dataIndex: 'commandNo',
      width: 150,
      render: (no: string) => no ? <code className="bg-gray-100 px-2 py-1 rounded text-sm">{no}</code> : <Tag color="default">未下达</Tag>,
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
      title: '负责人',
      dataIndex: 'personInCharge',
      width: 100,
    },
    {
      title: '执行状态',
      key: 'execStatus',
      width: 180,
      render: (_: any, record: SkyPlan) => {
        if (['signin', 'executing'].includes(record.status)) {
          const { minutes, percent } = getTimeLeft(record);
          return (
            <div className="w-full">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-orange-500 font-medium">执行中</span>
                <span className="text-gray-500">剩余 {minutes} 分钟</span>
              </div>
              <Progress percent={percent} size="small" status="active" strokeColor="#FF7D00" />
            </div>
          );
        }
        return <Tag color={statusMap[record.status].color as any}>{statusMap[record.status].label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right' as const,
      render: (_: any, record: SkyPlan) => (
        <Space size="small">
          <Button type="link" size="small" icon={<Eye size={14} />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'approved' && (
            <Button type="primary" size="small" icon={<FileCheck size={14} />} onClick={() => handleAction(record, 'command')}>
              下达命令
            </Button>
          )}
          {record.status === 'commanded' && (
            <Button type="primary" size="small" icon={<Play size={14} />} onClick={() => handleAction(record, 'signin')}>
              开工签到
            </Button>
          )}
          {['signin', 'executing'].includes(record.status) && (
            <Button type="primary" size="small" danger icon={<Square size={14} />} onClick={() => handleAction(record, 'signout')}>
              完工销记
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const timelineEvents = selectedPlan ? [
    selectedPlan.createdAt ? {
      color: 'blue',
      children: (
        <div>
          <div className="font-medium">计划提交</div>
          <div className="text-sm text-gray-500">{selectedPlan.createdAt}</div>
        </div>
      ),
    } : null,
    selectedPlan.commandNo ? {
      color: 'blue',
      children: (
        <div>
          <div className="font-medium">封锁命令下达</div>
          <div className="text-sm text-gray-500">命令号：{selectedPlan.commandNo}</div>
        </div>
      ),
    } : null,
    selectedPlan.signinTime ? {
      color: 'orange',
      children: (
        <div>
          <div className="font-medium">开工签到</div>
          <div className="text-sm text-gray-500">{selectedPlan.signinTime}</div>
          <div className="text-sm text-gray-500">签到人：{selectedPlan.personInCharge}</div>
        </div>
      ),
    } : null,
    selectedPlan.signoutTime ? {
      color: 'green',
      children: (
        <div>
          <div className="font-medium">完工销记</div>
          <div className="text-sm text-gray-500">{selectedPlan.signoutTime}</div>
          <div className="text-sm text-gray-500">销记人：{selectedPlan.personInCharge}</div>
        </div>
      ),
    } : null,
  ].filter(Boolean) : [];

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="待执行计划" value={executablePlans.filter(p => p.status === 'approved' || p.status === 'commanded').length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="正在执行" value={executingPlans.length} valueStyle={{ color: '#FF7D00' }} prefix={<Play size={18} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic title="今日已完成" value={todayCompleted.length} valueStyle={{ color: '#00B42A' }} prefix={<Check size={18} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="text-center">
            <Statistic 
              title="当前时间" 
              value={currentTime.format('HH:mm:ss')}
              valueStyle={{ color: '#165DFF', fontFamily: 'monospace' }}
              prefix={<Clock size={18} />}
            />
          </Card>
        </Col>
      </Row>

      {executingPlans.length > 0 && (
        <Card title="正在执行的天窗">
          <Row gutter={16}>
            {executingPlans.map(plan => {
              const { minutes, percent } = getTimeLeft(plan);
              return (
                <Col span={12} key={plan.id}>
                  <Card size="small" className="border-l-4 border-l-orange-500">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-base">{plan.projectName}</h4>
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin size={14} />
                          {plan.lineSection} {plan.mileageStart}-{plan.mileageEnd}
                        </div>
                      </div>
                      <Tag color="orange" className="flex items-center gap-1">
                        <Play size={12} /> 执行中
                      </Tag>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>施工进度</span>
                        <span className={minutes < 30 ? 'text-red-500 font-medium' : 'text-gray-500'}>
                          剩余 {minutes} 分钟
                        </span>
                      </div>
                      <Progress 
                        percent={percent} 
                        status="active" 
                        strokeColor={minutes < 30 ? '#F53F3F' : '#FF7D00'}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <User size={14} />
                        {plan.personInCharge}
                      </div>
                      <div className="text-gray-500">
                        {dayjs(plan.startTime).format('HH:mm')} - {dayjs(plan.endTime).format('HH:mm')}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-2">
                      <Button size="small" onClick={() => handleViewDetail(plan)}>查看详情</Button>
                      <Button size="small" danger onClick={() => handleAction(plan, 'signout')}>销记确认</Button>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>
      )}

      <Card title="施工执行列表">
        <Table
          columns={columns}
          dataSource={executablePlans}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="执行详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        width={700}
        footer={
          selectedPlan && (
            <Space>
              {selectedPlan.status === 'approved' && (
                <Button type="primary" onClick={() => { setDetailModal(false); handleAction(selectedPlan, 'command'); }}>
                  下达封锁命令
                </Button>
              )}
              {selectedPlan.status === 'commanded' && (
                <Button type="primary" onClick={() => { setDetailModal(false); handleAction(selectedPlan, 'signin'); }}>
                  开工签到
                </Button>
              )}
              {['signin', 'executing'].includes(selectedPlan.status) && (
                <Button type="primary" danger onClick={() => { setDetailModal(false); handleAction(selectedPlan, 'signout'); }}>
                  完工销记
                </Button>
              )}
            </Space>
          )
        }
      >
        {selectedPlan && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Tag color={statusMap[selectedPlan.status].color as any} className="text-base px-3 py-1">
                {statusMap[selectedPlan.status].label}
              </Tag>
              {selectedPlan.commandNo && (
                <Tag color="blue">
                  命令号：<code>{selectedPlan.commandNo}</code>
                </Tag>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 mb-1">项目名称</div>
                <div className="font-medium">{selectedPlan.projectName}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">施工单位</div>
                <div className="font-medium">{selectedPlan.constructionUnit}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">施工时间</div>
                <div className="font-medium">{selectedPlan.startTime} ~ {selectedPlan.endTime}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">负责人</div>
                <div className="font-medium flex items-center gap-1">
                  <Avatar size={20} icon={<User size={12} />} />
                  {selectedPlan.personInCharge} {selectedPlan.phone}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500 mb-1">施工地点</div>
                <div className="font-medium">{selectedPlan.lineSection} {selectedPlan.mileageStart} - {selectedPlan.mileageEnd}</div>
              </div>
            </div>

            {['signin', 'executing'].includes(selectedPlan.status) && (
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                  <AlertTriangle size={18} />
                  施工进度
                </div>
                <Progress 
                  percent={getTimeLeft(selectedPlan).percent} 
                  status="active"
                  strokeColor="#FF7D00"
                />
                <div className="text-sm text-orange-600 mt-2">
                  剩余 {getTimeLeft(selectedPlan).minutes} 分钟，请按时完成并销记
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-3">执行记录</h4>
              <Timeline items={timelineEvents as any} />
            </div>

            <div>
              <h4 className="font-medium mb-3">作业人员</h4>
              <div className="flex flex-wrap gap-2">
                {selectedPlan.workers.map(w => (
                  <div key={w.id} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                    <Avatar size={24} icon={<User size={14} />} />
                    <div className="text-sm">
                      <div className="font-medium">{w.name}</div>
                      <div className="text-gray-500 text-xs">{w.position}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          actionType === 'command' ? '确认下达封锁命令' :
          actionType === 'signin' ? '确认开工签到' : '确认完工销记'
        }
        open={actionModal}
        onCancel={() => setActionModal(false)}
        onOk={handleConfirmAction}
        okText="确认"
      >
        {selectedPlan && (
          <div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="font-medium mb-2">{selectedPlan.projectName}</div>
              <div className="text-sm text-gray-500 space-y-1">
                <div>施工时间：{selectedPlan.startTime} ~ {selectedPlan.endTime}</div>
                <div>施工地点：{selectedPlan.lineSection} {selectedPlan.mileageStart} - {selectedPlan.mileageEnd}</div>
                <div>负责人：{selectedPlan.personInCharge}</div>
              </div>
            </div>
            
            {actionType === 'command' && (
              <p className="text-gray-600">
                确认下达封锁命令后，施工单位方可进行现场签到。请确认调度命令已传达至相关部门。
              </p>
            )}
            {actionType === 'signin' && (
              <p className="text-gray-600">
                确认开工签到后，表示施工人员已就位，开始施工作业。请确保所有安全防护措施已落实。
              </p>
            )}
            {actionType === 'signout' && (
              <p className="text-gray-600">
                确认完工销记后，表示施工作业已完成，线路已恢复正常通行条件。请确认人员机具已撤离，现场已清理。
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ExecutionPage;
