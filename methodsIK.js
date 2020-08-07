function DLS( param ) {

	// Get current transformation of the model joints
	var beta = param.beta? beta : modelToBeta();

	// y is the position in space we want to get to
	var y = getTargetWorldPosition();
	// y_hat is the position in space we are at if the beta transformations are applied to the default pose
	var y_hat = predictTransform( beta );

	// Find the error-related stuff
	var jacobian = gradientMSE( y_hat, y );

	// Set an initial lambda. Can be any value. Kind of the "step size." Should be positive.
	var lambda = param.lambda? lambda : Math.max( jacobian.squaredError.x, jacobian.squaredError.y, jacobian.squaredError.z );

	// Set an initial v. Also doesn't really matter what it is. Just needs to be positive.
	var v = param.v? v : 2;

	for ( var k = 0; k < param.kMax; k ++ ) {

		// Stopping criterion: if we're close enough to the target, stop.
		if ( MSE( y_hat, y ) > 1000000 ) {
			var u = jacobian.matrixJTJ;
			u.elements[ 0 ] += lambda * jacobian.squaredError.x;
			u.elements[ 4 ] += lambda * jacobian.squaredError.y;
			u.elements[ 8 ] += lambda * jacobian.squaredError.z;

			// delta = inv( JTJ + lambda * diag( JTJ ) )JTF
			var delta = new THREE.Matrix3().getInverse( jacobian.matrixJTJ );
			console.log(delta.toArray());
			// delta.multiply( jacobian.squaredError );
			// console.log(delta.toArray());

			// beta_prime = beta + delta
			// var beta_prime = beta.add(delta);

			// if beta_prime is closer than beta
			if ( MSE( beta_prime, y ) < MSE( beta, y ) ) {

			  // Update beta to the better value
				beta = beta_prime;
				// Calculate the new value of beta
				y_hat = predictTransform( beta );

				// Closer to minimum, so behave more like Gauss-Newton
				lambda /= v;

			} else {

				lambda *= v;

			}

		} else {

			break;

		}

	}

	console.log("MSE: " + MSE( y_hat, y ));
	console.log("TARGET VALUE: " + y.toArray());
	console.log("ENDPOINT VALUE: " + y_hat.toArray());
	updateMeshKinematics( beta );

	return beta;

}

function SDLS( param ) {
	console.log("SDLS");
}

function SMCM( param ) {
	console.log("SMCM");
}
