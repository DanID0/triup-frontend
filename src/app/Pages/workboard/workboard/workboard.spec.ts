import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Workboard } from './workboard';

describe('Workboard', () => {
  let component: Workboard;
  let fixture: ComponentFixture<Workboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Workboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Workboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
