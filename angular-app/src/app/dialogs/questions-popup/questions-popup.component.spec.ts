import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionsPopupComponent } from './questions-popup.component';

describe('QuestionsPopupComponent', () => {
  let component: QuestionsPopupComponent;
  let fixture: ComponentFixture<QuestionsPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuestionsPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionsPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
