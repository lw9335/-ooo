import { Button, Card, Form, Input, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../store';

export default function Login() {
  const nav = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      const { data } = await api.post('/auth/login', values);
      setAuth(data.token, data.user);
      message.success('登录成功');
      nav('/');
    } catch (e: any) {
      message.error(e.response?.data?.message || '登录失败');
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#1677ff22,#1677ff08)',
      }}
    >
      <Card style={{ width: 380, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 8 }}>汽修人员调度系统</h2>
        <p style={{ textAlign: 'center', color: '#888', marginTop: 0 }}>管理员登录</p>
        <Form onFinish={onFinish} initialValues={{ username: 'admin', password: '' }}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined />} placeholder="账号" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large">
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
