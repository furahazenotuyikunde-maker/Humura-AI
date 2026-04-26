export interface NotificationItem {
  id: string;
  type: 'wellness' | 'crisis' | 'progress' | 'therapy' | 'info';
  titleEn: string;
  titleRw: string;
  messageEn: string;
  messageRw: string;
  timeEn: string;
  timeRw: string;
  icon: string;
  color: string;
  link: string;
}

export const addNotification = (notif: Omit<NotificationItem, 'id' | 'timeEn' | 'timeRw'>) => {
  const saved = localStorage.getItem('Humura_notifications_v1');
  let notifications: NotificationItem[] = [];
  
  if (saved) {
    try {
      notifications = JSON.parse(saved);
    } catch (e) {
      notifications = [];
    }
  }

  const newNotif: NotificationItem = {
    ...notif,
    id: Date.now().toString(),
    timeEn: 'Just now',
    timeRw: 'Ubu ngubu'
  };

  // Add to start of array
  const updated = [newNotif, ...notifications];
  
  // Keep only last 20
  localStorage.setItem('Humura_notifications_v1', JSON.stringify(updated.slice(0, 20)));
  
  // Dispatch a storage event so other tabs/components can update
  window.dispatchEvent(new Event('storage'));
};
