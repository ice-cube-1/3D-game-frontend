export function initObjBuffers(gl, objData) {
    const positionBuffer = initPositionBuffer(gl, objData.positions);
    const textureCoordBuffer = initTextureBuffer(gl, objData.texcoords);
    const normalBuffer = initNormalBuffer(gl, objData.normals);
    const indexBuffer = initIndexBuffer(gl, objData.indices);
    return {
        position: positionBuffer,
        textureCoord: textureCoordBuffer,
        normal: normalBuffer,
        indices: indexBuffer,
        vertexCount: objData.indices.length
    };
}
function initPositionBuffer(gl, positions) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return positionBuffer;
}
function initTextureBuffer(gl, texcoords) {
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
    return textureCoordBuffer;
}
function initNormalBuffer(gl, normals) {
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    return normalBuffer;
}
function initIndexBuffer(gl, indices) {
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return indexBuffer;
}
//# sourceMappingURL=init-obj-buffers%20copy.js.map