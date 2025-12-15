
import { Component, OnInit, Inject, Renderer2 } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [CommonModule, RouterModule], // <-- NgIf, ng-template, routerLink
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.css']
})
export class LandingpageComponent implements OnInit {
  // Footer year pinned to 2025
  year = 2025;

  // Dark mode state
  isDark = false;

  private isBrowser: boolean;
  private rootEl: HTMLElement | null = null;

  constructor(
    private router: Router,
    @Inject(DOCUMENT) private doc: Document,
    @Inject(PLATFORM_ID) platformId: Object,
    private renderer: Renderer2
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Work only in browser
    if (this.isBrowser) {
      this.rootEl = this.doc.documentElement;

      const stored = this.safeGet('theme'); // 'dark' | 'light' | null
      if (stored === 'dark') {
        this.enableDark(true);
      } else if (stored === 'light') {
        this.enableDark(false);
      } else {
        const prefersDark = !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        this.enableDark(prefersDark);
      }
    }
  }

  toggleDarkMode(): void {
    this.enableDark(!this.isDark);
    if (this.isBrowser) {
      this.safeSet('theme', this.isDark ? 'dark' : 'light');
    }
  }

  private enableDark(enable: boolean): void {
    this.isDark = enable;
    if (this.isBrowser && this.rootEl) {
      if (enable) {
        this.renderer.addClass(this.rootEl, 'dark');
      } else {
        this.renderer.removeClass(this.rootEl, 'dark');
      }
    }
  }

  private safeGet(key: string): string | null {
    try {
      return window?.localStorage?.getItem?.(key) ?? null;
    } catch {
      return null;
    }
  }

  private safeSet(key: string, value: string): void {
    try {
      window?.localStorage?.setItem?.(key, value);
    } catch {
      // ignore write errors (private mode / SSR)
    }
  }

  // Navigation handlers
  onGetStarted(): void { this.router.navigate(['/ideas/new']); }
  onExplore(): void    { this.router.navigate(['/ideas']); }
  onLogin(): void      { this.router.navigate(['/auth/login']); }
  onContact(): void    { this.router.navigate(['/support/contact']); }
  onPrivacy(): void    { this.router.navigate(['/legal/privacy']); }
}
