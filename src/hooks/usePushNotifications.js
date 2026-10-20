import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const PUBLIC_VAPID_KEY = 'BOf4cQCRE4cGbAW6GyMV9EOENRC5YUmjQ5GCjws1kLZJEx1NRTyQDYoh5GUdR5d4FVs7M64S6k56X6ngQQcBA';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const registration = await navigator.serviceWorker.register('/sw.js');
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(!!subscription);
    setLoading(false);
  };

  const subscribe = async () => {
    if (!user) return alert('Please sign in first.');
    
    try {
      setLoading(true);
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Permission denied');

      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      const subJSON = subscription.toJSON();

      // Save to Supabase
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth
      }, { onConflict: 'user_id, endpoint' });

      if (error) throw error;
      setIsSubscribed(true);
    } catch (err) {
      console.error(err);
      alert('Failed to enable notifications: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
      setIsSubscribed(false);
    }
  };

  return { isSubscribed, loading, subscribe, unsubscribe };
}