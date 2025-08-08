# Firebase Functions Setup Guide

This guide will help you deploy the Firebase Functions to handle Google Places API calls server-side.

## 🚀 **Step 1: Install Firebase CLI (if not already installed)**

```bash
npm install -g firebase-tools
```

## 🔐 **Step 2: Login to Firebase**

```bash
firebase login
```

## 📁 **Step 3: Initialize Firebase Functions (if not already done)**

```bash
firebase init functions
```

When prompted:
- Choose "Use an existing project"
- Select your Firebase project
- Choose "JavaScript"
- Say "No" to ESLint
- Say "Yes" to installing dependencies

## 🔑 **Step 4: Set Google Maps API Key**

Set your Google Maps API key as a Firebase Function configuration:

```bash
firebase functions:config:set google.maps_api_key="YOUR_GOOGLE_MAPS_API_KEY"
```

Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key.

## 📦 **Step 5: Install Dependencies**

Navigate to the functions directory and install dependencies:

```bash
cd functions
npm install
```

## 🧪 **Step 6: Test Locally (Optional)**

```bash
firebase emulators:start --only functions
```

## 🚀 **Step 7: Deploy Functions**

```bash
firebase deploy --only functions
```

## ✅ **Step 8: Verify Deployment**

After deployment, you should see URLs like:
- `https://us-central1-YOUR-PROJECT.cloudfunctions.net/nearbySearch`
- `https://us-central1-YOUR-PROJECT.cloudfunctions.net/getPlaceDetails`
- `https://us-central1-YOUR-PROJECT.cloudfunctions.net/batchGetPlaceDetails`

## 🔧 **Step 9: Update Frontend**

The frontend code is already updated to use the new Firebase Functions. The `placesApiService.js` will automatically call the deployed functions.

## 🎯 **Step 10: Test the Application**

1. Refresh your app
2. Check the browser console for logs like:
   - `🧪 Testing Firebase Functions`
   - `✅ Firebase Functions working, found X places`
   - `🔍 Using Firebase Functions for nearby search`

## 🛠️ **Troubleshooting**

### **Error: "Functions not found"**
- Make sure you're logged into the correct Firebase project
- Check that functions are deployed: `firebase functions:list`

### **Error: "API key not found"**
- Verify the config is set: `firebase functions:config:get`
- Redeploy after setting config: `firebase deploy --only functions`

### **Error: "Permission denied"**
- Make sure your Google Maps API key has the Places API enabled
- Check that billing is enabled for your Google Cloud project

### **Error: "Quota exceeded"**
- Check your Google Cloud Console for API usage
- Consider implementing more aggressive caching

## 📊 **Monitoring**

Monitor your functions:
```bash
firebase functions:log
```

## 💰 **Cost Optimization**

The Firebase Functions will help reduce costs by:
- ✅ **Server-side caching** (reduces API calls)
- ✅ **Batch processing** (fewer individual requests)
- ✅ **Error handling** (prevents failed requests from counting)
- ✅ **Rate limiting** (respects Google's limits)

## 🔄 **Next Steps**

Once deployed, your app will:
1. **Load rated coffices** from your database (no API cost)
2. **Load nearby places** via Firebase Functions (server-side API calls)
3. **Cache results** to reduce future API calls
4. **Handle errors gracefully** with fallbacks

The map should now show both rated coffices and nearby coffee shops! 🎉 