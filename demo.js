// Demo Application (demo.js)
import { OAuthClient, OAUTH_PROVIDERS } from "./client.js";

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
    this.tokenStorage =
      typeof localStorage !== "undefined" ? localStorage : new Storage();
    this.initializeUI();
  }

  initializeUI() {
    const loginButton = document.getElementById("login-btn");
    if (loginButton) {
      loginButton.addEventListener("click", () => this.handleLogin());
    }

    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
      logoutButton.addEventListener("click", () => this.handleLogout());
    }

    // Check if we're handling a callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && state) {
      this.handleCallback({ code, state });
    }
  }

  async handleLogin() {
    try {
      this.hideError();
      const authUrl = await this.oauthClient.startAuthFlow();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Login failed:", error);
      this.showError("Failed to initialize login flow");
    }
  }

  async handleLogout() {
    try {
      this.hideError();
      this.startLoader();
      await this.oauthClient.logoutUser();
      // TODO:  show login section
      // TODO:  hide user info section
      this.stopLoader();
    } catch (error) {
      console.error("Logout failed:", error);
      this.showError("Failed to log user out");
    }
  }

  async handleCallback(params) {
    try {
      const tokens = await this.oauthClient.handleCallback(params);
      this.saveTokens(tokens);
      this.showUserInfo();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error("Callback handling failed:", error);
      this.showError("Authentication failed");
    }
  }

  saveTokens(tokens) {
    this.tokenStorage.setItem("access_token", tokens.accessToken);
    if (tokens.refreshToken) {
      this.tokenStorage.setItem("refresh_token", tokens.refreshToken);
    }
    this.tokenStorage.setItem(
      "expires_at",
      String(Date.now() + tokens.expiresIn * 1000)
    );
  }

  async showUserInfo() {
    const accessToken = this.tokenStorage.getItem("access_token");
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
