import { useEffect, useState } from 'react';
import { Cell, Button, Tag, Toast } from 'react-vant';
import { useNavigate } from 'react-router-dom';
import { api, Worker } from '../api';

const T = {
  title: '\u6211\u7684\u72b6\u6001',
  idle: '\u7a7a\u95f2',
  working: '\u5de5\u4f5c\u4e2d',
  setWorking: '\u5f00\u59cb\u5de5\u4f5c\uff08\u8f6c\u5de5\u4f5c\u4e2d\uff09',
  setIdle: '\u6536\u5de5\uff08\u8f6c\u7a7a\u95f2\uff09',
  workingFor: '\u5df2\u5de5\u4f5c',
  hint5h: '\u63d0\u793a\uff1a\u5de5\u4f5c\u4e2d\u6ee1 5 \u5c0f\u65f6\u5c06\u81ea\u52a8\u8f6c\u4e3a\u7a7a\u95f2',
  noProfile: '\u8bf7\u5148\u5b8c\u5584\u4e2a\u4eba\u6863\u6848',
  goProfile: '\u53bb\u5b8c\u5584\u6863\u6848',
  name: '\u59d3\u540d',
  phone: '\u7535\u8bdd',
  hours: '\u5c0f\u65f6',
  minutes: '\u5206\u949f',
};

export default function Home({ workerId }: { workerId: number | null }) {
  const nav = useNavigate();
  const [w, setW] = useState<Worker | null>(null);

  const load = () => {
    if (workerId) api.get(`/workers/${workerId}`).then((r) => setW(r.data));
  };
  useEffect(load, [workerId]);

  if (!workerId) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>{T.noProfile}</p>
        <Button type="primary" onClick={() => nav('/profile')}>
          {T.goProfile}
        </Button>
      </div>
    );
  }
  if (!w) return null;

  if (!w.profileFilled) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>{T.noProfile}</p>
        <Button type="primary" onClick={() => nav('/profile')}>
          {T.goProfile}
        </Button>
      </div>
    );
  }

  const toggle = async () => {
    const next = w.status === 'IDLE' ? 'WORKING' : 'IDLE';
    await api.patch(`/workers/${workerId}/status`, { status: next });
    Toast.success(next === 'WORKING' ? T.working : T.idle);
    load();
  };

  let durationText = '';
  if (w.status === 'WORKING' && w.workingSince) {
    const ms = Date.now() - new Date(w.workingSince).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    durationText = `${T.workingFor} ${h} ${T.hours} ${m} ${T.minutes}`;
  }

  return (
    <div>
      <Cell title={T.name} value={w.name} />
      <Cell title={T.phone} value={w.phone} />
      <Cell
        title={T.title}
        value={
          w.status === 'IDLE' ? (
            <Tag type="success">{T.idle}</Tag>
          ) : (
            <Tag color="#fa8c16">{T.working}</Tag>
          )
        }
      />
      {durationText && <Cell title={durationText} />}
      <div style={{ padding: 16 }}>
        <Button
          block
          type={w.status === 'IDLE' ? 'primary' : 'default'}
          onClick={toggle}
        >
          {w.status === 'IDLE' ? T.setWorking : T.setIdle}
        </Button>
        <p style={{ color: '#999', fontSize: 12, marginTop: 12 }}>{T.hint5h}</p>
      </div>
    </div>
  );
}
