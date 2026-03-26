import { Component, OnInit, inject, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';

const SPLASH_KEY = 'at-splash:client-welcome';

interface SplashSlide {
  icon: string;
  titleKey: string;
  bodyKey: string;
}

@Component({
  selector: 'at-client-welcome-splash',
  standalone: true,
  templateUrl: './client-welcome-splash.component.html',
  styleUrl: './client-welcome-splash.component.scss',
})
export class ClientWelcomeSplashComponent implements OnInit {
  readonly i18n = inject(I18nService);

  readonly visible = signal(false);
  readonly step = signal(0);

  readonly slides: SplashSlide[] = [
    { icon: 'waving_hand',   titleKey: 'splash.slide1.title', bodyKey: 'splash.slide1.body' },
    { icon: 'handyman',      titleKey: 'splash.slide2.title', bodyKey: 'splash.slide2.body' },
    { icon: 'notifications', titleKey: 'splash.slide3.title', bodyKey: 'splash.slide3.body' },
  ];

  currentSlide(): SplashSlide { return this.slides[this.step()]; }

  ngOnInit(): void {
    if (!localStorage.getItem(SPLASH_KEY)) {
      this.visible.set(true);
    }
  }

  next(): void {
    this.step.update(s => Math.min(s + 1, this.slides.length - 1));
  }

  close(): void {
    localStorage.setItem(SPLASH_KEY, '1');
    this.visible.set(false);
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('splash-overlay')) {
      this.close();
    }
  }
}
