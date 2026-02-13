import { useEffect } from 'react';
import pusherClient from '@/lib/pusher';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/**
 * useRealtime Hook
 * @param {string} channelName - The channel to subscribe to (e.g., 'admin-updates')
 * @param {Object} events - Object mapping event names to callbacks
 */
export const useRealtime = (channelName, events = {}) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!channelName) return;

    const channel = pusherClient.subscribe(channelName);

    // Bind all events
    Object.entries(events).forEach(([eventName, callback]) => {
      channel.bind(eventName, (data) => {
        // Automatically log events in dev
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Realtime] ${channelName}:${eventName}`, data);
        }
        
        // Execute callback
        if (callback) callback(data);
      });
    });

    return () => {
      // Unbind all events and unsubscribe
      Object.keys(events).forEach((eventName) => {
        channel.unbind(eventName);
      });
      pusherClient.unsubscribe(channelName);
    };
  }, [channelName, events, queryClient]);

  // Helper to invalidate queries on event
  const invalidate = (queryKey) => {
    queryClient.invalidateQueries(queryKey);
  };

  return { invalidate };
};
