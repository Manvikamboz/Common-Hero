import { getAdminServices } from './firebase-admin';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * sendPushNotification
 * Queries a user document from the 'users' Firestore collection,
 * retrieves their registered 'fcmToken', and dispatches a push notification via FCM.
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    if (!userId || userId === 'anonymous') {
      return { success: false, error: 'Cannot send notification to anonymous user' };
    }

    const { adminDb, adminMessaging } = await getAdminServices();

    // 1. Fetch user doc
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.warn(`[Push Notification] User profile not found for uid: ${userId}`);
      return { success: false, error: 'User profile not found' };
    }

    const userData = userDoc.data() || {};
    const fcmToken = userData.fcmToken;

    if (!fcmToken) {
      console.info(`[Push Notification] No fcmToken registered for user: ${userId}. Skipping push notification.`);
      return { success: true };
    }

    // 2. Build message payload
    const message = {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
    };

    console.info(`[Push Notification] Sending FCM payload to user ${userId} (Token: ${fcmToken.slice(0, 10)}...)...`);
    const messageId = await adminMessaging.send(message);
    console.info(`[Push Notification] Successfully sent FCM message, messageId: ${messageId}`);

    return { success: true, messageId };
  } catch (error: any) {
    console.error(`[Push Notification] Error sending FCM message to user ${userId}:`, error);
    return { success: false, error: error.message || 'FCM dispatch failed' };
  }
}
