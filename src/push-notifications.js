const { Expo } = require("expo-server-sdk");

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
let expo = new Expo({
  // accessToken: process.env.EXPO_ACCESS_TOKEN, // Not activated for now. Check https://expo.dev/accounts/strobbo/settings/access-tokens
  useFcmV1: true, // Needed - https://expo.dev/accounts/strobbo/projects/strobbo-mobile/credentials/android/com.sfen.strobbomobile
});

async function sendPushNotification(pushTokens, message) {
  let messages = [];
  for (let pushToken of pushTokens) {
    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
    messages.push({
      to: pushToken,
      sound: "default",
      title: message.title || "Default title",
      body: message.body || "This is a default test notification",
      data: message.data,
      ...message,
    });
  }

  const chunks = expo.chunkPushNotifications(messages);

  for (let chunk of chunks) {
    try {
      // Not handling tickets for now. Check https://github.com/expo/expo-server-sdk-node how to handle later
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log("ticketChunk :", ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = sendPushNotification;
