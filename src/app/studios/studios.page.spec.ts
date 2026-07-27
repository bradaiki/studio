import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { of } from 'rxjs';
import { StudiosPage } from './studios.page';

describe('StudiosPage', () => {
  let component: StudiosPage;
  let fixture: ComponentFixture<StudiosPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudiosPage],
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
            queryParams: of({}),
            params: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudiosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
