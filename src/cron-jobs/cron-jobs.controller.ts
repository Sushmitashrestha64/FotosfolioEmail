import { Controller, Post, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { CronJobsService } from './cron-jobs.service';

@Controller('cron-jobs')
export class CronJobsController {
  private readonly logger = new Logger(CronJobsController.name);

  constructor(private readonly cronJobsService: CronJobsService) {}

  /**
   * POST /cron-jobs/midnight
   * Manually trigger midnight tasks (for testing/debugging)
   */
  @Post('midnight')
  @HttpCode(HttpStatus.OK)
  async triggerMidnightTasks() {
    this.logger.log('Manual trigger: Midnight tasks');
    
    try {
      const result = await this.cronJobsService.runMidnightTasks();
      return {
        success: true,
        message: 'Midnight tasks completed successfully',
        data: result,
      };
    } catch (error: any) {
      this.logger.error('Failed to run midnight tasks', error);
      return {
        success: false,
        message: 'Failed to run midnight tasks',
        error: error.message,
      };
    }
  }

  /**
   * POST /cron-jobs/reminders
   * Manually trigger subscription reminder tasks
   */
  @Post('reminders')
  @HttpCode(HttpStatus.OK)
  async triggerReminderTasks() {
    this.logger.log('Manual trigger: Subscription reminders');
    
    try {
      const result = await this.cronJobsService.runSubscriptionReminderTasks();
      return {
        success: true,
        message: 'Reminder tasks completed successfully',
        data: result,
      };
    } catch (error: any) {
      this.logger.error('Failed to run reminder tasks', error);
      return {
        success: false,
        message: 'Failed to run reminder tasks',
        error: error.message,
      };
    }
  }

  /**
   * POST /cron-jobs/nightly-storage
   * Manually trigger nightly storage tasks
   */
  @Post('nightly-storage')
  @HttpCode(HttpStatus.OK)
  async triggerNightlyStorageTasks() {
    this.logger.log('Manual trigger: Nightly storage tasks');
    
    try {
      const result = await this.cronJobsService.runNightlyTasks();
      return {
        success: true,
        message: 'Nightly storage tasks completed successfully',
        data: result,
      };
    } catch (error: any) {
      this.logger.error('Failed to run nightly storage tasks', error);
      return {
        success: false,
        message: 'Failed to run nightly storage tasks',
        error: error.message,
      };
    }
  }
}
