import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd';
import {
  Calendar,
  FileText,
  CheckSquare,
  PlayCircle,
  Shield,
  RefreshCw,
  Archive,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Train,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <Calendar size={18} />, label: '计划日历' },
  { key: '/application', icon: <FileText size={18} />, label: '申请填报' },
  { key: '/approval', icon: <CheckSquare size={18} />, label: '审批流转' },
  { key: '/execution', icon: <PlayCircle size={18} />, label: '现场执行' },
  { key: '/safety', icon: <Shield size={18} />, label: '安全防护' },
  { key: '/change', icon: <RefreshCw size={18} />, label: '变更管理' },
  { key: '/archive', icon: <Archive size={18} />, label: '资料归档' },
];

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const userMenu = {
    items: [
      { key: 'profile', icon: <User size={16} />, label: '个人中心' },
      { key: 'settings', icon: <Settings size={16} />, label: '系统设置' },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogOut size={16} />, label: '退出登录' },
    ],
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        width={240}
        className="border-r border-gray-100 shadow-sm"
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Train size={20} className="text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg text-gray-800">天窗管理系统</span>
            )}
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="border-r-0 pt-2"
        />
      </Sider>
      <Layout>
        <Header className="bg-white border-b border-gray-100 px-6 flex items-center justify-between h-16">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {menuItems.find(item => item.key === location.pathname)?.label || '系统首页'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Badge count={3} size="small">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell size={20} className="text-gray-600" />
              </button>
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
                <Avatar size={32} className="bg-blue-500">
                  <User size={18} />
                </Avatar>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-800">管理员</div>
                  <div className="text-xs text-gray-500">系统管理员</div>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="bg-gray-50 p-6 overflow-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
