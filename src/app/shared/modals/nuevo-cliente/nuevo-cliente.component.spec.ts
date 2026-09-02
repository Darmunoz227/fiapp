import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';

import { NuevoClienteComponent } from './nuevo-cliente.component';
import { DatabaseService } from '../../../core/database/database.service';
import { FreemiumService } from '../../../core/freemium/freemium.service';
import { Cliente } from '../../../core/models/cliente.model';

describe('NuevoClienteComponent', () => {
  let component: NuevoClienteComponent;
  let fixture: ComponentFixture<NuevoClienteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NuevoClienteComponent],
      providers: [
        {
          provide: ModalController,
          useValue: {
            create: () => Promise.resolve({
              present: () => Promise.resolve(),
              dismiss: () => Promise.resolve(),
              onDidDismiss: () => Promise.resolve({ data: null, role: null }),
              onWillDismiss: () => Promise.resolve({ data: null, role: null }),
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NuevoClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function clienteBase(over: Partial<Cliente> = {}): Cliente {
    return {
      id: over.id ?? 'c1',
      nombre: over.nombre ?? 'Ana',
      telefono: over.telefono ?? '3001112222',
      habeas_data_flag: over.habeas_data_flag ?? true,
      fecha_creacion: over.fecha_creacion ?? Date.now(),
    };
  }

  it('modo editar precarga nombre y telefono desde @Input cliente', () => {
    component.modo = 'editar';
    component.cliente = clienteBase({ nombre: 'Pedro', telefono: '3007778888' });

    component.ngOnInit();

    expect(component.nombre).toBe('Pedro');
    expect(component.telefono).toBe('3007778888');
  });

  it('modo editar llama actualizarCliente y NO crearCliente', async () => {
    const db = TestBed.inject(DatabaseService);
    const freemium = TestBed.inject(FreemiumService);
    spyOn(freemium, 'puedeEscribir').and.returnValue(Promise.resolve(true));
    const actualizarSpy = spyOn(db, 'actualizarCliente').and.returnValue(Promise.resolve());
    const crearSpy = spyOn(db, 'crearCliente').and.returnValue(Promise.resolve());

    component.modo = 'editar';
    component.cliente = clienteBase({ id: 'c9', nombre: 'Ana', telefono: '300' });
    component.ngOnInit();
    component.nombre = 'Ana Maria';
    component.telefono = '3009998888';

    await component.guardarCliente();

    expect(actualizarSpy).toHaveBeenCalled();
    expect(crearSpy).not.toHaveBeenCalled();
    const arg = actualizarSpy.calls.mostRecent().args[0] as Cliente;
    expect(arg.id).toBe('c9');
    expect(arg.nombre).toBe('Ana Maria');
    expect(arg.telefono).toBe('3009998888');
  });

  it('modo editar permite pasar telefono vacio a un valor real', async () => {
    const db = TestBed.inject(DatabaseService);
    const freemium = TestBed.inject(FreemiumService);
    spyOn(freemium, 'puedeEscribir').and.returnValue(Promise.resolve(true));
    const actualizarSpy = spyOn(db, 'actualizarCliente').and.returnValue(Promise.resolve());

    component.modo = 'editar';
    component.cliente = clienteBase({ id: 'c10', telefono: '' });
    component.ngOnInit();
    component.telefono = '3005554444';

    await component.guardarCliente();

    const arg = actualizarSpy.calls.mostRecent().args[0] as Cliente;
    expect(arg.telefono).toBe('3005554444');
  });
});