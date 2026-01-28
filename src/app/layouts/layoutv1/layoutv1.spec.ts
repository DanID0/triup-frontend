import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Layoutv1 } from './layoutv1';

describe('Layoutv1', () => {
  let component: Layoutv1;
  let fixture: ComponentFixture<Layoutv1>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Layoutv1]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Layoutv1);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
