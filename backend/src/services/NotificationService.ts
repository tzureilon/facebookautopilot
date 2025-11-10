import axios from 'axios';
import { AlertNotification, NotificationChannel, NotificationPreferences } from '@meta-automation/shared';
import { NotificationPreferencesModel } from '../models/Alert.model';
import logger from '../utils/logger';

export class NotificationService {
  /**
   * Send notification through specified channels
   */
  async sendNotification(
    userId: string,
    notification: AlertNotification,
    channels: NotificationChannel[]
  ): Promise<void> {
    try {
      // Get user preferences
      const preferences = await NotificationPreferencesModel.findOne({ userId });

      // Check quiet hours
      if (preferences && this.isQuietHours(preferences)) {
        logger.info(`Skipping notification - quiet hours for user ${userId}`);
        return;
      }

      // Send through each enabled channel
      for (const channel of channels) {
        if (!channel.enabled) continue;

        try {
          switch (channel.type) {
            case 'email':
              await this.sendEmail(channel.config.email!, notification);
              break;
            case 'sms':
              await this.sendSMS(channel.config.phoneNumber!, notification);
              break;
            case 'slack':
              await this.sendSlack(channel.config.slackWebhook!, notification);
              break;
            case 'discord':
              await this.sendDiscord(channel.config.discordWebhook!, notification);
              break;
            case 'teams':
              await this.sendTeams(channel.config.teamsWebhook!, notification);
              break;
            case 'webhook':
              await this.sendWebhook(channel.config.webhookUrl!, notification);
              break;
            case 'in_app':
              // In-app notifications are stored in database (already done)
              break;
          }
        } catch (error: any) {
          logger.error(`Failed to send ${channel.type} notification:`, error.message);
        }
      }
    } catch (error: any) {
      logger.error('Error sending notification:', error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(email: string, notification: AlertNotification): Promise<void> {
    // In production, use SendGrid, AWS SES, or similar service
    logger.info(`Sending email to ${email}: ${notification.title}`);

    // Example with SendGrid (requires @sendgrid/mail package)
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: 'alerts@metaautomation.com',
      subject: `[${notification.severity.toUpperCase()}] ${notification.title}`,
      html: this.formatEmailHTML(notification),
    };

    await sgMail.send(msg);
    */
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(phoneNumber: string, notification: AlertNotification): Promise<void> {
    // In production, use Twilio or similar service
    logger.info(`Sending SMS to ${phoneNumber}: ${notification.title}`);

    // Example with Twilio (requires twilio package)
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      body: `${notification.severity.toUpperCase()}: ${notification.title} - ${notification.message}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    */
  }

  /**
   * Send Slack notification
   */
  private async sendSlack(webhookUrl: string, notification: AlertNotification): Promise<void> {
    const color = this.getSeverityColor(notification.severity);

    const payload = {
      attachments: [
        {
          color,
          title: notification.title,
          text: notification.message,
          fields: [
            {
              title: 'Entity',
              value: `${notification.entityType}: ${notification.entityName}`,
              short: true,
            },
            {
              title: 'Metric',
              value: `${notification.metric}: ${notification.currentValue.toFixed(2)} (Threshold: ${notification.threshold.toFixed(2)})`,
              short: true,
            },
            {
              title: 'Severity',
              value: notification.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Time',
              value: new Date(notification.createdAt).toLocaleString(),
              short: true,
            },
          ],
          footer: 'Meta Campaign Automation',
          ts: Math.floor(new Date(notification.createdAt).getTime() / 1000),
        },
      ],
    };

    await axios.post(webhookUrl, payload);
    logger.info('Slack notification sent');
  }

  /**
   * Send Discord notification
   */
  private async sendDiscord(webhookUrl: string, notification: AlertNotification): Promise<void> {
    const color = this.getSeverityColorHex(notification.severity);

    const payload = {
      embeds: [
        {
          title: notification.title,
          description: notification.message,
          color: parseInt(color.replace('#', ''), 16),
          fields: [
            {
              name: 'Entity',
              value: `${notification.entityType}: ${notification.entityName}`,
              inline: true,
            },
            {
              name: 'Metric',
              value: `${notification.metric}: ${notification.currentValue.toFixed(2)}`,
              inline: true,
            },
            {
              name: 'Threshold',
              value: notification.threshold.toFixed(2),
              inline: true,
            },
            {
              name: 'Severity',
              value: notification.severity.toUpperCase(),
              inline: true,
            },
          ],
          timestamp: new Date(notification.createdAt).toISOString(),
          footer: {
            text: 'Meta Campaign Automation',
          },
        },
      ],
    };

    await axios.post(webhookUrl, payload);
    logger.info('Discord notification sent');
  }

  /**
   * Send Microsoft Teams notification
   */
  private async sendTeams(webhookUrl: string, notification: AlertNotification): Promise<void> {
    const color = this.getSeverityColorHex(notification.severity);

    const payload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: notification.title,
      themeColor: color.replace('#', ''),
      title: notification.title,
      sections: [
        {
          activityTitle: notification.message,
          facts: [
            {
              name: 'Entity',
              value: `${notification.entityType}: ${notification.entityName}`,
            },
            {
              name: 'Metric',
              value: `${notification.metric}: ${notification.currentValue.toFixed(2)} (Threshold: ${notification.threshold.toFixed(2)})`,
            },
            {
              name: 'Severity',
              value: notification.severity.toUpperCase(),
            },
            {
              name: 'Time',
              value: new Date(notification.createdAt).toLocaleString(),
            },
          ],
        },
      ],
    };

    await axios.post(webhookUrl, payload);
    logger.info('Teams notification sent');
  }

  /**
   * Send generic webhook notification
   */
  private async sendWebhook(webhookUrl: string, notification: AlertNotification): Promise<void> {
    await axios.post(webhookUrl, {
      event: 'alert_triggered',
      notification: {
        id: notification.id,
        severity: notification.severity,
        title: notification.title,
        message: notification.message,
        entity: {
          type: notification.entityType,
          id: notification.entityId,
          name: notification.entityName,
        },
        metric: notification.metric,
        currentValue: notification.currentValue,
        threshold: notification.threshold,
        timestamp: notification.createdAt,
      },
    });

    logger.info('Webhook notification sent');
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(preferences: any): boolean {
    if (!preferences.quietHours?.enabled) return false;

    const now = new Date();
    const start = this.parseTime(preferences.quietHours.start);
    const end = this.parseTime(preferences.quietHours.end);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (start < end) {
      return currentMinutes >= start && currentMinutes < end;
    } else {
      // Quiet hours span midnight
      return currentMinutes >= start || currentMinutes < end;
    }
  }

  /**
   * Parse time string (HH:mm) to minutes since midnight
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get color for severity level (Slack format)
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
        return 'good';
      default:
        return '#808080';
    }
  }

  /**
   * Get hex color for severity level
   */
  private getSeverityColorHex(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#DC2626';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      default:
        return '#808080';
    }
  }

  /**
   * Format email HTML
   */
  private formatEmailHTML(notification: AlertNotification): string {
    const color = this.getSeverityColorHex(notification.severity);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
            .footer { background: #374151; color: white; padding: 15px; text-align: center; border-radius: 0 0 5px 5px; font-size: 12px; }
            .metric { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid ${color}; }
            .label { font-weight: bold; color: #374151; }
            .value { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">${notification.title}</h2>
              <p style="margin: 5px 0 0 0;">Severity: ${notification.severity.toUpperCase()}</p>
            </div>
            <div class="content">
              <p>${notification.message}</p>

              <div class="metric">
                <div><span class="label">Entity:</span> <span class="value">${notification.entityType}: ${notification.entityName}</span></div>
                <div><span class="label">Metric:</span> <span class="value">${notification.metric}</span></div>
                <div><span class="label">Current Value:</span> <span class="value">${notification.currentValue.toFixed(2)}</span></div>
                <div><span class="label">Threshold:</span> <span class="value">${notification.threshold.toFixed(2)}</span></div>
                <div><span class="label">Time:</span> <span class="value">${new Date(notification.createdAt).toLocaleString()}</span></div>
              </div>

              ${
                notification.actionsTaken.length > 0
                  ? `
                <h3>Actions Taken:</h3>
                <ul>
                  ${notification.actionsTaken
                    .map(action => `<li>${action.action} - ${action.status}</li>`)
                    .join('')}
                </ul>
              `
                  : ''
              }
            </div>
            <div class="footer">
              Meta Campaign Automation Platform
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send daily digest email
   */
  async sendDailyDigest(userId: string): Promise<void> {
    // Implementation for daily digest
    logger.info(`Sending daily digest for user: ${userId}`);
    // Aggregate all notifications from the past 24 hours
    // Format and send via email
  }
}

export default new NotificationService();
