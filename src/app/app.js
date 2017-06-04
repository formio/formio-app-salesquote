(function() {
  'use strict';

  /**
   * @ngdoc overview
   * @name formioSalesQuoteApp
   * @description
   * # formioSalesQuoteApp
   *
   * Main module of the application.
   */

  angular
    .module('formioSalesQuoteApp', [
      'formio',
      'ngFormioHelper',
      'ui.router',
      'ngMap',
      'bgf.paginateAnything'
    ])
    .config([
      'FormioProvider',
      'FormioResourceProvider',
      'FormioAuthProvider',
      '$stateProvider',
      '$urlRouterProvider',
      '$locationProvider',
      'AppConfig',
      function(
        FormioProvider,
        FormioResourceProvider,
        FormioAuthProvider,
        $stateProvider,
        $urlRouterProvider,
        $locationProvider,
        AppConfig
      ) {
        $locationProvider.hashPrefix('');
        FormioProvider.setAppUrl(AppConfig.appUrl);
        FormioProvider.setBaseUrl(AppConfig.apiUrl);
        FormioAuthProvider.setStates('auth.login', 'home');
        FormioAuthProvider.setForceAuth(true);
        FormioAuthProvider.register('login', 'user');

        // Add the home state.
        $stateProvider
          .state('home', {
            url: '/?',
            templateUrl: 'views/main.html',
            controller: [
              '$scope',
              '$rootScope',
              function (
                $scope,
                $rootScope
              ) {
                $scope.contracts = [];
                $scope.contractsUrl = $rootScope.contractForm + '/submission';
                $scope.customers = [];
                $scope.customersUrl = $rootScope.customerForm + '/submission';
                $scope.opportunities = [];
                $scope.opportunitiesUrl = $rootScope.opportunityForm + '/submission';
                $scope.quotes = [];
                $scope.quotesUrl = $rootScope.quoteForm + '/submission';
                $scope.agents = [];
                $scope.agentsUrl = $rootScope.agentForm + '/submission';
              }
            ]
          });

        // Register the resources.
        FormioResourceProvider.register('contract', AppConfig.forms.contractForm);
        FormioResourceProvider.register('customer', AppConfig.forms.customerForm, {
          templates: {
            view: 'views/customer/view.html'
          },
          controllers: {
            view: ['$scope', function($scope) {
              $scope.position = {lat: 0, lng: 0};
              $scope.currentResource.loadSubmissionPromise.then(function(customer) {
                if (customer.data.address && customer.data.address.geometry) {
                  $scope.position = customer.data.address.geometry.location;
                }
              });
            }]
          }
        });
        FormioResourceProvider.register('opportunity', AppConfig.forms.opportunityForm);
        FormioResourceProvider.register('agent', AppConfig.forms.agentForm);
        FormioResourceProvider.register('quote', AppConfig.forms.quoteForm);
        $urlRouterProvider.otherwise('/');
      }
    ])
    .run([
      '$rootScope',
      '$state',
      'Formio',
      'FormioAlerts',
      'AppConfig',
      'FormioAuth',
      function(
        $rootScope,
        $state,
        Formio,
        FormioAlerts,
        AppConfig,
        FormioAuth
      ) {
        FormioAuth.init();
        $rootScope.company = AppConfig.company;
        angular.forEach(AppConfig.forms, function(url, form) {
          $rootScope[form] = url;
        });
      }
    ]);
})();
