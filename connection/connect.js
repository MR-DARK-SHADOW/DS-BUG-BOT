const { default: fahriConnect, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto } = require('@adiwajshing/baileys')
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const figlet = require('figlet')
const path = require('path')
const { color, bgcolor, mycolor } = require('../nodeJS/lib/color')
const { smsg, isUrl, getBuffer, fetchJson, await, sleep } = require('../nodeJS/lib/functions')
const { groupResponse_Welcome, groupResponse_Remove, groupResponse_Promote, groupResponse_Demote } = require('./group.js')
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

async function startfahri() {
let { version, isLatest } = await fetchLatestBaileysVersion();
const { state, saveCreds } = await useMultiFileAuthState('./connection/SESSION');
const fahri = fahriConnect({
version,
logger: pino({
level: 'fatal'
}),
printQRInTerminal: true, // memunculkan qr di terminal
markOnlineOnConnect: true, // membuat wa bot of, true jika ingin selalu menyala
patchMessageBeforeSending: (message) => {
const requiresPatch = !!(
message.buttonsMessage ||
message.templateMessage ||
message.listMessage
);
if (requiresPatch) {
message = {
viewOnceMessage: {
message: {
messageContextInfo: {
deviceListMetadataVersion: 2,
deviceListMetadata: {},
},
...message,
},
},
};
}
return message;
},
getMessage: async (key) => {
if (store) {
const msg = await store.loadMessage(key.remoteJid, key.id)
return msg.message || undefined }
return { conversation: "hello, Saya Fahrii"
}},
browser: ['FahriOnlyWar', 'safari', '1.0.0'],
auth: state
})

fahri.ev.on("creds.update", saveCreds);

store.bind(fahri.ev)

console.log(color(figlet.textSync('FAHRI OFFC', {
font: 'Standard',
horizontalLayout: 'default',
vertivalLayout: 'default',
width: 80,
whitespaceBreak: false
}), 'red'))

fahri.ev.on('messages.upsert', async chatUpdate => {
try {
m = chatUpdate.messages[0]
if (!m.message) return
m.message = (Object.keys(m.message)[0] === 'ephemeralMessage') ? m.message.ephemeralMessage.message : m.message
if (m.key && m.key.remoteJid === 'status@broadcast') return
if (!fahri.public && !m.key.fromMe && chatUpdate.type === 'notify') return
if (m.key.id.startsWith('BAE5') && m.key.id.length === 16) return
m = smsg(fahri, m, store)
require('../nodeJS/fahri')(fahri, m, chatUpdate, store)
} catch (err) {
console.log(err)
}
})

fahri.decodeJid = (jid) => {
if (!jid) return jid
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {}
return decode.user && decode.server && decode.user + '@' + decode.server || jid
} else return jid
}

fahri.ev.on('contacts.update', update => {
for (let contact of update) {
let id = fahri.decodeJid(contact.id)
if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
}
})

fahri.setStatus = (status) => {
fahri.query({
tag: 'iq',
attrs: {
to: '@s.whatsapp.net',
type: 'set',
xmlns: 'status',
},
content: [{
tag: 'status',
attrs: {},
content: Buffer.from(status, 'utf-8')
}]
})
return status
}

fahri.sendText = (jid, text, quoted = '', options) => fahri.sendMessage(jid, { text: text, ...options }, { quoted })

fahri.public = true

fahri.serializeM = (m) => smsg(fahri, m, store)

fahri.ev.on('connection.update', (update) => {
console.log(update)
})

fahri.ev.process(
async (events) => {
if (events['presence.update']) {
await fahri.sendPresenceUpdate('available')
}
if (events['messages.upsert']) {
const upsert = events['messages.upsert']
for (let msg of upsert.messages) {
if (msg.key.remoteJid === 'status@broadcast') {
if (msg.message?.protocolMessage) return
await sleep(3000)
await fahri.readMessages([msg.key])
}
}
}

if (events['creds.update']) { 
await saveCreds()
}})

fahri.ev.on('group-participants.update', async (update) =>{
groupResponse_Demote(fahri, update)
groupResponse_Promote(fahri, update)
groupResponse_Welcome(fahri, update)
groupResponse_Remove(fahri, update)
console.log(update)
})

return fahri
}

startfahri()

let file = require.resolve(__filename)
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(chalk.yellowBright(`Update File Terbaru ${__filename}`))
delete require.cache[file]
require(file)
})
