// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // apiUrl: 'http://localhost:3000',
  apiUrl: 'https://ysapp-api.yaba-in.com',
  url: 'http://localhost:4200',
  urlToSendMessage: 'http://localhost:3000',
  keycloak:{
    secret:"qWuIaeXWEZk9Bi3Q4efVpATtW4TC8MkB",
    clientId:"ysapp-frontend",
    realm:"Yaba-In",
    url:"https://accounts.yaba-in.com/"
  },
};
