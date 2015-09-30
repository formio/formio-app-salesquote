(function() {
  /* global localStorage: false */
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
      'ui.router',
      'ngMap'
    ])
    .filter('ucfirst', [function() {
      return function(input) {
        return input.charAt(0).toUpperCase() + input.substring(1);
      };
    }])
    .provider('Resource', [
      '$stateProvider',
      function(
        $stateProvider
      ) {
        var resources = {};
        return {
          register: function(name) {
            resources[name] = name;
            var formName = name + 'Form';
            $stateProvider
              .state(name + 'Index', {
                url: '/' + name,
                templateUrl: 'views/resource/index.html',
                controller: ['$scope', '$state', function ($scope, $state) {
                  $scope.resourceName = name;
                  $scope.resourceForm = $scope[formName];
                  $scope.$on('submissionView', function(event, submission) {
                    $state.go(name + '.view', {id: submission._id});
                  });

                  $scope.$on('submissionEdit', function(event, submission) {
                    $state.go(name + '.edit', {id: submission._id});
                  });

                  $scope.$on('submissionDelete', function(event, submission) {
                    $state.go(name + '.delete', {id: submission._id});
                  });
                }]
              })
              .state(name + 'Create', {
                url: '/create/' + name,
                templateUrl: 'views/resource/create.html',
                controller: ['$scope', '$state', function ($scope, $state) {
                  $scope.resourceForm = $scope[formName];
                  $scope.$on('formSubmission', function(event, submission) {
                    $state.go(name + '.view', {id: submission._id});
                  });
                }]
              })
              .state(name, {
                abstract: true,
                url: '/' + name + '/:id',
                templateUrl: 'views/resource.html',
                controller: ['$scope', '$stateParams', function ($scope, $stateParams) {
                  $scope.resourceName = name;
                  $scope.resourceForm = $scope[formName];
                  $scope.resourceUrl = $scope.resourceForm + '/submission/' + $stateParams.id;
                }]
              })
              .state(name + '.view', {
                url: '/',
                parent: name,
                templateUrl: 'views/' + name + '/view.html',
                controller: ['$scope', '$stateParams', 'Formio', function ($scope, $stateParams, Formio) {
                  $scope.resource = {};
                  $scope.position = {lat: '40.74', lng: '-74.18'};
                  (new Formio($scope.resourceUrl)).loadSubmission().then(function(submission) {
                    if (submission.data.address) {
                      $scope.position.lat = submission.data.address.geometry.location.lat;
                      $scope.position.lng = submission.data.address.geometry.location.lng;
                    }
                    $scope.resource = submission;
                  });
                }]
              })
              .state(name + '.edit', {
                url: '/edit',
                parent: name,
                templateUrl: 'views/resource/edit.html',
                controller: ['$scope', '$state', function ($scope, $state) {
                  $scope.$on('formSubmission', function(event, submission) {
                    $state.go(name + '.view', {id: submission._id});
                  });
                }]
              })
              .state(name + '.delete', {
                url: '/delete',
                parent: name,
                templateUrl: 'views/resource/delete.html',
                controller: ['$scope', '$state', function ($scope, $state) {
                  $scope.$on('delete', function() {
                    $state.go(name + 'Index');
                  });
                }]
              });
          },
          $get: function() {
            return resources;
          }
        };
      }
    ])
    .config([
      'FormioProvider',
      'ResourceProvider',
      '$stateProvider',
      '$urlRouterProvider',
      'AppConfig',
      function(
        FormioProvider,
        ResourceProvider,
        $stateProvider,
        $urlRouterProvider,
        AppConfig
      ) {

        // Set the base url for formio.
        FormioProvider.setBaseUrl(AppConfig.apiUrl);

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
          })
          .state('admin', {
            abstract: true,
            url: '/admin',
            templateUrl: 'views/admin/auth.html'
          })
          .state('admin.login', {
            url: '/login',
            parent: 'admin',
            templateUrl: 'views/admin/login.html',
            controller: ['$scope', '$state', '$rootScope', function($scope, $state, $rootScope) {
              $scope.$on('formSubmission', function(err, submission) {
                if (!submission) { return; }
                $rootScope.isAdmin = true;
                localStorage.setItem("admin", 1);
                $rootScope.user = submission;
                $state.go('home');
              });
            }]
          })
          .state('auth', {
            abstract: true,
            url: '/auth',
            templateUrl: 'views/user/auth.html'
          })
          .state('auth.login', {
            url: '/login',
            parent: 'auth',
            templateUrl: 'views/user/login.html',
            controller: ['$scope', '$state', '$rootScope', function($scope, $state, $rootScope) {
              $scope.$on('formSubmission', function(err, submission) {
                if (!submission) { return; }
                $rootScope.isAdmin = false;
                localStorage.setItem("admin", 0);
                $rootScope.user = submission;
                $state.go('home');
              });
            }]
          });

        // Register the resources.
        ResourceProvider.register('contract');
        ResourceProvider.register('customer');
        ResourceProvider.register('opportunity');
        ResourceProvider.register('agent');
        ResourceProvider.register('quote');
        $urlRouterProvider.otherwise('/');
      }
    ])
    .factory('FormioAlerts', [
      '$rootScope',
      function (
        $rootScope
      ) {
        var alerts = [];
        return {
          addAlert: function (alert) {
            $rootScope.alerts.push(alert);
            if (alert.element) {
              angular.element('#form-group-' + alert.element).addClass('has-error');
            }
            else {
              alerts.push(alert);
            }
          },
          getAlerts: function () {
            var tempAlerts = angular.copy(alerts);
            alerts.length = 0;
            alerts = [];
            return tempAlerts;
          },
          onError: function showError(error) {
            if (error.message) {
              this.addAlert({
                type: 'danger',
                message: error.message,
                element: error.path
              });
            }
            else {
              var errors = error.hasOwnProperty('errors') ? error.errors : error.data.errors;
              angular.forEach(errors, showError.bind(this));
            }
          }
        };
      }
    ])
    .run([
      '$rootScope',
      '$state',
      'Formio',
      'FormioAlerts',
      'AppConfig',
      function(
        $rootScope,
        $state,
        Formio,
        FormioAlerts,
        AppConfig
      ) {
        // Set the company name.
        $rootScope.company = AppConfig.company;

        // Set the forms
        $rootScope.baseUrl = AppConfig.apiUrl;
        $rootScope.contractForm = AppConfig.appUrl + '/contract';
        $rootScope.customerForm = AppConfig.appUrl + '/customer';
        $rootScope.opportunityForm = AppConfig.appUrl + '/opportunity';
        $rootScope.agentForm = AppConfig.appUrl + '/agent';
        $rootScope.quoteForm = AppConfig.appUrl + '/quote';
        $rootScope.userLoginForm = AppConfig.appUrl + '/agent/login';
        $rootScope.adminLoginForm = AppConfig.appUrl + '/admin/login';

        // Set the user who is logged in.
        if (!$rootScope.user) {
          Formio.currentUser().then(function(user) {
            $rootScope.user = user;
            $rootScope.isAdmin = parseInt(localStorage.getItem("admin"), 10) === 1;
          });
        }

        var logoutError = function() {
          $state.go('auth.login');
          FormioAlerts.addAlert({
            type: 'danger',
            message: 'Your session has expired. Please log in again.'
          });
        };

        $rootScope.$on('formio.sessionExpired', logoutError);

        // Trigger when a logout occurs.
        $rootScope.logout = function() {
          localStorage.setItem("admin", 0);
          Formio.logout().then(function() {
            $state.go('auth.login');
          }).catch(logoutError);
        };

        $rootScope.isActive = function(state) {
          return $state.current.name.indexOf(state) !== -1;
        };

        // Ensure they are logged.
        $rootScope.$on('$stateChangeStart', function(event, toState) {
          $rootScope.authenticated = !!Formio.getToken();
          if (toState.name.substr(0, 4) === 'auth') { return; }
          if (toState.name.substr(0, 11) === 'admin.login') { return; }
          if(!$rootScope.authenticated) {
            event.preventDefault();
            $state.go('auth.login');
          }
        });

        $rootScope.$on('$stateChangeSuccess', function() {
          $rootScope.alerts = FormioAlerts.getAlerts();
        });
      }
    ]);
})();
