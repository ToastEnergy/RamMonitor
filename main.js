const socketio = require('socket.io');
const rs =require('readline-sync');
const express = require('express');
const config = require('./config');
const path = require('path');
const os = require("os");
const fs = require('fs');
const app = express();

let host = config.host;
let port = config.port;
let protocol = config.protocol;

if (!host) {
  const nets = os.networkInterfaces();
  const results = Object.create(null);
  for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
              if (!results[name]) {
                  results[name] = [];
              }
              results[name].push(net.address);
         };
      };
  };

  const ips = {};
  let ipCount = 0;
  for (let protocol in results) {
    results[protocol].forEach(ip => {
      ipCount++;
      ips[ipCount] = ip;
    });
  };
  ipCount++;
  ips[ipCount] = 'localhost';
  ipCount++;
  ips[ipCount] = 'Other';

  let text = 'Where do you want the site to be hosted?\n';
  for (let ip in ips) { text += `\n${ip}) ${ips[ip]}`; };
  let passed = false;
  while (!passed) {
      var hostCount = rs.question(text + '\n');
      if (hostCount <= ipCount && hostCount > 0) {
        passed = true;
      }  else {
        console.log('Invalid number\n');
      }
  }
  host = ips[hostCount];

  if (host === 'Other') { host = rs.question('Specify custom host (without http)\n'); };
}

if (!port) { port = rs.question('Port:\n'); };
if (!protocol) {
  let passed = false;
  let protocolNumber;
  while (!passed) {
      protocolNumber = rs.question('Protocol:\n\n1) http\n2) https\n');
      if (['1', '2'].includes(protocolNumber)) {
        passed = true;
      }  else {
        console.log('Invalid number\n');
      };
  };
  protocol = {'1': 'http', '2': 'https'}[protocolNumber]
};

const socketUrl = `${protocol}://${host}:${port}`;

let ramStats = {};
let totalRam = os.totalmem();
let allLogs = [['time', 'ram']];
let chartLogs = [['time', 'ram']];
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
  res.render('index', {'socketUrl': socketUrl});
});

app.get('/chart', (req, res) => {
  res.render('chart', {'logs': allLogs.toString()});
});

app.get('/socketUrl', (req, res) => {
  res.send({'message': 'ok', 'socketUrl': socketUrl})
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
  console.log(`listening at ${socketUrl}`);
})

setInterval(function() {
  if(process.platform==='linux'){
    freeRam= Number.parseFloat(/MemAvailable:[ ]+(\d+)/.exec(fs.readFileSync('/proc/meminfo', 'utf8'))[1]*1024)
  }else{
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
    if (chartLogs.length >= 10) { chartLogs.splice(1, 1); };
    oldRam = ramStats['freeRam'] / 1024;
    logs.push({...ramStats});
    send = true;
  };
}, 3000)

const io = socketio(server);
io.on('connection', socket => {
  setInterval(function() {
    if (send) {
      io.sockets.emit('ramUsage', {logs: logs, chartLogs: chartLogs, allLogs: allLogs});
      send = false;
    };
  }, 10)
})
