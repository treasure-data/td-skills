/**
 * Notification Component
 * Displays success/error messages
 */

import React, { useEffect } from 'react';

export interface NotificationProps {
  type: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`notification notification-${type}`}>
      <button className="notification-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <div className="notification-title">{title}</div>
      <div className="notification-message">{message}</div>
    </div>
  );
};

export default Notification;
