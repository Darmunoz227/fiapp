import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonList, IonItem, IonIcon, IonLabel, IonInput, IonButton, IonToast, AlertController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline, shieldCheckmarkOutline, cloudUploadOutline, refreshCircleOutline, createOutline, trashOutline } from 'ionicons/icons';
import { DatabaseService } from '../../core/database/database.service';
import { PreferencesService } from '../../core/preferences/preferences.service';
import { FreemiumService } from '../../core/freemium/freemium.service';
import { SeguridadService } from '../../core/seguridad/seguridad.service';
import { App } from '@capacitor/app';
// Importamos la herramienta nativa de compartir
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { construirRespaldo } from '../../core/respaldo/respaldo-builder';
import { validarRespaldo, MotivoRechazo } from '../../core/respaldo/respaldo-validator';
import { RespaldoConfig } from '../../core/models/respaldo.model';
import { RespaldoData } from '../../core/models/respaldo.model';
import { CatalogoItem } from '../../core/models/catalogo-item.model';

@Component({
  selector: 'app-configuraciones',
  templateUrl: './configuraciones.page.html',
  styleUrls: ['./configuraciones.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonList, IonItem, IonIcon, IonLabel, IonInput, IonButton, IonToast]
})
export class ConfiguracionesPage {
  nombreNegocio = '';
  catalogoFiado: CatalogoItem[] = [];
  tienePinConfigurado = false;
  mostrarToastGuardado = false;
  appVersion: string = '1.0.0';
  private tapsEnCreditos = 0;
  private timerResetTaps: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private dbService: DatabaseService,
    private prefs: PreferencesService,
    private freemiumService: FreemiumService,
    private seguridadService: SeguridadService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({ downloadOutline, shieldCheckmarkOutline, cloudUploadOutline, refreshCircleOutline, createOutline, trashOutline });
  }

  ionViewWillEnter() {
    this.cargarNombreNegocio();
    this.cargarVersionApp();
    this.cargarCatalogo();
    this.cargarEstadoPin();
  }

  async cargarVersionApp() {
    try {
      const info = await App.getInfo();
      this.appVersion = info.version || '1.0.0';
    } catch (error) {
      console.error('Error cargando versión de la app:', error);
      this.appVersion = '1.0.0';
    }
  }

  async cargarNombreNegocio() {
    const nombre = await this.prefs.getNombreNegocio();
    this.nombreNegocio = nombre?.trim() ?? '';
  }

  async guardarNombreNegocio() {
    const valor = this.nombreNegocio.trim();
    this.nombreNegocio = valor;
    if (valor) {
      await this.prefs.setNombreNegocio(valor);
    } else {
      await this.prefs.clearNombreNegocio();
    }

    this.mostrarToastGuardado = true;
  }

  cerrarToastGuardado() {
    this.mostrarToastGuardado = false;
  }

  onTapCreditos() {
    this.tapsEnCreditos += 1;

    if (this.timerResetTaps) {
      clearTimeout(this.timerResetTaps);
    }

    this.timerResetTaps = setTimeout(() => {
      this.tapsEnCreditos = 0;
      this.timerResetTaps = null;
    }, 2500);

    if (this.tapsEnCreditos >= 5) {
      this.tapsEnCreditos = 0;
      if (this.timerResetTaps) {
        clearTimeout(this.timerResetTaps);
        this.timerResetTaps = null;
      }
      this.mostrarAlertaCodigoActivacion();
    }
  }

  async mostrarAlertaCodigoActivacion() {
    const alert = await this.alertCtrl.create({
      header: 'Activar FiApp',
      inputs: [
        { name: 'password', type: 'password', placeholder: 'Código de activación' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desbloquear',
          handler: async (data: { password?: string }) => {
            const password = (data?.password ?? '').trim();
            if (password === 'darmunoz') {
              await this.freemiumService.activarLicenciaPremium();
              await this.mostrarToastDesbloqueo();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async mostrarToastDesbloqueo() {
    const toast = await this.toastCtrl.create({
      message: '¡FiApp Desbloqueada con éxito! Gracias por tu apoyo. 🚀',
      duration: 2400,
      position: 'bottom',
      color: 'success'
    });

    await toast.present();
  }

  @ViewChild("archivoInput") archivoInput?: ElementRef<HTMLInputElement>;

  seleccionarArchivo() {
    this.archivoInput?.nativeElement.click();
  }

  private mensajeRechazo(motivo: MotivoRechazo | undefined): string {
    if (motivo === "VERSION_INCOMPATIBLE") {
      return "El respaldo fue creado con otra version de FiApp y no se puede importar.";
    }
    if (motivo === "TABLA_FALTANTE" || motivo === "TABLA_INVALIDA") {
      return "El archivo esta incompleto o danado. Usa un respaldo generado por FiApp.";
    }
    return "El archivo no es un respaldo valido de FiApp.";
  }

  async onArchivoSeleccionado(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = "";

    if (!archivo) {
      return;
    }

    let contenido: unknown;
    try {
      contenido = JSON.parse(await archivo.text());
    } catch {
      await this.alertaSimple("Archivo invalido", "El archivo no se pudo leer como JSON.");
      return;
    }

    const resultado = validarRespaldo(contenido);
    if (!resultado.valido || !resultado.data) {
      await this.alertaSimple("No se puede importar", this.mensajeRechazo(resultado.motivo));
      return;
    }

    try {
      await this.generarArchivoRespaldo("fiapp-antes-de-importar");
    } catch (error) {
      console.error("No se pudo crear el respaldo de seguridad:", error);
      await this.alertaSimple("Importacion cancelada", "No se pudo crear una copia de seguridad de tus datos actuales, asi que no se importo nada.");
      return;
    }

    const datos = resultado.data;
    const configImportada = resultado.config;
    const alert = await this.alertCtrl.create({
      header: "Reemplazar todos los datos",
      message: "Esto BORRA tus datos actuales y los reemplaza por los del archivo. Escribe REEMPLAZAR para continuar.",
      inputs: [{ name: "palabra", type: "text", placeholder: "REEMPLAZAR" }],
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Importar",
          handler: (valores: { palabra?: string }) => {
            if ((valores.palabra ?? "").trim().toUpperCase() !== "REEMPLAZAR") {
              void this.alertaSimple("Importacion cancelada", "No escribiste REEMPLAZAR, asi que no se cambio nada.");
              return false;
            }
            void this.ejecutarImportacion(datos, configImportada);
            return true;
          },
        },
      ],
    });

    await alert.present();
  }

  private async ejecutarImportacion(datos: RespaldoData, config?: RespaldoConfig) {
    try {
      const conteo = await this.dbService.reemplazarTodo(datos);
      await this.restaurarConfig(config);
      await this.alertaSimple(
        "Respaldo importado",
        "Clientes: " + conteo.clientes + ". Fiados y abonos: " + conteo.transacciones + ". Productos: " + conteo.productos + ". Movimientos: " + conteo.movim_inventario + ". Ventas: " + conteo.ventas + ". Lineas de venta: " + conteo.venta_items + "."
      );
    } catch (error) {
      console.error("Fallo la importacion:", error);
      await this.alertaSimple("La importacion fallo", "Tus datos quedaron como estaban. No se perdio nada.");
    }
  }

  // Un respaldo sin catalogo NO debe borrar el que el merchant ya construyo
  // (mismo espiritu que Decision 041: no borrar lo que nadie pidio borrar).
  private async restaurarConfig(config?: RespaldoConfig): Promise<void> {
    if (!config) {
      return;
    }
    if (Array.isArray(config.catalogo_fiado) && config.catalogo_fiado.length > 0) {
      await this.prefs.setCatalogoFiado(config.catalogo_fiado);
      // Refrescar la vista: sin esto la pantalla sigue mostrando el catalogo
      // viejo y el merchant cree que la importacion fallo.
      this.catalogoFiado = await this.prefs.getCatalogoFiado();
    }
    const nombre = (config.nombre_negocio ?? "").trim();
    if (nombre !== "") {
      await this.prefs.setNombreNegocio(nombre);
    }
  }

  private async alertaSimple(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ["Entendido"] });
    await alert.present();
  }


  async reiniciarInventario() {
    await this.seguridadService.ejecutarConPin(async () => {
    const puedeEscribir = await this.freemiumService.puedeEscribir();
    if (!puedeEscribir) {
      return;
    }

    try {
      await this.generarArchivoRespaldo("fiapp-antes-de-reiniciar-inventario");
    } catch (error) {
      console.error("No se pudo crear el respaldo antes de reiniciar inventario:", error);
      await this.alertaSimple(
        "Reinicio cancelado",
        "No se pudo crear una copia de seguridad de tus datos actuales, asi que no se reinicio nada."
      );
      return;
    }

    const alert = await this.alertCtrl.create({
      header: "Reiniciar inventario",
      message: "Esto BORRA productos, movimientos de inventario, ventas, lineas de venta y producciones. Clientes, fiados y abonos se conservan. Escribe REINICIAR para continuar.",
      inputs: [{ name: "palabra", type: "text", placeholder: "REINICIAR" }],
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Reiniciar",
          handler: async (valores: { palabra?: string }) => {
            if ((valores.palabra ?? "").trim().toUpperCase() !== "REINICIAR") {
              await this.alertaSimple(
                "Reinicio cancelado",
                "No escribiste REINICIAR, asi que no se cambio nada."
              );
              return false;
            }

            await this.ejecutarResetInventario();
            return true;
          },
        },
      ],
    });

    await alert.present();
    });
  }

  private async ejecutarResetInventario() {
    try {
      await this.dbService.resetInventario();
      await this.alertaSimple(
        "Inventario reiniciado",
        "Se borraron productos, movimientos y ventas. Clientes, fiados y abonos se conservaron."
      );
    } catch (error) {
      console.error("Fallo el reinicio de inventario:", error);
      await this.alertaSimple(
        "El reinicio fallo",
        "Tus datos quedaron como estaban. No se perdio nada."
      );
    }
  }
  // --- RF-07: EXPORTACION DE RESPALDO JSON COMPLETO (Feature 014) ---
  // Escribe el archivo y devuelve su URI. NO comparte, NO muestra toast.
  // Reutilizado por la exportacion manual y por el respaldo de seguridad previo
  // a una importacion (Feature 016). Si falla, lanza: los fallos silenciosos
  // estan prohibidos por la Decision 031.
  async generarArchivoRespaldo(prefijo = "fiapp-respaldo"): Promise<string> {
    const data = {
      clientes: await this.dbService.leerCrudoClientes(),
      transacciones: await this.dbService.leerCrudoTransacciones(),
      productos: await this.dbService.leerCrudoProductos(),
      movim_inventario: await this.dbService.leerCrudoMovimInventario(),
      ventas: await this.dbService.leerCrudoVentas(),
      venta_items: await this.dbService.leerCrudoVentaItems(),
      producciones: await this.dbService.leerCrudoProducciones(),
      produccion_items: await this.dbService.leerCrudoProduccionItems(),
      gastos: await this.dbService.leerCrudoGastos(),
      gastos_recurrentes: await this.dbService.leerCrudoGastosRecurrentes(),
    };

    const config = {
      catalogo_fiado: await this.prefs.getCatalogoFiado(),
      nombre_negocio: await this.prefs.getNombreNegocio(),
    };

    const respaldo = construirRespaldo(data, new Date().toISOString(), config);
    const contenido = JSON.stringify(respaldo, null, 2);
    const fecha = new Date().toISOString().slice(0, 10);
    const nombre = prefijo + "-" + fecha + ".json";

    const escrito = await Filesystem.writeFile({
      path: nombre,
      data: contenido,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    return escrito.uri;
  }

  async exportarRespaldoJSON() {
    let uriArchivo: string;

    try {
      uriArchivo = await this.generarArchivoRespaldo();
    } catch (error) {
      console.error("Error al generar el respaldo:", error);
      await this.mostrarToastRespaldoFallido();
      return;
    }

    try {
      await Share.share({
        title: "Respaldo FiApp",
        files: [uriArchivo],
        dialogTitle: "Guardar o enviar respaldo de FiApp",
      });
    } catch {
      // El usuario cancelo la hoja de compartir. El archivo YA existe en disco,
      // asi que el respaldo se genero correctamente y no hay nada que reportar.
    }
  }

  async mostrarToastRespaldoFallido() {
    const toast = await this.toastCtrl.create({
      message: "No se pudo generar el respaldo. Intenta de nuevo.",
      duration: 3000,
      position: "bottom",
      color: "danger"
    });

    await toast.present();
  }

  async cargarCatalogo() {
    this.catalogoFiado = await this.prefs.getCatalogoFiado();
  }

  private parsearPrecio(texto: string | undefined): number | null {
    const limpio = (texto ?? "").replace(/[^0-9]/g, "");
    if (!limpio) {
      return null;
    }
    const valor = parseInt(limpio, 10);
    return Number.isFinite(valor) && valor > 0 ? valor : null;
  }

  async agregarProductoCatalogo() {
    const alert = await this.alertCtrl.create({
      header: "Nuevo producto",
      inputs: [
        { name: "nombre", type: "text", placeholder: "Nombre (ej: Empanada)" },
        { name: "precio", type: "number", placeholder: "Precio (ej: 3000)" },
        { name: "emoji", type: "text", placeholder: "Emoji opcional (ej: 🥟)" },
      ],
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Agregar",
          handler: (v: { nombre?: string; precio?: string; emoji?: string }) => {
            const nombre = (v.nombre ?? "").trim();
            const precio = this.parsearPrecio(v.precio);
            if (!nombre || precio === null) {
              void this.alertaSimple("Datos incompletos", "Escribe un nombre y un precio mayor a cero.");
              return false;
            }
            const emoji = (v.emoji ?? "").trim() || undefined;
            const item: CatalogoItem = { id: Date.now().toString(), nombre, precio, emoji };
            this.catalogoFiado = [...this.catalogoFiado, item];
            void this.persistirCatalogo();
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async editarProductoCatalogo(item: CatalogoItem) {
    const alert = await this.alertCtrl.create({
      header: "Editar producto",
      inputs: [
        { name: "nombre", type: "text", value: item.nombre, placeholder: "Nombre" },
        { name: "precio", type: "number", value: String(item.precio), placeholder: "Precio" },
        { name: "emoji", type: "text", value: item.emoji ?? "", placeholder: "Emoji opcional" },
      ],
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Guardar",
          handler: (v: { nombre?: string; precio?: string; emoji?: string }) => {
            const nombre = (v.nombre ?? "").trim();
            const precio = this.parsearPrecio(v.precio);
            if (!nombre || precio === null) {
              void this.alertaSimple("Datos incompletos", "Escribe un nombre y un precio mayor a cero.");
              return false;
            }
            const emoji = (v.emoji ?? "").trim() || undefined;
            this.catalogoFiado = this.catalogoFiado.map((c) =>
              c.id === item.id ? { ...c, nombre, precio, emoji } : c
            );
            void this.persistirCatalogo();
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async eliminarProductoCatalogo(item: CatalogoItem) {
    const alert = await this.alertCtrl.create({
      header: "Quitar producto",
      message: 'Quitar "' + item.nombre + '" del catalogo? Los fiados ya guardados no cambian.',
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Quitar",
          role: "destructive",
          handler: () => {
            this.catalogoFiado = this.catalogoFiado.filter((c) => c.id !== item.id);
            void this.persistirCatalogo();
          },
        },
      ],
    });
    await alert.present();
  }

  private async persistirCatalogo() {
    await this.prefs.setCatalogoFiado(this.catalogoFiado);
  }

  async cargarEstadoPin() {
    this.tienePinConfigurado = await this.seguridadService.tienePin();
  }

  async establecerPin() {
    const alert = await this.alertCtrl.create({
      header: 'Establecer PIN',
      message: 'Este PIN protegera acciones como editar productos, anular movimientos y reiniciar inventario.',
      inputs: [{ name: 'pin', type: 'password', placeholder: 'Nuevo PIN' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (d: { pin?: string }) => {
            const pin = (d?.pin ?? '').trim();
            if (!pin) {
              return false;
            }
            await this.seguridadService.configurarPin(pin);
            await this.cargarEstadoPin();
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async cambiarPinAdmin() {
    const alert = await this.alertCtrl.create({
      header: 'Cambiar PIN',
      inputs: [
        { name: 'actual', type: 'password', placeholder: 'PIN actual' },
        { name: 'nuevo', type: 'password', placeholder: 'Nuevo PIN' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cambiar',
          handler: async (d: { actual?: string; nuevo?: string }) => {
            const nuevo = (d?.nuevo ?? '').trim();
            if (!nuevo) {
              return false;
            }
            const ok = await this.seguridadService.cambiarPin(d?.actual ?? '', nuevo);
            if (!ok) {
              await this.alertaSimple('PIN incorrecto', 'El PIN actual no es correcto. No se cambio nada.');
              return false;
            }
            await this.cargarEstadoPin();
            return true;
          },
        },
      ],
    });
    await alert.present();
  }
}
