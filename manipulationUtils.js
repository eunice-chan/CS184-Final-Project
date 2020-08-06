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


function transformPoint( point, pivot, rotateX, rotateY, rotateZ, moveX, moveY, moveZ ) {

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
