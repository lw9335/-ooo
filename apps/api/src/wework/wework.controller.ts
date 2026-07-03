import { Controller, Get, Query } from '@nestjs/common';
import { WeworkService } from './wework.service';

@Controller('wework')
export class WeworkController {
  constructor(private readonly wework: WeworkService) {}

  /** 移动端获取 JS-SDK 配置签名 */
  @Get('jssdk')
  jssdk(@Query('url') url: string) {
    return this.wework.getJsSdkSignature(url || '');
  }
}
