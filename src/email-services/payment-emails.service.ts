// src/email-services/payment-emails.service.ts
import { Injectable } from '@nestjs/common';
import { BaseEmailService } from './base-email.service';
import { EmailData, EmailCategory, EmailType } from '../types/email-types';

@Injectable()
export class PaymentEmailsService extends BaseEmailService {
  
  /**
   * Build PAYMENT_SUCCESS email
   */
  async buildPaymentSuccess(payload: any): Promise<EmailData> {
    const { to, userName, amount, transactionId, planName } = payload;
    const subject = 'Payment Successful – Thank You!';

    const text = `Hi ${userName},

Your payment of $${amount} has been processed successfully.

Transaction ID: ${transactionId}
Plan: ${planName}

Thank you for your business!

— The Fotosfolio Team`;

    const html = `
    <div style="font-family:Arial,sans-serif;background-color:#f9f9f9;padding:40px 0;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;padding:40px;box-shadow:0 0 10px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="text-align:center;margin-bottom:30px;">
          <img src="https://cdn.fotosfolio.com/logo3.png" alt="Fotosfolio" width="140" style="display:block;margin:0 auto;" />
        </div>

        <!-- Success Icon -->
        <div style="text-align:center;margin-bottom:30px;">
          <div style="width:60px;height:60px;border-radius:50%;background:#4CAF50;display:inline-flex;align-items:center;justify-content:center;">
            <span style="color:#fff;font-size:36px;line-height:1;">✓</span>
          </div>
        </div>

        <!-- Title -->
        <h1 style="color:#333;font-size:24px;text-align:center;margin:0 0 20px;">Payment Successful!</h1>

        <!-- Message -->
        <p style="color:#666;font-size:16px;line-height:1.6;margin:0 0 30px;text-align:center;">
          Hi <strong>${userName}</strong>, your payment has been processed successfully.
        </p>

        <!-- Payment Details -->
        <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:30px;">
          <table width="100%" cellpadding="8" cellspacing="0">
            <tr>
              <td style="color:#666;font-size:14px;">Amount:</td>
              <td style="color:#333;font-size:14px;font-weight:bold;text-align:right;">$${amount}</td>
            </tr>
            <tr>
              <td style="color:#666;font-size:14px;">Transaction ID:</td>
              <td style="color:#333;font-size:14px;text-align:right;">${transactionId}</td>
            </tr>
            <tr>
              <td style="color:#666;font-size:14px;">Plan:</td>
              <td style="color:#333;font-size:14px;text-align:right;">${planName}</td>
            </tr>
          </table>
        </div>

        <!-- CTA Button -->
        <div style="text-align:center;margin-bottom:30px;">
          <a href="https://fotosfolio.com/dashboard" style="display:inline-block;padding:12px 30px;background:#4CAF50;color:#fff;text-decoration:none;border-radius:5px;font-size:16px;">View Dashboard</a>
        </div>

        <!-- Footer -->
        <p style="color:#999;font-size:12px;text-align:center;margin:30px 0 0;">
          Thank you for your business!<br>
          — The Fotosfolio Team
        </p>

      </div>
    </div>`;

    return {
      to,
      subject,
      html,
      text,
      category: EmailCategory.PAYMENT,
      type: EmailType.PAYMENT_SUCCESS,
    };
  }

  /**
   * Build PAYMENT_FAILED email
   */
  async buildPaymentFailed(payload: any): Promise<EmailData> {
    const { to, userName, amount, reason, planName } = payload;
    const subject = 'Payment Failed – Action Required';

    const text = `Hi ${userName},

We were unable to process your payment of $${amount} for ${planName}.

Reason: ${reason}

Please update your payment method or try again.

Update Payment Method: https://fotosfolio.com/billing

If you need assistance, please contact our support team.

— The Fotosfolio Team`;

    const html = `
    <div style="font-family:Arial,sans-serif;background-color:#f9f9f9;padding:40px 0;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;padding:40px;box-shadow:0 0 10px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="text-align:center;margin-bottom:30px;">
          <img src="https://cdn.fotosfolio.com/logo3.png" alt="Fotosfolio" width="140" style="display:block;margin:0 auto;" />
        </div>

        <!-- Error Icon -->
        <div style="text-align:center;margin-bottom:30px;">
          <div style="width:60px;height:60px;border-radius:50%;background:#f44336;display:inline-flex;align-items:center;justify-content:center;">
            <span style="color:#fff;font-size:36px;line-height:1;">✕</span>
          </div>
        </div>

        <!-- Title -->
        <h1 style="color:#333;font-size:24px;text-align:center;margin:0 0 20px;">Payment Failed</h1>

        <!-- Message -->
        <p style="color:#666;font-size:16px;line-height:1.6;margin:0 0 30px;text-align:center;">
          Hi <strong>${userName}</strong>, we were unable to process your payment.
        </p>

        <!-- Payment Details -->
        <div style="background:#fff5f5;border:1px solid #ffcdd2;border-radius:8px;padding:20px;margin-bottom:30px;">
          <table width="100%" cellpadding="8" cellspacing="0">
            <tr>
              <td style="color:#666;font-size:14px;">Amount:</td>
              <td style="color:#333;font-size:14px;font-weight:bold;text-align:right;">$${amount}</td>
            </tr>
            <tr>
              <td style="color:#666;font-size:14px;">Plan:</td>
              <td style="color:#333;font-size:14px;text-align:right;">${planName}</td>
            </tr>
            <tr>
              <td style="color:#666;font-size:14px;">Reason:</td>
              <td style="color:#d32f2f;font-size:14px;text-align:right;">${reason}</td>
            </tr>
          </table>
        </div>

        <!-- CTA Button -->
        <div style="text-align:center;margin-bottom:30px;">
          <a href="https://fotosfolio.com/billing" style="display:inline-block;padding:12px 30px;background:#f44336;color:#fff;text-decoration:none;border-radius:5px;font-size:16px;">Update Payment Method</a>
        </div>

        <!-- Footer -->
        <p style="color:#999;font-size:12px;text-align:center;margin:30px 0 0;">
          Need help? Contact our support team.<br>
          — The Fotosfolio Team
        </p>

      </div>
    </div>`;

    return {
      to,
      subject,
      html,
      text,
      category: EmailCategory.PAYMENT,
      type: EmailType.PAYMENT_FAILED,
    };
  }

  /**
   * Build REFUND_PROCESSED email
   */
  async buildRefundProcessed(payload: any): Promise<EmailData> {
    const { to, userName, amount, transactionId, reason, refundDate } = payload;
    const subject = 'Refund Processed Successfully';

    const text = `Hi ${userName},

Your refund of $${amount} has been processed successfully.

Transaction ID: ${transactionId}
Refund Date: ${refundDate}
Reason: ${reason}

The amount will be credited to your original payment method within 5-10 business days.

— The Fotosfolio Team`;

    const html = `
    <div style="font-family:Arial,sans-serif;background-color:#f9f9f9;padding:40px 0;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;padding:40px;box-shadow:0 0 10px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="text-align:center;margin-bottom:30px;">
          <img src="https://cdn.fotosfolio.com/logo3.png" alt="Fotosfolio" width="140" style="display:block;margin:0 auto;" />
        </div>

        <!-- Success Icon -->
        <div style="text-align:center;margin-bottom:30px;">
          <div style="width:60px;height:60px;border-radius:50%;background:#2196F3;display:inline-flex;align-items:center;justify-content:center;">
            <span style="color:#fff;font-size:36px;line-height:1;">↩</span>
          </div>
        </div>

        <!-- Title -->
        <h1 style="color:#333;font-size:24px;text-align:center;margin:0 0 20px;">Refund Processed</h1>

        <!-- Message -->
        <p style="color:#666;font-size:16px;line-height:1.6;margin:0 0 30px;text-align:center;">
          Hi <strong>${userName}</strong>, your refund has been processed successfully.
        </p>

        <!-- Refund Details -->
        <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:30px;">
          <table width="100%" cellpadding="8" cellspacing="0">
            <tr>
              <td style="color:#666;font-size:14px;">Refund Amount:</td>
              <td style="color:#333;font-size:14px;font-weight:bold;text-align:right;">$${amount}</td>
            </tr>
            <tr>
              <td style="color:#666;font-size:14px;">Transaction ID:</td>
              <td style="color:#333;font-size:14px;text-align:right;">${transactionId}</td>
            </tr>
            <tr>
              <td style="color:#666;font-size:14px;">Refund Date:</td>
              <td style="color:#333;font-size:14px;text-align:right;">${refundDate}</td>
            </tr>
            <tr>
              <td style="color:#666;font-size:14px;">Reason:</td>
              <td style="color:#333;font-size:14px;text-align:right;">${reason}</td>
            </tr>
          </table>
        </div>

        <!-- Info Box -->
        <div style="background:#e3f2fd;border-left:4px solid #2196F3;padding:15px;margin-bottom:30px;">
          <p style="color:#1976D2;font-size:14px;margin:0;line-height:1.6;">
            <strong>📌 Note:</strong> The refund will be credited to your original payment method within 5-10 business days.
          </p>
        </div>

        <!-- Footer -->
        <p style="color:#999;font-size:12px;text-align:center;margin:30px 0 0;">
          Thank you for your patience.<br>
          — The Fotosfolio Team
        </p>

      </div>
    </div>`;

    return {
      to,
      subject,
      html,
      text,
      category: EmailCategory.PAYMENT,
      type: EmailType.REFUND_PROCESSED,
    };
  }
}
