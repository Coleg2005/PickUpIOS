# PickUp

PickUp is a mobile app for organizing pickup sports games, built with a React Native/Expo frontend and a Node/Express/MongoDB backend.

## Project Structure

```
backend/    Node.js + Express API, MongoDB (Mongoose), Socket.IO for realtime features
frontend/   React Native app built with Expo Router
```

## Backend

**Stack:** Express 5, Mongoose, Socket.IO, JWT auth, bcrypt, Cloudinary (media), Nodemailer (email), Expo Server SDK (push notifications), Sentry (error tracking).

```bash
cd backend
npm install
cp .env.example .env   # fill in required values
npm start
```

## Frontend

**Stack:** Expo (SDK 54), Expo Router, React Native 0.81, React Navigation, Zustand (state), Socket.IO client, React Native Maps.

```bash
cd frontend
npm install
cp .env.example .env   # fill in required values
npm start
```

Then use the Expo CLI output to open the app in iOS Simulator, Android Emulator, or Expo Go.

Other useful scripts:

```bash
npm run ios      # start with iOS simulator
npm run android  # start with Android emulator
npm run web      # start web preview
npm run lint     # run ESLint
```

## Environment Variables

Both `backend` and `frontend` have `.env.example` files documenting the required environment variables for each environment (dev/prod). Copy them to `.env` and fill in real values before running either app.
