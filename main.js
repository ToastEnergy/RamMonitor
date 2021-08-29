const socketio = require('socket.io')
const express = require('express');
const config = require('./config');
const path = require('path');
const os = require("os");
const fs = require('fs');
const app = express();

let ramStats = {};
let totalRam = os.totalmem();
let logs = [];
let freeRam;
let oldRam;

if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

app.engine('.html', require('ejs').__express);
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'html');

function checkTime(i) {
  if (i < 10) {i = "0" + i};
  return i;
}

app.get('/', (req, res) => {
  res.render('index');
})

app.get('/saveLogs', (req, res) => {
  var now = new Date();
  let h = now.getHours();
  let m = now.getMinutes();
  let s = now.getSeconds();
  let y = now.getFullYear();
  let d = now.getDate();
  let mo = now.getMonth();
  mo = checkTime(mo++);
  m = checkTime(m);
  s = checkTime(s);
  d = checkTime(d);
  h = checkTime(h);
  let filename = `${d}-${mo}-${y}-${h}-${m}-${s}.json`
  let data = JSON.stringify(logs, null, 2);
  fs.writeFileSync(path.resolve(__dirname, `./logs/${filename}`), data);
  res.send({message: 'ok', filename: filename})
});

const server = app.listen(config.port, () => {
  console.log(`listening at http://localhost:${config.port}`)
})

const io = socketio(server);
io.on('connection', socket => {
    setInterval(function() {
      freeRam = os.freemem();
      usedRam = totalRam - freeRam;
      ramStats['freeRam'] = Number.parseFloat(usedRam / 1024 / 1024 / 1024).toFixed(2);
      ramStats['totalRam'] = Number.parseFloat(totalRam / 1024 / 1024 / 1024).toFixed(2);
      if (ramStats['freeRam'] != oldRam) {
        var now = new Date();
        ramStats['time'] = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
        oldRam = ramStats['freeRam'];
        logs.push({...ramStats});
        io.sockets.emit('ramUsage', logs);
      }
    }, 2000)
})
