////////////////////////////////////////////////////////////////////////////////
/////////// This file holds various javascript functions that are      /////////
/////////// associated with updating or creating new DOM elements      /////////
/////////// loosely associated with table generation                   /////////
////////////////////////////////////////////////////////////////////////////////
"use strict";
//
// sets up the suggestion pge
function leave_suggestion_page() {
    AFW_HUB.Utilities.add_class('hidden-elm','head');
    //
    // setting up page
    var main_container = document.getElementById('main-container');
    main_container.removeAll();
    var label = document.createElement('LABEL');
    label.textContent = 'Suggestion:';
    //
    var textarea = document.createElementWithAttr('TEXTAREA',{'id':'description'});
    textarea.name = 'description';
    textarea.rows = 4;
    textarea.cols = 60;
    //
    var button = document.createElement('BUTTON');
    button.addEventListener('click',submit_suggestion);
    button.textContent = 'Submit';
    //
    main_container.appendChild(label);
    main_container.appendChild(document.createElement('BR'));
    main_container.appendChild(textarea);
    main_container.appendChild(document.createElement('BR'));
    main_container.appendChild(button);

}
//
// this generates the popup window to leave a suggestion
function enter_suggestion() {
    //
    window.open('entry_page.php?tab=leave_suggestion', 'suggestionWindow',
                'height=150,width=600,scrollbars=yes');
    window.focus();
}
//
// this takes the user to the table maintence page to view the suggestions
function view_suggestions(status) {
    //
    var sug_params = '&gen_suggestions=true&status='+status;
    location.href = 'content_page.php?tab=table_maintenance'+sug_params
}
//
// toggles an element created by a button, updating the button's string
// to reflect visibilty change if the button's value is update
// then the changes are applied instead of toggling visibility
function toggle_view_element_button(button,element,hide_str,show_str) {
    //
    // getting elements if IDs were supplied instead
    if (!button.nodeName) { button = document.getElementById(button);}
    if (!element.nodeName) { element = document.getElementById(element);}
    //
    // checking value of button, if update returning with no changes
    if (button.value === 'update') {
        button.value = 'view';
        AFW_HUB.Utilities.remove_class('hidden-elm',element);
        AFW_HUB.Utilities.remove_class('boxshadow-blue',button);
    }
    else if (button.value === 'update-button') {
        button.value = 'view';
    }
    else {
        AFW_HUB.Utilities.show_hide(element);
    }
    //
    // updating button string
    if (element.className.match('hidden-elm')) {
        button.textContent = show_str;
    }
    else {
        button.textContent = hide_str;
    }
}
//
// shows an update viewable data button or updates an existing button
// with a class and string
function show_update_button(button_id,data_table_id,update_str) {
    //
    // making button visible if data table has already been generated
    if (document.getElementById(data_table_id)) {
        AFW_HUB.Utilities.remove_class('hidden-elm',button_id);
        AFW_HUB.Utilities.add_class('boxshadow-blue',button_id);
        if (update_str != '') {
            document.getElementById(button_id).textContent = update_str;
            document.getElementById(button_id).value = 'update';
        }
    }
}
//
// this function specifically populates the year dropboxes
// based on the first_year_with_data value in operations_constants table
function populate_year_dropboxes(dropbox) {
    //
    var options_str = '';
    var curr_year = new Date().getFullYear();
    var first_year = AFW_HUB.get_constant('FIRST_YEAR_WITH_DATA');
    var opt = null;
    for (var y = curr_year; y >= first_year; y--) {
        opt = document.createElementWithAttr('OPTION',{value: y});
        opt.addTextNode(y);
        dropbox.appendChild(opt);
    }
}
//
// creates the elm objects for each option in the time range dropbox
function gen_time_range_options() {
    //
    var today = new Date();
    var first_business_day = AFW_HUB.get_constant('FIRST_BUSINESS_DAY');
    var first = new Date(today.getFullYear(), today.getMonth(), 1);
    //
    // setting initial date objects
    var ranges = {
        'yesterday': [new Date(), new Date()],
        'current-week': [new Date(), new Date()],
        'current-pay-period': [new Date(), new Date()],
        'previous-pay-period': [new Date(), new Date()],
        'last-2-weeks': [new Date(), new Date()],
        'last-4-weeks': [new Date(), new Date()],
        'current-month': [new Date(), new Date()],
    }
    //
    // updating date objects to have proper offsets
    var d = null
    ranges['yesterday'][0].setDate(ranges['yesterday'][0].getDate() - 1);
    d = ranges['current-week'][0];
    ranges['current-week'][0].setDate(d.getDate() - d.getDay());
    ranges['current-week'][1].setDate(d.getDate() + 6);
    d = ranges['last-2-weeks'][0];
    ranges['last-2-weeks'][0].setDate(d.getDate() - d.getDay() - 7);
    ranges['last-2-weeks'][1] = new Date(ranges['current-week'][1]);
    d = ranges['last-4-weeks'][0];
    ranges['last-4-weeks'][0].setDate(d.getDate() - d.getDay() - 21);
    ranges['last-4-weeks'][1] = new Date(ranges['current-week'][1]);
    d = ranges['current-month'][0];
    ranges['current-month'][0].setDate(1);
    ranges['current-month'][0].setDate(d.getDate() - d.getDay());
    d = ranges['current-month'][1];
    ranges['current-month'][1].setDate(1);
    ranges['current-month'][1].setMonth(d.getMonth() + 1);
    ranges['current-month'][1].setDate(d.getDate() + 6 - d.getDay());
    //
    // converting date objects to yyyy-mm-dd strings
    for (var prop in ranges) {
        ranges[prop] = [ranges[prop][0].yyyymmdd(), ranges[prop][1].yyyymmdd()];
    }
    //
    // adding pay period ranges
    ranges['current-pay-period'] = find_pay_period();
    d = new Date(ranges['current-pay-period'][0]);
    d.setDate(d.getDate() - 1);
    ranges['previous-pay-period'] = find_pay_period(d);
    //
    // generating options array
    var options = [];
    var elm_obj = null;
    for (var prop in ranges) {
        elm_obj = {
            'elm': 'OPTION',
            'value': ranges[prop].join('|'),
            'textNode': prop.replace(/-/g, ' ').toTitleCase(),
            'data-start_date': ranges[prop][0],
            'data-end_date': ranges[prop][1]
        }
        //
        options.push(elm_obj);
    }
    //
    return options;
}
//
// creates the elm objects for each option in the month dropxes
function gen_month_options() {
    //
    var opts = ['January','February','March',
                'April','May','June',
                'July','August','September',
                'October','November','December'];
    for (var i=0; i < opts.length; i++) {
        opts[i] = {elm: 'OPTION', value: i+1, textNode: opts[i]};
    }
    //
    return opts;
}
//
// this creates the time range inputs for a page
function create_time_range_inputs(input_args) {
    //
    var output_element = document.getElementById(input_args.output_id);
    var cal_image = 'http://www.afwendling.com/operations/images/calander.png';
    //
    // creating initial elements required
    var label = document.createElement('LABEL');
    var range_select = document.createElementWithAttr('SELECT',{name:'time_range'});
    var toggle_button = document.createElementWithAttr('BUTTON',{type:'button'});
    var date_range_div = document.createElementWithAttr('DIV',{class:'hidden-elm'});
    label.textContent = 'Time Range:';
    range_select.add_children(gen_time_range_options(null));
    range_select.addEventListener('change',input_args.update_fun);
    toggle_button.textContent = 'Show Date Range';
    //
    output_element.addNodes([label,range_select,toggle_button,date_range_div]);
    //
    // creating date range elements
    var month_opts = gen_month_options();
    var date_range_elms = [
        {elm:'SPAN', class:'cal-span hidden-elm'},
        {elm:'LABEL', style:{width:'4em'}, textNode:'From:'},
        {elm:'INPUT', name:'st-day', style:{'width':'2em'}, value:'01', disabled:true},
        {elm:'SELECT', name:'st-month', style:{minWidth:'initial', margin:'5px'},
         children:month_opts, disabled:true},
        {elm:'SELECT', name:'st-year', style:{minWidth:'initial', margin:'5px'}, disabled:true},
        {elm:'IMG', class:'cal-image', src:cal_image},
        {elm:'BR'},
        {elm:'LABEL', style:{'width':'4em'}, textNode:'To:'},
        {elm:'INPUT', name:'en-day', style:{width:'2em'}, value:'01', disabled:true},
        {elm:'SELECT', name:'en-month', style:{minWidth:'initial', margin:'5px'},
         children:month_opts, disabled:true},
        {elm:'SELECT', name:'en-year', style:{minWidth:'initial', margin:'5px'}, disabled:true},
        {'elm':'IMG', 'class':'cal-image', 'src':cal_image}
    ]
    //
    // outputting date range elms to the div and building node arrays
    date_range_div.add_children(date_range_elms);
    date_range_elms = date_range_div.querySelectorAll('DIV > *');
    var cal_container = date_range_div.querySelector('SPAN');
    var cal_imgs = date_range_div.querySelectorAll('DIV > IMG');
    //
    // adding event handlers to date input/select fields
    var elms = {};
    var event = null;
    for (var i = 0; i < date_range_elms.length; i++) {
        if (!date_range_elms[i].name) { continue;}
        elms[date_range_elms[i].name] = date_range_elms[i];
        event = date_range_elms[i].primaryEventString();
        date_range_elms[i].addEventListener(event, input_args.update_fun);
    }
    //
    // populating year dropboxes
    populate_year_dropboxes(elms['st-year']);
    populate_year_dropboxes(elms['en-year']);
    //
    // defining JS event handlers
    var toggle_date_range = toggle_view_element_button.bind(null,
        toggle_button,date_range_div,'Hide Date Range','Show Date Range');
    var toggle_inputs = function(container, range_select, node_list) {
        var disable = !!container.className.match(/hidden-elm/);
        range_select.disabled = !disable;
        for (var i = 0; i < node_list.length; i++) {
            node_list[i].disabled = disable;
        }
    }
    toggle_inputs = toggle_inputs.bind(null, date_range_div, range_select, date_range_elms);
    var show_calendar = AFW_HUB.Utilities.show_hide.bind(null,cal_container);
    var from_img_onclick = create_calander.bind(null,
        cal_container,0,elms['st-day'],elms['st-month'],elms['st-year']);
    var to_img_onclick = create_calander.bind(null,
        cal_container,0,elms['en-day'],elms['en-month'],elms['en-year']);
    //
    // adding event handlers
    toggle_button.addEventListener('click', toggle_date_range);
    toggle_button.addEventListener('click', toggle_inputs);
    cal_imgs[0].addEventListener('click', from_img_onclick);
    cal_imgs[0].addEventListener('click', show_calendar);
    cal_imgs[1].addEventListener('click', to_img_onclick);
    cal_imgs[1].addEventListener('click', show_calendar);
}
//
// handles creation of a calander
function create_calander(out_elm,mon_shift,day_elm,mon_elm,year_elm) {
    //
    // defining initial static variables
    var mon_shift = Number(mon_shift);
    var mon_arr = ['January','February','March',
                   'April','May','June','July',
                   'August','September','October',
                   'November','December'];
    var dow_arr = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    var todays_date = new Date();
    var adj_date = new Date(todays_date.getFullYear(),todays_date.getMonth()+mon_shift,1);
    //
    // putting selected class on date entries
    AFW_HUB.Utilities.remove_class_all('boxshadow-blue');
    AFW_HUB.Utilities.add_class('boxshadow-blue',day_elm);
    AFW_HUB.Utilities.add_class('boxshadow-blue',mon_elm);
    AFW_HUB.Utilities.add_class('boxshadow-blue',year_elm);
    //
    // building table header
    var cal_table = document.createElementWithAttr('TABLE',{id:'calander', class:'cal-table'});
    var row = document.createElement('TR');
    var td = document.createElementWithAttr('TD',{class:'cal-table-month',colspan:'7'});
    td.style['white-space'] = 'initial';
    var elms = [
        {'elm':'SPAN', 'style':{'float':'left'}, 'textNode':'\u00A0\u003C\u003C',
            'events':[{'event':'click',
            'function': create_calander.bind(null,out_elm,mon_shift-1,day_elm,mon_elm,year_elm)}]},
        {'elm':'SPAN',
         'textNode':mon_arr[adj_date.getMonth()]+'\u00A0\u00A0'+adj_date.getFullYear()},
        {'elm':'SPAN', 'style':{'float':'right'}, 'textNode':'\u00A0\u003E\u003E',
            'events':[{'event':'click',
            'function':create_calander.bind(null,out_elm,mon_shift+1,day_elm,mon_elm,year_elm)}]}
    ];
    td.add_children(elms);
    row.appendChild(td);
    cal_table.appendChild(row);
    //
    row = row.cloneNode()
    elms = [];
    for (var i = 0; i < dow_arr.length; i++) {
        elms.push({'elm':'TD', 'class':'cal-table-wkhead', 'textNode':dow_arr[i]});
    }
    row.add_children(elms);
    cal_table.appendChild(row);
    //
    // building calander table body
    adj_date = new Date(adj_date.getFullYear(),adj_date.getMonth(),1-adj_date.getDay());
    td = document.createElementWithAttr('TD',{'class':'cal-table-day'});
    for (var d = 0; d < 42; d++) {
        //
        if (d%7 == 0) {
            cal_table.appendChild(row);
            row = row.cloneNode();
        }
        td = document.createElementWithAttr('TD',{'class':'cal-table-day'});
        td.dataset.day = adj_date.getDate();
        td.dataset.month = adj_date.getMonth()+1;
        td.dataset.year = adj_date.getFullYear();
        td.addEventListener('click',set_date.bind(td,day_elm,mon_elm,year_elm,out_elm));
        td.textContent = adj_date.getDate();
        //
        row.appendChild(td);
        if (adj_date.yyyymmdd() == Date.current_ts().split(' ')[0]) {
            AFW_HUB.Utilities.add_class('cal-table-today',td);
        }
        adj_date.setDate(adj_date.getDate() + 1);
    }
    out_elm.safeAppendChild(cal_table);
}
//
// upates the actual input fields with the date selection from the calander
function set_date(day_elm,mon_elm,year_elm,cal_container) {
    var mon_arr = ['December','January','February','March','April','May',
                   'June','July','August','September','October','November',
                   'December'];
    //
    var year_ind = new Date().getFullYear() - Number(this.dataset.year);
    day_elm.value = this.dataset.day;
    mon_elm.value = this.dataset.month;
    year_elm.value = this.dataset.year;
    //
    // dispatching events to each element and hiding calander
    day_elm.dispatchPrimaryEvent();
    mon_elm.dispatchPrimaryEvent();
    year_elm.dispatchPrimaryEvent();
    //
    AFW_HUB.Utilities.add_class('hidden-elm', cal_container);
    AFW_HUB.Utilities.remove_class_all('boxshadow-blue');
}
//
// checks the parent element for time range values or date values
function to_and_from_timestamps(parent) {
    var from_ts = '';
    var to_ts = '';
    var time_values = AFW_HUB.FormUtil.get_all_form_values(parent);
    //
    // getting time range data
    if (time_values.hasOwnProperty('time_range')) {
        from_ts = time_values['time_range'].split('|')[0]+' 00:00:00';
        to_ts = time_values['time_range'].split('|')[1]+' 23:59:59';
    }
    // using calander inputs instead
    else {
        from_ts = '{st-year}-{st-month}-{st-day} 00:00:00'.format(time_values);
        to_ts = '{en-year}-{en-month}-{en-day} 23:59:59'.format(time_values);
    }
    //
    return {from_ts: from_ts, to_ts: to_ts};
}
//
// this determines the time beginning and end of a pay period for a given date
function find_pay_period(date) {
    //
    date = date || new Date();
    //
    if (date instanceof Array) {
        if (date.length < 3) {
            console.log('Error in date array: ',date);
            return null;
        }
        date = new Date(Number(date[0]),Number(date[1])-1,Number(date[2]));
    }
    else if ((typeof date == 'string') || (date instanceof String)) {
        var date_arr = date.match(/(\d+).(\d+).(\d+)/)
        if (date_arr.length < 4) {
            console.log('Error in date string: ',date);
            return null;
        }
        date = new Date(Number(date_arr[1]),Number(date_arr[2])-1,Number(date_arr[3]));
    }
    //
    // initializing date from the first business day
    var first_business_day = AFW_HUB.get_constant('FIRST_BUSINESS_DAY')
    var st_pp = new Date(first_business_day);
    var test_date = st_pp;
    var date_adj = 14;
    if (date < st_pp) { date_adj = -14;}
    //
    // looping through to find period inclusive of the date
    while (true) {
        var ts_arr = [new Date(test_date)];
        test_date.setDate(test_date.getDate() + date_adj);
        ts_arr[1] = new Date(test_date);
        ts_arr.sort(function(a,b) {return b < a});
        //
        if ((date >= ts_arr[0]) && (date <= ts_arr[1])) { break;}
    }
    //
    ts_arr = [ts_arr[0].yyyymmdd(), ts_arr[1].yyyymmdd()];
    return ts_arr;
}
//
// this function takes inputs from a fieldset or form and adds them to the
// where parameter of the sql args using a REGEXP
function get_table_inputs(sql_args, input_container) {
    //
    var sort_col, sort_dir;
    //
    sql_args.where = sql_args.where || [];
    sql_args.order_by = sql_args.order_by || [];
    //
    var all_elms = input_container.getElementsByTagName('*');
    var name_val_obj = AFW_HUB.FormUtil.get_all_form_values(input_container);
    //
    // setting up match type object, defaults to REGEXP
    var match_type_obj = {};
    for (var col in name_val_obj) { match_type_obj[col] = 'REGEXP'}
    for (var i = 0; i < all_elms.length; i++) {
        if (!all_elms[i].name) { continue;}
        if (!name_val_obj.hasOwnProperty(all_elms[i].name)) { continue;}
        if (document.getElementById(all_elms[i].id+'-match-type')) {
            var match_type = document.getElementById(all_elms[i].id+'-match-type')
            match_type_obj[all_elms[i].name] = match_type.value;
        }
    }
    //
    // checking for sorting terms
    if (name_val_obj['sort-col']) {
        sort_col = String.trim(name_val_obj['sort-col']);
        delete name_val_obj['sort-col'];
    }
    if (name_val_obj['sort-dir']) {
        sort_dir = String.trim(name_val_obj['sort-dir']);
        delete name_val_obj['sort-dir'];
    }
    //
    // adding where blocks to sql args
    for (var col in name_val_obj) {
        if (String.trim(name_val_obj[col]) === '') { continue;}
        //
        if (match_type_obj[col] == 'REGEXP') {
            try {
                new RegExp(name_val_obj[col]);
                sql_args.where.push([col,'REGEXP',name_val_obj[col]]);
            }
            catch(err) {
                console.log('Invalid RegExp pattern: '+name_val_obj[col]);
            }
        }
        else {
            sql_args.where.push([col,match_type_obj[col],name_val_obj[col]]);
        }
    }
    //
    if (sort_col && sort_dir) {
        sql_args.order_by.push([sort_col, sort_dir])
    }
}
//
// function to generate a standard table
function create_standard_table(table_args) {
    //
    var meta_sql = null;
    var add_callback = false;
    //
    // getting callback if it exists
    if (table_args.hasOwnProperty('add_callback')) {
        add_callback = table_args.add_callback;
    }
    //
    var key_arr = ['data'];
    if (table_args.data_sql) {
        var sql_arr = [table_args.data_sql];
    }
    else {
        var sql_arr = [AFW_HUB.Ajax.gen_sql(table_args.data_sql_args)];
    }
    //
    if (table_args.meta_sql) {
        meta_sql = table_args.meta_sql;
    }
    else if (table_args.meta_sql_args) {
        meta_sql = AFW_HUB.Ajax.gen_sql(table_args.meta_sql_args);
    }
    if (meta_sql) {
        sql_arr.push(meta_sql);
        key_arr.push('meta_data');
    }
    //
    var callback = function(response) {
        //
        table_args.data_arr = response.data;
        if (response.hasOwnProperty('meta_data')){
            table_args.col_meta_data = response.meta_data;
        }
        //
        var output_elm = document.getElementById(table_args.table_output_id);
        var table = make_standard_table(table_args);
        output_elm.safeAppendChild(table);
        //
        if (add_callback) { add_callback(response);}
    }
    AFW_HUB.Ajax.fetch_db(sql_arr,key_arr,callback)
}
//
// makes the employee table itself
function make_standard_table(input_args) {
    //
    // initializations
    var default_args = AFW_HUB.get_constant('STANDARD_TABLE_DEFAULTS')
    var args = Object.merge(default_args,input_args);
    var head_row_args = {};
    var page_nav_args = {};
    var data_arr = [];
    var col_meta_data = [];
    //
    // putting arguments into variables
    data_arr = input_args.data_arr;
    col_meta_data = input_args.col_meta_data;
    head_row_args = input_args.head_row_args;
    page_nav_args = input_args.page_nav_args;
    page_nav_args.data_length = data_arr.length;
    //
    args.data_preprocessor(args);
    //
    // calculating number of pages and what to display
    var page = page_nav_args.curr_page;
    var start_index = 0;
    var end_index = data_arr.length;
    if (!(args.no_page_nav)) {
        start_index = (page - 1)*page_nav_args.num_per_page;
        end_index = page * page_nav_args.num_per_page;
        if (end_index > data_arr.length) {end_index = data_arr.length;};
        //
        var page_nav = create_page_links(page_nav_args);
        if (document.getElementById(page_nav.id)) {
            document.getElementById(args.table_output_id).safeAppendChild(page_nav);
        }
        else {
            document.getElementById(args.table_output_id).appendChild(page_nav);
        }
    }
    //
    // creating column head rows
    var table = document.createElementWithAttr('TABLE',args.table_attr);
    var tbody = document.createElement('TBODY');
    make_head_rows(table,col_meta_data,head_row_args)
    table.appendChild(tbody);
    //
    // populating row data
    var table_row = null;
    var td = null;
    for (var i = start_index; i < end_index; i++) {
        data_arr[i]['row_id'] =  args.row_id_prefix+i;
        table_row = document.createElementWithAttr('TR',args.row_attr);
        table_row.id = data_arr[i]['row_id']
        //
        // setting dataset values of the row
        for (var prop in data_arr[i]) {
            try {
                table_row.dataset[prop] = data_arr[i][prop]
            }
            catch(err) {
                console.log('Property: '+prop+' could not be stored.');
            }
        }
        //
        // adding onmouseenter events
        for (var j = 0; j < args.row_onmouseenter.length; j++) {
            var func_obj = args.row_onmouseenter[j];
            var runtime_func = AFW_HUB.Utilities.build_runtime_function(func_obj,
                                                                        data_arr[i]);
            table_row.addEventListener('mouseenter',runtime_func);
        }
        //
        // adding onmouseleave events
        for (var j = 0; j < args.row_onmouseleave.length; j++) {
            var func_obj = args.row_onmouseleave[j];
            var runtime_func = AFW_HUB.Utilities.build_runtime_function(func_obj,
                                                                        data_arr[i]);
            table_row.addEventListener('mouseleave',runtime_func);
        }
        //
        // adding onclick events
        for (var j = 0; j < args.row_onclick.length; j++) {
            var func_obj = args.row_onclick[j];
            var runtime_func = AFW_HUB.Utilities.build_runtime_function(func_obj,
                                                                        data_arr[i]);
            table_row.addEventListener('click',runtime_func);
        }
        //
        // creating table data cells
        for (var c = 0; c < col_meta_data.length; c++) {
            //
            td = document.createElementWithAttr('TD',args.cell_attr);
            td.id = data_arr[i]['row_id']+'-'+col_meta_data[c].column_name;
            if (!(col_meta_data[c].data_type.match(/text|info/))) {
                td.style['text-align'] = 'right';
            }
            process_data_type(data_arr[i][col_meta_data[c].column_name],
                              col_meta_data[c].data_type,td,false);
            table_row.appendChild(td);
        }
        tbody.appendChild(table_row);
    }
    //
    return table;
}
//
// creates page link line
function create_page_links(input_args) {
    //
    // processing the argument object
    var default_args = AFW_HUB.get_constant('PAGE_NAV_DEFAULTS')
    var args = Object.merge(default_args,input_args);
    for (var arg in args) {
        if (typeof(args[arg]) != 'string') { continue;}
        if (args[arg].match(/^-?\d+$/)) { args[arg] = Number(args[arg]);}
    }
    //
    var num_pages = Math.ceil(args.data_length/args.num_per_page);
    var num_left  = Math.floor((args.tot_pages_shown - 1)/2);
    var page_arr = new Array();
    var page_str = '';
    var p = args.curr_page - num_left;
    if ((num_pages - p) <= args.tot_pages_shown) {
        p = num_pages - args.tot_pages_shown + 1;
    }
    if (num_pages <= args.tot_pages_shown) {p = 1;}
    if (p <= 0) { p = 1;}

    //
    for (var i = 0; i < args.tot_pages_shown; i++) {
        page_arr[i] = p;
        p += 1;
        if (p > num_pages) { break;}
    }
    //
    args.page_nav_div_attr['data-curr-page'] = args.curr_page;
    args.page_nav_div_attr['data-sort-col'] = args.sort_col;
    args.page_nav_div_attr['data-sort-dir'] = args.sort_dir;
    var page_div = document.createElementWithAttr('DIV',args.page_nav_div_attr);
    //
    var page_link = null
    page_div.appendChild(document.createTextNode('Pages: '));
    if (args.curr_page != 1) {
        //
        page_link = document.createElementWithAttr('A',args.link_attr);
        page_link.id = args.id_prefix+'-page-nav-pre';
        //
        // adding onmouseover events
        for (var j = 0; j < args.link_onmouse.length; j++) {
            var func_obj = args.link_onmouse[j];
            var runtime_func = AFW_HUB.Utilities.build_runtime_function(func_obj,
                                                      {'curr_page' : args.curr_page-1});
            page_link.addEventListener('mouseover',runtime_func);
        }
        //
        // adding onclick events
        for (var j = 0; j < args.link_onclick.length; j++) {
            var func_obj = args.link_onclick[j];
            var runtime_func = AFW_HUB.Utilities.build_runtime_function(func_obj,
                                                      {'curr_page' : args.curr_page-1});
            page_link.addEventListener('click',runtime_func);
        }
        page_link.addTextNode('\u276E');
        page_div.appendChild(page_link);
    }
    for (var i = 0; i < page_arr.length; i++) {
        //
        page_link = document.createElementWithAttr('A',args.link_attr);
        page_link.id = args.id_prefix+'-page-nav-'+page_arr[i];
        if (page_arr[i] == args.curr_page) {
            AFW_HUB.Utilities.add_class('page-nav-link_curr',page_link);
        }
        //
        // adding onmouseover events
        for (var j = 0; j < args.link_onmouse.length; j++) {
            var func_obj = args.link_onmouse[j];
            var runtime_func = AFW_HUB.Utilities.build_runtime_function(func_obj,
                                                      {'curr_page' : page_arr[i]});
            page_link.addEventListener('mouseover',runtime_func);
        }
        //
        // adding onclick events
        for (var j = 0; j < args.link_onclick.length; j++) {
            var func_obj = args.link_onclick[j];
            var runtime_func = AFW_HUB.Utilities.build_runtime_function(func_obj,
                                                      {'curr_page' : page_arr[i]});
            page_link.addEventListener('click',runtime_func);
        }
        page_link.addTextNode('['+page_arr[i]+']');
        page_div.appendChild(page_link);
    }
    if (args.curr_page < num_pages) {
        //
        page_link = document.createElementWithAttr('A',args.link_attr);
        page_link.id = args.id_prefix+'-page-nav-next';
        //
        // adding onmouseover events
        for (var j = 0; j < args.link_onmouse.length; j++) {
            var func_obj = args.link_onmouse[j];
            var runtime_func = AFW_HUB.Utilities.build_runtime_function(func_obj,
                                                      {'curr_page' : args.curr_page+1});
            page_link.addEventListener('mouseover',runtime_func);
        }
        //
        // adding onclick events
        for (var j = 0; j < args.link_onclick.length; j++) {
            var func_obj = args.link_onclick[j];
            var runtime_func = AFW_HUB.Utilities.build_runtime_function(func_obj,
                                                      {'curr_page' : args.curr_page+1});
            page_link.addEventListener('click',runtime_func);
        }
        page_link.addTextNode('\u276F');
        page_div.appendChild(page_link);
    }
    //
   return(page_div);
}
//
// creates the header rows for a table
function make_head_rows(output_element,col_data,input_args) {
    //
    // checking input args for generation parameters
    var default_args = AFW_HUB.get_constant('HEAD_ROW_DEFAULTS')
    var args = Object.merge(default_args,input_args);
    var col_meta_data = Object.clone(col_data);
    for (var arg in input_args) {
        args[arg] = input_args[arg];
        if (typeof args[arg] == 'string') {
            args[arg] = args[arg].replace(/%%/g,'1');
        }
    }
    //
    // modifying args if table is not sortable
    if (!(args.sortable)) {
        args.sort_onclick = [];
        args.asc_arrow  = '';
        args.desc_arrow = '';
    }
    //
    // parsing array for dynamic totals and skip cols
    for (var i = 0; i < col_meta_data.length; i++) {
        if (args.skip_cols.indexOf(col_meta_data[i].column_name) >=0) {
            col_meta_data.splice(i,1); continue;
        }
    }
    //
    // adding data to column objects
    for (var i = 0; i < col_meta_data.length; i++) {
        col_meta_data[i].arrow = args.asc_arrow;
        col_meta_data[i].sort_dir = 'ASC';
        col_meta_data[i].sort_onclick = args.sort_onclick;
        col_meta_data[i].cell_onclick = args.cell_onclick;
        col_meta_data[i].tooltip = Object.clone(args.tooltip);
        if ((args.sort_col == col_meta_data[i].column_name) && (args.sort_dir == 'ASC')) {
            col_meta_data[i].arrow = args.desc_arrow;
            col_meta_data[i].sort_dir = 'DESC';
        }
        col_meta_data[i].arrow = {'textContent' : col_meta_data[i].arrow}
        //
        // stepping through properties of object to sub into values
        var tooltip_text = col_meta_data[i].tooltip.textNode;
        //
        // processing events
        col_meta_data[i].cell_onclick = [];
        for (var j = 0; j < args.cell_onclick.length; j++) {
            var func_obj = args.cell_onclick[j];
            var runtime_func = AFW_HUB.Utilities.build_runtime_function(func_obj,col_meta_data[i]);
            col_meta_data[i].cell_onclick.push(runtime_func);
        }
        col_meta_data[i].sort_onclick = [];
        for (var j = 0; j < args.sort_onclick.length; j++) {
            var func_obj = args.sort_onclick[j];
            var runtime_func = AFW_HUB.Utilities.build_runtime_function(func_obj,col_meta_data[i]);
            col_meta_data[i].sort_onclick.push(runtime_func);
        }
        // processing tool tip
        for (var prop in col_meta_data[i]) {
            tooltip_text = tooltip_text.replace("%"+prop+"%",col_meta_data[i][prop]);
        }
        col_meta_data[i].tooltip.textNode = tooltip_text;
        col_meta_data[i].arrow.onclick = col_meta_data[i].sort_onclick;
    }
    //
    // processing data array to check for shared columns
    var num_rows = 1;
    for (var i = 0; i < col_meta_data.length; i++) {
        var n = 0;
        if (col_meta_data[i].column_nickname.match(/-/g)) {
            var col_nick = col_meta_data[i].column_nickname;
            n = 1 + col_nick.match(/-/g).length
        }
        if (n > num_rows) {num_rows = n}
    }
    //
    // creating the output cells array
    var output_cells = [];
    var lvl = 0;
    while (lvl < num_rows) {
        var row_cells = [];
        var cell = 0;
        for (var i = 0; i < col_meta_data.length; i++) {
            if (args.skip_cols.indexOf(col_meta_data[i].column_name) >=0) {continue;}
            //prevents mutation of object in future loops
            var col_obj = Object.clone(col_meta_data[i]);
            // need to re-add function references
            col_obj.cell_onclick = col_meta_data[i].cell_onclick;
            col_obj.arrow.onclick = col_meta_data[i].sort_onclick;
            //
            var col_name_arr = col_obj.column_nickname.split(/-/g);
            //skips cells that don't have this low of a teir
            if (lvl >= col_name_arr.length) {continue;}
            // setting rowspan and sort parameters
            if (lvl == col_name_arr.length - 1) {
                col_obj.rowspan = num_rows - col_name_arr.length + 1;
            }
            else {
                col_obj.rowspan = 1;
                col_obj.cell_onclick = [];
                col_obj.sort_onclick = [];
                col_obj.tooltip = '';
                col_obj.arrow = '';
            }
            // initializing colspan
            col_obj.colspan = 1;
            col_obj.innerHTML = col_name_arr[lvl];
            col_obj.id = col_name_arr.slice(0,lvl+1).join('-');
            col_obj.id = col_obj.id.replace(/\s+/g,'_');
            //
            // adding object to row for current tier
            row_cells[cell] = col_obj;
            cell += 1;
        }
        output_cells[lvl] = row_cells;
        lvl += 1;
    }
    //
    // incrementing colspan and removing duplicates
    for (var lvl = 0; lvl < num_rows; lvl++) {
        var col = 0;
        var cmpr = 1;
        while (cmpr < output_cells[lvl].length) {
            if (output_cells[lvl][col].innerHTML == output_cells[lvl][cmpr].innerHTML) {
                //
                // this prevents columns from different trees being spanned in the middle
                var in_tree = true;
                var col_arr = output_cells[lvl][col].column_nickname.split('-');
                var cmpr_arr = output_cells[lvl][cmpr].column_nickname.split('-');
                for (var l = 0; l <= lvl; l++) {
                    if (col_arr[l] != cmpr_arr[l]) { in_tree = false;}
                }
                //
                if (in_tree) {
                    output_cells[lvl][col].colspan += 1;
                    output_cells[lvl][cmpr] = ''; // deleting "spanned columns"
                    cmpr += 1;
                }
                else {
                    col = cmpr;
                    cmpr += 1;
                }
            }
            else {
                col = cmpr;
                cmpr += 1;
            }
        }
    }
    //
    // initializing header rows and adding spacing cell
    var head_tr = [];
    for (var i = 0; i < num_rows; i++) {
        var clones = [];
        for (var j = 0; j < args.leading_cells.length; j++) {
            clones.push(args.leading_cells[j].cloneNode(true));
        }
        head_tr[i] = document.createElementWithAttr('TR',args.row_attr);
        head_tr[i].addNodes(clones);
    }
    //
    // creating table cells
    for (var lvl = 0; lvl < num_rows; lvl++) {
        for (var col = 0; col < output_cells[lvl].length; col++) {
            if (output_cells[lvl][col] == '') { continue;}
            var col_obj = output_cells[lvl][col];
            var attr = Object.merge(args.cell_attr,{
                    'id' : args.id_prefix+col_obj.id,
                    'colspan' : col_obj.colspan,
                    'rowspan' : col_obj.rowspan
            });
            var td = document.createElementWithAttr('TH',attr);
            for (var j = 0; j < col_obj.cell_onclick.length; j++) {
                td.addEventListener('click',col_obj.cell_onclick[j]);
            }
            for (var prop in col_data[col]) {
                td.dataset[prop] = col_data[col][prop];
            }
            td.addTextNode(col_obj.innerHTML+'\u00A0');
            if (col_obj.arrow) {
                var span = document.createElement('SPAN');
                for (var j = 0; j < col_obj.arrow.onclick.length; j++) {
                    span.addEventListener('click',col_obj.arrow.onclick[j]);
                }
                span.addTextNode(col_obj.arrow.textContent);
                td.appendChild(span);
            }
            if (col_obj.tooltip) {
                var onclick = {'func':function(){}, 'args':['%column_name%']};
                if (col_obj.tooltip['onclick']) {
                    onclick = col_obj.tooltip['onclick'];
                    delete col_obj.tooltip['onclick'];
                }
                var onclick = AFW_HUB.Utilities.build_runtime_function(onclick,col_obj)
                col_obj.tooltip['events'] = [{'event':'click', 'function':onclick}];
                td.add_children([col_obj.tooltip])
            }
            head_tr[lvl].appendChild(td);
        }
    }
    //
    var thead = document.createElement('THEAD');
    thead.addNodes(head_tr)
    output_element.appendChild(thead);
}
//
// this function handles the data types of various cells in the database for reports
function process_data_type(value, data_type, element, args) {
    //
    var nodes, add_commas, format_str, attr, aux_elm, handler,
        numeric = 'int(%|$)|float(%|$)|percent(%|$)|monetary(%|$)|(^|%)round',
        MAX_STR_LENGTH = AFW_HUB.get_constant('MAX_STR_LENGTH');
    //
    if (value === null) { value = '';}
    data_type = data_type || 'info';
    data_type = data_type.toLowerCase();
    args = args || {};
    add_commas = args.add_commas || false;
    format_str = args.format_str || '%value%';
    numeric = new RegExp(numeric);
    //
    // handling input pre-processing
    if (data_type.match(/(^|%)percent(%|$)/)) {
        value = 100 * Number(value);
    }
    else if (data_type.match(/(^|%)bool(%|$)/)) {
        value = Number(value);
        if (value > 0) { value = 'YES';}
        else { value = 'NO';}
    }
    //
    // handling required rounding
    if (numeric.test(data_type) && isFinite(Number(value))) {
        value = AFW_HUB.FormUtil.round_data_type(value, data_type);
        element.style.textAlign = 'right';
        add_commas = true;
    }
    //
    // adding any output styling
    if (add_commas) {
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    if (data_type.match(/(^|%)percent(%|$)/)) {
        value += ' %';
    }
    value = format_str.replace(/%value%/, value);
    //
    // handling special cases where additional elements are created
    if (data_type.match(/(^|%)monetary(%|$)/)) {
        attr = {style: {float: 'left'}};
        aux_elm = document.createElementWithAttr('SPAN', attr);
        aux_elm.textContent = '$\u00A0';
        nodes = [aux_elm, document.createTextNode(value)];
    }
    else if (data_type.match(/(?:^|%)text(?:%|$)/) && (value.length > MAX_STR_LENGTH)) {
        attr = {
            id: Math.floor10(Math.random()*10000, 0, true),
            style: {color: 'rgb(0,0,225)'}
        }
        aux_elm = document.createElementWithAttr('SPAN', attr);
        handler = AFW_HUB.Utilities.toggle_textContent;
        handler = handler.bind(null, aux_elm, value.slice(0, MAX_STR_LENGTH) + '...', value);
        //
        aux_elm.addEventListener('click', handler);
        aux_elm.textContent = value.slice(0,  MAX_STR_LENGTH) + '...';
        element.style.textAlign = 'left';
        nodes = [aux_elm];
    }
    //
    // ouputting value or nodes
    if (element.nodeName.match(/INPUT|SELECT|TEXTAREA/i)) {
        element.value = value;
    }
    else if (nodes) {
        element.addNodes(nodes);
    }
    else {
        element.addTextNode(value);
    }
}
//
// creates the table that allows the user to select viewable columns and totalling type
function make_data_columns_table(output_element,args) {
    //
    // variable definitions
    var col_meta_data = args.data;
    var preset_data = args.preset_data;
    var checked_cols = [];
    var all_onclick_fun = [];
    //
    // additional argument parameters
    if (args.hasOwnProperty('all_onclick_fun')) {
        all_onclick_fun = args.all_onclick_fun;
    }
    //
    // making an array to track columns that should be checked
    if (preset_data.data_columns.match(/\*/)) {
        for (var i = 0; i < col_meta_data.length; i++) {
            checked_cols.push(col_meta_data[i].column_name);
        }
    }
    else {
        checked_cols = preset_data.data_columns.split(',');
    }
    //
    // table construction initializations
    var br = document.createElement('BR');
    var table = document.createElementWithAttr('TABLE',{'id':'data_sel_cols_table',
                                                        'class':'report-table'});
    var view_col_tr = document.createElementWithAttr('TR',{'id':'data_sel_cols_checkbox_tr'});
    var total_type_tr = document.createElementWithAttr('TR',{'id':'data_sel_cols_radio_tr'});
    var sort_by_tr = document.createElementWithAttr('TR',{'id':'sort-by-col-tr'});
    var td = document.createElementWithAttr('TD',{'class':'report-data-td'});
    td.textContent = 'Show Column:'
    view_col_tr.appendChild(td);
    td = document.createElementWithAttr('TD',{'class':'report-data-td'});
    td.textContent = 'Sort by Column:';
    sort_by_tr.appendChild(td);
    td = document.createElementWithAttr('TD',{'class':'report-data-td'});
    td.addTextNode('Sum:');
    td.appendChild(document.createElement('BR'));
    td.addTextNode('or');
    td.appendChild(document.createElement('BR'));
    td.addTextNode('Average:');
    total_type_tr.appendChild(td);
    //
    // making header rows
    var lead_td = document.createElementWithAttr('TD',{'class':'report-spacer-td'});
    lead_td.addTextNode('\u00A0');
    var head_rows_props = {};
    head_rows_props.sortable = false;
    head_rows_props.id_prefix = 'sel-cols-';
    head_rows_props.cell_attr = {'class' : 'report-column-header'};
    head_rows_props.leading_cells =  [lead_td];
    make_head_rows(table,col_meta_data,head_rows_props);
    //
    // constructing additional table rows
    var input = null;
    for (var i = 0; i < col_meta_data.length; i++) {
        var col_obj = col_meta_data[i];
        var checked = false;
        //
        // creating view-col table cell
        if (checked_cols.indexOf(col_obj.column_name) >= 0) {
            checked = true;
        }
        td = document.createElementWithAttr('TD',{'id':col_obj.column_name+'-viewcol-td',
                                                  'class':'report-data-td'});
        input = document.createElementWithAttr('INPUT',{
                'id' : col_obj.column_name+'-viewcol-checkbox',
                'name' : 'sel_cols',
                'type' : 'checkbox',
                'value' : col_obj.column_name,
        });
        if (checked) { input.checked = true;}
        for (var j = 0; j < all_onclick_fun.length; j++ ) {
            input.addEventListener('click',all_onclick_fun[j]);
        }
        td.appendChild(input);
        view_col_tr.appendChild(td);
        //
        // creating sort col table cell
        td = document.createElementWithAttr('TD',{'id':col_obj.column_name+'-sortby-td',
                                                  'class':'report-data-td'});
        if (col_obj.column_type.match('static')) {
            input = document.createElementWithAttr('INPUT',{
                    'id' : col_obj.column_name+'-sortby-radio',
                    'name' : 'secd-sort',
                    'type' : 'radio',
                    'value' : col_obj.column_name,
            });
            for (var j = 0; j < all_onclick_fun.length; j++ ) {
                input.addEventListener('click',all_onclick_fun[j]);
            }
            td.appendChild(input);
        }
        sort_by_tr.appendChild(td);
        //
        // creating total type cell
        td = document.createElementWithAttr('TD',{'class':'report-data-td'});
        if (col_obj.total_type.match(/sum|avg/)) {
            var sum_input = null;
            var avg_input = null;
            var sum_check = false;
            var avg_check = false;
            if (col_obj.total_type.match(/avg/)) {avg_check = true;}
            else {sum_check = true;}
            //
            sum_input = document.createElementWithAttr('INPUT',{
                    'id' : col_obj.column_name+'-totaltype-sum',
                    'name' : col_obj.column_name,
                    'type' : 'radio',
                    'value' : col_obj.column_name+':sum',
            });
            avg_input = document.createElementWithAttr('INPUT',{
                    'id' : col_obj.column_name+'-totaltype-avg',
                    'name' : col_obj.column_name,
                    'type' : 'radio',
                    'value' : col_obj.column_name+':avg',
            });
            if (sum_check) { sum_input.checked = true;}
            if (avg_check) { avg_input.checked = true;}
            for (var j = 0; j < all_onclick_fun.length; j++ ) {
                sum_input.addEventListener('click',all_onclick_fun[j]);
                avg_input.addEventListener('click',all_onclick_fun[j]);
            }
            td.appendChild(sum_input);
            td.appendChild(br.cloneNode());
            td.appendChild(avg_input);
        }
        total_type_tr.appendChild(td)
    }
    //
    // appending elements to table
    table.appendChild(view_col_tr);
    if (!(args.hide_sort_row)) {
        table.appendChild(sort_by_tr);
    }
    if (!(args.hide_totals_row)) {
        table.appendChild(total_type_tr);
    }
    //
    output_element.safeAppendChild(table);
}
//
// updates the sort_by_col radio button to match drop down list if table exists
function update_sort_by_col(table_row_id,drop_down_id) {

    if (document.getElementById(table_row_id)) {
        var secd_sort = document.getElementById(drop_down_id).value;
        if (document.getElementById(secd_sort+'-sortby-radio')) {
            document.getElementById(secd_sort+'-sortby-radio').checked = true;
        }
    }
}
