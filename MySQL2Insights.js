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
  "EVENT_NAME": "Cloud_Monitor",   // The name for the New Relic Insights events
  "ACCOUNT_ID": "1606862",          // Your New Relic account ID (can be found in URL http://rpm.newrelic.com/accounts/<account_id>)
  "INSERT_KEY_INSIGHTS": "REPLACE_THIS_WITH_INSIGHTS_INSERT_KEY",    // Currently not used
  "QUERY_KEY_INSIGHTS": "REPLACE_THIS_WITH_INSIGHTS_QUERY_KEY",     // Currently not used
};

// Setup the Insights insert options
//      Here for future use of the Insights Insert API
var insertOptions = {
    uri: 'https://insights-collector.newrelic.com/v1/accounts/' + config.ACCOUNT_ID + '/events',
    headers: {'X-Query-Key': config.INSERT_KEY_INSIGHTS},
    json: true,
    body: []
};

// Query the last timestamp from Insights
//      Here for future use of the Insights Query API
var maxTimeOpts = {
    uri: 'https://insights-api.newrelic.com/v1/accounts/' + config.ACCOUNT_ID + '/query',
    headers: {'Accept': 'application/json', 'X-Query-Key': config.QUERY_KEY_INSIGHTS},
    qs: {'nrql': 'SELECT max(timestamp) FROM ' + config.EVENT_NAME + ' SINCE 1 day ago'}
};

var pollingIntervalInSecs = 5;
var lastTimestamp = '';
var tableName = 'requests';         // MySQL table name to query
var maxRows = 200;                    // maximum rows to retrieve in single query.

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

/* use a function for the exact format desired... */
function ISODateString(d){
  function pad(n){return n<10 ? '0'+n : n}
  return d.getFullYear()+'-'
      + pad(d.getMonth()+1)+'-'
      + pad(d.getDate()) +' '
      + pad(d.getHours())+':'
      + pad(d.getMinutes())+':'
      + pad(d.getSeconds())
}

function readDatabase (connection) {
    var eventDataArr = [];

    if (lastTimestamp == '') {
    	isoDate = '';
    	};
    	
    var sqlSelect = "SELECT * FROM "+tableName+" WHERE timestamp > '"+isoDate+"' LIMIT "+maxRows;
    console.log("SQL is "+ sqlSelect);
 
    connection.query(sqlSelect, function (err, result, fields) {
        if (err) throw err;

        for (var i = 0; i < result.length; i++) {

            lastTimestamp = result[i].timestamp;
            isoDate = ISODateString(lastTimestamp);
            console.log("Timestamp value is "+isoDate);

            eventData = result[i];

            console.log("eventData is "+JSON.stringify(eventData));
            newrelic.recordCustomEvent(config.EVENT_NAME, eventData);
            
            /* For use with Insights Insert API (not currently used) 
            eventData["eventType"] = config.EVENT_NAME;
			eventDataArr.push(eventData);
			console.log("Event Data Array is "+JSON.stringify(eventDataArr));
			*/
	

        }
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
