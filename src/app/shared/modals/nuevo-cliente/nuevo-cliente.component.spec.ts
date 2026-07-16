import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ModalController } from '@ionic/angular/standalone';

import { NuevoClienteComponent } from './nuevo-cliente.component';

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
});