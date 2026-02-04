import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const REMINDER_NOTIFICATION_ID = 'daily-reminder';
const REMINDER_HOUR = 9; // 9 AM default
const REMINDER_MINUTE = 0;

class NotificationManager {
  private enabled: boolean = false;
  private reminderTime: { hour: number; minute: number } = { hour: REMINDER_HOUR, minute: REMINDER_MINUTE };

  // Initialize and load saved preferences
  async init(): Promise<void> {
    try {
      const [enabledStr, timeStr] = await Promise.all([
        AsyncStorage.getItem('notificationsEnabled'),
        AsyncStorage.getItem('reminderTime'),
      ]);

      this.enabled = enabledStr === 'true';

      if (timeStr) {
        const [hour, minute] = timeStr.split(':').map(Number);
        this.reminderTime = { hour, minute };
      }

      // Re-schedule if enabled
      if (this.enabled) {
        await this.scheduleDailyReminder();
      }

      console.log('[Notifications] Initialized, enabled:', this.enabled);
    } catch (error) {
      console.error('[Notifications] Failed to initialize:', error);
    }
  }

  // Request permissions
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return false;
    }

    return true;
  }

  // Check if notifications are enabled
  isEnabled(): boolean {
    return this.enabled;
  }

  // Get reminder time
  getReminderTime(): { hour: number; minute: number } {
    return { ...this.reminderTime };
  }

  // Toggle daily reminder
  async toggleDailyReminder(enabled: boolean): Promise<boolean> {
    try {
      if (enabled) {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          console.log('[Notifications] Cannot enable - no permission');
          return false;
        }

        await this.scheduleDailyReminder();
        this.enabled = true;
        await AsyncStorage.setItem('notificationsEnabled', 'true');
        console.log('[Notifications] Daily reminder enabled');
      } else {
        await this.cancelDailyReminder();
        this.enabled = false;
        await AsyncStorage.setItem('notificationsEnabled', 'false');
        console.log('[Notifications] Daily reminder disabled');
      }

      return true;
    } catch (error) {
      console.error('[Notifications] Failed to toggle reminder:', error);
      return false;
    }
  }

  // Set reminder time
  async setReminderTime(hour: number, minute: number): Promise<void> {
    this.reminderTime = { hour, minute };
    await AsyncStorage.setItem('reminderTime', `${hour}:${minute}`);

    if (this.enabled) {
      await this.scheduleDailyReminder();
    }
  }

  // Schedule daily reminder notification
  private async scheduleDailyReminder(): Promise<void> {
    try {
      // Cancel existing
      await this.cancelDailyReminder();

      // Schedule new daily notification
      // Using daily trigger with hour and minute
      await Notifications.scheduleNotificationAsync({
        identifier: REMINDER_NOTIFICATION_ID,
        content: {
          title: '📚 Time to Practice Chinese!',
          body: this.getRandomReminderMessage(),
          data: { type: 'daily-reminder', screen: 'practice' },
          sound: 'notification.wav',
          badge: 1,
        },
        trigger: {
          hour: this.reminderTime.hour,
          minute: this.reminderTime.minute,
          repeats: true,
        } as Notifications.DailyTriggerInput,
      });

      console.log('[Notifications] Scheduled daily reminder at', this.reminderTime);
    } catch (error) {
      console.error('[Notifications] Failed to schedule reminder:', error);
    }
  }

  // Cancel daily reminder
  private async cancelDailyReminder(): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
      console.log('[Notifications] Cancelled daily reminder');
    } catch (error) {
      console.error('[Notifications] Failed to cancel reminder:', error);
    }
  }

  // Get random reminder message
  private getRandomReminderMessage(): string {
    const messages = [
      'Keep your streak going! Practice your vocabulary today.',
      'Daily practice makes perfect. Review your words now!',
      'A few minutes of practice goes a long way. Start now!',
      'Your Chinese vocabulary is waiting. Let\'s review!',
      'Consistency is key! Take a moment to practice today.',
      'New words to learn or old ones to review? Let\'s go!',
      'Your daily dose of Chinese is ready. Practice now!',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Send immediate test notification
  async sendTestNotification(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('[Notifications] Cannot send test - no permission');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Test Notification',
          body: 'Your daily reminders are working!',
          data: { type: 'test' },
        },
        trigger: null, // Immediate
      });

      console.log('[Notifications] Test notification sent');
    } catch (error) {
      console.error('[Notifications] Failed to send test:', error);
    }
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('[Notifications] Failed to get scheduled:', error);
      return [];
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[Notifications] Cancelled all notifications');
    } catch (error) {
      console.error('[Notifications] Failed to cancel all:', error);
    }
  }

  // Get badge count
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('[Notifications] Failed to get badge count:', error);
      return 0;
    }
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('[Notifications] Failed to set badge count:', error);
    }
  }

  // Clear badge
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();

// Convenience function for notification response handling
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Convenience function for notification received handling
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}
