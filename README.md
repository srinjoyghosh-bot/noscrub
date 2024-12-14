# NoScrub

This lightweight OAuth2 client library implementation simplifies the authentication process in your web applications.

## Project Structure
```
noscrub/
├── client.js     # Core OAuth2 client implementation
├── config.js     # Configuration management
├── cookie.js     # Cookie handling utilities
├── demo.js       # Demo implementation
└── login.html    # Login page template
```

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/srinjoyghosh-bot/noscrub.git
   cd noscrub
   ```

2. Configure your OAuth2 settings in `config.js`:
   ```javascript
   const config = {
      clientId: `YOUR_CLIENT_ID`,
      redirectUri: "YOUR_REDIRECT_URI",
      scope: [YOUR_REQUIRED_SCOPES],
      provider: "YOUR_OAUTH_PROVIDER",
      authorizationEndpoint: `YOUR_AUTHORIZATION_ENDPOINT`,
      tokenEndpoint: `YOUR_TOKEN_ENDPOINT`,
      userEndpoint: `YOUR_USER_ENDPOINT`,
      logoutEndpoint: `YOUR_LOGOUT_ENDPOINT`,
    }
   ```

## Running the Demo

1. Update `config.js` with your OAuth2 provider credentials

2. Start the demo server

3. Open your browser and navigate to the demo URL 

4. Click the login button to test the OAuth2 flow

## Demo Features

The included demo (`demo.js`) showcases:
- Basic OAuth2 authorization flow
- Token handling with Cookies
- Simple login page implementation

