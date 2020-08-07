// User auxillary
var stats, gui;

// Scene rendering
var scene, camera, renderer, orbit, lights;

// Target
var target, moveSpeed, keys, prevY, currY;

// End point
var endPoint, endPointDefaultPosition;

// Model
var mesh, bones, skeletonHelper;

// IK
var methodParametersIK, methodFunctionsIK;

// DLS
var parametersDLS = {
  kMax: 1000,
  beta: null,
  lambda: null,
  v: null
};

// PIDLS
var parametersPIDLS = {

};

// SMCM
var parametersSMCM = {

};

function initScene() {

  // INITIALIZE
  // Performance indicator
	stats = new Stats();
	document.body.appendChild(stats.dom);

  // Variable controls
	gui = new dat.GUI();

  // Scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xffffff );

  // Camera
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 200 );
	camera.position.z = 30;
	camera.position.y = 30;

  // Renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.getElementById("demo").appendChild( renderer.domElement );

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
	lights[ 0 ] = new THREE.PointLight( 0xffffff, 0.5, 0 );
	lights[ 1 ] = new THREE.PointLight( 0xffffff, 0.5, 0 );
  lights[ 2 ] = new THREE.AmbientLight(0xffffff, 0.5);

  // left, top, back
	lights[ 0 ].position.set( 0, 200, -100 );
	lights[ 1 ].position.set( 0, -100, 200 );

	scene.add( lights[ 0 ] );
	scene.add( lights[ 1 ] );
	scene.add( lights[ 2 ] );

  // End point
  endPoint = getSphere( 0.5, color='rgb(123, 231, 121 )' );
	endPoint.position.set(0, 0, 0);
  scene.add( endPoint );

  // Target point
  target = getSphere( 0.5 );
  resetTargetPostion();
  scene.add( target );
  // Move target point
  moveSpeed = 1;
  keys = [];

  top.document.documentElement.addEventListener( 'keydown',
      function( event ) {
          event.preventDefault();
          keys[ event.keyCode ] = true;
          moveTarget( event );
      },
  false );

  top.document.documentElement.addEventListener( 'keyup',
      function( event ){
          keys[ event.keyCode ] = false;
      },
  false );

  document.getElementById("demo").addEventListener('mousemove', moveTargetY, false);

  // Model
	initModel();
  endPointDefaultPosition = getModelWorldPosition( endPoint );

  // INTERACTIONS
  // IK parameters
  methodParametersIK = {
    method:"",
    enabled:true
  }

  methodFunctionsIK = {
  	"Levenberg–Marquardt": {
      function: DLS,
      parameters: parametersDLS
    },
  	"Pseudo-inverse Damped Least Squares": {
      function: PIDLS,
      parameters: parametersPIDLS
    },
  	"Sequential Monte Carlo Method": {
      function: SMCM,
      parameters: parametersSMCM
    }
  }

  // Interaction interface
	setupDatGui();

  // Update scene matrix
  scene.updateMatrixWorld(true);

}

function render() {
  // endPointPosition = getEndPointWorldPosition();
  // console.log("PREVIOUS TRANSFORM ENDPOINT POSITION:"+ endPointPosition.x + " " + endPointPosition.y + " " + endPointPosition.z);
  stats.update();

  requestAnimationFrame( render );

	if ( methodParametersIK.enabled && methodParametersIK.method != '' ) {

    // var method = methodFunctionsIK[ methodParametersIK.method ];
    //
    // method.function( method.parameters );

	}

	renderer.render( scene, camera );

}

initScene();
render();
