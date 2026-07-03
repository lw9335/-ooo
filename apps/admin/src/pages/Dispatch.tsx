import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, List, Row, Select, Tag, message } from 'antd';
import { api } from '../api';

const T = {
  title: '\u667a\u80fd\u6d3e\u5355',
  orderTitle: '\u6d3e\u5355\u6807\u9898',
  brand: '\u8f66\u8f86\u54c1\u724c',
  category: '\u6545\u969c\u90e8\u4f4d',
  desc: '\u6545\u969c\u63cf\u8ff0',
  recommend: '\u667a\u80fd\u63a8\u8350\u5e08\u5085',
  candidates: '\u63a8\u8350\u5019\u9009\uff08\u6309\u5339\u914d\u5ea6\u6392\u5e8f\uff09',
  assign: '\u4e00\u952e\u6d3e\u5355',
  idle: '\u7a7a\u95f2',
  working: '\u5de5\u4f5c\u4e2d',
  score: '\u5339\u914d\u5206',
  needTitle: '\u8bf7\u586b\u5199\u6d3e\u5355\u6807\u9898',
  dispatched: '\u6d3e\u5355\u6210\u529f\uff0c\u5df2\u901a\u77e5\u5e08\u5085',
  phone: '\u7535\u8bdd',
};

export default function Dispatch() {
  const [form] = Form.useForm();
  const [cats, setCats] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    api.get('/skills/categories/flat').then((r) => setCats(r.data));
    api.get('/skills/brands').then((r) => setBrands(r.data));
  }, []);

  const doRecommend = async () => {
    const v = form.getFieldsValue();
    const { data } = await api.post('/dispatch/recommend', {
      categoryId: v.categoryId,
      brandId: v.brandId,
      limit: 10,
    });
    setList(data);
  };

  const doAssign = async (workerId: number) => {
    const v = await form.validateFields();
    const brandName = brands.find((b) => b.id === v.brandId)?.name;
    await api.post('/dispatch/orders', {
      title: v.title,
      description: v.description,
      brandName,
      categoryId: v.categoryId,
      assignedWorkerId: workerId,
    });
    message.success(T.dispatched);
    setList([]);
    form.resetFields();
  };

  return (
    <Row gutter={16}>
      <Col span={10}>
        <Card title={T.title}>
          <Form form={form} layout="vertical">
            <Form.Item name="title" label={T.orderTitle} rules={[{ required: true, message: T.needTitle }]}>
              <Input />
            </Form.Item>
            <Form.Item name="brandId" label={T.brand}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={brands.map((b) => ({ value: b.id, label: b.name }))}
              />
            </Form.Item>
            <Form.Item name="categoryId" label={T.category}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={cats.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>
            <Form.Item name="description" label={T.desc}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Button type="primary" block onClick={doRecommend}>
              {T.recommend}
            </Button>
          </Form>
        </Card>
      </Col>
      <Col span={14}>
        <Card title={T.candidates}>
          <List
            dataSource={list}
            renderItem={(item: any) => (
              <List.Item
                actions={[
                  <Button type="primary" key="a" onClick={() => doAssign(item.worker.id)}>
                    {T.assign}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <span>
                      {item.worker.name}{' '}
                      {item.worker.status === 'IDLE' ? (
                        <Tag color="green">{T.idle}</Tag>
                      ) : (
                        <Tag color="orange">{T.working}</Tag>
                      )}
                      <Tag color="blue">
                        {T.score} {item.score}
                      </Tag>
                    </span>
                  }
                  description={
                    <span>
                      {T.phone}: {item.worker.phone || '-'} | {item.reasons?.join('\uff1b')}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );
}
