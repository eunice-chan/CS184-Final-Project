// User interface auxillary
var stats, gui;

// Scene render
var scene, camera, renderer, orbit;

// Scene objects
var lights;

// Model
var mesh, modelParameters;

// End point
var endPoint, defaultEndPoint;

// Target
var target;

// Target to end point line
var line, lineGeometry;

// For calculations
var calcScene, calcMesh;

// Parameters
var parameters;

// IK parameters
var methodParametersIK, methodFunctionsIK;

// IK -- DLS
var parametersDLS;

// IK -- SMCM
var parametersSMCM;




function initScene() {

  // USER INTERFACE AUXILLARY

  // Performance indicator
	stats = new Stats();
	document.body.appendChild( stats.dom );

  // Variable controls
	gui = new dat.GUI();



  // SCENE RENDER

  // Scene
  var sceneColor = 0xffffff;

	scene = new THREE.Scene();
	scene.background = new THREE.Color( sceneColor );

	calcScene = new THREE.Scene();

  // Camera
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 200 );
	camera.position.z = 30;
	camera.position.y = 30;

  // Renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.getElementById( 'demo' ).appendChild( renderer.domElement );

  // View controls
	orbit = new OrbitControls( camera, renderer.domElement );

  // Camera & renderer resize behavior
  window.addEventListener( 'resize', resize, false );



  // POPULATE SCENE

  // Lighting
	initLights( sceneColor );

	// Model
	modelParameters = {

	  numBones: 3,
	  boneHeight: 8,

		width: 5,
		depth: 5,

		widthSegments: 5,
	  depthSegments: 5

	};

	initModel( modelParameters );

  // End point
	var endPointColor = 0x7be779;

  endPoint = getSphere( 0.5, endPointColor );
  scene.add( endPoint );
	mesh.skeleton.bones[ mesh.skeleton.bones.length - 1 ].add( endPoint );


	// Save default end position for calculations
  scene.updateMatrixWorld( true );
	defaultEndPoint = getEndPointWorldPosition();


	// Bones
	// Save default bone positions for calculations
  defaultWorldBone = [];
  defaultLocalBonePos = [];

  bones = mesh.skeleton.bones;
	bones.forEach( ( bone ) => {

		defaultWorldBone.push( getModelWorldPosition( bone ) );
		defaultLocalBonePos.push( bone.position );

	} );

  // Target point
  target = getSphere( 0.5 );
  target.pose = setTargetPosition;
  target.predict = () => {

    target.position.set( ...betaToPoint( modelToBeta() ).toArray() );

  };
  scene.add( target );

	// Target interaction
	document.addEventListener( 'mousemove', targetMouse, false );

	// General parameters
	parameters = {

		mouseTarget: true,

		constraints: updateConstraints()

	};

	// Randomly pose
  mesh.randomPose = randomPose;

  scene.updateMatrixWorld( true );
  target.pose();

	// Line
	// Points between target and endpoint
	var material = new THREE.LineBasicMaterial( {

		color: 0xa9a9a9

	 } );

	points = [ getEndPointWorldPosition(), getTargetWorldPosition() ];

	lineGeometry = new THREE.Geometry();
	lineGeometry.vertices = points;

	line = new THREE.Line( lineGeometry, material );
	scene.add( line );




  // INTERACTIONS

  // IK parameters (default)
  methodParametersIK = {

    method: 'Levenberg–Marquardt',
    enabled: false,
    run: function() { methodFunctionsIK[ methodParametersIK.method ].function( methodFunctionsIK[ methodParametersIK.method ].parameters ) },
    speed: 0.1

  };

	// IK -- DLS parameters
  parametersDLS = {

		maxIter: 5,
		lambda: 0.0001,
		increment: 10,
		decrement: 250

 	};

	// IK -- SMCM parameters
	parametersSMCM = {

		numParticles: 10000,
		distribution: 10,
		n: null,
		weights: null

	};


	methodFunctionsIK = {

  	'Levenberg–Marquardt': {
      function: DLS,
      parameters: parametersDLS
    },

  	'Sequential Monte Carlo': {
      function: SMCM,
      parameters: parametersSMCM
    }

  }



	// MISC

	// Interaction interface
	setDatGui();
	scene.updateMatrixWorld( true );

}

function render() {

  stats.update();

  requestAnimationFrame( render );

	if ( methodParametersIK.enabled ) {

    methodParametersIK.run();

	}

	// TODO: fix when in motion.
  updateLine();

	renderer.render( scene, camera );

}

initScene();
render();
