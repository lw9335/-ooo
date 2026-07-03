import { useEffect, useState } from 'react';
import { Button, Cell, Checkbox, Field, Toast } from 'react-vant';
import { api } from '../api';
import { setWorkerId } from '../wework';

const T = {
  title: '\u5b8c\u5584\u4e2a\u4eba\u6863\u6848',
  name: '\u59d3\u540d',
  namePh: '\u8bf7\u8f93\u5165\u59d3\u540d',
  phone: '\u8054\u7cfb\u7535\u8bdd',
  phonePh: '\u8bf7\u8f93\u5165\u624b\u673a\u53f7',
  intro: '\u4e2a\u4eba\u7b80\u4ecb',
  introPh: '\u64c5\u957f\u7ef4\u4fee\u7684\u8f66\u578b/\u7ecf\u9a8c\u7b49',
  skills: '\u64c5\u957f\u7ef4\u4fee\u90e8\u4f4d\uff08\u53ef\u591a\u9009\uff09',
  brands: '\u64c5\u957f\u54c1\u724c\uff08\u53ef\u591a\u9009\uff09',
  save: '\u4fdd\u5b58\u6863\u6848',
  saved: '\u4fdd\u5b58\u6210\u529f',
  needName: '\u8bf7\u586b\u5199\u59d3\u540d\u548c\u7535\u8bdd',
};

export default function Profile({
  workerId,
  onSaved,
}: {
  workerId: number | null;
  onSaved: (id: number) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [intro, setIntro] = useState('');
  const [tree, setTree] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [brandIds, setBrandIds] = useState<string[]>([]);

  useEffect(() => {
    api.get('/skills/categories').then((r) => setTree(r.data));
    api.get('/skills/brands').then((r) => setBrands(r.data));
    if (workerId) {
      api.get(`/workers/${workerId}`).then((r) => {
        const w = r.data;
        setName(w.name === '\u5f85\u5b8c\u5584' ? '' : w.name || '');
        setPhone(w.phone || '');
        setIntro(w.intro || '');
        setSkillIds((w.skills || []).map((s: any) => String(s.categoryId)));
        setBrandIds((w.brands || []).map((b: any) => String(b.brandId)));
      });
    }
  }, [workerId]);

  const save = async () => {
    if (!name || !phone) {
      Toast.fail(T.needName);
      return;
    }
    const { data } = await api.post('/workers/profile', {
      id: workerId || undefined,
      name,
      phone,
      intro,
      skillCategoryIds: skillIds.map(Number),
      brandIds: brandIds.map(Number),
    });
    setWorkerId(data.id);
    onSaved(data.id);
    Toast.success(T.saved);
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <Field label={T.name} value={name} onChange={setName} placeholder={T.namePh} />
      <Field label={T.phone} value={phone} onChange={setPhone} placeholder={T.phonePh} type="tel" />
      <Field
        label={T.intro}
        value={intro}
        onChange={setIntro}
        placeholder={T.introPh}
        type="textarea"
        rows={2}
      />

      <Cell title={T.skills} />
      <Checkbox.Group value={skillIds} onChange={(v) => setSkillIds(v as string[])}>
        {tree.map((root) => (
          <div key={root.id} style={{ padding: '4px 16px' }}>
            <div style={{ color: '#888', fontSize: 13, margin: '6px 0' }}>{root.name}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {(root.children || []).map((c: any) => (
                <Checkbox key={c.id} name={String(c.id)} shape="square">
                  {c.name}
                </Checkbox>
              ))}
            </div>
          </div>
        ))}
      </Checkbox.Group>

      <Cell title={T.brands} />
      <div style={{ padding: '4px 16px' }}>
        <Checkbox.Group value={brandIds} onChange={(v) => setBrandIds(v as string[])}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {brands.map((b) => (
              <Checkbox key={b.id} name={String(b.id)} shape="square">
                {b.name}
              </Checkbox>
            ))}
          </div>
        </Checkbox.Group>
      </div>

      <div style={{ padding: 16 }}>
        <Button block type="primary" onClick={save}>
          {T.save}
        </Button>
      </div>
    </div>
  );
}
