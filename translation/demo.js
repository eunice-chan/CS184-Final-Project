// import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.118.2/examples/jsm/controls/OrbitControls.js";

// User auxillary
var stats, gui;

// Scene rendering
var scene, camera, renderer, orbit, lights;

// Target
var target;

// End point
var endPoint, defaultEndPoint;

// Line
var line, lineGeometry;

// Model
var mesh, bones, defaultBone, skeletonHelper;

// IK
var methodParametersIK, methodFunctionsIK;

// DLS
var parametersDLS = {
  maxIter: 5,
  lambda: 0.0001,
  increment: 10,
  decrement: 250
};

// SMCM
var parametersSMCM = {
  numParticles: 50,
  n: null,
  weights: null
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

  // Model
  defaultBone = [];
	initModel();

  // Todo: make more flexible
  scene.updateMatrixWorld(true);
	defaultEndPoint = getEndPointWorldPosition();
  bones = mesh.skeleton.bones;
  defaultBone.push( getModelWorldPosition( bones[ 0 ] ) );
  defaultBone.push( getModelWorldPosition( bones[ 1 ] ) );
  defaultBone.push( getModelWorldPosition( bones[ 2 ] ) );

  mesh.randomPose = randomPose;
	mesh.randomPose();
  scene.updateMatrixWorld(true);


  // Target point
  target = getSphere( 0.5 );
  target.pose = resetTargetPostion;
  target.pose();
  target.predict = () => {
    target.position.set( ...betaToPoint( modelToBeta() ).toArray() );
  }
  scene.add( target );

  // INTERACTIONS
  // IK parameters
  methodParametersIK = {
    method: "Levenberg–Marquardt",
    enabled: true,
    run: function(){ methodFunctionsIK[ methodParametersIK.method ].function( methodFunctionsIK[ methodParametersIK.method ].parameters )},
    speed: 0.1,
    mouseTarget: true
  };

  methodFunctionsIK = {
  	"Levenberg–Marquardt": {
      function: DLS,
      parameters: parametersDLS
    },
  	// "Selectively Damped Least Squares": {
    //   function: SDLS,
    //   parameters: parametersSDLS
    // },
  	"Sequential Monte Carlo Method": {
      function: SMCM,
      parameters: parametersSMCM
    }
  }


  // Line that points between target and endpoint
  var material = new THREE.LineBasicMaterial( {
    color: 0xa9a9a9,
    // color: 0x000000
   } );

  points = [];
  points.push( getEndPointWorldPosition() );
  points.push( getTargetWorldPosition() );

  lineGeometry = new THREE.Geometry();
  lineGeometry.vertices = points;

  line = new THREE.Line( lineGeometry, material );
  scene.add( line );

  // Interaction interface
	setupDatGui();

  // Update scene matrix
  scene.updateMatrixWorld(true);

  // When the mouse moves, call the given function
  document.addEventListener('mousemove', onMouseMove, false);

  // Initialize values for SMCM
  initSMCM();

}

  // Follows the mouse event
  // Adapted from https://jsfiddle.net/atwfxdpd/10/
  function onMouseMove(event) {

    if ( methodParametersIK.mouseTarget ) {
      // Update the mouse variable
      event.preventDefault();

     // Make the sphere follow the mouse
      var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
      vector.unproject( camera );
      var direction = vector.sub( camera.position ).normalize();
      var distance = -camera.position.z / direction.z;
      var position = camera.position.clone().add( direction.multiplyScalar( distance ) );

      target.position.set( position.x, position.y, target.position.z );

    }

  };

function render() {

  stats.update();

  updateLine();

  requestAnimationFrame( render );

	if ( methodParametersIK.enabled ) {

    var method = methodFunctionsIK[ methodParametersIK.method ];

    method.function( method.parameters );

	}

	renderer.render( scene, camera );

}

initScene();
render();
