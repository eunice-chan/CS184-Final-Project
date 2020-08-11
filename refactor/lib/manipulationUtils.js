// WORLD POSITION
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




// BETA POINT CONVERSION
function betaToPoint( beta ) {

	var predictedPoint = new THREE.Vector3().copy( defaultEndPoint );

	var i = ( ( defaultBone.length + 1 ) * 6 ) - 1;
	for ( var j = defaultBone.length - 1; j > 0; j -- ) {

		transformPoint( predictedPoint, defaultBone[ j ], beta[ i - 5 ], beta[ i - 4 ], beta[ i - 3 ], beta[ i - 2 ], beta[ i - 1 ], beta[ i ] );

		i -= 6;

	}

	predictedPoint.y -= modelParameters.boneHeight;

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




// GENERIC

// POINT FUNCTIONS
function distance( y_hat, y ) {

	return y.distanceTo( y_hat );

}

function squaredDistance( y_hat, y ) {

	return y.distanceToSquared( y_hat );

}

// VECTOR FUNCTIONS
function normalize( vector ) {

	var magnitude = Math.sqrt( funcSum( ( val ) => { return val * val }, vector ) );
	var unitVector = [];

	for ( var i = 0; i < vector.length; i ++ ) {

		unitVector.push( vector[ i ] / magnitude );

	}

	return unitVector;

}

function funcSum( fn, vector ) {

	var s = 0;

	for ( var i = 0; i < vector.length; i ++ ) {

		s += fn( vector[ i ] );

	}

	return s;

}

function maxIndex( vector ) {

	var index = 0;
	var value = vector[ 0 ];

	for ( var i = 1; i < vector.length; i ++ ) {

		if ( vector[ i ] > value ) {
			index = i;
			value = vector[ i ];
		}

	}

	return index;

}




// DLS
function DLShelper( y_hat, y ) {

	var j = jacobian( y_hat );
	var jt = math.transpose( j );

	// U
 	var jtj = j.clone().transpose().multiply( j );

	// -v
	// numDimensions x numEndEffectors
	var d = y_hat.clone().sub( y ).toArray();

	// paramLength x numDimensions  * numDimensions x numEndEffectors = paramLength x numEndEffectors
	var jtd = math.multiply( jt, d );

	var negV = math.multiply( jtd, -1 );

	return {

		jtj: jtj, // Matrix
		negV: negV // Vector

	};

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


function linear_interpolation( x, y, alpha ) {

	return ( alpha * x ) + ( ( 1 - alpha ) * y );

}

function updateMeshKinematics( beta, speed ) {

	var bones = mesh.skeleton.bones;

	var i = 0;

	var jointNumber, constraints;

	Object.keys( parameters.constraints ).forEach( ( key1 ) => {

		jointNumber = parseInt( key1[ 1 ] );

		Object.keys( parameters.constraints[ key1 ] ).forEach( ( key2 ) => {

			if ( parameters.constraints[ key1 ][ key2 ] ) {

				switch ( key2[ 0 ] ) {

					case 'p':

						constraints = bones[ jointNumber ].position;
						break;

					case 'r':

						constraints = bones[ jointNumber ].rotation;
						break;

				}

				switch ( key2[ 1 ] ) {

					case 'x':

						constraints = constraints.x;
						break;

					case 'y':

						constraints = constraints.y;
						break;

					case 'z':

						constraints = constraints.z;
						break;

				}

				constraints = linear_interpolation( beta[ i ], constraints, speed );

				i ++;

			}

		} );

	} );

}

function modelToBeta() {

	var bones = mesh.skeleton.bones;

	var beta = [];

	var jointNumber, constraints;

	Object.keys( parameters.constraints ).forEach( ( key1 ) => {

		jointNumber = parseInt( key1[ 1 ] );

		Object.keys( parameters.constraints[ key1 ] ).forEach( ( key2 ) => {

			if ( parameters.constraints[ key1 ][ key2 ] ) {

				switch ( key2[ 0 ] ) {

					case 'p':

						constraints = bones[ jointNumber ].position;
						break;

					case 'r':

						constraints = bones[ jointNumber ].rotation;
						break;

				}

				switch ( key2[ 1 ] ) {

					case 'x':

						constraints = constraints.x;
						break;

					case 'y':

						constraints = constraints.y;
						break;

					case 'z':

						constraints = constraints.z;
						break;

				}

				beta.push( constraints );

			}

		} );

	} );


	return beta;

}



function sampleNewBeta( beta ) {

	// TODO: replace with a Gaussian? Exponential? distribution
	var beta_prime = [];

	beta.forEach( ( value ) => { beta_prime.push( value + ( ( Math.random() - 0.5 ) * parametersSMCM.distribution ) ) } );

	return beta_prime;

}

function sampleParticle() {

	var probability = 0;
	var select = Math.random();

	for ( var i = 0; i < parametersSMCM.numParticles; i ++ ) {

		probability += parametersSMCM.weights[ i ];

		if ( select < probability ) {

			return parametersSMCM.n[ i ];

		}

	}

	console.warn( "Weights invalid." );

}
