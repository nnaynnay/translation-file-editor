import { Component } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
    selector: 'app-sample-i18n',
    standalone: true,
    imports: [CurrencyPipe, DatePipe],
    template: `
    <div class="p-8 space-y-8">
      <h1 class="text-2xl font-bold" i18n="@@sample.title">I18n Sample Page</h1>

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
}
