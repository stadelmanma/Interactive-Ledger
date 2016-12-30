/*eslint-disable global-strict */
/*eslint-disable camelcase */
/*eslint-disable no-extend-native */
/*eslint-disable no-alert */
////////////////////////////////////////////////////////////////////////////////
///////////   This file holds general purpose utility functons       ///////////
///////////   that perform basic operations on inputs or elements    ///////////
////////////////////////////////////////////////////////////////////////////////
'use strict';
//
////////////////////////////////////////////////////////////////////////////////
///////////////// Adding methods to native JavaScript classes //////////////////
////////////////////////////////////////////////////////////////////////////////
(function() {
    //
    // adding a method to convert an array to an aboject
    Object.defineProperty(Array.prototype, 'to_object', {
        value: function (prop_name) {
            // this assumes the property exists on all elements and does not
            // resolve any naming clashes
            var out_obj = {};
            for (var i = 0; i < this.length; i++) {
                out_obj[this[i][prop_name]] = this[i];
            }
            return out_obj;
        }
    });
    //
    // creates and element with the supplied attributes
    document.createElementWithAttr = function(nodeName, attributes) {
        attributes = attributes || {};
        attributes = Object.clone(attributes);
        var element = document.createElement(nodeName),
            style = attributes.style || {},
            attr = null;
        delete attributes.style;
        //
        // adding style
        for (attr in style) {
            element.style[attr] = style[attr];
        }
        //
        for (attr in attributes) {
            element.setAttribute(attr, attributes[attr]);
        }
        return element;
    };
    //
    // handles actual rounding
    function decimal_adjust(type, number, num_digits, to_fixed) {
        //
        number = Number(number) || 0.0;
        num_digits = Number(num_digits) || 0;
        to_fixed = to_fixed || false;
        //
        var scale = Math.pow(10, num_digits);
        number = number * scale;
        number = Math[type](number) / scale;
        // checking if to return a string
        number = to_fixed ? number.toFixed(num_digits) : number;
        //
        return number;
    }
    //
    // Rounds a number to a fixed number of decimals
    Math.round10 = decimal_adjust.bind(null, 'round');
    Math.floor10 = decimal_adjust.bind(null, 'floor');
    Math.ceil10 = decimal_adjust.bind(null, 'ceil');
    //
    // this adds a node if the ID doesn't exist on the parent node and replaces it if it does
    Node.prototype.safeAppendChild = function(element, entire_doc) {
        //
        if (!element.id) { this.appendChild(element); return;}
        //
        var old_element = document.getElementById(element.id);
        var parent = null;
        if (old_element) { parent = old_element.parentNode;}
        //
        if (parent && entire_doc) {
            parent.replaceChild(element, old_element);
        }
        else if (parent === this) {
            this.replaceChild(element, old_element);
        }
        else {
            this.appendChild(element);
        }
    };
    //
    // this iterates over a list of objects to add child nodes to a parent element
    Node.prototype.add_children = function(elementsArray) {
        for (var i = 0; i < elementsArray.length; i++) {
            var elm_obj = elementsArray[i];
            elm_obj.events = elm_obj.events || false;
            elm_obj.children = elm_obj.children || false;
            elm_obj.textNode = elm_obj.textNode || false;
            //
            // storing complex attributes for direct processing
            var element = elm_obj.elm.toUpperCase();
            var events = elm_obj.events;
            var children = Object.clone(elm_obj.children);
            var text_node = elm_obj.textNode;
            delete elm_obj.elm;
            delete elm_obj.events;
            delete elm_obj.children;
            delete elm_obj.textNode;
            //
            // if element is text, then append text node to parent
            if (element === 'TEXT') {
                this.addTextNode(text_node);
                continue;
            }
            //
            // creating element with remaining attrbutes
            element = document.createElementWithAttr(element, elm_obj);
            //
            // adding textNode
            if (text_node) { element.addTextNode(text_node);}
            //
            // adding children to element
            if (children) { element.add_children(children);}
            //
            // adding events to element
            if (events) {
                for (var e = 0; e < events.length; e++) {
                    var event = events[e].event;
                    var funct = events[e].function;
                    element.addEventListener(event, funct);
                }
            }
            //
            // adding the new element to the parent
            this.safeAppendChild(element);
        }
    };
    //
    // Adds multiple nodes to an element
    Node.prototype.addNodes = function(node_array) {
        //
        for (var i = 0; i < node_array.length; i++) {
            this.safeAppendChild(node_array[i]);
        }
    };
    //
    // this is a short hand method to add a text node to an element
    Node.prototype.addTextNode = function(text) {
        //
        this.appendChild(document.createTextNode(text));
    };
    //
    // shorthand method to return all nodes contained in an elements
    Node.prototype.allSubNodes = function() {
        //
        return this.getElementsByTagName('*');
    };
    //
    // removes all children from an element
    Node.prototype.removeAll = function() {
        //
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }
    };
    //
    // returns the primary event string of an element or null
    Node.prototype.primaryEventString = function() {
        var node_name = this.nodeName.toLowerCase();
        var node_type = this.type;
        var event = null;
        //
        if (node_name === 'button' || node_type === 'checkbox') {
            event = 'click';
        }
        else if (node_name === 'select') {
            event = 'change';
        }
        else if (node_name === 'input' || node_name === 'textarea') {
            event = 'keyup';
        }
        //
        return event;
    };
    //
    // dispatches the primary event to the node
    Node.prototype.dispatchPrimaryEvent = function() {
        var event = document.createEvent('HTMLEvents');
        var event_string = this.primaryEventString();
        if (!event_string) {
            console.warn(this.nodeName + ' does not have a primary event set.');
            return null;
        }
        //
        event.initEvent(event_string, true, false);
        return this.dispatchEvent(event);
    };
    //
    // this creates a method to output a YYYY-MM-DD formatted date
    Date.prototype.yyyymmdd = function() {
        // getting components of date
        var YYYY = this.getFullYear().toString(),
            MM = (this.getMonth() + 1).toString(),
            DD = this.getDate().toString();
        //
        // returning formatted string
        return YYYY + '-' + (MM[1] ? MM : '0' + MM[0]) + '-' + (DD[1] ? DD : '0' + DD[0]);
    };
    //
    // Creating a method to return the current timestamp in SQL format
    Date.current_ts = function() {
        var d = new Date();
        var time = d.toLocaleTimeString('en-US', {hour12: false});
        //
        return d.yyyymmdd() + ' ' + time;
    };
    //
    // this parses a number, removing commas, dollar and percent signs
    Number.parse = function(num_str) {
        //
        num_str += '';//ensures value is a string
        num_str = num_str.replace(/[%$,]/g, '');
        //
        return Number(num_str);
    };
    //
    // used to get the class name of an variable
    function get_class_name(variable) {
        //
        var get_class = {}.toString;
        if (variable === null) {
            return null;
        }
        //
        var class_name = get_class.call(variable);
        class_name = class_name.match(/\[object (.+)\]/i)[1];
        //
        return class_name.toLowerCase();
    }
    //
    //  creates a copy of an object with a new memory reference
    Object.clone = function(original_object) {
        //
        // copying the object and re-adding any function references
        var copy = null, prop = null, replacer, reviver;
        //
        replacer = function(key, value) {
            if (value === undefined) {
                return '&%@!#$*UNDEFINED*$#!@%&';
            }
            return value;
        };
        reviver = function(key, value) {
            if (value === '&%@!#$*UNDEFINED*$#!@%&') {
                return undefined;
            }
            return value;
        };
        //
        // first checks for functions specific subtypes of objects that aren't JSON
        // encodable, loops through cloning properties of Arrays and Objects
        if (get_class_name(original_object) === 'function') {
            copy = original_object;
        }
        else if (get_class_name(original_object) === 'regexp') {
            copy = original_object;
        }
        else if (get_class_name(original_object) === 'array') {
            copy = [];
            for (prop in original_object) {
                copy[prop] = Object.clone(original_object[prop]);
            }
        }
        else if (get_class_name(original_object) === 'object') {
            copy = {};
            for (prop in original_object) {
                copy[prop] = Object.clone(original_object[prop]);
            }
        }
        else {
            copy = JSON.stringify(original_object, replacer);
            copy = JSON.parse(copy, reviver);
        }
        //
        return copy;
    };
    //
    // general function to do a deep merge of two objects
    Object.merge = function(obj1, obj2) {
        // need to destroy reference to obj2 to prevent array mutation
        obj2 = Object.clone(obj2);
        //
        for (var prop in obj2) {
            // tests if obj2[prop] and obj1[prop] are both non-array objects
            // if so then the objects are merged otherwise obj2[prop]
            // overwrites obj1[prop]
            if (obj1.hasOwnProperty(prop)) {
                if (get_class_name(obj2[prop]) === 'object') {
                    if (get_class_name(obj1[prop]) === 'object') {
                        // if obj1[prop] and obj2[prop] are both objects merge them
                        obj1[prop] = Object.merge(obj1[prop], obj2[prop]);
                        continue;
                    }
                }
            }
            obj1[prop] = obj2[prop];
        }
        //
        return obj1;
    };
    //
    // adds backslashes to regexp special characters in a string
    RegExp.quote = function(str) {
        return (str + '').replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&');
    };
    //
    // removes whitespace from string
    String.trim = function(str) {
        //
        str = str.replace(/^\s*/, '');
        str = str.replace(/\s*$/, '');
        //
        return str;
    };
    //
    // Implements python-like formatting of strings
    Object.defineProperty(String.prototype, 'format', {
        value: function () {
            var i = 0, args = arguments;
            if (typeof args[0] === 'object') { args = args[0];}
            return this.replace(/{(.*?)}/g, function (match, key) {
                if (key) {
                    i++;
                    return typeof args[key] !== 'undefined' ? args[key] : match;
                }
                else {
                    return typeof args[i] !== 'undefined' ? args[i++] : match;
                }
            });
        }
    });
    //
    // changes  a string to title case i.e. 'column name' -> 'Column Name'
    Object.defineProperty(String.prototype, 'toTitleCase', {
        value: function() {
            return this.replace(/\w\S*/g,
                function(txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                });
        }
    });
})();
//
////////////////////////////////////////////////////////////////////////////////
/////////////////        Initializng the AFW_HUB namespace        //////////////
////////////////////////////////////////////////////////////////////////////////
//
var AFW_HUB = (function() {
    var CONSTANTS = {
        //
        DATA_EXPIRATION_DATES: {
            FIRST_BUSINESS_DAY: ['2017', '01', '05'],
            LY_FIRST_BUSINESS_DAY: ['2017', '01', '05']
        },
        //
        LY_FIRST_BUSINESS_DAY: ['2014', '12', '28'],
        FIRST_BUSINESS_DAY: ['2015', '12', '27'],
        FIRST_YEAR_WITH_DATA: 2014,
        STD_PRECISION: 2,
        SALES_STD_PRECISION: 2,
        MAX_STR_LENGTH: 24,
        SHIPPING_SUPERVISOR_ID: '2001',
        DEPT_TABLES: {
            freight_backhaul: 'employee_data_freight_backhaul',
            transportation: 'employee_data_transportation',
            warehouse_receiving: 'employee_data_receiving',
            warehouse_shipping: 'employee_data_shipping'
        },
        GET_ALL_FORM_VALUES_DEFAULTS: {
            disabled_default: undefined
        },
        STANDARD_TABLE_DEFAULTS: {
            data_preprocessor: function() {},
            no_page_nav: false,
            table_attr: {
                id: 'standard-data-table'
            },
            row_attr: {
                class: 'altcolor hover active'
            },
            cell_attr: {},
            table_row_appended_cells: '',
            row_id_prefix: '',
            row_onclick: [],
            row_onmouseenter: [],
            row_onmouseleave: []
        },
        PAGE_NAV_DEFAULTS: {
            curr_page: 1,
            num_per_page: 10,
            data_length: 10,
            tot_pages_shown: 9,
            sort_col: '',
            sort_dir: '',
            page_nav_div_attr: {
                id: 'table-page-nav',
                class: 'page_nav'
            },
            link_attr: {
                class: 'page-nav-link'
            },
            id_prefix: '',
            link_onclick: [],
            link_onmouse: []
        },
        HEAD_ROW_DEFAULTS: {
            id_prefix: '',
            leading_cells: [],
            row_attr: {
                id: 'table-header'
            },
            cell_attr: {},
            tooltip: {
                elm: 'SPAN',
                class: 'hidden-elm',
                textNode: ''
            },
            skip_cols: [],
            sortable: true,
            sort_col: '',
            sort_dir: '',
            asc_arrow: '\u25BC',
            desc_arrow: '\u25B2',
            cell_onclick: [],
            sort_onclick: []
        },
        POPULATE_FORM_DEFAULTS: {
            form_id: null,
            trigger_events: true,
            skip_fields_str: '',
            callback_fun: function() {},
            data_arr: null
        },
        POPULATE_DROPBOX_DEFAULTS: {
            sql_args: {},
            dropbox_id: null,
            option_attr: {},
            text_format: '',
            value_format: '',
            placeholder: '',
            placeholder_value: '',
            placeholder_disabled: true,
            placeholder_selected: true,
            add_opts_val: [],
            add_opts_text: [],
            add_callback: function() {},
            dropbox_data: null
        },
        GEN_SQL_DEFAULTS: {
            cmd: 'SELECT',
            table: null,
            cols: [],
            vals: [],
            where: [],
            inner_join: [],
            left_join: [],
            right_join: [],
            having: [],
            group_by: null,
            order_by: [],
            limit: []
        }
    };
    //
    // checks if any constants have expired and need updated
    function check_expiration_dates(check_date) {
        var dates = CONSTANTS.DATA_EXPIRATION_DATES,
            update = [],
            head_div = document.getElementById('head');
        check_date = check_date || new Date();
        //
        for (var constant in dates) {
            var date = new Date(dates[constant]);
            if (date < check_date) { update.push(constant);}
        }
        //
        if (update.length) {
            var span = document.createElementWithAttr('H3', {class: 'error-msg'});
            var msg = 'Alert: The following constants need updated: {}. ';
            msg += 'Contact your system administrator.';
            span.addTextNode(msg.format(update.join(',')));
            head_div.appendChild(span);
        }
        //
        return update.length;
    }
    //
    function get_constant(key) {
        //
        if (!(CONSTANTS.hasOwnProperty(key))) {
            alert('ERROR - CONSTANTS Object has no key: ' + key);
            return null;
        }
        //
        var copy = Object.clone(CONSTANTS[key]);
        //
        return copy;
    }
    //
    // returning interface
    return {
        check_expiration_dates: check_expiration_dates,
        get_constant: get_constant
    };
}());
//
////////////////////////////////////////////////////////////////////////////////
/////////////////////// Setting up the Utilities module ////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
AFW_HUB.Utilities = (function() {
    //
    // returned by build_runtime_function to be attached to an event handler
    function exec_runtime_function(func, arg_array) {
        return func.apply(this, arg_array);
    }
    //
    // this handles the creation of a runtime function reference
    function build_runtime_function(func_obj, input_obj) {
        //
        func_obj = Object.clone(func_obj);
        input_obj = Object.clone(input_obj);
        var func = func_obj.func,
            thisArg = func_obj.thisArg || null,
            arg_array = func_obj.args || [],
            i = -1;
        //
        for (var prop in input_obj) {
            i = arg_array.indexOf('%' + prop + '%');
            if (i < 0) { continue;}
            //
            arg_array[i] = input_obj[prop];
        }
        return exec_runtime_function.bind(thisArg, func, arg_array);
    }
    //
    // adds a class to an element if it does not already have it
    function add_class(class_name, element) {
        //
        // checking if an id string was passed instead
        if (!element.nodeName) {
            var id = element;
            element = document.getElementById(id);
            if (!element) {
                console.warn('No element found with id: ' + id);
                return;
            }
        }
        var class_pat = new RegExp('(?:^|\\s)' + class_name + '(?!\\S)', 'gi');
        var css = element.className;
        if (!css) { css = '';}
        if (!css.match(class_pat)) {
            element.className += ' ' + class_name;
        }
    }
    //
    // removes a class from an elemet if it has it
    // no error returned if the class does not exist
    function remove_class(class_name, element) {
        //
        // checking if an id string was passed instead
        if (!element.nodeName) {
            var id = element;
            element = document.getElementById(id);
            if (!(element)) {
                console.warn('No element found with id: ' + id);
                return;
            }
        }
        var class_pat = new RegExp('(?:^|\\s)' + class_name + '(?!\\S)', 'gi');
        var css = element.className;
        if (!css) { css = '';}
        element.className = css.replace(class_pat, '');
    }
    //
    // removes a class from all elements on the page
    function remove_class_all(class_name, parent) {
        //
        parent = parent || document;
        var elm_arr = parent.getElementsByClassName(class_name);
        elm_arr = [].slice.call(elm_arr);
        for (var i = 0; i < elm_arr.length; i++) {
            remove_class(class_name, elm_arr[i]);
        }
    }
    //
    // shows or hides an element by applying a CSS class
    function show_hide(element) {
        //
        // checking if an id string was passed instead
        if (!element.nodeName) {
            element = document.getElementById(element);
        }
        //
        var hid_pat = new RegExp('(?:^|\\s)hidden-elm(?!\\S)', 'gi');
        var css = element.className || '';
        if (!(css.match(hid_pat))) {
            add_class('hidden-elm', element);
        }
        else {
            remove_class('hidden-elm', element);
        }
    }
    //
    // this toggles the textContent attribute of an element
    function toggle_textContent(element, str_1, str_2) {
        //
        if (element.textContent !== str_1) {
            element.textContent = str_1;
        }
        else {
            element.textContent = str_2;
        }
    }
    //
    // stores data on the window session object
    function store_session_data(key_value_dict) {
        //
        for (var key in key_value_dict) {
            var value = key_value_dict[key];
            window.sessionStorage.setItem(key, value);
        }
    }
    //
    // returning interface
    return {
        build_runtime_function: build_runtime_function,
        add_class: add_class,
        remove_class: remove_class,
        remove_class_all: remove_class_all,
        show_hide: show_hide,
        toggle_textContent: toggle_textContent,
        store_session_data: store_session_data
    };
}());
//
////////////////////////////////////////////////////////////////////////////////
////////////////////// Setting up the Navigation module ////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
AFW_HUB.Navigation = (function() {
    //
    // goes to the entry page template specfiying the tab clicked
    function goto_entry_page(id) {
        location.href = 'entry_page.php?tab=' + id;
    }
    //
    // goes to the content page template specfiying the tab clicked
    function goto_content_page(id) {
        location.href = 'content_page.php?tab=' + id;
    }
    //
    // handles checking permissions of a user for a tab
    function check_user_perms(page_string) {
        //
        // checking if the perm pattern exists and if not booting user
        if (!window.sessionStorage.hasOwnProperty('user_perm_pattern')) {
            document.getElementById('invalid_login').submit();
            return;
        }
        //
        var tab = page_string.split('.')[1];
        var perm_pat = window.sessionStorage.user_perm_pattern.slice(1, -1);
        perm_pat = new RegExp(perm_pat);
        //
        if (!perm_pat.test(page_string)) {
            document.getElementById(tab).remove();
        }
    }
    //
    // passes a click event to the only nav button in a container
    function click_single_button(container) {
        container = container || document.getElementById('nav-container');
        var temp = container.getElementsByTagName('BUTTON'),
            buttons = [];
        // verifying parentNode of button
        for (var i = 0; i < temp.length; i++) {
            if (temp[i].parentNode === container) { buttons.push(temp[i]);}
        }
        //
        if (buttons.length === 1) {
            buttons[0].dispatchPrimaryEvent();
            //
            return buttons[0];
        }
        return null;
    }
    //
    // parses the URL of a GET request into a key-val object
    function parse_url(url) {
        //
        // returning early if URL has no data
        url = url || document.URL;
        var data_arr = [];
        var url_data = {full_url: url};
        if (!url.match(/[?]/)) {
            url_data.base_url = url;
            return url_data;
        }
        //
        // storing root url and data string
        url_data.base_url = url.split(/[?]/)[0];
        url_data.url_data = url.split(/[?]/)[1];
        //
        // parsing data sent
        data_arr = url_data.url_data.split(/[&]/);
        for (var i = 0; i < data_arr.length; i++) {
            var name = data_arr[i].split('=')[0];
            url_data[name] = '';
            if (data_arr[i].split('=')[1]) {
                url_data[name] = data_arr[i].split('=')[1];
            }
        }
        return url_data;
    }
    //
    // builds a GET request url
    function build_url(url_data) {
        //
        url_data = Object.clone(url_data);
        //
        // testing if base url exists
        if (!url_data.hasOwnProperty('base_url')) {
            url_data.base_url = AFW_HUB.Navigation.parse_url().base_url;
        }
        //
        var url = url_data.base_url + '?';
        delete url_data.base_url;
        //
        for (var prop in url_data) {
            url += prop + '=' + url_data[prop] + '&';
        }
        url = url.replace(/&$/, '');
        //
        return url;
    }
    //
    // returning interface
    return {
        goto_entry_page: goto_entry_page,
        goto_content_page: goto_content_page,
        check_user_perms: check_user_perms,
        click_single_button: click_single_button,
        build_url: build_url,
        parse_url: parse_url
    };
}());
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////// Setting up the Ajax module //////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
AFW_HUB.Ajax = (function() {
    //
    // handles SQL quoting of a column/table string
    function sql_quote_backtick(string, ignore) {
        var quote = '`';
        ignore = ignore || {};
        string += '';
        //
        if (string === '*') { quote = '';}
        if (string.match(/[.]/) && !ignore.dot) { quote = '';}
        if (string.match(/[(].*[)]/) && !ignore.parentheses) { quote = '';}
        if (string.match(/`/) && !ignore.backticks) { quote = '';}
        //
        return quote + string + quote;
    }
    //
    // handles SQL quoting of a value string
    function sql_quote_single(string, ignore) {
        var quote = '\'';
        ignore = ignore || {};
        //
        if (typeof string !== 'string') { quote = '';}
        string += '';
        //
        if (string.match(/[(].*[)]/) && !ignore.parentheses) { quote = '';}
        if (string.match(/^@/) && !ignore.at) { quote = '';}
        if (string.match(/^NULL$/i) && !ignore.null) { quote = '';}
        //
        return quote + string + quote;
    }
    //
    // generates a sql command to be used in an ajax request
    function gen_sql(input_args) {
        //
        var sql = '',
            valid = true,
            args = AFW_HUB.get_constant('GEN_SQL_DEFAULTS');
        //
        // updating default args with input args
        Object.merge(args, input_args);
        //
        // checking for primary required arguments
        if (!args.table) {
            console.log('Error: A table is required for gen_sql');
            valid = false;
        }
        //
        // handling some command specific behavior
        if (args.cmd === 'SELECT') {
            if (!args.cols.length) { args.cols = ['*'];}
            sql = 'SELECT {cols} FROM {table} ';
        }
        else if (args.cmd === 'INSERT') {
            if (!args.cols.length) {
                console.log('No columns provided for INSERT command.');
                valid = false;
            }
            if (!args.vals.length) {
                console.log('No values provided for the INSERT command.');
                valid = false;
            }
            if (args.cols.length !== args.vals.length) {
                console.log('Error: cols and vals arrays are different lengths');
                valid = false;
            }
            sql = 'INSERT INTO {table}({cols}) VALUES ({vals}) ';
        }
        else if (args.cmd === 'UPDATE') {
            if (!args.cols.length) {
                console.log('No columns provided for UPDATE command.');
                valid = false;
            }
            if (!args.vals.length) {
                console.log('No values provided for the UPDATE command.');
                valid = false;
            }
            if (args.cols.length !== args.vals.length) {
                console.log('Error: cols and vals arrays are different lengths');
                valid = false;
            }
            if (!args.where.length) {
                console.log('No where array provided for the UPDATE command.');
                valid = false;
            }
            sql = 'UPDATE {table} SET {cols} ';
        }
        else if (args.cmd === 'DELETE') {
            if (!args.where.length) {
                console.log('No where array provided for the DELETE command.');
                valid = false;
            }
            sql = 'DELETE FROM {table} ';
        }
        else {
            valid = false;
            console.log('Invalid command provided for gen SQL function: ' + args.cmd);
        }
        if (valid === false) { return null;}
        //
        // handling quoting of table, columns and values
        var i = null;
        args.table = sql_quote_backtick(args.table);
        for (i = 0; i < args.cols.length; i++) {
            args.cols[i] = sql_quote_backtick(args.cols[i]);
        }
        for (i = 0; i < args.vals.length; i++) {
            args.vals[i] = sql_quote_single(args.vals[i]);
        }
        for (i = 0; i < args.where.length; i++) {
            args.where[i][0] = sql_quote_backtick(args.where[i][0]);
            args.where[i][2] = sql_quote_single(args.where[i][2], {parentheses: true});
        }
        for (i = 0; i < args.order_by.length; i++) {
            args.order_by[i][0] = sql_quote_backtick(args.order_by[i][0]);
        }
        //
        // shifting update command cols to be col=value
        if (args.cmd === 'UPDATE') {
            for (i = 0; i < args.cols.length; i++) {
                args.cols[i] = args.cols[i] + '=' + args.vals[i];
            }
        }
        //
        // creating initial sql statement with table, cols and vals
        sql = sql.format(args);
        //
        // adding inner join logic
        if (args.inner_join.length) {
            for (i = 0; i < args.inner_join.length; i++) {
                sql += 'INNER JOIN {} ON {}={} '.format(args.inner_join[i]);
            }
        }
        //
        // adding left join logic
        if (args.left_join.length) {
            for (i = 0; i < args.left_join.length; i++) {
                sql += 'LEFT JOIN {} ON {}={} '.format(args.left_join[i]);
            }
        }
        //
        // adding right join logic
        if (args.right_join.length) {
            for (i = 0; i < args.right_join.length; i++) {
                sql += 'RIGHT JOIN {} ON {}={} '.format(args.right_join[i]);
            }
        }
        //
        // adding where clause
        if (args.where.length) {
            sql += 'WHERE {} {} {} '.format(args.where[0]);
            for (i = 1; i < args.where.length; i++) {
                sql += 'AND {} {} {} '.format(args.where[i]);
            }
        }
        //
        // adding in group by clause
        if (args.group_by) {
            sql += 'GROUP BY {} '.format(args.group_by);
        }
        //
        // adding having clause
        if (args.having.length) {
            sql += 'HAVING ' + args.having.join(' ') + ' ';
        }
        //
        // adding order by clauses
        if (args.order_by.length) {
            sql += 'ORDER BY {} {}'.format(args.order_by[0]);
            for (i = 1; i < args.order_by.length; i++) {
                sql += ', {} {}'.format(args.order_by[i]);
            }
            sql += ' ';
        }
        //
        // adding in limit clause + args.group_by
        if (args.limit.length) {
            sql += 'LIMIT {}, {} '.format(args.limit);
        }
        //
        return sql;
    }
    //
    // handles parsing of JSON data from an async request
    function process_response(xmlhttp) {
        var response;
        //
        // parsing JSON with error handling
        try {
            response = JSON.parse(xmlhttp.responseText);
        }
        catch(err) {
            console.log(err);
            console.log(xmlhttp);
            throw new TypeError('Error parsing JSON data.');
        }
        //
        if (response.error) {
            console.log(response);
            throw new Error(response.msg);
        }
        //
        return response;
    }
    //
    // general function to send an asyncronous request
    function send_aync_request(post_data, callback) {
        //
        var xmlhttp = new XMLHttpRequest(),
            post_body = [],
            key;
        callback = callback || function() {};
        //
        // encoding post_data
        for (key in post_data) {
            post_body.push('{}={}'.format(key, encodeURIComponent(post_data[key])));
        }
        post_body = post_body.join('&');
        //
        // setting async state function
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                //
                // passing entire XML object in callback
                callback(xmlhttp);
            }
        };
        //
        // opening and sending Ajax POST request
        xmlhttp.open('POST', 'core/async_php_functions.php', true);
        xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xmlhttp.send(post_body);
    }
    //
    // performs a sql command on the database with no data return
    function exec_db(sql, callback, xmlhttp) {
        var post_data, response;
        callback = callback || function() {};
        //
        if (xmlhttp === undefined) {
            console.log(sql);
            post_data = {exec_db: true, sql: sql};
            send_aync_request(post_data, exec_db.bind(null, null, callback));
            //
            return;
        }
        //
        response = process_response(xmlhttp);
        callback(response);
    }
    //
    // performs a sql transaction on the database with no data return
    function exec_transaction(sql_arr, callback, xmlhttp) {
        var post_data, response;
        callback = callback || function() {};
        //
        if (xmlhttp === undefined) {
            console.log(sql_arr);
            sql_arr = JSON.stringify(sql_arr);
            post_data = {exec_transaction: true, sql_statements: sql_arr};
            send_aync_request(post_data, exec_transaction.bind(null, null, callback));
            //
            return;
        }
        //
        response = process_response(xmlhttp);
        callback(response);
    }
    //
    // function allowing for the return of multiple sql requests
    function fetch_db(sql_arr, name_arr, callback, xmlhttp) {
        var post_data, response, prop;
        callback = callback || function() {};
        //
        if (xmlhttp === undefined) {
            console.log(sql_arr);
            post_data = {
                fetch_db: true,
                return_names: JSON.stringify(name_arr),
                sql_statements: JSON.stringify(sql_arr)
            };
            send_aync_request(post_data, fetch_db.bind(null, null, null, callback));
            //
            return;
        }
        //
        response = process_response(xmlhttp);
        for (prop in response) {
            if (prop.match(/SQL_REQ_ERROR_MSG/i)) {
                throw new Error(response[prop]);
            }
        }
        callback(response);
    }
    //
    // returning interface
    return {
        gen_sql: gen_sql,
        exec_db: exec_db,
        exec_transaction: exec_transaction,
        fetch_db: fetch_db,
        send_aync_request: send_aync_request
    };
}());
//
var module = module || {};
(function() {
    // setting exports for nodejs
    module.exports = {};
    for (var prop in AFW_HUB) {
        module.exports[prop] = AFW_HUB[prop];
    }
}());
