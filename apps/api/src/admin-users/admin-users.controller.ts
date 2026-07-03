import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { AdminRole } from '@prisma/client';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

class CreateAdminDto {
  @IsString() username: string;
  @IsString() @MinLength(6) password: string;
  @IsString() name: string;
  @IsOptional() @IsEnum(AdminRole) role?: AdminRole;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('admin-users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() dto: CreateAdminDto) {
    return this.service.create(dto);
  }

  @Patch(':id/active')
  setActive(@Param('id', ParseIntPipe) id: number, @Body('active') active: boolean) {
    return this.service.setActive(id, active);
  }

  @Patch(':id/password')
  resetPassword(@Param('id', ParseIntPipe) id: number, @Body('password') password: string) {
    return this.service.resetPassword(id, password);
  }
}
