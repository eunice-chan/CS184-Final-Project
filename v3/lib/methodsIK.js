function DLS( param ) {

		// Initialize Values

		// Get current transformation of the model joints
		var beta = modelToBeta();

		// y is the position in space we want to get to
		var y = getTargetWorldPosition();

		param.lambda /= param.decrement;

		// yHat is the current position in space
		var yHat = betaToPoint( beta );
		var helper = DLShelper( yHat, y );

		var betaObjFn = squaredDistance( yHat, y );

		for ( var j = 0; j < param.maxIter; j ++ ) {

			if ( param.lambda === Infinity ) {

				console.warn( "Lambda reached infinity! Try a different initial pose." );
				return;

			} else if ( param.lambda === 0 ) {

				console.warn( "Lambda is 0\nResetting lambda." );
				param.lambda = 5;

			}

			param.lambda *= param.increment;

			// System of equations
			// var h = math.add( helper.jtj, math.multiply( param.lambda, math.add( math.identity( ...helper.jtj.size() ), helper.jtjDiag ) ) );
			var h = math.add( helper.jtj, math.multiply( param.lambda, helper.jtjDiag ) );

			try {

				var delta = math.lusolve( h, helper.njtd );
				//var delta = math.multiply( math.inv( h ), helper.njtd );

			} catch ( error ) {

				console.warn(param.lambda + ' Could not solve system of equations.' );
				param.lambda = 5;
				return;

			}

			delta = math.transpose( delta );
			delta = delta._data[ 0 ];

			var betaPrime = math.add( beta, math.transpose( delta ) );

			var yHatPrime = betaToPoint( betaPrime );

			var betaPrimeObjFn = squaredDistance( yHatPrime, y );

			if ( betaPrimeObjFn < betaObjFn || betaObjFn == 0 ) {

				beta = betaPrime;
				updateMeshKinematics( beta, methodParametersIK.speed );

				// Stopping criteron: Change too small
				if ( betaPrimeObjFn > 0.999999999 * betaObjFn || betaPrimeObjFn < 0.000000001 ) {

					return beta;

				} else {

					break;

				}
			} else if ( betaObjFn > 0.999999999 * betaPrimeObjFn ) {

					return beta;
			}
		}

}

function initSMCM() {

	 var n = [];
	 var weights = [];

	 var beta = modelToBeta();

	 var target = getTargetWorldPosition();

	 for ( var i = 0; i < parametersSMCM.numParticles; i ++ ) {

		 n.push( sampleNewBeta( beta ) );
		 weights.push( Math.exp( 1 / distance( betaToPoint( beta ), target ) ) );

	 }


	 parametersSMCM.n = n;
	 parametersSMCM.weights = normalize( weights );

}

function SMCM( param ) {

		// Resample
		// To prevent particle degeneracy
		var n = [];

		for ( var i = 0; i < parametersSMCM.n.length; i ++ ) {

			n.push( sampleNewBeta( sampleParticle() ) );

		}
		parametersSMCM.n = n;

	 // Importance sample
 	 n = [];
	 var weights = [];

	 var target = getTargetWorldPosition();

	 for ( var i = 0; i < parametersSMCM.n.length; i ++ ) {

		 // draw x_t from a distribution given the previous value x_(t-1)
		 var betaPrime = sampleNewBeta( parametersSMCM.n[ i ] );

		 n.push( betaPrime );

	 	 // calulate weight
	 	 // Supposed to be p( y_t | x_t ). I'm going make the probability = e^( 1 / distance )
	 	 weights.push( Math.exp( 1 / distance( betaToPoint( betaPrime ), target ) ) );

	 }


	 parametersSMCM.weights = normalize( weights );

 	 // Update mesh
 	 // Set mesh to max probability particle
	 updateMeshKinematics( parametersSMCM.n[ maxIndex( parametersSMCM.weights ) ], methodParametersIK.speed );

}
