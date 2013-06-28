var Controls = {};

(function() {
	'use strict';
	
	angular.module('pathtracer', []).
			run(function($rootScope) {
				$rootScope.safeApply = function(fn) {
					var phase = this.$root.$$phase;
					if (phase == '$apply' || phase == '$digest') {
						if(fn && (typeof(fn) === 'function')) {
							fn();
						}
					} else {
						this.$apply(fn);
					}
				};
			}).
			controller('PathtracerController', function($scope) {
				$scope.scene = scene;
				
				var resetProperties = [
					'scene.backgroundColor', 'scene.exposure', 'scene.renderLight',
					'scene.camera.position[0]', 'scene.camera.position[1]', 'scene.camera.position[2]',
					'scene.camera.target[0]', 'scene.camera.target[1]', 'scene.camera.target[2]',
					'scene.camera.fovy', 'scene.camera.aperture', 'scene.camera.focusDistance'
				];
				
				for (var i = 0, l = resetProperties.length; i < l; ++i) {
					$scope.$watch(resetProperties[i], function(newValue) {
						renderer.reset();
					});
				}
				
				var rebuildProperties = ['scene.maxPathLength', 'scene.renderLights'];
				
				for (var i = 0, l = rebuildProperties.length; i < l; ++i) {
					$scope.$watch(rebuildProperties[i], function(newValue) {
						renderer.buildShaders();
						renderer.reset();
					});
				}			
				
				// Expose a function to update controls from outside angular
				Controls.populateValues = function() {
					$scope.$apply();
				}
				
			}).
			// Directives
			directive('ptNoSelect', function() {
			    return function (scope, iElement, iAttrs) {
			        iElement.on('selectstart', false);
			     };
			}).
			directive('ptAccordion', function() {
				return function(scope, iElement, iAttrs) {
					// Create controls accordion
					iElement.accordion({
						heightStyle: 'fill',
						active: iAttrs.ptAccordion !== "" ? parseInt(iAttrs.ptAccordion) : 0
					});					
				};
			}).
			directive('ptColorPicker', function($rootScope) {
				return {
					restrict: 'A',
					scope: {
						value: '=ptColorPicker'
					},
					link: function(scope, iElement, iAttrs) {
						var colorPicker = $.farbtastic(iElement, function(hexColor){							
							var color = colorFromHex(hexColor);
							$rootScope.safeApply(function() {
								scope.value = color;
							});							
						});
						
						scope.$watch('value', function(newValue) {
							colorPicker.setColor(hexFromColor(newValue));
						});
					}
				};
			}).
			directive('ptSlider', function($rootScope) {
				return {
					restrict: 'E',
					scope: {
						value: '='
					},
					link: function(scope, iElement, iAttrs) {
						iElement.slider({
							min: parseFloat(iAttrs.min),
							max: parseFloat(iAttrs.max),
							step: parseFloat(iAttrs.step),
							value: scope.value,
							slide: function(e, ui) {
								$rootScope.safeApply(function() {
									scope.value = ui.value;
								});
							},
							animate: 'fast'
						});
					}
				}
			}).
			directive('ptSwitch', function($rootScope) {
				return {
					restrict: 'E',
					scope: {
						value: '='
					},
					link: function(scope, iElement, iAttrs) {
						// Add 'id' and 'for' attribute to inputs
						var name = Math.random();
						iElement.find('input').each(function() {
							var label = $(this).next('label'),
								id = Math.random();
							if (!$(this).attr('name')) {
								$(this).attr('name', name);
							}
							$(this).attr('id', id);
							label.attr('for', id);
						});
						
						$(iElement).find('input').change(function() {
							var newValue = $(this).val() === 'enabled';
							$rootScope.safeApply(function() {
								scope.value = newValue;
							});
						});
						
						scope.$watch('value', function(newValue) {
							$(iElement).find('input').eq(0).attr('checked', scope.value ? 'checked' : false);
							$(iElement).find('input').eq(1).attr('checked', scope.value ? false : 'checked');
							iElement.buttonset('refresh');
						});
						
						iElement.buttonset();
					}
				}
			}).
			directive('ptVec3', function($rootScope) {
				return {
					restrict: 'E',
					scope: {
						value: '='
					},
					link: function(scope, iElement, iAttrs) {
						iElement.addClass('vector');
					
						var inputs = [
							$('<input type="number" value="0" step="0.1"/>'),
							$('<input type="number" value="0" step="0.1"/>'),
							$('<input type="number" value="0" step="0.1"/>')
						];
						
						for (var i = 0; i < 3; ++i) {
							iElement.append('<span class="vector-label">'+['X', 'Y', 'Z'][i]+':</span>');			
							iElement.append(inputs[i]);
						
							inputs[i].change(function(){
								$rootScope.safeApply(function() {
									for (var i = 0; i < 3; ++i) {
										scope.value[i] = parseFloat(inputs[i].val());
									}
								});
							});
							
							(function(i){
								scope.$watch('value['+i+']', function(newValue) {
									inputs[i].val(newValue.toFixed(2));
								});
							}(i));
						}
					}
				};
			}).
			directive('ptFloat', function($rootScope) {
				return {
					restrict: 'E',
					scope: {
						value: '='
					},
					link: function(scope, iElement, iAttrs) {
					    var input = $('<input type="number" step="'+iAttrs.step+'">');
					    iElement.append(input);
					    input.change(function() {
    					    $rootScope.safeApply(function() {
        					    scope.value = parseFloat(input.val());
    					    });
					    });
					    scope.$watch('value', function(newValue) {
    					    input.val(newValue.toFixed(2));
					    });
					}
				};
            }).
            directive('ptButton', function() {
			    return function (scope, iElement, iAttrs) {
			        iElement.button();
			     };
			})
	;
}());