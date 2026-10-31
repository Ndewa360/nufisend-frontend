import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from 'app/app.module';
import { startAnalytics } from 'app/core/analytics/analytics';

// Mesure d'audience Vercel (anonyme, sans cookie ; desactivable par l'utilisateur).
startAnalytics();

platformBrowserDynamic().bootstrapModule(AppModule)
                        .catch(err => console.error(err));
