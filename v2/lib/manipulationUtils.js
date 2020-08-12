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

	var calcBones = calcMesh.skeleton.bones;
	var bones = mesh.skeleton.bones;

	var j = 0;

	for ( var i = defaultWorldBone.length - 1; i >= 0; i -- ) {

		if ( parameters.constraints[ `b${ i }` ].px ) {

			calcBones[ i ].position.x = beta[ j ];
			j ++;

		} else {

			calcBones[ i ].position.x = bones[ i ].position.x;

		}


		if ( parameters.constraints[ `b${ i }` ].py ) {

			calcBones[ i ].position.y = beta[ j ];
			j ++;

		} else {

			calcBones[ i ].position.y = bones[ i ].position.y;

		}


		if ( parameters.constraints[ `b${ i }` ].pz ) {

			calcBones[ i ].position.z = beta[ j ];
			j ++;

		} else {

			calcBones[ i ].position.z = bones[ i ].position.z;

		}



		if ( parameters.constraints[ `b${ i }` ].rx ) {

			calcBones[ i ].rotation.x = beta[ j ];
			j ++;

		} else {

			calcBones[ i ].rotation.x = bones[ i ].rotation.x;

		}


		if ( parameters.constraints[ `b${ i }` ].ry ) {

			calcBones[ i ].rotation.y = beta[ j ];
			j ++;

		} else {

			calcBones[ i ].rotation.y = bones[ i ].rotation.y;

		}


		if ( parameters.constraints[ `b${ i }` ].rz ) {

			calcBones[ i ].rotation.z = beta[ j ];
			j ++;

		} else {

			calcBones[ i ].rotation.z = bones[ i ].rotation.z;

		}

	}

	render( scene );

	predictedPoint = getModelWorldPosition( calcBones[ calcBones.length - 1] );

	return predictedPoint;

}

function rotatePoint( point, pivot, rotateX, rotateY, rotateZ ) {

  // Translate to origin
  pivot.negate();
  point.add( pivot );

  // Transform
  var transform = new THREE.Euler( rotateX, rotateY, rotateZ, 'XYZ' );
  point.applyEuler( transform );


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

						row = [ 1, 0, 0 ];
						break;

					case 'y':

						row = [ 0, 1, 0 ];
						break;

					case 'z':

						row = [ 0, 0, 1 ];
						break;

				}

				switch ( key2[ 0 ] ) {

					case 'p':

						break;

					case 'r':

						row = yHat.clone().sub( bones[ jointNumber ].position ).cross( new THREE.Vector3( ...row ) ).toArray();
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

	for ( var i = bones.length - 1; i >= 0; i -- ) {

		if ( parameters.constraints[ `b${ i }` ].px ) {

			bones[ i ].position.x =  linearInterpolation( beta[ i ], bones[ i ].position.x, speed );

		}

		if ( parameters.constraints[ `b${ i }` ].py ) {

			bones[ i ].position.y =  linearInterpolation( beta[ i ], bones[ i ].position.y, speed );

		}

		if ( parameters.constraints[ `b${ i }` ].pz ) {

			bones[ i ].position.z =  linearInterpolation( beta[ i ], bones[ i ].position.z, speed );

		}

		if ( parameters.constraints[ `b${ i }` ].rx ) {

			bones[ i ].rotation.x =  linearInterpolation( beta[ i ], bones[ i ].rotation.x, speed );

		}

		if ( parameters.constraints[ `b${ i }` ].ry ) {

			bones[ i ].rotation.y = linearInterpolation( beta[ i ], bones[ i ].rotation.y, speed );

		}

		if ( parameters.constraints[ `b${ i }` ].rz ) {

			bones[ i ].rotation.z =  linearInterpolation( beta[ i ], bones[ i ].rotation.z, speed );

		}

	}

}

function modelToBeta() {

	var bones = mesh.skeleton.bones;

	var beta = [];

	for ( var i = bones.length - 1; i >= 0; i -- ) {

		if ( parameters.constraints[ `b${ i }` ].px ) {

			beta.push( bones[ i ].position.x );

		}

		if ( parameters.constraints[ `b${ i }` ].py ) {

			beta.push( bones[ i ].position.y );

		}

		if ( parameters.constraints[ `b${ i }` ].pz ) {

			beta.push( bones[ i ].position.z );

		}

		if ( parameters.constraints[ `b${ i }` ].rx ) {

			beta.push( bones[ i ].rotation.x );

		}

		if ( parameters.constraints[ `b${ i }` ].ry ) {

			beta.push( bones[ i ].rotation.y );

		}

		if ( parameters.constraints[ `b${ i }` ].rz ) {

			beta.push( bones[ i ].rotation.z );

		}

	}

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
