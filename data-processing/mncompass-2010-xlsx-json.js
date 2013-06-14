/**
 * This is a script to convert the MN Compass demographic data in MS Excel
 * format into json format to be used in other applications.
 * 
 * Input (a CSV version of the xlsx)
 * data/demographics/2010/MNC_2011_NeighborhoodProfiles_AllData_NoSuppressionR2.csv
 * 
 * Output:
 * data/demographics/2010/twin-cities-neighborhood-demographics-2010.json
 *
 * Due to the amount of columns and data in the column headings
 * we actually make a key system so that we do not repeat so much data.
 */
var path = require('path');
var fs = require('fs');
var office = require('csv');
var _ = require('underscore');


// Top level variables
var input = 'data/demographics/2010/MNC_2011_NeighborhoodProfiles_AllData_NoSuppressionR2.csv';
var input_path = path.resolve(__dirname, '../' + input);
var output = 'data/demographics/2010/twin-cities-neighborhood-demographics-2010.json';
var output_path = path.resolve(__dirname, '../' + output);
var cData = [];
var cHeaders = [];
var fData = {};
var fMeta = {};
var dataStartRow = 4;
var columnDataStart = 5;
var nTranslations = {
  'cedar_isles___dean': 'cedar_isles_dean',
  'humboldt_industrial': 'humboldt_industrial_area',
  'prospect_park_east_river_road': 'prospect_park_east_river',
  'steven_s_square_loring_heights': 'stevens_square_loring_heights'
};


// Make ID from headings
function makeID(name, type, number, year) {
  id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  id += (type) ? ('-' + type.toLowerCase().replace(/[^a-z0-9]/g, '_')) : '';
  id += (number) ? ('-' + number.toLowerCase().replace(/[^a-z0-9]/g, '_')) : '';
  id += (year) ? ('-' + year) : '';
  return id;
}

// Make place_id
function makePlaceID(neighborhood, community, city) {
  var id = '';
  var n;

  id = city.toLowerCase().replace(/[^a-z0-9]/g, '_')
      .replace('__', '_').replace('__', '_');
  id += '_';
      
  if (!neighborhood) {
    id += 'community_' + community.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
  else {
    n = neighborhood.toLowerCase().replace(/[^a-z0-9]/g, '_')
      .replace('__', '_').replace('__', '_');
    id += (!_.isUndefined(nTranslations[n])) ? nTranslations[n] : n;
  }
  
  return id;
}

// Handle data values
function makeValue(data, parseNum) {
  data = (_.isString(data) && data == '-') ? null : data;
  data = (_.isString(data) && data.toLowerCase() == 'x') ? null : data;
  
  if (parseNum && data !== null) {
    data = parseFloat(data.replace(/[^\d\.\-]/g, ''));
  }
  
  return data;
}

// Make type smaller for smaller filesize
function makeType(type) {
  type = (type.toLowerCase() === 'number') ? '#' : type;
  type = (type.toLowerCase() === 'percent') ? '%' : type;
  return type;
}

// Make column headers and metadata
function makeHeaders() {
  _.each(cData[dataStartRow - 1], function(c, i) {
    var columnMetaData = {};
    
    // Make key.  Use string so not to confuse
    // with an array
    columnMetaData.key = 'k-' + i;
    
    columnMetaData.name = cData[3][i];
    if (i >= columnDataStart) {
      columnMetaData.id = makeID(cData[3][i], cData[0][i], cData[1][i], cData[2][i]);
      columnMetaData.data = cData[0][i];
      columnMetaData.type = makeType(cData[1][i]);
      columnMetaData.year = cData[2][i];
    }
    else {
      columnMetaData.id = makeID(cData[3][i]);
    }
    
    cHeaders.push(columnMetaData);
  });
}

// Transform headers
function makeFinalHeaders() {
  _.each(cHeaders, function(c) {
    fMeta[c.key] = c;
  });
}

// Save out data
function saveNewFile() {
  var output = {
    data: fData,
    meta: fMeta
  };
      
  console.log('Rows: ' + _.size(fData));
  console.log('Columns: ' + _.size(cHeaders));

  fs.writeFile(output_path, JSON.stringify(output), function(error) {
    if (error) {
      console.log('Error saving: ' + error);
    } 
    else {
      console.log('JSON saved.');
    }
  }); 
}

// Process data once we have the header data
function processCSV() {
  var csvProcessor = csv()
    .from.stream(fs.createReadStream(input_path))
    .transform(function(row) {
      // Trim data and only use rows that are not empty
      row = _.map(row, function(column, i) {
        column = (_.isString(column)) ? column.trim() : column;
        column = makeValue(column, (i >= columnDataStart));
        return column;
      });
      
      if (row[columnDataStart] !== '') {
        return row;
      }
    })
    .on('record', function(row, index) {
      var processedRow = {};
      
      if (index >= dataStartRow && row[0] !== '') {
        _.each(cHeaders, function(h, i) {
          processedRow[h.key] = row[i];
        });
      
        // Make place/neighborhood id
        processedRow.placeID = makePlaceID(row[1], row[2], row[4]);
        
        fData[processedRow.placeID] = processedRow;
      }
    })
    .on('end', function(count) {
      makeFinalHeaders();
      saveNewFile();
    })
    .on('error', function(error) {
      console.log('Error: ' + error.message);
    });
}

// The first pass we use to make column names
function processCSVHeaders() {
  var csvProcessor = csv()
    .from.stream(fs.createReadStream(input_path))
    .transform(function(row) {
      // Trim data and only use rows that are not empty
      row = _.map(row, function(column) {
        column = (_.isString(column)) ? column.trim() : column;
        return column;
      });
      
      if (row[columnDataStart] !== '') {
        return row;
      }
    })
    .on('record', function(row, index) {
      if (index < dataStartRow) {
        cData.push(row);
      }
    })
    .on('end', function(count) {
      makeHeaders();
      processCSV();
    })
    .on('error', function(error) {
      console.log('Error: ' + error.message);
    });
}

processCSVHeaders();