// Demo Application (demo.ts)
import { OAuthClient, OAUTH_PROVIDERS } from "./client";


const config = {
  clientId: "xw8X14NepGAmrTeLrm3FelB11aGDbBjx",
  clientSecret:
    "Sknr01sm1GhKP5AANYqPn33b3Yi-vulv2Wk6H456-4gNuGFEfz0wp15FPDI3anQF",
  redirectUri: "http://localhost:5500",
  scope: ["openid", "profile", "email"],
  provider: "AUTH0",
  ...OAUTH_PROVIDERS.AUTH0("dev-5qxilm1pa4djhji1.us.auth0.com"),
};

class OAuthDemo {
  private oauthClient: OAuthClient;
  private tokenStorage: Storage;

  constructor() {
    this.oauthClient = new OAuthClient(config);
    this.tokenStorage =
      typeof localStorage !== "undefined" ? localStorage : new Storage();
    this.initializeUI();
  }

  private initializeUI() {
    const loginButton = document.getElementById("login-btn");
    if (loginButton) {
      loginButton.addEventListener("click", () => this.handleLogin());
    }

    // Check if we're handling a callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && state) {
      this.handleCallback({ code, state });
    }
  }

  private async handleLogin() {
    try {
      const authUrl = await this.oauthClient.startAuthFlow();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Login failed:", error);
      this.showError("Failed to initialize login flow");
    }
  }

  private async handleCallback(params: { code: string; state: string }) {
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

  private saveTokens(tokens: any) {
    this.tokenStorage.setItem("access_token", tokens.accessToken);
    if (tokens.refreshToken) {
      this.tokenStorage.setItem("refresh_token", tokens.refreshToken);
    }
    this.tokenStorage.setItem(
      "expires_at",
      String(Date.now() + tokens.expiresIn * 1000)
    );
  }

  private async showUserInfo() {
    const accessToken = this.tokenStorage.getItem("access_token");
    if (!accessToken) return;

    try {
      // show loader
      const userInfo = await this.oauthClient.getUserInfo(accessToken);

      const loginSection = document.getElementById("loginSection");
      const userInfoSection = document.getElementById("userInfo");
      const userName = document.getElementById("userName");
      const userEmail = document.getElementById("userEmail");

      loginSection!.style.display = "none";
      userInfoSection!.classList.add("visible");
      userName!.textContent = userInfo.name;
      userEmail!.textContent = userInfo.email;

      // const userInfoDiv = document.getElementById('user-info');
      // if (userInfoDiv) {
      //     userInfoDiv.innerHTML = `
      //         <h2>Welcome ${userInfo.name}!</h2>
      //         <p>Email: ${userInfo.email}</p>
      //     `;
      // }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  }

  private showError(message: string) {
    const errorDiv = document.getElementById("error-message");
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";
    }
  }
}

// Initialize the demo when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("STARTING")
  new OAuthDemo();
});
