// Replace the placeholder values below with the Firebase web app config
// from Project settings > General > Your apps.
export const firebaseConfig = {
  apiKey: "AIzaSyDS9lA7nHq2xXoJ4Ip9_YqTGh3LzoM-r2A",
  authDomain: "ppec-pin-preorder.firebaseapp.com",
  projectId: "ppec-pin-preorder",
  storageBucket: "ppec-pin-preorder.firebasestorage.app",
  messagingSenderId: "429893079137",
  appId: "1:429893079137:web:c7d41ea5214f2dbfc99a20"
};

// Admin dashboard access is checked in the page and enforced again by
// Firestore security rules. Keep this list in sync with firestore.rules.
export const adminEmails = [
  "nickpatel.trainer@gmail.com"
];

export const collectionName = "interestSubmissions";
export const unitPricePence = 300;
export const plannedPostagePence = 200;
export const actualPostageCostPence = 155;

// Payment fees are calculated per order/submission against badges plus
// planned postage, not per individual pin.
export const kofiFeeRate = 0.05;
export const paypalFeeRate = 0.029;
export const paypalFixedFeePence = 30;
