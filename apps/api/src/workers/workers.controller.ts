import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { WorkerStatus } from '@prisma/client';
import { WorkersService } from './workers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class ProfileDto {
  @IsOptional() @IsInt() id?: number;
  @IsString() name: string;
  @IsString() phone: string;
  @IsOptional() @IsString() weworkUserId?: string;
  @IsOptional() @IsString() avatar?: string;
  @IsOptional() @IsString() intro?: string;
  @IsOptional() @IsArray() skillCategoryIds?: number[];
  @IsOptional() @IsArray() brandIds?: number[];
}

class StatusDto {
  @IsEnum(WorkerStatus) status: WorkerStatus;
}

@Controller('workers')
export class WorkersController {
  constructor(private readonly service: WorkersService) {}

  /** 管理端列表（可筛选） */
  @UseGuards(JwtAuthGuard)
  @Get()
  list(
    @Query('status') status?: WorkerStatus,
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.service.list({
      status,
      categoryId: categoryId ? Number(categoryId) : undefined,
      brandId: brandId ? Number(brandId) : undefined,
      keyword,
    });
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.detail(id);
  }

  /** 移动端企业微信免登 */
  @Post('wework-login')
  weworkLogin(@Body('code') code: string) {
    return this.service.loginByWeworkCode(code);
  }

  /** 保存/完善档案（移动端） */
  @Post('profile')
  upsertProfile(@Body() dto: ProfileDto) {
    return this.service.upsertProfile(dto.id ?? null, dto);
  }

  /** 切换空闲/工作中（移动端） */
  @Patch(':id/status')
  setStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: StatusDto) {
    return this.service.setStatus(id, dto.status);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/active')
  setActive(@Param('id', ParseIntPipe) id: number, @Body('active') active: boolean) {
    return this.service.setActive(id, active);
  }
}
