# database2Insights

## Description

## Installation

1. Unzip or install the repo
2. Run ```NPM INSTALL```
3. Edit the newrelic.js,
    * Add your New Relic license key
4. Edit the MySQL2Insights.js file changing the ```config``` settings.
    * Most important is the New Relic Account ID which is the 7-digit number in the URL when you access New Relic (e.g. https://rpm.newrelic.com/accounts/<your_account_id>.
5. Run the script ```node MySQL2Insights.js``` (no, there's no fancy stuff in there yet).
    
## Notes: 

  The script is designed to run in a loop, with a delay interval set with the, pollingIntervalInSecs variable, The default is set to 30 seconds. 
 
  This script has little if any error handling and there is still some functionality I am trying to add to make it handle restart conditions and to avoid reading records that have already been read. That additional functionality will check timestamps of records from Insights and then read records from the MySQL database with dates newer than the most recent event in Insights. In order to do that we need to identify an appropriate timestamp value to compare. There is a version of the script, MySQL2Insights_with_Timestamp.js, that has some of that logic  in place but that is untested. 
