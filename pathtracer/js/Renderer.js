
//! Pathtracing renderer
/*!
	Renders a 3D scene using WebGL
*/

var Renderer = function(scene){

	this.canvas = null;
	this.size = [0, 0];
	this.scene = null;
	
	// Create the webgl canvas
	this.canvas = document.createElement('canvas');
	
	this.sampleCount = 0;
	this.sampleWeight = 0;
	
	this.time = 0;
	this.initTime = new Date().getTime();
	
	this.vertexShaderSource = $('#vertex-shader').html();
	this.fragmentShaderSource = $('#fragment-shader').html();
	
	this.isInit = false;
};

Renderer.prototype.setSize = function(size) {
	this.size = size;
	
    // Get powers of two versions of the canvas size
    this.size.push(upperPowerOfTwo(this.size[0]));
    this.size.push(upperPowerOfTwo(this.size[1]));
	
	this.canvas.width = this.size[0];
	this.canvas.height = this.size[1];
};

Renderer.prototype.setScene = function(scene) {
	this.scene = scene;
};

Renderer.prototype.update = function() {
	if (!this.isInit) {
		this.init();
	}
	this.buildShaders();
}

Renderer.prototype.reset = function() {
	this.sampleCount = 0;
}

Renderer.prototype.init = function() {	

	// Init webgl renderer
	try {
        this.gl = this.canvas.getContext('experimental-webgl');
        
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

        // Create render buffer
        this.renderFb = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderFb);
        this.renderFb.width = this.size[2];
        this.renderFb.height = this.size[3];
        
		// Create two textures for rendering
        this.renderTextures = [];
        var type = this.gl.getExtension('OES_texture_float') ? this.gl.FLOAT : this.gl.UNSIGNED_BYTE;
        for (var i = 0; i < 2; ++i) {
	        this.renderTextures.push(this.gl.createTexture());
	        this.gl.bindTexture(this.gl.TEXTURE_2D, this.renderTextures[i]);
        	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.renderFb.width, this.renderFb.height, 0, this.gl.RGBA, type, null);
        }       
		
		// Clean up
		this.gl.bindTexture(this.gl.TEXTURE_2D, null);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		
		// Init render buffers
		this.squareVertexPositionBuffer = this.gl.createBuffer();
	    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
	    var vertices = [
	         1.0,  1.0,  0.0,
	        -1.0,  1.0,  0.0,
	         1.0, -1.0,  0.0,
	        -1.0, -1.0,  0.0
	    ];
	    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
	    this.squareVertexPositionBuffer.itemSize = 3;
	    this.squareVertexPositionBuffer.numItems = 4;
    
    } catch (e) {
    	alert('Could not initialise WebGL, sorry :-(');
    	console.log(e);
    }
    
    this.isInit = true;
}

Renderer.prototype.getShader = function(source, type) {
	var shader;
    if (type == 'fragment') {
        shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    } else if (type == 'vertex') {
        shader = this.gl.createShader(this.gl.VERTEX_SHADER);
    } else {
    	alert('Unhandled shader type');
        return null;
    }
    
    // Parse source (insert generated functions related to scene configuration)
    source = source.replace('{NB_OBJECTS}', this.scene.objects.length + (this.scene.renderLights ? this.scene.lights.length : 0));
    source = source.replace('{NB_LIGHTS}', this.scene.lights.length);
    source = source.replace('{MAX_PATH_LENGTH}', this.scene.maxPathLength);
    
    var intersectWithObjectsFunction = '';
    var castShadowFunction = '';
    var calcDirectLightingFunction = '';
    for (var i = 0; i < this.scene.objects.length; ++i) {
	    intersectWithObjectsFunction += 'intersectWithObject(ray, objects[' + i + '], kMin, intersectedObject);';
	    castShadowFunction += 'if (castShadowWithObject(ray, objects[' + i + '], maxDist)) {return true;}';	    
    }
    for (var i = 0; i < this.scene.lights.length; ++i) {
    	if (this.scene.renderLights) {
    		intersectWithObjectsFunction += 'intersectWithObject(ray, objects[' + (this.scene.objects.length + i) + '], kMin, intersectedObject);';
    	}
	    calcDirectLightingFunction += 'directLighting += calcDirectLightingForLight(ray, lights[' + i + '], object, intersectPoint, normal);';
    }
    
    source = source.replace('{INTERSECT_WITH_OBJECTS}', intersectWithObjectsFunction);
    source = source.replace('{CAST_SHADOW}', castShadowFunction);    
    source = source.replace('{CALC_DIRECT_LIGHTING}', calcDirectLightingFunction);    

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        alert('Shader error ('+type+'):\n' + this.gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

Renderer.prototype.buildShaders = function() {
	// Build the shaders, according to the scene
	var vertexShader = this.getShader(this.vertexShaderSource, 'vertex');
	var fragmentShader = this.getShader(this.fragmentShaderSource, 'fragment');
			
	if (!vertexShader || !fragmentShader)
		return false;
		
	this.pathTracerShader = this.gl.createProgram();
    this.gl.attachShader(this.pathTracerShader, vertexShader);
    this.gl.attachShader(this.pathTracerShader, fragmentShader);
    this.gl.linkProgram(this.pathTracerShader);

    if (!this.gl.getProgramParameter(this.pathTracerShader, this.gl.LINK_STATUS)) {
        alert('Could not initialise shaders (1):\n' + this.gl.getProgramInfoLog(this.pathTracerShader));
        return false;
    }

    this.gl.useProgram(this.pathTracerShader);

    this.pathTracerShader.vertexPositionAttribute = this.gl.getAttribLocation(this.pathTracerShader, 'vertexPosition');
    this.gl.enableVertexAttribArray(this.pathTracerShader.vertexPositionAttribute);
		    
    // Retrieve the uniform locations for rendering
    this.pathTracerShader.renderingUniforms = {};
    this.pathTracerShader.renderingUniforms.texture = this.gl.getUniformLocation(this.pathTracerShader, 'texture');
    this.pathTracerShader.renderingUniforms.sampleWeight = this.gl.getUniformLocation(this.pathTracerShader, 'sampleWeight');
    this.pathTracerShader.renderingUniforms.viewport = this.gl.getUniformLocation(this.pathTracerShader, 'viewport');
    this.pathTracerShader.renderingUniforms.time = this.gl.getUniformLocation(this.pathTracerShader, 'time');
    this.pathTracerShader.renderingUniforms.cursor = this.gl.getUniformLocation(this.pathTracerShader, 'cursor');
		    
    // Retrieve the uniform locations for raytracer attributes
    this.pathTracerShader.sceneUniforms = {};
    
    this.pathTracerShader.sceneUniforms.backgroundColor = this.gl.getUniformLocation(this.pathTracerShader, 'backgroundColor');;
    this.pathTracerShader.sceneUniforms.exposure = this.gl.getUniformLocation(this.pathTracerShader, 'exposure');;
    this.pathTracerShader.sceneUniforms.camera = {};
    this.pathTracerShader.sceneUniforms.camera.position = this.gl.getUniformLocation(this.pathTracerShader, 'camera.position');
    this.pathTracerShader.sceneUniforms.camera.target = this.gl.getUniformLocation(this.pathTracerShader, 'camera.target');
    this.pathTracerShader.sceneUniforms.camera.size = this.gl.getUniformLocation(this.pathTracerShader, 'camera.size');
    this.pathTracerShader.sceneUniforms.camera.upVector = this.gl.getUniformLocation(this.pathTracerShader, 'camera.upVector');
    this.pathTracerShader.sceneUniforms.camera.nearClippingPlane = this.gl.getUniformLocation(this.pathTracerShader, 'camera.nearClippingPlane');
    this.pathTracerShader.sceneUniforms.camera.fovy = this.gl.getUniformLocation(this.pathTracerShader, 'camera.fovy');
    this.pathTracerShader.sceneUniforms.camera.aperture = this.gl.getUniformLocation(this.pathTracerShader, 'camera.aperture');
    this.pathTracerShader.sceneUniforms.camera.focusDistance = this.gl.getUniformLocation(this.pathTracerShader, 'camera.focusDistance');
    
    this.pathTracerShader.sceneUniforms.objects = [];
    this.pathTracerShader.sceneUniforms.lights = [];
    
    for (var i = 0; i < this.scene.objects.length + this.scene.lights.length; ++i) {
    	this.pathTracerShader.sceneUniforms.objects.push({
	    	type: this.gl.getUniformLocation(this.pathTracerShader, 'objects[' + i + '].type'),
	    	position: this.gl.getUniformLocation(this.pathTracerShader, 'objects[' + i + '].position'),
	    	material: {
		    	color		: this.gl.getUniformLocation(this.pathTracerShader, 'objects[' + i + '].material.color'),
		    	diffuse		: this.gl.getUniformLocation(this.pathTracerShader, 'objects[' + i + '].material.diffuse'),
		    	specular	: this.gl.getUniformLocation(this.pathTracerShader, 'objects[' + i + '].material.specular'),
		    	reflection	: this.gl.getUniformLocation(this.pathTracerShader, 'objects[' + i + '].material.reflection'),
		    	refraction	: this.gl.getUniformLocation(this.pathTracerShader, 'objects[' + i + '].material.refraction'),
		    	shininess	: this.gl.getUniformLocation(this.pathTracerShader, 'objects[' + i + '].material.shininess'),
		    	glossiness	: this.gl.getUniformLocation(this.pathTracerShader, 'objects[' + i + '].material.glossiness')
	    	},	    			
	    	datas: this.gl.getUniformLocation(this.pathTracerShader, 'objects[' + i + '].datas')
    	});
    }
    
    for (var i = 0; i < this.scene.lights.length; ++i) {
    	this.pathTracerShader.sceneUniforms.lights.push({
	    	position	: this.gl.getUniformLocation(this.pathTracerShader, 'lights[' + i + '].position'),
	    	color		: this.gl.getUniformLocation(this.pathTracerShader, 'lights[' + i + '].color'),
	    	radius		: this.gl.getUniformLocation(this.pathTracerShader, 'lights[' + i + '].radius')
    	});
    }
    
    // Send texture uniform (will not change)
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.uniform1i(this.pathTracerShader.renderingUniforms.texture, 0);
    
    //
    // Create a simple shader that draws a texture
    //
    var textureVertexShaderSource =
		' attribute vec3 vertexPosition;' +
		' varying vec2 textureCoord;' +
		' uniform vec4	viewport;' +
		' void main() {' +
		'   textureCoord = vertexPosition.xy * 0.5 + 0.5;' +
		'	textureCoord.x *= viewport.x/viewport.z;' +
		'	textureCoord.y *= viewport.y/viewport.w;' +
		'   gl_Position = vec4(vertexPosition, 1.0);' +
		' }'
    ;
    
    var textureFragmentShaderSource =
		' precision mediump float;' +
		' varying vec2 textureCoord;' +
		' uniform sampler2D texture;' +
		' void main() {' +
		'   gl_FragColor = texture2D(texture, textureCoord);' +
		' }'
    ;
    
    var textureVertexShader = this.getShader(textureVertexShaderSource, 'vertex');
    var textureFragmentShader = this.getShader(textureFragmentShaderSource, 'fragment');
    this.textureShader = this.gl.createProgram();
    this.gl.attachShader(this.textureShader, textureVertexShader);
    this.gl.attachShader(this.textureShader, textureFragmentShader);
    this.gl.linkProgram(this.textureShader);

    if (!this.gl.getProgramParameter(this.textureShader, this.gl.LINK_STATUS)) {
        alert('Could not initialise shaders (2)\n');
        return false;
    }
    
    // Get uniform and attribute locations
    this.textureShader.renderingUniforms = {};
    this.textureShader.renderingUniforms.texture = this.gl.getUniformLocation(this.textureShader, 'texture');
    this.textureShader.renderingUniforms.viewport = this.gl.getUniformLocation(this.textureShader, 'viewport');
    
    // Send texture uniform (will not change)
    this.gl.useProgram(this.textureShader);
    this.gl.uniform1i(this.textureShader.textureUniform, 0);
    
    return true;
}

Renderer.prototype.render = function() {
	// Update sample count
	this.sampleWeight = this.sampleCount / (this.sampleCount+1);
	this.sampleCount += 1;
		
	// And time
	this.time = (new Date().getTime() - this.initTime) / 1000.0;			

	// Launch the pathtracing, draw into our texture
	
	this.gl.viewport(0, 0, this.size[0], this.size[1]);
	
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderFb);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.renderTextures[1], 0);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // Use Pathtracer shader
    this.gl.useProgram(this.pathTracerShader);
    
    // Bind the texture in which we read previous rendered values
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.renderTextures[0]);
    
    // We draw a simple quad
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
    this.gl.vertexAttribPointer(this.pathTracerShader.vertexPositionAttribute, this.squareVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    // Send uniform datas
    this.setRenderingUniforms(this.pathTracerShader);
    this.setSceneUniforms(this.pathTracerShader);
    
    // Render the scene
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.squareVertexPositionBuffer.numItems);
      
        
    // Draw the texture

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // Use simple shader to draw texture
    this.gl.useProgram(this.textureShader);
    
    // Prepare the quad
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
    this.gl.vertexAttribPointer(this.pathTracerShader.vertexPositionAttribute, this.squareVertexPositionBuffer.itemSize, this.gl.FLOAT, false, 0, 0);    
    
    // Send uniform datas
    this.setRenderingUniforms(this.textureShader);
    
    // Render the texture we draw in
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.renderTextures[1]);
    
    // Render
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.squareVertexPositionBuffer.numItems);
    
    // Flip the textures !
    this.renderTextures.reverse();
}

Renderer.prototype.setRenderingUniforms = function(program) {
	this.gl.uniform4fv(program.renderingUniforms.viewport, this.size);
	this.gl.uniform1f(program.renderingUniforms.sampleWeight, this.sampleWeight);
	this.gl.uniform1f(program.renderingUniforms.time, this.time);
}

Renderer.prototype.setSceneUniforms = function(program) {
	// Scene
	this.gl.uniform3fv(program.sceneUniforms.backgroundColor, this.scene.backgroundColor);
	this.gl.uniform1f(program.sceneUniforms.exposure, this.scene.exposure);

	// Camera
	this.gl.uniform3fv(program.sceneUniforms.camera.position, this.scene.camera.position);	
	this.gl.uniform3fv(program.sceneUniforms.camera.target, this.scene.camera.target);
	this.gl.uniform2fv(program.sceneUniforms.camera.size, this.scene.camera.size);
	this.gl.uniform3fv(program.sceneUniforms.camera.upVector, this.scene.camera.upVector);
	this.gl.uniform1f(program.sceneUniforms.camera.nearClippingPlane, this.scene.camera.nearClippingPlane);
	this.gl.uniform1f(program.sceneUniforms.camera.fovy, this.scene.camera.fovy);
	this.gl.uniform1f(program.sceneUniforms.camera.aperture, this.scene.camera.aperture);
	this.gl.uniform1f(program.sceneUniforms.camera.focusDistance, this.scene.camera.focusDistance);
		
	for (var i = 0; i < this.scene.objects.length; ++i) {
		this.gl.uniform1i(program.sceneUniforms.objects[i].type, this.scene.objects[i].ObjectID);
		this.gl.uniform3fv(program.sceneUniforms.objects[i].position, this.scene.objects[i].position);
		this.gl.uniform3fv(program.sceneUniforms.objects[i].material.color, this.scene.objects[i].material.color);
		this.gl.uniform1f(program.sceneUniforms.objects[i].material.diffuse, this.scene.objects[i].material.diffuse);
		this.gl.uniform1f(program.sceneUniforms.objects[i].material.specular, this.scene.objects[i].material.specular);
		this.gl.uniform1f(program.sceneUniforms.objects[i].material.reflection, this.scene.objects[i].material.reflection);
		this.gl.uniform1f(program.sceneUniforms.objects[i].material.refraction, this.scene.objects[i].material.refraction);		
		this.gl.uniform1f(program.sceneUniforms.objects[i].material.shininess, this.scene.objects[i].material.shininess);
		this.gl.uniform1f(program.sceneUniforms.objects[i].material.glossiness, this.scene.objects[i].material.glossiness);
		
		// Object datas depends on object type
		var datas = [0, 0, 0];
		if (this.scene.objects[i] instanceof Sphere) {
			datas[0] = this.scene.objects[i].radius;
		} else if (this.scene.objects[i] instanceof Plane) {
			datas = this.scene.objects[i].normal;
		} else if (this.scene.objects[i] instanceof Cube) {
			datas = this.scene.objects[i].max;
		}
		
		this.gl.uniform3fv(program.sceneUniforms.objects[i].datas, datas);
	}
	// Send lights as objects
	if (this.scene.renderLights) {
			for (var i = 0; i < this.scene.lights.length; ++i) {
			this.gl.uniform1i(program.sceneUniforms.objects[this.scene.objects.length + i].type, Light.prototype.ObjectID);
			this.gl.uniform3fv(program.sceneUniforms.objects[this.scene.objects.length + i].position, this.scene.lights[i].position);
			this.gl.uniform3fv(program.sceneUniforms.objects[this.scene.objects.length + i].material.color, this.scene.lights[i].color);
			this.gl.uniform1f(program.sceneUniforms.objects[this.scene.objects.length + i].material.diffuse, 1);
			this.gl.uniform1f(program.sceneUniforms.objects[this.scene.objects.length + i].material.specular, 0);
			this.gl.uniform1f(program.sceneUniforms.objects[this.scene.objects.length + i].material.reflection, 0);
			this.gl.uniform1f(program.sceneUniforms.objects[this.scene.objects.length + i].material.refraction, 0);		
			this.gl.uniform1f(program.sceneUniforms.objects[this.scene.objects.length + i].material.shininess, 0);
			this.gl.uniform1f(program.sceneUniforms.objects[this.scene.objects.length + i].material.glossiness, 0);
			
			// Object datas depends on object type
			var datas = [this.scene.lights[i].radius, 0, 0];
			this.gl.uniform3fv(program.sceneUniforms.objects[this.scene.objects.length + i].datas, datas);
		}
	}
	
	for (var i = 0; i < this.scene.lights.length; ++i) {
		this.gl.uniform3fv(program.sceneUniforms.lights[i].position, this.scene.lights[i].position);
		this.gl.uniform3fv(program.sceneUniforms.lights[i].color, this.scene.lights[i].color);
		this.gl.uniform1f(program.sceneUniforms.lights[i].radius, this.scene.lights[i].radius);
	}
}