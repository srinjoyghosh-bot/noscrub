import { CookieManager } from "./cookie.js";
import { Config } from "./config.js";

/**
 * Custom error class for OAuth-specific errors
 * @extends Error
 */
class OAuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "OAuthError";
    this.code = code;
  }
}
/**
 * @class
 * @classdesc Handles OAuth2 authentication flow
 */
class OAuthClient {

  /**
   * Creates an instance of OAuthClient
   * @constructor
   * @param {Config} config - The configuration object
   */
  constructor(config) {
    this.config = config;

    const sessionState=localStorage.getItem("oauth_state");
    if (sessionState) {
      this.state = sessionState;
      console.log("state present", this.state);
    } else {
      this.state = this.generateState();
      localStorage.setItem("oauth_state", this.state);
      console.log("new state", this.state);
    }
    if (CookieManager.hasCookie("oauth_code_verifier") && !CookieManager.isExpired("oauth_code_verifier")) {
      this.codeVerifier = CookieManager.getCookie("oauth_code_verifier");
      console.log("code verifier cookie present", this.codeVerifier);
    } else {
      this.codeVerifier = this.generateCodeVerifier();
      CookieManager.setCookie("oauth_code_verifier", this.codeVerifier);
      console.log("new cookie code verifier", this.codeVerifier);
    }
  }

  /**
   * Generates a random state string for OAuth flow
   * @returns {string} Random state string
   */
  generateState() {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generates a code verifier string for OAuth flow
   * @returns {string} code verifier string
   */
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

  /**
   * Generates a code challenge string for OAuth flow
   * @async
   * @returns {string} code challenge string
   */
  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
    return hashBase64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  /**
   * Initiates the OAuth authorization flow
   * 
   * @async
   * @returns {Promise<string>} Authorization URL
   * @throws {OAuthError} When authorization fails
   */
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

  /**
 * Handles the OAuth 2.0 callback and performs token exchange after authorization.
 * This method validates the state parameter and exchanges the authorization code
 * for access and refresh tokens using PKCE flow.
 *
 * @async
 * @param {Object} params - The callback parameters received from OAuth provider
 * @param {string} params.code - The authorization code returned by the OAuth provider
 * @param {string} params.state - The state parameter for CSRF protection
 * 
 * @throws {OAuthError} Throws with code 'invalid_state' if state parameter doesn't match
 * @throws {OAuthError} Throws with code 'token_request_failed' if token exchange fails
 * 
 * @returns {Promise<TokenResponse>} A promise that resolves to the token response
 * @property {string} accessToken - The access token for API requests
 * @property {string} refreshToken - The refresh token for obtaining new access tokens
 * @property {number} expiresIn - Token expiration time in seconds
 * @property {string} tokenType - The type of token (usually 'Bearer')
 * @property {string} scope - Space-separated list of granted scopes
 */
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

  /**
 * Refreshes an expired access token using a refresh token.
 * This method performs a token refresh request to obtain a new access token
 * and potentially a new refresh token from the OAuth provider.
 *
 * @async
 * @param {string} refreshToken - The refresh token obtained from previous authorization
 * 
 * @throws {OAuthError} Throws with code 'refresh_token_failed' if the refresh attempt fails
 * 
 * @returns {Promise<TokenResponse>} A promise that resolves to the new token response
 * @property {string} accessToken - The new access token for API requests
 * @property {string} refreshToken - The new refresh token (if provided by server)
 * @property {number} expiresIn - New token expiration time in seconds
 * @property {string} tokenType - The type of token (usually 'Bearer')
 * @property {string} scope - Space-separated list of granted scopes
 * 
 * @typedef {Object} TokenResponse
 * @property {string} accessToken - The access token used for authenticating API requests
 * @property {string} [refreshToken] - The refresh token used to obtain new access tokens. Optional as some flows might not provide it
 * @property {number} expiresIn - The lifetime of the access token in seconds
 * @property {string} tokenType - The type of token, typically "Bearer"
 * @property {string} [scope] - Space-separated list of granted scopes. Optional as some providers might not return scopes
 */
  async refreshToken(refreshToken) {
    const tokenParams = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.config.clientId,
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

  /**
 * Fetches user information from the OAuth provider's userinfo endpoint.
 * Uses the provided access token to retrieve basic profile information
 * such as name and email of the authenticated user.
 *
 * @async
 * @param {string} access_token - Valid access token obtained during authentication
 * 
 * @throws {OAuthError} Throws with code 'user_info_fetch_failed' if:
 *  - The request fails
 *  - The server returns a non-200 response
 *  - There's an error parsing the response
 * 
 * @returns {Promise<UserInfo>} A promise that resolves to user information
 * @property {string} name - The user's full name
 * @property {string} email - The user's email address
 * 
 * @typedef {Object} UserInfo
 * @property {string} name - The user's full name
 * @property {string} email - The user's email address
 */
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

  // async logoutUser() {
  //   const params = new URLSearchParams({
  //     client_id: this.config.clientId,
  //     returnTo: "http://localhost:5500/login.html",
  //   });
  //   try {
  //     const response = await fetch(
  //       `${this.config.logoutEndpoint}?${params.toString()}`
  //     );
  //     if (!response.ok) {
  //       throw new OAuthError("User logout failed", "user_logout_failed");
  //     }
  //   } catch (error) {
  //     throw new OAuthError(
  //       error instanceof Error ? error.message : "Unknown error occurred",
  //       "user_logout_failed"
  //     );
  //   }
  // }
}

export {
  OAuthError,
  OAuthClient,
};
