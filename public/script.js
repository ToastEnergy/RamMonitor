let ramEl = document.getElementById('ram');
let history = document.getElementById('history');
let chartDiv = document.getElementById('chart_div');
let allChartDiv = document.getElementById('all_chart_div');
let chartLogs;
let allLogs;
let minValue = 0;

google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);

function drawChart(logs=null) {
  if (!logs) {return;};
  var data = google.visualization.arrayToDataTable(logs);
  var options = {
    curveType: 'function',
    pointSize: 5,
    vAxis: {minValue: minValue}
  };

  var chart = new google.visualization.LineChart(chartDiv);
  chart.draw(data, options);
};

function updateMinValue() {
  var chartCopy = [...chartLogs];
  chartCopy.splice(0,1);
  var rams = chartCopy.filter(log => log[1]);
  minValue = Math.min.apply(Math, rams);
};

(function connect(){
    let socket = io.connect(socketUrl);
		socket.on('ramUsage', data => {
      console.log(data)
      chartLogs = data['chartLogs'];
      allLogs = data['allLogs'];
      data = data['logs'].reverse();
      if(data.length===0){
        return
      }
      ramEl.innerHTML = `<a class='number'>${data[0]['freeRam']}</a>GB / <a class='number'>${data[0]['totalRam']}</a>GB`;
      var now = new Date();
      var time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
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
  let newLogs = [['time', 'ram']];
  if (allLogs.length <= 10) {
    newLogs = [...allLogs];
  } else {
    var d = Math.floor(allLogs.length/10)
    for (i = 1; i < allLogs.length; i=i+d) {
        newLogs.push(allLogs[i]);
      }
  }
  var data = google.visualization.arrayToDataTable(newLogs);
  var options = {
    width: 1920,
    height: 1080,
    curveType: 'function',
    vAxis: {minValue: minValue}
  };

  var chart = new google.visualization.LineChart(allChartDiv);
  chart.draw(data, options);
  var imgUri = chart.getImageURI((1920, 1080));
  window.open(imgUri);
  /* let res = await fetch('/saveLogs');
  let json = await res.json();
  alert(`logs saved on logs/${json['filename']}`); */
}
