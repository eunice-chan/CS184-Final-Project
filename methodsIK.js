function DLS( param ) {

		// Initialize Values

		// Set an initial lambda. Can be any value. Should be positive.
		var lambda = param.lambda;
		// Get current transformation of the model joints
		var beta = modelToBeta();

		console.log("CURR POINT "+getEndPointWorldPosition().toArray());

		// y is the position in space we want to get to
		var y = getTargetWorldPosition();

		lambda /= param.decrement;

		// y_hat is the current position in space
		var y_hat = betaToPoint( beta );

		var helper = DLShelper( y_hat, y );

		var u = helper.jtj;
		var v = helper.jtd;

		var curr_obj_fn = squaredDistance( y_hat, y );

		for ( var j = 0; j < param.maxIter; j ++ ) {

			if (lambda == Infinity) {
				console.warn("Lambda reached infinity! Try a different initial pose.");
				return;
			}


			lambda /= param.increment;

			// System of equations
			var h = helper.jtj;
			h.elements[ 0 ] += lambda * ( 1 + helper.squaredJ.x );
			h.elements[ 4 ] += lambda * ( 1 + helper.squaredJ.y );
			h.elements[ 8 ] += lambda * ( 1 + helper.squaredJ.z );

			var delta = helper.jtd.clone().applyMatrix3( new THREE.Matrix3().getInverse( h ) );

			var beta_prime = [ beta[ 0 ] + delta.x, beta[ 1 ] + delta.y, beta[ 2 ] + delta.z ];
			var y_hat_prime = betaToPoint( beta_prime );

			var next_obj_fn = squaredDistance( y_hat_prime, y );

			console.log("BEST OBJECTIVE "+ curr_obj_fn);
			console.log("BEST DISTANCE "+ distance(y_hat, y));
			console.log("THIS OBJECTIVE "+ next_obj_fn);
			console.log("THIS DISTANCE "+ distance(y_hat_prime, y));
			if ( next_obj_fn < curr_obj_fn ) {
				beta = beta_prime;
				updateMeshKinematics( beta );

				// Stopping criteron: Change too small
				if ( next_obj_fn > 0.999999999 * curr_obj_fn || next_obj_fn < 0.000000001) {

					console.log("SMALL CHANGE: \nPREV "+ curr_obj_fn + "\nCURR "+next_obj_fn);
          console.log("i = "+ i +"\nj = "+ j + "\n");
					return beta;

				} else {

					console.log("BIG CHANGE: \nPREV "+ curr_obj_fn + "\nCURR "+next_obj_fn);


					console.log("PRIME POINT"+y_hat.toArray());

					break;

				}
			}
		}
		console.log("\n\n");
}

function SDLS( param ) {
	console.log("SDLS");
}

function SMCM( param ) {
	console.log("SMCM");
}
