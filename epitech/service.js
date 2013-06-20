angular.
	module('epitech', ['ngCookies']).
	factory('epitech', function($http, $cookies, $q, $rootScope){
		var epitech = function() {
					
			var $this = this;
			
			$this.serviceUrl = '/epitech/service.php';
			
			$this.auth = true;
			
			// Will hold the login of the authenticated student
			$this.login = undefined;
			
			// An event handler to be notified when service finish an login request
			$this.onAuthenticate = angular.noop;
			
			$this.isAuthenticated = function() {
				return this.auth !== false;
			};
			
			$this.login = function(login, password, callback) {
				var deferred = $q.defer();
				
				$http.post(this.serviceUrl, {
					action	: 'auth',
					login	: login,
					password: password
				}).then(function(response) {
					$this.auth = (response.data.auth == 'success');
					if ($this.auth) {
    					$this.login = response.data.login;
					}
					$this.onAuthenticate($this.auth, $this.login);
					deferred.resolve($this.auth);
				}, function() {
					deferred.reject();
				});
				
				return deferred.promise;
			};
			
			// Returns a list of cities for a given promo
			$this.cities = function(promo) {
				var deferred = $q.defer();
				
				$http.post(this.serviceUrl, {
					action	: 'cities',
					promo	: promo
				}).then(function(response) {
					deferred.resolve(response.data.cities);
				}, function() {
					deferred.reject();
				});

				return deferred.promise;
			};
			
			// Returns a list of students for a given city and promo
			$this.students = function(promo, city) {
				var deferred = $q.defer();
				
				$http.post(this.serviceUrl, {
					action	: 'students',
					promo	: promo,
					city	: city
				}).then(function(response) {
					deferred.resolve(response.data.students);
				}, function() {
					deferred.reject();
				});

				return deferred.promise;
			};
			
			
			var downloadingPhotos = [];
			
			// Download photos from a list of students
			$this.downloadPhotos = function(students, progressCallback) {				
				var deferred = $q.defer();
				
				if (downloadingPhotos.length) {
					for (var i = 0; i < downloadingPhotos.length; ++i) {
						downloadingPhotos.src = '#';
						delete downloadingPhotos[i];
					}
					downloadingPhotos = [];
				}
				
				var totalLoaded = 0;
				var error = false;
				for (var i = 0; i < students.length; ++i) {
					var student = students[i],
						photoUrl = 'http://cdn.local.epitech.net/userprofil/profilview/'+student.login+'.jpg',
						photo = new Image();							
					downloadingPhotos.push(photo);
					student.photo = photo;
					var done = function(success) {
						++totalLoaded;
						if (progressCallback) {
							$rootScope.$apply(function(){
								progressCallback(totalLoaded / students.length);
							});
						}
						if (totalLoaded == students.length) {
							deferred.resolve(error);
						}
					};
					photo.onload = function() {
						done(true);
					};
					photo.onerror = function() {
						error = true;
						this.fail = true;
						done(false);
					}
					photo.src = photoUrl;
				}
				
				return deferred.promise;
			};
			
			// Returns a list of students with their GPA given promo
			$this.studentsGPA = function(promo) {
				var deferred = $q.defer();
				
				$http.post(this.serviceUrl, {
					action	: 'studentsGPA',
					promo	: promo
				}).then(function(response) {
					deferred.resolve(response.data.students);
				}, function() {
					deferred.reject();
				});
				
				return deferred.promise;
			};
			
			// Check if we are already authenticated
			$http.post(this.serviceUrl, {
				action	: 'isAuthenticated'
			}).success(function(response) {
				$this.authenticated = (response.auth == 'success');
				if ($this.authenticated) {
    				$this.login = response.login;
				}
				$this.onAuthenticate($this.authenticated, $this.login);
			});
		};
		
		return new epitech();
	})
;