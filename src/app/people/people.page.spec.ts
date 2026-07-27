import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { of } from 'rxjs';

import { PeoplePage } from './people.page';

describe('PeoplePage', () => {
  let component: PeoplePage;
  let fixture: ComponentFixture<PeoplePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeoplePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        importProvidersFrom(
          TranslateModule.forRoot()
        ),
        provideTranslateHttpLoader(),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PeoplePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
