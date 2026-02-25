import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import axios from 'axios';

@Injectable()
export class ResendProviderService implements OnModuleInit {
  private readonly logger = new Logger(ResendProviderService.name);
  private resend: Resend;
  private from: string;
  private apiKey1: string;
  private apiKey2: string;
  private dailyLimit: number;
  private emailCountToday: number = 0;
  private lastResetDate: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.apiKey1 = this.configService.get<string>('resend.apiKey1')!;
    this.apiKey2 = this.configService.get<string>('resend.apiKey2')!;
    this.dailyLimit = this.configService.get<number>('resend.dailyLimit') || 100;
    this.lastResetDate = new Date().toISOString().slice(0, 10);

    // Validate required API keys
    if (!this.apiKey1 || !this.apiKey2) {
      throw new Error('RESEND_API_KEY1 and RESEND_API_KEY2 must be configured');
    }

    // Initialize with first key
    await this.initializeResendClient();
  }

  /**
   * Fetch all emails sent today from Resend API
   */
  private async getTodaysEmailCount(): Promise<number> {
    // DISABLED: Fetching from API causes rate limiting and errors
    // Using local counter instead for better reliability
    return this.emailCountToday;
    
    /* Original API fetch code - disabled
    const apiUrl = 'https://api.resend.com/emails';
    
    try {
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${this.apiKey1}`,
        },
      });

      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const todaysEmails = response.data.data.filter((email: any) =>
        email.created_at.startsWith(today),
      );

      this.logger.log(`📧 Total emails sent today: ${todaysEmails.length}`);
      return todaysEmails.length;
    } catch (error: any) {
      this.logger.error(
        `Error fetching email count: ${JSON.stringify(error.response?.data) || error.message}`,
      );
      // Fallback to 0 if we can't fetch
      return 0;
    }
    */
  }

  /**
   * Initialize or reinitialize Resend client with appropriate API key
   */
  private async initializeResendClient(): Promise<void> {
    const count = await this.getTodaysEmailCount();
    this.emailCountToday = count;

    // Check if we need to reset daily counter (new day)
    const today = new Date().toISOString().slice(0, 10);
    if (this.lastResetDate !== today) {
      this.logger.log('📅 New day detected, resetting email counter');
      this.emailCountToday = 0;
      this.lastResetDate = today;
    }

    // Switch between keys based on daily limit
    if (this.emailCountToday >= this.dailyLimit) {
      this.logger.log(`🔄 Switching to API Key 2 (count: ${this.emailCountToday})`);
      this.resend = new Resend(this.apiKey2);
      this.from = 'Fotosfolio <no-reply@mail.fotosfolio.com>';
    } else {
      this.logger.log(`✅ Using API Key 1 (count: ${this.emailCountToday})`);
      this.resend = new Resend(this.apiKey1);
      this.from = 'Fotosfolio <no-reply@fotosfolio.com>';
    }

    this.logger.log(
      `✓ Resend initialized with key ${this.emailCountToday >= this.dailyLimit ? '2' : '1'}, from: ${this.from}`,
    );
  }

  /**
   * Get current Resend client (with automatic key rotation)
   */
  async getResendClient(): Promise<Resend> {
    // Refresh client before each batch of sends
    await this.initializeResendClient();
    return this.resend;
  }

  /**
   * Get current 'from' email address
   */
  getFromAddress(): string {
    return this.from;
  }

  /**
   * Increment email counter (call after successful send)
   */
  incrementCounter(): void {
    this.emailCountToday++;
    this.logger.debug(`📈 Email counter: ${this.emailCountToday}/${this.dailyLimit}`);
    
    // Auto-switch if we hit the limit
    if (this.emailCountToday === this.dailyLimit) {
      this.logger.warn('⚠️ Daily limit reached on key 1, switching to key 2');
      this.resend = new Resend(this.apiKey2);
      this.from = 'Fotosfolio <no-reply@mail.fotosfolio.com>';
    }
  }

  /**
   * Get current email count (for monitoring)
   */
  getCurrentCount(): number {
    return this.emailCountToday;
  }

  /**
   * Get daily limit (for monitoring)
   */
  getDailyLimit(): number {
    return this.dailyLimit;
  }
}