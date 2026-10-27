// Developpement depuis un autre appareil du reseau local (telephone, tablette) :
// `npm run start:mobile` sert l'application avec ce fichier. Remplacer l'adresse
// IP par celle du poste qui execute le backend.

export const environment = {
  production: false,
  apiUrl: 'http://192.168.1.223:3200',
  url: 'http://192.168.1.223:4200',
  urlToSendMessage: 'http://192.168.1.223:3200',
};
