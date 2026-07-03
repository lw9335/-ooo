import { useEffect, useState } from 'react';
import { Button, Cell, Empty, Tag, Toast } from 'react-vant';
import { api } from '../api';

const T = {
  empty: '\u6682\u65e0\u6d3e\u5355',
  brand: '\u54c1\u724c',
  part: '\u90e8\u4f4d',
  accept: '\u63a5\u5355',
  complete: '\u5b8c\u6210',
  assigned: '\u5f85\u63a5\u5355',
  inProgress: '\u8fdb\u884c\u4e2d',
  completed: '\u5df2\u5b8c\u6210',
  accepted: '\u5df2\u63a5\u5355',
  done: '\u5df2\u5b8c\u6210',
};

const STATUS: Record<string, string> = {
  ASSIGNED: T.assigned,
  IN_PROGRESS: T.inProgress,
  COMPLETED: T.completed,
};

export default function Orders({ workerId }: { workerId: number | null }) {
  const [list, setList] = useState<any[]>([]);

  const load = () => {
    if (workerId) api.get('/dispatch/orders', { params: { workerId } }).then((r) => setList(r.data));
  };
  useEffect(load, [workerId]);

  const accept = async (id: number) => {
    await api.post(`/dispatch/orders/${id}/accept`, { workerId });
    Toast.success(T.accepted);
    load();
  };
  const complete = async (id: number) => {
    await api.post(`/dispatch/orders/${id}/complete`, { workerId });
    Toast.success(T.done);
    load();
  };

  if (!list.length) return <Empty description={T.empty} />;

  return (
    <div style={{ padding: 12 }}>
      {list.map((o) => (
        <div
          key={o.id}
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {o.title}{' '}
            <Tag type="primary" style={{ marginLeft: 8 }}>
              {STATUS[o.status] || o.status}
            </Tag>
          </div>
          <Cell title={T.brand} value={o.brandName || '-'} />
          <Cell title={T.part} value={o.category?.name || '-'} />
          {o.description && <Cell title="" label={o.description} />}
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            {o.status === 'ASSIGNED' && (
              <Button size="small" type="primary" onClick={() => accept(o.id)}>
                {T.accept}
              </Button>
            )}
            {o.status === 'IN_PROGRESS' && (
              <Button size="small" type="success" onClick={() => complete(o.id)}>
                {T.complete}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
