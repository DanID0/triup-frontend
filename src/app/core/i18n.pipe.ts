import { ChangeDetectorRef, Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../Services/i18n.service';

@Pipe({
  name: 'i18n',
  standalone: true,
  pure: false,
})
export class I18nPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);
  private lastLang = this.i18n.lang();

  transform(key: string): string {
    const current = this.i18n.lang();
    if (current !== this.lastLang) {
      this.lastLang = current;
      this.cdr.markForCheck();
    }
    return this.i18n.t(key);
  }
}

