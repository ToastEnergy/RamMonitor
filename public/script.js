let ramEl = document.getElementById('ram');
let history = document.getElementById('history');
let chartDiv = document.getElementById('chart_div');
let chartLogs = [['time', 'ram']];
let minValue = 0;

google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);

function drawChart(logs) {
  var data = google.visualization.arrayToDataTable(logs);
  var options = {
    pointSize: 10,
    vAxis: {minValue: minValue}
  };

  var chart = new google.visualization.AreaChart(chartDiv);
  chart.draw(data, options);
};

function updateMinValue() {
  var rams = chartLogs.filter(log => log[1])
  minValue = Math.min.apply(Math, rams);
};

(function connect(){
    let socket = io.connect(socketUrl);
		socket.on('ramUsage', data => {
      data = data.reverse();
			ramEl.innerHTML = `<a class='number'>${data[0]['freeRam']}</a>GB / <a class='number'>${data[0]['totalRam']}</a>GB`;
      var now = new Date();
      var time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
      chartLogs.push([time, parseFloat(data[0]['freeRam'])]);
      if (chartLogs.length >= 10) { chartLogs.splice(1, 1); };
      updateMinValue();
      drawChart(chartLogs);
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
