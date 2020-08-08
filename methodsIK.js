function DLS( param ) {

	// Initialize Values

	// Set an initial lambda. Can be any value. Should be positive.
	var lambda = param.lambda? lambda : 0.0001;
   console.log("lamba "+lambda);
	// Get current transformation of the model joints
	var beta = modelToBeta();
	console.log("beta "+beta);

	// y is the position in space we want to get to
	var y = getTargetWorldPosition();

	for ( var i = 0; i < param.maxIter; i ++ ) {

		lambda *= 0.04;

		// y_hat is the current position in space
		var y_hat = betaToPoint( beta );

		var helper = DLShelper( y_hat, y );

		var u = helper.jtj;
		var v = helper.jtd;

		var curr_obj_fn = squaredDistance( y_hat, y );
		console.log("OBJ VAL "+curr_obj_fn);
		console.log("BETA "+beta);
		console.log("BETA POSITION " +y_hat.toArray());

		for ( var j = 0; j < param.maxIter; j ++ ) {

			lambda *= 10;
			console.log("lambda2: "+ lambda)
			if (lambda == Infinity) {
				console.log("Lambda reached infinity! Resetting to 0.0001");
				lambda = 0.0001;
			}

			// System of equations
			var h = helper.jtj;
			h.elements[ 0 ] += lambda * ( 1 + helper.squaredJ.x );
			h.elements[ 4 ] += lambda * ( 1 + helper.squaredJ.y );
			h.elements[ 8 ] += lambda * ( 1 + helper.squaredJ.z );

			var delta = helper.jtd.clone().applyMatrix3( new THREE.Matrix3().getInverse( h ) );

			var beta_prime = [ beta[ 0 ] + delta.x, beta[ 1 ] + delta.y, beta[ 2 ] + delta.z ];
			var y_hat_prime = betaToPoint( beta_prime );
			console.log("BETA PRIME "+beta_prime);
			console.log("BETA PRIME POSITION "+y_hat_prime.toArray());

			var next_obj_fn = squaredDistance( y_hat_prime, y );

			if ( next_obj_fn <= curr_obj_fn ) {
				beta = beta_prime;
				updateMeshKinematics( beta );
				// Stopping criteron: Change too small
				if ( next_obj_fn > 0.999999999 * curr_obj_fn || next_obj_fn < 0.000000001) {

					console.log("SMALL CHANGE: \nPREV "+ curr_obj_fn + "\nCURR "+next_obj_fn);
          console.log("i = "+ i +"\nj = "+ j + "\n");
					return beta;

				} else {

					console.log("BIG CHANGE: \nPREV "+ curr_obj_fn + "\nCURR "+next_obj_fn);

					break;

				}
			}
		}
			console.log("\n\n");
	}
	// // y_hat is the position in space we are at if the beta transformations are applied to the default pose
	// var y_hat = betaToPoint( beta );
	//
	// // Find the error-related stuff
	// var jacobian = gradientMSE( y_hat, y );
	//
	// // Set an initial lambda. Can be any value. Kind of the "step size." Should be positive.
	// var lambda = param.lambda? lambda : Math.max( jacobian.squaredError.x, jacobian.squaredError.y, jacobian.squaredError.z );
	//
	// // Set an initial v. Also doesn't really matter what it is. Just needs to be positive.
	// var v = param.v? v : 2;
	//
	// for ( var k = 0; k < param.kMax; k ++ ) {
	//
	// 	// Stopping criterion: if we're close enough to the target, stop.
	// 	if ( MSE( y_hat, y ) > 1000000 ) {
	// 		var u = jacobian.matrixJTJ;
	// 		u.elements[ 0 ] += lambda * jacobian.squaredError.x;
	// 		u.elements[ 4 ] += lambda * jacobian.squaredError.y;
	// 		u.elements[ 8 ] += lambda * jacobian.squaredError.z;
	//
	// 		// delta = inv( JTJ + lambda * diag( JTJ ) )JTF
	// 		var delta = new THREE.Matrix3().getInverse( jacobian.matrixJTJ );
	// 		console.log(delta.toArray());
	// 		// delta.multiply( jacobian.squaredError );
	// 		// console.log(delta.toArray());
	//
	// 		// beta_prime = beta + delta
	// 		// var beta_prime = beta.add(delta);
	//
	// 		// if beta_prime is closer than beta
	// 		if ( MSE( beta_prime, y ) < MSE( beta, y ) ) {
	//
	// 		  // Update beta to the better value
	// 			beta = beta_prime;
	// 			// Calculate the new value of beta
	// 			y_hat = betaToPoint( beta );
	//
	// 			// Closer to minimum, so behave more like Gauss-Newton
	// 			lambda /= v;
	//
	// 		} else {
	//
	// 			lambda *= v;
	//
	// 		}
	//
	// 	} else {
	//
	// 		break;
	//
	// 	}
	//
	// }
	//
	// console.log("MSE: " + MSE( y_hat, y ));
	// console.log("TARGET VALUE: " + y.toArray());
	// console.log("ENDPOINT VALUE: " + y_hat.toArray());
	// updateMeshKinematics( beta );
	//
	// return beta;

}

function SDLS( param ) {
	console.log("SDLS");
}

function SMCM( param ) {
	console.log("SMCM");
}
