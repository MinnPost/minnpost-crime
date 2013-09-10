
var path = require('path');
var fs = require('fs');
var http = require('http');
var celeri = require('celeri');

// Paths
var dataSourcePath = path.join(__dirname, '../data/crime/mpls-monthly-reports.json');
var destDirPath = path.join(__dirname, '../data/crime/mpls-monthly-reports');

// Data
var dataSource = require(dataSourcePath);
var dataProcessed = [];

// Make directory
try {
  fs.mkdirSync(destDirPath);
}
catch (err) {
  // Already there
}

// Go through data
check();
dataSource.forEach(function(o, i) {
  var ext = o.url.split('.')[o.url.split('.').length - 1].toLowerCase();
  var dest = path.join(destDirPath,
    (o.year + '-' + ((o.month < 10) ? '0' + o.month : o.month) +
    '.' + ext));
  var file = fs.createWriteStream(dest);
  var request = http.get(o.url, function(response) {
    response.pipe(file);

    response.on('end', function() {
      file.close();
      dataProcessed.push(o.url);
      check();
    });
  });
});

// Check if done
function check() {
  celeri.progress('Downloading files: ',
    (dataProcessed.length / dataSource.length * 100).toFixed(2));
}