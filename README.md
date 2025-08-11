# Coffices - Find Your Perfect Remote Work Coffee Shop

A web application that helps remote workers find and rate coffee shops based on work-friendly criteria like WiFi quality, power outlet availability, coffee quality, and noise levels.

## ✨ Features

- **Smart Coffee Shop Discovery**: Find nearby coffee shops optimized for remote work
- **Comprehensive Ratings**: Rate shops on WiFi, power outlets, coffee quality, and noise
- **Interactive Map**: Google Maps integration with custom markers and clustering
- **User Profiles**: Track your ratings and favorite coffee shops
- **Social Sharing**: Rich previews when sharing links on social media
- **Progressive Web App**: Works offline with service worker caching
- **Admin Dashboard**: Manage users, ratings, and coffee shop data

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Firebase project with Firestore, Hosting, and Functions
- Google Maps API key
- Google Places API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd coffices-prototype
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Configure environment**
   - Copy `src/config/apiKeys.example.js` to `src/config/apiKeys.js`
   - Add your API keys
   - Configure Firebase in `src/firebaseConfig.js`

4. **Start development server**
   ```bash
   npm start
   ```

5. **Deploy to Firebase**
   ```bash
   # Deploy functions
   firebase deploy --only functions
   
   # Deploy hosting
   firebase deploy --only hosting:staging
   ```

## 🏗️ Architecture

### Frontend
- **React 18** with functional components and hooks
- **Material-UI** for consistent, beautiful UI components
- **Google Maps API** for interactive mapping
- **Firebase SDK** for real-time data and authentication

### Backend
- **Firebase Functions** for server-side logic
- **Firestore** for real-time database
- **Firebase Hosting** for static file serving
- **Firebase Auth** for user authentication

### Key Components

- **Map Component**: Interactive map with custom markers and clustering
- **Search & Filter**: Location-based search with work-friendly criteria
- **Rating System**: Multi-category rating system for coffee shops
- **User Management**: Authentication, profiles, and preferences
- **Admin Dashboard**: User and content management tools

## 🔧 Configuration

### Firebase Setup

1. **Create Firebase Project**
   ```bash
   firebase init
   ```

2. **Enable Services**
   - Firestore Database
   - Firebase Functions
   - Firebase Hosting
   - Firebase Authentication

3. **Configure Hosting**
   ```json
   {
     "hosting": {
       "targets": {
         "staging": {
           "rewrites": [
             {
               "source": "/coffice/**",
               "function": "dynamicMetaTags"
             },
             {
               "source": "/profile/**",
               "function": "dynamicMetaTags"
             }
           ]
         }
       }
     }
   }
   ```

### API Keys

Required API keys in `src/config/apiKeys.js`:
- `GOOGLE_MAPS_API_KEY`: Google Maps JavaScript API
- `GOOGLE_PLACES_API_KEY`: Google Places API
- `GOOGLE_ANALYTICS_ID`: Google Analytics tracking ID

## 📱 Social Media Integration

The app includes a sophisticated social media preview system:

- **Dynamic Meta Tags**: Firebase Functions generate rich previews for social platforms
- **Crawler Detection**: Automatically serves appropriate content for bots vs users
- **Rich Previews**: WhatsApp, Twitter, LinkedIn, and Facebook show coffice details
- **Deeplink Support**: Regular users can access direct links without issues

### Testing Social Previews

```bash
# Test as WhatsApp crawler
curl -H "User-Agent: WhatsApp/2.23.24.78 A" \
  "https://your-domain.com/coffice/ChIJT4KQeOjJBZERvE9arN9k-Es"

# Test as regular user
curl -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" \
  "https://your-domain.com/coffice/ChIJT4KQeOjJBZERvE9arN9k-Es"
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Performance Testing
```bash
npm run lighthouse
```

## 📊 Performance

- **Lighthouse Score**: 90+ across all categories
- **Bundle Size**: Optimized with code splitting and lazy loading
- **Service Worker**: Offline-first approach with intelligent caching
- **Image Optimization**: Lazy loading and WebP format support

## 🔒 Security

- **Firebase Security Rules**: Comprehensive Firestore and Storage rules
- **Input Validation**: Client and server-side validation
- **Rate Limiting**: Built-in Firebase Functions rate limiting
- **Authentication**: Secure user authentication with Firebase Auth

## 🚀 Deployment

### Staging Environment
```bash
npm run build
firebase deploy --only hosting:staging --project staging
firebase deploy --only functions --project staging
```

### Production Environment
```bash
npm run build
firebase deploy --only hosting:production --project production
firebase deploy --only functions --project production
```

## 📚 Documentation

- [Social Sharing Implementation](./docs/SOCIAL_SHARING_IMPLEMENTATION.md)
- [Firebase Functions Setup](./docs/FIREBASE_FUNCTIONS_SETUP.md)
- [Map Performance Optimization](./docs/MAP_PERFORMANCE_OPTIMIZATION_PLAN.md)
- [Analytics Implementation](./docs/ANALYTICS_IMPLEMENTATION.md)
- [Security Assessment](./docs/SECURITY_VULNERABILITY_ASSESSMENT.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Maps API** for mapping functionality
- **Firebase** for backend services
- **Material-UI** for beautiful UI components
- **Create React App** for project scaffolding

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review Firebase console logs for debugging

---

**Built with ❤️ for the remote work community**
