var newrelic = require('newrelic');
var mysql = require('mysql');
var process = require('process');
var request = require('request');

var con = mysql.createConnection({
  host: "localhost",
  user: "myuser",
  password: "mypass",
  database: "Cloud_Monitor"
});

// Global variables we'll need
var config = {
  "EVENT_NAME": "Cloud_Monitor",
  "ACCOUNT_ID": "650703",   // Your New Relic account ID (can be found in URL http://rpm.newrelic.com/accounts/<account_id>)
  "INSERT_KEY_INSIGHTS": "2upxi_cjv_6FpfljxxT3npJEfBFBUx0v",
  "QUERY_KEY_INSIGHTS": "jPbIpgk470El-z6Rvdl8dRgxl9huQKhT",
};

// Setup the Insights insert options
//      This is here for future use of Insights REST API instead of Agent API
var insertOptions = {
    uri: 'https://insights-collector.newrelic.com/v1/accounts/' + config.ACCOUNT_ID + '/events',
    headers: {'X-Query-Key': config.INSERT_KEY_INSIGHTS},
    json: true,
    body: []
};

// Query the last timestamp from Insights
var maxTimeOpts = {
    uri: 'https://insights-api.newrelic.com/v1/accounts/' + config.ACCOUNT_ID + '/query',
    headers: {'Accept': 'application/json', 'X-Query-Key': config.QUERY_KEY_INSIGHTS},
    qs: {'nrql': 'SELECT max(timestamp) FROM ' + config.EVENT_NAME + ' SINCE 1 day ago'}
};

var pollingIntervalInSecs = 15;
var lastTimestamp = new Date(0);
console.log("Initial date set to "+lastTimestamp);
var tableName = 'requests';         // MySQL table name to query
var maxRows = 200;                    // maximum rows to retrieve in single query.
var sqlSelect = "SELECT * FROM "+tableName;

// Modify the eventData object with the attribute names you want to send to Insights
// Then map the data from the table row into the object
// Note: the event JSON must be flat. Not multidimensional. 
var eventData = {};

// The getLastTimeStamp function will retrieve the last timestamp or date field from the New Relic Insights events
//  It is there to handle a restart of this utility when it stops
//  The prototype uses a UTC date format, this may need to be changed to match the timestamp format from the database
function getLastTimeStamp(callback) {
        // console.log("Max Time Opts is "+JSON.stringify(maxTimeOpts));
        request(maxTimeOpts, function (error, response, body){
        if (!error && response.statusCode == 200) {
            var results = JSON.parse(body);

            // Convert epoch data to UTC format
            var maxTimestamp = results.results[0].max;
            
            if (maxTimestamp != 0) {
                lastTimestamp = maxTimestamp;
                sqlSelect += ' where timestamp > '+lastTimestamp+" LIMIT "+maxRows;
            } else {
                sqlSelect += " where timestamp >  LIMIT "+maxRows;
            }

            console.log("Max timestamp is "+maxTimestamp);

            callback();
        } else {
            throw error;
        }
    })
}
    
function openDatabase () {
    console.log("open Database");
    con.connect(function(err) {
    if (err) throw err;
    });
    return con;
}

function readDatabase (connection) {
    var eventDataArr = [];
    console.log("SQL is "+ sqlSelect);
 
    connection.query(sqlSelect, function (err, result, fields) {
        if (err) throw err;

        for (var i = 0; i < result.length; i++) {

            lastTimestamp = result[i].timestamp
            eventData = result[i];

            console.log("eventData is "+JSON.stringify(eventData));
            newrelic.recordCustomEvent(config.EVENT_NAME, eventData);

         //   eventDataArr.push(eventData);

        }

        // console.log("Event Data Arr is "+JSON.stringify(eventDataArr));
        console.log("Last timestamp is "+lastTimestamp)
    });
}

function run() {
    console.log("Run");
    getLastTimeStamp(function (){
        console.log("Timestamp is "+lastTimestamp);
        var conn = openDatabase();
        setInterval(function () {
            readDatabase(conn);
            }, pollingIntervalInSecs*1000);  // Convert polling interval to ms
    });

};


run();
