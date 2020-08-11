function DLS( param ) {

		// Initialize Values

		// Get current transformation of the model joints
		var beta = modelToBeta();

		// y is the position in space we want to get to
		var y = getTargetWorldPosition();

		param.lambda /= param.decrement;

		// y_hat is the current position in space
		var y_hat = betaToPoint( beta );

		var helper = DLShelper( y_hat, y );

		var u = helper.jtj;
		var v = helper.njtd;

		var curr_obj_fn = squaredDistance( y_hat, y );

		for ( var j = 0; j < param.maxIter; j ++ ) {

			if ( param.lambda === Infinity ) {
				console.warn( "Lambda reached infinity! Try a different initial pose." );
				return;
			} else if ( param.lambda === 0 ) {
				console.warn( "Lambda is 0\nResetting to 1000." );
				param.lambda = 1000;
			}

			param.lambda /= param.increment;

			// System of equations
			var h = math.add( helper.jtj, math.multiply( param.lambda, math.add( math.identity( ...helper.jtj.size[ 0 ] ), helper.jtjDiag ) ) );

			var delta = math.lusolve( h, helper.njtd );

			var beta_prime = [];

			for ( var i = 0; i < beta.length; i ++ )  {

				beta_prime.push( beta[ i ] + delta[ i ][ 0 ] );
			}
			
			var y_hat_prime = betaToPoint( beta_prime );

			var next_obj_fn = squaredDistance( y_hat_prime, y );

			if ( next_obj_fn < curr_obj_fn || curr_obj_fn == 0 ) {
				beta = beta_prime;
				updateMeshKinematics( beta, methodParametersIK.speed );

				// Stopping criteron: Change too small
				if ( next_obj_fn > 0.999999999 * curr_obj_fn || next_obj_fn < 0.000000001 ) {

					return beta;

				} else {

					break;

				}
			} else if ( curr_obj_fn > 0.999999999 * next_obj_fn ) {

					return beta;
			}
		}

}

function initSMCM() {

	 var n = [];
	 var weights = [];

	 // TODO: change modeltobeta to return array
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

		if ( parametersSMCM.n.length == 0 ) {

			initSMCM();

		}

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
	 	 // Supposed to be p( y_t | x_t ). I'm going make the probability = 1 / distance
	 	 weights.push( Math.exp( 1 / distance( betaToPoint( betaPrime ), target ) ) );

	 }


	 parametersSMCM.weights = normalize( weights );

 	 // Update mesh
 	 // Set mesh to max probability particle
	 updateMeshKinematics( parametersSMCM.n[ maxIndex( parametersSMCM.weights ) ], methodParametersIK.speed );

}
