import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { of } from 'rxjs';

import { OrgsPage } from './orgs.page';

describe('OrgsPage', () => {
  let component: OrgsPage;
  let fixture: ComponentFixture<OrgsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgsPage],
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

    fixture = TestBed.createComponent(OrgsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});