import { useEffect, useState } from 'react';
import { Cell, Empty, Button } from 'react-vant';
import { api } from '../api';

const T = {
  empty: '\u6682\u65e0\u901a\u77e5',
  readAll: '\u5168\u90e8\u5df2\u8bfb',
};

export default function Notifications({ workerId }: { workerId: number | null }) {
  const [list, setList] = useState<any[]>([]);

  const load = () => {
    if (workerId) api.get('/notifications', { params: { workerId } }).then((r) => setList(r.data));
  };
  useEffect(load, [workerId]);

  const readAll = async () => {
    await api.post('/notifications/read-all', null, { params: { workerId } });
    load();
  };

  if (!list.length) return <Empty description={T.empty} />;

  return (
    <div>
      <div style={{ padding: 12, textAlign: 'right' }}>
        <Button size="small" onClick={readAll}>
          {T.readAll}
        </Button>
      </div>
      {list.map((n) => (
        <Cell
          key={n.id}
          title={n.title}
          label={`${n.content}\n${new Date(n.createdAt).toLocaleString()}`}
          style={{ opacity: n.read ? 0.6 : 1, whiteSpace: 'pre-line' }}
        />
      ))}
    </div>
  );
}
