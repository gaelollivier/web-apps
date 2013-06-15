// Put renderer and scene in global scope, in order to access it through the console
var renderer;
var scene;

$(function(){

	renderer = new Renderer();
	$('#canvas-view').html(renderer.canvas);	
	
	renderer.setSize([800, 450]);
	
	scene = testScene();
	//scene = cornelBox();
	scene.setMaxPathLength(3);
	//scene.renderLights = true;
	
	// Add a flycam
	scene.setCamera(new Flycam(renderer, [0, 3, 10], [16, 9], [0, 1, 0]));
	
	renderer.setScene(scene);
	renderer.update();
	
	// Stats
	var stats = new Stats();
	stats.setMode(0); // 0: fps, 1: ms	
	// Align top-left
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';
	document.body.appendChild(stats.domElement);
	
	function loop() {
	    window.requestAnimationFrame(loop);	   	    
	    
	    stats.begin();
	    
	    // Update scene
	    if (scene.camera.update)
	    	if (scene.camera.update())
	    		renderer.reset();
	    
	    // Render
	    renderer.render();
	    
	    // Update stats
	    $('#view-stats').html('Rendered samples: ' + renderer.sampleCount);
	    stats.end();	    
    }

    loop();
    
    // Scenes
    function testScene() {
	    scene = new Scene();
		
		scene.setRenderLights(false);
		scene.setBackgroundColor([1, 1, 1]);
		
		var planeMaterial = new Material([1, 1, 1]);
		var objectMaterial = new Material(colorFromHex(0x4ACC1F));
		objectMaterial.setReflection(1);
		objectMaterial.setGlossiness(0.2);
		
		scene.addObject(Cube.withCenter([-2, 1, 0], 2, objectMaterial));
		scene.addObject(new Sphere([-2, 3, 0], 1, objectMaterial));
		scene.addObject(new Sphere([2, 1, 0], 1, objectMaterial));
		scene.addObject(new Sphere([0, 1, 0], 1, objectMaterial));
		scene.addObject(new Plane([0, 0, 0], [0, 1, 0], planeMaterial));
			
		scene.addLight(new Light([5, 5, 0], 1, colorFromHex(0xffffff)));
	
		return scene;	
    }
    
	function cornelBox() {
		scene = new Scene();
		
		scene.setRenderLights(false);
		
		var planeMaterial = new Material([1, 1, 1]);
		var objectMaterial = new Material([1, 1, 1]);
		objectMaterial.setReflection(1);
		objectMaterial.setGlossiness(0.2);		
		
		scene.addObject(Cube.withCenter([-2, 1, 0], 2, objectMaterial));
		scene.addObject(new Sphere([-2, 3, 0], 1, objectMaterial));
		scene.addObject(new Sphere([2, 1, 0], 1, objectMaterial));
		scene.addObject(new Sphere([0, 1, 0], 1, objectMaterial));
		scene.addObject(new Plane([0, 0, 0], [0, 1, 0], planeMaterial));
		scene.addObject(new Plane([0, 0, -5], [0, 0, 1], planeMaterial));
		scene.addObject(new Plane([-5, 0, 0], [1, 0, 0], new Material([0, 1, 0])));
		scene.addObject(new Plane([5, 0, 0], [-1, 0, 0], new Material([1, 0, 0])));
		scene.addObject(new Plane([0, 6, 0], [0, -1, 0], planeMaterial));
		scene.addObject(new Plane([0, 0, 10], [0, 0, -1], planeMaterial));
			
		scene.addLight(new Light([3, 3, 5], 5, [1, 1, 1]));		
		
		return scene;
	}    
});