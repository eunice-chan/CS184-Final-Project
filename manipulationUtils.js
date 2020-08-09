function betaToPoint( beta ) {
	// beta holds an array with each index corresponding to
	// shoulderRotateY, elbowRotateX, elbowMoveX, elbowMoveZ, wristRotateX, wristRotateY, wristRotateZ
	// respectively and the value is the value to set that joint + transformation to.

	// Update: beta now shoulderRotateY, elbowRotateX, wristRotateZ

	// My predicted position for the point on the model (endPoint) after the transformations specified by beta are applied.
	var predictedPoint = new THREE.Vector3().copy( defaultEndPoint );
	var bones = mesh.skeleton.bones;

  transformPoint( predictedPoint, defaultBone[ 2 ], 0, 0, beta[ 2 ], 0, 0, 0 );
	transformPoint( predictedPoint, defaultBone[ 1 ], beta[ 1 ], 0, 0, 0, 0, 0 );
	transformPoint( predictedPoint, defaultBone[ 0 ], 0, beta[ 0 ], 0, 0, 0, 0 );

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

function DLShelper( y_hat, y ) {

	var j = jacobian( y_hat );

	var squaredJ = j.clone().multiply(j);

	var xy = j.x * j.y;
	var xz = j.x * j.z;
	var yz = j.y * j.z;

	// U
 	var jtj = new THREE.Matrix3().set( squaredJ.x, xy+0.00000001, xz+0.00000001,
																	 	 xy+0.00000001, squaredJ.y, yz+0.00000001,
																	 	 xz+0.00000001, yz+0.00000001, squaredJ.z );
	// -v
	var jtd = j.multiplyScalar( distance( y_hat, y ) ).multiplyScalar( -1 );

	return {
		squaredJ: squaredJ, // Vector3
		jtj: jtj, // Matrix3
		jtd: jtd // Vector3
	}

}

function jacobian( y_hat ) {

	var bones = mesh.skeleton.bones;

	// Update: beta now shoulderRotateY, elbowRotateX, wristRotateZ
	// axis * ( y_hat - bone_pos )
	var shoulder = y_hat.clone().sub( getModelWorldPosition( bones[ 0 ] ) ).y;
	var elbow = y_hat.clone().sub( getModelWorldPosition( bones[ 1 ] ) ).x;
	var wrist = y_hat.clone().sub( getModelWorldPosition( bones[ 2 ] ) ).z;

	return new THREE.Vector3( shoulder, elbow, wrist );

}

function distance( y_hat, y ) {

	return y.distanceTo( y_hat );

}

function squaredDistance( y_hat, y ) {

	return y.distanceToSquared( y_hat );

}

// function gradientMSE(y_hat, y) {
//
// 	var error = new THREE.Vector3( y_hat.x - y.x, y_hat.y - y.y, y_hat.z - y.z ).multiplyScalar( 2 / 3 );
// 	var squaredError = error.clone().multiply(error);
//
// 	var diagonalJTJ = new THREE.Matrix3().set( squaredError.x, 0, 0,
// 																						 0, squaredError.y, 0,
// 																					   0, 0, squaredError.z );
//
// 	var xy = error.x * error.y;
// 	var xz = error.x * error.z;
// 	var yz = error.y * error.z;
//
//  	var matrixJTJ =  new THREE.Matrix3().set( squaredError.x, xy, xz,
// 																						 xy, squaredError.y, yz,
// 																					   xz, yz, squaredError.z );
//
//  return {
// 	 squaredError: squaredError,
// 	 matrixJTJ: matrixJTJ
//  };
//
// }
//
// function MSE(y_hat, y) {
//
// 	// The objective function
// 	var error = new THREE.Vector3( y_hat.x - y.x, y_hat.y - y.y, y_hat.z - y.z );
// 	console.log("y_hat "+y_hat);
// 	console.log("y "+y);
// 	console.log("error "+error.toArray());
// 	var squaredError = error.clone().multiply(error);
// 	console.log("MSE "+squaredError.toArray());
// 	return ( squaredError.x + squaredError.y + squaredError.z ) / 3;
//
// }
//
//
function updateMeshKinematics( beta ) {

	var bones = mesh.skeleton.bones;
	// Apply the transformations to the mesh
	// Update: beta now shoulderRotateY, elbowRotateX, wristRotateZ
	bones[0].rotation.y = beta[0];

	bones[1].rotation.x = beta[1];

	bones[2].rotation.z = beta[2];

}

function modelToBeta() {

	var bones = mesh.skeleton.bones;
	// shoulderRotateY, elbowRotateX, elbowMoveX, elbowMoveZ, wristRotateX, wristRotateY, wristRotateZ
	// Update: beta now shoulderRotateY, elbowRotateX, wristRotateZ
	var beta = [ bones[0].rotation.y, bones[1].rotation.x, bones[2].rotation.z ];

	return beta;

}
