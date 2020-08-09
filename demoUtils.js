function setupDatGui() {

	gui.add( mesh , "randomPose" ).name( "Pose Model" );
	gui.add( target , "pose" ).name( "Random Target" );
	gui.add( line , "visible" ).name( "Hide Line" );

	////////////////////////////////

  var folderTarget = gui.addFolder("Target");

	folderTarget.add( target.position, 'x', -20, 20 ).name( "X Position" );
	folderTarget.add( target.position, 'y', -20, 20 ).name( "Y Position" );
	folderTarget.add( target.position, 'z', -20, 20 ).name( "Z Position" );

	////////////////////////////////

  folderTarget.add( target, 'predict').name( "To Endpoint" );

  ////////////////////////////////


  var folderFK = gui.addFolder("Forward Kinematics / Pose");

	var bones = mesh.skeleton.bones;
  var folder;

  ////////////////////////////////


  var bone = bones[ 0 ];

  // folder = folderFK.addFolder( "Shoulder" );

	folderFK.add( bone.rotation, 'y', 0, 2 ).name( "Rotate Joint 1" );
  // folderFK.add( bone.rotation, 'y', - Math.PI * 0.5, Math.PI * 0.5 ).name( "Rotate Joint 1" );

  //////////////

  var bone = bones[ 1 ];

  // folder = folderFK.addFolder( "Elbow" );

  // So that it won't completely bend on itself. It's not a very flexible arm. :)
  folderFK.add( bone.rotation, 'x', 0, 2 ).name( "Rotate Joint 2" );
  // folder.add( bone.position, 'x', -5, 5 ).name( "Move X" );
  // folder.add( bone.position, 'z', -5, 5 ).name( "Move Z" );

  ////////////////

  var bone = bones[ 2 ];

  // folder = folderFK.addFolder( "Wrist" );

  // folder.add( bone.rotation, 'x', - Math.PI * 0.5, Math.PI * 0.5 ).name( "Rotate X" );
  // folder.add( bone.rotation, 'y', - Math.PI * 0.5, Math.PI * 0.5 ).name( "Rotate Y" );
  folderFK.add( bone.rotation, 'z', 0, 2 ).name( "Rotate Joint 3" );
  // folderFK.add( bone.rotation, 'z', - Math.PI * 0.5, Math.PI * 0.5 ).name( "Rotate Joint 3" );


  ////////////////////////////////


  var folderIK = gui.addFolder( "Inverse Kinematics" );

  folderIK.add( methodParametersIK, 'enabled' ).name( 'Repeat' );
  folderIK.add( methodParametersIK, 'run' ).name( 'One Step' );
  folderIK.add( methodParametersIK, 'method', Object.keys( methodFunctionsIK ) ).name( 'Method' );

  ////////////////////////////////

	folder = folderIK.addFolder( "Levenberg–Marquardt" );

	folder.add( parametersDLS, 'maxIter', 1, 1000 ).name( 'Max Iter' ).onChange( ()=>{ parametersDLS.maxIter = Math.floor( parametersDLS.maxIter ) } );
	folderLambda = folder.addFolder( "Lambda" );
	folderLambda.add( parametersDLS, 'lambda', 0, 1000 ).name( 'Lambda' );
	folderLambda.add( parametersDLS, 'increment', 0, 300 ).name( 'Increment' );folderLambda.add( parametersDLS, 'decrement', 0, 300 ).name( 'Decrement' );

  ////////////////

}

function updateLine() {
  points = [];
  points.push( getEndPointWorldPosition() );
  points.push( getTargetWorldPosition() );

  lineGeometry.vertices = points;
  lineGeometry.verticesNeedUpdate = true;
}

function resetTargetPostion() {
  target.position.set( ...getEndPointWorldPosition().toArray() );
	target.position.x += ( Math.random() * 2 ) - 1;
	target.position.y += ( Math.random() * 2 ) - 1;
	target.position.z += ( Math.random() * 2 ) - 1;
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
	defaultEndPoint = getEndPointWorldPosition();

}

function randomPose() {

	updateMeshKinematics( [ ( Math.random() * 2 * Math.PI ) - Math.PI, ( Math.random() * 2 * Math.PI ) - Math.PI, ( Math.random() * 2 * Math.PI ) - Math.PI ] );

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


function getSphere( size, color='rgb(255, 132, 200)' ) {

	var geometry = new THREE.SphereGeometry( size, 24, 24 );

	var material = new THREE.MeshBasicMaterial({
		color: color
	});

	var mesh = new THREE.Mesh(
		geometry,
		material
	);

	return mesh;
}
