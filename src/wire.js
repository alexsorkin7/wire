export default class Wire {
//#region Costructor
    constructor(appId) {
        let statics = ['dom','date','time','htmlBind'];
        statics.forEach(fu => {
            window[fu] = this.constructor[fu];
            this[fu] = this.constructor[fu];
        });
        this.appId = appId;
        this.__now = Date.now();
    // Listiners
        this.__listiners = [];
        this.__buttonListiners = [];
        this.__hrefListiners = [];
        this.__inputs = [];
    // local Store
        this.__changes = {};
        this.__tables = {};
        this.__fn = this.__fnDefault;
        this.__fnError = this.errorDefault;
    }
//#endregion
//#region Listen to buttons, fuExist
    ajaxListiner(className,fn,fnBefore) {
        const self = this;
        this.__listiners.push({"className":className,"fn":fn,"fnBefore":fnBefore});
    //a href lostiners
        var hrefs = document.querySelectorAll('a');
        for(let i =0; i<hrefs.length; i++) {
            if(hrefs[i].className.includes(className) && !this.__hrefListiners.includes(hrefs[i])) {
                this.__hrefListiners.push(hrefs[i]);
                hrefs[i].addEventListener('click',function () {
                    event.preventDefault();
                    if(fnBefore !== undefined) fnBefore();
                    self.ajax(hrefs[i].getAttribute('href'),fn,'GET','');
                });
            }
        }
    // Button lostiners
        let json = {};
        let action;
        let method;
        let collection;
        var buttons = document.querySelectorAll('button');
        for(let i =0; i<buttons.length; i++) {
            if(buttons[i].className.includes(className) && !this.__buttonListiners.includes(buttons[i])) {
                this.__buttonListiners.push(buttons[i]);
                buttons[i].addEventListener('click',function () {
                    event.preventDefault();
                    action = buttons[i].parentElement.action;
                    method = buttons[i].parentElement.method;
                    collection = buttons[i].parentElement.children;
                    for(let i =0; i<collection.length; i++) {
                        if(collection[i].name !== undefined && collection[i].nodeName !== 'BUTTON') {
                            json[collection[i].name] = collection[i].value;
                        }
                    }
                    if(fnBefore !== undefined) json = fnBefore(json);
                    self.ajax(action,fn,method,json);
                });
            }
        }
    //Input listiners
        let jsonInput = {};
        var inputs = document.querySelectorAll('input');
        inputs = [...document.querySelectorAll('select'),...document.querySelectorAll('textarea'),...inputs];

        for(let i = 0; i<inputs.length; i++) {
            if(inputs[i].className.includes(className) && !this.__inputs.includes(inputs[i])) {
                this.__inputs.push(inputs[i]);
                if(input.parentNode.method !== undefined) method = input.parentNode.method;
                else method = 'GET';
                if(input.parentNode.action !== undefined) action = input.parentNode.action;
                else action = '/';
                let on = 'change';
                if(input.onkeyup !== null) on = 'keyup';
                else if(input.oninput !== null) on = 'input';
                input.addEventListener(on,function () {
                    jsonInput[input.name] = input.value;
                    if(fnBefore !== undefined) jsonInput = fnBefore(jsonInput);
                    self.ajax(action,fn,method,jsonInput);
                });
            }
        }
    }
//#endregion
//#region Ajax
    ajax(url,fn = this.__fn,method = 'GET',data = '',fnError = this.errorDefault) {
        method = method.toUpperCase();
        let dataStr = '';
        for(let element in data) {
            dataStr += element + '=' + data[element] + '&';
        }
        if(method == 'GET') url = url + '?' + dataStr;
        const xhr = new XMLHttpRequest;
        xhr.open(method,url,true); //xhr.open(method, URL, [async, user, password])
        xhr.onload = () => {
            if(xhr.status >= 400) this.__fnError(xhr.response);
            else fn(this.htmlBind(xhr.response),this.appId);
            if(this.__listiners !== null && this.__listiners.length > 0) {
                this.__listiners.forEach(listiner => {
                    this.ajaxListiner(listiner.className,listiner.fn,listiner.fnBefore);
                });
            }
        }
        if(method == 'GET') xhr.send();
        else if(method == 'POST') {
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhr.send(dataStr);
        }
    }
//#endregion
//#region Default functions
    __fnDefault(data,appId) { // default function to output if restfull function doesnt exist
        let span = document.createElement("span");
        span.insertAdjacentHTML('afterbegin',data);
        if(appId !== undefined) document.getElementById(appId).insertAdjacentHTML('afterbegin',data);
        else if(document.getElementsByTagName('body')[0] !== undefined) document.getElementsByTagName('body')[0].appendChild(span);
        else document = data;
    }


    errorDefault(data) {
        let span = document.createElement("span");
        if(data.includes('<!--')) data = data.replace('<!--','');
        if(data.includes('<!doctype html>')) data = data.replace('<!doctype html>','');
        if(data.includes('<html class="theme-light">')) data = data.replace('<html class="theme-light">','<div class="theme-light">');
        if(data.includes('<body>')) data = data.replace('<body>','');
        if(data.includes('</body>')) data = data.replace('</body>','');
        if(data.includes('</html">')) data = data.replace('</html">','</div>');

        let template = `
        <button id ="errorButton"
        style = "background-color:red; color:white; padding:1rem; border-radius:10px;"
        draggable="true"
        onclick="document.getElementById('__errorWindow').style = 'display:block; width:80vw; border:solid 5px red; background-color:rgb(211,211,211,0.5);'"
        >Error</button>
        <div id="__errorWindow" style="display:none;">
            <button onclick ="this.parentElement.style = 'display:none'"
            style="color:red; font-size:2rem; position: relative;  right: -95%;">&times;</button>
            <div id="__thedata" style = "padding-left:1rem; white-space: pre-wrap; line-height:1.5rem;">
            ${data}
            </div>
            </div>
        `;
        span.insertAdjacentHTML('afterbegin',template);
        document.getElementsByTagName('body')[0].appendChild(span);
        document.getElementById('errorButton').addEventListener('dragend',function(e) {
            let dom = document.getElementById('errorButton');
            dom.style.position = 'fixed';
            dom.style.top = (event.clientY) + 'px';
            dom.style.left = (event.clientX) + 'px';
        });
    }
//#endregion
//#region Local storage
    localStore(route,fnInput,fnOutput) {
        let self = this;
        this.route = route;
        this.fnInput = fnInput;
        this.fnOutput = fnOutput;
        this.ajax(route,function(response) {
            if(typeof response == 'string') response = JSON.parse(response);
            for(let tableName in response) {
                self.__tables[tableName] = {};
                response[tableName].forEach( (record,index) => {
                    self.__tables[tableName][record.id] = response[tableName][index];
                });
            }
            if(fnInput !== undefined) fnInput(response);
        });

        if(document.getElementsByName('_token')[0] !== undefined) {
            let token = document.getElementsByName('_token')[0].value;
            document.addEventListener('mouseleave',function(){self.__saveOnLeave(route,fnOutput,token);});
            document.addEventListener('touchend',function(){self.__saveOnLeave(route,fnOutput,token);});
        } else console.log('Please add csrf token somewhere in document');
    }


    __saveOnLeave(updateRoute,fnOutput,token) {
        let self = this;
        let gap = Date.now() - self.__now;
        if(Object.keys(self.__changes).length >0 && gap>3000) {
            let data = {data:JSON.stringify(self.__changes),_token:token};
            self.ajax(updateRoute,function(response){
                response = JSON.parse(response);
                self.__changes = {};
                for(let tableName in response) {
                    for(let id in response[tableName]) {
                        if(response[tableName][id] !== 'removed') self.__tables[tableName][id] = response[tableName][id];
                    }
                    localStorage.setItem(tableName,JSON.stringify(response[tableName])); //update local storage
                }
                if(fnOutput !== undefined && typeof fnOutput == 'function') fnOutput(response);
            },'POST',data);
        }
    }
//#endregion
//#region getData createNewRecord
    getData(tableName) {
        let self = this;
        let table = {};
        let sortKey;
        for(let recordName in this.__tables[tableName]) {
            sortKey = recordName + '_id'+recordName;
            table[sortKey] = this.__tables[tableName][recordName];
        }
        let methods = ["update","remove","sort","max","min","first","where","bind","create","binds","length","lastIdInCollection","sortKey","search","includes","removeBind"];
    //Update record
        table['update'] = function(id,data) { //data = {key:newValue,key:newValue,...}
            if(self.__changes[tableName] == undefined) self.__changes[tableName] = {};
            if(self.__changes[tableName][id] == undefined) self.__changes[tableName][id] = {};
            for(let key in data) {
                for(let i in this) {
                    if(typeof this[i] == 'object') {
                        if(this[i]['id'] == id) this[i][key] = data[key];
                    }
                }
                self.__changes[tableName][id][key] = data[key]; //update changes to send
                self.__tables[tableName][id][key] = data[key]; // update table variable
                this.binds.forEach(key => {
                    let template = document.getElementById(key).outerHTML;
                    template = template.replace('display:none; ','');
                    let record = self.__tables[tableName][id];
                    let html = self.htmlBind(template,record,key);
                    document.getElementById(key+id).insertAdjacentHTML('afterend',html);
                    document.getElementById(key+id).remove();
                });
            }
            localStorage.setItem(tableName,JSON.stringify(self.__tables[tableName])); // update local storage
        }
    //Remove method
        table['remove'] = function(id) {
            if(self.__changes[tableName] == undefined) self.__changes[tableName] = {};
            if(self.__changes[tableName][id] == undefined) self.__changes[tableName][id] = 'remove';

            for(let i in this) { //remove from this collection
                if(typeof this[i] == 'object') {
                    if(this[i].id == id) delete this[i];
                }
            }
            delete self.__tables[tableName][id]; // remove from table variable
            localStorage.setItem(tableName,JSON.stringify(self.__tables[tableName])); // update local storage
        // Removing all doms bindings
            this.binds.forEach(key => {
                document.getElementById(key+id).remove();
            });
        }
    // Get first
        table['first'] = function(onpage,pageNumber) {
            if(onpage == undefined && pageNumber == undefined) {
                onpage = 0;
                pageNumber = 1;
            };
            if(onpage == undefined) onpage = 10;
            if(pageNumber == undefined) pageNumber = 1;
            let ids = self.__removeMethods(this,methods);
            let collection = {};
            let start = onpage*pageNumber - onpage;
            let end = start + onpage;
            for(start; start<end; start++) {
                if(this[ids[start]] == undefined) break;
                else collection[ids[start]] = this[ids[start]];
            }
            methods.forEach(method => {
                collection[method] = this[method];
            });
            return collection;
        }
    // Create
        table['create'] = function(data,fn,clean = true) {
            if(data.parentNode !== undefined) {
                let token = document.getElementsByName('_token')[0].value;
                let values = {};
                let button = data;
                for(let i in data.parentNode.children) {
                    if(data.parentNode.children[i].value !== undefined && data.parentNode.children[i].name !== '') {
                        values[data.parentNode.children[i].name] = data.parentNode.children[i].value;
                        if(clean && button.parentNode.children[i].name !== '_token') button.parentNode.children[i].value = '';
                    }
                }
                data = {data:JSON.stringify({
                    [tableName]:{new: values}
                }),_token:token};
            }
            let collection = this;
            let sortKey = this.sortKey;
            self.ajax(self.route,function(response) { // send ajax to server
                response = JSON.parse(response);
                self.__tables[tableName][response.id] = response; // get response and create new record in table
                localStorage.setItem(tableName,JSON.stringify(self.__tables[tableName])); // save changes to local storage
                if(fn !== undefined) fn(response);
                let key = response[sortKey] + '_id'+response.id;
                collection[key] = response;
                // console.log(response);
                // console.log(collection);
                collection = collection.sort(collection.sortKey);
                let binds = collection.binds;
                binds.forEach(bind => {
                    collection.bind(bind);
                });
                return collection;
            },'POST',data);
        }
    // Binds object
        table['binds'] = [];
    // Bind
        table['bind'] = function(domId) { //domId = template <div id="domId"></div>
            let template = document.getElementById(domId);
            let style = template.getAttribute('style');
            if(style !== null) {
                if(style.includes('display:none; ')) template.setAttribute('style', style.replace('display:none; ',''));
            }
            let html;
            let lastElementDomId = domId;
            let ids = self.__removeMethods(this,methods);
            ids.forEach(id => {
                if(document.getElementById(domId+this[id].id) == null) {
                    html = self.htmlBind(template.outerHTML,this[id],domId);
                    document.getElementById(lastElementDomId).insertAdjacentHTML('afterend',html);
                }
                lastElementDomId = domId+this[id].id;
            });
            template.setAttribute('style', 'display:none; '+template.getAttribute('style'));
            if(!this.binds.some( bind => bind == domId)) this.binds.push(domId);
        }
    //Remove Bind
        table['removeBind'] = function(domId) {
            let collection = self.__removeMethods(this,methods);
            collection.forEach(element => {
                if(document.getElementById(domId+this[element].id) !== null) {
                    document.getElementById(domId+this[element].id).remove();
                }
            });
        }
    //Where - filter collection
        table['where'] = function(key,value) { // {field:value,field:value,...}
            let collection = {};
            let ids = self.__removeMethods(this,methods);
            ids.filter( (id) => {
                if(this[id][key] == value) {
                    collection[id] = this[id];
                }
            });
            methods.forEach(method => {
                collection[method] = this[method];
            });
            return collection;
        }
    //Search
        table['search'] = function(key,value,fn = function(value) {return value;}) {
            let collection = {};
            let ids = self.__removeMethods(this,methods);
            ids.filter( (id) => {
                if(fn(this[id][key]) !== null && this[id][key].match(value) !== null) {
                    collection[id] = this[id];
                }
            });
            methods.forEach(method => {
                collection[method] = this[method];
            });
            return collection;
        }
    //Includes
        table['includes'] = function(key,value) {
            let collection = {};
            let ids = self.__removeMethods(this,methods);
            if(this[ids[0]][key] == undefined) console.log('The key is not valid');
            else {
                ids.filter( (id) => {
                    if(this[id][key].includes(value)) {
                        collection[id] = this[id];
                    }
                });
            }
            methods.forEach(method => {
                collection[method] = this[method];
            });
            return collection;
        }
    // Length
        table['length'] = self.__removeMethods(this,methods).length;
    // Sort collection
        table['sort'] = function(field,bind = false,order = 1) {
            //TODO sort id - add 0 at begin
            let ids = self.__removeMethods(this,methods);
            let newSortKey;
            let newCollection = {};
            let key;
            ids.forEach(sortKey => {
                key = this[sortKey][field]+''; //+'' for case the typof key is number
                newSortKey = key+'_id'+this[sortKey].id;
                newCollection[newSortKey] = this[sortKey];
            });
            if(bind) {
                let binds = this.binds;
                let elementId;
                binds.forEach(domId => {
                    let parentDomElement = document.getElementById(domId);
                    let lasElement = parentDomElement;
                    let elementToOrder;

                    ids = Object.keys(newCollection).sort();
                    if(order == 2) {
                        let newIds = [];
                        for(let i = ids.length-1; i>=0; i--) {
                            newIds.push(ids[i]);
                        }
                        ids = newIds;
                    }
                    ids.forEach(sortKey => {
                        elementId = domId + newCollection[sortKey].id;
                        elementToOrder = document.getElementById(elementId);
                        lasElement.insertAdjacentElement('afterend',elementToOrder);
                        lasElement = elementToOrder;
                    });
                });
            }
            methods.forEach(method => {
                newCollection[method] = this[method];
            });
            newCollection['sortKey'] = field;
            return newCollection;
        }
    //Get maximum
        table['max'] = function(field) {
            let ids = self.__removeMethods(this,methods);
            let max = this[ids[0]][field];
            for(let id in this) {
                if(this[id][field] > max) max = this[id][field];
            }
            return max;
        }
    //Get minimum
        table['min'] = function(field) {
            let ids = self.__removeMethods(this,methods);
            let min = this[ids[0]][field];
            for(let id in this) {
                if(this[id][field] < min) min = this[id][field];
            }
            return min;
        }
        table['sortKey'] = 'id';
        return table;
    }

    // createNewRecord(createRoute,tableName,data,fn) {
    //     let token = document.getElementsByName('_token')[0].value;
    //     data['tableName'] = tableName;
    //     data = {data:JSON.stringify(data),_token:token};
    //     this.ajax(createRoute,function(response) { // send ajax to server
    //         this.__tables[tableName][response.id] = response; // get response and create new record in table
    //         localStorage.setItem(tableName,JSON.stringify(this.__tables[tableName])); // save changes to local storage
    //         if(fn !== undefined) fn(response);
    //     },'POST',data);
    // }

    __removeMethods(collection,methods) {
        let ids = Object.keys(collection);
        ids.sort();
        methods.forEach(method => {
            let index = ids.indexOf(method);
            ids.splice(index, 1);
        });
        return ids;
    }
//#endregion
//#region Operate dom
    static dom(domId) {
        let places = ['beforebegin','afterbegin','beforeend','afterend'];
        let mainDom = document.getElementById(domId);
        let obj = {};
        obj.__defineGetter__('get',function() {return mainDom;});
        obj['insDom'] = (dom,place) =>  mainDom.insertAdjacentElement(places[place],dom);
        obj['insHtml'] = (html,place) => mainDom.insertAdjacentHTML(places[place],html);
        obj['insInner'] =  (text) => mainDom.innerHTML = text;
        obj['insChild'] = (dom) => mainDom.appendChild(dom);
        obj['clone'] =  () => mainDom.cloneNode(true);
        obj['remove'] =  () =>  mainDom.remove();
        obj['insProp'] =  (property,value) => mainDom.setAttribute(property,value);
        obj['addToProp'] = (property,value) => {
            let propValue = mainDom.getAttribute(property);
            propValue += value;
            mainDom.setAttribute(property,propValue);
        }
        obj['removeFromProp'] = (property,value) => {
            let propValue = mainDom.getAttribute(property);
            propValue = propValue.replace(value,'');
            mainDom.setAttribute(property,propValue);
        }
        obj['display'] = (value) => { //value = true/false
            let propValue = mainDom.getAttribute('style');
            if(propValue == null) propValue = '';
            if(value) propValue = propValue.replace('display:none;','');
            else if (!propValue.includes('display:none;')) propValue += ' display:none; ';
            mainDom.setAttribute('style',propValue);
        }
        obj['formData'] =() => {
            let collection = mainDom.children;
            let data = {};
            for(let i in collection) {
                if(collection[i].name !== undefined && collection[i].value !== undefined) {
                    data[collection[i].name] = collection[i].value;
                }
            }
            return data;
        }
        obj['bind'] = function(from,to) {
            if(from == undefined) from = 1;
            if(to == undefined) to = 1;
            let template = mainDom.outerHTML;
            if(template.includes('display:none;')) template = template.replace('display:none;','');
            let html = '';
            let itter = '';
            for(from; from<=to; from++) {
                itter = template.replace('${counter}',from);
                while(itter.includes('${counter}')) {
                    itter = itter.replace('${counter}',from);
                }
                if(document.getElementById(mainDom.id+'_'+from) !== null) document.getElementById(mainDom.id+'_'+from).remove();
                html += itter.replace(mainDom.id,mainDom.id+from);
            }

            if(window['htmlBind'] !== undefined) html = htmlBind(html);
            mainDom.insertAdjacentHTML('afterend',html);
            if(mainDom.nodeName !== 'template') this.display(false);
            //return html;
        }
        obj['replaceHtml'] = function(html) {
            while(mainDom.firstChild) mainDom.removeChild(mainDom.lastChild);
            mainDom.insertAdjacentHTML('beforeend',html);
        }
        return obj;
    }

    // static doms(key) {
    //     if(key.includes('<') && key.includes('>')) {
    //         key = key.replace('<').replace('>').trim();
    //         let collection = document.getElementsByTagName(key);
    //     } else let collection = document.getElementsByClassName(className);
    //     array.forEach(domElement => {
    //         //if has not id - give it id (except body,...)
    //         //then use dom and bind - using window[dom]?
    //     });
    // }
//#endregion
//#region Html binder
    static htmlBind(html,record,domId) {
        let nameOfField;
        let parameters = [];
        let fnBody;
        let newFu;
        let fuArray = [];
    // Bind record values
        let valuesToBind = html.match(/\$\{.*?\}/g);
        if(record !== undefined) {
            html = html.replace('id="'+domId,'id="'+domId+record.id);
            valuesToBind.forEach(valueToBind => {
                nameOfField = valueToBind.replace('${','').replace('}','').trim();
                if(record[nameOfField] !== undefined) html = html.replace(valueToBind,record[nameOfField]);
            });
        }
    // Bind variables
        valuesToBind = html.match(/\$\{.*?\}/g);
        if(valuesToBind !== null) {
            valuesToBind.forEach(valueToBind => {
                nameOfField = valueToBind.replace('${','').replace('}','').trim();
                if(window[nameOfField] !== undefined) html = html.replace(valueToBind,window[nameOfField]);
            });
        }
    // Bind arrow functions
        let arrowFunctions = html.match(/()(\()(.*?)(\))(.*?)(=>)(.*?)(\{)(.*?)(\})/g);
        let inners = html.match(/()(\()(.*?)(\))(.*?)(=&gt;)(.*?)(\{)(.*?)(\})/g);
        if(inners !== null) arrowFunctions = [...arrowFunctions,...inners];
        if(arrowFunctions !== null) {
            arrowFunctions.forEach(fu => {
                if(fu.includes('=&gt;')) fuArray = fu.split('=&gt;');
                else if(fu.includes('=>')) fuArray = fu.split('=>');
                fnBody = fuArray[1].replace('{','').replace('}','');
                newFu = new Function(parameters,fnBody);
                html = html.replace(fu,newFu(...parameters));
            });
        }
    // Bind functions with name
        let functionsTags = html.match(/()(.*)(\()(.*?)(\))/g);
        let nameOfFunction;
        let jsEvents = ['onwheel','onwaiting','onvolumechange','onunload','ontransitionend','ontouchstart','ontouchmove','ontouchend','ontouchcancel','ontoggle','ontimeupdate','onsuspend','onsubmit','onstorage','onstalled','onshow','onselect','onseeking','onseeked','onsearch','onscroll','onreset','onresize','onratechange','onprogress','onpopstate','onplaying','onplay','onpause','onpaste','onpageshow','onpagehide','onopen','ononline','onoffline','onmousewheel','onmouseup','onmouseout','onmouseover','onmousemove','onmouseleave','onmouseenter','onmousedown','onmessage','onloadstart','onloadedmetadata','onloadeddata','onload','onkeyup','onkeypress','onkeydown','oninvalid','oninput','onhashchange','onfullscreenerror','onfullscreenchange','onfocusout','onfocusin','onfocus','onerror','onended','ondurationchange','ondrop','ondragstart','ondragover','ondragleave','ondragenter','ondragend','ondrag','ondblclick','oncut','oncopy','oncontextmenu','onclick','onchange','oncanplaythrough','oncanplay','onblur','onbeforeunload','onbeforeprint','onanimationstart','onanimationiteration','onanimationend','onafterprint','onabort'];
        if(functionsTags !== null) {
            functionsTags.forEach((fu,index) => {
                jsEvents.forEach(event => {
                    if(fu.includes(event)) { // Filter all functions with event
                        let expression = `(\w*(${event})\w*)=\"(.*)`;
                        let reg = new RegExp(expression,"g");
                        fu = fu.replace(fu.match(reg)[0],'')
                        functionsTags[index] = fu;
                    }
                });
                if(fu.match(/()(\w*\w)(\()(.*?)(\))/g) !== null) {
                    fu = fu.match(/()(\w*\w)(\()(.*?)(\))/g)[0];
                    functionsTags[index] = fu;
                    nameOfFunction = fu.split('(')[0];
                    parameters = fu.replace(nameOfFunction,'').replace('(','').replace(')','').split(',');
                    parameters.forEach((parameter,index) => {
                        if(window[parameter] !== undefined) parameters[index] = window[parameter];
                    });
                    if(window[nameOfFunction] !== undefined) html = html.replace(fu,window[nameOfFunction](...parameters));
                    else html.replace(fu,'');
                } else delete functionsTags[index];
            });
        }
    //${variable} window[variable] = undefined - Set function with binding
        let fuBinds = html.match(/<(.*)\n?(.*?)\$\{.*\}\n?(.*)\n?(.*?)\n?(.*?)<?\/?(.*?)>/g);
        let id;
        let props;
        let inner;
        let domElement;
        let elementName;
        let elementValue;
        let propToBind;
        let propObj = {};
        let original;
        if(fuBinds !== null) {
            fuBinds.forEach(fuBind => {
                //Create dom element
                domElement = document.createRange().createContextualFragment(fuBind.trim('"')).firstChild;
            //Get or create Id
                if(domElement.id == '') {
                    id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 7);
                    id +=id;
                    domElement.setAttribute('id',id);
                } else id = domElement.id;
        //Create object with prop,value and context
                props = domElement.attributes;
                for(let prop in props) {
                    if(props[prop].value !== undefined && props[prop].value.includes('${')) {
                        propToBind = props[prop].value;
                        props[prop].value.match(/\$\{.*?\}/g).forEach(element => {
                            elementValue = '';
                            original = element;
                            element = element.replace('${','').replace('}','').trim();
                            if(element.split('=').length >1) {
                                elementName = element.split('=')[0].trim();
                                elementValue = element.split('=')[1].trim().replace("'",'').replace("'",'');
                                if(window[elementName] !== undefined) elementValue = window[elementName];
                            } else elementName = element;
                            if(propObj[elementName] == undefined) propObj[elementName] = {};
                            propObj[elementName][props[prop].name] = domElement.attributes[props[prop].name].textContent.replace(element.split('=')[1],'').replace('=','');
                            if(propObj[elementName]['value'] == undefined) propObj[elementName]['value'] = elementValue;
                            else elementValue = propObj[elementName]['value'];
                            propToBind = propToBind.replace(original,elementValue);
                        });
                        domElement.setAttribute(props[prop].nodeName,propToBind);
                    }
                }
                inner = domElement.innerHTML;
                if(inner.length > 1 && inner.match(/\$\{.*?\}/g)) {
                    propToBind = inner;
                    inner.match(/\$\{.*?\}/g).forEach(element => {
                        elementValue = '';
                        original = element;
                        element = element.replace('${','').replace('}','').trim();
                        if(element.split('=').length >1) {
                            elementName = element.split('=')[0].trim();
                            elementValue = element.split('=')[1].trim().replace("'",'').replace("'",'');
                            if(window[elementValue] !== undefined) elementValue = window[elementValue];
                        } else elementName = element;
                        if(propObj[elementName] == undefined) propObj[elementName] = {};
                        propObj[elementName]['innerHTML'] = inner.replace(element.split('=')[1],'').replace('=','');
                        if(propObj[elementName]['value'] == undefined) propObj[elementName]['value'] = elementValue;
                        else elementValue = propObj[elementName]['value'];
                        propToBind = propToBind.replace(original,elementValue);
                    });
                    domElement.innerHTML = propToBind;
                }
                html = html.replace(fuBind,domElement.outerHTML);
                window['__domBindsObject__'] = propObj;

                let variablesToBind;
                for(let variable in propObj) {
        // Function to bind to each prop
                    window[variable] = function(value) {
                        if(value !== undefined) {
                            let domElement = document.getElementById(id);
                            __domBindsObject__[variable]['value'] = value;
                            let propValue;
                            let propToBind;
                            for(let prop in __domBindsObject__[variable]) {
                                variablesToBind = __domBindsObject__[variable][prop].match(/\$\{.*?\}/g);
                                if(variablesToBind !== null) {
                                    propToBind = __domBindsObject__[variable][prop];
                                    variablesToBind.forEach(element => {
                                        if(__domBindsObject__[element.replace('${','').replace('}','').trim()] !== undefined) {
                                            propValue = __domBindsObject__[element.replace('${','').replace('}','').trim()].value;
                                            propToBind = propToBind.replace(element,propValue);
                                        }
                                    });
                                }
                                if(prop !== value) {
                                    if(prop == 'innerHTML') domElement.innerHTML = propToBind;
                                    else domElement.setAttribute(prop,propToBind);
                                }
                            }
                        }
                        return __domBindsObject__[variable].value;
                    }
                }
            });
        }
        return html;
    }

    // __createVar(response,result) {
    //     let variableName = result.match(/\$\{.*?\}/g)[0].replace('${','').replace('}',''); // getting data of variable
    //     let variableData = result.replace('${'+variableName+'}','').replace('=','').trim();
    //     variableData = variableData.replace(/&quot;/g,'"');
    //     variableData = variableData.replace(/;/g,'');
    //     if(variableData.startsWith('[') || variableData.startsWith('{')) variableData = JSON.parse(variableData);
    //     this.__variables[variableName] = variableData;
    //     window[variableName] =  variableData; // Creates global variables
    //     response = response.replace(result,''); // remove variable definition from response
    //     return response;
    // }

//#endregion
}
