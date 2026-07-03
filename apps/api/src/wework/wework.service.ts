import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { createHash } from 'crypto';
import { RedisService } from '../redis/redis.service';

const WEWORK_API = 'https://qyapi.weixin.qq.com/cgi-bin';

/**
 * 企业微信自建应用封装。
 * 未配置 corpid/secret 时，所有方法安全降级（不抛错、返回占位），
 * 便于在企业微信联调前先跑通其它功能。
 */
@Injectable()
export class WeworkService {
  private readonly corpId = process.env.WEWORK_CORP_ID || '';
  private readonly agentId = process.env.WEWORK_AGENT_ID || '';
  private readonly secret = process.env.WEWORK_SECRET || '';

  constructor(private readonly redis: RedisService) {}

  get configured(): boolean {
    return Boolean(this.corpId && this.secret && this.agentId);
  }

  /** 获取并缓存 access_token（企业微信 token 有效期 7200s） */
  private async getAccessToken(): Promise<string | null> {
    if (!this.configured) return null;
    const cacheKey = 'wework:access_token';
    const cached = await this.redis.client.get(cacheKey);
    if (cached) return cached;

    const { data } = await axios.get(`${WEWORK_API}/gettoken`, {
      params: { corpid: this.corpId, corpsecret: this.secret },
    });
    if (data.errcode !== 0) {
      // eslint-disable-next-line no-console
      console.error('[WeWork] 获取 token 失败:', data);
      return null;
    }
    const token = data.access_token as string;
    const ttl = Math.max((data.expires_in || 7200) - 200, 60);
    await this.redis.client.set(cacheKey, token, 'EX', ttl);
    return token;
  }

  /** 免登：用 code 换取企业微信 userid */
  async getUserIdByCode(code: string): Promise<string | null> {
    const token = await this.getAccessToken();
    if (!token) return null;
    const { data } = await axios.get(`${WEWORK_API}/auth/getuserinfo`, {
      params: { access_token: token, code },
    });
    if (data.errcode !== 0) {
      // eslint-disable-next-line no-console
      console.error('[WeWork] 免登失败:', data);
      return null;
    }
    return data.userid || data.UserId || null;
  }

  /** 发送应用文本卡片消息给指定 userid */
  async sendTextCard(
    weworkUserId: string,
    title: string,
    description: string,
    url?: string,
  ): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return false;
    const { data } = await axios.post(
      `${WEWORK_API}/message/send?access_token=${token}`,
      {
        touser: weworkUserId,
        msgtype: 'textcard',
        agentid: Number(this.agentId),
        textcard: {
          title,
          description,
          url: url || process.env.MOBILE_BASE_URL || '',
          btntxt: '查看详情',
        },
      },
    );
    if (data.errcode !== 0) {
      // eslint-disable-next-line no-console
      console.error('[WeWork] 消息发送失败:', data);
      return false;
    }
    return true;
  }

  /** JS-SDK 签名（用于移动端 wx.config） */
  async getJsSdkSignature(url: string): Promise<{
    corpId: string;
    agentId: string;
    timestamp: number;
    nonceStr: string;
    signature: string;
    configured: boolean;
  } | null> {
    if (!this.configured) {
      return { corpId: '', agentId: '', timestamp: 0, nonceStr: '', signature: '', configured: false };
    }
    const ticket = await this.getJsapiTicket();
    if (!ticket) return null;
    const nonceStr = Math.random().toString(36).slice(2);
    const timestamp = Math.floor(Date.now() / 1000);
    const raw = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
    const signature = createHash('sha1').update(raw).digest('hex');
    return {
      corpId: this.corpId,
      agentId: this.agentId,
      timestamp,
      nonceStr,
      signature,
      configured: true,
    };
  }

  private async getJsapiTicket(): Promise<string | null> {
    const token = await this.getAccessToken();
    if (!token) return null;
    const cacheKey = 'wework:jsapi_ticket';
    const cached = await this.redis.client.get(cacheKey);
    if (cached) return cached;
    const { data } = await axios.get(`${WEWORK_API}/get_jsapi_ticket`, {
      params: { access_token: token },
    });
    if (data.errcode !== 0) return null;
    const ticket = data.ticket as string;
    const ttl = Math.max((data.expires_in || 7200) - 200, 60);
    await this.redis.client.set(cacheKey, ticket, 'EX', ttl);
    return ticket;
  }
}
