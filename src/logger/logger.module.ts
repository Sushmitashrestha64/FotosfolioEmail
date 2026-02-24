import { Global, Module } from '@nestjs/common';
import { AppLoggerService } from './logger.service';
import { RequestLoggerInterceptor } from './interceptors/request-logger.interceptor';

@Global()
@Module({
  providers: [AppLoggerService, RequestLoggerInterceptor],
  exports: [AppLoggerService, RequestLoggerInterceptor],
})
export class LoggerModule {}
