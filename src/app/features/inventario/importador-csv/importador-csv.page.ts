import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule, ToastController } from "@ionic/angular";
import { CsvParserService, ResultadoCsv } from "../../../core/inventario/csv-parser.service";
import { DatabaseService } from "../../../core/database/database.service";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { addIcons } from "ionicons";
import { downloadOutline, documentTextOutline } from "ionicons/icons";

@Component({
  selector: "app-importador-csv",
  template: `
<ion-header>
  <ion-toolbar color="primary">
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/inventario"></ion-back-button>
    </ion-buttons>
    <ion-title>Importar Inventario</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">
  
  <div *ngIf="estado === 'INICIO' || estado === 'VISTA_PREVIA'" class="instrucciones" style="background: var(--ion-color-light); padding: 16px; border-radius: 8px;">
    <div class="paso" style="display: flex; align-items: flex-start; margin-bottom: 12px;">
      <div class="paso-numero" style="background: var(--ion-color-primary); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">1</div>
      <div>
        <strong>Descarga la plantilla</strong>
        <p class="ion-no-margin" style="font-size: 14px; color: var(--ion-color-medium);">Un archivo CSV con las columnas requeridas.</p>
        <ion-button fill="outline" size="small" class="ion-margin-top" (click)="descargarPlantilla()">
          <ion-icon name="download-outline" slot="start"></ion-icon>
          Plantilla.csv
        </ion-button>
      </div>
    </div>
    
    <div class="paso" style="display: flex; align-items: flex-start; margin-top: 16px;">
      <div class="paso-numero" style="background: var(--ion-color-primary); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0;">2</div>
      <div style="width: 100%;">
        <strong>Sube tu archivo lleno</strong>
        <p class="ion-no-margin" style="font-size: 14px; color: var(--ion-color-medium);">Asegúrate de guardarlo como .CSV</p>
        <input type="file" accept=".csv, text/csv, application/vnd.ms-excel, application/csv, text/x-csv, application/x-csv, text/comma-separated-values, text/x-comma-separated-values" id="fileInput" style="display: none;" (change)="onArchivoSeleccionado($event)" #fileInput>
        <ion-button size="small" class="ion-margin-top" (click)="fileInput.click()">
          <ion-icon name="document-text-outline" slot="start"></ion-icon>
          Seleccionar archivo
        </ion-button>
      </div>
    </div>
  </div>

  <ion-card *ngIf="estado === 'VISTA_PREVIA' && resultado" class="ion-no-margin ion-margin-top">
    <ion-card-header>
      <ion-card-title style="font-size: 16px;" [color]="resultado.errores.length > 0 ? 'danger' : 'success'">
        Vista Previa: {{ resultado.validos.length }} válidos, {{ resultado.errores.length }} errores
      </ion-card-title>
    </ion-card-header>
    
    <ion-card-content>
      <div *ngIf="resultado.errores.length > 0" class="ion-margin-bottom">
        <p color="danger" *ngFor="let err of resultado.errores.slice(0, 5)">{{ err }}</p>
        <p *ngIf="resultado.errores.length > 5">... y {{ resultado.errores.length - 5 }} errores más.</p>
        <ion-button expand="block" color="danger" fill="outline" (click)="resetear()">Corregir y volver a subir</ion-button>
      </div>

      <div *ngIf="resultado.errores.length === 0 && resultado.validos.length > 0">
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px;">
          <thead>
            <tr>
              <th style="border-bottom: 1px solid var(--ion-color-step-150); text-align: left; padding: 4px;">Nombre</th>
              <th style="border-bottom: 1px solid var(--ion-color-step-150); text-align: left; padding: 4px;">Precio</th>
              <th style="border-bottom: 1px solid var(--ion-color-step-150); text-align: left; padding: 4px;">Cant</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of resultado.validos.slice(0, 3)">
              <td style="border-bottom: 1px solid var(--ion-color-step-150); padding: 4px;">{{ item.nombre }}</td>
              <td style="border-bottom: 1px solid var(--ion-color-step-150); padding: 4px;">{{ item.precio }}</td>
              <td style="border-bottom: 1px solid var(--ion-color-step-150); padding: 4px;">{{ item.cantidad_actual }}</td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="resultado.validos.length > 3" style="font-size: 12px; color: var(--ion-color-medium); text-align: center;">... {{ resultado.validos.length - 3 }} productos más.</p>
        
        <ion-button expand="block" color="success" class="ion-margin-top" (click)="importar()">
          Importar {{ resultado.validos.length }} productos
        </ion-button>
      </div>
    </ion-card-content>
  </ion-card>

  <div *ngIf="estado === 'CARGANDO'" style="text-align: center; margin-top: 40px;">
    <ion-spinner name="crescent"></ion-spinner>
    <p>Guardando inventario...</p>
  </div>
</ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ImportadorCsvPage {
  estado: "INICIO" | "VISTA_PREVIA" | "CARGANDO" = "INICIO";
  resultado: ResultadoCsv | null = null;

  constructor(
    private csvParser: CsvParserService,
    private db: DatabaseService,
    private toastCtrl: ToastController
  ) {
    addIcons({ downloadOutline, documentTextOutline });
  }

  async descargarPlantilla() {
    const csvContent = "Nombre;Precio;Cantidad_Actual;Costo_Unitario;Stock_Minimo\nEjemplo Zapatos;80000;10;40000;5\nEjemplo Camiseta;35000;0;0;0";
    const fileName = "Plantilla_Inventario_FiApp.csv";

    try {
      const result = await Filesystem.writeFile({
        path: fileName,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      await Share.share({
        title: "Plantilla Inventario",
        text: "Plantilla CSV para importar inventario a FiApp",
        url: result.uri,
        dialogTitle: "Guardar o compartir plantilla"
      });
    } catch (error) {
      this.mostrarToast("No se pudo generar la plantilla.");
    }
  }

  onArchivoSeleccionado(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      this.procesarTextoCSV(text);
    };
    reader.readAsText(file);
    
    event.target.value = "";
  }

  async procesarTextoCSV(texto: string) {
    this.resultado = this.csvParser.parsear(texto);
    this.estado = "VISTA_PREVIA";
  }

  async importar() {
    if (!this.resultado || this.resultado.validos.length === 0) return;
    
    this.estado = "CARGANDO";
    try {
      await this.db.importarProductosCSV(this.resultado.validos);
      await this.mostrarToast(`Exito: Se importaron ${this.resultado.validos.length} productos.`);
      this.resetear();
    } catch (error) {
      alert("Error BD: " + ((error as any)?.message || JSON.stringify(error)));
      await this.mostrarToast("Error guardando en la base de datos.");
      this.estado = "VISTA_PREVIA";
    }
  }

  resetear() {
    this.estado = "INICIO";
    this.resultado = null;
  }

  private async mostrarToast(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      position: "bottom"
    });
    await toast.present();
  }
}
