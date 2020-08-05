var stats, gui, scene, camera, renderer, orbit, lights, mesh, bones, skeletonHelper;

function initScene() {

  // INITIALIZE
  // Performance indicator
	stats = new Stats();
	document.body.appendChild(stats.dom);

  // Variable controls
	gui = new dat.GUI();

  // Scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x444444 );

  // Camera
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 200 );
	camera.position.z = 30;
	camera.position.y = 30;

  // Renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

  // View controls
	orbit = new THREE.OrbitControls( camera, renderer.domElement );

  // Set camera & renderer resize behavior
  window.addEventListener( 'resize', function () {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

  }, false );


  // POPULATE SCENE
  // Lighting
	lights = [];
	lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
	lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );

  // left, top, back
	lights[ 0 ].position.set( 0, 200, -100 );
	lights[ 1 ].position.set( 0, -100, 200 );

	scene.add( lights[ 0 ] );
	scene.add( lights[ 1 ] );

  // Model
	initModel();
  // Model interaction
	setupDatGui();

}

function createGeometry( sizing ) {
  // new THREE.BoxGeometry(w, h, d)
	var geometry = new THREE.BoxBufferGeometry(
		5, // width
		sizing.height, // height
		3, // depth
		5, // widthSegments
		sizing.segmentCount * 3, // heightSegments
		5 // depthSegments
	);

	var position = geometry.attributes.position;

	var vertex = new THREE.Vector3();

	var skinIndices = [];
	var skinWeights = [];

	for ( var i = 0; i < position.count; i ++ ) {

		vertex.fromBufferAttribute( position, i );

		var y = ( vertex.y + sizing.halfHeight );

		var skinIndex = Math.floor( y / sizing.segmentHeight );
		var skinWeight = ( y % sizing.segmentHeight ) / sizing.segmentHeight;

		skinIndices.push( skinIndex, skinIndex + 1, 0, 0 );
		skinWeights.push( 1 - skinWeight, skinWeight, 0, 0 );

	}

	geometry.attributes.skinIndex = new THREE.Uint16BufferAttribute( skinIndices, 4 ) ;
	geometry.attributes.skinWeight = new THREE.Float32BufferAttribute( skinWeights, 4 ) ;

	return geometry;

}

function createBones( sizing ) {

	bones = [];

	var prevBone = new THREE.Bone();
	bones.push( prevBone );
	prevBone.position.y = - sizing.halfHeight;

	for ( var i = 0; i < sizing.segmentCount; i ++ ) {

		var bone = new THREE.Bone();
		bone.position.y = sizing.segmentHeight;
		bones.push( bone );
		prevBone.add( bone );
		prevBone = bone;

	}

	return bones;

}

function createMesh( geometry, bones ) {

	var material = new THREE.MeshPhongMaterial( {
		skinning: true,
		color: 0x156289,
		emissive: 0x072534,
		side: THREE.DoubleSide
	} );

	var mesh = new THREE.SkinnedMesh( geometry,	material );
	var skeleton = new THREE.Skeleton( bones );

	mesh.add( bones[ 0 ] );

	mesh.bind( skeleton );

	skeletonHelper = new THREE.SkeletonHelper( mesh );
	scene.add( skeletonHelper );

	return mesh;

}

function shapeModel() {

  for ( var i = 0; i < bones.length; i ++ ) {

		var bone = bones[ i ];

    if ( i % 2 == 0 ) {

      bone.scale.x = 0.5;
      bone.scale.z = 0.5;

    } else {

      bone.scale.x = 2 - ( i / 10 );
      bone.scale.z = 2 - ( i / 10 );

    }

	}

}

function setupDatGui() {

	gui.add( mesh, "pose" );
	gui.__controllers[ 0 ].name( "Reset Pose" );

  var folderFK = gui.addFolder("Forward Kinematics")

	var bones = mesh.skeleton.bones;
  var folder;

  ////////////////

  var bone = bones[ 0 ];

  folder = folderFK.addFolder( "Shoulder" );

  folder.add( bone.rotation, 'x', - Math.PI * 0.5, Math.PI * 0.5 );
  folder.add( bone.rotation, 'y', - Math.PI * 0.5, Math.PI * 0.5 );
  folder.add( bone.rotation, 'z', - Math.PI * 0.5, Math.PI * 0.5 );

  folder.__controllers[ 0 ].name( "rotation.x" );
  folder.__controllers[ 1 ].name( "rotation.y" );
  folder.__controllers[ 2 ].name( "rotation.z" );

  //////////////

  var bone = bones[ 2 ];

  folder = folderFK.addFolder( "Elbow" );

  folder.add( bone.rotation, 'x', - Math.PI * 0.5, Math.PI * 0.5 );
  folder.add( bone.rotation, 'y', - Math.PI * 0.5, Math.PI * 0.5 );
  folder.add( bone.rotation, 'z', - Math.PI * 0.5, Math.PI * 0.5 );

  folder.__controllers[ 0 ].name( "rotation.x" );
  folder.__controllers[ 1 ].name( "rotation.y" );
  folder.__controllers[ 2 ].name( "rotation.z" );

  ////////////////

  var bone = bones[ 4 ];

  folder = folderFK.addFolder( "Wrist" );

  folder.add( bone.rotation, 'x', - Math.PI * 0.5, Math.PI * 0.5 );
  folder.add( bone.rotation, 'y', - Math.PI * 0.5, Math.PI * 0.5 );
  folder.add( bone.rotation, 'z', - Math.PI * 0.5, Math.PI * 0.5 );

  folder.__controllers[ 0 ].name( "rotation.x" );
  folder.__controllers[ 1 ].name( "rotation.y" );
  folder.__controllers[ 2 ].name( "rotation.z" );

}

function initModel() {
  // Number of bones
  var segmentCount = 6;
  // Bone height
  var segmentHeight = 4;

	var height = segmentHeight * segmentCount;
	var halfHeight = height * 0.5;

  var sizing = {
		segmentHeight: segmentHeight,
		segmentCount: segmentCount,
		height: height,
		halfHeight: halfHeight
	};

  var geometry = createGeometry( sizing );
	var bones = createBones( sizing );
	mesh = createMesh( geometry, bones );

  shapeModel();

	scene.add( mesh );
}

function render() {

  stats.update();
	requestAnimationFrame( render );

	var time = Date.now() * 0.001;

	// Animation: Wiggle the bones
	// if ( state.animateBones ) {
  //
	// 	for ( var i = 0; i < mesh.skeleton.bones.length; i ++ ) {
  //
	// 		mesh.skeleton.bones[ i ].rotation.z = Math.sin( time ) * 2 / mesh.skeleton.bones.length;
  //
	// 	}
  //
	// }

	renderer.render( scene, camera );

}

initScene();
render();

		// function init() {
// 	var scene = new THREE.Scene();
// 	var gui = new dat.GUI();
// 	var stats = new Stats();
// 	document.body.appendChild(stats.dom);
//
// 	// camera
// 	var camera = new THREE.PerspectiveCamera(
// 		45, // field of view
// 		window.innerWidth / window.innerHeight, // aspect ratio
// 		1, // near clipping plane
// 		1000 // far clipping plane
// 	);
// 	camera.position.z = 10;
// 	camera.position.x = 0;
// 	camera.position.y = 5;
// 	camera.lookAt(new THREE.Vector3(0, 0, 0));
//
//   var skeleton = [];
//   var skeletonViewer = [];
//
// 	// load external geometry
// 	var loader = new THREE.OBJLoader();
//
// 	loader.load('./models/arm.obj', function (geometry, materials) {
// 		// var colorMap = textureLoader.load('/assets/models/head/Face_Color.jpg');
// 		// var bumpMap = textureLoader.load('/assets/models/head/Face_Disp.jpg');
// 		// var faceMaterial = getMaterial('phong', 'rgb(200, 20, 100)');
//
//     var object = new THREE.SkinnedMesh(geometry, new THREE.MeshFaceMaterial(materials));
//     var objectViewer = new THREE.SkeletonHelper(object);
//     skeleton.push(object);
//     skeletonViewer.push(objectViewer);
//     console.log(skeleton);
//
//     object.castShadow = true;
//
// 		scene.add(object);
//
//
//   	// var folder1 = gui.addFolder('Forward Kinematics');
//   	// folder1.add(object.skeleton.bones[0].rotation, 'x', -5, 15);
//   	// folder1.add(object.skeleton.bones[0].rotation, 'y', -5, 15);
//   	// folder1.add(object.skeleton.bones[0].rotation, 'z', -5, 15);
// 	});
//
//   var directionalLight1 = getDirectionalLight();
//   directionalLight1.position.x = -20;
//   directionalLight1.position.y = -25;
//   directionalLight1.position.z = -15;
//   scene.add(directionalLight1);
//
//   var directionalLight2 = getDirectionalLight();
// 	directionalLight2.position.x = 20;
// 	directionalLight2.position.y = 25;
// 	directionalLight2.position.z = 15;
// 	scene.add(directionalLight2);
//
// 	// renderer
// 	var renderer = new THREE.WebGLRenderer();
// 	renderer.setSize(window.innerWidth, window.innerHeight);
// 	renderer.shadowMap.enabled = true;
// 	renderer.setClearColor('rgb(200, 200, 200)');
//
// 	var controls = new THREE.OrbitControls( camera, renderer.domElement );
//
// 	document.getElementById('demo').appendChild(renderer.domElement);
//
// 	update(renderer, scene, camera, controls, stats);
//
// 	return scene;
// }
//
// function getMaterial(type, color) {
// 	var selectedMaterial;
// 	var materialOptions = {
// 		color: color === undefined ? 'rgb(255, 255, 255)' : color,
// 	};
//
// 	switch (type) {
// 		case 'basic':
// 			selectedMaterial = new THREE.MeshBasicMaterial(materialOptions);
// 			break;
// 		case 'lambert':
// 			selectedMaterial = new THREE.MeshLambertMaterial(materialOptions);
// 			break;
// 		case 'phong':
// 			selectedMaterial = new THREE.MeshPhongMaterial(materialOptions);
// 			break;
// 		case 'standard':
// 			selectedMaterial = new THREE.MeshStandardMaterial(materialOptions);
// 			break;
// 		default:
// 			selectedMaterial = new THREE.MeshBasicMaterial(materialOptions);
// 			break;
// 	}
//
// 	return selectedMaterial;
// }
//
// function getDirectionalLight() {
// 	var light = new THREE.DirectionalLight(0xffffff, 1.5);
// 	light.castShadow = true;
// 	var shadowMapSize = 30;
//
// 	//Set up shadow properties for the light
// 	light.shadow.mapSize.width = 2048;
// 	light.shadow.mapSize.height = 2048;
//
// 	light.shadow.camera.left = -shadowMapSize;
// 	light.shadow.camera.bottom = -shadowMapSize;
// 	light.shadow.camera.right = shadowMapSize;
// 	light.shadow.camera.top = shadowMapSize;
//
// 	return light;
// }
//
// function update(renderer, scene, camera, controls, stats) {
// 	controls.update();
// 	stats.update();
// 	renderer.render(scene, camera);
// 	requestAnimationFrame(function() {
// 		update(renderer, scene, camera, controls, stats);
// 	});
// }
//
// var scene = init();
