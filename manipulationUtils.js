function predictTransform( beta ) {
	// beta holds an array with each index corresponding to
	// shoulderRotateY, elbowRotateX, elbowMoveX, elbowMoveZ, wristRotateX, wristRotateY, wristRotateZ
	// respectively and the value is the value to set that joint + transformation to.

	// My predicted position for the point on the model (endPoint) after the transformations specified by beta are applied.
	var predictedPoint = new THREE.Vector3().copy( endPointDefaultPosition );
	var bones = mesh.skeleton.bones;

	var bone, bonePosition;

  ////////////////////////////////

	// Get the world position of the joint
	bone = bones[ 2 ];
	bonePosition = getModelWorldPosition( bone );

	//wristRotateX, wristRotateY, wristRotateZ
	transformPoint( predictedPoint, bonePosition, beta[ 4 ], beta[ 5 ], beta[ 6 ], 0, 0, 0 );

  // ////////////////

	bone = bones[ 1 ];
	bonePosition = getModelWorldPosition( bone );

	transformPoint( predictedPoint, bonePosition, beta[ 1 ], 0, 0, beta[ 2 ], 0, beta[ 3 ] );

  //////////////

	bone = bones[ 0 ];
	bonePosition = getModelWorldPosition( bone );

	transformPoint( predictedPoint, bonePosition, 0, beta[ 0 ], 0, 0, 0, 0 );

  ////////////////////////////////

	return predictedPoint;

}

function transformPoint( point, pivot, rotateX, rotateY, rotateZ, moveX, moveY, moveZ ) {

	  // Translate to origin
	  pivot.negate();
	  point.add( pivot );


	  // Transform
	  var transform = new THREE.Euler( rotateX, rotateY, rotateZ, 'XYZ' );
	  point.applyEuler( transform );

		point.x += moveX;
		point.y += moveY;
		point.z += moveZ;


	  // Translate back
	  pivot.negate();
	  point.add( pivot );

	return point;

}

function getModelWorldPosition( model ) {

	model.updateMatrixWorld();
  var worldMatrix = model.matrixWorld;
  var worldPosition  = new THREE.Vector3().setFromMatrixPosition( worldMatrix );
  return worldPosition;

}

function getTargetWorldPosition() {

	return getModelWorldPosition( target );

}

function getEndPointWorldPosition() {

	return getModelWorldPosition( endPoint );

}

function getEndPointWorldPosition() {

	return getModelWorldPosition( endPoint );

}

function gradientMSE(y_hat, y) {

	var error = new THREE.Vector3( y_hat.x - y.x, y_hat.y - y.y, y_hat.z - y.z ).multiplyScalar( 2 / 3 );
	var squaredError = error.clone().multiply(error);

	var diagonalJTJ = new THREE.Matrix3().set( squaredError.x, 0, 0,
																						 0, squaredError.y, 0,
																					   0, 0, squaredError.z );

	var xy = error.x * error.y;
	var xz = error.x * error.z;
	var yz = error.y * error.z;

 	var matrixJTJ =  new THREE.Matrix3().set( squaredError.x, xy, xz,
																						 xy, squaredError.y, yz,
																					   xz, yz, squaredError.z );

 return {
	 squaredError: squaredError,
	 matrixJTJ: matrixJTJ
 };

}

function MSE(y_hat, y) {

	// The objective function
	var error = new THREE.Vector3( y_hat.x - y.x, y_hat.y - y.y, y_hat.z - y.z );
	var squaredError = error.clone().multiply(error);
	return ( squaredError.x + squaredError.y + squaredError.z ) / 3;

}


function updateMeshKinematics( beta ) {

	// Apply the transformations to the mesh
	mesh.skeleton.bones[0].rotation.y = beta[0];

	mesh.skeleton.bones[1].rotation.x = beta[1];
	mesh.skeleton.bones[1].position.x = beta[2];
	mesh.skeleton.bones[1].position.z = beta[3];

	mesh.skeleton.bones[2].rotation.x = beta[4];
	mesh.skeleton.bones[2].rotation.y = beta[5];
	mesh.skeleton.bones[2].rotation.z = beta[6];

}

function modelToBeta() {

	var bones = mesh.skeleton.bones;
	// shoulderRotateY, elbowRotateX, elbowMoveX, elbowMoveZ, wristRotateX, wristRotateY, wristRotateZ
	var beta = [ bones[0].rotation.y, bones[1].rotation.x, bones[1].position.x, bones[1].position.z, bones[2].rotation.x, bones[2].rotation.y, bones[2].rotation.z  ];

	// Can't be zero!
	if ( sum( ...beta ) == 0) {

		return [ 1, 1, 1, 1, 1, 1, 1 ];

	} else {

			return beta;

	}

}

function sum( array ) {

	var count = 0;

	for ( var i = 0; i < array.length; i ++ ) {
		count += array[i];
	}

	return count;
}
