
// TODO: move to manipulationUtils, modify for IK.
function predictTransform() {
	// shoulderRotateY, elbowRotateX, elbowMoveX, elbowMoveZ, wristRotateX, wristRotateY, wristRotateZ
	var beta = [ 1, 2, 8, 5, 1, 2, Math.PI ]
	var endPointPosition = getEndPointWorldPosition();
	var transformedPoint = new THREE.Vector3().copy(endPointPosition);
	var bones = mesh.skeleton.bones;

	var bone, bonePosition, negativeBonePosition;

  ////////////////////////////////

  bone = bones[ 0 ];
	bonePosition = getModelWorldPosition( bone );


	// Translate to origin
	bonePosition.negate();
	transformedPoint.add(bonePosition);

	// Tranform
	transformedPoint = rotate(transformedPoint, 'y', beta[0]);

	// Translate back
	bonePosition.negate();
	transformedPoint.add(bonePosition);

  //////////////

  var bone = bones[ 1 ];
	bonePosition = getModelWorldPosition( bone );


	// Translate to origin
	bonePosition.negate();
	transformedPoint.add(bonePosition);

	// Tranform
	transformedPoint = rotate(transformedPoint, 'y', beta[1]);
	// transformedPoint.x += beta[2];
	// transformedPoint.z += beta[3];

	// Translate back
	bonePosition.negate();
	transformedPoint.add(bonePosition);

  ////////////////

  bone = bones[ 2 ];
	bonePosition = getModelWorldPosition( bone );


	// Translate to origin
	bonePosition.negate();
	transformedPoint.add(bonePosition);

	// Tranform
	transformedPoint = rotate(transformedPoint, 'x', beta[4]);
	transformedPoint = rotate(transformedPoint, 'y', beta[5]);
	transformedPoint = rotate(transformedPoint, 'z', beta[6]);

	// Translate back
	bonePosition.negate();
	transformedPoint.add(bonePosition);

  ////////////////////////////////

	mesh.skeleton.bones[0].rotation.y = beta[0];

	mesh.skeleton.bones[1].rotation.x = beta[1];
	mesh.skeleton.bones[1].position.x = beta[2];
	mesh.skeleton.bones[1].position.z = beta[3];
	
	mesh.skeleton.bones[2].rotation.x = beta[4];
	mesh.skeleton.bones[2].rotation.y = beta[5];
	mesh.skeleton.bones[2].rotation.z = beta[6];

	console.log("PREVIOUS TRANSFORM ENDPOINT POSITION:"+ endPointPosition.x + " " + endPointPosition.y + " " + endPointPosition.z);
	console.log("CURRENT TRANSFORM CALCULATED POSITION: "+ transformedPoint.x + " " + transformedPoint.y + " " + transformedPoint.z);
}

function setupDatGui() {

	gui.add( mesh , "pose" ).name( "Reset Pose" );
	// TODO: end me
	gui.add( methodParametersIK, 'enabled' ).name( "Test Predict" ).onChange((e)=>{predictTransform()});


  var folderFK = gui.addFolder("Forward Kinematics");

	var bones = mesh.skeleton.bones;
  var folder;


  ////////////////////////////////


  var bone = bones[ 0 ];

  folder = folderFK.addFolder( "Shoulder" );

  folder.add( bone.rotation, 'y', - Math.PI * 0.5, Math.PI * 0.5 ).name( "Rotate" );

  //////////////

  var bone = bones[ 1 ];

  folder = folderFK.addFolder( "Elbow" );

  // So that it won't completely bend on itself. It's not a very flexible arm. :)
  folder.add( bone.rotation, 'x', 0, 2 ).name( "Rotate" );
  folder.add( bone.position, 'x', -5, 5 ).name( "Move X" );
  folder.add( bone.position, 'z', -5, 5 ).name( "Move Z" );

  ////////////////

  var bone = bones[ 2 ];

  folder = folderFK.addFolder( "Wrist" );

  folder.add( bone.rotation, 'x', - Math.PI * 0.5, Math.PI * 0.5 ).name( "Rotate X" );
  folder.add( bone.rotation, 'y', - Math.PI * 0.5, Math.PI * 0.5 ).name( "Rotate Y" );
  folder.add( bone.rotation, 'z', - Math.PI * 0.5, Math.PI * 0.5 ).name( "Rotate Z" );


  ////////////////////////////////


  var folderIK = gui.addFolder( "Inverse Kinematics" );

  folderIK.add( methodParametersIK, 'enabled' ).name( 'Use IK' );
  folderIK.add( methodParametersIK, 'method', Object.keys( methodFunctionsIK ) ).name( 'Method' );

  ////////////////

	folder = folderIK.addFolder( "Levenberg–Marquardt" );

	folder.add( parametersDLS, 'max_iter', 0, 1000 ).name(" Max Iter" );

  ////////////////

}

function moveTarget( event ) {

    var keyCode = event.which;

    if ( keys[ 87 ] ) {
      // W key
      target.position.z += moveSpeed;
    }

    if ( keys[ 83 ] ) {
      // S key
      target.position.z -= moveSpeed;
    }

    if ( keys[ 65 ] ) {
      // A key
      target.position.x -= moveSpeed;
    }

    if ( keys[ 68 ] ) {
      // D key
      target.position.x += moveSpeed;
    }

    if ( keys[ 32 ] ) {
      // space bar
      resetTargetPostion();
    }

    target.verticesNeedUpdate = true;

}

function moveTargetY( event ) {

    currY = - ( event.clientY / window.innerHeight ) * 2 + 1;
    if ( keys [ 16 ] ) {
      // shift
      if ( prevY ) {
        if ( currY - prevY > 0 ) {
          // Moved up
          target.position.y += moveSpeed / 2;
        } else {
          // Moved down
          target.position.y -= moveSpeed / 2;

        }
        target.verticesNeedUpdate = true;
      }
    }
    prevY = currY;
}

function resetTargetPostion() {
  target.position.set(0, 15, 0);
}


function initModel( wireframe = true ) {
  // Number of bones
  var segmentCount = 3;
  // Bone height
  var segmentHeight = 8;

	var height = segmentHeight * segmentCount;
	var halfHeight = height * 0.5;

  var sizing = {
		segmentCount: segmentCount,
  	segmentHeight: segmentHeight,
		height: height,
		halfHeight: halfHeight
	};

  var geometry = createGeometry( sizing );
	var bones = createBones( sizing );

	mesh = createMesh( geometry, bones );
  mesh.position.set( 0, 0, 0) ;
	scene.add( mesh );
	mesh.skeleton.bones[ mesh.skeleton.bones.length - 1 ].add( endPoint );

}

function createGeometry( sizing ) {

  var width = 5;
  var depth = 5;

  var widthSegments = 5;
  var depthSegments = 5;


	var geometry = new THREE.BoxBufferGeometry(
		width,
		sizing.height, // height
		depth,
		widthSegments,
		sizing.segmentCount * 2, // heightSegments = segmentCount * numberOfDimensions
		depthSegments
	);

	var position = geometry.attributes.position;
  position.needsUpdate = true;

  var vertex = new THREE.Vector3();

  for ( var i = 0; i < position.count; i ++ ) {

    vertex.fromBufferAttribute( position, i );

    var pointsPerLayer = ( sizing.segmentCount * 2 ) + 1;
    pointsPerLayer = pointsPerLayer * ( widthSegments + 1);

    var pointsPerTop = widthSegments + 1;
    pointsPerTop = pointsPerTop * ( widthSegments + 1);

    var maxLayer = ( sizing.segmentCount ) * 2 + 1;
    var layer;

    if (i < 2 * ( pointsPerLayer + pointsPerTop ) ) {

      layer = ( Math.floor( i / ( widthSegments + 1 ) ) ) % maxLayer;

    } else {

      // Remove everything before because top and bottom faces have a different number of points and throws off the layer order.
      var j = i - 2 * ( pointsPerLayer + pointsPerTop );
      layer = ( Math.floor( j / ( widthSegments + 1 ) ) ) % maxLayer;

    }

    // Left: ( i < pointsPerLayer )
    // Right: ( i < 2 * pointsPerLayer )

    // Top: ( i < 2 *  pointsPerLayer + pointsPerTop  )
    // Bottom: ( i < 2 * ( pointsPerLayer + pointsPerTop ) )

    // Front: ( i < 3 * pointsPerLayer + 2 * pointsPerTop )
    // Back: ( i < 4 * pointsPerLayer + 2 * pointsPerTop )
    switch ( true ) {

      // Left & Right || Front & Back
      case ( i < 2 * pointsPerLayer ) || ( i >= 2 * ( pointsPerLayer + pointsPerTop ) ):

        if ( layer % 2  == 0 ) {

          position.setXYZ( i, vertex.x / 6, vertex.y, vertex.z / 6 );

        } else {

          position.setXYZ( i, vertex.x * layer / 5, vertex.y, vertex.z * layer / 5 );

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


function getSphere( size ) {

	var geometry = new THREE.SphereGeometry( size, 24, 24 );

	var material = new THREE.MeshBasicMaterial({
		color: 'rgb(255, 132, 200)'
	});

	var mesh = new THREE.Mesh(
		geometry,
		material
	);

	return mesh;
}
