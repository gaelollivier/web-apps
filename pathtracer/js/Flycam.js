
var Flycam = function(renderer, position, size, upVector) {
		
	Camera.call(this, position, position, size, upVector);
	
	this.teta = Math.PI / 2;
	this.phi = Math.PI;
	
	this.keyStates = {};
	this.mouseOnCanvas = false;
	this.mouseDown = false;
	this.mousePosition = [0, 0];
	this.speed = 0.1;
	this.orientationSpeed = 0.02;
	this.mouseSensibility = 2;
	
	// Bind keyboard events to save key states
	var $this = this;
	$(document).keydown(function(e) {
		if ($this.mouseOnCanvas)		
			$this.keyStates[e.keyCode] = true;
	});
	
	$(document).keyup(function(e) {
		$this.keyStates[e.keyCode] = false;
	});
	$(renderer.canvas).mousedown(function(e) {
		$this.mouseDown = true;
		$this.mouseInitState = {
			position		: $this.mousePosition,
			teta			: $this.teta,
			phi				: $this.phi
		};
	});
	$(document).mouseup(function(e) {
		$this.mouseDown = false;
	});
	$(document).mousemove(function(e) {
		$this.mouseOnCanvas = e.toElement == renderer.canvas;
		$this.mousePosition = [e.offsetX/renderer.size[0], 1 - (e.offsetY/renderer.size[1])];
	});
	
	// Auto focus on click
    $(renderer.canvas).click(function(e) {
	    var ray = scene.camera.getRay([e.offsetX/renderer.size[0], 1 - (e.offsetY/renderer.size[1])]);
	    var result = ray.throw(scene);
	    if (result[1] != Ray.NoIntersect) {
	    	// Focus at the pointed point
	    	var toObjectVector = vec3.clone(ray.direction);
	    	vec3.scale(toObjectVector, toObjectVector, result[1]);
		    scene.camera.focusDistance = vec3.length(toObjectVector);
		    renderer.reset();
		    
		    // Update controls
		    Controls.populateValues();
	    }
    });
	
	// Init target
	vec3.add(this.target, this.target, this.getViewVector());
	
};

Flycam.KeyCodes = {
	left	: 37,
	up		: 38,
	right	: 39,
	down	: 40
};

Flycam.Bindings = {
	viewLeft	:	Flycam.KeyCodes.left,
	viewRight	:	Flycam.KeyCodes.right,
	viewUp		:	Flycam.KeyCodes.up,
	viewDown	:	Flycam.KeyCodes.down,
	
	moveFrontwards	:	'W'.charCodeAt(0),
	moveBackwards	:	'S'.charCodeAt(0),
	moveLeft		:	'A'.charCodeAt(0),
	moveRight		:	'D'.charCodeAt(0),
	moveUp			:	'R'.charCodeAt(0),
	moveDown		:	'F'.charCodeAt(0),	
};

Flycam.prototype = Object.create(Camera.prototype);

Flycam.prototype.getViewVector = function() {
	var viewVector = vec3.clone([
		Math.sin(this.teta) * Math.sin(this.phi),
		Math.cos(this.teta),
		Math.sin(this.teta) * Math.cos(this.phi)
	]);
	vec3.normalize(viewVector, viewVector);
	return viewVector;
};

// Override setPosition from Camera to update target accordingly
Flycam.prototype.setPosition = function(position) {
	Camera.prototype.setPosition.call(this, position);
	vec3.add(this.target, this.position, this.getViewVector());
};

Flycam.prototype.update = function() {
	
	var hasMoved = false;

	var move = vec3.create();
	
	// Change camera direction
	// With keyboard
	if (this.keyStates[Flycam.Bindings.viewUp]) {
		this.teta -= this.orientationSpeed;
		hasMoved = true;
	} else if (this.keyStates[Flycam.Bindings.viewDown]) {
		this.teta += this.orientationSpeed;
		hasMoved = true;
	}
	if (this.keyStates[Flycam.Bindings.viewLeft]) {
		this.phi += this.orientationSpeed;
		hasMoved = true;
	}
	 else if (this.keyStates[Flycam.Bindings.viewRight]) {
		this.phi -= this.orientationSpeed;
		hasMoved = true;
	}
	// Or mouse
	if (this.mouseDown) {
		var mouseMove = vec2.clone(this.mousePosition);
		vec2.sub(mouseMove, mouseMove, this.mouseInitState.position);
		vec2.scale(mouseMove, mouseMove, this.mouseSensibility);
		if (vec2.length(mouseMove) > 0.01) {
			this.teta = this.mouseInitState.teta - mouseMove[1];
			this.phi = this.mouseInitState.phi - mouseMove[0];
			hasMoved = true;
		}
	}
	if (this.teta > (Math.PI - 0.001)) {
		this.teta = Math.PI - 0.001;
	} else if (this.teta < 0.001) {
		this.teta =  0.001;
	}
	
	var viewVector = this.getViewVector();
	
	// Move up and down
	if (this.keyStates[Flycam.Bindings.moveUp]) {
		var upDirection = vec3.clone(this.upVector);
		vec3.add(move, move, upDirection);
	}
	else if (this.keyStates[Flycam.Bindings.moveDown]) {
		var upDirection = vec3.clone(this.upVector);
		vec3.sub(move, move, upDirection);
	}	

	// Move front and backwards
	if (this.keyStates[Flycam.Bindings.moveFrontwards]) {
		var frontDirection = vec3.clone(viewVector);
		vec3.add(move, move, frontDirection);
	}
	else if (this.keyStates[Flycam.Bindings.moveBackwards]) {
		var frontDirection = vec3.clone(viewVector);
		vec3.sub(move, move, frontDirection);
	}
	
	// Move left and right (on the side)
	if (this.keyStates[Flycam.Bindings.moveLeft]) {
		var sideDirection = vec3.create();
		vec3.cross(sideDirection, viewVector, this.upVector);
		vec3.sub(move, move, sideDirection);
	} else if (this.keyStates[Flycam.Bindings.moveRight]) {
		var sideDirection = vec3.create();
		vec3.cross(sideDirection, viewVector, this.upVector);
		vec3.add(move, move, sideDirection);
	}
	
	if (vec3.length(move) > 0 || hasMoved) {
		vec3.normalize(move, move);
		vec3.scale(move, move, this.speed);
		vec3.add(this.position, this.position, move);
		vec3.add(this.target, this.position, viewVector);
		hasMoved = true;
		
		// Update controls
		Controls.populateValues();
	}
	
	return hasMoved;
};