var newrelic = require('newrelic');
var mysql = require('mysql');
var process = require('process');
var request = require('request');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "MyNewPass",
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

var pollingIntervalInSecs = 5;
var lastTimestamp = new Date(0);
var tableName = 'requests';         // MySQL table name to query
var maxRows = 200;                    // maximum rows to retrieve in single query.
var sqlSelect = "SELECT * FROM "+tableName+" LIMIT "+maxRows;

// Modify the eventData object with the attribute names you want to send to Insights
// Then map the data from the table row into the object
// Note: the event JSON must be flat. Not multidimensional. 
var eventData = {};
    
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

            eventDataArr.push(eventData);

        }

        // console.log("Event Data Arr is "+JSON.stringify(eventDataArr));
    });
}

function run() {
    console.log("Run");
    var conn = openDatabase();
    setInterval(function () {
        readDatabase(conn);
        }, pollingIntervalInSecs*1000);  // Convert polling interval to ms

};


run();
