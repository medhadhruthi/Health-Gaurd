/**
 * reminderUtils.js
 * Browser-based reminder scheduling using Web Notification API.
 * Reminders fire while the tab is open (browser limitation).
 * Timers are stored in module-level Maps to survive React re-renders.
 */

// Map of taskId -> { timerId, intervalId }
const scheduledTimers = new Map();

/**
 * Request notification permission if not already granted.
 * @returns {Promise<boolean>}
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

/**
 * Show a browser notification (falls back silently if permission not granted).
 * @param {string} title
 * @param {string} body
 */
function showNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.svg' });
  }
}

/**
 * Parse "HH:MM" time string into today's (or tomorrow's) Date object.
 * @param {string} timeStr  e.g. "08:30"
 * @returns {Date}
 */
function getNextOccurrence(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target <= now) {
    // already passed today — schedule for tomorrow
    target.setDate(target.getDate() + 1);
  }
  return target;
}

/**
 * Schedule a one-time reminder for a task.
 * @param {object} task  Full task object with id, title, reminderTime
 */
function scheduleOneTime(task) {
  const target = getNextOccurrence(task.reminderTime);
  const delay = target.getTime() - Date.now();
  const timerId = setTimeout(() => {
    showNotification(`⏰ Reminder: ${task.title}`, task.description || task.category || 'Time to complete your task!');
    scheduledTimers.delete(task.id);
  }, delay);
  scheduledTimers.set(task.id, { timerId, intervalId: null });
}

/**
 * Schedule a daily repeating reminder for a task.
 * If task is still incomplete, an additional reminder fires 1 hour later.
 * @param {object} task       Full task object
 * @param {Function} isTaskIncomplete  () => boolean — checked at fire time
 */
function scheduleDaily(task, isTaskIncomplete) {
  const fireReminder = () => {
    if (task.completed) return; // already done, skip
    showNotification(`⏰ Daily Reminder: ${task.title}`, task.description || task.category || 'Don\'t forget your daily task!');

    // If still incomplete, send a follow-up after 1 hour
    setTimeout(() => {
      if (isTaskIncomplete && isTaskIncomplete()) {
        showNotification(`🔔 Follow-up: ${task.title}`, 'You still haven\'t completed this task. You\'ve got this!');
      }
    }, 60 * 60 * 1000); // 1 hour
  };

  // Fire on first occurrence today (or tomorrow if time passed)
  const target = getNextOccurrence(task.reminderTime);
  const initialDelay = target.getTime() - Date.now();

  const timerId = setTimeout(() => {
    fireReminder();
    // Then every 24 hours
    const intervalId = setInterval(fireReminder, 24 * 60 * 60 * 1000);
    const existing = scheduledTimers.get(task.id) || {};
    scheduledTimers.set(task.id, { ...existing, intervalId });
  }, initialDelay);

  scheduledTimers.set(task.id, { timerId, intervalId: null });
}

/**
 * Schedule a reminder for a task based on its reminderType.
 * @param {object} task         Full task object
 * @param {Function} [isTaskIncomplete]  Used for daily repeating follow-up
 */
export function scheduleReminder(task, isTaskIncomplete) {
  if (!task || !task.reminderEnabled || task.reminderType === 'none') return;
  if (!task.reminderTime) return;

  // Cancel any existing reminder for this task first
  cancelReminder(task.id);

  requestNotificationPermission().then((granted) => {
    if (!granted) {
      console.warn('Notification permission not granted. Reminders will not fire.');
      return;
    }
    if (task.reminderType === 'one-time') {
      scheduleOneTime(task);
    } else if (task.reminderType === 'daily') {
      scheduleDaily(task, isTaskIncomplete);
    }
  });
}

/**
 * Cancel all scheduled timers for a task.
 * @param {string} taskId
 */
export function cancelReminder(taskId) {
  const entry = scheduledTimers.get(taskId);
  if (!entry) return;
  if (entry.timerId != null) clearTimeout(entry.timerId);
  if (entry.intervalId != null) clearInterval(entry.intervalId);
  scheduledTimers.delete(taskId);
}

/**
 * Re-schedule all active reminders (call on app load after tasks are loaded).
 * @param {Array} tasks
 * @param {Function} isTaskIncomplete  (taskId) => boolean
 */
export function rescheduleAllReminders(tasks, isTaskIncomplete) {
  if (!Array.isArray(tasks)) return;
  tasks.forEach((task) => {
    if (task.reminderEnabled && !task.completed && task.reminderType !== 'none') {
      scheduleReminder(task, () => isTaskIncomplete(task.id));
    }
  });
}
