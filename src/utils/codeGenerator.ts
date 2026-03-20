import { WindowPanel, DataConnection } from '../types';

interface BackgroundConfig {
    width: number;
    height: number;
    color: string;
}

export const generateCode = (
    windows: WindowPanel[], 
    format: 'html' | 'js' | 'json' = 'html',
    backgroundConfig?: BackgroundConfig,
    dataConnections?: DataConnection
): string => {
    if (format === 'json') {
        return JSON.stringify(windows, null, 2);
    }

    if (format === 'js') {
        const bgColor = backgroundConfig?.color || '#ffffff';
        const bgWidth  = backgroundConfig?.width  || 1200;
        const bgHeight = backgroundConfig?.height || 800;

        const sortedWindows = [...windows].sort((a, b) => (a.layer || 1) - (b.layer || 1));

        // ---- Build the inner HTML for the page container ----
        let innerHtml = '';
        innerHtml += '<style>';
        innerHtml += '.wc{position:absolute;background:transparent;border:none;overflow:visible;font-family:Arial,sans-serif;}';
        innerHtml += '.wcon{padding:0;overflow:visible;display:flex;flex-direction:column;width:100%;height:100%;}';
        innerHtml += '</style>';

        sortedWindows.forEach((win, index) => {
            const x = win.position.x;
            const y = win.position.y;
            const z = win.layer || 1;
            const wrapOpen = `<div class="wc" style="left:${x}px;top:${y}px;width:${win.size.width}px;height:${win.size.height}px;z-index:${z};"><div class="wcon">`;
            const wrapClose = `</div></div>`;

            if (win.type === 'html') {
                innerHtml += `${wrapOpen}${win.content || ''}${wrapClose}`;
            } else if (win.type === 'javascript' && win.jsCode) {
                innerHtml += `${wrapOpen}<div id="_jsw_${index}" style="height:100%;width:100%;position:relative;overflow:auto;"></div>${wrapClose}`;
            } else if (win.type === 'visualization') {
                if (win.content && win.content.startsWith('IMAGE:')) {
                    const dataUrl = win.content.split(':').slice(2).join(':');
                    innerHtml += `${wrapOpen}<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;"><img src="${dataUrl}" style="max-width:100%;max-height:100%;object-fit:contain;" /></div>${wrapClose}`;
                }
            }
        });

        // ---- Generate the output script ----
        let code = '';
        code += `// ============================================================\n`;
        code += `// Generated Page Script — paste into a JS window in the builder\n`;
        code += `// Renders the full page layout with all windows and variables.\n`;
        code += `// ============================================================\n\n`;
        code += `(function() {\n`;
        code += `    // ---- 1. Build page container ----\n`;
        code += `    var _page = document.createElement('div');\n`;
        code += `    _page.style.cssText = 'position:relative;width:${bgWidth}px;height:${bgHeight}px;background:${bgColor};overflow:hidden;';\n`;
        code += `    _page.innerHTML = ${JSON.stringify(innerHtml)};\n`;
        code += `    document.body.appendChild(_page);\n\n`;

        const jsWindows = sortedWindows.filter(w => w.type === 'javascript' && w.jsCode);
        if (jsWindows.length > 0) {
            code += `    // ---- 2. Execute JavaScript windows ----\n`;

            sortedWindows.forEach((win, index) => {
                if (win.type !== 'javascript' || !win.jsCode) return;

                code += `\n    // -- JS Window: ${win.title || `Window ${index + 1}`} --\n`;
                code += `    (function() {\n`;
                code += `        try {\n`;
                code += `            var container = document.getElementById('_jsw_${index}');\n`;
                code += `            if (!container) return;\n\n`;
                code += `            // Sandboxed document scoped to this window's container\n`;
                code += `            var _sandboxDoc = {\n`;
                code += `                createElement: function(t) { return document.createElement(t); },\n`;
                code += `                getElementById: function(id) { return container.querySelector('#' + id); },\n`;
                code += `                querySelector: function(s) { return container.querySelector(s); },\n`;
                code += `                querySelectorAll: function(s) { return container.querySelectorAll(s); },\n`;
                code += `                body: {\n`;
                code += `                    appendChild: function(el) { container.appendChild(el); return el; },\n`;
                code += `                    removeChild: function(el) { if (container.contains(el)) container.removeChild(el); return el; }\n`;
                code += `                }\n`;
                code += `            };\n\n`;
                code += `            // Inherit global and API variables from the builder context\n`;
                code += `            var _gv = (typeof globalVariables !== 'undefined' ? globalVariables : {});\n`;
                code += `            var _av = (typeof apiVariables !== 'undefined' ? apiVariables : {});\n\n`;
                code += `            var _isValidId = function(n) { return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(n); };\n`;
                code += `            var _gvNames = Object.keys(_gv).filter(_isValidId);\n`;
                code += `            var _gvValues = _gvNames.map(function(k) { return _gv[k]; });\n`;
                code += `            var _avNames = Object.keys(_av).filter(_isValidId);\n`;
                code += `            var _avValues = _avNames.map(function(k) { return _av[k]; });\n\n`;
                code += `            var _params = ['document', 'window', 'globalVariables', 'apiVariables'].concat(_gvNames).concat(_avNames);\n`;
                code += `            var _vals   = [_sandboxDoc, window, _gv, _av].concat(_gvValues).concat(_avValues);\n\n`;
                code += `            var AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;\n`;
                code += `            var _fn = new AsyncFunction(..._params, ${JSON.stringify(win.jsCode)});\n`;
                code += `            var _p  = _fn(..._vals);\n`;
                code += `            if (_p && typeof _p.catch === 'function') {\n`;
                code += `                _p.catch(function(e) {\n`;
                code += `                    container.innerHTML = '<div style="color:red;font-family:monospace;padding:8px;font-size:11px;">Error: ' + e.message + '</div>';\n`;
                code += `                });\n`;
                code += `            }\n`;
                code += `        } catch(e) {\n`;
                code += `            var _c = document.getElementById('_jsw_${index}');\n`;
                code += `            if (_c) _c.innerHTML = '<div style="color:red;font-family:monospace;padding:8px;font-size:11px;">Error: ' + e.message + '</div>';\n`;
                code += `        }\n`;
                code += `    })();\n`;
            });
        }

        code += `\n})();\n`;
        return code;
    }

    // Generate HTML format
    let htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: ${backgroundConfig?.color || '#ffffff'};
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .website-container {
            position: relative;
            width: ${backgroundConfig?.width || 1200}px;
            height: ${backgroundConfig?.height || 800}px;
            background-color: ${backgroundConfig?.color || '#ffffff'};
            overflow: hidden;
        }
        .window-container {
            position: absolute;
            background: transparent;
            border: none;
            overflow: visible;
            font-family: Arial, sans-serif;
        }
        .window-content {
            padding: 0;
            overflow: visible;
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <script>
        if(typeof process==='undefined'){window.process={env:{NODE_ENV:'production'},browser:true,version:'',versions:{}}}
        // Shared live globalVariables — _hmiGlobalVars and globalVariables are the SAME object reference
        // so any API call that writes a token/value is immediately visible to all subsequent calls
        if (!window._hmiGlobalVars) window._hmiGlobalVars = {};
        Object.assign(window._hmiGlobalVars, ${JSON.stringify(dataConnections?.globalVariables || {})});
        window.globalVariables = window._hmiGlobalVars;
        window.apiData = {};
        
        // Helper: substitute {{varName}} placeholders with actual global variable values
        window.substitutePlaceholders = function(str) {
            if (typeof str !== 'string') return str;
            return str.replace(/\{\{(\w+)\}\}/g, function(match, varName) {
                var val = window.globalVariables[varName];
                return (val !== undefined && val !== null) ? String(val) : match;
            });
        };
        window.substituteInObject = function(obj) {
            if (typeof obj === 'string') return window.substitutePlaceholders(obj);
            if (Array.isArray(obj)) return obj.map(window.substituteInObject);
            if (obj && typeof obj === 'object') {
                var result = {};
                Object.keys(obj).forEach(function(k) { result[k] = window.substituteInObject(obj[k]); });
                return result;
            }
            return obj;
        };
        
        // Initialize API variables object (will be populated by API calls)
        window.apiVariables = {};
        ${(dataConnections?.apiConnections || []).map(api => 
            api.variables.map(variable => 
                `window.apiVariables['${api.name}_${variable.name}'] = null; // Will be populated by API call`
            ).join('\n        ')
        ).join('\n        ')}
        
        // Copy global variables to window object
        Object.assign(window, window.globalVariables);
        
        // Make API variables available directly by variable name (initialized as null until API calls populate them)
        ${(dataConnections?.apiConnections || []).map(api =>
            api.variables.map(variable =>
                `window['${variable.name}'] = null; // Will be populated by API call`
            ).join('\n        ')
        ).join('\n        ')}
        
        ${(dataConnections?.apiConnections || []).filter(api => api.enabled).map(api => `
        // API Connection: ${api.name}
        let ${api.name.replace(/[^a-zA-Z0-9]/g, '')}Timer = null;
        let ${api.name.replace(/[^a-zA-Z0-9]/g, '')}LastTriggerState = null;
        
        window.fetch${api.name.replace(/[^a-zA-Z0-9]/g, '')} = async function(customArgs = {}) {
            try {
                // Build arguments from configuration
                const apiArgs = {};
                var _liveVarsArgs = window._hmiGlobalVars || window.globalVariables || {};
                ${api.arguments.map(arg => `
                if ('${arg.name}' && '${arg.value}') {
                    apiArgs['${arg.name}'] = ${arg.type === 'variable' ? 
                        `_liveVarsArgs['${arg.value}'] !== undefined ? _liveVarsArgs['${arg.value}'] : null` : 
                        `'${arg.value}'`};
                }`).join('')}
                
                // Merge with custom arguments
                const finalArgs = Object.assign(apiArgs, customArgs);
                
                // Build URL with arguments
                let url = '${api.url}';
                
                // Substitute {{variableName}} placeholders in params — always use _hmiGlobalVars (live)
                var _liveVars = window._hmiGlobalVars || window.globalVariables || {};
                var _rawParams = ${JSON.stringify(api.params)};
                const substitutedParams = {};
                Object.keys(_rawParams).forEach(function(key) {
                    var val = String(_rawParams[key]);
                    substitutedParams[key] = val.replace(/\{\{(\w+)\}\}/g, function(match, varName) {
                        var varVal = _liveVars[varName];
                        return (varVal !== undefined && varVal !== null) ? String(varVal) : match;
                    });
                });
                const params = Object.assign(substitutedParams, finalArgs);
                
                // Substitute {{variableName}} placeholders in headers — always use _hmiGlobalVars (live)
                const rawHeaders = ${JSON.stringify(api.headers)};
                const substitutedHeaders = {};
                Object.keys(rawHeaders).forEach(function(key) {
                    substitutedHeaders[key] = String(rawHeaders[key]).replace(/\{\{(\w+)\}\}/g, function(match, varName) {
                        var val = _liveVars[varName];
                        return (val !== undefined && val !== null) ? String(val) : match;
                    });
                });
                
                let requestOptions = {
                    method: '${api.method}',
                    headers: substitutedHeaders
                };
                
                if ('${api.method}' === 'GET') {
                    const queryString = new URLSearchParams(params).toString();
                    url = queryString ? url + '?' + queryString : url;
                } else {
                    // Mirror fetchApiData body logic: array additionalConfig → send raw, object → merge with params
                    var _requestBody = null;
                    ${api.additionalConfig ? `
                    try {
                        // Substitute {{varName}} FIRST (before JSON.parse) — placeholders like "value": {{num}}
                        // are valid after substitution but are not valid JSON before it.
                        var _acRaw = ${JSON.stringify(api.additionalConfig)};
                        var _gv = window._hmiGlobalVars || window.globalVariables || {}; // always live
                        var _acSubstituted = _acRaw.replace(/\{\{(\w+)\}\}/g, function(m, k) {
                            var v = _gv[k];
                            return (v !== undefined && v !== null) ? String(v) : m;
                        });
                        var _ac = JSON.parse(_acSubstituted);
                        if (Array.isArray(_ac)) {
                            _requestBody = JSON.stringify(_ac);
                        } else {
                            _requestBody = JSON.stringify(Object.assign({}, _ac, params));
                        }
                    } catch(e) { console.warn('additionalConfig parse failed', e); }
                    ` : ''}
                    if (_requestBody === null && Object.keys(params).length > 0) {
                        _requestBody = JSON.stringify(params);
                    }
                    if (_requestBody !== null) {
                        requestOptions.body = _requestBody;
                        if (!substitutedHeaders['Content-Type']) {
                            requestOptions.headers['Content-Type'] = 'application/json';
                        }
                    }
                }
                
                const response = await fetch(url, requestOptions);
                const data = await response.json();
                window.apiData['${api.name}'] = data;
                
                // Extract variables using safe path traversal (handles numeric segments like '0.result')
                ${api.variables.map((variable: any) => `
                try {
                    var _pathParts = ${JSON.stringify(variable.jsonPath ? String(variable.jsonPath).split('.') : [])};
                    var variableValue = _pathParts.length === 0 ? data : _pathParts.reduce(function(obj, key) {
                        if (obj === undefined || obj === null) return undefined;
                        var idx = Number(key);
                        return (Number.isInteger(idx) && Array.isArray(obj)) ? obj[idx] : obj[key];
                    }, data);
                    window['${variable.name}'] = variableValue;
                    window.globalVariables['${variable.name}'] = variableValue;
                    if (window._hmiGlobalVars) window._hmiGlobalVars['${variable.name}'] = variableValue;
                    window.apiVariables['${api.name}_${variable.name}'] = variableValue;
                } catch (e) {
                    console.warn('Could not extract variable ${variable.name}:', e);
                    window['${variable.name}'] = null;
                    window.apiVariables['${api.name}_${variable.name}'] = null;
                }`).join('')}
                
                return data;
            } catch (error) {
                console.error('API call failed for ${api.name}:', error);
                return null;
            }
        };
        
        // Set up trigger for ${api.name}
        ${api.trigger.type === 'manual' ? `
        // Manual trigger - call window.fetch${api.name.replace(/[^a-zA-Z0-9]/g, '')}() from JS code to fetch on demand
        ` : api.trigger.type === 'cyclic' ? `
        // Cyclic trigger - every ${api.trigger.interval}ms
        ${api.name.replace(/[^a-zA-Z0-9]/g, '')}Timer = setInterval(() => {
            window.fetch${api.name.replace(/[^a-zA-Z0-9]/g, '')}();
        }, ${api.trigger.interval});
        ` : api.trigger.condition ? `
        // Conditional trigger - check variable '${api.trigger.condition.variable}'
        const check${api.name.replace(/[^a-zA-Z0-9]/g, '')}Trigger = () => {
            const currentValue = window['${api.trigger.condition.variable}'] || window.globalVariables['${api.trigger.condition.variable}'];
            const targetValue = ${typeof api.trigger.condition.value === 'string' ? `'${api.trigger.condition.value}'` : api.trigger.condition.value};
            
            let shouldTrigger = false;
            switch ('${api.trigger.condition.operator}') {
                case '==': shouldTrigger = currentValue == targetValue; break;
                case '!=': shouldTrigger = currentValue != targetValue; break;
                case '>': shouldTrigger = currentValue > targetValue; break;
                case '<': shouldTrigger = currentValue < targetValue; break;
                case '>=': shouldTrigger = currentValue >= targetValue; break;
                case '<=': shouldTrigger = currentValue <= targetValue; break;
            }
            
            if (shouldTrigger && ${api.name.replace(/[^a-zA-Z0-9]/g, '')}LastTriggerState !== shouldTrigger) {
                window.fetch${api.name.replace(/[^a-zA-Z0-9]/g, '')}();
            }
            ${api.name.replace(/[^a-zA-Z0-9]/g, '')}LastTriggerState = shouldTrigger;
        };
        
        // Check trigger every 1000ms
        ${api.name.replace(/[^a-zA-Z0-9]/g, '')}Timer = setInterval(check${api.name.replace(/[^a-zA-Z0-9]/g, '')}Trigger, 1000);
        ` : ''}
        `).join('')}
        
        // Cleanup function
        window.stopApiConnections = function() {
            ${(dataConnections?.apiConnections || []).filter(api => api.enabled).map(api => `
            if (${api.name.replace(/[^a-zA-Z0-9]/g, '')}Timer) {
                clearInterval(${api.name.replace(/[^a-zA-Z0-9]/g, '')}Timer);
            }`).join('')}
        };
        
        // Start initial API calls — only for non-manual triggers (cyclic/conditional need an initial fetch to populate variables)
        setTimeout(() => {
            ${(dataConnections?.apiConnections || []).filter(api => api.enabled && api.trigger.type !== 'manual').map(api => `
            window.fetch${api.name.replace(/[^a-zA-Z0-9]/g, '')}();`).join('')}
        }, 1000);
    </script>
    <div class="website-container">
`;

    // Sort windows by layer so lower layers render first (higher layers appear on top)
    const sortedWindows = [...windows].sort((a, b) => (a.layer || 1) - (b.layer || 1));

    sortedWindows.forEach((window, index) => {
        // Convert canvas positions to viewport positions
        const exportX = window.position.x;
        const exportY = window.position.y;
        const zIndex = window.layer || 1;
        
        htmlCode += `        <div class="window-container" style="left: ${exportX}px; top: ${exportY}px; width: ${window.size.width}px; height: ${window.size.height}px; z-index: ${zIndex};">
            <div class="window-content">
`;

        if (window.type === 'html') {
            htmlCode += `            ${window.content}\n`;
        } else if (window.type === 'javascript' && window.jsCode) {
            // Full-window execution mode for exported HTML
            htmlCode += `            <div style="height: 100%; width: 100%; position: relative; overflow: auto;" id="js-container-${index}">
                <!-- JavaScript execution will fill this entire container -->
            </div>
            <script>
                (function() {
                    try {
                        const container = document.getElementById('js-container-${index}');
                        const consoleLogs = [];
                        
                        // Clear the placeholder
                        container.innerHTML = '';
                        
                        // Create sandboxed document
                        const sandboxDocument = {
                            createElement: function(tagName) {
                                return document.createElement(tagName);
                            },
                            getElementById: function(id) {
                                return container.querySelector('#' + id);
                            },
                            querySelector: function(selector) {
                                return container.querySelector(selector);
                            },
                            querySelectorAll: function(selector) {
                                return container.querySelectorAll(selector);
                            },
                            body: {
                                appendChild: function(element) {
                                    container.appendChild(element);
                                    return element;
                                },
                                removeChild: function(element) {
                                    if (container.contains(element)) {
                                        container.removeChild(element);
                                    }
                                    return element;
                                }
                            }
                        };
                        
                        // Create sandboxed window with dynamic property access
                        const sandboxWindow = {
                            alert: function(message) {
                                const alertDiv = document.createElement('div');
                                alertDiv.style.cssText = 'background: #fff3cd; border: 1px solid #ffeaa7; padding: 8px; margin: 5px 0; border-radius: 4px; color: #856404; font-size: 12px;';
                                alertDiv.textContent = 'Alert: ' + message;
                                container.appendChild(alertDiv);
                            },
                            console: {
                                log: function() {
                                    const args = Array.prototype.slice.call(arguments);
                                    const message = args.map(function(arg) {
                                        return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
                                    }).join(' ');
                                    consoleLogs.push(message);
                                    
                                    // Create a visual log output in the container
                                    const logDiv = document.createElement('div');
                                    logDiv.style.cssText = 'background: #f8f9fa; border-left: 3px solid #007bff; padding: 4px 8px; margin: 2px 0; font-family: monospace; font-size: 11px; color: #495057;';
                                    logDiv.textContent = message;
                                    container.appendChild(logDiv);
                                }
                            },
                            // Expose variables to the sandbox (same as WindowPanel)
                            globalVariables: window.globalVariables || {},
                            apiVariables: window.apiVariables || {},
                            // Dynamic getters for page functions that get fresh references
                            get builderPages() { return window.builderPages || []; },
                            get pageFunctions() { return window.pageFunctions || {}; },
                            get showPage() { return window.showPage; }
                        };
                        
                        // Add dynamic property access for all goTo functions
                        const originalHasOwnProperty = sandboxWindow.hasOwnProperty;
                        sandboxWindow.hasOwnProperty = function(prop) {
                            if (prop.startsWith('goTo') && window[prop]) {
                                return true;
                            }
                            return originalHasOwnProperty.call(this, prop);
                        };
                        
                        // Proxy to dynamically access main window functions
                        const sandboxProxy = new Proxy(sandboxWindow, {
                            get: function(target, prop) {
                                // If it's a goTo function, get it from main window
                                if (typeof prop === 'string' && prop.startsWith('goTo') && window[prop]) {
                                    return window[prop];
                                }
                                return target[prop];
                            },
                            has: function(target, prop) {
                                if (typeof prop === 'string' && prop.startsWith('goTo') && window[prop]) {
                                    return true;
                                }
                                return prop in target;
                            },
                            ownKeys: function(target) {
                                const targetKeys = Object.getOwnPropertyNames(target);
                                const windowGoToKeys = Object.getOwnPropertyNames(window).filter(k => k.startsWith('goTo'));
                                return [...new Set([...targetKeys, ...windowGoToKeys])];
                            }
                        });
                        
                        // Execute the code with proxied sandboxed environment
                        // Build parameter list to match the builder sandbox (globalVariables, apiVariables, + each var by name)
                        var _globalVars = window.globalVariables || {};
                        var _apiVars = window.apiVariables || {};
                        var _isValidId = function(n) { return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(n); };
                        var _globalVarNames = Object.keys(_globalVars).filter(_isValidId);
                        var _globalVarValues = _globalVarNames.map(function(k) { return _globalVars[k]; });
                        var _apiVarNames = Object.keys(_apiVars).filter(_isValidId);
                        var _apiVarValues = _apiVarNames.map(function(k) { return _apiVars[k]; });
                        // Build apiConnections map — deferred lookup so fetch functions are found even if
                        // the global script partially failed; Proxy returns no-op for unknown names.
                        var _apiConnectionsBase = {};
                        ${JSON.stringify((dataConnections?.apiConnections || []).filter((a: any) => a.enabled).map((a: any) => a.name))}.forEach(function(name) {
                            var fnName = 'fetch' + name.replace(/[^a-zA-Z0-9]/g, '');
                            // Register unconditionally — check existence at call-time, not build-time
                            _apiConnectionsBase[name] = function() {
                                return typeof window[fnName] === 'function'
                                    ? window[fnName]()
                                    : Promise.resolve(null);
                            };
                        });
                        var _apiConnectionsMap = new Proxy(_apiConnectionsBase, {
                            get: function(t, prop) {
                                var key = typeof prop === 'symbol' ? String(prop) : prop;
                                if (key === 'then' || key === 'catch' || key === 'finally') return undefined;
                                return t[key] || function() { console.warn("apiConnections['" + key + "'] not available"); return Promise.resolve(null); };
                            }
                        });
                        var _allParamNames = ['document', 'window', 'globalVariables', 'apiVariables', 'apiConnections'].concat(_globalVarNames).concat(_apiVarNames);
                        var _allParamValues = [sandboxDocument, sandboxProxy, _globalVars, _apiVars, _apiConnectionsMap].concat(_globalVarValues).concat(_apiVarValues);
                        // Use AsyncFunction so await works in user code
                        var AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                        const func = new AsyncFunction(..._allParamNames, ${JSON.stringify(window.jsCode)});
                        var _p = func(..._allParamValues);
                        if (_p && typeof _p.catch === 'function') {
                            _p.catch(function(e) {
                                var c = document.getElementById('js-container-${index}');
                                if (c) c.innerHTML = '<div style="color:red;font-family:monospace;padding:10px;font-size:12px;">Error: ' + e.message + '</div>';
                            });
                        }
                        
                    } catch (error) {
                        document.getElementById('js-container-${index}').innerHTML = 
                            '<div style="color: red; font-family: monospace; padding: 10px; font-size: 12px;">Error: ' + error.message + '</div>';
                    }
                })();
            </script>
`;
        } else if (window.type === 'visualization') {
            if (window.content && window.content.startsWith('IMAGE:')) {
                // Handle media content - parse IMAGE:filename:dataUrl format
                const parts = window.content.split(':');
                const fileName = parts[1] || 'image';
                const dataUrl = parts.slice(2).join(':');
                
                htmlCode += `            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <img src="${dataUrl}" alt="${fileName}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 4px;" />
            </div>\n`;
            } else {
                htmlCode += `            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6f42c1; text-align: center;">
                <div>
                    <div style="font-size: 48px; margin-bottom: 10px;">📁</div>
                    <div style="font-size: 16px; font-weight: bold;">Media Window</div>
                    <div style="font-size: 12px;">No media content</div>
                </div>
            </div>\n`;
            }
        }

        htmlCode += `            </div>
        </div>
`;
    });

    htmlCode += `    </div>
</body>
</html>`;

    return htmlCode;
};