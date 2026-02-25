import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cron from 'node-cron';
import axios from 'axios';

@Injectable()
export class CronJobsService implements OnModuleInit {
  private readonly logger = new Logger(CronJobsService.name);
  private readonly mainBackendUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Get main backend URL from config
    this.mainBackendUrl = this.configService.get('MAIN_BACKEND_URL', 'http://localhost:3000/api');
    this.logger.log(`🔗 Main Backend URL: ${this.mainBackendUrl}`);
  }

  onModuleInit() {
    this.logger.log('🕐 Initializing unified cron jobs...');

    // Runs daily at 12:00 AM (midnight) - Subscription & Storage tasks
    cron.schedule('0 0 * * *', async () => {
      await this.runMidnightTasks();
    });

    // Runs daily at 9:00 AM - Subscription expiration reminders
    cron.schedule('0 9 * * *', async () => {
      await this.runSubscriptionReminderTasks();
    });

    // Runs daily at 11:59 PM - Storage tracking and project cleanup
    cron.schedule('59 23 * * *', async () => {
      await this.runNightlyTasks();
    });

    this.logger.log('✅ All cron jobs registered successfully');
    this.logger.log('  - 00:00 (Midnight): Expired subscriptions, storage, grace periods');
    this.logger.log('  - 09:00 (9 AM): Subscription expiration reminders');
    this.logger.log('  - 23:59 (11:59 PM): Storage tracking, project cleanup');
  }

  /**
   * Midnight Tasks - Trigger main backend to handle subscriptions and storage
   */
  async runMidnightTasks() {
    const startTime = new Date();
    this.logger.log(`[Cron] Starting midnight tasks at ${startTime.toISOString()}`);

    const results = {
      expiredSubscriptions: { success: false, message: '' },
      expiredAddons: { success: false, message: '' },
      gracePeriod: { success: false, message: '' },
      markExpired: { success: false, message: '' },
    };

    try {
      // 1. Process expired subscriptions
      try {
        await this.callBackendEndpoint('/cron/subscriptions/process-expired', 'POST');
        results.expiredSubscriptions = { success: true, message: 'Processed expired subscriptions' };
      } catch (error: any) {
        results.expiredSubscriptions = { success: false, message: error.message };
      }

      // 2. Process expired add-on storages
      try {
        await this.callBackendEndpoint('/cron/storage/expire-addons', 'POST');
        results.expiredAddons = { success: true, message: 'Processed expired add-ons' };
      } catch (error: any) {
        results.expiredAddons = { success: false, message: error.message };
      }

      // 3. Send grace period notifications
      try {
        await this.callBackendEndpoint('/cron/storage/grace-period-notifications', 'POST');
        results.gracePeriod = { success: true, message: 'Sent grace period notifications' };
      } catch (error: any) {
        results.gracePeriod = { success: false, message: error.message };
      }

      // 4. Mark subscriptions as ended after grace period
      try {
        await this.callBackendEndpoint('/cron/subscriptions/mark-ended', 'POST');
        results.markExpired = { success: true, message: 'Marked expired subscriptions as ended' };
      } catch (error: any) {
        results.markExpired = { success: false, message: error.message };
      }

      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      this.logger.log(`[Cron] ✅ Midnight tasks completed. Duration: ${duration}s`);

      return { success: true, duration: `${duration}s`, timestamp: endTime.toISOString(), results };
    } catch (error) {
      this.logger.error('[Cron] ❌ Failed midnight tasks', error.stack || error);
      throw error;
    }
  }

  /**
   * Morning Tasks - Trigger main backend to send subscription expiration reminders
   */
  async runSubscriptionReminderTasks() {
    this.logger.log('[Cron] Starting subscription reminder tasks');

    try {
      await this.callBackendEndpoint('/cron/subscriptions/send-expiration-reminders', 'POST');
      
      this.logger.log('[Cron] ✅ Subscription reminders triggered');
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      this.logger.error('[Cron] ❌ Failed subscription reminder tasks', error.stack || error);
      throw error;
    }
  }

  /**
   * Nightly Tasks - Trigger main backend for storage tracking and project cleanup
   */
  async runNightlyTasks() {
    this.logger.log('[Cron] Starting nightly tasks');

    const results = {
      storageTracking: { success: false, message: '' },
      cleanupReservations: { success: false, message: '' },
      archiveProjects: { success: false, message: '' },
      deleteExpired: { success: false, message: '' },
    };

    try {
      // 1. Update storage usage tracking
      try {
        await this.callBackendEndpoint('/cron/storage/update-usage', 'POST');
        results.storageTracking = { success: true, message: 'Updated storage usage' };
      } catch (error: any) {
        results.storageTracking = { success: false, message: error.message };
      }

      // 2. Cleanup expired reservations
      try {
        await this.callBackendEndpoint('/cron/storage/cleanup-reservations', 'POST');
        results.cleanupReservations = { success: true, message: 'Cleaned up reservations' };
      } catch (error: any) {
        results.cleanupReservations = { success: false, message: error.message };
      }

      // 3. Archive expired projects
      try {
        await this.callBackendEndpoint('/cron/projects/archive-expired', 'POST');
        results.archiveProjects = { success: true, message: 'Archived expired projects' };
      } catch (error: any) {
        results.archiveProjects = { success: false, message: error.message };
      }

      // 4. Delete expired projects
      try {
        await this.callBackendEndpoint('/cron/projects/delete-expired', 'POST');
        results.deleteExpired = { success: true, message: 'Deleted expired projects' };
      } catch (error: any) {
        results.deleteExpired = { success: false, message: error.message };
      }

      this.logger.log('[Cron] ✅ Nightly tasks completed');
      return { success: true, timestamp: new Date().toISOString(), results };
    } catch (error) {
      this.logger.error('[Cron] ❌ Failed nightly tasks', error.stack || error);
      throw error;
    }
  }

  /**
   * Helper method to call main backend API endpoints
   */
  private async callBackendEndpoint(endpoint: string, method: 'GET' | 'POST' = 'POST'): Promise<any> {
    const url = `${this.mainBackendUrl}${endpoint}`;
    
    try {
      this.logger.log(`[API] Calling ${method} ${url}`);
      
      const response = await axios({
        method,
        url,
        timeout: 60000, // 60 second timeout for potentially long-running tasks
      });

      if (response.data?.success !== false) {
        this.logger.log(`[API] ✅ ${endpoint} completed successfully`);
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Backend returned success: false');
      }
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        this.logger.warn(`[API] ⚠️ Main backend not available at ${url}`);
        throw new Error('Main backend not available');
      }
      
      if (error.response) {
        this.logger.error(`[API] ❌ ${endpoint} failed: ${error.response.status} - ${error.response.data?.message || error.message}`);
        throw new Error(error.response.data?.message || error.message);
      }

      this.logger.error(`[API] ❌ ${endpoint} failed: ${error.message}`);
      throw error;
    }
  }
}
