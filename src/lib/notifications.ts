import type { HealthLog, Milestone } from '../types/babyMemory';

export interface CareAlert {
  id: string;
  severity: 'urgent' | 'upcoming' | 'info';
  title: string;
  detail: string;
  actionType: 'milestone' | 'medication';
  targetId: string;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function sendLocalPushNotification(title: string, body: string): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        tag: `nurtura-${Date.now()}`,
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function computeActiveAlerts(milestones: Milestone[], healthLogs: HealthLog[]): CareAlert[] {
  const alerts: CareAlert[] = [];

  for (const log of healthLogs) {
    if (log.logType === 'tablet' && !log.completed) {
      alerts.push({
        id: `alert_med_${log.id}`,
        severity: 'urgent',
        title: `Medication Due: ${log.title}`,
        detail: `Scheduled ${log.loggedTime} · ${log.notes || 'Daily tablet reminder'}`,
        actionType: 'medication',
        targetId: log.id,
      });
    }
  }

  for (const ms of milestones) {
    if (ms.status !== 'completed' && ms.reminderEnabled) {
      alerts.push({
        id: `alert_ms_${ms.id}`,
        severity: ms.status === 'overdue' ? 'urgent' : 'upcoming',
        title: ms.title,
        detail: `Week ${ms.weekTarget} · ${ms.scheduledDate} · ${ms.doctorName || 'Clinical Visit'}`,
        actionType: 'milestone',
        targetId: ms.id,
      });
    }
  }

  return alerts;
}
