import userQueries from './userQueries.js';
import sessionQueries from './sessionQueries.js';
import userTypeQueries from './userTypeQueries.js';
import authSecurityQueries from './authSecurityQueries.js';

export {
  userQueries,
  sessionQueries,
  userTypeQueries,
  authSecurityQueries
};

// Legacy support - export the combined authqueries object
export const authqueries = {
  ...userQueries,
  ...sessionQueries,
  ...userTypeQueries,
  ...authSecurityQueries
};

export default authqueries;