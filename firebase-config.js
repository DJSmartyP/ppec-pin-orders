// Replace the placeholder values below with the Firebase web app config
// from Project settings > General > Your apps.
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Admin dashboard access is checked in the page and enforced again by
// Firestore security rules. Keep this list in sync with firestore.rules.
export const adminEmails = [
  "your-admin-email@example.com"
];

export const collectionName = "interestSubmissions";
export const unitPricePence = 300;
