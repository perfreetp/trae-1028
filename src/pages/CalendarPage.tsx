import { useState, useMemo } from 'react';
import { Card, Badge, Select, DatePicker, Space, Tooltip, List, Tag, Modal, Statistic, Row, Col } from 'antd';
import { Clock, MapPin, AlertTriangle, Eye, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { useAppStore } from '../store/useAppStore';
import { statusMap } from '../types';
import type { SkyPlan } from '../types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const CalendarPage = () => {
  const { plans, setSelectedPlan } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    lineSection: undefined as string | undefined,
    station: undefined as string | undefined,
    constructionType: undefined as string | undefined,
  });

  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      if (filters.lineSection && p.lineSection !== filters.lineSection) return false;
      if (filters.station && !p.affectedStations.includes(filters.station)) return false;
      if (filters.constructionType && p.constructionType !== filters.constructionType) return false;
      return true;
    });
  }, [plans, filters]);

  const monthDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDay = startOfMonth.startOf('week');
    const endDay = endOfMonth.endOf('week');
    
    const days: Dayjs[] = [];
    let day = startDay;
    while (day.isBefore(endDay) || day.isSame(endDay, 'day')) {
      days.push(day);
      day = day.add(1, 'day');
    }
    return days;
  }, [currentMonth]);

  const getPlansForDate = (date: Dayjs) => {
    return filteredPlans.filter(p => dayjs(p.startTime).isSame(date, 'day'));
  };

  const getPlanColor = (plan: SkyPlan) => {
    if (plan.hasConflict) return 'bg-red-500';
    switch (plan.status) {
      case 'approved':
      case 'commanded':
        return 'bg-blue-500';
      case 'signin':
      case 'executing':
        return 'bg-orange-500';
      case 'completed':
      case 'signout':
      case 'archived':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-gray-400';
      default:
        return 'bg-yellow-500';
    }
  };

  const stats = useMemo(() => {
    const monthPlans = filteredPlans.filter(p => dayjs(p.startTime).isSame(currentMonth, 'month'));
    return {
      total: monthPlans.length,
      pending: monthPlans.filter(p => ['pending', 'approved1'].includes(p.status)).length,
      executing: monthPlans.filter(p => ['signin', 'executing'].includes(p.status)).length,
      completed: monthPlans.filter(p => ['completed', 'signout', 'archived'].includes(p.status)).length,
      conflict: monthPlans.filter(p => p.hasConflict).length,
    };
  }, [filteredPlans, currentMonth]);

  const weekDays = useMemo(() => {
    const startOfWeek = currentMonth.startOf('week');
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
  }, [currentMonth]);

  const handlePlanClick = (plan: SkyPlan) => {
    setSelectedPlan(plan);
    setDetailModal(true);
  };

  const selectedPlan = useAppStore(state => state.selectedPlan);

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col span={4}>
          <Card className="text-center">
            <Statistic title="本月计划总数" value={stats.total} prefix={<CalendarIcon size={18} />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="text-center">
            <Statistic title="待审批" value={stats.pending} valueStyle={{ color: '#FAAD14' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="text-center">
            <Statistic title="进行中" value={stats.executing} valueStyle={{ color: '#FF7D00' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="text-center">
            <Statistic title="已完成" value={stats.completed} valueStyle={{ color: '#00B42A' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="text-center">
            <Statistic title="冲突预警" value={stats.conflict} valueStyle={{ color: '#F53F3F' }} prefix={<AlertTriangle size={18} />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card className="text-center">
            <Statistic 
              title="兑现率" 
              value={stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0} 
              suffix="%"
              valueStyle={{ color: '#165DFF' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentMonth(currentMonth.subtract(1, viewMode === 'week' ? 'week' : 'month'))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-xl font-semibold min-w-[200px] text-center">
              {viewMode === 'month' ? currentMonth.format('YYYY年MM月') : `${weekDays[0].format('MM月DD日')} - ${weekDays[6].format('MM月DD日')}`}
            </h3>
            <button
              onClick={() => setCurrentMonth(currentMonth.add(1, viewMode === 'week' ? 'week' : 'month'))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={() => setCurrentMonth(dayjs())}
              className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              今天
            </button>
          </div>
          <Space wrap>
            <Select
              placeholder="选择线路"
              style={{ width: 150 }}
              allowClear
              onChange={(v) => setFilters(f => ({ ...f, lineSection: v }))}
            >
              <Option value="京沪线">京沪线</Option>
              <Option value="京广线">京广线</Option>
              <Option value="京哈线">京哈线</Option>
              <Option value="陇海线">陇海线</Option>
              <Option value="沪昆线">沪昆线</Option>
              <Option value="京九线">京九线</Option>
            </Select>
            <Select
              placeholder="选择车站"
              style={{ width: 150 }}
              allowClear
              onChange={(v) => setFilters(f => ({ ...f, station: v }))}
            >
              <Option value="北京站">北京站</Option>
              <Option value="天津站">天津站</Option>
              <Option value="济南站">济南站</Option>
              <Option value="上海站">上海站</Option>
              <Option value="广州站">广州站</Option>
            </Select>
            <Select
              placeholder="施工类型"
              style={{ width: 150 }}
              allowClear
              onChange={(v) => setFilters(f => ({ ...f, constructionType: v }))}
            >
              <Option value="线路维修">线路维修</Option>
              <Option value="接触网检修">接触网检修</Option>
              <Option value="信号设备检修">信号设备检修</Option>
              <Option value="桥梁施工">桥梁施工</Option>
            </Select>
            <Select
              value={viewMode}
              style={{ width: 120 }}
              onChange={setViewMode}
            >
              <Option value="month">月视图</Option>
              <Option value="week">周视图</Option>
            </Select>
          </Space>
        </div>

        {viewMode === 'month' ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(day => (
                <div key={day} className="py-3 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((date, index) => {
                const dayPlans = getPlansForDate(date);
                const isCurrentMonth = date.isSame(currentMonth, 'month');
                const isToday = date.isSame(dayjs(), 'day');
                
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] border-b border-r border-gray-100 p-2 cursor-pointer hover:bg-blue-50/50 transition-colors ${
                      !isCurrentMonth ? 'bg-gray-50/50' : ''
                    } ${isToday ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className={`text-sm mb-2 ${
                      isToday ? 'inline-flex items-center justify-center w-7 h-7 bg-blue-500 text-white rounded-full font-medium' :
                      isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                      {date.date()}
                    </div>
                    <div className="space-y-1">
                      {dayPlans.slice(0, 3).map(plan => (
                        <Tooltip key={plan.id} title={`${plan.projectName} - ${plan.constructionUnit}`}>
                          <div
                            className={`${getPlanColor(plan)} text-white text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-90 transition-opacity`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlanClick(plan);
                            }}
                          >
                            {dayjs(plan.startTime).format('HH:mm')} {plan.projectName.substring(0, 8)}
                          </div>
                        </Tooltip>
                      ))}
                      {dayPlans.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayPlans.length - 3} 更多
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200">
              <div className="py-3 text-center text-sm font-medium text-gray-600 border-r border-gray-200">时间</div>
              {weekDays.map(day => (
                <div key={day.toString()} className={`py-3 text-center ${day.isSame(dayjs(), 'day') ? 'bg-blue-50' : ''}`}>
                  <div className="text-sm font-medium text-gray-600">{day.format('ddd')}</div>
                  <div className={`text-lg font-semibold ${day.isSame(dayjs(), 'day') ? 'text-blue-500' : 'text-gray-800'}`}>
                    {day.date()}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-8">
              {Array.from({ length: 24 }, (_, hour) => (
                <>
                  <div key={`time-${hour}`} className="border-b border-r border-gray-100 p-2 text-xs text-gray-500 text-center">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  {weekDays.map(day => {
                    const hourPlans = getPlansForDate(day).filter(p => {
                      const startHour = dayjs(p.startTime).hour();
                      const endHour = dayjs(p.endTime).hour();
                      return hour >= startHour && hour < endHour;
                    });
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className="border-b border-r border-gray-100 p-1 min-h-[50px] hover:bg-gray-50 transition-colors"
                      >
                        {hourPlans.slice(0, 1).map(plan => (
                          <Tooltip key={plan.id} title={plan.projectName}>
                            <div
                              className={`${getPlanColor(plan)} text-white text-xs px-1 py-0.5 rounded truncate cursor-pointer`}
                              onClick={() => handlePlanClick(plan)}
                            >
                              {plan.projectName.substring(0, 6)}
                            </div>
                          </Tooltip>
                        ))}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-blue-500"></span>
            <span className="text-sm text-gray-600">已审批</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-orange-500"></span>
            <span className="text-sm text-gray-600">进行中</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-green-500"></span>
            <span className="text-sm text-gray-600">已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-yellow-500"></span>
            <span className="text-sm text-gray-600">待审批</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-red-500"></span>
            <span className="text-sm text-gray-600">有冲突</span>
          </div>
        </div>
      </Card>

      {selectedDate && (
        <Card title={`${selectedDate.format('YYYY年MM月DD日')} 天窗计划`}>
          <List
            dataSource={getPlansForDate(selectedDate)}
            renderItem={plan => (
              <List.Item
                actions={[
                  <a key="view" onClick={() => handlePlanClick(plan)}>
                    <Eye size={16} className="inline mr-1" /> 查看详情
                  </a>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center gap-2">
                      {plan.hasConflict && <Badge status="error" text="冲突" />}
                      <Tag color={statusMap[plan.status].color as any}>{statusMap[plan.status].label}</Tag>
                      <span className="font-medium">{plan.projectName}</span>
                    </div>
                  }
                  description={
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {dayjs(plan.startTime).format('HH:mm')} - {dayjs(plan.endTime).format('HH:mm')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {plan.lineSection} {plan.mileageStart}-{plan.mileageEnd}
                      </span>
                      <span>施工单位：{plan.constructionUnit}</span>
                      <span>负责人：{plan.personInCharge}</span>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Modal
        title="天窗计划详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        width={700}
        footer={null}
      >
        {selectedPlan && (
          <div className="space-y-4">
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
                <div className="text-gray-500 mb-1">线路区间</div>
                <div className="font-medium">{selectedPlan.lineSection}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">里程范围</div>
                <div className="font-medium">{selectedPlan.mileageStart} - {selectedPlan.mileageEnd}</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500 mb-1">影响车站</div>
                <div className="flex flex-wrap gap-1">
                  {selectedPlan.affectedStations.map(s => <Tag key={s}>{s}</Tag>)}
                </div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">开始时间</div>
                <div className="font-medium">{selectedPlan.startTime}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">结束时间</div>
                <div className="font-medium">{selectedPlan.endTime}</div>
              </div>
              {selectedPlan.commandNo && (
                <div>
                  <div className="text-gray-500 mb-1">封锁命令号</div>
                  <div className="font-medium font-mono">{selectedPlan.commandNo}</div>
                </div>
              )}
            </div>

            <div>
              <div className="text-gray-500 mb-2">作业人员（{selectedPlan.workers.length}人）</div>
              <div className="bg-gray-50 rounded-lg p-3">
                {selectedPlan.workers.map(w => (
                  <div key={w.id} className="flex justify-between text-sm py-1">
                    <span>{w.name} - {w.position}</span>
                    <span className="text-gray-500">{w.phone}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-gray-500 mb-2">施工机具</div>
              <div className="bg-gray-50 rounded-lg p-3">
                {selectedPlan.machines.map(m => (
                  <div key={m.id} className="flex justify-between text-sm py-1">
                    <span>{m.name} ({m.model}) × {m.quantity}</span>
                    <span className="text-gray-500">检查人：{m.inspector}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-gray-500 mb-2">安全风险措施</div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm whitespace-pre-line">
                {selectedPlan.riskMeasures}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CalendarPage;
