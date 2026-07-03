import { useEffect, useState } from 'react';
import { Card, Col, Row, Tag, Tree } from 'antd';
import { api } from '../api';

export default function Categories() {
  const [tree, setTree] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    api.get('/skills/categories').then((r) => setTree(r.data));
    api.get('/skills/brands').then((r) => setBrands(r.data));
  }, []);

  const treeData = tree.map((root) => ({
    title: root.name,
    key: `r-${root.id}`,
    children: (root.children || []).map((c: any) => ({ title: c.name, key: `c-${c.id}` })),
  }));

  const brandGroups: Record<string, string> = {
    TRUCK: '传统重卡',
    NEW_ENERGY: '新能源重卡',
    BATTERY: '电池/三电',
  };
  const grouped = brands.reduce((acc: any, b) => {
    (acc[b.type] = acc[b.type] || []).push(b);
    return acc;
  }, {});

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Card title="维修部位分类">
          <Tree treeData={treeData} defaultExpandAll selectable={false} />
        </Card>
      </Col>
      <Col span={12}>
        <Card title="品牌标签">
          {Object.keys(brandGroups).map((k) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <div style={{ color: '#888', marginBottom: 6 }}>{brandGroups[k]}</div>
              {(grouped[k] || []).map((b: any) => (
                <Tag key={b.id} color={k === 'BATTERY' ? 'geekblue' : k === 'NEW_ENERGY' ? 'green' : 'default'}>
                  {b.name}
                </Tag>
              ))}
            </div>
          ))}
        </Card>
      </Col>
    </Row>
  );
}
