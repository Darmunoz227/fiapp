import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DatabaseService } from './core/database/database.service';
import { FreemiumService } from './core/freemium/freemium.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private databaseService: DatabaseService,
    private freemiumService: FreemiumService
  ) {
    this.iniciarApp();
  }

  async iniciarApp() {
    await this.databaseService.initializePlugin();
    await this.freemiumService.inicializarEstadoFreemium();
    console.log('App iniciada y motor SQLite encendido');
  }
}
