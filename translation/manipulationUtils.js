function betaToPoint( beta ) {
	// beta holds an array with each index corresponding to
	// shoulderRotateY, elbowRotateX, elbowMoveX, elbowMoveZ, wristRotateX, wristRotateY, wristRotateZ
	// respectively and the value is the value to set that joint + transformation to.

	// Update: beta now shoulderRotateY, elbowRotateX, wristRotateZ

	// My predicted position for the point on the model (endPoint) after the transformations specified by beta are applied.
	var predictedPoint = new THREE.Vector3().copy( defaultEndPoint );
	var bones = mesh.skeleton.bones;

  transformPoint( predictedPoint, defaultBone[ 2 ], 0, 0, 0, 0, 0, beta[ 2 ] );
	transformPoint( predictedPoint, defaultBone[ 1 ], 0, 0, 0, 0, beta[ 1 ], 0 );
	transformPoint( predictedPoint, defaultBone[ 0 ], 0, 0, 0, beta[ 0 ], 0, 0 );
	// TODO: figure out why it is off by 8
	predictedPoint.y -= 8;
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

	// U
 	var jtj = j.clone().transpose().multiply(j);

	var squaredJ = new THREE.Vector3( jtj.elements[ 0 ], jtj.elements[ 4 ], jtj.elements[ 8 ] );

	// -v
	var jtd = y_hat.clone().sub( y ).applyMatrix3( j ).multiplyScalar( -1 );

	return {
		squaredJ: squaredJ, // Vector3
		jtj: jtj, // Matrix3
		jtd: jtd // Vector3
	}

}

function jacobian( y_hat ) {

	var bones = mesh.skeleton.bones;

	// Update: beta now shoulderRotateY, elbowRotateX, wristRotateZ
	// // axis * ( y_hat - bone_pos )
	// var shoulder = y_hat.clone().sub( getModelWorldPosition( bones[ 0 ] ) ).y;
	// var elbow = y_hat.clone().sub( getModelWorldPosition( bones[ 1 ] ) ).x;
	// var wrist = y_hat.clone().sub( getModelWorldPosition( bones[ 2 ] ) ).z;

	// Jacobian for translational joints
	var identity = new THREE.Matrix3();
	var shoulder = new THREE.Vector3().setFromMatrixColumn( identity, 0 );
	var elbow = new THREE.Vector3().setFromMatrixColumn( identity, 1 );
	var wrist = new THREE.Vector3().setFromMatrixColumn( identity, 2 );

	return identity;

}

function distance( y_hat, y ) {

	return y.distanceTo( y_hat );

}

function squaredDistance( y_hat, y ) {

	return y.distanceToSquared( y_hat );

}

function updateMeshKinematics( beta, speed ) {

	var bones = mesh.skeleton.bones;
	// Apply the transformations to the mesh
	// Update: beta now shoulderRotateY, elbowRotateX, wristRotateZ
	bones[ 0 ].position.x = linear_interpolation( beta[ 0 ], bones[ 0 ].position.x, speed );

	bones[ 1 ].position.y = linear_interpolation( beta[ 1 ], bones[ 1 ].position.y, speed );

	bones[ 2 ].position.z = linear_interpolation( beta[ 2 ], bones[ 2 ].position.z, speed );
	// bones[0].rotation.y = beta[0];
	//
	// bones[1].rotation.x = beta[1];
	//
	// bones[2].rotation.z = beta[2];

}

function linear_interpolation( x, y, alpha ) {

	return ( alpha * x ) + ( ( 1 - alpha ) * y );

}

function modelToBeta() {

	var bones = mesh.skeleton.bones;
	// shoulderRotateY, elbowRotateX, elbowMoveX, elbowMoveZ, wristRotateX, wristRotateY, wristRotateZ
	// Update: beta now shoulderRotateY, elbowRotateX, wristRotateZ
	var beta = [ bones[0].position.x, bones[1].position.y, bones[2].position.z ];
	// var beta = [ bones[0].rotation.y, bones[1].rotation.x, bones[2].rotation.z ];

	return beta;

}



function sampleNewBeta( beta ) {

	// TODO: replace with a Gaussian? Exponential? distribution
	var beta_prime = [];

	beta.forEach( ( value ) => { beta_prime.push( value + ( ( Math.random() - 0.5 ) * 5 ) ) } );

	return beta_prime;

}

function normalize( array ) {

	var magnitude = Math.sqrt( funcSum( ( val ) => { return val * val }, array ) );
	var unitArray = [];

	for ( var i = 0; i < array.length; i ++ ) {

		unitArray.push( array[ i ] / magnitude );

	}

	return unitArray

}

function funcSum( fn, array ) {

	var s = 0;

	for ( var i = 0; i < array.length; i ++ ) {

		s += fn( array[ i ] );

	}

	return s;

}

function maxIndex( array ) {

	var index = 0;
	var value = array[ 0 ];

	for ( var i = 1; i < array.length; i ++ ) {

		if ( array[ i ] > value ) {
			index = i;
			value = array[ i ];
		}

	}

	return index;

}

function sampleParticle() {

	// according to weight
	var probability = 0;
	var select = Math.random();

	for ( var i = 0; i < parametersSMCM.numParticles; i ++ ) {

		probability += parametersSMCM.weights[ i ];

		if (select < probability) {

			return parametersSMCM.n[ i ];

		}

	}

	console.warn("Weights invalid.");

}
