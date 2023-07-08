// DI LARANG MENJUAL SC NYA KEMBALI!! //
const fs = require('fs')
const chalk = require('chalk')

global.owner = ['6281225179060'] // ganti nomor wa lu
global.bugrup = ['6281225179060'] // ganti nomor wa lu
global.packname = 'Fahrii'
global.author = 'Fahrii Offc'

let file = require.resolve(__filename)
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(chalk.yellowBright(`Update File Terbaru ${__filename}`))
delete require.cache[file]
require(file)
})

// SILAHKAN SETTING SESUAI PERINTAH //