import { KeycloakService } from "keycloak-angular";
// import { environment } from "src/environments/environment";
import { Router } from "@angular/router";
import { environment } from "environments/environment";

export function initializeKeycloak(keycloak: KeycloakService, router:Router): () => Promise<any> {
    return (): Promise<any> => {
        return new Promise(async (resolve, reject) => {
          try {
            // const urlData = router.url;
            // console.log('UrmGata: ', window.location)
            await keycloak.init({
                config: {
                    url: environment.keycloak.url,
                    realm: environment.keycloak.realm,
                    clientId: environment.keycloak.clientId,
                    
                    
                },
              initOptions: {
                onLoad: 'check-sso',
                checkLoginIframe: false,
                // redirectUri: window.location.origin,
                flow: "standard",
                silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
              },
                enableBearerInterceptor: true,
                // bearerPrefix: 'Bearer',
              bearerExcludedUrls:[]
            });
            resolve(true);
          } catch (error) {
            reject(error);
          }
        });
      };
}