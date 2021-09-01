let ramEl = document.getElementById('ram');
let history = document.getElementById('history');
let chartDiv = document.getElementById('chart_div');
let allChartDiv = document.getElementById('all_chart_div');
let chartLogs;
let allLogs;

google.charts.load('current', {'packages':['corechart']});

function drawChart(logs=null, options=null, div=chartDiv) {
  if (!logs) {return;};
  if (!options) {
    options = {
      curveType: 'function',
      pointSize: 5
    };
  } 
  var data = google.visualization.arrayToDataTable(logs);
  var chart = new google.visualization.LineChart(div);
  chart.draw(data, options);
  return chart;
};

(function connect(){
    let socket = io.connect(socketUrl);
		socket.on('ramUsage', data => {
      chartLogs = data['chartLogs'];
      allLogs = data['allLogs'];
      data = data['logs'].reverse();
      if(data.length===0){
        return
      }
      ramEl.innerHTML = `<a class='number'>${data[0]['freeRam']}</a>GB / <a class='number'>${data[0]['totalRam']}</a>GB`;
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

  let newLogs = [['time', 'ram']];
  if (allLogs.length <= 10) {
    newLogs = [...allLogs];
  } else {
    var d = Math.floor(allLogs.length/7)
    for (i = 1; i < allLogs.length; i=i+d) {
        newLogs.push(allLogs[i]);
      }
  }
  var options = {
    width: 1920,
    height: 1080,
    curveType: 'function'
  };

  allChartDiv.style.display = 'unset';
  var chart = drawChart(newLogs, options, allChartDiv);
  var imgUri = chart.getImageURI((1920, 1080));
  downloadImage(imgUri, json['filename'])
  allChartDiv.style.display = 'none';

  alert(`logs saved on logs/${json['filename']}.json`);
}
