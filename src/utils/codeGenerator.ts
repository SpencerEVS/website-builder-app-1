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
        let code = '// Generated JavaScript Code from Website Builder\n\n';
        
        windows.forEach((window, index) => {
            if (window.type === 'javascript' && window.jsCode) {
                code += `// Window: ${window.title}\n`;
                code += `(function() {\n`;
                code += window.jsCode.split('\n').map(line => `    ${line}`).join('\n');
                code += `\n})();\n\n`;
            }
        });

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
        // Global API functions and variables
        window.apiData = {};
        window.globalVariables = ${JSON.stringify(dataConnections?.globalVariables || {})};
        
        // Initialize API variables object (will be populated by API calls)
        window.apiVariables = {};
        ${dataConnections?.apiConnections.map(api => 
            api.variables.map(variable => 
                `window.apiVariables['${api.name}_${variable.name}'] = null; // Will be populated by API call`
            ).join('\n        ')
        ).join('\n        ')}
        
        // Copy global variables to window object
        Object.assign(window, window.globalVariables);
        
        // Make API variables available directly by variable name (initialized as null until API calls populate them)
        ${dataConnections?.apiConnections.map(api =>
            api.variables.map(variable =>
                `window['${variable.name}'] = null; // Will be populated by API call`
            ).join('\n        ')
        ).join('\n        ')}
        
        ${dataConnections?.apiConnections.filter(api => api.enabled).map(api => `
        // API Connection: ${api.name}
        let ${api.name.replace(/[^a-zA-Z0-9]/g, '')}Timer = null;
        let ${api.name.replace(/[^a-zA-Z0-9]/g, '')}LastTriggerState = null;
        
        window.fetch${api.name.replace(/[^a-zA-Z0-9]/g, '')} = async function(customArgs = {}) {
            try {
                // Build arguments from configuration
                const apiArgs = {};
                ${api.arguments.map(arg => `
                if ('${arg.name}' && '${arg.value}') {
                    apiArgs['${arg.name}'] = ${arg.type === 'variable' ? 
                        `window['${arg.value}'] || window.globalVariables['${arg.value}'] || null` : 
                        `'${arg.value}'`};
                }`).join('')}
                
                // Merge with custom arguments
                const finalArgs = Object.assign(apiArgs, customArgs);
                
                // Build URL with arguments
                let url = '${api.url}';
                const params = Object.assign(${JSON.stringify(api.params)}, finalArgs);
                
                let requestOptions = {
                    method: '${api.method}',
                    headers: ${JSON.stringify(api.headers)}
                };
                
                if ('${api.method}' === 'GET') {
                    const queryString = new URLSearchParams(params).toString();
                    url = queryString ? url + '?' + queryString : url;
                } else {
                    // For POST/PUT/PATCH, build body with additional config merged in
                    let requestBody = Object.assign({}, params);
                    ${api.additionalConfig ? `
                    // Merge additional JSON configuration into body
                    try {
                        const additionalConfig = ${api.additionalConfig};
                        if (additionalConfig && typeof additionalConfig === 'object') {
                            // Merge additional config directly into request body
                            Object.assign(requestBody, additionalConfig);
                        }
                    } catch (e) {
                        console.warn('Failed to parse additional config:', e);
                    }
                    ` : ''}
                    requestOptions.body = JSON.stringify(requestBody);
                    requestOptions.headers['Content-Type'] = 'application/json';
                }
                
                const response = await fetch(url, requestOptions);
                const data = await response.json();
                window.apiData['${api.name}'] = data;
                
                // Extract variables
                ${api.variables.map(variable => `
                try {
                    const variableValue = ${variable.jsonPath.includes('[') ? 
                        `data.${variable.jsonPath}` : 
                        `data${variable.jsonPath ? '.' + variable.jsonPath : ''}`};
                    window.${variable.name} = variableValue;
                    window.globalVariables['${variable.name}'] = variableValue;
                    window.apiVariables['${api.name}_${variable.name}'] = variableValue;
                } catch (e) {
                    console.warn('Could not extract variable ${variable.name}:', e);
                    window.${variable.name} = null;
                    window.apiVariables['${api.name}_${variable.name}'] = null;
                }`).join('')}
                
                return data;
            } catch (error) {
                console.error('API call failed for ${api.name}:', error);
                return null;
            }
        };
        
        // Set up trigger for ${api.name}
        ${api.trigger.type === 'cyclic' ? `
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
            ${dataConnections?.apiConnections.filter(api => api.enabled).map(api => `
            if (${api.name.replace(/[^a-zA-Z0-9]/g, '')}Timer) {
                clearInterval(${api.name.replace(/[^a-zA-Z0-9]/g, '')}Timer);
            }`).join('')}
        };
        
        // Start initial API calls for cyclic triggers and populate all variables on load
        setTimeout(() => {
            ${dataConnections?.apiConnections.filter(api => api.enabled).map(api => `
            window.fetch${api.name.replace(/[^a-zA-Z0-9]/g, '')}();`).join('')}
        }, 1000);
    </script>
    <div class="website-container">
`;

    windows.forEach((window, index) => {
        // Convert canvas positions to viewport positions
        const exportX = window.position.x;
        const exportY = window.position.y;
        
        htmlCode += `        <div class="window-container" style="left: ${exportX}px; top: ${exportY}px; width: ${window.size.width}px; height: ${window.size.height}px;">
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
                        const func = new Function('document', 'window', ${JSON.stringify(window.jsCode)});
                        func(sandboxDocument, sandboxProxy);
                        
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