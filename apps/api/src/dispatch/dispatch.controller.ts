import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { DispatchService } from './dispatch.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class RecommendDto {
  @IsOptional() @IsInt() categoryId?: number;
  @IsOptional() @IsInt() brandId?: number;
  @IsOptional() @IsInt() limit?: number;
}

class CreateOrderDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() brandName?: string;
  @IsOptional() @IsInt() categoryId?: number;
  @IsOptional() @IsInt() assignedWorkerId?: number;
}

@Controller('dispatch')
export class DispatchController {
  constructor(private readonly service: DispatchService) {}

  /** 智能推荐候选师傅（管理端） */
  @UseGuards(JwtAuthGuard)
  @Post('recommend')
  recommend(@Body() dto: RecommendDto) {
    return this.service.recommend(dto);
  }

  /** 创建/派单（管理端） */
  @UseGuards(JwtAuthGuard)
  @Post('orders')
  create(@Request() req, @Body() dto: CreateOrderDto) {
    return this.service.createOrder({ ...dto, createdById: req.user.id });
  }

  /** 一键派单给某师傅（管理端） */
  @UseGuards(JwtAuthGuard)
  @Post('orders/:id/assign')
  assign(@Param('id', ParseIntPipe) id: number, @Body('workerId', ParseIntPipe) workerId: number) {
    return this.service.assign(id, workerId);
  }

  @Get('orders')
  list(@Query('status') status?: OrderStatus, @Query('workerId') workerId?: string) {
    return this.service.listOrders({
      status,
      workerId: workerId ? Number(workerId) : undefined,
    });
  }

  /** 师傅接单（移动端） */
  @Post('orders/:id/accept')
  accept(@Param('id', ParseIntPipe) id: number, @Body('workerId', ParseIntPipe) workerId: number) {
    return this.service.accept(id, workerId);
  }

  /** 师傅完成（移动端） */
  @Post('orders/:id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body('workerId', ParseIntPipe) workerId: number,
  ) {
    return this.service.complete(id, workerId);
  }
}
