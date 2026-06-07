import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NuevoClienteComponent } from './nuevo-cliente.component';

describe('NuevoClienteComponent', () => {
  let component: NuevoClienteComponent;
  let fixture: ComponentFixture<NuevoClienteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NuevoClienteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NuevoClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
