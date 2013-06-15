//! Ray object
var Ray = function(origin, direction) {
	this.origin = vec3.create();
	this.direction = vec3.create();
	
	this.setOrigin(origin);
	this.setDirection(direction);
};

Ray.prototype.setOrigin = function(origin) {
	vec3.copy(this.origin, origin);
};

Ray.prototype.setDirection = function(direction) {
	vec3.copy(this.direction, direction);
};

Ray.Epsilon = 0.0001;
Ray.NoIntersect = -1.0;

//! Objects intersections
Sphere.prototype.intersectWithRay = function(ray) {
    // From http://en.wikipedia.org/wiki/Line–sphere_intersection
    var oc = vec3.create();
    vec3.sub(oc, ray.origin, this.position);
    var a = vec3.dot(ray.direction, ray.direction);
    var b = 2.0 * vec3.dot(ray.direction, oc);
    var c = vec3.dot(oc, oc) - this.radius*this.radius;
    var delta = b*b - 4.0*a*c;
    if (delta > 0.0) {
        var d = (-b - Math.sqrt(delta)) / (2.0*a);
        if (d > 0.0)
            return d;
    }
    return Ray.NoIntersect;
};

Plane.prototype.intersectWithRay = function(ray) {
    // From http://en.wikipedia.org/wiki/Line-plane_intersection
    var denom = vec3.dot(ray.direction, this.normal);
    if (denom != 0.0) {
    	var tmp = vec3.create();
    	vec3.sub(tmp, this.position, ray.origin);
        return vec3.dot(tmp, this.normal) / denom;
    }
    return Ray.NoIntersect;
}

Cube.prototype.intersectWithRay = function(ray) {
    // From http://madebyevan.com/webgl-path-tracing/webgl-path-tracing.js
    var tMin = vec3.create(), tMax = vec3.create(), t1 = vec3.create(), t2 = vec3.create();
    vec3.sub(tMin, this.min, ray.origin);
    vec3.div(tMin, tMin, ray.direction);
    vec3.sub(tMax, this.max, ray.origin);
    vec3.div(tMax, tMax, ray.direction);   
    vec3.min(t1, tMin, tMax);
    vec3.max(t2, tMin, tMax);
    var tNear = Math.max(Math.max(t1[0], t1[1]), t1[2]);
    var tFar = Math.min(Math.min(t2[0], t2[1]), t2[2]);
    if (tNear > tFar)
        return Ray.NoIntersect;
    return tNear;	
}

//! Send a ray in the scene and return the index of the hit object
Ray.prototype.throw = function(scene) {
	var intersectedObject = -1;
	var kMin = Ray.NoIntersect;
	for (var i = 0; i < scene.objects.length; ++i) {
		var k = scene.objects[i].intersectWithRay(this);
		if (k != Ray.NoIntersect && k > Ray.Epsilon && (intersectedObject == -1 || k < kMin)) {
			intersectedObject = i;
			kMin = k;
		}
	}
	return [intersectedObject, kMin];
}

// Return the camera ray at point x,y
Camera.prototype.getRay = function(point) {
	// From http://schabby.de/picking-opengl-ray-tracing/
	var view = vec3.create(), h = vec3.create(), v = vec3.create(),
		projectPoint = vec3.create(), direction = vec3.create();
		
	vec3.sub(view, this.target, this.position);
	vec3.normalize(view, view);
	
	vec3.cross(h, view, this.upVector);
	vec3.normalize(h, h);
	vec3.cross(v, h, view);
	vec3.normalize(v, v);	
	
	var rad = this.fovy * Math.PI / 180.0;
	var vLength = Math.tan(rad / 2.0) * this.nearClippingPlane;
	var hLength = vLength * (this.size[0] / this.size[1]);

	vec3.scale(h, h, hLength);
	vec3.scale(v, v, vLength);

	var screenSpace = [2.0 * point[0] - 1.0, 2.0 * point[1] - 1.0];

    for (var i = 0; i < 3; ++i) {
	    projectPoint[i] = this.position[i] + view[i]*this.nearClippingPlane +
	    					h[i]*screenSpace[0] + v[i]*screenSpace[1];
    }

    vec3.sub(direction, projectPoint, this.position);
    vec3.normalize(direction, direction);
        
	return new Ray(this.position, direction);
}