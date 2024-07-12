import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

const hitbox = 0.5;
const items = [[-4,4,-4],[4,4,-4],[-4,4,4],[4,4,4],
                [-2,2,-4],[-4,2,-4],[2,2,-4],[4,2,-4],
                [-2,2,-2],[-4,2,-2],[2,2,-2],[4,2,-2],
                [-2,2,2],[-4,2,2],[2,2,2],[4,2,2],
                [-2,2,4],[-4,2,4],[2,2,4],[4,2,4]];
for (var i = -20; i<=20; i+=2) {
    for (var j = -20; j<=20; j+=2) {
        items.push([i, 0, j])
    }
    items.push([i,2,-20])
    items.push([i,2,20])
    items.push([i,4,-20])
    items.push([i,4,20])
    items.push([-20,2,i])
    items.push([20,2,i])
    items.push([-20,4,i])
    items.push([20,4,i])
}
var players = [{x: 0, y: 10, z: 5, rotation: 0, zspeed: 0}, {x: 10, y: 10, z: 5, rotation: 0.5, zspeed: 0}, {x: -10, y: 0, z: 5, rotation: -1, zspeed:0}]

let Xpos = 0;
let Ypos = 0;
let Zpos = 5;
let speed = 0.5;
let zspeed = 0;
let attackPos = 1.6;
let attackSpeed = 0;

main();
function main() {
    const canvas = document.querySelector("#glcanvas")
    const gl = canvas.getContext("webgl");
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aTextureCoord;
        uniform mat4 uNormalMatrix;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        varying highp vec2 vTextureCoord;
        varying highp vec3 vLighting;
        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vTextureCoord = aTextureCoord;
            highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
            highp vec3 directionalLightColor = vec3(1, 1, 1);
            highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
            highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
            highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
            vLighting = ambientLight + (directionalLightColor * directional);
        }
    `;
    const fsSource = `
        varying highp vec2 vTextureCoord;
        varying highp vec3 vLighting;
        uniform sampler2D uSampler;
        void main(void) {
        highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
        gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
        }
    `;
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
          vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
          textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
          modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
          normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix"),
          uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
        },
      };            
    const buffers = initBuffers(gl);
    const floortexture = loadTexture(gl, "floortexture.png");
    const walltexture = loadTexture(gl, "walltexture.png")
    const weapontexture = loadTexture(gl, "sword.png")
    const character = loadTexture(gl, "character.png")
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    function render() {
        document.getElementById("textOverlay").textContent = `X: ${Math.round(Xpos)}, Y: ${Math.round(Ypos)}, Z: ${Math.floor(Zpos/2)}`;
        Zpos+=zspeed/10
        attackPos-=attackSpeed
        if (attackPos <= 0.7) {
            attackPos = 1.6;
            attackSpeed = 0;
        }
        Zpos, zspeed = gravity(Xpos,Ypos,Zpos,zspeed)
        for (var i = 0; i<players.length; i++) {
            players[i].z+=players[i].zspeed/10
            players[i].z, players[i].zspeed = gravity(players[i].z, players[i].y, players[i].z,players[i].zspeed)
        }
        drawScene(gl, programInfo, buffers, floortexture, walltexture, weapontexture, mousePos.x, mousePos.y, Xpos, Ypos, Zpos, items, attackPos, players, character);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
    let mousePos = { x: 0, y: 0 };
    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePosition(e, canvas);
        mousePos = pos;
    });
    addEventListener("click", (event) => {
        if (attackSpeed == 0) {
            attackSpeed = 0.02
            for (var i = 0; i<players.length; i++) {
                if ((-Xpos-players[i].x)**2 + (-Ypos-players[i].y)**2 <= (hitbox*8)**2 && (Math.abs(Zpos-players[i].z) < 4)) {
                    players[i].zspeed+=1
                    let vec = {x: -Math.sin(mousePos.x*4), y: Math.cos(mousePos.x*4)}
                    var tempX = players[i].x-vec.x * speed;
                    var tempY = players[i].y-vec.y * speed;
                    if (checkNotCollision(tempX, tempY)) {
                        players[i].x = tempX;
                        players[i].y = tempY;
                        console.log("here")
                    }
                }
            }
        }
    });
    $(document).keydown(function (e) {
        let rightVector = { x: Math.cos(mousePos.x*4), y: Math.sin(mousePos.x*4) };
        let forwardVector = { x: -Math.sin(mousePos.x*4), y: Math.cos(mousePos.x*4) };
        switch (e.which) {
            case 87: // W key - Move forward
                var tempX = Xpos+forwardVector.x * speed;
                var tempY = Ypos+forwardVector.y * speed;
                if (checkNotCollision(tempX, tempY) && playerPlayerCollision(tempX,tempY,Zpos)) {
                    Xpos = tempX;
                    Ypos = tempY
                }
                break;
            case 65: // A key - Move left
                var tempX = Xpos+rightVector.x * speed;
                var tempY = Ypos+rightVector.y * speed;
                if (checkNotCollision(tempX, tempY) && playerPlayerCollision(tempX,tempY,Zpos)) {
                    Xpos = tempX;
                    Ypos = tempY
                }
                break;
            case 83: // S key - Move backward
                var tempX = Xpos-forwardVector.x * speed;
                var tempY = Ypos-forwardVector.y * speed;
                if (checkNotCollision(tempX, tempY) && playerPlayerCollision(tempX,tempY,Zpos)) {
                    Xpos = tempX;
                    Ypos = tempY
                }
                break;
            case 68: // D key - Move right
                var tempX = Xpos-rightVector.x * speed;
                var tempY = Ypos-rightVector.y * speed;
                if (checkNotCollision(tempX, tempY) && playerPlayerCollision(tempX,tempY,Zpos)) {
                    Xpos = tempX;
                    Ypos = tempY
                }
                break;
            case 32: // space
                if (zspeed == 0) {
                    zspeed = 2
                }
                break;
        }
    });
}

function playerPlayerCollision(x,y,z) {
    for (var i = 0; i<players.length; i++) {
        if (Math.abs(z-players[i].z) < 4) {
            if ((-x-players[i].x)**2 + (-y-players[i].y)**2 <= (hitbox*4)**2) {
                return false
            }
        }
    }
    return true
}

function checkNotCollision(playerX,playerY) {
    for (var i = 0; i < items.length; i++) {
        if (items[i][1] <= Math.ceil(Zpos) && items[i][1] >= Math.ceil(Zpos) - 3) {
            var circleDistance = {x: Math.abs(items[i][0] + playerX), y: Math.abs(items[i][2] + playerY)}
            if (circleDistance.x > (1 + hitbox)) { continue; }
            if (circleDistance.y > (1 + hitbox)) { continue; }
            if (circleDistance.x <= 1) { return false; } 
            if (circleDistance.y <= 1) { return false; }
            var cornerDistance_sq = (circleDistance.x - 1)**2 + (circleDistance.y - 1)**2;
            if (cornerDistance_sq <= (hitbox**2)) {return false}
        }
    }
    return true
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0,0,255,255]);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);
    const image = new Image();
    image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D)
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = url;
    return texture;
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
  }

  function getMousePosition(event, target) {
    target = target || event.target;
    const rect = target.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 2 - 1;
    const y = (event.clientY - rect.top) / rect.height * 2 - 1;
    return { x, y };
}
function gravity(Xpos,Ypos,Zpos,zspeed) {
    var floor = [Math.round(Xpos / 2) * 2, Math.ceil(Zpos - 5), Math.ceil(Ypos / 2) * 2];
    for (var i = 0; i < items.length; i++) {
        if (items[i][0] === floor[0] && items[i][1] === floor[1] && items[i][2] === floor[2]) {
            zspeed = 0;
            Zpos = Math.ceil(Zpos);
            return Zpos, zspeed;
        }
    } 
    zspeed -= 0.08;
    return Zpos, zspeed;
}
