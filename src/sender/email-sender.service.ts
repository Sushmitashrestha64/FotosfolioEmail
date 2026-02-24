import { Injectable, Logger } from '@nestjs/common';
import { ResendProviderService } from './resend-provider.service';
import { EmailData } from '../types/email-types';


@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);

  constructor(private readonly resendProvider: ResendProviderService) {}

  /**
   * Send an email using Resend API with automatic key rotation
   */
  async sendEmail(emailData: EmailData): Promise<void> {
    const { to, subject, html, text } = emailData;

    try {
      this.logger.log(`📧 Sending ${emailData.type} email to ${to}`);

      // Get Resend client (with automatic key rotation)
      const resend = await this.resendProvider.getResendClient();
      const from = this.resendProvider.getFromAddress();

      // Ensure we have text fallback
      const textFallback = text || this.stripHtml(html);

      // Send email
      const response = await resend.emails.send({
        from,
        to: to.toLowerCase(),
        subject,
        text: textFallback,
        html,
      });

      // Increment counter after successful send
      this.resendProvider.incrementCounter();

      this.logger.log(
        `✅ Email sent successfully to ${to} (ID: ${response.data?.id || 'N/A'})`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to send ${emailData.type} email to ${to}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Strip HTML tags for plain text fallback
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, '').trim();
  }

  /**
   * Send batch emails (useful for bulk operations)
   */
  async sendBatch(emails: EmailData[]): Promise<void> {
    this.logger.log(`📨 Sending batch of ${emails.length} emails`);

    const results = await Promise.allSettled(
      emails.map((email) => this.sendEmail(email)),
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(
      `📊 Batch complete: ${successful} sent, ${failed} failed`,
    );

    if (failed > 0) {
      const errors = results
        .filter((r) => r.status === 'rejected')
        .map((r: any) => r.reason.message);
      this.logger.error(`Batch errors: ${errors.join(', ')}`);
    }
  }

  /**
   * Get current API usage stats
   */
  getUsageStats() {
    return {
      emailsSentToday: this.resendProvider.getCurrentCount(),
      dailyLimit: this.resendProvider.getDailyLimit(),
      currentFrom: this.resendProvider.getFromAddress(),
    };
  }
}