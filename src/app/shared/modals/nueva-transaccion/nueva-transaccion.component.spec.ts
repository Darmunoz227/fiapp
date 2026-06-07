import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NuevaTransaccionComponent } from './nueva-transaccion.component';

describe('NuevaTransaccionComponent', () => {
  let component: NuevaTransaccionComponent;
  let fixture: ComponentFixture<NuevaTransaccionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NuevaTransaccionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NuevaTransaccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
