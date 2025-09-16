import Constants from "expo-constants";

type Extra = {
  FSQ_KEY: string;
};

// expoConfig is always defined in new SDKs (Expo Go + builds)
const extra = Constants.expoConfig?.extra as Extra;

export const FSQ_KEY = extra.FSQ_KEY;