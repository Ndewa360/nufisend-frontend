# NufiSend Frontend

Interface web de NufiSend (Angular 17, Angular Material, Tailwind, NGXS), basée sur le template Fuse.

## Démarrage

```bash
npm install
npm start                # http://localhost:4200, API attendue sur http://localhost:3200
npm run start:mobile     # accès depuis le réseau local (adresse IP dans environment.mobile.ts)
```

## Build

```bash
npm run build            # build de production dans dist/fuse (environment.prod.ts)
```

## Organisation

- `src/app/core` : authentification (service, intercepteur, gardes), navigation, synchronisation WhatsApp automatique.
- `src/app/modules` : pages (landing, auth, contacts, groupes, messagerie, templates, synchro WhatsApp, super-admin, clés API).
- `src/app/shared` : store NGXS, services, composants partagés.
  - `shared/modules/date-picker.module.ts` et `rich-text-editor.module.ts` : à importer uniquement dans les modules qui utilisent des sélecteurs de date ou l'éditeur Quill (ils ne doivent pas revenir dans `SharedModule`, chargé au démarrage).
- Icônes : le jeu Heroicons embarqué est en **v1** (`mail`, `eye-off`, `login`...), les noms v2 (`envelope`, `eye-slash`...) n'existent pas.
