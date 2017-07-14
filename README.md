# database2Insights

## Description
A Node.js script that reads a MySQL database and sends the rows as customer Events to New Relic Insights using the Node.js Agent API. 
  
## Installation

1. Unzip or install the repo
2. Run ```NPM INSTALL```
3. Edit the newrelic.js,
   * Add your New Relic license key
4. Edit the MySQL2Insights.js file:
   * changing the New Relic Account ID in the ```config``` settings. The New Relic Account ID which is the 7-digit number in the URL when you access New Relic (e.g. https://rpm.newrelic.com/accounts/<your_account_id>.  
   * Edit the database connection information to point to your database,  
         ```
           var con = mysql.createConnection({ 
               host: "localhost",
               user: "root",
               password: "mypwd",  
               database: "db_name"
               });
         ```
5. Run the script ```node MySQL2Insights.js``` (no, there's no fancy stuff in there yet).
    
## Notes: 

  The script is setup to run in a loop, with a delay interval set with the _pollingIntervalInSecs_ variable, The default is set to 30 seconds. 
 
  This script has little if any error handling and there is still some functionality I am trying to add to make it handle restart conditions and to avoid reading records that have already been read. That additional functionality will check timestamps of records from Insights and then read records from the MySQL database with dates newer than the most recent event in Insights. In order to do that we need to identify an appropriate timestamp value to compare. There is a version of the script, MySQL2Insights_with_Timestamp.js, that has some of that logic  in place but that is untested. 
