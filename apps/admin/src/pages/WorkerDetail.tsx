import { useEffect, useState } from 'react';
import { Card, Descriptions, Tag, Button, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

const T = {
  title: '\u5e08\u5085\u8be6\u60c5',
  back: '\u8fd4\u56de',
  name: '\u59d3\u540d',
  phone: '\u8054\u7cfb\u7535\u8bdd',
  status: '\u72b6\u6001',
  idle: '\u7a7a\u95f2',
  working: '\u5de5\u4f5c\u4e2d',
  skills: '\u64c5\u957f\u90e8\u4f4d',
  brands: '\u64c5\u957f\u54c1\u724c',
  intro: '\u7b80\u4ecb',
  totalOrders: '\u7d2f\u8ba1\u63a5\u5355',
};

export default function WorkerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [w, setW] = useState<any>(null);

  useEffect(() => {
    api.get(`/workers/${id}`).then((r) => setW(r.data));
  }, [id]);

  if (!w) return null;

  return (
    <Card
      title={T.title}
      extra={
        <Button onClick={() => nav(-1)}>{T.back}</Button>
      }
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label={T.name}>{w.name}</Descriptions.Item>
        <Descriptions.Item label={T.phone}>
          <b style={{ color: '#1677ff', fontSize: 16 }}>{w.phone || '-'}</b>
        </Descriptions.Item>
        <Descriptions.Item label={T.status}>
          {w.status === 'IDLE' ? (
            <Tag color="green">{T.idle}</Tag>
          ) : (
            <Tag color="orange">{T.working}</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label={T.totalOrders}>{w.totalOrders}</Descriptions.Item>
        <Descriptions.Item label={T.skills} span={2}>
          <Space wrap>
            {w.skills?.map((s: any) => <Tag key={s.id}>{s.category?.name}</Tag>)}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label={T.brands} span={2}>
          <Space wrap>
            {w.brands?.map((b: any) => (
              <Tag key={b.id} color="blue">
                {b.brand?.name}
              </Tag>
            ))}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label={T.intro} span={2}>
          {w.intro || '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
