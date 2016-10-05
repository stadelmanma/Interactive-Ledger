/*eslint quotes: ["error", "single"]*/
/*eslint-disable global-strict */
/*eslint-disable camelcase */
'use strict';
///////////////////////////////////////////////////////////////////////////////
///////////////// Holds specific code needed to load data and /////////////////
///////////////// generate the ledger tables                  /////////////////
///////////////////////////////////////////////////////////////////////////////
/* Ideas
Integrate this with the some mysql stuff to take advantage of SQL code instead
of writing my own code to filter and sort. I could use temporary tables that
get generated on the fly instead of hard-coded since then I wouldn't need to
create them on which-ever system I want to use. However, that also forces a
given system to have a working local sever for this code to work, so maybe not.
It will just come down to how much "duplicate" code I'll need to write.

Maybe there is some Node functionality I can use? Since this code is entirely locale.
*/
// defining required constants for the ledger
var LEDGER = (function() {
    var CONSTANTS = {
        META_DATA: [
            {column_name: 'account', column_nickname: 'Account', data_type: '', order_index: 300},
            {column_name: 'amount', column_nickname: 'Amount', data_type: '', order_index: 200},
            //{column_name: 'balance', column_nickname: 'Balance', data_type: '', order_index: 999},
            {column_name: 'category', column_nickname: 'Cataegory', data_type: '', order_index: 350},
            {column_name: 'comments', column_nickname: 'Comments', data_type: '', order_index: 400},
            {column_name: 'description', column_nickname: 'Description', data_type: '', order_index: 150},
            {column_name: 'effective_date', column_nickname: 'Date', data_type: '', order_index: 100},
            {column_name: 'matching_reciept', column_nickname: 'Validated', data_type: '', order_index: 250}
        ]
    };
    //
    function getConstant(key) {
        //
        if (!CONSTANTS.hasOwnProperty(key)) {
            return null;
        }
        //
        var copy = Object.clone(CONSTANTS[key]);
        //
        return copy;
    }
    //
    // loads the CSV formatted financial data
    function loadData(filePath, callback) {
        //
        var xmlhttp = new XMLHttpRequest();
        //
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                callback(xmlhttp.responseText);
            }
        };
        xmlhttp.open('GET', filePath, true);
        xmlhttp.send();
        return;
    }
    //
    // splits a row and converts values
    function processRow(col_names, row, i) {
        var obj = {};
        row = row.split('\t');
        //
        row.forEach(function(datum, index) {
            datum = datum.replace(/^"|"$/g, '');
            if (col_names[index] === 'effective_date') {
                datum = new Date(datum);
            }
            else if (col_names[index] === 'amount') {
                datum = Number.parse(datum);
            }
            else if (col_names[index] === 'balance') {
                datum = Number.parse(datum);
            }
            obj[col_names[index]] = datum;
        });
        //
        this[i] = obj;
    }
    //
    // processes the CSV data into an array of objects
    function processTabDelimData(data) {
        var cols = null;
        //
        // converting data string into an array
        data = data.replace(/(^.*);/, '');
        data = data.split(/\n/g);
        //
        // getting the column headers
        cols = data.shift();
        cols = cols.split('\t');
        cols.forEach(function(col, i) {
            col = col.toLowerCase();
            col = col.trim();
            col = col.replace(/ +/g, '_');
            this[i] = col;
        }, cols);
        console.log(cols);
        //
        // processing data rows
        data.forEach(processRow.bind(data, cols));
        console.log(data);
    }
    //
    // returning interface
    return {
        getConstant: getConstant,
        loadData: function(filePath) { loadData(filePath, processTabDelimData);},
        processTabDelimData: processTabDelimData
    };
}());
//
var module = module || {};
(function() {
    // setting exports for nodejs
    module.exports = {};
    for (var prop in LEDGER) {
        module.exports[prop] = LEDGER[prop];
    }
}());
