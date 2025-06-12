# Coffice App

A react application, to help people find a good workplace for the day, with others, and great coffee and wifi.

## Project Setup 

### `npm install`

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
You may also see any lint errors in the console.

### `npm run build`

Gets the app ready for a production deploy.

The development public server is:
https://find-a-coffice.web.app

Dependencies:

Google Cloud: https://console.cloud.google.com/apis/api/cloudaicompanion.googleapis.com/metrics?inv=1&invt=AbzUGA&project=find-a-coffice 

Firebase: https://console.firebase.google.com/project/find-a-coffice/overview

## Architecture and Components

The user can login with Google OAuth and via Email.
They can also use it without being logged in. 
Additional Admin functionality available to those with admin rights.

(See: src/components)
Listed in page visible order.

Header.js  
SearchBar.js    - Find a coffice by typing into the search bar. 
                - A drop down of results is displayed, and each is selectable. 
                - On selecting the map centres on the venue. Displays its icon, and pops-up PlaceDetails.

Map.js          - View all the coffices nearby your current location indicated by a flashing icon.
PlaceDetails.js - When a map pin is clicked we see the PlaceDetails

Modal.js  
Place.js        - For deep linking.
RatingForm.js   - To rate you need to be signed in.

Footer.js       - Social and other connectivity.

Admin.js        - See how many users, coffices, and ratings have been added, and edit them.
---------------------------

## Datastorage 

We are using Firebase's, Cloud Firestore.

We do not seem to have an export of the tables at the moment, so describing them here.

### "coffices" table

In addition to documentId we have the following fields

coffee 5              (number)
noise 3               (number)
wifi 1
power 1 (number)

comment "it's great"  (string)

placeId "ChIJ2b4PJZT3cg0Rk-a53w_m-xc" (string)
timestamp "2025-02-07T18:44:39.401Z" (string)
userId "Lzk2Z76GodfhIikKkRZNR1QsshW2" (string)

### "ratings" table

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

First; install with:

### `npm install`

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
