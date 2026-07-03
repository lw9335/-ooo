import { api } from './api';

/**
 * 企业微信免登：
 * 1. 若 URL 带 code，用 code 换 userid 并找到/创建师傅，返回 workerId
 * 2. 未配置企业微信或无 code 时，回退到本地缓存的 workerId（便于开发调试）
 *
 * 生产环境应在企业微信内通过 OAuth 跳转带上 code。
 */
export async function resolveWorkerId(): Promise<number | null> {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');

  if (code) {
    try {
      const { data } = await api.post('/workers/wework-login', { code });
      if (data.worker?.id) {
        localStorage.setItem('workerId', String(data.worker.id));
        return data.worker.id;
      }
    } catch {
      // 忽略，走本地回退
    }
  }

  const cached = localStorage.getItem('workerId');
  return cached ? Number(cached) : null;
}

export function setWorkerId(id: number) {
  localStorage.setItem('workerId', String(id));
}
