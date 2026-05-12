module.exports = {
   testEnvironment: 'node',
   verbose: true,
   setupFilesAfterEnv: [
      './test/setup/setupTestDB.js'
   ]
};