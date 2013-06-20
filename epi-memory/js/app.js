(function() {
	'use strict';
	
	var _ = {
		NoAuthenticatedError: 'Vous devez être authentifié pour accéder au jeu ! Cliquez sur "Commencer"',
		ServiceError: {
			'error': 'Une erreur est survenue ! Si elle persiste, veuillez la debuguer ! Merci :)'
		}
	};

	angular.module('EpiMemory', ['epitech', 'ui.bootstrap']).
		config(function($routeProvider, $httpProvider) {
			$routeProvider.
				when('/', {controller: 'HomeController', templateUrl:'partials/home.html', data:'ca'}).
				when('/game', {controller: 'GameController', templateUrl:'partials/game.html'}).
				when('/leaderboard', {controller: 'LeaderboardController', templateUrl:'partials/leaderboard.html'}).
				when('/about', {controller: 'AboutController', templateUrl:'partials/about.html'}).
				otherwise({redirectTo:'/'})
			;
			
			// Register the reponse interceptor for error and auth checking
			$httpProvider.responseInterceptors.push(function($q, $location, $timeout, $injector) {
				return function (promise) {
					return promise.then(function(response) {
						if (response.config.data !== undefined
							&& response.config.data.action !== undefined) {
							if (response.data.status != 'success') {
								alert(_.ServiceError[response.data.status ? response.data.status : 'error']);
								$location.path('/');
							} else if (response.config.data.action !== 'auth'
								&& response.data.auth == 'fail') {
								// Auth error
								if ($location.path().indexOf('/game') !== -1) {
									alert(_.NoAuthenticatedError);
									$location.path('/');
								}
								// Update epitech service (we need to invoke it before)
								$injector.invoke(function(epitech) {
									epitech.auth = false;
								});								
							}
						}
						return promise;
					}, function(response) {
						return $q.reject(response);
					});
				};
			});
		}).	
		run(function($rootScope, $location){
			$rootScope.navCollapse = true;
			$rootScope.$location = $location;
		}).		
		controller('EpiMemoryController', function($scope, $routeParams){
			$scope.promos = {
				'2017' : 'EPITECH 2017',
				'2016' : 'EPITECH 2016',
				'2015' : 'EPITECH 2015',
				'2014' : 'EPITECH 2014',
				'2013' : 'EPITECH 2013'
			};
			
			$scope.citiesNames = {
				'PAR' : 'Paris',
				'TLS' : 'Toulouse',
				'NAN' : 'Nantes',
				'LYN' : 'Lyon',
				'LIL' : 'Lille',
				'NCE' : 'Nice',
				'BDX' : 'Bordeaux',
				'MAR' : 'Marseille',
				'STG' : 'Strasbourg',
				'NCY' : 'Nancy',
				'MPL' : 'Montpellier',
				'REN' : 'Rennes'
			};
		}).
		controller('HomeController', function($scope, $location, epitech) {
			$scope.loginModal = {
				opened	: false,
				close	: function(){
					$scope.loginModal.opened = false;
				},
				options	: {
					backdropFade: true,
					dialogFade: true
				}
			};
			$scope.authFailed = false;
			$scope.authLoading = false;
		
			$scope.begin = function() {
				if (epitech.isAuthenticated()) {
					$location.path('/game');
				}
				else
					$scope.loginModal.opened = true;
			};
			
			$scope.login = function() {
				if ($scope.form.$valid) {
					$scope.authLoading = true;
					epitech.login($scope.form.login, $scope.form.password).then(function(auth){
						$scope.authLoading = false;
						if (auth) {
							$location.path('/game');
						} else {
							$scope.authFailed = true;
						}
					});
				}
			};
		}).
		controller('GameController', function($scope, $location, $timeout, $http, epitech) {
		
			if (!epitech.isAuthenticated()) {
				$timeout(function() {
					alert(_.NoAuthenticatedError);
					$location.path('/');
				});
			}
		
			// Game form
			
			$scope.gameForm = true;
			
			$scope.cities = [];
			
			$scope.promo = undefined;
			
			$scope.loadingProgress = 0;
			$scope.ready = false;
			
			$scope.$watch('promo', function(newValue) {
				if (newValue) {
				    $scope.cities = undefined;
				    $scope.city = undefined;
					// Get the list of cities for the selected promo
					epitech.cities(newValue).then(function(cities) {
						$scope.cities = cities;
					});
				}		
			});
			
			$scope.$watch('city', function(newValue) {
				$scope.students = undefined;
				$scope.loadingProgress = 0;
				$scope.ready = false;
				if (newValue) {
					// Get the list of students for the given promo and city
					epitech.students($scope.promo, newValue).then(function (students) {
						$scope.students = students;
						// Launch the download of the students photos !
						epitech.downloadPhotos(students, function(progress) {
							$scope.loadingProgress = progress * 100;
						}).then(function(error) {
							// If we had errors, remove students without photos
							if (error) {
								for (var i = 0; i < students.length; ++i) {
									if (students[i].photo.fail) {
										students.splice(i, 1);
									}
								}
							}
	
							$scope.ready = true;
						});
					});
				}
			});
			
			// Game
			
			$scope.totalTime = 60;
			$scope.gameBegan = false;
			$scope.studentsEntered = [];
			$scope.score = 0;
			$scope.validStudents = 0;
			
			var currentStudentIndex = 0,
				timePerStudent = 3; // Avg time per student, used for the score
			
			var selectNewStudent = function() {
				$scope.inputLogin = '';
				if ($scope.studentsLeft.length > 0) {
					currentStudentIndex = Math.round(Math.random() * ($scope.studentsLeft.length - 1));
					$scope.currentStudent = $scope.studentsLeft[currentStudentIndex];
				} else {
					$scope.endGame();
				}
			};
					
			var updateGame = function() {
				$scope.remainingTime =  ($scope.totalTime - (new Date().getTime() - $scope.startTime)/1000);
				
				// That's crappy... should write a directive
				$('#student > input').focus();
				
				if ($scope.remainingTime <= 0) {
					$scope.endGame();
				} else {
					$timeout(updateGame, 100);
				}				
			};
			
			$scope.beginGame = function() {
				$scope.gameForm = false;
				$scope.gameReport = false;
				$scope.gameBegan = true;
				
				$scope.startTime = new Date().getTime();
				$scope.score = 0;
				
				$scope.validStudents = 0;
				$scope.studentsEntered = [];
				
				$scope.studentsLeft = $scope.students.slice(0); // Copy students array
				
				selectNewStudent();
				updateGame();
			};
			
			$scope.loginEntered = function() {
				var input = $scope.inputLogin.trim().toLowerCase();
				if (input.length > 0) {
					$scope.studentsEntered.push({
						login: input,
						student: $scope.currentStudent
					});
					
					// Remove student from the list if the login is good
					if ($scope.inputLogin == $scope.currentStudent.login) {
						$scope.validStudents += 1;
						$scope.score += 42;
						$scope.studentsLeft.splice(currentStudentIndex, 1);
					}
					selectNewStudent();
				}
			};
						
			$scope.endGame = function() {
				$scope.gameBegan = false;
				$scope.gameReport = true;						
					
				$scope.scoreEvaluation = $scope.validStudents / ($scope.totalTime / timePerStudent);
				
				// Send score
				if ($scope.score > 0) {
					$scope.savingScore = true;
					$http.post('save-score.php', {
	    				login   : epitech.login,
	    				promo   : $scope.promo,
	    				city    : $scope.city,
	    				score   : $scope.score
					}).then(function(){
					    $scope.savingScore = false;
					});
				}
			};
			
			$scope.resetGame = function() {
    			$scope.gameBegan = false;
    			$scope.gameReport = false;    			
    			$scope.gameForm = true;
    			
    			$scope.students = [];
    			$scope.promo = undefined;
    			$scope.cities = undefined;
    			$scope.city = undefined;
			};
			
		}).
		
		controller('LeaderboardController', function($scope, $http) {
			var scores = $scope.scores = [],
				values;
			// Load the scores
			$http.get('scores.json').then(function(response) {
				// Construct the scores table
				scores.length = 0;
				for (var key in response.data) {
					if (response.data.hasOwnProperty(key)) {
						values = key.split('/');
						scores.push({
							login: values[0],
							promo: values[1],
							city: $scope.citiesNames[values[2]],
							score: response.data[key]
						});
					}
				}
			});
		}).
		
		controller('AboutController', function($scope) {
			
		})
		;

}());