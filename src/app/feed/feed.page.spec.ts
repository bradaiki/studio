import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { FeedPage } from './feed.page';

describe('FeedPage', () => {
  let component: FeedPage;
  let fixture: ComponentFixture<FeedPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        importProvidersFrom(
          TranslateModule.forRoot()
        ),
        provideTranslateHttpLoader()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FeedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});