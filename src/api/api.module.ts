import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { WorkersModule } from '../workersqueue/workerqueue.module';
import { SenderModule } from '../sender/sender.module';

@Module({
  imports: [WorkersModule, SenderModule],
  controllers: [EmailController],
})
export class ApiModule {}