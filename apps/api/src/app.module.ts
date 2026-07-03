import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { WorkersModule } from './workers/workers.module';
import { SkillsModule } from './skills/skills.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WeworkModule } from './wework/wework.module';
import { StatsModule } from './stats/stats.module';
import { RealtimeModule } from './realtime/realtime.module';
import { TasksModule } from './tasks/tasks.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    AdminUsersModule,
    WorkersModule,
    SkillsModule,
    DispatchModule,
    NotificationsModule,
    WeworkModule,
    StatsModule,
    RealtimeModule,
    TasksModule,
    HealthModule,
  ],
})
export class AppModule {}
