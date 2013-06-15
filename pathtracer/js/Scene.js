//
// This file contains the scene and all objects that it contains: material, scene objects, cameras, ...
//

//! Description of a material
/*!
	Materials contain all informations on how a objects must appear 
	and react to light
*/
var Material = function(color) {

	this.color = vec3.create();
	this.diffuse = 1.0;
	this.specular = 1.0;
	this.reflection = 0.0;
	this.refraction = 0.0;
	this.shininess = 100.0;
	this.glossiness = 0.0;
	
	this.setColor(color);
	
};

Material.prototype.setColor = function(color) {
	vec3.copy(this.color, color);
}

Material.prototype.setDiffuse = function(diffuse) {
	this.diffuse = diffuse;
}

Material.prototype.setSpecular = function(specular) {
	this.specular = specular;
}

Material.prototype.setReflection = function(reflection) {
	this.reflection = reflection;
}

Material.prototype.setRefraction = function(refraction) {
	this.refraction = refraction;
}

Material.prototype.setShininess = function(shininess) {
	this.shininess = shininess;
}

Material.prototype.setGlossiness = function(glossiness) {
	this.glossiness = glossiness;
}


//! Abstract type of a scene object
/*!
	Representation of an object in the scene
*/
var SceneObject = function(position, material) {
	
	this.position = vec3.create();
	this.material = material || new Material([1, 1, 1]);
	
	this.setPosition(position);
};

SceneObject.prototype.setPosition = function(position) {
	vec3.copy(this.position, position);
};

//! Sphere object
/*!
	\param position Position of the sphere
	\param radius Radius of the sphere
	\param material Sphere's material
*/
var Sphere = function(position, radius, material) {
	
	SceneObject.call(this, position, material);
	
	this.setRadius(radius);
	
};

Sphere.prototype = Object.create(SceneObject.prototype);

Sphere.prototype.ObjectID = 1;

Sphere.prototype.setRadius = function(radius) {
	this.radius = radius;
};

//! Plane object
/*!
	A plane is defined by a point and a normal
	\param position The origin point of the plane
	\param normal Normal defining the orientation of the plane
	\param material Plane's material
*/
var Plane = function(position, normal, material) {
	
	SceneObject.call(this, position, material);
	
	this.normal = vec3.create();
	
	this.setNormal(normal);
	
};

Plane.prototype = Object.create(SceneObject.prototype);

Plane.prototype.ObjectID = 2;

Plane.prototype.setNormal = function(normal) {
	vec3.copy(this.normal, normal);
};

//! Cube object
/*!
	The cube object cannot be rotated, it is axis aligned.
	Thus, it can be defined by a min and max point
	\param min The min point of the cube
	\param max The max point of the cube
	\param material Cube's material
*/
var Cube = function(min, max, material) {
	
	SceneObject.call(this, min, material);
	
	this.min = vec3.create();
	this.max = vec3.create();
	
	this.setMin(min);
	this.setMax(max);
};


Cube.withCenter = function(center, size, material) {
	var min = vec3.create();
	var max = vec3.create();
	
	for (var i = 0; i < 3; ++i)
		min[i] = center[i] - size/2;
	for (var i = 0; i < 3; ++i)
		max[i] = center[i] + size/2;	
	return new Cube(min, max, material);
}

Cube.prototype = Object.create(SceneObject.prototype);

Cube.prototype.ObjectID = 3;

Cube.prototype.setMin = function(min) {
	vec3.copy(this.min, min);
	this.setPosition(min);
};

Cube.prototype.setMax = function(max) {
	vec3.copy(this.max, max);
};


//! Basic light
/*!
	At this time, the only type of light available: a spherical light
	defined by a position, a radius and a color
*/
var Light = function(position, radius, color) {
	
	this.position = vec3.create();
	this.radius = radius;
	this.color = vec3.create();
	
	this.setPosition(position);
	this.setColor(color);
	
};

Light.prototype.ObjectID = 0;

Light.prototype.setPosition = function(position) {
	vec3.copy(this.position, position);
};

Light.prototype.setColor = function(color) {
	vec3.copy(this.color, color);
};

//! Representation of a 3D camera
/*!
	\param position Point of view of the camera
	\param target Point where the camera 'look at'
	\param size Size of the camera projection plane
	\param upVector Vector defining the 'up' direction of the camera
*/
var Camera = function(position, target, size, upVector) {

	this.position = vec3.create();
	this.target = vec3.create();
	this.size = vec2.create();
	this.upVector = vec3.create();
	this.nearClippingPlane = 1;
	this.fovy = 45;
	this.aperture = 0.0;
	this.focusDistance = 0.0;
	
	this.setPosition(position);
	this.setTarget(target);
	this.setSize(size);
	this.setUpVector(upVector);
		
};

Camera.prototype.setPosition = function(position) {
	vec3.copy(this.position, position);
};

Camera.prototype.setTarget = function(target) {
	vec3.copy(this.target, target);
};

Camera.prototype.setSize = function(size) {
	vec2.copy(this.size, size);
};

Camera.prototype.setUpVector = function(upVector) {
	vec3.copy(this.upVector, upVector);
};

Camera.prototype.setNearClippingPlane = function(nearClippingPlane) {
	this.nearClippingPlane = nearClippingPlane;
};

Camera.prototype.setFovy = function(fovy) {
	this.fovy = fovy;
};

Camera.prototype.setAperture = function(aperture) {
	this.aperture = aperture;
};

Camera.prototype.setFocusDistance = function(focusDistance) {
	this.focusDistance = focusDistance;
};


//! Representation of a 3D scene
/*!
	The scene containes everything needed to render the 3D world: 
	objects, lights, camera, ..
*/
var Scene = function() {
	
	this.objects = [];
	this.lights = [];
	this.backgroundColor = vec3.create();
	this.exposure = 2.0;
	this.camera = null;
	this.renderLights = true;
	this.maxPathLength = 3;
	
};

Scene.prototype.setBackgroundColor = function(color) {
	vec3.copy(this.backgroundColor, color);
};

Scene.prototype.setExposure = function(exposure) {
	this.exposure = exposure;
};

Scene.prototype.setRenderLights = function(renderLights) {
	this.renderLights = renderLights;
}

Scene.prototype.setMaxPathLength = function(maxPathLength) {
	this.maxPathLength = maxPathLength;
}

Scene.prototype.setCamera = function(camera) {
	this.camera = camera;
};

Scene.prototype.addObject = function(object) {
	this.objects.push(object);
}

Scene.prototype.addLight = function(light) {
	this.lights.push(light);
}