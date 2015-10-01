angular.module('formioSalesQuoteApp').constant('AppConfig', {
  appUrl: '{{ protocol }}://{{ path }}.{{ host }}',
  apiUrl: '{{ protocol }}://api.{{ host }}',
  company: 'Acme Inc.'
});
