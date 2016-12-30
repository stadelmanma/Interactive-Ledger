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
            {column_name: 'effective_date', column_nickname: 'Date', data_type: 'date', order_index: 100},
            {column_name: 'description', column_nickname: 'Description', data_type: 'text', order_index: 150},
            {column_name: 'amount', column_nickname: 'Amount', data_type: 'monetary', order_index: 200},
            {column_name: 'matching_reciept', column_nickname: 'Validated', data_type: 'info', order_index: 250},
            //{column_name: 'account', column_nickname: 'Account', data_type: 'info', order_index: 300},
            //{column_name: 'balance', column_nickname: 'Balance', data_type: 'float', order_index: 999},
            {column_name: 'category', column_nickname: 'Category', data_type: 'info', order_index: 350},
            {column_name: 'subcategory', column_nickname: 'Subcategory', data_type: 'text', order_index: 400},
            {column_name: 'comments', column_nickname: 'Comments', data_type: 'text', order_index: 450}
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
                datum = new Date(datum).yyyymmdd();
            }
            else if (col_names[index] === 'amount') {
                datum = Number.parse(datum);
            }
            else if (col_names[index] === 'balance') {
                datum = Number.parse(datum);
            }
            else if (col_names[index] === 'matching_reciept') {
                datum = datum.toUpperCase().trim();
                datum = datum === 'OK' ? 'YES' : 'NO';
            }
            obj[col_names[index]] = datum;

        });
        //
        this[i] = obj;
    }
    //
    // outputs a totals cell
    function output_totals_cells(row, rowSpan, total) {
        var style = {
                textAlign: 'center',
                verticalAlign: 'middle',
                backgroundColor: 'white',
                color: 'rgb(0,0,0)'
            },
            cell = document.createElementWithAttr('TD',{rowSpan: rowSpan, style: style}),
            fmt = '%value%';
        //
        if (total < 0) {
            fmt = '(%value%)';
            cell.style.color = 'rgb(240,0,0)';
        }
        //
        cell = cell.cloneNode();
        cell.rowSpan = rowSpan + 1;
        row.appendChild(cell)
        process_data_type(total, 'monetary', cell, {add_commas: true, format_str: fmt});
        //cell.childNodes[1].textContent = fmt.format(Math.round10(total, 2, true));
    }
    //
    // generates weekly categorial sums
    function calculateWeeklySums(table, tableRows) {
        var startDate, endDate, testDate,
            totals = {
                walmart: 0, gas: 0, 'misc.': 0, deposit: 0,
                withdrawal: 0, budgeted: 0, discover: 0
            },
            overallTotal = 0,
            totalDeficit = 0,
            cell = document.createElement('TH'), rowSpan,
            i, category, week;
        //
        // adding two new totals cells to the table header
        cell.textContent = 'Week Total:'
        tableRows[0].appendChild(cell);
        cell = cell.cloneNode();
        cell.textContent = 'Total Deficit:'
        tableRows[0].appendChild(cell);
        cell = cell.cloneNode();
        cell.textContent = 'Category Totals:'
        tableRows[0].appendChild(cell);
        //
        // setting initial start and end dates
        startDate = new Date(tableRows[1].dataset.effective_date);
        startDate.setDate(startDate.getDate() - startDate.getDay() - 7);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        //
        // stepping through rows and summing data
        week = 1;
        rowSpan = 0;
        cell = document.createElementWithAttr('TD',
            {style: {textAlign: 'center', verticalAlign: 'middle', backgroundColor: 'white'}});
        for (i = 1; i < tableRows.length; i++) {
            testDate = new Date(tableRows[i].dataset.effective_date);
            if (testDate <= endDate) {
                // incrementing totals
                category = tableRows[i].dataset.category.toLowerCase().trim();
                totals[category] += Number(tableRows[i].dataset.amount);
                rowSpan += 1;
            }
            else {
                //
                // updating dates
                startDate.setDate(startDate.getDate() + 7);
                endDate.setDate(endDate.getDate() + 7);
                if (rowSpan == 0) { continue;}
                //
                // incrementing overall totals
                overallTotal = totals.walmart;
                overallTotal += totals.gas;
                overallTotal += totals['misc.'];
                totalDeficit += overallTotal + 200;
                //
                // outputting totals cells
                output_totals_cells(tableRows[i - rowSpan - 1], rowSpan, overallTotal);
                output_totals_cells(tableRows[i - rowSpan - 1], rowSpan, totalDeficit);
                //
                // resetting values
                totals = {
                    walmart: 0, gas: 0, 'misc.': 0, deposit: 0,
                    withdrawal: 0, budgeted: 0, discover: 0
                }
                rowSpan = 0;
                week += 1;
            }
        }
    }
    //
    // builds an HTML table of ledger data
    function buildLedgerTable(data) {
        var table_args = {
                data_arr: data,
                col_meta_data: getConstant('META_DATA'),
                table_output_id: 'table-div',
                row_id_prefix: 'ledger-',
                no_page_nav: true,
                head_row_args: {sortable: false},
                page_nav_args: {}
            },
            table = make_standard_table(table_args),
            tableRows = table.querySelectorAll('TR'),
            amount, cell, i;
        //
        // styling the amount cell for negative numbers
        for (i = 1; i < tableRows.length; i++) {
            amount = Number(tableRows[i].dataset.amount);
            cell = tableRows[i].querySelector('[id*=amount]');
            //
            if (amount < 0) {
                amount = cell.childNodes[1].textContent;
                cell.childNodes[1].textContent = '({})'.format(amount);
                cell.style.color = 'rgb(245,0,0)';
            }
            else {
                cell = tableRows[i].querySelector('[id*=effective_date]');
                cell.style.fontWeight = 'bold';
                cell = tableRows[i].querySelector('[id*=description]');
                cell.style.fontWeight = 'bold';
                cell = tableRows[i].querySelector('[id*=amount]');
                cell.style.fontWeight = 'bold';
            }
        }
        //
        // generating weekly sums that span rows
        calculateWeeklySums(table, tableRows)
        //
        document.getElementById('table-div').safeAppendChild(table);
    }
    //
    // processes the CSV data into an array of objects
    function processTabDelimData(data) {
        var cols = null;
        //
        // converting data string into an array
        data = data.replace(/(^.*);/, '');
        data = data.replace(/\n$/, '');
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
        //
        // processing data rows
        data.forEach(processRow.bind(data, cols));
        buildLedgerTable(data);
    }
    //
    // returning interface
    return {
        getConstant: getConstant,
        loadData: function(filePath) { loadData(filePath, processTabDelimData);}
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
