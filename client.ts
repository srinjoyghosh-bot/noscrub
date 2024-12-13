interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    userEndpoint: string;
    scope: string[];
    provider: string;
}

interface TokenResponse {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
    tokenType: string;
    scope?: string;
}

interface UserInfoResponse {
    name: string;
    email: string;
}

interface CallbackParams {
    code: string;
    state?: string;
}

class OAuthError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'OAuthError';
    }
}

// Main OAuth Client Class
export class OAuthClient {
    private config: OAuthConfig;
    private state: string;

    constructor(config: OAuthConfig)  {
        this.config = config;
        this.state = this.generateState();
        console.log("Client state",this,this.state);
    }

    private generateState(): string {
        return Math.random().toString(36).substring(2, 15);
    }

    private generateCodeVerifier(): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        const length = 128;
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    private async generateCodeChallenge(verifier: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    public async startAuthFlow(): Promise<string> {
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope: this.config.scope.join(' '),
            state: this.state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });

        // await this.auth0client.loginWithRedirect()

        return `${this.config.authorizationEndpoint}?${params.toString()}`;
    }

    public async handleCallback(params: CallbackParams): Promise<TokenResponse> {
        if (params.state !== this.state) {
            throw new OAuthError('Invalid state parameter', 'invalid_state');
        }

        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code: params.code,
            redirect_uri: this.config.redirectUri,
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret
        });

        try {

            // await this.auth0client.handleRedirectCallback();

            const response = await fetch(this.config.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: tokenParams.toString()
            });

            if (!response.ok) {
                throw new OAuthError('Token request failed', 'token_request_failed');
            }

            const data = await response.json();
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresIn: data.expires_in,
                tokenType: data.token_type,
                scope: data.scope
            };
        } catch (error) {
            throw new OAuthError(
                error instanceof Error ? error.message : 'Unknown error occurred',
                'token_request_failed'
            );
        }
    }

    public async refreshToken(refreshToken: string): Promise<TokenResponse> {
        const tokenParams = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret
        });

        try {
            const response = await fetch(this.config.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: tokenParams.toString()
            });

            if (!response.ok) {
                throw new OAuthError('Token refresh failed', 'refresh_token_failed');
            }

            const data = await response.json();
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresIn: data.expires_in,
                tokenType: data.token_type,
                scope: data.scope
            };
        } catch (error) {
            throw new OAuthError(
                error instanceof Error ? error.message : 'Unknown error occurred',
                'refresh_token_failed'
            );
        }
    }

    public async getUserInfo(access_token: string) : Promise<UserInfoResponse> {
        try {
            const response = await fetch(this.config.userEndpoint, {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            });
            if(!response.ok){
                throw new OAuthError('User info fetch failed', 'user_info_fetch_failed');
            }
            const userInfo = await response.json();
            return {
                name: userInfo.name,
                email: userInfo.email
            }
        } catch (error) {
            throw new OAuthError(
                error instanceof Error ? error.message : 'Unknown error occurred',
                'user_info_fetch_failed'
            );
        }
    }
}

// Provider configurations
export const OAUTH_PROVIDERS = {
    AUTH0: (domain: string) => ({
        authorizationEndpoint: `https://${domain}/authorize`,
        tokenEndpoint: `https://${domain}/oauth/token`,
        userEndpoint:`https://${domain}/authorize/userInfo`
    }),
    CLERK: {
        authorizationEndpoint: 'https://clerk.com/oauth/authorize',
        tokenEndpoint: 'https://clerk.com/oauth/token'
    },
    KINDE: (domain: string) => ({
        authorizationEndpoint: `https://${domain}/oauth2/auth`,
        tokenEndpoint: `https://${domain}/oauth2/token`
    })
};
