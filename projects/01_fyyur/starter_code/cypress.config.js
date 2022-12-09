const { defineConfig } = require("cypress");

module.exports = defineConfig({
  downloadsFolder: "tests/e2e/cypress/downloads",
  fixturesFolder: "tests/e2e/cypress/fixtures",
  screenshotsFolder: "tests/e2e/cypress/screenshots",
  videosFolder: "tests/e2e/cypress/videos",

  e2e: {
    specPattern: "tests/e2e/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "tests/e2e/cypress/support/e2e.js",
    baseUrl: 'http://127.0.0.1:5000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
