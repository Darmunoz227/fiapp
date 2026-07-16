import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';

import { NuevaTransaccionComponent } from './nueva-transaccion.component';

describe('NuevaTransaccionComponent', () => {
  let component: NuevaTransaccionComponent;
  let fixture: ComponentFixture<NuevaTransaccionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NuevaTransaccionComponent],
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

    fixture = TestBed.createComponent(NuevaTransaccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});