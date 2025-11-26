'use client';

import { useEffect } from 'react';

export default function MaintenanceChecker() {
  useEffect(() => {
    // Check for due maintenance reminders on component mount
    const checkReminders = async () => {
      try {
        const response = await fetch('/api/maintenance/check-reminders', {
          method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.sent > 0) {
          console.log(`[MaintenanceChecker] Sent ${result.sent} maintenance reminders`);
        }
      } catch (error) {
        console.error('[MaintenanceChecker] Error checking reminders:', error);
      }
    };

    checkReminders();

    // Optional: Set up interval to check periodically (every 5 minutes)
    const interval = setInterval(checkReminders, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // This component doesn't render anything visible
  return null;
}
