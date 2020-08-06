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


function rotate( point, axisName, radians ) {

	// var axis = new THREE.Vector3();
	var rotation = new THREE.Matrix3();

	switch ( axisName.toLowerCase() ) {

		case 'x':
			// axis.x = 1;
			rotation.set( 1, 0, 0,
									  0, Math.cos( radians ), - Math.sin( radians ),
								    0, Math.sin( radians ), Math.cos( radians ) );
			break;

		case 'y':
			// axis.y = 1;
			rotation.set( Math.cos( radians ), 0, Math.sin( radians ),
										0, 1, 0,
									  - Math.sin( radians ), 0, Math.cos( radians ) );
			break;

		case 'z':
			// axis.z = 1;
			rotation.set( Math.cos( radians ), - Math.sin( radians ), 0,
								    Math.sin( radians ), Math.cos( radians ), 0,
										0, 0, 1 );
			break;

		default:
			return;

	}
	return point.applyAxisAngle( axis, radians );

}
