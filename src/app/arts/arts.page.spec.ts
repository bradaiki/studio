import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

import { ArtsPage } from './arts.page';

describe('ArtsPage', () => {
  let component: ArtsPage;
  let fixture: ComponentFixture<ArtsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtsPage, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        TranslateService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ArtsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
