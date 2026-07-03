import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Tabbar, Loading } from 'react-vant';
import { resolveWorkerId } from './wework';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Notifications from './pages/Notifications';

const T = {
  home: '\u6211\u7684',
  orders: '\u6d3e\u5355',
  notify: '\u901a\u77e5',
  profile: '\u6863\u6848',
  loading: '\u52a0\u8f7d\u4e2d...',
};

export default function App() {
  const nav = useNavigate();
  const loc = useLocation();
  const [workerId, setWorkerId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    resolveWorkerId().then((id) => {
      setWorkerId(id);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 120 }}>
        <Loading>{T.loading}</Loading>
      </div>
    );
  }

  const tabs = ['/', '/orders', '/notifications', '/profile'];
  const active =
    tabs.find((p) => (p === '/' ? loc.pathname === '/' : loc.pathname.startsWith(p))) || '/';

  return (
    <div className="page">
      <Routes>
        <Route path="/" element={<Home workerId={workerId} />} />
        <Route path="/profile" element={<Profile workerId={workerId} onSaved={setWorkerId} />} />
        <Route path="/orders" element={<Orders workerId={workerId} />} />
        <Route path="/notifications" element={<Notifications workerId={workerId} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Tabbar value={active} onChange={(v) => nav(String(v))} fixed>
        <Tabbar.Item name="/">{T.home}</Tabbar.Item>
        <Tabbar.Item name="/orders">{T.orders}</Tabbar.Item>
        <Tabbar.Item name="/notifications">{T.notify}</Tabbar.Item>
        <Tabbar.Item name="/profile">{T.profile}</Tabbar.Item>
      </Tabbar>
    </div>
  );
}
