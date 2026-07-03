import { Layout as AntLayout, Menu, Button, Dropdown } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  SendOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './store';

const { Header, Sider, Content } = AntLayout;

export default function Layout() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, logout } = useAuth();

  const items = [
    { key: '/', icon: <DashboardOutlined />, label: '实时调度大屏' },
    { key: '/dispatch', icon: <SendOutlined />, label: '智能派单' },
    { key: '/workers', icon: <TeamOutlined />, label: '师傅档案' },
    { key: '/orders', icon: <UnorderedListOutlined />, label: '派单记录' },
    { key: '/categories', icon: <AppstoreOutlined />, label: '部位/品牌维护' },
    ...(user?.role === 'SUPER_ADMIN'
      ? [{ key: '/admins', icon: <UserOutlined />, label: '管理员账号' }]
      : []),
  ];

  const selectedKey =
    items.find((i) => i.key !== '/' && loc.pathname.startsWith(i.key))?.key || '/';

  return (
    <AntLayout style={{ height: '100vh' }}>
      <Sider theme="dark" width={210}>
        <div
          style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            padding: '18px 16px',
            letterSpacing: 1,
          }}
        >
          汽修调度系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          onClick={({ key }) => nav(key)}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingRight: 24,
          }}
        >
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: () => {
                    logout();
                    nav('/login');
                  },
                },
              ],
            }}
          >
            <Button type="text" icon={<UserOutlined />}>
              {user?.name} ({user?.role === 'SUPER_ADMIN' ? '超管' : '调度员'})
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
