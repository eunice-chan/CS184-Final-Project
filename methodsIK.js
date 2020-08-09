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
		var v = helper.jtd;

		var curr_obj_fn = squaredDistance( y_hat, y );

		for ( var j = 0; j < param.maxIter; j ++ ) {

			if (param.lambda === Infinity) {
				console.warn("Lambda reached infinity! Try a different initial pose.");
				return;
			}

			if (param.lambda === 0) {
				console.warn("Lambda is 0\nResetting to 1000.");
				param.lambda = 1000;
			}


			param.lambda /= param.increment;

			// System of equations
			var h = helper.jtj;
			h.elements[ 0 ] += param.lambda * ( 1 + helper.squaredJ.x );
			h.elements[ 4 ] += param.lambda * ( 1 + helper.squaredJ.y );
			h.elements[ 8 ] += param.lambda * ( 1 + helper.squaredJ.z );

			var delta = helper.jtd.clone().applyMatrix3( new THREE.Matrix3().getInverse( h ) );

			var beta_prime = [ beta[ 0 ] + delta.x, beta[ 1 ] + delta.y, beta[ 2 ] + delta.z ];
			var y_hat_prime = betaToPoint( beta_prime );

			var next_obj_fn = squaredDistance( y_hat_prime, y );

			if ( next_obj_fn < curr_obj_fn || curr_obj_fn == 0 ) {
				beta = beta_prime;
				updateMeshKinematics( beta, methodParametersIK.speed );

				// Stopping criteron: Change too small
				if ( next_obj_fn > 0.999999999 * curr_obj_fn || next_obj_fn < 0.000000001) {

					return beta;

				} else {

					break;

				}
			} else if ( curr_obj_fn > 0.999999999 * next_obj_fn ) {

					return beta;
			}
		}
		
}

function SDLS( param ) {
	console.log("SDLS");
}

function SMCM( param ) {
	console.log("SMCM");
}
