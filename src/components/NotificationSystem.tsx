'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export default function NotificationSystem({ notifications, onDismiss }: NotificationSystemProps) {
  // Auto-dismiss notifications after their duration
  useEffect(() => {
    const timers = notifications.map(notification => {
      if (notification.duration) {
        return setTimeout(() => {
          onDismiss(notification.id);
        }, notification.duration);
      }
      return null;
    });

    return () => {
      timers.forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div 
          key={notification.id} 
          className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ease-in-out ${
            notification.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' : 
            notification.type === 'error' ? 'bg-red-50 text-red-800 border-l-4 border-red-500' : 
            'bg-blue-50 text-blue-800 border-l-4 border-blue-500'
          }`}
        >
          <div className="flex items-center">
            {notification.type === 'success' && (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
            )}
            {notification.type === 'error' && (
              <XCircleIcon className="h-5 w-5 text-red-500 mr-3" />
            )}
            {notification.type === 'info' && (
              <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-3" />
            )}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button 
            onClick={() => onDismiss(notification.id)}
            className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: NotificationType = 'info', duration: number = 5000) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    addSuccessNotification: (message: string, duration?: number) => 
      addNotification(message, 'success', duration),
    addErrorNotification: (message: string, duration?: number) => 
      addNotification(message, 'error', duration),
    addInfoNotification: (message: string, duration?: number) => 
      addNotification(message, 'info', duration),
  };
}
