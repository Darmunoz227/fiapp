import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProveedoresListPage } from './proveedores-list.page';

describe('ProveedoresListPage', () => {
  let component: ProveedoresListPage;
  let fixture: ComponentFixture<ProveedoresListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProveedoresListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
