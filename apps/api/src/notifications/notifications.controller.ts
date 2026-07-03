import { Controller, Get, Param, Post, Query, ParseIntPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@Query('workerId', ParseIntPipe) workerId: number) {
    return this.service.listByWorker(workerId);
  }

  @Post(':id/read')
  read(@Param('id', ParseIntPipe) id: number) {
    return this.service.markRead(id);
  }

  @Post('read-all')
  readAll(@Query('workerId', ParseIntPipe) workerId: number) {
    return this.service.markAllRead(workerId);
  }
}
