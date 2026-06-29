import Constants from "expo-constants";

type Extra = {
  BACKEND_URL: string;
};

// expoConfig is always defined in new SDKs (Expo Go + builds)
const extra = Constants.expoConfig?.extra as Extra;

export const BACKEND_URL = extra.BACKEND_URL;