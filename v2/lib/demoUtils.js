// GUI
function resize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

// Adapted from https://jsfiddle.net/atwfxdpd/10/
function targetMouse( event ) {

	if ( parameters.mouseTarget ) {

		event.preventDefault();

		var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
		vector.unproject( camera );
		var direction = vector.sub( camera.position ).normalize();
		var distance = -camera.position.z / direction.z;
		var position = camera.position.clone().add( direction.multiplyScalar( distance ) );

		target.position.set( position.x, position.y, target.position.z );

	}

}




// SCENE
function initLights( color = 0xffffff ) {

	lights = [];
	lights[ 0 ] = new THREE.PointLight( color, 0.5, 0 );
	lights[ 1 ] = new THREE.PointLight( color, 0.5, 0 );
  lights[ 2 ] = new THREE.AmbientLight( color, 0.5 );

  // Light positioning
	lights[ 0 ].position.set( 0, 200, -100 );
	lights[ 1 ].position.set( 0, -100, 200 );

  lights.forEach( ( light ) => { scene.add( light ) } );

}




// MODEL
function initModel( param ) {

	var height = param.numBones * param.boneHeight;
	var halfHeight = height * 0.5;

  var sizing = {

		segmentCount: param.numBones,
  	segmentHeight: param.boneHeight,
		height: height,
		halfHeight: halfHeight

	};

  var geometry = createGeometry( param, sizing );
	var bones = createBones( sizing );

	mesh = createMesh( geometry, bones );
	scene.add( mesh );

}

function createGeometry( param, sizing ) {

	var geometry = new THREE.BoxBufferGeometry(

		param.width,
		sizing.height,
		param.depth,
		param.widthSegments,
		sizing.segmentCount * 2,
		param.depthSegments

	);

	var position = geometry.attributes.position;
  position.needsUpdate = true;

  var vertex = new THREE.Vector3();

	var pointsPerLayer = ( sizing.segmentCount * 2 ) + 1;
	pointsPerLayer = pointsPerLayer * ( param.widthSegments + 1 );

	var pointsPerTop = param.widthSegments + 1;
	pointsPerTop = pointsPerTop * ( param.widthSegments + 1 );

	var maxLayer = ( sizing.segmentCount ) * 2 + 1;
	var layer;

  for ( var i = 0; i < position.count; i ++ ) {

    vertex.fromBufferAttribute( position, i );

    if ( i < 2 * ( pointsPerLayer + pointsPerTop ) ) {

      layer = ( Math.floor( i / ( param.widthSegments + 1 ) ) ) % maxLayer;

    } else {

      var j = i - 2 * ( pointsPerLayer + pointsPerTop );
      layer = ( Math.floor( j / ( param.widthSegments + 1 ) ) ) % maxLayer;

    }

    // Left: ( i < pointsPerLayer )
    // Right: ( i < 2 * pointsPerLayer )
		//
    // Top: ( i < 2 *  pointsPerLayer + pointsPerTop  )
    // Bottom: ( i < 2 * ( pointsPerLayer + pointsPerTop ) )
		//
    // Front: ( i < 3 * pointsPerLayer + 2 * pointsPerTop )
    // Back: ( i < 4 * pointsPerLayer + 2 * pointsPerTop )
    switch ( true ) {

      // Left & Right || Front & Back
      case ( i < 2 * pointsPerLayer ) || ( i >= 2 * ( pointsPerLayer + pointsPerTop ) ):

        if ( layer % 2 ) {

          position.setXYZ( i, vertex.x * layer / 5, vertex.y, vertex.z * layer / 5 );

        } else {

					position.setXYZ( i, vertex.x / 6, vertex.y, vertex.z / 6 );

        }

        break;

      // Top & Bottom
      default:

        position.setXYZ( i, vertex.x / 6, vertex.y, vertex.z / 6 );

        break;

    }
	}

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

	geometry.attributes.skinIndex = new THREE.Uint16BufferAttribute( skinIndices, 4 );
	geometry.attributes.skinWeight = new THREE.Float32BufferAttribute( skinWeights, 4 );

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
		side: THREE.DoubleSide,
		flatShading: true

	} );

	var mesh = new THREE.SkinnedMesh( geometry,	material );
	var skeleton = new THREE.Skeleton( bones );

	mesh.add( bones[ 0 ] );

	mesh.bind( skeleton );
	skeletonHelper = new THREE.SkeletonHelper( mesh );
	scene.add( skeletonHelper );

	return mesh;

}

function randomPose() {

	var betaPrime = [];

	modelToBeta().forEach( ( beta ) => { betaPrime.push( ( Math.random() * 2 * Math.PI ) - Math.PI ) } );

	updateMeshKinematics( betaPrime, 1 );

}




// TARGET & END POINT
function getSphere( size, color=0xff84c8 ) {

	var geometry = new THREE.SphereGeometry( size, 24, 24 );

	var material = new THREE.MeshBasicMaterial( {
		color: color
	} );

	var mesh = new THREE.Mesh(
		geometry,
		material
	);

	return mesh;

}




// TARGET & END POINT DISTANCE
function updateLine() {

  points = [ getEndPointWorldPosition(), getTargetWorldPosition() ];

  lineGeometry.vertices = points;
  lineGeometry.verticesNeedUpdate = true;

}

// TARGET
function setTargetPosition() {

  target.position.set( ...getEndPointWorldPosition().toArray() );

	target.position.x += ( Math.random() - 0.5 ) * 2;
	target.position.y += ( Math.random() - 0.5 ) * 2;
	target.position.z += ( Math.random() - 0.5 ) * 2;

}




// DAT GUI INTERFACE
// TODO: modify number of bones in GUI, constraint types (XYZ rotate & move)
function setDatGui() {

	gui.add( mesh , 'pose' ).name( 'Reset Model' );
	gui.add( mesh , 'randomPose' ).name( 'Pose Model' );
	gui.add( line , 'visible' ).name( 'Hide Line' );

	////////////////////////////////

  var folderTarget = gui.addFolder( 'Target' );

	folderTarget.add( parameters, 'mouseTarget' ).name( 'Follow Mouse' );

  folderTarget.add( target, 'predict' ).name( 'To Endpoint' );
	folderTarget.add( target , 'pose' ).name( 'Near Endpoint' );

	folderTarget.add( target.position, 'x', -20, 20 ).name( 'X Position' );
	folderTarget.add( target.position, 'y', -20, 20 ).name( 'Y Position' );
	folderTarget.add( target.position, 'z', -20, 20 ).name( 'Z Position' );

  ////////////////////////////////

  var folderFK = gui.addFolder( 'Forward Kinematics / Pose' );

	var bones = mesh.skeleton.bones;
  var bone, folder;

	var constraints = Object.keys( parameters.constraints );
	constraints.sort();

	constraints.forEach( ( key1 ) => {

		jointNumber = parseInt( key1[ 1 ] );

		bone = bones[ jointNumber ];

		folder = folderFK.addFolder( `Joint ${ jointNumber }` );
		jointGUI( folder, bone );

	} );

  ////////////////////////////////


  var folderIK = gui.addFolder( 'Inverse Kinematics' );

	folderIK.add( methodParametersIK, 'speed', 0, 1 ).name( 'Update Speed' );
  folderIK.add( methodParametersIK, 'enabled' ).name( 'Repeat' );
  folderIK.add( methodParametersIK, 'run' ).name( 'One Step' );
  folderIK.add( methodParametersIK, 'method', Object.keys( methodFunctionsIK ) ).name( 'Method' );

  ////////////////////////////////

	folder = folderIK.addFolder( 'Parameters' );
	var folderParam;

	constraints.forEach( ( key1 ) => {

		jointNumber = parseInt( key1[ 1 ] );

		folderParam = folder.addFolder( `Joint ${ jointNumber }` );
		constraintsGUI( folderParam, jointNumber );

	} );


  ////////////////

	folder = folderIK.addFolder( 'Levenberg–Marquardt' );

	folder.add( parametersDLS, 'maxIter', 1, 1000 ).name( 'Max Iter' ).onChange( ()=>{ parametersDLS.maxIter = Math.floor( parametersDLS.maxIter ) } );

	folderLambda = folder.addFolder( 'Lambda' );
	folderLambda.add( parametersDLS, 'lambda', 0, 1000 ).name( 'Lambda' );
	folderLambda.add( parametersDLS, 'increment', 0, 300 ).name( 'Increment' );
	folderLambda.add( parametersDLS, 'decrement', 0, 300 ).name( 'Decrement' );

  ////////////////

	folder = folderIK.addFolder( 'Sequential Monte Carlo' );

	folder.add( parametersSMCM, 'numParticles', 100, 10000 ).name( '# of Particles' ).onChange( ()=>{

		parametersSMCM.numParticles = Math.floor( parametersSMCM.numParticles );
		initSMCM( );

	 } );
	 folder.add( parametersSMCM, 'distribution', 1, 50 ).name( 'Distribution' )

}


function jointGUI( folder, bone ) {

	folder.add( bone.position, 'x', 0, 20 ).name( 'Move X' );
	folder.add( bone.position, 'y', 0, 20 ).name( 'Move Y' );
	folder.add( bone.position, 'z', 0, 20 ).name( 'Move Z' );

	folder.add( bone.rotation, 'x', - Math.PI, Math.PI ).name( 'Rotate X' );
	folder.add( bone.rotation, 'y', - Math.PI, Math.PI ).name( 'Rotate Y' );
	folder.add( bone.rotation, 'z', - Math.PI, Math.PI ).name( 'Rotate Z' );


}

function constraintsGUI( folder, i ) {

	folder.add( parameters.constraints[`b${ i }`], 'px' ).name( 'Move X' );
	folder.add( parameters.constraints[`b${ i }`], 'py' ).name( 'Move Y' );
	folder.add( parameters.constraints[`b${ i }`], 'pz' ).name( 'Move Z' );

	folder.add( parameters.constraints[`b${ i }`], 'rx' ).name( 'Rotate X' );
	folder.add( parameters.constraints[`b${ i }`], 'ry' ).name( 'Rotate Y' );
	folder.add( parameters.constraints[`b${ i }`], 'rz' ).name( 'Rotate Z' );

}

function updateConstraints() {

	var constraints = {};

	var bones = mesh.skeleton.bones;

	for ( var i = 0; i < bones.length; i ++ ) {

		constraints[ `b${ i }` ] = {

			px: true,
			py: true,
			pz: true,

			rx: true,
			ry: true,
			rz: true

		}

	}

	return constraints;
}
