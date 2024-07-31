// @ts-ignore
import {Mat4} from "./libs/gl-matrix/Mat4.js";

function drawScene(gl: any, programInfo: any, buffers: any, floortexture: any, walltexture: any, weapontextures: any, cameraRotationX: any, cameraRotationY: any, xpos: any, ypos: any, zpos: any, items: any, attackPos: any, players: any, character: any, weapons: any, frame: any, currentweapon: any) {
    gl.clearColor(0.8, 0.9, 1.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const fieldOfView = (45 * Math.PI) / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = Mat4.create();
    Mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    const modelViewMatrix = Mat4.create();
    Mat4.rotate(modelViewMatrix, modelViewMatrix, cameraRotationY * 1.5, [1, 0, 0])
    Mat4.rotate(modelViewMatrix, modelViewMatrix, cameraRotationX * 4, [0, 1, 0])
    Mat4.translate(modelViewMatrix, modelViewMatrix, [xpos, -zpos, ypos],);
    const normalMatrix = Mat4.create();
    Mat4.invert(normalMatrix, modelViewMatrix);
    Mat4.transpose(normalMatrix, normalMatrix);
    setPositionAttribute(gl, buffers, programInfo);
    setTextureAttribute(gl, buffers, programInfo)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    setNormalAttribute(gl, buffers, programInfo)
    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix,);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0)
    const vertexCount = 36
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    for (let i = 0; i < items.length; i++) {
        if (items[i][1] == 0) { gl.bindTexture(gl.TEXTURE_2D, floortexture); }
        else { gl.bindTexture(gl.TEXTURE_2D, walltexture) }
        Mat4.translate(modelViewMatrix, modelViewMatrix, items[i]);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        Mat4.translate(modelViewMatrix, modelViewMatrix, items[i].map((value: number) => -value));
    }
    gl.bindTexture(gl.TEXTURE_2D, character)
    for (let i = 0; i < players.length; i++) {
        Mat4.translate(modelViewMatrix, modelViewMatrix, [players[i].x, players[i].z - 2, players[i].y]);
        Mat4.scale(modelViewMatrix, modelViewMatrix, [1 / 1.2, 2, 1 / 1.2])
        Mat4.rotate(modelViewMatrix, modelViewMatrix, players[i].rotation, [0, 1, 0])
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        Mat4.rotate(modelViewMatrix, modelViewMatrix, -players[i].rotation, [0, 1, 0])
        Mat4.scale(modelViewMatrix, modelViewMatrix, [1.2, 0.5, 1.2])
        Mat4.translate(modelViewMatrix, modelViewMatrix, [-players[i].x, -players[i].z + 2, -players[i].y]);
    }
    for (let i = 0; i < weapons.length; i++) {
        gl.bindTexture(gl.TEXTURE_2D, weapontextures[weapons[i].rarity]);
        Mat4.translate(modelViewMatrix, modelViewMatrix, weapons[i].coords)
        Mat4.rotate(modelViewMatrix, modelViewMatrix, frame/50, [0,1,0])
        Mat4.scale(modelViewMatrix, modelViewMatrix, [0.005, 0.5, 0.5])
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        Mat4.scale(modelViewMatrix, modelViewMatrix, [200, 2, 2])
        Mat4.rotate(modelViewMatrix, modelViewMatrix, -frame/50, [0,1,0])
        Mat4.translate(modelViewMatrix, modelViewMatrix, (weapons[i].coords).map((value: number) => -value))
    }
    const fixedModelViewMatrix = Mat4.create();
    gl.bindTexture(gl.TEXTURE_2D, weapontextures[currentweapon])
    Mat4.translate(fixedModelViewMatrix, fixedModelViewMatrix, [-1, 0, -1]);
    Mat4.rotate(fixedModelViewMatrix, fixedModelViewMatrix, attackPos * 4, [1, 0, 0])
    setNormalAttribute(gl, buffers, programInfo) 
    Mat4.scale(fixedModelViewMatrix, fixedModelViewMatrix, [0.01, 1, 0.2]);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, fixedModelViewMatrix);
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
}

function setPositionAttribute(gl: any, buffers: any, programInfo: any) {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

function setTextureAttribute(gl: any, buffers: any, programInfo: any) {
    const num = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord)
}

function setNormalAttribute(gl: any, buffers: any, programInfo: any) {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, numComponents, type, normalize, stride, offset,);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
}

export { drawScene };