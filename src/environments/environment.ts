// Configuration de developpement. `ng build --configuration=production`
// remplace ce fichier par environment.prod.ts (cf. fileReplacements dans angular.json).
// Pour tester depuis un autre appareil du reseau local, utiliser environment.mobile.ts
// (`ng serve --configuration=mobile`) plutot que de modifier ce fichier.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3200',
  url: 'http://localhost:4200',
  urlToSendMessage: 'http://localhost:3200',
};
