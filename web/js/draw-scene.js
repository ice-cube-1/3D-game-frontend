// @ts-ignore
import { Mat4 } from "./libs/gl-matrix/mat4.js";
import { loadTexture } from "./webgl-demo.js";
function drawScene(gl, programInfo, buffers, floortexture, walltexture, weapontextures, cameraRotationX, cameraRotationY, xpos, ypos, zpos, items, attackPos, players, character, weapons, frame, inventory, shaderProgram, armour) {
    gl.clearColor(0.8, 0.9, 1.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const fieldOfView = (45 * Math.PI) / 180;
    const canvas = gl.canvas;
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = Mat4.create();
    Mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    const modelViewMatrix = Mat4.create();
    Mat4.rotate(modelViewMatrix, modelViewMatrix, cameraRotationY * 1.5, [1, 0, 0]);
    Mat4.rotate(modelViewMatrix, modelViewMatrix, cameraRotationX * 4, [0, 1, 0]);
    Mat4.translate(modelViewMatrix, modelViewMatrix, [xpos, -zpos, ypos]);
    const normalMatrix = Mat4.create();
    Mat4.invert(normalMatrix, modelViewMatrix);
    Mat4.transpose(normalMatrix, normalMatrix);
    setPositionAttribute(gl, buffers, programInfo);
    setTextureAttribute(gl, buffers, programInfo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    setNormalAttribute(gl, buffers, programInfo);
    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    for (let i = 0; i < items.length; i++) {
        if (items[i][1] == 0) {
            bindTexture(gl, floortexture, false, shaderProgram);
        }
        else {
            bindTexture(gl, walltexture, false, shaderProgram);
        }
        const initialMatrix = Mat4.clone(modelViewMatrix);
        Mat4.translate(modelViewMatrix, modelViewMatrix, items[i]);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        Mat4.copy(modelViewMatrix, initialMatrix);
    }
    for (let i = 0; i < weapons.length; i++) {
        const initialMatrix = Mat4.clone(modelViewMatrix);
        bindTexture(gl, weapontextures[weapons[i].type][weapons[i].rarity], false, shaderProgram);
        Mat4.translate(modelViewMatrix, modelViewMatrix, weapons[i].coords);
        Mat4.rotate(modelViewMatrix, modelViewMatrix, frame / 50, [0, 1, 0]);
        Mat4.scale(modelViewMatrix, modelViewMatrix, [0.005, 1, 1]);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        Mat4.copy(modelViewMatrix, initialMatrix);
    }
    for (let i = 0; i < players.length; i++) {
        const initialMatrix = Mat4.clone(modelViewMatrix);
        var blockcolor = loadTexture(gl, "", new Uint8Array(players[i].color));
        bindTexture(gl, blockcolor, character, shaderProgram);
        Mat4.translate(modelViewMatrix, modelViewMatrix, [players[i].x, players[i].z - 2, players[i].y]);
        Mat4.scale(modelViewMatrix, modelViewMatrix, [1 / 1.2, 2, 1 / 1.2]);
        Mat4.rotate(modelViewMatrix, modelViewMatrix, players[i].rotation, [0, 1, 0]);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        Mat4.copy(modelViewMatrix, initialMatrix);
        bindTexture(gl, armour[players[i].inventory[1].rarity], false, shaderProgram);
        Mat4.translate(modelViewMatrix, modelViewMatrix, [players[i].x, players[i].z - 2, players[i].y]);
        Mat4.rotate(modelViewMatrix, modelViewMatrix, players[i].rotation, [0, 1, 0]);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        Mat4.copy(modelViewMatrix, initialMatrix);
        bindTexture(gl, weapontextures[players[i].inventory[0].type][players[i].inventory[0].rarity], false, shaderProgram);
        Mat4.translate(modelViewMatrix, modelViewMatrix, [players[i].x + 1, players[i].z - 1, players[i].y - 1]);
        Mat4.rotate(modelViewMatrix, modelViewMatrix, players[i].weaponPos * 2, [-1, 0, 0]);
        setNormalAttribute(gl, buffers, programInfo);
        Mat4.scale(modelViewMatrix, modelViewMatrix, [0.01, 1, 0.2]);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        Mat4.copy(modelViewMatrix, initialMatrix);
    }
    const fixedModelViewMatrix = Mat4.create();
    bindTexture(gl, weapontextures[inventory[0].type][inventory[0].rarity], false, shaderProgram);
    Mat4.translate(fixedModelViewMatrix, fixedModelViewMatrix, [1, -1, -1]);
    Mat4.rotate(fixedModelViewMatrix, fixedModelViewMatrix, (attackPos) * 2, [-1, 0, 0]);
    setNormalAttribute(gl, buffers, programInfo);
    Mat4.scale(fixedModelViewMatrix, fixedModelViewMatrix, [0.01, 1, 1]);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, fixedModelViewMatrix);
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
}
function setPositionAttribute(gl, buffers, programInfo) {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}
function setTextureAttribute(gl, buffers, programInfo) {
    const num = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
}
function setNormalAttribute(gl, buffers, programInfo) {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, numComponents, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
}
function bindTexture(gl, texture1, texture2, shaderProgram) {
    const uSamplerLocation = gl.getUniformLocation(shaderProgram, "uSampler");
    const uSecondSamplerLocation = gl.getUniformLocation(shaderProgram, "uSecondSampler");
    const uUseSecondTextureLocation = gl.getUniformLocation(shaderProgram, "uUseSecondTexture");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.uniform1i(uSamplerLocation, 0);
    var useSecondTexture = 0;
    if (texture2 != false) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        gl.uniform1i(uSecondSamplerLocation, 1);
        useSecondTexture = 1;
    }
    gl.uniform1i(uUseSecondTextureLocation, useSecondTexture);
}
export { drawScene };
//# sourceMappingURL=draw-scene.js.map