import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-sample-i18n',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="p-8 space-y-8">
      <div class="flex justify-end mb-4">
        <label for="lang-switcher" class="mr-2 self-center">Language:</label>
        <select 
          id="lang-switcher" 
          (change)="switchLanguage($event)"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        >
          @for (lang of languages; track lang.code) {
            <option [value]="lang.code">{{ lang.label }}</option>
          }
        </select>
      </div>
      <h1 class="text-2xl font-bold" i18n="@@sample.title">I18n Sample Page</h1>
      <h1 class="text-xl">{{ subTitle }}</h1>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold" i18n="section header|Header for basic text example@@sample.basic.header">Basic Text</h2>
        <p i18n="@@sample.basic.content">This is a simple paragraph that needs translation.</p>
        <p i18n>This paragraph has no custom ID, just the i18n attribute.</p>
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold" i18n="@@sample.images.header">Images</h2>
        <img src="favicon.ico" alt="Angular Logo" i18n-alt="@@sample.image.alt" />
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold" i18n="@@sample.cardinal.header">Cardinal Plurals</h2>
        <p i18n="@@sample.cardinal.message">
          Updated {minutes, plural, =0 {just now} =1 {one minute ago} other {{{minutes}} minutes ago}}
        </p>
      </section>

      <section class="space-y-4">
         <h2 class="text-xl font-semibold" i18n="@@sample.select.header">Select ICU</h2>
         <p i18n="@@sample.select.message">
           The user is {gender, select, male {male} female {female} other {other}}
         </p>
      </section>

      <section class="space-y-4">
         <h2 class="text-xl font-semibold" i18n="@@sample.currency.header">Currency Pipe</h2>
         <p i18n="@@sample.currency.message">
           The price is: {{ price | currency }}
         </p>
      </section>

      <section class="space-y-4">
         <h2 class="text-xl font-semibold" i18n="@@sample.date.header">Date Pipe</h2>
         <p i18n="@@sample.date.message">
           Today is: {{ today | date:'fullDate' }}
         </p>
      </section>
    </div>
  `
})
export class SampleI18nComponent {
  minutes = 5;

  gender = 'female';

  price = 123.45;

  today = new Date();

  subTitle = $localize`A sample sub title|Sub title@@sample.subTitle`;

  languages = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'zh-HK', label: '繁體中文 (HK)' },
    { code: 'ja', label: '日本語' }
  ];

  switchLanguage(event: Event) {
    const target = event.target as HTMLSelectElement;
    const langCode = target.value;

    // In a real localized build, we would navigate to /{langCode}/...
    // For this demo, we can just simulate or log it, or try to navigate if the server was set up.
    // Assuming standard Angular build --localize output:
    const newUrl = `/${langCode}/sample-i18n`;
    window.location.href = newUrl;
  }
}
