const websocket = require('ws');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const config = require('config');

const client = new Client({
    intents:
        [
            
        ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    NewWebSocket();
    setInterval(SendPrivateMessage, 5 * 60000);
    const user = client.users.fetch(config.discordId).then((user) => {
        user.send({ embeds: [embeds] }).catch(() => {
            console.log("User has DMs closed or has no mutual servers with the bot :(");
        });
    }).catch(() => null);
});
client.login(config.discordToken);

var latestWarn = 0
var RecentImpacts = []

function DecodedDataManager(data) {
    var impactDistance = calcCrow(data.lat, data.lon, config.position.lat, config.position.lon)

    if (impactDistance < config.position.watchDistance) {
        RecentImpacts.push(data)
    }

    if (impactDistance < config.position.instantWarningDistance) {
        if (latestWarn + 60000 < Date.now()) {
            SendPrivateMessage(true, data)
        }
    }

    console.log(impactDistance, 'km')
}

async function SendPrivateMessage(instant, data) {

    if (instant || RecentImpacts.length) {
        const user = await client.users.fetch(config.discordId).catch(() => null);

        if (!user) return console.log('User not found :(')

        latestWarn = Date.now()

        var embeds = []

        if (instant) {
            var impactDistance = calcCrow(data.lat, data.lon, config.position.lat, config.position.lon)
            var instantEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Instant Warning!')
                .setDescription('A thunderbold has hit ' + Math.round(impactDistance, 2) + 'km away <t:' + Math.round(data.time / 1000000000) + ':R> ')
                embeds.push(instantEmbed)
        }

        if (RecentImpacts.length) {
            var closest = {}
            var closestDistance = 100000
            RecentImpacts.forEach(hit => {
                var impactDistance = calcCrow(hit.lat, hit.lon, config.position.lat, config.position.lon)
                if (impactDistance < closestDistance) {
                    closest = hit
                }
            });
            var closestImpactDistance = calcCrow(closest.lat, closest.lon, config.position.lat, config.position.lon)
            var recentEmbed = new EmbedBuilder()
                .setColor(0xFF8000)
                .setTitle('Closeby Warning!')
                .setDescription(RecentImpacts.length + ' thunderbold has hit since the last warning with the closest ' + Math.round(closestImpactDistance, 2) + 'km away <t:' + Math.round(closest.time / 1000000000) + ':R> ')
                embeds.push(recentEmbed)
            RecentImpacts = []
        }

        if (embeds.length) {
            await user.send({ embeds: embeds }).catch(() => {
                console.log("User has DMs closed or has no mutual servers with the bot :(");
            });
        }

    }


}

var wsServerId = 1
var ws;
function NewWebSocket() {
    try {
        var wsServer = 'wss://ws' + wsServerId + '.blitzortung.org/'
        console.log('connecting to server %s', wsServerId)
        ws = new websocket.WebSocket(wsServer);
        ws.on('open', function () {
            console.log('socket connected')
            ws.send('{"a":767}');
        });
        ws.on('error', function () {
            console.log('socket errored');
            NewWebSocketServer()
            setTimeout(NewWebSocket, 1000);
        });
        ws.on('close', function () {
            console.log('socket disconnected')
            setTimeout(NewWebSocket, 1000);
        });
        ws.on('message', function message(data) {
            try {
                var dataObj = JSON.parse(decode(Buffer.from(data).toString()))
                DecodedDataManager(dataObj)
            } catch (error) {
                console.log(error)
            }
        });
    } catch (error) {
        NewWebSocketServer()
        setTimeout(NewWebSocket, 1000);
    }

};

function NewWebSocketServer() {
    if (wsServerId = 8) {
        wsServerId = 1
    } else {
        wsServerId += 1
    }
}

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
    var param = [name];
    var x = 256;
    o = x;
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