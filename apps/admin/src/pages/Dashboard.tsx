import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Progress } from 'antd';
import ReactECharts from 'echarts-for-react';
import { api } from '../api';
import { getSocket } from '../socket';

const T = {
  idle: '\u7a7a\u95f2\u5e08\u5085',
  working: '\u5de5\u4f5c\u4e2d',
  pending: '\u5f85\u6d3e\u5355',
  doneToday: '\u4eca\u65e5\u5b8c\u6210',
  saturation: '\u4eba\u529b\u9971\u548c\u5ea6',
  skillDist: '\u64c5\u957f\u90e8\u4f4d\u5206\u5e03',
  orderTrend: '\u8fd1 7 \u5929\u6d3e\u5355\u8d8b\u52bf',
  workingOf: '\u5de5\u4f5c\u4e2d',
  total: '\u603b',
};

export default function Dashboard() {
  const [dash, setDash] = useState<any>(null);
  const [dist, setDist] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);

  const load = async () => {
    const [d, s, t] = await Promise.all([
      api.get('/stats/dashboard'),
      api.get('/stats/skill-distribution'),
      api.get('/stats/order-trend'),
    ]);
    setDash(d.data);
    setDist(s.data);
    setTrend(t.data);
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    const refresh = () => load();
    const events = ['worker:status', 'worker:updated', 'order:created', 'order:updated'];
    events.forEach((e) => socket.on(e, refresh));
    const timer = setInterval(load, 30000);
    return () => {
      events.forEach((e) => socket.off(e, refresh));
      clearInterval(timer);
    };
  }, []);

  const pieOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, type: 'scroll' },
    series: [
      {
        name: T.skillDist,
        type: 'pie',
        radius: ['40%', '68%'],
        data: dist.map((d) => ({ name: d.name, value: d.count })),
      },
    ],
  };

  const barOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: trend.map((t) => t.date) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{ name: T.orderTrend, type: 'bar', data: trend.map((t) => t.count) }],
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
  };

  const stat = (title: string, value: number, color: string, suffix?: string) => (
    <Col span={6}>
      <Card>
        <Statistic title={title} value={value} valueStyle={{ color }} suffix={suffix} />
      </Card>
    </Col>
  );

  return (
    <div>
      <Row gutter={16}>
        {stat(T.idle, dash?.workers.idle ?? 0, '#52c41a', `/ ${dash?.workers.total ?? 0}`)}
        {stat(T.working, dash?.workers.working ?? 0, '#fa8c16')}
        {stat(T.pending, dash?.orders.pending ?? 0, '#f5222d')}
        {stat(T.doneToday, dash?.orders.completedToday ?? 0, '#1677ff')}
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card title={T.saturation}>
            <Progress type="dashboard" percent={dash?.saturation ?? 0} />
            <p style={{ textAlign: 'center', color: '#888' }}>
              {T.workingOf} {dash?.workers.working ?? 0} / {T.total} {dash?.workers.total ?? 0}
            </p>
          </Card>
        </Col>
        <Col span={16}>
          <Card title={T.skillDist}>
            <ReactECharts option={pieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title={T.orderTrend}>
            <ReactECharts option={barOption} style={{ height: 260 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
