// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://ef8a751eb2132e62a2bba7967a08a09b@o4511950935228416.ingest.de.sentry.io/4511950952071248",

  // Only a real Vercel deployment reports here -- without this, running
  // `npm run start` locally to QA a change (this project's own established
  // way of testing against a production build) sends every error straight
  // into the same Sentry project as real users, indistinguishable from an
  // actual incident.
  enabled: process.env.VERCEL === "1",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});
