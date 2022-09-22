var websocket = require('ws');
const config = require('config');

var wsServerId = 1
var ws;
function NewWebSocket(){
    try {
        var wsServer = 'wss://ws' + wsServerId  + '.blitzortung.org/'
        console.log('connecting to server %s', wsServerId)
        ws = new websocket.WebSocket(wsServer);
        ws.on('open', function() {
            console.log('socket connected')
            ws.send('{"a":767}');
        });
        ws.on('error', function() {
            console.log('socket errored');
            NewWebSocketServer()
            setTimeout(NewWebSocket, 1000);
        });
        ws.on('close', function() {
            console.log('socket disconnected')
            setTimeout(NewWebSocket, 1000);
        });
        ws.on('message', function message(data) {
            try {
                var dataObj = JSON.parse(decode(Buffer.from(data).toString()))
                console.log(dataObj.lat, dataObj.lon)
            } catch (error) {
                console.log(error)
            }
        });
    } catch (error) {
        NewWebSocketServer()
        setTimeout(NewWebSocket, 1000);
    }

};

function NewWebSocketServer(){
    if (wsServerId = 8) {
        wsServerId = 1
    } else {
        wsServerId += 1
    }
}

NewWebSocket();

// Imported from https://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates
// --->

//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function calcCrow(lat1, lon1, lat2, lon2) {
    var R = 6371; // km
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
    return Value * Math.PI / 180;
}

// <---

// Imported from https://www.blitzortung.org/
// --->

function decode(i) {
    var n;
    var args = {};
    var data = i.split("");
    var name = data[0];
    var prefix = name;
    /** @type {!Array} */
    var param = [name];
    /** @type {number} */
    var x = 256;
    /** @type {number} */
    o = x;
    /** @type {number} */
    i = 1;
    for (; i < data.length; i++) {
        n = data[i].charCodeAt(0);
        n = x > n ? data[i] : args[n] ? args[n] : prefix + name;
        param.push(n);
        name = n.charAt(0);
        args[o] = prefix + name;
        o++;
        prefix = n;
    }
    return param.join("");
}

// <---