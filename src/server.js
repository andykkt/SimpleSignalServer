"use strict";

let WebSocketServer = require('ws').Server
let port = 1338
let wsServer = new WebSocketServer({ port: port })
const multer = require('multer')
const ip = require('ip')
var memCache = {}
console.log('websocket server start.' + ' ipaddress = ' + ip.address() + ' port = ' + port)

const express = require('express')
const app = express()
const httpPort = process.env.PORT || 80
const desktopRouter = require('./routers/desktop')


wsServer.on('connection', function (ws) {
    console.log('-- websocket connected --')

    ws.on('message', function (message) {
        const json = JSON.parse(message.toString())
        const type = json.type
        const senderID = json.senderID
        const targetID = json.targetID

        console.log("type ===> " + type)

        if (type == "registerPublisher") {
            console.log("publisher registered ---> " + senderID)
            memCache[senderID] = {
                "ws": ws,
                "clients": {},
            }

        } else if (type == "subscribe") {
            console.log("subscribe to " + targetID + " from " + senderID)
            if (targetID in memCache) {
                memCache[targetID].clients[senderID] = {
                    "ws": ws
                }
                sendMessage(wsServer.clients, memCache[targetID].ws, JSON.stringify("requestScreenUpload"))

            } else {
                console.log("failed - no desktop for id: " + targetID + "exists.")
            }

        } else if (type == "connect") {
            console.log("connect to " + targetID)
            if (targetID in memCache) {
                let desktop = memCache[targetID]
                sendMessage(wsServer.clients, desktop.ws, message)
            } else {
                console.log("failed - no desktop for id: " + targetID + "exists.")
            }

        } else if (type == "candidate" || type == "sdp") {
            console.log(type + "from sender: " + json.senderID + "  to: " + json.targetID)
            if (senderID in memCache) {
                for (var key in memCache[json.senderID].clients) {
                    sendMessage(wsServer.clients,
                        memCache[json.senderID].clients[key].ws,
                        message)
                }
                return
            }
            if (targetID in memCache) {
                let desktop = memCache[targetID]
                sendMessage(wsServer.clients, desktop.ws, message)
            }
        }
    })

})

function sendMessage(clients, ws, message) {
    clients.forEach(function each(client) {
        if (isSame(ws, client)) {
            client.send(message)
            return
        }
    })
}

function isSame(ws1, ws2) {
    // -- compare object --
    return (ws1 === ws2)
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './src/uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now())
    }
})

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(csv)$/)) {
            return cb(new Error('Please upload a csv file'))
        }

        cb(undefined, true)
    }
})

app.use(express.json())
app.use(desktopRouter)
app.listen(httpPort, () => {
    console.log('Http server is up on port ' + httpPort)
})




