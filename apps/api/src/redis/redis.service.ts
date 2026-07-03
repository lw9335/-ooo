import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  public readonly client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: false,
      maxRetriesPerRequest: null,
    });
    this.client.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('[Redis] 连接错误:', err.message);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
