import { Body, Controller, Get, Param, Patch, Post, ParseIntPipe, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { SkillsService } from './skills.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class CreateCategoryDto {
  @IsString() name: string;
  @IsOptional() @IsInt() parentId?: number;
  @IsOptional() @IsInt() sort?: number;
}

class CreateBrandDto {
  @IsString() name: string;
  @IsString() type: string;
  @IsOptional() @IsInt() sort?: number;
}

@Controller('skills')
export class SkillsController {
  constructor(private readonly service: SkillsService) {}

  @Get('categories')
  tree() {
    return this.service.categoryTree();
  }

  @Get('categories/flat')
  flat() {
    return this.service.allCategoriesFlat();
  }

  @Get('brands')
  brands() {
    return this.service.brands();
  }

  @UseGuards(JwtAuthGuard)
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.service.createCategory(dto.name, dto.parentId, dto.sort);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('categories/:id')
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.service.updateCategory(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('brands')
  createBrand(@Body() dto: CreateBrandDto) {
    return this.service.createBrand(dto.name, dto.type, dto.sort);
  }
}
