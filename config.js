/**
 * OAUTH2 Configuration
 * 
 * @typedef {Object} Config
 * @property {string} clientId - The OAuth client ID
 * @property {string} redirectUri - The callback URL
 * @property {string[]} scope - Array of permission scopes
 * @property {string} authorizationEndpoint - Authorization URL
 * @property {string} provider - chosen OAUTH2 provider 
 * @property {string} tokenEndpoint - Token fetch and refresh URL
 * @property {string} userEndpoint - URL for fetching user info
 * @property {string} logoutEndpoint - URL for user logout
 */
const config = {
  clientId: "UhoWTEGL6ni8OkxiKrAlypLwzk2fLNeW",
  redirectUri: "http://localhost:5500/login.html",
  scope: ["openid", "profile", "email","offline_access"],
  provider: "AUTH0",
  authorizationEndpoint: `https://dev-5qxilm1pa4djhji1.us.auth0.com/authorize`,
  tokenEndpoint: `https://dev-5qxilm1pa4djhji1.us.auth0.com/oauth/token`,
  userEndpoint: `https://dev-5qxilm1pa4djhji1.us.auth0.com/authorize/userInfo`,
  logoutEndpoint: `https://dev-5qxilm1pa4djhji1.us.auth0.com/v2/logout`,
};

export { config };
