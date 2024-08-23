import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";
const hitbox = 0.5;
var hasLock = false;
let mousePos = { x: 0, y: 0 };
function pointerLockChange() {
    if (document.pointerLockElement === null) {
        hasLock = false;
    }
    else if (document.pointerLockElement === document.body) {
        hasLock = true;
    }
}
function handleMouseMove(event) {
    mousePos.x += event.movementX / 500;
    if (Math.abs(mousePos.y + (event.movementY) / 500) <= 1) {
        mousePos.y += event.movementY / 500;
    }
}
function handleMouseDown(event) {
    if (!hasLock) {
        document.body.requestPointerLock();
    }
}
var blocks = [];
var weapons = [];
var players = [];
var messages = [];
var player = { id: -1, x: Math.floor(Math.random() * 80) - 40, y: Math.floor(Math.random() * 80) - 40, z: 20, rotation: 0, zspeed: 0, weaponPos: 0, attackSpeed: 0, inventory: [{ coords: [0, 0, 0], rarity: 0, type: 0 }, { coords: [0, 0, 0], rarity: 0, type: 3 }], hp: 40, name: "unknown", color: [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), 255] };
var direction = "";
const socket = new WebSocket(document.location.protocol + '//' + document.domain + ':' + location.port + '/socket');
socket.addEventListener("message", (toUpdate) => {
    var [idstr, type, content] = toUpdate.data.split(": ", 3);
    var id = Number(idstr);
    var idx = idxFromID(id);
    switch (type) {
        case "message":
            if (chatFocussed) {
                messages.splice(messages.length - 1, 0, content);
            }
            else {
                messages.push(content);
            }
            break;
        case "position":
            splitPos(content, id);
            players[idx].x *= -1;
            players[idx].y *= -1;
            break;
        case "weaponPickup":
            const [pickedUp, dropped] = content.split(" - ").map(item => item.split(", ").map(num => Number(num)));
            weapons = weapons.filter(weapon => !(weapon.coords[0] === pickedUp[0] && weapon.coords[1] === pickedUp[1] && weapon.coords[2] === pickedUp[2]));
            weapons.push({ coords: dropped.slice(0, 3), rarity: dropped[3], type: dropped[4] });
            if (dropped[4] == 3) {
                players[idx].inventory[1] = { coords: pickedUp.slice(0, 3), rarity: pickedUp[3], type: pickedUp[4] };
            }
            else {
                players[idx].inventory[0] = { coords: pickedUp.slice(0, 3), rarity: pickedUp[3], type: pickedUp[4] };
            }
            break;
        case "blocks":
            blocks.push(content.split(", ").map(item => Number(item)));
            break;
        case "playerStats":
            players.push({ id: id, x: 0, y: 0, z: 0, rotation: 0, weaponPos: 0, inventory: [{ coords: [0, 0, 0], rarity: 0, type: 0 }, { coords: [0, 0, 0], rarity: 0, type: 0 }], name: "unknown", hp: 40, color: [100, 100, 100, 255] });
            var idx = idxFromID(id);
            var stats = content.split(" - ");
            for (const i of stats) {
                [type, content] = i.split(":");
                console.log(idx);
                console.log(players[idx] + type);
                switch (type) {
                    case "position":
                        splitPos(content, id);
                        break;
                    case "weaponChoice":
                        var weapon = content.split(", ").map(item => Number(item));
                        if (weapon[4] == 3) {
                            console.log(players[idx]);
                            players[idx].inventory[1] = { coords: weapon.slice(0, 3), rarity: weapon[3], type: weapon[4] };
                        }
                        else {
                            console.log(players[idx]);
                            players[idx].inventory[0] = { coords: weapon.slice(0, 3), rarity: weapon[3], type: weapon[4] };
                        }
                        break;
                    case "name":
                        players[idx].name = content;
                        break;
                    case "hp":
                        players[idx].hp = Number(content);
                        break;
                    case "color":
                        console.log(content.split(", ").map(item => Number(item)));
                        players[idx].color = content.split(", ").map(item => Number(item));
                        break;
                }
            }
            if (players.slice(players.length - 1)[0].id == -1) {
                var newplayer = players.slice(players.length - 1)[0];
                player.color = newplayer.color;
                player.inventory = newplayer.inventory;
                player.x = newplayer.x;
                player.y = newplayer.y;
                player.z = newplayer.z;
                player.hp = newplayer.hp;
                player.name = newplayer.name;
                players.splice(players.length - 1);
                messages.push("You have logged in as " + player.name);
                send("0: message: " + player.name + " has logged in");
            }
            break;
        case "id":
            player.id = id;
            send(player.id + ": color: " + player.color.join(", "));
            break;
        case "zspeed":
            player.zspeed += Number(content);
            break;
        case "weapon":
            const toplace = content.split(",").map(num => Number(num));
            weapons.push({ coords: toplace.slice(0, 3), rarity: toplace[3], type: toplace[4] });
            break;
        case "weaponPos":
            players[id].weaponPos = Number(content);
            break;
        case "login":
            if (content == 'incorrect password') {
                messages.push("This username has already been taken (or wrong password)");
            }
            else if (content == 'logged in') {
                messages.push("Please refresh to log out so you can log in as someone else");
            }
            else if (content.startsWith("account")) {
                const username = content.split(" ")[1];
                player.name = username;
                messages.push("Your account has been successfully created");
            }
            break;
        case "hp":
            if (player.hp < 20 && content == "40") {
                player.x = Math.floor(Math.random() * 80) - 40;
                player.y = Math.floor(Math.random() * 80) - 40;
            }
            player.hp = Number(content);
            break;
        case "moveItem":
            const [oldcoords, newcoords] = content.split(" - ").map(i => i.split(", ").map(j => Number(j)));
            for (var i = 0; i < weapons.length; i++) {
                if (oldcoords.every((val, index) => val === weapons[i].coords[index])) {
                    weapons[i].coords = newcoords;
                }
            }
            break;
        case "namechange":
            players[idx].name = content;
            break;
        case "color":
            players[idx].color = content.split(", ").map(item => Number(item));
            break;
        case "remove":
            players.splice(idx);
            break;
    }
});
var chatFocussed = false;
var frame = 1;
const rarities = ["common", "uncommon", "rare", "epic", "legendary"];
const typeMultiplier = [1.5, 2, 1];
const speedMultiplier = [1.5, 1, 2];
const itemtypes = ["sword", "axe", "spear", "armour", "potion"];
const ranges = [1, 2, 1.5];
main();
function main() {
    document.onmousemove = handleMouseMove;
    document.onpointerlockchange = pointerLockChange;
    document.onmousedown = handleMouseDown;
    const canvas = document.querySelector("#glcanvas");
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

        uniform sampler2D uSampler;           // Primary texture sampler
        uniform sampler2D uSecondSampler;     // Secondary texture sampler
        uniform bool uUseSecondTexture;       // Flag to determine if second texture should be used

        void main(void) {
            highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
            
            if (uUseSecondTexture) {
                highp vec4 secondTexelColor = texture2D(uSecondSampler, vTextureCoord);
                texelColor = mix(texelColor, secondTexelColor, secondTexelColor.a);
            }
            
            gl_FragColor = vec4(texelColor.rgb * vLighting *texelColor.a, texelColor.a);
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
    const walltexture = loadTexture(gl, "walltexture.png");
    var armourWearable = [];
    for (var i = 0; i < rarities.length; i++) {
        armourWearable.push(loadTexture(gl, `armour-wearable/${rarities[i]}.png`));
    }
    var weapontextures = [];
    for (var j = 0; j < itemtypes.length; j++) {
        weapontextures.push([]);
        for (var i = 0; i < rarities.length; i++) {
            weapontextures[j].push(loadTexture(gl, `${itemtypes[j]}/${rarities[i]}.png`));
        }
    }
    const character = loadTexture(gl, "character.png");
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    let then = 0;
    function render(now) {
        now *= 0.001;
        const deltaTime = now - then;
        then = now;
        const fps = 1 / deltaTime;
        const coords = document.getElementById("coordinates");
        coords.textContent = `X: ${player.x.toFixed(2)}, Y: ${player.y.toFixed(2)}, Z: ${((player.z - 5) / 2).toFixed(2)}, HP: ${player.hp}, FPS: ${fps.toFixed(1)}`;
        const chat = document.getElementById("chat");
        chat.innerHTML = messages.join("<br/>");
        const info = document.getElementById("playerinfo");
        var playerinfo = [player.name + ": " + player.hp + "/40"];
        for (i = 0; i < players.length; i++) {
            playerinfo.push(players[i].name + ": " + players[i].hp + "/40");
        }
        info.innerHTML = playerinfo.join("<br/>");
        if (player.zspeed != 0) {
            player.z += player.zspeed / 10 * 0.5 * (30 / fps);
        }
        else {
            player.z = Math.ceil(player.z);
        }
        let rightVector = { x: Math.cos(mousePos.x * 4) * 0.2 * (30 / fps), y: Math.sin(mousePos.x * 4) * 0.2 * (30 / fps) };
        let forwardVector = { x: -Math.sin(mousePos.x * 4) * 0.2 * (30 / fps), y: Math.cos(mousePos.x * 4) * 0.2 * (30 / fps) };
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
        if (checkNotCollision(tempX, tempY, player.z - 4, player.z) && playerPlayerCollision(tempX, tempY, player.z) && Math.abs(tempY) <= 100 && Math.abs(tempX) <= 100) {
            player.x = tempX;
            player.y = tempY;
        }
        player.weaponPos -= player.attackSpeed * speedMultiplier[player.inventory[0].type] * (30 / fps);
        if (player.weaponPos <= 0) {
            player.weaponPos = 1;
            player.attackSpeed = 0;
        }
        gravity(fps);
        frame += 1 * (30 / fps);
        send(player.id + ": position: " + -player.x + ", " + -player.y + ", " + player.z + ", " + player.rotation + ", " + player.weaponPos);
        player.rotation = mousePos.x * 4;
        drawScene(gl, programInfo, buffers, floortexture, walltexture, weapontextures, mousePos.x, mousePos.y, player.x, player.y, player.z, blocks, player.weaponPos, players, character, weapons, frame, player.inventory, shaderProgram, armourWearable);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
    addEventListener("click", (event) => {
        if (player.attackSpeed == 0) {
            player.attackSpeed = 0.05;
            send(player.id + ": weaponPos: " + player.weaponPos);
            for (var i = 0; i < players.length; i++) {
                let forwardVector = { x: -Math.sin(mousePos.x * 4), y: Math.cos(mousePos.x * 4) };
                let directionVector = makeUnitVector({ x: -player.x - players[i].x, y: -player.y - players[i].y });
                if (Math.pow((-player.x - players[i].x), 2) + Math.pow((-player.y - players[i].y), 2) <= Math.pow((hitbox * 8 * ranges[player.inventory[0].type]), 2) && dotProduct(forwardVector, directionVector) > 0.9) {
                    send(players[i].id + ": zspeed: " + 1);
                    let vec = { x: -Math.sin(mousePos.x * 4) * 0.2, y: Math.cos(mousePos.x * 4) * 0.2 };
                    var tempX = players[i].x - vec.x;
                    var tempY = players[i].y - vec.y;
                    if (checkNotCollision(tempX, tempY, players[i].z - 3, players[i].z)) {
                        players[i].x = tempX;
                        players[i].y = tempY;
                    }
                    players[i].hp -= Math.round((player.inventory[0].rarity + 1) * typeMultiplier[player.inventory[0].type] / ((1 + players[i].inventory[1].rarity)));
                    console.log(1 + players[i].inventory[1].rarity);
                    if (players[i].hp <= 0) {
                        players[i].inventory = [{ coords: [0, 0, 0], rarity: 0, type: 0 }];
                        messages.push(players[i].name + " has been killed by " + player.name);
                        send(player.name + ": message: " + players[i].name + " has been killed by " + player.name);
                        players[i].hp = 40;
                    }
                    send(players[i].id + ": position: " + players[i].x + ", " + players[i].y + ", " + players[i].z + ", " + players[i].rotation + ", " + players[i].weaponPos);
                    send(players[i].id + ": hp: " + players[i].hp);
                }
            }
        }
    });
    $(document).keyup(function (e) {
        switch (e.which) {
            case 87:
            case 65:
            case 83:
            case 68:
                direction = '';
        }
    });
    $(document).keydown(function (e) {
        if (!chatFocussed) {
            switch (e.which) {
                case 87:
                    direction = 'forwards';
                    break;
                case 65:
                    direction = 'left';
                    break;
                case 83:
                    direction = 'backwards';
                    break;
                case 68:
                    direction = 'right';
                    break;
                case 69:
                    interact();
                    break;
                case 32: // space
                    if (player.zspeed == 0) {
                        player.zspeed = 4;
                    }
                    break;
            }
        }
        else {
            if (e.which == 13) {
                var message = messages[messages.length - 1];
                if (message.startsWith("/login ")) {
                    send(player.id + ": login: " + message.slice(7));
                }
                else if (message.startsWith("/setcolor ")) {
                    player.color = message.slice(10).split(", ").map(item => Number(item));
                    player.color.push(255);
                    send(player.id + ": color: " + message.slice(10) + ", 255");
                    messages.push("Your colour has been changed");
                }
                else if (message.startsWith("/help")) {
                    window.location.href = 'about.html';
                }
                else {
                    messages[messages.length - 1] = player.name + " - " + message;
                    send(player.id + ": message: " + messages.slice(-1)[0]);
                }
                chatFocussed = false;
            }
            else if (e.which == 8) {
                messages[messages.length - 1] = messages[messages.length - 1].substring(0, messages[messages.length - 1].length - 1);
            }
        }
    });
}
$(document).keypress(function (e) {
    if (chatFocussed) {
        messages[messages.length - 1] += String.fromCharCode(e.which);
    }
    else if (e.which == 116) {
        chatFocussed = true;
        messages.push("");
        if (messages.length >= 15) {
            messages = messages.slice(messages.length - 15, messages.length);
        }
    }
});
function playerPlayerCollision(x, y, z) {
    for (var i = 0; i < players.length; i++) {
        if (Math.abs(z - players[i].z) < 4) {
            if (Math.pow((-x - players[i].x), 2) + Math.pow((-y - players[i].y), 2) <= Math.pow((hitbox * 4), 2)) {
                return false;
            }
        }
    }
    return true;
}
function checkNotCollision(playerX, playerY, Zmin, Zmax) {
    for (var i = 0; i < blocks.length; i++) {
        if (blocks[i][1] <= Math.ceil(Zmax) && blocks[i][1] >= Math.ceil(Zmin)) {
            var circleDistance = { x: Math.abs(blocks[i][0] + playerX), y: Math.abs(blocks[i][2] + playerY) };
            if (circleDistance.x > (1 + hitbox)) {
                continue;
            }
            if (circleDistance.y > (1 + hitbox)) {
                continue;
            }
            if (circleDistance.x <= 1) {
                return false;
            }
            if (circleDistance.y <= 1) {
                return false;
            }
            var cornerDistance_sq = Math.pow((circleDistance.x - 1), 2) + Math.pow((circleDistance.y - 1), 2);
            if (cornerDistance_sq <= (Math.pow(hitbox, 2))) {
                return false;
            }
        }
    }
    return true;
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
export function loadTexture(gl, url, blockColor) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    // Use the provided block color or default to blue if not provided
    const pixel = blockColor || new Uint8Array([255, 255, 255, 255]);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);
    if (!blockColor) {
        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }
            else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
        };
        image.src = url;
    }
    else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    return texture;
}
function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}
function gravity(fps) {
    if (!checkNotCollision(player.x, player.y, Math.ceil(player.z - 5), Math.ceil(player.z - 5)) || !playerPlayerCollision(player.x, player.y, Math.ceil(player.z - 1))) {
        player.zspeed = 0;
        player.z = Math.ceil(player.z);
    }
    else {
        player.zspeed -= 0.15 * (30 / fps);
    }
}
function interact() {
    for (let i = 0; i < weapons.length; i++) {
        if (weapons[i].coords[0] == Math.round(-player.x / 2) * 2 && weapons[i].coords[1] == Math.round(player.z - 3) && weapons[i].coords[2] == Math.round(-player.y / 2) * 2) {
            if (weapons[i].type == 4) {
                player.hp += (weapons[i].rarity + 1);
                if (player.hp > 40) {
                    player.hp = 40;
                }
                send(player.id + ": hp: " + player.hp);
                send(player.id + ": moveItem: " + weapons[i].coords.join(", "));
                return;
            }
            var storedrarity = weapons[i].rarity;
            var storedtype = weapons[i].type;
            var change = 0;
            if (storedtype == 3) {
                change = 1;
            }
            weapons[i].rarity = player.inventory[change].rarity;
            weapons[i].type = player.inventory[change].type;
            send(player.id + ": weaponPickup: " + weapons[i].coords[0] + ", " + weapons[i].coords[1] + ", " + weapons[i].coords[2] + ", " + storedrarity + ", " + storedtype + " - " + weapons[i].coords[0] + ", " + weapons[i].coords[1] + ", " + weapons[i].coords[2] + ", " + player.inventory[change].rarity + ", " + player.inventory[change].type);
            player.inventory[change].rarity = storedrarity;
            player.inventory[change].type = storedtype;
            messages.push(`Picked up an ${rarities[storedrarity]} ${itemtypes[storedtype]}!`);
            return;
        }
    }
}
function makeUnitVector(vector) {
    let magnitude = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
    return { x: vector.x / magnitude, y: vector.y / magnitude };
}
function dotProduct(a, b) {
    return (a.x * b.x) + (a.y * b.y);
}
function splitPos(content, id) {
    id = idxFromID(id);
    var position = content.split(", ").map(num => Number(num));
    players[id].x = -position[0];
    players[id].y = -position[1];
    players[id].z = position[2];
    players[id].rotation = position[3];
    players[id].weaponPos = position[4];
}
function idxFromID(id) {
    for (const player of players) {
        if (player.id == id) {
            return players.indexOf(player);
        }
    }
    return 1000;
}
function send(data) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
    }
    else {
        socket.addEventListener("open", function onOpen(ev) {
            socket.send(data);
            socket.removeEventListener("open", onOpen);
        });
    }
}
//# sourceMappingURL=webgl-demo.js.map