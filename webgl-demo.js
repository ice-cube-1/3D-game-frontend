import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";
import { testTypescript } from "./test.js"

const hitbox = 0.5;

function addmore(i, z, j) {
    var x = Math.random()
    if (x < 0.1) {
        items.push([i, z + 2, j]);
        addmore(i, z + 2, j)
    } else if (x < 0.15) {
        weapons.push({ coords: [i, z + 2, j], rarity: Math.floor(Math.random() * 5) });
    }
}
testTypescript("hello")
var direction = ''
const gridsize = 80
var items = []
var weapons = []
for (var i = -gridsize / 2; i < gridsize / 2; i += 2) {
    for (var j = -gridsize / 2; j < gridsize / 2; j += 2) {
        items.push([i, 0, j]);
        addmore(i, 0, j)
    }
    items.push([i, 2, gridsize / 2])
    items.push([i, 4, gridsize / 2])
    items.push([gridsize / 2, 2, i])
    items.push([gridsize / 2, 4, i])
    items.push([i, 2, -gridsize / 2])
    items.push([i, 4, -gridsize / 2])
    items.push([-gridsize / 2, 2, i])
    items.push([-gridsize / 2, 4, i])
}
var players = [{ x: 0, y: 10, z: 6, rotation: 0, zspeed: 0 }, { x: 10, y: 10, z: 6, rotation: 0.5, zspeed: 0 }, { x: -10, y: 0, z: 6, rotation: -1, zspeed: 0 }]
var player = { x: 0, y: 0, z: 6, rotation: 0, zspeed: 0, weaponPos: 0, attackSpeed: 0, inventory: [{ coords: [0, 0], rarity: 0 }] }
var messages = []
var chatFocussed = false
var frame = 1
const rarities = ["common", "uncommon", "rare", "epic", "legendary"]

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
    var weapontextures = []
    for (i = 0; i < rarities.length; i++) {
        weapontextures.push(loadTexture(gl, `sword/${rarities[i]}.png`))
    }
    const character = loadTexture(gl, "character.png")
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    function render() {
        document.getElementById("coordinates").textContent = `X: ${player.x.toFixed(2)}, Y: ${player.y.toFixed(2)}, Z: ${((player.z - 5) / 2).toFixed(2)}`;
        document.getElementById("chat").innerHTML = messages.join("<br/>");
        if (player.zspeed != 0) {
            player.z += player.zspeed / 10
        } else {
            player.z = Math.ceil(player.z)
        }
        let rightVector = { x: Math.cos(mousePos.x * 4) * 0.2, y: Math.sin(mousePos.x * 4) * 0.2 };
        let forwardVector = { x: -Math.sin(mousePos.x * 4) * 0.2, y: Math.cos(mousePos.x * 4) * 0.2 };
        var tempX = player.x;
        var tempY = player.y;
        switch (direction) {
            case 'forwards':
                tempX += forwardVector.x;
                tempY += forwardVector.y;
                break;
            case 'left':
                tempX += rightVector.x;
                tempY += rightVector.y;
                break;
            case 'backwards':
                tempX -= forwardVector.x;
                tempY -= forwardVector.y;
                break;
            case 'right':
                tempX -= rightVector.x;
                tempY -= rightVector.y;
                break;
        }
        if (checkNotCollision(tempX, tempY, player.z - 4, player.z) && playerPlayerCollision(tempX, tempY, player.z)) {
            player.x = tempX;
            player.y = tempY
        }
        player.weaponPos -= player.attackSpeed
        if (player.weaponPos <= 0.7) {
            player.weaponPos = 1.6;
            player.attackSpeed = 0;
        }
        player.z, player.zspeed = gravity(player.x, player.y, player.z, player.zspeed)
        for (var i = 0; i < players.length; i++) {
            players[i].z += players[i].zspeed / 10
            players[i].z, players[i].zspeed = gravity(players[i].z, players[i].y, players[i].z, players[i].zspeed)
        }
        frame += 1;
        drawScene(gl, programInfo, buffers, floortexture, walltexture, weapontextures, mousePos.x, mousePos.y, player.x, player.y, player.z, items, player.weaponPos, players, character, weapons, frame, player.inventory[0].rarity);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
    let mousePos = { x: 0, y: 0 };
    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePosition(e, canvas);
        mousePos = pos;
    });
    addEventListener("click", (event) => {
        if (player.attackSpeed == 0) {
            player.attackSpeed = 0.02
            for (var i = 0; i < players.length; i++) {
                let forwardVector = { x: -Math.sin(mousePos.x * 4), y: Math.cos(mousePos.x * 4) };
                let directionVector = makeUnitVector({ x: -player.x - players[i].x, y: -player.y - players[i].y })
                if ((-player.x - players[i].x) ** 2 + (-player.y - players[i].y) ** 2 <= (hitbox * 8) ** 2 && dotProduct(forwardVector, directionVector) > 0.9) {
                    players[i].zspeed += 1
                    let vec = { x: -Math.sin(mousePos.x * 4) * 0.2, y: Math.cos(mousePos.x * 4) * 0.2 }
                    var tempX = players[i].x - vec.x;
                    var tempY = players[i].y - vec.y;
                    if (checkNotCollision(tempX, tempY, players[i].z - 3, players[i].z)) {
                        players[i].x = tempX;
                        players[i].y = tempY;
                    }
                }
            }
        }
    });
    $(document).keyup(function (e) {
        switch (e.which) {
            case 87: case 65: case 83: case 68:
                direction = ''
        }
    })

    $(document).keydown(function (e) {
        if (!chatFocussed) {
            switch (e.which) {
                case 87: direction = 'forwards'; break;
                case 65: direction = 'left'; break;
                case 83: direction = 'backwards'; break;
                case 68: direction = 'right'; break;
                case 69: interact(); break;
                case 32: // space
                    if (player.zspeed == 0) {
                        player.zspeed = 2
                    }
                    break;
            }
        } else {
            if (e.which == 13) {
                chatFocussed = false;
            } else if (e.which == 8) {
                messages[messages.length - 1] = messages[messages.length - 1].substring(0, messages[messages.length - 1].length - 1);
            }
        }
    });
}

$(document).keypress(function (e) {
    if (chatFocussed) {
        messages[messages.length - 1] += String.fromCharCode(e.which)
    } else if (e.which == 116) {
        chatFocussed = true;
        messages.push("")
        if (messages.length >= 15) {
            messages = messages.slice(messages.length - 15, messages.length)
        }
    }
})

function playerPlayerCollision(x, y, z) {
    for (var i = 0; i < players.length; i++) {
        if (Math.abs(z - players[i].z) < 4) {
            if ((-x - players[i].x) ** 2 + (-y - players[i].y) ** 2 <= (hitbox * 4) ** 2) {
                return false
            }
        }
    }
    return true
}

function checkNotCollision(playerX, playerY, Zmin, Zmax) {
    for (var i = 0; i < items.length; i++) {
        if (items[i][1] <= Math.ceil(Zmax) && items[i][1] >= Math.ceil(Zmin)) {
            var circleDistance = { x: Math.abs(items[i][0] + playerX), y: Math.abs(items[i][2] + playerY) }
            if (circleDistance.x > (1 + hitbox)) { continue; }
            if (circleDistance.y > (1 + hitbox)) { continue; }
            if (circleDistance.x <= 1) { return false; }
            if (circleDistance.y <= 1) { return false; }
            var cornerDistance_sq = (circleDistance.x - 1) ** 2 + (circleDistance.y - 1) ** 2;
            if (cornerDistance_sq <= (hitbox ** 2)) { return false }
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
    const pixel = new Uint8Array([0, 0, 255, 255]);
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

function gravity(x, y, z, zspeed) {
    if (!checkNotCollision(x, y, Math.ceil(z - 5), Math.ceil(z - 5)) || !playerPlayerCollision(x, y, Math.ceil(z - 1))) {
        zspeed = 0;
        z = Math.ceil(z);
    } else {
        zspeed -= 0.08;
    }
    return z, zspeed
}

function interact() {
    for (i = 0; i < weapons.length; i++) {
        if (weapons[i].coords[0] == Math.round(-player.x / 2) * 2 && weapons[i].coords[1] == Math.round(player.z - 3) && weapons[i].coords[2] == Math.round(-player.y / 2) * 2) {
            var item = weapons.splice(i, 1)[0]
            if (player.inventory.length != 0) {
                player.inventory[0].coords = [Math.round(-player.x / 2) * 2, Math.round(player.z - 3), Math.round(-player.y / 2) * 2]
                weapons.push(player.inventory[0])
                player.inventory = player.inventory.splice(1, player.inventory.length - 1)
            }
            player.inventory.push(item)
            messages.push(`Picked up ${rarities[item.rarity]} item!`)
            return;
        }
    }
}

function makeUnitVector(vector) {
    let magnitude = Math.sqrt(vector.x ** 2 + vector.y ** 2)
    return { x: vector.x / magnitude, y: vector.y / magnitude }
}

function dotProduct(a, b) {
    return (a.x * b.x) + (a.y * b.y)
}

