let ramEl = document.getElementById('ram');
let history = document.getElementById('history');

(function connect(){
    let socket = io.connect('http://localhost:5000');
		socket.on('ramUsage', data => {
      data = data.reverse();
			ramEl.innerHTML = `<a class='number'>${data[0]['freeRam']}</a>GB / <a class='number'>${data[0]['totalRam']}</a>GB`;
      var now = new Date();
      var time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
      var logs = document.createElement('div');
      var tableTitles = document.createElement('tr'); tableTitles.innerHTML = `<th>time</th><th>ram</th>`;
      logs.appendChild(tableTitles);
      data.forEach((ramInfo) => {
        var log = document.createElement('tr');
        log.innerHTML = `<td>${ramInfo['time']}</td><td>${ramInfo['freeRam']}GB</td>`;
        logs.appendChild(log);
      });
      history.innerHTML = logs.innerHTML;
		});
})();

async function saveLogs() {
  let res = await fetch('/saveLogs');
  let json = await res.json();
  alert(`logs saved on logs/${json['filename']}`);
}
