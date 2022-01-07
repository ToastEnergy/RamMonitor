const socketio = require('socket.io');
const rs =require('readline-sync');
const express = require('express');
const config = require('./config');
const path = require('path');
const os = require("os");
const fs = require('fs');
const app = express();

let port = config.port;
if (!port) { 
  let end = false;
  while (!end) {
    port = rs.question('Port:\n'); 
    if (!parseInt(port)) {
      console.log('invalid port number');
    } else {
      if (port > 0 && port < 65535) {
        end = true;
      } else {
        console.log('invalid port number');
      }
    }
  }
};

let ramStats = {};
let totalRam = os.totalmem();
let allLogs = [];
let chartLogs = [];
let logs = [];
let freeRam;
let oldRam;
let send = true;

if (!fs.existsSync('./logs')) { fs.mkdirSync('./logs'); }

app.engine('.html', require('ejs').__express);
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'html');

function checkTime(i) {
  if (i < 10) {i = "0" + i};
  return i;
};

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/chart', (req, res) => {
  res.render('chart', {'logs': allLogs.toString()});
});

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
  let filename = `${d}-${mo}-${y}-${h}-${m}-${s}`
  let data = JSON.stringify(logs, null, 2);
  fs.writeFileSync(path.resolve(__dirname, `./logs/${filename},json`), data);
  res.send({message: 'ok', filename: filename})
});

const server = app.listen(port, () => {
  console.log(`listening at http://localhost:` + port);
})

setInterval(function() {
  if (process.platform==='linux') {
    freeRam= Number.parseFloat(/MemAvailable:[ ]+(\d+)/.exec(fs.readFileSync('/proc/meminfo', 'utf8'))[1]*1024)
  } else {
    freeRam = os.freemem();
  }
  usedRam = totalRam - freeRam;
  ramStats['freeRam'] = Number.parseFloat(usedRam / 1024 / 1024 / 1024).toFixed(2);
  ramStats['totalRam'] = Number.parseFloat(totalRam / 1024 / 1024 / 1024).toFixed(2);
  ramStats['raw'] = usedRam;
  if (ramStats['freeRam'] != oldRam) {
    var now = new Date();
    ramStats['time'] = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
    chartLogs.push([ramStats['time'], parseFloat(ramStats['freeRam'])]);
    allLogs.push([ramStats['time'], parseFloat(ramStats['freeRam'])]);
    if (chartLogs.length >= 10) { chartLogs.splice(0, 1); };
    oldRam = ramStats['freeRam'] / 1024;
    logs.push({...ramStats});
    send = true;
  };
}, 2000)

const io = socketio(server);
io.on('connection', socket => {
  setInterval(function() {
    if (send) {
      io.sockets.emit('ramUsage', {logs: logs, chartLogs: chartLogs, allLogs: allLogs});
      send = false;
    };
  }, 10)
})
