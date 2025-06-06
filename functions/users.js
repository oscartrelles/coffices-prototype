// functions/users.js
// A server-side function
// Get all users from the database
// TODO: Add admin user check.

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.getAllUsers = functions.https.onRequest(async (req, res) => {
  const usersSnapshot = await admin.firestore().collection('users').get();
  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(users);
});