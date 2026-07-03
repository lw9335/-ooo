import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Modal, Select, Table, Tag, message } from 'antd';
import { api } from '../api';

const T = {
  title: '\u7ba1\u7406\u5458\u8d26\u53f7',
  add: '\u65b0\u589e\u7ba1\u7406\u5458',
  username: '\u8d26\u53f7',
  name: '\u59d3\u540d',
  password: '\u5bc6\u7801',
  role: '\u89d2\u8272',
  status: '\u72b6\u6001',
  superAdmin: '\u8d85\u7ba1',
  dispatcher: '\u8c03\u5ea6\u5458',
  superAdminFull: '\u8d85\u7ea7\u7ba1\u7406\u5458',
  enabled: '\u542f\u7528',
  disabled: '\u505c\u7528',
  created: '\u5df2\u521b\u5efa',
  createFail: '\u521b\u5efa\u5931\u8d25',
};

export default function AdminUsers() {
  const [data, setData] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => api.get('/admin-users').then((r) => setData(r.data));
  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    const v = await form.validateFields();
    try {
      await api.post('/admin-users', v);
      message.success(T.created);
      setOpen(false);
      form.resetFields();
      load();
    } catch (e: any) {
      message.error(e.response?.data?.message || T.createFail);
    }
  };

  const columns = [
    { title: T.username, dataIndex: 'username' },
    { title: T.name, dataIndex: 'name' },
    {
      title: T.role,
      dataIndex: 'role',
      render: (r: string) =>
        r === 'SUPER_ADMIN' ? <Tag color="red">{T.superAdmin}</Tag> : <Tag>{T.dispatcher}</Tag>,
    },
    {
      title: T.status,
      dataIndex: 'active',
      render: (a: boolean) => (a ? <Tag color="green">{T.enabled}</Tag> : <Tag>{T.disabled}</Tag>),
    },
  ];

  return (
    <Card
      title={T.title}
      extra={
        <Button type="primary" onClick={() => setOpen(true)}>
          {T.add}
        </Button>
      }
    >
      <Table rowKey="id" columns={columns} dataSource={data} pagination={false} />
      <Modal open={open} title={T.add} onOk={submit} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="username" label={T.username} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label={T.password} rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="name" label={T.name} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label={T.role} initialValue="DISPATCHER">
            <Select
              options={[
                { value: 'DISPATCHER', label: T.dispatcher },
                { value: 'SUPER_ADMIN', label: T.superAdminFull },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
