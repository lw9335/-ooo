import { useEffect, useState } from 'react';
import { Card, Table, Tag, Input, Select, Space, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const T = {
  title: '\u5e08\u5085\u6863\u6848',
  phone: '\u8054\u7cfb\u7535\u8bdd',
  name: '\u59d3\u540d',
  status: '\u72b6\u6001',
  idle: '\u7a7a\u95f2',
  working: '\u5de5\u4f5c\u4e2d',
  skills: '\u64c5\u957f\u90e8\u4f4d',
  brands: '\u64c5\u957f\u54c1\u724c',
  action: '\u64cd\u4f5c',
  detail: '\u8be6\u60c5',
  searchPh: '\u59d3\u540d/\u7535\u8bdd',
  brand: '\u54c1\u724c',
};

export default function Workers() {
  const nav = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [q, setQ] = useState<any>({});

  const load = async () => {
    const { data } = await api.get('/workers', { params: q });
    setData(data);
  };
  useEffect(() => {
    api.get('/skills/categories/flat').then((r) => setCats(r.data));
    api.get('/skills/brands').then((r) => setBrands(r.data));
  }, []);
  useEffect(() => {
    load();
  }, [JSON.stringify(q)]);

  const columns = [
    { title: T.name, dataIndex: 'name' },
    {
      title: T.phone,
      dataIndex: 'phone',
      render: (v: string) => <b style={{ color: '#1677ff' }}>{v || '-'}</b>,
    },
    {
      title: T.status,
      dataIndex: 'status',
      render: (s: string) =>
        s === 'IDLE' ? <Tag color="green">{T.idle}</Tag> : <Tag color="orange">{T.working}</Tag>,
    },
    {
      title: T.skills,
      dataIndex: 'skills',
      render: (skills: any[]) => skills?.map((s) => <Tag key={s.id}>{s.category?.name}</Tag>) || '-',
    },
    {
      title: T.brands,
      dataIndex: 'brands',
      render: (bs: any[]) => bs?.map((b) => <Tag key={b.id}>{b.brand?.name}</Tag>) || '-',
    },
    {
      title: T.action,
      render: (_: any, r: any) => (
        <Button type="link" onClick={() => nav(`/workers/${r.id}`)}>
          {T.detail}
        </Button>
      ),
    },
  ];

  return (
    <Card title={T.title}>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder={T.searchPh}
          allowClear
          onSearch={(v) => setQ({ ...q, keyword: v })}
          style={{ width: 200 }}
        />
        <Select
          placeholder={T.status}
          allowClear
          style={{ width: 120 }}
          onChange={(v) => setQ({ ...q, status: v })}
          options={[
            { value: 'IDLE', label: T.idle },
            { value: 'WORKING', label: T.working },
          ]}
        />
        <Select
          placeholder={T.skills}
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 180 }}
          onChange={(v) => setQ({ ...q, categoryId: v })}
          options={cats.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select
          placeholder={T.brand}
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 160 }}
          onChange={(v) => setQ({ ...q, brandId: v })}
          options={brands.map((b) => ({ value: b.id, label: b.name }))}
        />
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} pagination={{ pageSize: 20 }} />
    </Card>
  );
}
