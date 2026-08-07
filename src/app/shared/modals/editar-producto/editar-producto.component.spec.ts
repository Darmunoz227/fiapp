import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';
import { EditarProductoComponent } from './editar-producto.component';
import { DatabaseService } from '../../../core/database/database.service';
import { FreemiumService } from '../../../core/freemium/freemium.service';
import { Producto } from '../../../core/models/producto.model';

describe('EditarProductoComponent', () => {
  let component: EditarProductoComponent;
  let fixture: ComponentFixture<EditarProductoComponent>;
  let dbMock: jasmine.SpyObj<DatabaseService>;
  let freemiumMock: jasmine.SpyObj<FreemiumService>;
  let modalMock: jasmine.SpyObj<ModalController>;

  const producto: Producto = {
    id: 'p1',
    nombre: 'Arroz',
    precio_venta: 3500,
    tipo_venta: 'UNIDAD',
    minimo_stock: 5,
    costo_promedio: 2500,
    created_at: 1700000000000,
    updated_at: null,
    deleted_at: null,
    store_id: null,
    created_by: null,
  };

  beforeEach(async () => {
    dbMock = jasmine.createSpyObj('DatabaseService', ['actualizarProducto']);
    dbMock.actualizarProducto.and.resolveTo();
    freemiumMock = jasmine.createSpyObj('FreemiumService', ['puedeEscribir']);
    freemiumMock.puedeEscribir.and.resolveTo(true);
    modalMock = jasmine.createSpyObj('ModalController', ['dismiss']);

    await TestBed.configureTestingModule({
      imports: [EditarProductoComponent],
      providers: [
        { provide: DatabaseService, useValue: dbMock },
        { provide: FreemiumService, useValue: freemiumMock },
        { provide: ModalController, useValue: modalMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarProductoComponent);
    component = fixture.componentInstance;
    component.producto = producto;
    component.ngOnInit();
  });

  it('precarga los valores del producto', () => {
    expect(component.nombre).toBe('Arroz');
    expect(component.precio_venta).toBe('3.500');
    expect(component.minimo_stock).toBe(5);
  });

  it('rechaza un nombre vacio', async () => {
    component.nombre = '   ';
    await component.guardar();
    expect(dbMock.actualizarProducto).not.toHaveBeenCalled();
  });

  it('rechaza un precio en 0', async () => {
    component.precio_venta = '';
    await component.guardar();
    expect(dbMock.actualizarProducto).not.toHaveBeenCalled();
  });

  it('rechaza un stock minimo negativo', async () => {
    component.minimo_stock = -1;
    await component.guardar();
    expect(dbMock.actualizarProducto).not.toHaveBeenCalled();
  });

  it('guarda con los valores parseados', async () => {
    component.nombre = 'Arroz Diana';
    component.precio_venta = '4.200';
    component.minimo_stock = 8;
    await component.guardar();
    expect(dbMock.actualizarProducto).toHaveBeenCalledWith('p1', 'Arroz Diana', 4200, 8);
  });

  it('no guarda si el freemium bloquea', async () => {
    freemiumMock.puedeEscribir.and.resolveTo(false);
    await component.guardar();
    expect(dbMock.actualizarProducto).not.toHaveBeenCalled();
  });
});
