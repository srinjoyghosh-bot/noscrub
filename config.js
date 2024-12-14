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
