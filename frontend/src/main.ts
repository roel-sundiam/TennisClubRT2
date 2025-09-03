import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

console.log('🚀 main.ts: Starting application bootstrap');

// Clear any invalid localStorage data immediately
try {
  const userString = localStorage.getItem('user');
  if (userString === 'undefined' || userString === 'null' || userString === null) {
    console.log('🚀 main.ts: Clearing invalid localStorage data at startup');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
} catch (error) {
  console.log('🚀 main.ts: Error checking localStorage at startup, clearing all data');
  localStorage.clear();
}

console.log('🚀 main.ts: About to bootstrap application');

bootstrapApplication(App, appConfig)
  .then(() => {
    console.log('🚀 main.ts: Application bootstrapped successfully');
  })
  .catch((err) => {
    console.error('🚀 main.ts: Bootstrap error:', err);
  });
