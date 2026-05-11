module.exports = {

   testEnvironment: 'node',

   verbose: true,

   setupFilesAfterEnv: [
      './src/tests/setup/setupTestDB.js'
   ]
};