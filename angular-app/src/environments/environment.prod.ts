export const environment = {
  production: true,
  env: "PROD",
  appName: "Watson Chat",
  reminderTimeout: 5,
  configDefault: {
    showConfidence: true,
    showIntroduction: true,
    showTimestamps: false,
    confidenceThreshold: 0.3,
  },

  // Used to store run-time state.
  state: {
    page: "chat",
    chatInitialized: false,
    embeddedMode: false,
  },
  server: {
    isLocal: false,
    banner: "",
    api: {},
  },
  config: {
    showConfidence: true,
    showIntroduction: true,
    showTimestamps: false,
    confidenceThreshold: 0.3,
  },
  error: false,
};
