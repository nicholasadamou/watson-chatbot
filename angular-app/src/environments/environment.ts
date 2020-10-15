// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  env: "DEV",
  appName: "Watson Chatbot",
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

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
