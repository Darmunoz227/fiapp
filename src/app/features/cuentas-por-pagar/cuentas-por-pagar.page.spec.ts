import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CuentasPorPagarPage } from './cuentas-por-pagar.page';

describe('CuentasPorPagarPage', () => {
  let component: CuentasPorPagarPage;
  let fixture: ComponentFixture<CuentasPorPagarPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CuentasPorPagarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
