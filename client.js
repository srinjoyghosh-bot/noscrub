import { CookieManager } from "./cookie.js";

class OAuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "OAuthError";
    this.code = code;
  }
}

class OAuthClient {
  constructor(config) {
    this.config = config;
    if (CookieManager.hasCookie("oauth_state")) {
      this.state = CookieManager.getCookie("oauth_state");
      console.log("state cookie present", this.state);
    } else {
      this.state = this.generateState();
      CookieManager.setCookie("oauth_state", this.state);
      console.log("new state cookie", this.state);
    }
    if (CookieManager.hasCookie("oauth_code_verifier")) {
      this.codeVerifier = CookieManager.getCookie("oauth_code_verifier");
      console.log("code verifier cookie present", this.codeVerifier);
    } else {
      this.codeVerifier = this.generateCodeVerifier();
      CookieManager.setCookie("oauth_code_verifier", this.codeVerifier);
      console.log("new cookie code verifier", this.codeVerifier);
    }
  }

  generateState() {
    return Math.random().toString(36).substring(2, 15);
  }

  generateCodeVerifier() {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const length = 128;
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  async generateCodeChallenge(verifier) {
    // Convert verifier string to UTF-8 encoded Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);

    // Generate SHA-256 hash
    const hash = await crypto.subtle.digest("SHA-256", data);

    // Convert hash to Base64URL string
    const hashArray = Array.from(new Uint8Array(hash));
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));

    // Convert Base64 to Base64URL by replacing characters
    return hashBase64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  async startAuthFlow() {
    const codeChallenge = await this.generateCodeChallenge(this.codeVerifier);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(" "),
      state: this.state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return `${this.config.authorizationEndpoint}?${params.toString()}`;
  }

  async handleCallback(params) {
    if (params.state !== this.state) {
      console.log("param state", params.state);
      console.log("this state", this.state);
      throw new OAuthError("Invalid state parameter", "invalid_state");
    }

    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      code_verifier: this.codeVerifier,
    });

    try {
      const response = await fetch(this.config.tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenParams.toString(),
      });

      if (!response.ok) {
        throw new OAuthError("Token request failed", "token_request_failed");
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        scope: data.scope,
      };
    } catch (error) {
      throw new OAuthError(
        error instanceof Error ? error.message : "Unknown error occurred",
        "token_request_failed"
      );
    }
  }

  async refreshToken(refreshToken) {
    const tokenParams = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.config.clientId,
    });

    try {
      const response = await fetch(this.config.tokenEndpoint, {
        method: "None",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenParams.toString(),
      });

      if (!response.ok) {
        throw new OAuthError("Token refresh failed", "refresh_token_failed");
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
        scope: data.scope,
      };
    } catch (error) {
      throw new OAuthError(
        error instanceof Error ? error.message : "Unknown error occurred",
        "refresh_token_failed"
      );
    }
  }

  async getUserInfo(access_token) {
    try {
      const response = await fetch(this.config.userEndpoint, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      if (!response.ok) {
        throw new OAuthError(
          "User info fetch failed",
          "user_info_fetch_failed"
        );
      }
      const userInfo = await response.json();
      return {
        name: userInfo.name,
        email: userInfo.email,
      };
    } catch (error) {
      throw new OAuthError(
        error instanceof Error ? error.message : "Unknown error occurred",
        "user_info_fetch_failed"
      );
    }
  }

  async logoutUser() {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      returnTo: "http://localhost:5500/login.html",
    });
    try {
      const response = await fetch(
        `${this.config.logoutEndpoint}?${params.toString()}`
      );
      if (!response.ok) {
        throw new OAuthError("User logout failed", "user_logout_failed");
      }
    } catch (error) {
      throw new OAuthError(
        error instanceof Error ? error.message : "Unknown error occurred",
        "user_logout_failed"
      );
    }
  }
}

export {
  OAuthError,
  OAuthClient,
};
