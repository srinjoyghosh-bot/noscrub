// Demo Application (demo.js)
import { OAuthClient, OAUTH_PROVIDERS } from "./client.js";
import { CookieManager } from "./cookie.js";

// TODO use environment variables
const config = {
  clientId: "UhoWTEGL6ni8OkxiKrAlypLwzk2fLNeW",
  clientSecret:
    "vmBdYcZJBR_vjrKWsvJcd93jvOhbORXb32vr-0wo9ZYM-5PJcFPY3zF0ZVdc17aL",
  redirectUri: "http://localhost:5500/login.html",
  scope: ["openid", "profile", "email"],
  provider: "AUTH0",
  ...OAUTH_PROVIDERS.AUTH0("dev-5qxilm1pa4djhji1.us.auth0.com"),
};

class OAuthDemo {
  constructor() {
    this.oauthClient = new OAuthClient(config);
    this.initializeUI();
  }

  initializeUI() {
    const loginButton = document.getElementById("login-btn");
    if (loginButton) {
      loginButton.addEventListener("click", () => this.handleLogin());
    }

    // Check if we're handling a callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const isLoggedIn =
      CookieManager.hasCookie("access_token") &&
      !CookieManager.isExpired("access_token");
    
    console.log("access token",CookieManager.hasCookie("access_token") );
    console.log("access token expired?",CookieManager.isExpired("access_token"));
    
    

    if (code && state) {
      this.handleCallback({ code, state });
    } else if (isLoggedIn) {
      this.showUserInfo();
    }
  }

  async handleLogin() {
    if(this.isLoading()) return;
    try {
      this.hideError();
      const authUrl = await this.oauthClient.startAuthFlow();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Login failed:", error);
      this.showError("Failed to initialize login flow");
    }
  }

  async handleCallback(params) {
    try {
      this.startLoader();
      const tokens = await this.oauthClient.handleCallback(params);
      this.saveTokens(tokens);
      this.showUserInfo();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error("Callback handling failed:", error);
      this.showError("Authentication failed");
    } finally {
      this.stopLoader();
      // CookieManager.deleteCookie("oauth_state");
      // CookieManager.deleteCookie("oauth_code_verifier");
    }
  }

  saveTokens(tokens) {
    CookieManager.setCookie("access_token", tokens.accessToken);
    if (tokens.refreshToken) {
      CookieManager.setCookie("refresh_token", tokens.refreshToken);
    }
  }

  async showUserInfo() {
    const accessToken = CookieManager.getCookie("access_token");
    if (!accessToken) {
      this.showError("No access token found");
      return;
    }

    try {
      this.startLoader();
      const userInfo = await this.oauthClient.getUserInfo(accessToken);

      const loginSection = document.getElementById("loginSection");
      const userInfoSection = document.getElementById("userInfo");
      const userName = document.getElementById("userName");
      const userEmail = document.getElementById("userEmail");
      const logoutButton = document.getElementById("logoutBtn");

      loginSection.style.display = "none";
      userInfoSection.classList.add("visible");
      userName.textContent = userInfo.name;
      userEmail.textContent = userInfo.email;
      logoutButton.addEventListener("click", () => {
        window.location.href = `${config.logoutEndpoint}?client_id=${config.clientId}`;
        const loginSection = document.getElementById("loginSection");
        const userInfoSection = document.getElementById("userInfo");

        loginSection.style.display = "block";
        userInfoSection.classList.remove("visible");

        // clean up cookies
        CookieManager.deleteCookie("access_token");
        CookieManager.deleteCookie("oauth_state");
        CookieManager.deleteCookie("oauth_code_verifier");
      });
      this.stopLoader();
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      this.showError(error.message);
    }
  }

  startLoader() {
    const loader = document.getElementById("loader");
    loader.style.display = "block";
  }

  stopLoader() {
    const loader = document.getElementById("loader");
    loader.style.display = "none";
  }

  isLoading(){
    const loader = document.getElementById("loader");
    return loader.style.display === "block";
  }

  showError(message) {
    const errorContainer = document.getElementById("errorContainer");
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.textContent = message;
    errorContainer.classList.add("visible");
    document
      .getElementById("closeError")
      .addEventListener("click", () => this.hideError());
  }
  hideError() {
    const errorContainer = document.getElementById("errorContainer");
    errorContainer.classList.remove("visible");
  }
}

// Initialize the demo when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("STARTING");
  new OAuthDemo();
});
