/*eslint-disable camelcase */
/*eslint-disable no-alert */
/*eslint-disable global-strict */
////////////////////////////////////////////////////////////////////////////////
///////////   This file holds general purpose utility functons       ///////////
///////////   that perform basic operations on forms                 ///////////
////////////////////////////////////////////////////////////////////////////////
'use strict';
var AFW_HUB = AFW_HUB || {};
///////////////// Form manipulation and data population ////////////////////////
//
AFW_HUB.FormUtil = (function() {
    //
    //////////////////////// General Form Event Functions /////////////////////
    //
    // toggles the disabled status on an HTML element(s)
    function toggle_disabled(elm_arr) {
        //
        for (var i = 0; i < elm_arr.length; i++) {
            elm_arr[i].disabled = !elm_arr[i].disabled;
        }
    }
    //
    // toggles the readonly attrbute of an HTML element(s)
    function toggle_readonly(elm_arr) {
        //
        for (var i = 0; i < elm_arr.length; i++) {
            elm_arr[i].readOnly = !elm_arr[i].readOnly;
        }
    }
    //
    // this sets a checkbox value based on if it is checked or not
    function toggle_checkbox_value(checkbox, checked_value, unchecked_value) {
        //
        if (checkbox.checked) {
            checkbox.value = checked_value;
        }
        else {
            checkbox.value = unchecked_value;
        }
    }
    //
    // disableds an element if the checkbox is checked, enable=true reverses the behavior
    function disable_if_checked(checkbox, elm, enable) {
        //
        enable = !!enable || false;
        if (checkbox.checked) { elm.disabled = !enable;}
        else { elm.disabled = enable;}
    }
    //
    // handles logic when a 'other' field is selected on a dropbox
    function show_other(select, other_inp) {
        //
        var option = select.options[select.selectedIndex] || {'textContent': 'null'};
        //
        if (select.value === 'other' || option.textContent.toLowerCase() === 'other') {
            AFW_HUB.Utilities.remove_class('hidden-elm', other_inp);
            other_inp.disabled = false;
            select.name = '';
        }
        else {
            AFW_HUB.Utilities.remove_class('boxshadow-red', other_inp);
            AFW_HUB.Utilities.add_class('hidden-elm', other_inp);
            other_inp.disabled = true;
            select.name = other_inp.name;
        }
    }
    //
    // handles the logic to hard define a form value ignoring normal validation
    function force_value(checkbox) {
        //
        var input_id = checkbox.id.match(/force-(.+)/i)[1];
        var input = document.getElementById(input_id);
        //
        if (checkbox.checked) {
            input.disabled = true;
            checkbox.name = input.name;
            checkbox.value = input.value;
            AFW_HUB.Utilities.remove_class('boxshadow-red', input.id);
        }
        else {
            input.disabled = false;
            checkbox.name = '';
            checkbox.value = '';
            AFW_HUB.Utilities.add_class('boxshadow-red', input.id);
        }
    }
    //
    // handles logic to cleanly skip a value
    function skip_value(checkbox) {
        var base_id = checkbox.id.match(/skip-(.+)/i)[1];
        var input = document.getElementById(base_id);
        var force_cb = document.getElementById('force-' + base_id);
        var disable = false;
        //
        if (checkbox.checked) { disable = true;}
        //
        if (force_cb) {
            force_cb.checked = false;
            force_cb.disabled = disable;
            force_value(force_cb);
        }
        //
        input.disabled = disable;
        AFW_HUB.Utilities.remove_class('boxshadow-red', input.id);
    }
    //
    /////////////////// Form Creation and Population Functions ////////////////
    //
    // loads a form through ajax, supporting a callback function
    function load_html_form(form_name, output_elm, callback) {
        //
        var xmlhttp = new XMLHttpRequest(),
            file = 'forms/{}.html'.format(form_name);
        //
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                output_elm.innerHTML = xmlhttp.responseText;
                //
                // passing the loaded form onto the callback
                var form = output_elm.querySelector('FORM');
                callback(form);
            }
        };
        xmlhttp.open('GET', file, true);
        xmlhttp.send();
        return;
    }
    //
    // finds the "other" option in a select element
    function find_other(select) {
        for (var i = 0; i < select.options.length; i++) {
            var opt = select.options[i];
            if (opt.value === 'other' || opt.textContent.toLowerCase() === 'other') {
                select.selectedIndex = i;
            }
        }
    }
    //
    // this function processes the response from populate form
    // it is assumed that the fields name matches the respoective column name
    function process_form_data(input_args) {
        //
        // processing  arguments
        var args = AFW_HUB.get_constant('POPULATE_FORM_DEFAULTS');
        Object.merge(args, input_args);
        //
        var data_arr = args.data_arr;
        var skip_arr = args.skip_fields_str.split(',');
        //
        // getting all elements of the form
        var all_children = document.getElementById(args.form_id).getElementsByTagName('*');
        //
        // stepping through children
        for (var i = 0; i < all_children.length; i++) {
            //
            // checking parameters to exclude elements
            if (all_children[i].nodeType !== 1) { continue;}
            if (!all_children[i].name) { continue;}
            if (skip_arr.indexOf(String.trim(all_children[i].name)) > -1) { continue;}
            if (!data_arr.hasOwnProperty(all_children[i].name)) { continue;}
            //
            // if the object has the elements name then it sets it to that value
            if (all_children[i].nodeName.toUpperCase() === 'SELECT') {
                find_other(all_children[i]);
                for (var opt = 0; opt < all_children[i].length; opt++){
                    if (all_children[i].options[opt].value === data_arr[all_children[i].name]) {
                        all_children[i].value = data_arr[all_children[i].name];
                        break;
                    }
                }
            }
            // checkbox logic
            else if ((all_children[i].type.toUpperCase() === 'CHECKBOX')) {
                //
                if ((Number(data_arr[all_children[i].name]) !== 0) && (data_arr[all_children[i].name] !== '')) {
                    //
                    all_children[i].checked = true;
                    all_children[i].value = data_arr[all_children[i].name];
                }
            }
            else {
                all_children[i].value = data_arr[all_children[i].name];
            }
            //
            if (args.trigger_events === true) {
                all_children[i].dispatchPrimaryEvent();
            }
        }
    }
    //
    // this function gets a row from a table using the unique col and data entry
    function populate_form(populate_form_args) {
        //
        // processing arg object
        var sql = '',
            sql_args = {};
        //
        populate_form_args = Object.clone(populate_form_args);
        //
        // creating sql statement
        if (populate_form_args.hasOwnProperty('sql_args')) {
            sql_args = populate_form_args.sql_args;
        }
        else {
            sql_args.cmd = 'SELECT';
            sql_args.table = populate_form_args.table;
            sql_args.where = [
                [populate_form_args.unique_col, 'LIKE', populate_form_args.unique_data]
            ];
        }
        sql = AFW_HUB.Ajax.gen_sql(sql_args);
        //
        var callback_fun = function(response) {
            if (response.data.length > 1) {
                console.error('DATA INTEGRITY ERROR - Form populated using non-unique data value!');
                console.log(response.data);
            }
            populate_form_args.data_arr = response.data[0];
            process_form_data(populate_form_args);
            //
            if (populate_form_args.add_callback) {
                populate_form_args.add_callback();
            }
        };
        AFW_HUB.Ajax.fetch_db([sql], ['data'], callback_fun);
    }
    //
    // processes data and actually populates the dropbox
    function process_dropbox_data(input_args) {
        //
        // processing  arguments
        var args = AFW_HUB.get_constant('POPULATE_DROPBOX_DEFAULTS'),
            prop = null;
        Object.merge(args, input_args);
        //
        var opt = null;
        var opt_attr = {};
        //
        // creating options for dropbox
        var dropbox = document.getElementById(args.dropbox_id);
        dropbox.removeAll();
        //
        if (args.placeholder) {
            opt = document.createElement('OPTION');
            opt.value = args.placeholder_value;
            opt.disabled = args.placeholder_disabled;
            opt.selected = args.placeholder_selected;
            opt.addTextNode(args.placeholder);
            dropbox.appendChild(opt);
        }
        //
        var i = null;
        for (i = 0; i < args.dropbox_data.length; i++) {
            var text = args.text_format;
            var value = args.value_format;
            opt_attr = Object.clone(args.option_attr);
            opt = document.createElementWithAttr('OPTION', opt_attr);
            for (prop in args.dropbox_data[i]) {
                text = text.replace('%' + prop + '%', args.dropbox_data[i][prop]);
                value = value.replace('%' + prop + '%', args.dropbox_data[i][prop]);
                opt.dataset[prop] = args.dropbox_data[i][prop];
            }
            opt.value = value;
            opt.textContent = text;
            dropbox.appendChild(opt);
        }
        //
        // placing additional options in list
        for (i = 0; i < args.add_opts_val.length; i++) {
            opt_attr = {value: args.add_opts_val[i]};
            opt = document.createElementWithAttr('OPTION', opt_attr);
            opt.addTextNode(args.add_opts_text[i]);
            dropbox.appendChild(opt);
        }
        //
        args.add_callback(args);
    }
    //
    // this function will get database data and fill the dropbox with it
    function populate_dropbox_options(input_args) {
        //
        input_args = Object.clone(input_args);
        input_args.sql_args.cmd = 'SELECT';
        var sql = AFW_HUB.Ajax.gen_sql(input_args.sql_args);
        //
        // fetching data and populating the dropbox
        var callback = function(response) {
            input_args.dropbox_data = response.dropbox_data;
            process_dropbox_data(input_args);
        };
        //
        AFW_HUB.Ajax.fetch_db([sql], ['dropbox_data'], callback);
    }
    //
    //////////////////////// Form Validation Fuctions ////////////////////////
    //
    // this function adds/removes CSS classes based on if there was an error or not
    function update_error_css(error, input, err_msg_elm_id) {
        //
        var err_msg = document.getElementById(err_msg_elm_id);
        //
        if (error) {
            AFW_HUB.Utilities.add_class('boxshadow-red', input);
            if (err_msg) {
                AFW_HUB.Utilities.remove_class('hidden-elm', err_msg);
            }
        }
        else {
            AFW_HUB.Utilities.remove_class('boxshadow-red', input);
            if (err_msg) {
                AFW_HUB.Utilities.add_class('hidden-elm', err_msg);
            }
        }
    }
    //
    // this fuction checks if a string is a valid number of any form
    function check_num_str(input) {
        //
        // getting the input string from the element
        var error = false,
            num = String.trim(input.value);
        //
        if (num === '') {
            error = true;
        }
        else if (!isFinite(Number(num))) {
            error = true;
        }
        update_error_css(error, input, input.id + '-numstr-err-msg');
        //
        return error;
    }
    //
    // this function checks if a text entry has only numbers in it
    function check_int_str(input) {
        //
        // getting the input string from the element
        var error = false,
            num = String.trim(input.value);
        //
        //
        if (num === '') {
            error = true;
        }
        else if (Math.round(Number(num)) !== Number(num)) {
            error = true;
        }
        update_error_css(error, input, input.id + '-intstr-err-msg');
        //
        return error;
    }
    //
    // checks if a date string is in valid format
    // also checks for roughly valid values no month > 12, day > 31 or either equal to 0
    function check_date_str(input) {
        //
        // getting the input string from the element
        var date_value = new Date(input.value);
        var error = false;
        //
        if (isNaN(date_value.getTime())) {
            error = true;
        }
        //
        update_error_css(error, input, input.id + '-datestr-err-msg');
        //
        return error;
    }
    //
    // checks if a phone number appears to have valid formatting (###)123-4567
    function check_phone_str(input) {
        //
        // getting the input string from the element
        var input_str = String.trim(input.value);
        var error = true;
        input_str = input_str.replace(/[()]/g, '-');
        input_str = input_str.replace(/\s*/g, '');
        input_str = input_str.replace(/^-/, '');
        var phone_pat = new RegExp(/^(?:\d-)?\d{3}-\d{3}-\d{4}$/);
        var match = phone_pat.test(input_str);
        //
        if (match) {
            input.value = input_str;
            error = false;
        }
        update_error_css(error, input, input.id + '-phonestr-err-msg');
        //
        return error;
    }
    //
    // checks if an email appears to have valid formatting text@text.text
    function check_email_str(input) {
        //
        // getting the input string from the element
        var input_str = String.trim(input.value),
            error = true,
            email_pat = new RegExp(/.*?@.*?[.].+$/),
            match = email_pat.test(input_str);
        //
        if (match) {
            error = false;
        }
        update_error_css(error, input, input.id + '-emailstr-err-msg');
        //
        return error;
    }
    //
    // this function calls the respective validation function based on data type
    function check_data_type(input, type) {
        //
        var error = false;
        type = type || '';
        //
        if (type.match('date')) {
            error = check_date_str(input);
        }
        else if (type.match('email')) {
            error = check_email_str(input);
        }
        else if (type.match('float')) {
            error = check_num_str(input);
        }
        else if (type.match('int')) {
            error = check_int_str(input);
        }
        else if (type.match('phone')) {
            error = check_phone_str(input);
        }
        else {
            if (String.trim(input.value) === '') {
                error = true;
            }
            update_error_css(error, input, input.id + '-required-err-msg');
        }
        return error;
    }
    //
    // checks if two input fields have the same text
    function check_equality(primary, secondary) {
        //
        var error = false;
        //
        if (primary.value !== secondary.value) {
            error = true;
        }
        update_error_css(error, primary, primary.id + '-notequal-err-msg');
        update_error_css(error, secondary, null);
        //
        return error;
    }
    //
    // checks if a value is unique in the specific column of a database table
    function check_unique(unique, compare, table, form_callback) {
        //
        var unique_err = false;
        //
        compare = compare || {name: '', value: ''};
        form_callback = form_callback || function() {};
        //
        //
        if (!String.trim(unique.value)) {
            update_error_css(true, unique, null);
            form_callback(true);
            return true;
        }
        //
        if (this) {
            var data = this[0];
            //
            if (!compare.name && data[0]) {
                unique_err = true;
            }
            else if (data[0] && (data[0][compare.name] !== compare.value)) {
                unique_err = true;
            }
            //
            update_error_css(unique_err, unique, unique.id + '-unique-err-msg');
            //
            // returning a value in case the function is used synchronously
            form_callback(unique_err);
            return unique_err;
        }
        //
        // fetching data from database
        var sql_args = {
            cmd: 'SELECT',
            table: table,
            where: [[unique.name, 'LIKE', unique.value]]
        };
        var sql = AFW_HUB.Ajax.gen_sql(sql_args);
        //
        var callback = function(response) {
            var this_arg = [response[0], true];
            var args = [unique, compare, table, form_callback];
            check_unique.apply(this_arg, args);
        };
        //
        AFW_HUB.Ajax.fetch_db([sql], [0], callback);
    }
    //
    // this function adds event handlers based on standard data types and conventions
    function add_standard_event_listeners(form, args) {
        args = args || {};
        //
        // processing meta_data array if it exists
        var meta_data = args.meta_data || null;
        if (!meta_data && args.meta_array) {
            meta_data = args.meta_array.to_object('column_name');
        }
        //
        if (!form.id) { form = document.getElementById(form);}
        var nodes = form.getElementsByTagName('*');
        //
        // adding non-validation and any default events to elements
        var i = null,
            dataset;
        for (i = 0; i < nodes.length; i++) {
            var elm = nodes[i],
                event = nodes[i].primaryEventString(),
                main_elm = null,
                main_elm_id = null,
                main_event = null;
            //
            if (elm.dataset.skip_add_standard_event_listeners) { continue;}
            //
            if (elm.id.match('^skip-.+')) {
                elm.addEventListener(event, skip_value.bind(null, elm));
            }
            //
            if (elm.id.match('^force-.+')) {
                elm.addEventListener(event, force_value.bind(null, elm));
            }
            //
            if (elm.id.match('^other-.+')) {
                main_elm = elm.id.match('^other-(.+)')[1];
                main_elm = document.getElementById(main_elm);
                if (main_elm) {
                    main_event = main_elm.primaryEventString();
                    main_elm.addEventListener(main_event, show_other.bind(null, main_elm, elm));
                }
            }
            //
            if (elm.id.match('^edit-.+')) {
                main_elm_id = elm.id.match('^edit-(.+)')[1];
                main_elm = document.getElementById(main_elm_id);
                if (main_elm) {
                    elm.addEventListener(event, toggle_readonly.bind(null, [main_elm]));
                }
            }
            //
            // adding any default events (remove_class is usually applied here)
            if (args.add_default_events) {
                args.add_default_events(elm);
            }
        }
        //
        // adding standard validation events based on data type
        for (i = 0; i < nodes.length; i++) {
            elm = nodes[i];
            dataset = elm.dataset || {};
            event = nodes[i].primaryEventString();
            //
            if (dataset.skip_add_standard_event_listeners) { continue;}
            //
            // checking data attributes to determine a type validation function
            if (meta_data && meta_data[elm.name]) {
                elm.addEventListener(event,
                    check_data_type.bind(null, elm, meta_data[elm.name].data_type));
            }
            else if (dataset.data_type) {
                elm.addEventListener(event,
                    check_data_type.bind(null, elm, dataset.data_type));
            }
            //
            if (dataset.equal_to) {
                main_elm = elm;
                main_event = event;
                elm = document.getElementById(dataset.equal_to);
                event = elm.primaryEventString();
                main_elm.addEventListener(main_event,
                    check_equality.bind(null, main_elm, elm));
                elm.addEventListener(event,
                    check_equality.bind(null, main_elm, elm));
            }
        }
    }
    //
    // checks the parent for any children with a boxshadow-red class
    function check_for_invalid_fields(container) {
        //
        var error = false,
            elms = container.getElementsByClassName('boxshadow-red'),
            i;
        //
        for (i = 0; i < elms.length; i++) {
            //
            if (elms[i].disabled) { continue;}
            console.log('Invalid Error: ', elms[i].id);
            error = true;
        }
        //
        return error;
    }
    //
    // performs auto validation of a form
    function auto_validate(form) {
        var all_children = form.querySelectorAll('INPUT,SELECT,TEXTAREA'),
            error = false,
            func = func = AFW_HUB.Utilities.add_class,
            main_elm, helper_elm, elm_error;
        //
        for (var i = 0; i < all_children.length; i++) {
            main_elm = all_children[i];
            //
            // checking if child node meets criteria
            if (!main_elm.name) { continue;}
            if (main_elm.disabled) { continue;}
            if (main_elm.type === 'hidden') { continue;}
            if (main_elm.dataset.skip_auto_validate) { continue;}
            //
            // type validation
            elm_error = check_data_type(main_elm, main_elm.dataset.data_type);
            if (elm_error) { error = true;}
            //
            // checking if the element has an equality condition
            if (!elm_error && main_elm.dataset.equal_to) {
                helper_elm = document.getElementById(main_elm.dataset.equal_to);
                elm_error = check_equality(main_elm, helper_elm);
                if (elm_error) { error = true;}
            }
        }
        //
        // final check for invalid fields to include any fields that were skipped
        // but still have an error (i.e. unique fields)
        elm_error = check_for_invalid_fields(form);
        if (elm_error) { error = true;}
        //
        //
        if (error) { func = AFW_HUB.Utilities.remove_class;}
        func('hidden-elm', 'form-errors');
        //
        return error;
    }
    //
    /////////////////////////// Form Submission Functions /////////////////////
    //
    // generates a key - value object form form elements
    function get_all_form_values(form, args) {
        //
        var defaults = AFW_HUB.get_constant('GET_ALL_FORM_VALUES_DEFAULTS'),
            all_children = form.querySelectorAll('INPUT,SELECT,TEXTAREA'),
            // bool is included because SQL stores them as 0 or 1
            numeric = 'float(%|$)|int(%|$)|percent(%|$)|monetary(%|$)|bool(%|$)',
            name_val_obj = {},
            i, elm, data_type, value;
        //
        args = Object.merge(defaults, args || {});
        numeric = new RegExp(numeric);
        //
        // stepping through children
        for (i = 0; i < all_children.length; i++) {
            elm = all_children[i];
            if (!elm.name) { continue;}
            if (elm.disabled) {
                if (args.disabled_default !== undefined && name_val_obj[elm.name] === undefined) {
                    name_val_obj[elm.name] = args.disabled_default;
                }
                continue;
            }
            //
            data_type = elm.dataset.data_type || 'info';
            value = String.trim(elm.value);
            value = value.replace(/\r?\n|\r/g, '; ');
            if (numeric.test(data_type)) {
                value = Number.parse(value);
            }
            name_val_obj[elm.name] = value;
        }
        //
        return name_val_obj;
    }
    //
    // this function handles the rounding logic in table meta data
    function round_data_type(value, data_type) {
        data_type = data_type.toLowerCase();
        //
        var match = data_type.match(/(?:^|%)round\(([crf]),(-?[0-9]+)\)(?:%|$)/),
            STD_PREC = AFW_HUB.get_constant('STD_PRECISION');
        //
        // adjusting match terms
        if (!match) { match = ['', 'r', '-1'];}
        if (match[2] === '-1') {
            match[2] = STD_PREC;
        }
        if (data_type.match(/(?:^|%)int(?:%|$)/)) {
            match[2] = 0;
        }
        //
        if (match[1] === 'f') {
            value = Math.floor10(value, match[2], true);
        }
        else if (match[1] === 'c') {
            value = Math.ceil10(value, match[2], true);
        }
        else {
            value = Math.round10(value, match[2], true);
        }
        //
        return value;
    }
    //
    // rounds all input fields to standard or a specified precision
    function round_form_inputs(form, precision) {
        //
        precision = precision || AFW_HUB.get_constant('STD_PRECISION');
        var inputs = form.querySelectorAll('INPUT'),
            numeric = 'float(%|$)|int(%|$)|percent(%|$)|monetary(%|$)|(^|%)round',
            round = '%round(r,{})'.format(precision),
            i, data_type, value;
        numeric = new RegExp(numeric);
        //
        for (i = 0; i < inputs.length; i++) {
            data_type = inputs[i].dataset.data_type || 'info';
            value = inputs[i].value || '';
            //
            if (inputs.type === 'hidden') { continue;}
            if (value === '') { continue;}
            if (!numeric.test(data_type)) { continue;}
            //
            if (isFinite(Number(inputs[i].value))) {
                inputs[i].value = round_data_type(inputs[i].value, data_type + round);
            }
        }
    }
    //
    // builds a multi-table sql command from form data
    function build_form_sql(input_args) {
        //
        var sql_arr = [],
            args = {
                action: 'modify',
                action_specific_changes: null, //fn(args, table_data) { return table_data}
                form_values: {},
                include_tables: [],
                init_sql_args: {},
                meta_array: [],
                not_modified: false,
                modified_by_value: window.sessionStorage.username,
                table_pattern: new RegExp(/(?:^|%)(.+?)(?=%|$)/, 'gi')
            };
        //
        Object.merge(args, input_args);
        //
        // converting array indicies to property names
        var meta_array = Object.clone(args.meta_array),
            meta_data = {},
            i = null;
        for (i = 0; i < meta_array.length; i++) {
            meta_data[meta_array[i].column_name] = meta_array[i];
        }
        //
        // determining which table(s) each form value belongs to.
        var tables = null,
            table_data = {},
            col = null,
            value = null;
        for (col in meta_data) {
            col = meta_data[col];
            tables = col.in_tables.match(args.table_pattern);
            if (!tables) { continue;}
            for (i = 0; i < tables.length; i++) {
                tables[i] = tables[i].replace(/%/g, '');
                if (!table_data.hasOwnProperty(tables[i])) {
                    table_data[tables[i]] = {};
                    table_data[tables[i]].cols = {};
                }
                // adding the last modified by columns to table data
                if (col.column_name.match(/last_modified_by/) && !args.not_modified) {
                    value = "CONCAT({}.{},'{};')";
                    value = value.format(tables[i], col.column_name, args.modified_by_value);
                    table_data[tables[i]].cols[col.column_name] = value;
                }
                else if (col.column_name.match(/last_modified$/) && !args.not_modified) {
                    value = "CONCAT({}.{},'{};')";
                    value = value.format(tables[i], col.column_name, Date.current_ts());
                    table_data[tables[i]].cols[col.column_name] = value;
                }
            }
            col.in_tables = tables;
        }
        //
        // grouping form values by table
        for (var name in args.form_values) {
            col = meta_data[name];
            for (i in col.in_tables) {
                table_data[col.in_tables[i]].cols[name] = args.form_values[name];
            }
            args.form_values[name] = false;
        }
        //
        // removing tables not in include list and enforcing order defined in include_tables
        var temp_arr = [],
            data = null,
            test = false;
        for (i = 0; i < args.include_tables.length; i++) {
            test = false;
            data = table_data[args.include_tables[i]];
            data.table = args.include_tables[i];
            temp_arr.push(data);
            for (col in data.cols) { args.form_values[col] = true; test = true;}
            if (!test) {
                console.error('Error - included table: {} has no columns'.format(args.include_tables[i]));
            }
        }
        table_data = temp_arr;
        //
        // checking if all form values were submitted
        var errors = [];
        for (name in args.form_values) {
            if (!args.form_values[name]) { errors.push(name);}
        }
        if (errors.length > 0) {
            alert('ERROR - ' + errors.join(', ') + ' form inputs could not be submitted!');
            return null;
        }
        //
        // setting action specific params
        if (args.action_specific_changes) {
            table_data = args.action_specific_changes(args, table_data);
        }
        //
        // generating sql statements
        var sql_args = {};
        var table = null;
        for (i in table_data) {
            table = table_data[i];
            //
            sql_args = Object.clone(args.init_sql_args);
            sql_args.table = table.table;
            if (!sql_args.cols) { sql_args.cols = [];}
            if (!sql_args.vals) { sql_args.vals = [];}
            for (col in table.cols) {
                sql_args.cols.push(col);
                sql_args.vals.push(table.cols[col]);
            }
            sql_arr.push(AFW_HUB.Ajax.gen_sql(sql_args));
        }
        //
        return sql_arr;
    }
    //
    // returning interface
    return {
        // element manipulation functions
        toggle_disabled: toggle_disabled,
        toggle_readonly: toggle_readonly,
        toggle_checkbox_value: toggle_checkbox_value,
        disable_if_checked: disable_if_checked,
        show_other: show_other,
        force_value: force_value,
        skip_value: skip_value,
        add_standard_event_listeners: add_standard_event_listeners,
        // population functions
        load_html_form: load_html_form,
        populate_form: populate_form,
        process_form_data: process_form_data,
        populate_dropbox_options: populate_dropbox_options,
        process_dropbox_data: process_dropbox_data,
        // validation functions
        check_num_str: check_num_str,
        check_int_str: check_int_str,
        check_date_str: check_date_str,
        check_phone_str: check_phone_str,
        check_email_str: check_email_str,
        check_data_type: check_data_type,
        check_equality: check_equality,
        check_unique: check_unique,
        auto_validate: auto_validate,
        check_for_invalid_fields: check_for_invalid_fields,
        // submission functions
        get_all_form_values: get_all_form_values,
        round_data_type: round_data_type,
        round_form_inputs: round_form_inputs,
        build_form_sql: build_form_sql
    };
}());
//
// setting exports for nodejs
var module = module || {};
module.exports = AFW_HUB.FormUtil;
