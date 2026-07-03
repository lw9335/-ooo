import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @UseGuards(JwtAuthGuard)
  @Get('skill-distribution')
  skillDistribution() {
    return this.service.skillDistribution();
  }

  @UseGuards(JwtAuthGuard)
  @Get('order-trend')
  orderTrend() {
    return this.service.orderTrend();
  }

  /** 埋点上报（前端点击分析），无需鉴权以便移动端也可上报 */
  @Post('track')
  track(@Body() body: any) {
    return this.service.track(body);
  }
}
