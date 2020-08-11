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

	for ( var i = defaultBone.length - 1; i >= 0; i -- ) {

		transformValues = [ predictedPoint, defaultBone[ i ] ];

		if ( parameters.constraints[`b${ i }`].px ) {

			transformValues.push( beta[ j ] );
			j ++;

		} else {

			transformValues.push( bones[ i ].position.x );

		}


		if ( parameters.constraints[`b${ i }`].py ) {

			transformValues.push( beta[ j ] );
			j ++;

		} else {

			transformValues.push( bones[ i ].position.y );

		}


		if ( parameters.constraints[`b${ i }`].pz ) {

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

	}

	// TODO: idk why : | figure out why
	predictedPoint.y -= 4 * modelParameters.numBones;

	var bones = [];

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
function distance( yHat, y ) {

	return y.distanceTo( yHat );

}

function squaredDistance( yHat, y ) {

	return y.distanceToSquared( yHat );

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
function DLShelper( yHat, y ) {

	// paramLength x numDimensions
	var jt = jacobianTranspose( yHat );
	// numDimensions x paramLength
	var j = math.transpose( jt );

	// paramLength x numDimensions * numDimensions x paramLength =  paramLength x paramLength
 	var jtj = math.multiply( jt, j );

	// numDimensions x numEndEffectors
	var d = yHat.clone().sub( y ).toArray();

	// paramLength x numDimensions  * numDimensions x numEndEffectors = paramLength x numEndEffectors
	var jtd = math.multiply( jt, d );

	var njtd = math.multiply( jtd, -1 );

	return {
		jtjDiag: math.matrix( diagMatrix( jtj ) ), // Matrix
		jtj: math.matrix( jtj ), // Matrix
		njtd: njtd // Vector

	};

}

function jacobianTranspose( yHat ) {

	var jt = [];

	var bones = mesh.skeleton.bones;

	var row, jointNumber, constraints;

	var constraintKeys = Object.keys( parameters.constraints );
	constraintKeys.sort();

	constraintKeys.forEach( ( key1 ) => {

		jointNumber = parseInt( key1[ 1 ] );

		var paramKeys = Object.keys( parameters.constraints[ key1 ] );
		paramKeys.sort();

		paramKeys.forEach( ( key2 ) => {

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

						row = yHat.clone().sub( bone[ jointNumber ] ).multiply( new THREE.Vector3( ...row ) ).toArray();
						break;

				}

				jt.push( row );

			}

		} );

	} );

	return jt;

}

function diagMatrix( matrix ) {

	return matrix.map( function ( value, index, matrix ) {

      var row = [];

      value.forEach( ( v, i )=>{ index == i? row.push( v ) : row.push( 0 ) } );

      return row

    } );

}


function linearInterpolation( x, y, alpha ) {

	return ( alpha * x ) + ( ( 1 - alpha ) * y );

}

function updateMeshKinematics( beta, speed ) {

	var bones = mesh.skeleton.bones;

	var i = 0;

	var jointNumber, constraints;

	var constraintKeys = Object.keys( parameters.constraints );
	constraintKeys.sort();

	constraintKeys.forEach( ( key1 ) => {

		jointNumber = parseInt( key1[ 1 ] );

		var paramKeys = Object.keys( parameters.constraints[ key1 ] );
		paramKeys.sort();

		paramKeys.forEach( ( key2 ) => {

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

						constraints.x = linearInterpolation( beta[ i ], constraints.x, speed );
						break;

					case 'y':

						constraints.y = linearInterpolation( beta[ i ], constraints.y, speed );
						break;

					case 'z':

						constraints.z = linearInterpolation( beta[ i ], constraints.z, speed );
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

	var constraintKeys = Object.keys( parameters.constraints );
	constraintKeys.sort();

	constraintKeys.forEach( ( key1 ) => {

		jointNumber = parseInt( key1[ 1 ] );

		var paramKeys = Object.keys( parameters.constraints[ key1 ] );
		paramKeys.sort();

		paramKeys.forEach( ( key2 ) => {

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
	var betaPrime = [];

	beta.forEach( ( value ) => { betaPrime.push( value + ( ( Math.random() - 0.5 ) * parametersSMCM.distribution ) ) } );

	return betaPrime;

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
