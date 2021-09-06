const ramEl = document.getElementById('ram');
const speed = document.getElementById('speed');
const history = document.getElementById('history');
const allChartDiv = document.getElementById('all_chart_div');
let chartLogs;
let totalRam;
let allLogs;

let drewSpeed = false;
let speedData;
let speedOptions;
let speedChart;

var ctx = document.getElementById('lineChart').getContext('2d');
var lineChart = new Chart(ctx, {
  type: 'line',
  responsive: false,
  maintainAspectRatio: false,
  data: { 
      labels: [],
      datasets: [{
          label: 'RAM',
          data: [],
          borderColor: "#fc4949",
          borderWidth: 3
      }]
  }
});
  
google.charts.load('current', {'packages': ['gauge']});

function drawSpeed() {
  speedData = google.visualization.arrayToDataTable([
    ['Label', 'Value'],
    ['RAM', 0]
  ]);

  const quarter = totalRam-totalRam / 4;
  
  speedOptions = {
    width: 200, height: 200,
    max: totalRam,
    redFrom: quarter + (totalRam-quarter) / 2, redTo: totalRam,
    yellowFrom: quarter, yellowTo: quarter + (totalRam-quarter),
    minorTicks: 5,
    animation: {
      "startup": true,
      "easing": "linear"
    }
  };
  
  speedChart = new google.visualization.Gauge(speed);
}

(function connect(){
    let socket = io.connect(socketUrl);

		socket.on('ramUsage', data => {

      chartLogs = data['chartLogs'];
      allLogs = data['allLogs'];
      data = data['logs'].reverse();

      if (data.length === 0) { return; };

      totalRam = data[0]['totalRam'];

      if (!drewSpeed) {drawSpeed(); drewSpeed = true;};
      speedData.setValue(0, 1, parseFloat(data[0]['freeRam']));
      speedChart.draw(speedData, speedOptions);

      lineChart.data.labels = [];
      lineChart.data.datasets[0].data = [];
      chartLogs.forEach(log => {
        lineChart.data.labels.push(log[0]);
        lineChart.data.datasets[0].data.push(log[1]);
      });
      lineChart.update();

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

async function downloadImage(URI, name) {
  const link = document.createElement('a')
  link.href = URI;
  link.download = `${name}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function saveLogs() {
  let res = await fetch('/saveLogs');
  let json = await res.json();

  var image = lineChart.toBase64Image();
  await downloadImage(image, json['filename']);
  alert(`logs saved on logs/${json['filename']}.json`);
}
