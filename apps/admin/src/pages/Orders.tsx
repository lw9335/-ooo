import { useEffect, useState } from 'react';
import { Card, Table, Tag } from 'antd';
import { api } from '../api';

const STATUS: Record<string, { c: string; t: string }> = {
  PENDING: { c: 'default', t: '待派' },
  ASSIGNED: { c: 'blue', t: '已派单' },
  IN_PROGRESS: { c: 'orange', t: '进行中' },
  COMPLETED: { c: 'green', t: '已完成' },
  CANCELLED: { c: 'red', t: '已取消' },
};

export default function Orders() {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    api.get('/dispatch/orders').then((r) => setData(r.data));
  }, []);

  const columns = [
    { title: '单号', dataIndex: 'orderNo' },
    { title: '标题', dataIndex: 'title' },
    { title: '品牌', dataIndex: 'brandName' },
    { title: '部位', dataIndex: ['category', 'name'] },
    { title: '师傅', dataIndex: ['assignedWorker', 'name'] },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => <Tag color={STATUS[s]?.c}>{STATUS[s]?.t || s}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <Card title="派单记录">
      <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 20 }} />
    </Card>
  );
}
