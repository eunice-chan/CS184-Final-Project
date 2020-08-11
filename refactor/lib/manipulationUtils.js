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

	var bones = mesh.skeleton.bones;

	var predictedPoint = new THREE.Vector3().copy( defaultEndPoint );

	var j = 0;

	for ( var i = defaultBone.length - 1; i > 0; i -- ) {

		transformValues = [ predictedPoint, defaultBone[ j ] ];

		if ( parameters.constraints[`b${ i }`].mx ) {

			transformValues.push( beta[ j ] );
			j ++;

		} else {

			transformValues.push( bones[ i ].position.x );

		}


		if ( parameters.constraints[`b${ i }`].my ) {

			transformValues.push( beta[ j ] );
			j ++;

		} else {

			transformValues.push( bones[ i ].position.y );

		}


		if ( parameters.constraints[`b${ i }`].mz ) {

			transformValues.push( beta[ j ] );
			j ++;

		} else {

			transformValues.push( bones[ i ].position.z );

		}



		if ( parameters.constraints[`b${ i }`].rx ) {

			transformValues.push( beta[ j ] );
			j ++;

		} else {

			transformValues.push( bones[ i ].rotation.x );

		}


		if ( parameters.constraints[`b${ i }`].ry ) {

			transformValues.push( beta[ j ] );
			j ++;

		} else {

			transformValues.push( bones[ i ].rotation.y );

		}


		if ( parameters.constraints[`b${ i }`].rz ) {

			transformValues.push( beta[ j ] );
			j ++;

		} else {

			transformValues.push( bones[ i ].rotation.z );

		}


		transformPoint( ...transformValues );

		i -= 6;

	}

	predictedPoint.y -= modelParameters.boneHeight;

	return predictedPoint;

}

function transformPoint( point, pivot, moveX, moveY, moveZ, rotateX, rotateY, rotateZ ) {

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

	// paramLength x numDimensions
	var jt = jacobianTranspose( y_hat );
	// numDimensions x paramLength
	var j = math.transpose( jt );

	// paramLength x numDimensions * numDimensions x paramLength =  paramLength x paramLength
 	var jtj = math.multiply( jt, j );

	// numDimensions x numEndEffectors
	var d = y_hat.clone().sub( y ).toArray();

	// paramLength x numDimensions  * numDimensions x numEndEffectors = paramLength x numEndEffectors
	var jtd = math.multiply( jt, d );

	var njtd = math.multiply( jtd, -1 );

	return {
		jtjDiag: diagMatrix( jtj ), // Matrix
		jtj: jtj, // Matrix
		njtd: njtd // Vector

	};

}

function jacobianTranspose( y_hat ) {

	var jt = [];

	var bones = mesh.skeleton.bones;

	var row, jointNumber, constraints;

	Object.keys( parameters.constraints ).forEach( ( key1 ) => {

		jointNumber = parseInt( key1[ 1 ] );

		Object.keys( parameters.constraints[ key1 ] ).forEach( ( key2 ) => {

			if ( parameters.constraints[ key1 ][ key2 ] ) {

				switch ( key2[ 1 ] ) {

					case 'x':

						row = [1, 0, 0];
						break;

					case 'y':

						row = [0, 1, 0];
						break;

					case 'z':

						row = [0, 0, 1];
						break;

				}

				switch ( key2[ 0 ] ) {

					case 'p':

						break;

					case 'r':

						row = y_hat.clone().sub( bone[ jointNumber ] ).multiply( new THREE.Vector3( ...row ) ).toArray();
						break;

				}

				jt.push( row );

			}

		} );

	} );

}

function diagMatrix( matrix ) {

	return matrix.map( function ( value, index, matrix ) {

      var row = [];

      value.forEach( ( v, i )=>{ index == i? row.push( v ) : row.push( 0 ) } );

      return row

    } );

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

						constraints.x = linear_interpolation( beta[ i ], constraints.x, speed );
						break;

					case 'y':

						constraints.y = linear_interpolation( beta[ i ], constraints.y, speed );
						break;

					case 'z':

						constraints.z = linear_interpolation( beta[ i ], constraints.z, speed );
						break;

				}

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
