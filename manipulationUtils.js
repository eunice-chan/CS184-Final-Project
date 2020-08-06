function getModelWorldPosition( model ) {

	var position = new THREE.Vector3();
	position.setFromMatrixPosition( model.matrixWorld );

	return position;

}

function getTargetWorldPosition() {

	return getModelWorldPosition( target );

}

function getEndPointWorldPosition() {

	return getModelWorldPosition( endPoint );

}


function rotate( point, axis, amount ) {

	var rotation = new THREE.Matrix3();

	switch ( axis.toLowerCase() ) {

		case 'x':
			rotation.set( 1, 0, 0,
									  0, Math.cos( amount ), - Math.sin( amount ),
								    0, Math.sin( amount ), Math.cos( amount ) );
			break;

		case 'y':
			rotation.set( Math.cos( amount ), 0, Math.sin( amount ),
										0, 1, 0,
									  - Math.sin( amount ), 0, Math.cos( amount ) );
			break;


		case 'z':
			rotation.set( Math.cos( amount ), - Math.sin( amount ), 0,
								    Math.sin( amount ), Math.cos( amount ), 0,
										0, 0, 1 );
			break;

	}
	return point.applyMatrix3( rotation );

}
