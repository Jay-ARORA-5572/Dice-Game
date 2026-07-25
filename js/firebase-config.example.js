// Copy this file to js/firebase-config.js and fill in your own Firebase
// project's values (Firebase console → Project settings → General → Your apps).
//
// These web config values aren't secret credentials — Firebase apps are
// designed to ship them client-side — so js/firebase-config.js is safe to
// commit. Real access control is enforced by database.rules.json.

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
