export const msalConfig = {
    auth: {
      clientId: window.config.ClientId,
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: window.config.RedirectUri,
      postLogoutRedirectUri: window.config.RedirectUri,
    },
    cache: {
      cacheLocation: "localStorage",
      storeAuthStateInCookie: false,
    }
  };

export const popupRedirectUri = (window.config.RedirectUri || window.location.origin) + "/auth-redirect.html";
  
  export const loginRequest = {
    scopes: ["openid", "profile", "User.Read", "Mail.Send", "Mail.Read", 
      "Mail.ReadWrite.Shared" , "Mail.ReadWrite", "Tasks.ReadWrite", 'Calendars.ReadWrite.Shared'],
  };
  