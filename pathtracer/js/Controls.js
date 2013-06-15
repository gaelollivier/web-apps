
var Controls = new function() {

	// Save controls instance
	var $this = this;
	
	this.Vector = function(options) {
		
		this.container = $(options.container);
		this.container.addClass('vector');
		
		this.value = options.value || [0, 0, 0];
		this.onChange = options.change || function(){};
		
		// Add inputs to container
		this.inputs = [
			$('<input type="number" value="0" step="0.1"/>'),
			$('<input type="number" value="0" step="0.1"/>'),
			$('<input type="number" value="0" step="0.1"/>')
		];
		
		for (var i = 0; i < 3; ++i) {
			this.container.append('<span class="vector-label">'+['X', 'Y', 'Z'][i]+':</span>');			
			this.container.append(this.inputs[i]);
			
			// Bind change events on inputs			
			var $vector = this; // Save vector object
			this.inputs[i].change(function(){
				var newValue = [0, 0, 0];
				for (var i = 0; i < 3; ++i) {
					newValue[i] = new Number($vector.inputs[i].val());
				}
				$vector.setValue(newValue);
				$vector.onChange(newValue);
			});
		}
		
		this.setValue(this.value);
	};
	
	this.Vector.prototype.setValue = function(value) {
		this.value = value;
		for (var i = 0; i < 3; ++i) {
			this.inputs[i].val(this.value[i].toFixed(2));
		}
	};

	this.init = function() {
		// Disable selection on canvas view
		$('#canvas-view').on('selectstart', false);
		
		// Create controls accordion
		$('#controls .accordion').accordion({
			heightStyle: 'fill',
			active: 0
		});
		
		// Scene controls
		$this.bgColorPicker = $.farbtastic('#bg-colorpicker', function(hexColor){
			var color = colorFromHex(hexColor);
			scene.setBackgroundColor(color);
			renderer.reset();
		});
		
		$('#exposure').slider({
			min: 0,
			max: 10,
			step: 0.1,
			slide: function(e, ui) {
				scene.setExposure(ui.value);
				renderer.reset();
			},
			animate: 'fast'
		});
		$('#max-path-length').slider({
			min: 1,
			max: 8,
			step: 1,
			slide: function(e, ui) {
				scene.setMaxPathLength(ui.value);
				renderer.buildShaders();
				renderer.reset();
			}
		});
		
		$('#render-lights-switch').buttonset();
		$('input[name=render-lights]').change(function(e){
			scene.setRenderLights($(this).val() == 'enabled');
			renderer.buildShaders();
			renderer.reset();
		});
		
		// Camera
		$this.cameraPosition = new $this.Vector({
			container: '#camera-position',
			change: function(value) {
				scene.camera.setPosition(value);
				renderer.reset();
				$this.populateValues('camera');
			}
		});
		$this.cameraTarget = new $this.Vector({
			container: '#camera-target',
			change: function(value) {
				scene.camera.setTarget(value);
				renderer.reset();
			}
		});
		
		$('#camera-fov').slider({
			min: 1,
			max: 179,
			step: 1,
			slide: function(e, ui) {
				scene.camera.setFovy(ui.value);
				renderer.reset();
			},
			animate: 'fast'
		});
		$('#camera-aperture').slider({
			min: 0,
			max: 1,
			step: 0.01,
			slide: function(e, ui) {
				scene.camera.setAperture(ui.value);
				renderer.reset();
			},
			animate: 'fast'
		});
		$('#camera-focus').change(function(){
			scene.camera.setFocusDistance($(this).val());
			renderer.reset();
		});
	};
	
	this.populateValues = function(section) {
	
		if (typeof section == 'undefined' || section == 'scene') {
			// Scene values
			$this.bgColorPicker.setColor(hexFromColor(scene.backgroundColor));
			$('#exposure').slider('value', scene.exposure);
			$('#max-path-length').slider('value', scene.maxPathLength);
			// Refresh render ligths radio
			$('#render-lights-' + (scene.renderLights ? 'enabled' : 'disabled')).attr('checked', 'checked');
			$('#render-lights-' + (!scene.renderLights ? 'enabled' : 'disabled')).attr('checked', false);
			$('#render-lights-switch').buttonset('refresh');
		}
		
		if (typeof section == 'undefined' || section == 'camera') {
			// Camera values
			$this.cameraPosition.setValue(scene.camera.position);
			$this.cameraTarget.setValue(scene.camera.target);
			$('#camera-aperture').slider('value', scene.camera.aperture);
			$('#camera-focus').val(scene.camera.focusDistance.toFixed(2));
			$('#camera-fov').slider('value', scene.camera.fovy);
		}
	}
};


$(function(){

	Controls.init();
	Controls.populateValues();
	
});