import React, { useState, useRef, useEffect } from 'react';
import { WindowPanel as WindowPanelType, DataConnection } from '../../types';

interface WindowPanelProps {
    window: WindowPanelType;
    onUpdate: (id: string, updates: Partial<WindowPanelType>) => void;
    onDelete: (id: string) => void;
    onSelect: (id: string, event?: React.MouseEvent) => void;
    isSelected: boolean;
    isPrimary?: boolean;
    onMouseDown?: (e: React.MouseEvent, windowId: string, type: 'drag' | 'resize', direction?: string) => void;
    dataConnections?: DataConnection;
    onDataConnectionsChange?: (dataConnections: DataConnection) => void;
    onMoveWindowLayer?: (windowId: string, direction: 'up' | 'down') => void;
    maxLayer?: number;
    minLayer?: number;
}

const WindowPanel: React.FC<WindowPanelProps> = ({ 
    window, 
    onUpdate, 
    onDelete, 
    onSelect,
    isSelected,
    isPrimary = false,
    onMouseDown,
    dataConnections = { apiConnections: [], globalVariables: {} },
    onDataConnectionsChange,
    onMoveWindowLayer,
    maxLayer = 3,
    minLayer = 1
}) => {
    const [output, setOutput] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [showCodeEditor, setShowCodeEditor] = useState<boolean>(window.type !== 'javascript');
    const [showHtmlEditor, setShowHtmlEditor] = useState<boolean>(false);
    const [hasExecuted, setHasExecuted] = useState<boolean>(window.type === 'javascript');
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [headerFocused, setHeaderFocused] = useState<boolean>(false);
    const [showEditForm, setShowEditForm] = useState<boolean>(false);
    const [editTitle, setEditTitle] = useState<string>('');
    const [editDescription, setEditDescription] = useState<string>('');
    const outputRef = useRef<HTMLDivElement>(null);
    const executionRef = useRef<HTMLDivElement>(null);
    const apiPollingRef = useRef<ReturnType<typeof setInterval>[]>([]);
    // Tracks whether this component instance is still mounted.
    // All async callbacks (Promise.then, setTimeout inside executeJavaScript) check this
    // before writing to DOM or calling onDataConnectionsChange, so that a page switch
    // can't push stale state into the app or write to a detached DOM node.
    const isMountedRef = useRef<boolean>(true);
    const [isEditorFullscreen, setIsEditorFullscreen] = useState<boolean>(false);
    const [isCodeEditMode, setIsCodeEditMode] = useState<boolean>(false);
    const gfWin: any = globalThis;
    const runtimeFonts = gfWin.globalFonts || {};
    const fontFaceCSS = Object.keys(runtimeFonts)
        .filter((n: string) => runtimeFonts[n] && typeof runtimeFonts[n] === 'string' && String(runtimeFonts[n]).startsWith('data:'))
        .map((n: string) => `@font-face { font-family: "${n}"; src: url("${runtimeFonts[n]}"); }`)
        .join('\n');

    const saveAsTemplate = async () => {
        const isVisualization = window.type === 'visualization';
        const isHtml = window.type === 'html';
        
        if ((isVisualization || isHtml) && !window.content) {
            alert('No content to save!');
            return;
        }
        if (!isVisualization && !isHtml && !window.jsCode) {
            alert('No code to save!');
            return;
        }

        const defaultName = window.title || `template-${Date.now()}`;
        const templateName = defaultName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
        
        let template: any;
        if (isVisualization) {
            template = {
                name: templateName,
                description: window.description || 'Custom saved media template',
                content: window.content,
                type: 'visualization',
                saved: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                defaultSize: { width: window.size.width, height: window.size.height }
            };
        } else if (isHtml) {
            template = {
                name: templateName,
                description: window.description || 'Custom saved HTML template',
                code: window.content,
                type: 'html',
                saved: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                defaultSize: { width: window.size.width, height: window.size.height }
            };
        } else {
            template = {
                name: templateName,
                description: window.description || 'Custom saved template',
                code: window.jsCode,
                type: 'javascript',
                saved: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                defaultSize: { width: window.size.width, height: window.size.height }
            };
        }

        const fileName = `${templateName}-template.json`;
        const fileContent = JSON.stringify(template, null, 2);

        // Try File System Access API for directory selection
        try {
            // Check if the API is available
            const globalObj: any = globalThis;
            if (typeof globalObj.showSaveFilePicker === 'function') {
                console.log('Using File System Access API for directory selection');
                
                const options = {
                    suggestedName: fileName,
                    types: [{
                        description: 'JSON Template Files',
                        accept: {
                            'application/json': ['.json']
                        }
                    }]
                };

                const fileHandle = await globalObj.showSaveFilePicker(options);
                const writable = await fileHandle.createWritable();
                await writable.write(fileContent);
                await writable.close();
                
                console.log('Template saved successfully to chosen location');
                return;
            }
        } catch (error) {
            const err: any = error;
            if (err.name === 'AbortError') {
                console.log('User cancelled save dialog');
                return;
            }
            console.log('File System Access API failed, using fallback:', err.message);
        }

        // Fallback: Download to Downloads folder
        console.log('Using download fallback to Downloads folder');
        const blob = new Blob([fileContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Template saved to Downloads folder');
    };

    const editTemplate = () => {
        setEditTitle(window.title || 'My Window');
        setEditDescription(window.description || '');
        setShowEditForm(true);
    };

    const saveEdit = () => {
        onUpdate(window.id, { 
            title: editTitle.trim() || window.title || 'My Window',
            description: editDescription.trim()
        });
        setShowEditForm(false);
    };

    const cancelEdit = () => {
        setShowEditForm(false);
    };

    // Auto-execute JavaScript code when the window is first mounted or its identity changes.
    // Intentionally does NOT include window.jsCode in deps — code edits should not auto-run;
    // the user must press the Run button explicitly after editing.
    useEffect(() => {
        isMountedRef.current = true;
        if (window.type === 'javascript' && window.jsCode) {
            // Delay execution to ensure DOM is ready
            const timer = setTimeout(() => {
                executeJavaScript();
            }, 150);
            return () => {
                clearTimeout(timer);
                // Clear all polling intervals so old-page intervals don't keep firing
                apiPollingRef.current.forEach(id => clearInterval(id));
                apiPollingRef.current = [];
                isMountedRef.current = false;
            };
        }
        return () => {
            apiPollingRef.current.forEach(id => clearInterval(id));
            apiPollingRef.current = [];
            isMountedRef.current = false;
        };
    }, [window.id, window.type]);

    const executeJavaScript = () => {
        if (!window.jsCode) return;

        setError('');
        setOutput('');
        setShowCodeEditor(false);  // Hide code editor when running
        setHasExecuted(true);      // Mark as executed
        setIsCodeEditMode(false);  // Lock edit mode after running

        // Clear any previous cyclic polling intervals
        apiPollingRef.current.forEach(id => clearInterval(id));
        apiPollingRef.current = [];
        
        // Store original console.log before execution
        const originalConsoleLog = console.log;
        
        // Use setTimeout to ensure DOM has updated after state change
        setTimeout(() => {
            try {
                // Get the output container for this specific window
                const outputContainer = executionRef.current;
                if (!outputContainer) {
                    console.error('Output container not found');
                    return;
                }
                // Bail if the component unmounted between the 150ms outer timer and
                // this inner callback (e.g. the user switched pages very quickly).
                if (!isMountedRef.current) return;

                // Clear previous content
                outputContainer.innerHTML = '';
                
                // Create logs array for console interception
                const logs: string[] = [];
                
                console.log = (...args) => {
                    logs.push(args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' '));
                };

                // Create a sandboxed document-like object that operates within the window
                const sandboxDocument = {
                    createElement: (tagName: string) => {
                        return document.createElement(tagName);
                    },
                    getElementById: (id: string) => {
                        return outputContainer.querySelector(`#${id}`);
                    },
                    querySelector: (selector: string) => {
                        return outputContainer.querySelector(selector);
                    },
                    querySelectorAll: (selector: string) => {
                        return outputContainer.querySelectorAll(selector);
                    },
                    body: {
                        appendChild: (element: HTMLElement) => {
                            if (outputContainer) {
                                outputContainer.appendChild(element);
                            }
                            return element;
                        },
                        removeChild: (element: HTMLElement) => {
                            if (outputContainer && outputContainer.contains(element)) {
                                outputContainer.removeChild(element);
                            }
                            return element;
                        }
                    }
                };

                // Prepare API variables for sandbox - fetch real data from APIs
                const apiVariables: Record<string, any> = {};
                const directApiVariables: Record<string, any> = {};
                const globalVariableUpdates: Record<string, any> = {}; // Track all global variable updates

                // Helper function to substitute placeholders like {{variableName}} with actual values
                const substitutePlaceholders = (value: any, variables: Record<string, any>): any => {
                    if (typeof value !== 'string') return value;
                    return value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
                        const varValue = variables[varName];
                        return varValue !== undefined && varValue !== null ? String(varValue) : match;
                    });
                };
                
                // Function to fetch data from an API connection
                const fetchApiData = async (connection: any) => {
                    try {
                        // Build arguments from configuration
                        const apiArgs: Record<string, any> = {};
                        connection.arguments?.forEach((arg: any) => {
                            if (arg.name && arg.value) {
                                if (arg.type === 'variable') {
                                    apiArgs[arg.name] = dataConnections.globalVariables[arg.value] || null;
                                } else {
                                    apiArgs[arg.name] = arg.value;
                                }
                            }
                        });
                        
                        // Build URL and request options
                        let url = connection.url;
                        const params = { ...connection.params, ...apiArgs };
                        
                        // Substitute placeholders in headers with actual global variable values
                        const substitutedHeaders: Record<string, string> = {};
                        Object.entries(connection.headers || {}).forEach(([key, value]) => {
                            substitutedHeaders[key] = substitutePlaceholders(String(value), dataConnections.globalVariables);
                        });
                        
                        let requestOptions: RequestInit = {
                            method: connection.method,
                            headers: substitutedHeaders
                        };
                        
                        if (connection.method === 'GET') {
                            const queryString = new URLSearchParams(params).toString();
                            url = queryString ? url + '?' + queryString : url;
                        } else {
                            // Start with body from connection config (e.g. batch read variable list)
                            let bodyObj: Record<string, any> = {};
                            if (connection.body) {
                                try { 
                                    // Substitute placeholders in body string before parsing
                                    const substitutedBody = substitutePlaceholders(connection.body, dataConnections.globalVariables);
                                    bodyObj = JSON.parse(substitutedBody); 
                                } catch (e) {}
                            }
                            // Merge in any runtime params/arguments on top
                            requestOptions.body = JSON.stringify({ ...bodyObj, ...params });
                            requestOptions.headers = {
                                ...requestOptions.headers,
                                'Content-Type': 'application/json'
                            };
                        }
                        
                        const response = await fetch(url, requestOptions);
                        const data = await response.json();
                        
                        // Extract variables from response
                        connection.variables.forEach((variable: any) => {
                            try {
                                let variableValue;
                                if (variable.jsonPath) {
                                    // Handle nested paths like 'data.value' or just 'value'
                                    const pathParts = variable.jsonPath.split('.');
                                    variableValue = pathParts.reduce((obj: any, key: string) => obj?.[key], data);
                                } else {
                                    // If no path specified, use the whole response
                                    variableValue = data;
                                }
                                
                                const key = `${connection.name}_${variable.name}`;
                                apiVariables[key] = variableValue;
                                directApiVariables[variable.name] = variableValue;
                                
                                // Always add to global variables (auto-creates if doesn't exist)
                                globalVariableUpdates[variable.name] = variableValue;
                            } catch (e) {
                                console.warn(`Could not extract variable ${variable.name}:`, e);
                                const key = `${connection.name}_${variable.name}`;
                                apiVariables[key] = null;
                                directApiVariables[variable.name] = null;
                            }
                        });
                        
                        return data;
                    } catch (error) {
                        console.error(`API call failed for ${connection.name}:`, error);
                        // Set variables to null on error
                        connection.variables.forEach((variable: any) => {
                            const key = `${connection.name}_${variable.name}`;
                            apiVariables[key] = null;
                            directApiVariables[variable.name] = null;
                        });
                        return null;
                    }
                };
                
                // Kick off initial API fetches immediately (fire-and-forget).
                // We do NOT block user code on the network round-trip — the window
                // renders at once and the polling intervals keep data fresh.
                // apiVariables / directApiVariables / globalVariableUpdates are plain
                // objects that fetchApiData fills by reference as each fetch resolves.
                const enabledConnections = dataConnections.apiConnections
                    .filter((connection: any) => connection.enabled);
                const apiPromises = enabledConnections
                    .map((connection: any) => fetchApiData(connection));

                // When the initial batch of fetches finishes, push extracted values
                // back to React state so other parts of the UI see them.
                // Guard: if the component unmounted while fetches were in flight, bail.
                if (apiPromises.length > 0) {
                    Promise.all(apiPromises).then(() => {
                        if (!isMountedRef.current) return;
                        if (Object.keys(globalVariableUpdates).length > 0 && onDataConnectionsChange) {
                            const updatedGlobalVariables = { ...dataConnections.globalVariables, ...globalVariableUpdates };
                            onDataConnectionsChange({
                                ...dataConnections,
                                globalVariables: updatedGlobalVariables
                            });
                        }
                    });
                }

                // ── User code & polling run immediately, without waiting for APIs ──
                {
                
                // Bridge to the real browser window to allow navigation functions
                // @ts-ignore
                const realWin = document.defaultView || window;
                const pageFunctionsProxy: any = {};

                // Collect available page functions from the real window
                try {
                    if (realWin && typeof realWin === 'object') {
                        // @ts-ignore
                        if (realWin.pageFunctions && typeof realWin.pageFunctions === 'object') {
                            // @ts-ignore
                            Object.keys(realWin.pageFunctions).forEach((name: string) => {
                                // @ts-ignore
                                const fn = realWin[name] || realWin.pageFunctions[name];
                                if (typeof fn === 'function') {
                                    pageFunctionsProxy[name] = (...args: any[]) => fn(...args);
                                }
                            });
                        } else {
                            Object.keys(realWin).forEach((key: string) => {
                                // @ts-ignore
                                if (key.startsWith('goTo') && typeof realWin[key] === 'function') {
                                    // @ts-ignore
                                    pageFunctionsProxy[key] = (...args: any[]) => realWin[key](...args);
                                }
                            });
                        }
                    }
                } catch (err) {
                    // Swallow errors; sandbox should still work without navigation
                }

                // Create a sandboxed window object
                const sandboxWindow: Record<string, any> = {
                    alert: (message: string) => {
                        const alertDiv = document.createElement('div');
                        alertDiv.style.cssText = 'background: #fff3cd; border: 1px solid #ffeaa7; padding: 8px; margin: 5px 0; border-radius: 4px; color: #856404;';
                        alertDiv.textContent = `Alert: ${message}`;
                        if (outputContainer) {
                            outputContainer.appendChild(alertDiv);
                        }
                    },
                    console: {
                        log: (...args: any[]) => {
                            const message = args.map(arg => 
                                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                            ).join(' ');
                            logs.push(message);
                            
                            // Create a visual log output in the container immediately
                            const logDiv = document.createElement('div');
                            logDiv.style.cssText = 'background: #f8f9fa; border-left: 3px solid #007bff; padding: 4px 8px; margin: 2px 0; font-family: monospace; font-size: 11px; color: #495057;';
                            logDiv.textContent = message;
                            if (outputContainer) {
                                outputContainer.appendChild(logDiv);
                            }
                        }
                    },
                    // Navigation bridge
                    showPage: (...args: any[]) => {
                        try {
                            // @ts-ignore
                            if (realWin && typeof realWin.showPage === 'function') {
                                // @ts-ignore
                                return realWin.showPage(...args);
                            }
                            return undefined;
                        } catch (e) {
                            return undefined;
                        }
                    },
                    // @ts-ignore
                    builderPages: (realWin && realWin.builderPages) || [],
                    // Expose a dictionary like window.pageFunctions
                    pageFunctions: pageFunctionsProxy,
                    // Expose variables to the sandbox
                    globalVariables: dataConnections.globalVariables,
                    apiVariables: apiVariables,
                    // Make global variables and API variables available as window properties
                    ...dataConnections.globalVariables,
                    ...directApiVariables
                };

                // Also attach each page function directly onto sandboxWindow so templates can call window.goTo*
                try {
                    Object.entries(pageFunctionsProxy).forEach(([name, fn]) => {
                        // @ts-ignore
                        sandboxWindow[name] = fn;
                    });
                } catch (e) {}

                // Build apiConnections map so user code can call:
                //   const data = await apiConnections['MyConnection']();
                const apiConnectionsMap: Record<string, () => Promise<any>> = {};
                dataConnections.apiConnections
                    .filter((c: any) => c.enabled)
                    .forEach((c: any) => {
                        apiConnectionsMap[c.name] = () => fetchApiData(c);
                    });
                // Also expose on sandboxWindow so window.apiConnections works too
                sandboxWindow['apiConnections'] = apiConnectionsMap;

                // Execute the code with sandboxed environment
                // Only pass variables whose names are valid JS identifiers as named params;
                // others are still accessible via window.globalVariables / globalVariables.
                const isValidIdentifier = (n: string) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(n);
                const globalVarEntries = Object.entries(dataConnections.globalVariables).filter(([k]) => isValidIdentifier(k));
                const globalVarNames = globalVarEntries.map(([k]) => k);
                const globalVarValues = globalVarEntries.map(([, v]) => v);
                const apiVarEntries = Object.entries(directApiVariables).filter(([k]) => isValidIdentifier(k));
                const apiVarNames = apiVarEntries.map(([k]) => k);
                const apiVarValues = apiVarEntries.map(([, v]) => v);
                
                const allParamNames = ['document', 'window', 'process', 'globalVariables', 'apiVariables', 'apiConnections', ...globalVarNames, ...apiVarNames];
                const sandboxProcess = { env: { NODE_ENV: 'production' } };
                const allParamValues = [sandboxDocument, sandboxWindow, sandboxProcess, dataConnections.globalVariables, directApiVariables, apiConnectionsMap, ...globalVarValues, ...apiVarValues];
                
                // Set up error handler for async errors (event listeners, setTimeout, etc)
                // Only catches errors that originate from the widget's DOM container
                const handleAsyncError = (event: any) => {
                    const errorMessage = event.message || String(event);
                    console.error('Widget Error:', errorMessage);
                    
                    const outputContainer = executionRef.current;
                    if (outputContainer) {
                        const errorDiv = document.createElement('div');
                        errorDiv.style.cssText = 'background: #f8d7da; border: 1px solid #f5c6cb; padding: 8px; margin: 5px 0; border-radius: 4px; color: #721c24; font-family: monospace; font-size: 12px;';
                        errorDiv.textContent = `Widget Error: ${errorMessage}`;
                        outputContainer.appendChild(errorDiv);
                    }
                    
                    // Prevent the error from propagating
                    event.preventDefault?.();
                };
                
                // Add error event listener to catch async errors from widget DOM
                const outputContainer = executionRef.current;
                outputContainer?.addEventListener('error', handleAsyncError, true);
                
                let result: any = undefined;
                try {
                    // Use AsyncFunction so `await` works anywhere in user code
                    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                    const func = new AsyncFunction(...allParamNames, window.jsCode || '');
                    result = func(...allParamValues);
                    // Attach a .catch so unhandled async errors show up in the widget
                    if (result && typeof result.then === 'function') {
                        result.catch((asyncErr: any) => {
                            const msg = `Error: ${asyncErr instanceof Error ? asyncErr.message : String(asyncErr)}`;
                            const errDiv = document.createElement('div');
                            errDiv.style.cssText = 'background: #f8d7da; border: 1px solid #f5c6cb; padding: 8px; margin: 5px 0; border-radius: 4px; color: #721c24; font-family: monospace; font-size: 12px;';
                            errDiv.textContent = msg;
                            executionRef.current?.appendChild(errDiv);
                        });
                        result = undefined; // Don't display "Return value: [object Promise]"
                    }
                } catch (execError) {
                    // Clean up error handlers
                    outputContainer?.removeEventListener('error', handleAsyncError, true);
                    
                    // Display error in container WITHOUT re-throwing
                    const errorMessage = `Error: ${execError instanceof Error ? execError.message : String(execError)}`;
                    console.error(errorMessage);
                    
                    if (outputContainer) {
                        outputContainer.innerHTML = '';
                        const errorDiv = document.createElement('div');
                        errorDiv.style.cssText = 'background: #f8d7da; border: 1px solid #f5c6cb; padding: 8px; margin: 5px 0; border-radius: 4px; color: #721c24; font-family: monospace; font-size: 12px;';
                        errorDiv.textContent = errorMessage;
                        outputContainer.appendChild(errorDiv);
                    }
                    
                    // Restore console.log
                    console.log = originalConsoleLog;
                    
                    // Return early - don't continue execution after error
                    return;
                }
                
                // Clean up error handlers after successful execution
                outputContainer?.removeEventListener('error', handleAsyncError, true);

                // Set up automatic re-fetching for ALL enabled API connections
                // Uses the connection's configured interval, or 5000ms as default
                dataConnections.apiConnections
                    .filter((connection: any) => connection.enabled && connection.trigger?.type !== 'manual')
                    .forEach((connection: any) => {
                        const interval = connection.trigger?.interval > 0 ? connection.trigger.interval : 5000;
                        const intervalId = setInterval(() => {
                            fetchApiData(connection).catch(() => {});
                        }, interval);
                        apiPollingRef.current.push(intervalId);
                    });

                // Restore console.log
                console.log = originalConsoleLog;
                
                // If there's a return value from the function, display it
                if (result !== undefined && result !== null) {
                    const resultDiv = document.createElement('div');
                    resultDiv.style.cssText = 'background: #e8f5e8; border: 1px solid #4caf50; padding: 8px; margin: 5px 0; border-radius: 4px; font-family: monospace; font-size: 12px;';
                    resultDiv.textContent = `Return value: ${String(result)}`;
                    outputContainer?.appendChild(resultDiv);
                }
                
                // If nothing was displayed, show a success message
                if (outputContainer && outputContainer.children.length === 0) {
                    const successDiv = document.createElement('div');
                    successDiv.style.cssText = 'background: #d4edda; border: 1px solid #c3e6cb; padding: 8px; margin: 5px 0; border-radius: 4px; color: #155724; font-size: 12px;';
                    successDiv.textContent = 'Code executed successfully (no visible output)';
                    outputContainer.appendChild(successDiv);
                }
                } // end of immediate-execution block
                
                
            } catch (err) {
                // Restore console.log immediately on error
                console.log = originalConsoleLog;
                
                const errorMessage = `Error: ${err instanceof Error ? err.message : String(err)}`;
                setError(errorMessage);
                
                // Display error in the execution container
                const outputContainer = executionRef.current;
                if (outputContainer) {
                    outputContainer.innerHTML = '';
                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = 'background: #f8d7da; border: 1px solid #f5c6cb; padding: 8px; margin: 5px 0; border-radius: 4px; color: #721c24; font-family: monospace; font-size: 12px;';
                    errorDiv.textContent = errorMessage;
                    outputContainer.appendChild(errorDiv);
                }
            } finally {
                // Ensure console.log is always restored
                console.log = originalConsoleLog;
            }
        }, 100); // Delay to ensure DOM updates
    };

    const handleResize = (e: any, direction: any, ref: any) => {
        onUpdate(window.id, {
            size: {
                width: ref.offsetWidth,
                height: ref.offsetHeight
            }
        });
    };

    return (
        <div 
            className={`window-panel ${isSelected ? 'selected' : ''}`}
            style={{
                width: window.size.width,
                height: window.size.height,
                position: 'absolute',
                left: window.position.x,
                top: window.position.y,
                border: window.isOffCanvas ? '2px solid #dc3545' : (isPrimary ? '2px solid #ff9800' : (isSelected ? '2px solid #007acc' : '1px solid rgba(0,0,0,0.1)')),
                backgroundColor: window.isOffCanvas ? '#ffe6e6' : (window.type === 'visualization' || window.type === 'html' || (window.type === 'javascript' && hasExecuted && !showCodeEditor) ? 'transparent' : 'white'),
                borderRadius: '4px',
                boxShadow: window.isOffCanvas ? '0 4px 20px rgba(220,53,69,0.3)' : (isPrimary ? '0 2px 10px rgba(0,0,0,0.05)' : '0 2px 10px rgba(0,0,0,0.05)'),
                display: 'flex',
                flexDirection: 'column',
                zIndex: isSelected ? 1000 : 1,
                opacity: 1,
                transition: 'border-color 0.2s ease'
            }}
            onClick={(e) => onSelect(window.id, e)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setHeaderFocused(false); }}
        >
            {/* Layer indicator when not hovered */}
            {!isHovered && !isSelected && (
                <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    fontSize: '9px',
                    color: '#6c757d',
                    backgroundColor: 'rgba(233, 236, 239, 0.9)',
                    padding: '2px 5px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    zIndex: 5
                }}>
                    L{window.layer}
                </div>
            )}
            
            <>
                {(isHovered || isSelected) && (
                    <header 
                        className="window-header"
                        style={{
                            padding: '8px 12px',
                            backgroundColor: 'rgba(240, 240, 240, 0.95)',
                            backdropFilter: 'blur(10px)',
                            borderBottom: '1px solid rgba(204, 204, 204, 0.5)',
                            cursor: 'move',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderRadius: '4px 4px 0 0',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            zIndex: 10,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            opacity: headerFocused ? 1 : 0.2
                        }}
                        onClick={(e) => { 
                            e.stopPropagation();
                            setHeaderFocused(true);
                        }}
                        onMouseDown={(e) => {
                            if (onMouseDown) {
                                onMouseDown(e, window.id, 'drag');
                            }
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 
                                style={{ 
                                    margin: 0, 
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    color: '#007bff'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    editTemplate();
                                }}
                                title="Click to edit title and description"
                            >
                                {window.title}
                            </h3>
                            <span style={{
                                fontSize: '10px',
                                color: '#6c757d',
                                backgroundColor: '#e9ecef',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontWeight: '500'
                            }}>
                                L{window.layer}
                            </span>
                        </div>
                        {window.description && (
                            <div style={{
                                fontSize: '11px',
                                color: '#6c757d',
                                fontStyle: 'italic',
                                marginTop: '2px'
                            }}>
                                {window.description}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {window.type === 'javascript' && (
                                <>
                                    {!hasExecuted && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                executeJavaScript();
                                            }}
                                            style={{
                                                padding: '2px 6px',
                                                fontSize: '11px',
                                                backgroundColor: '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '2px',
                                                cursor: 'pointer'
                                            }}
                                            title="Run JavaScript Code"
                                        >
                                            ▶ Run
                                        </button>
                                    )}
                                    {hasExecuted && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowCodeEditor(true);
                                                setHasExecuted(false);
                                                if (executionRef.current) {
                                                    executionRef.current.innerHTML = '';
                                                }
                                                setOutput('');
                                                setError('');
                                            }}
                                            style={{
                                                padding: '2px 6px',
                                                fontSize: '11px',
                                                backgroundColor: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '2px',
                                                cursor: 'pointer'
                                            }}
                                            title="Edit Code"
                                        >
                                            📝 Edit
                                        </button>
                                    )}

                                </>
                            )}
                            {window.type === 'html' && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowHtmlEditor(!showHtmlEditor);
                                    }}
                                    style={{
                                        padding: '2px 6px',
                                        fontSize: '11px',
                                        backgroundColor: showHtmlEditor ? '#6c757d' : '#17a2b8',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '2px',
                                        cursor: 'pointer'
                                    }}
                                    title={showHtmlEditor ? 'Show Preview' : 'Edit Code'}
                                >
                                    {showHtmlEditor ? '👁 Preview' : '📝 Edit'}
                                </button>
                            )}
                            {(window.type === 'javascript' || window.type === 'html' || window.type === 'visualization') && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        saveAsTemplate();
                                    }}
                                    style={{
                                        padding: '2px 6px',
                                        fontSize: '11px',
                                        backgroundColor: '#17a2b8',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '2px',
                                        cursor: 'pointer'
                                    }}
                                    title="Save as Template File"
                                >
                                    💾 Save
                                </button>
                            )}
                            
                            {/* Layer Controls */}
                            {onMoveWindowLayer && (
                                <>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMoveWindowLayer(window.id, 'up');
                                        }}
                                        disabled={window.layer >= maxLayer}
                                        style={{
                                            padding: '2px 6px',
                                            fontSize: '11px',
                                            backgroundColor: window.layer >= maxLayer ? '#dee2e6' : '#ffc107',
                                            color: window.layer >= maxLayer ? '#6c757d' : '#212529',
                                            border: 'none',
                                            borderRadius: '2px',
                                            cursor: window.layer >= maxLayer ? 'not-allowed' : 'pointer',
                                            fontWeight: '500'
                                        }}
                                        title={`Move to Layer ${window.layer + 1} (Move Up)`}
                                    >
                                        ↑ L{window.layer + 1}
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMoveWindowLayer(window.id, 'down');
                                        }}
                                        disabled={window.layer <= minLayer}
                                        style={{
                                            padding: '2px 6px',
                                            fontSize: '11px',
                                            backgroundColor: window.layer <= minLayer ? '#dee2e6' : '#17a2b8',
                                            color: window.layer <= minLayer ? '#6c757d' : 'white',
                                            border: 'none',
                                            borderRadius: '2px',
                                            cursor: window.layer <= minLayer ? 'not-allowed' : 'pointer',
                                            fontWeight: '500'
                                        }}
                                        title={`Move to Layer ${window.layer - 1} (Move Down)`}
                                    >
                                        ↓ L{window.layer - 1}
                                    </button>
                                </>
                            )}
                            
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(window.id);
                                }}
                                style={{
                                    padding: '2px 6px',
                                    fontSize: '12px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '2px',
                                    cursor: 'pointer'
                                }}
                                title="Delete Window"
                            >
                                ×
                            </button>
                        </div>
                    </header>
                )}
                
                <div 
                    className="window-content"
                    style={{
                        flex: 1,
                        padding: (window.type === 'visualization' || window.type === 'html') ? '0' : '8px',
                        overflow: 'auto'
                    }}
                >
                    {/* Edit Form */}
                    {showEditForm && (
                        <div style={{
                            marginBottom: '15px',
                            padding: '10px',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px'
                        }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Edit Window</h4>
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }}>Title:</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '5px',
                                        fontSize: '12px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '3px',
                                        boxSizing: 'border-box'
                                    }}
                                    placeholder="Enter window title"
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }}>Description:</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '60px',
                                        padding: '5px',
                                        fontSize: '12px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '3px',
                                        resize: 'vertical',
                                        boxSizing: 'border-box'
                                    }}
                                    placeholder="Enter window description (optional)"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={saveEdit}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ✓ Save
                                </button>
                                <button
                                    onClick={cancelEdit}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ✕ Cancel
                                </button>
                            </div>
                        </div>
                    )}
                    {window.type === 'javascript' ? (
                        <div style={{ height: '100%', width: '100%' }}>
                            {showCodeEditor ? (
                                <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                                    <textarea
                                        value={window.jsCode || ''}
                                        onChange={(e) => onUpdate(window.id, { jsCode: e.target.value })}
                                        placeholder="Enter JavaScript code here..."
                                        spellCheck={false}
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                        autoComplete="off"
                                        style={{
                                            height: '100%',
                                            width: '100%',
                                            fontFamily: "Monaco, Consolas, 'Courier New', monospace",
                                            fontSize: '12px',
                                            backgroundColor: '#ffffff',
                                            color: '#212529',
                                            border: '1px solid #80bdff',
                                            padding: '8px',
                                            resize: 'none',
                                            boxSizing: 'border-box',
                                            outline: 'none',
                                            lineHeight: '1.5',
                                            cursor: 'text'
                                        }}
                                    />
                                    <button
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => { e.stopPropagation(); setIsEditorFullscreen(true); }}
                                        title="Expand editor"
                                        style={{
                                            position: 'absolute',
                                            bottom: '6px',
                                            right: '6px',
                                            padding: '2px 7px',
                                            fontSize: '11px',
                                            backgroundColor: '#ffffff',
                                            color: '#495057',
                                            border: '1px solid #ced4da',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            zIndex: 2
                                        }}
                                    >
                                        &#x26F6; Expand
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    ref={executionRef}
                                    className="js-execution-container"
                                    style={{
                                        height: '100%',
                                        width: '100%',
                                        border: 'none',
                                        padding: '0px',
                                        backgroundColor: 'transparent',
                                        overflow: 'auto',
                                        position: 'relative'
                                    }}
                                >
                                </div>
                            )}
                        </div>
                    ) : window.type === 'html' ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {showHtmlEditor && (
                                <textarea
                                    value={window.content}
                                    onChange={(e) => onUpdate(window.id, { content: e.target.value })}
                                    placeholder="Enter HTML content here..."
                                    style={{
                                        width: '100%',
                                        height: '60%',
                                        fontFamily: 'Monaco, Consolas, monospace',
                                        fontSize: '12px',
                                        border: '1px solid #ddd',
                                        padding: '8px',
                                        resize: 'none',
                                        marginBottom: '8px'
                                    }}
                                />
                            )}
                            <iframe
                                style={{
                                    border: 'none',
                                    padding: '0',
                                    height: showHtmlEditor ? '35%' : '100%',
                                    overflow: 'auto',
                                    transition: 'height 0.2s ease',
                                    width: '100%',
                                    backgroundColor: 'transparent',
                                    margin: '0'
                                }}
                                srcDoc={`<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; }
  html, body { 
    background: transparent !important; 
    width: 100%;
    height: 100%;
  }
  ${fontFaceCSS}
</style>
</head>
<body>
${window.content}
</body>
</html>`}
                                frameBorder="0"
                                title="HTML Preview"
                            />
                        </div>
                    ) : window.type === 'visualization' ? (
                        <div 
                            style={{ 
                                height: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                flexDirection: 'column',
                                border: window.content ? 'none' : '2px dashed #6f42c1',
                                borderRadius: window.content ? '0' : '8px',
                                padding: window.content ? '0' : '20px',
                                backgroundColor: window.content ? 'transparent' : '#f9f4ff',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.style.backgroundColor = '#e3f2fd';
                                e.currentTarget.style.borderColor = '#2196f3';
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                e.currentTarget.style.backgroundColor = window.content ? 'transparent' : '#f9f4ff';
                                e.currentTarget.style.borderColor = '#6f42c1';
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.style.backgroundColor = window.content ? 'transparent' : '#f9f4ff';
                                e.currentTarget.style.borderColor = '#6f42c1';
                                
                                const files = Array.from(e.dataTransfer.files);
                                if (files.length > 0 && files[0].type.startsWith('image/')) {
                                    const file = files[0];
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                        onUpdate(window.id, { 
                                            content: 'IMAGE:' + file.name + ':' + reader.result
                                        });
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                            onClick={() => {
                                if (!window.content) {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = () => {
                                        const files = input.files;
                                        if (files && files.length > 0) {
                                            const file = files[0];
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                onUpdate(window.id, { 
                                                    content: 'IMAGE:' + file.name + ':' + reader.result
                                                });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    };
                                    input.click();
                                }
                            }}
                        >
                            {window.content && window.content.startsWith('IMAGE:') ? (
                                (() => {
                                    const parts = window.content.split(':');
                                    const fileName = parts[1] || 'image';
                                    const dataUrl = parts.slice(2).join(':');
                                    
                                    return (
                                        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img
                                                src={dataUrl}
                                                alt={fileName}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'fill',
                                                    display: 'block'
                                                }}
                                            />
                                            {(isHovered || isSelected) && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '8px',
                                                    right: '8px',
                                                    display: 'flex',
                                                    gap: '4px'
                                                }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const input = document.createElement('input');
                                                            input.type = 'file';
                                                            input.accept = 'image/*';
                                                            input.onchange = () => {
                                                                const files = input.files;
                                                                if (files && files.length > 0) {
                                                                    const file = files[0];
                                                                    const reader = new FileReader();
                                                                    reader.onload = () => {
                                                                        onUpdate(window.id, { 
                                                                            content: 'IMAGE:' + file.name + ':' + reader.result
                                                                        });
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            };
                                                            input.click();
                                                        }}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '10px',
                                                            backgroundColor: isPrimary ? '#ff9800' : '#007acc',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '2px',
                                                            cursor: 'pointer'
                                                        }}
                                                        title="Change Image"
                                                    >
                                                        🔄
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onUpdate(window.id, { content: '' });
                                                        }}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '10px',
                                                            backgroundColor: '#f44336',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '2px',
                                                            cursor: 'pointer'
                                                        }}
                                                        title="Remove Image"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            )}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '8px',
                                                left: '8px',
                                                backgroundColor: 'rgba(0,0,0,0.7)',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                opacity: (isHovered || isSelected) ? 1 : 0,
                                                transition: 'opacity 0.2s ease'
                                            }}>
                                                {fileName}
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                <div style={{ textAlign: 'center', color: '#6f42c1' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
                                    <div style={{ fontSize: '16px', marginBottom: '8px', fontWeight: 'bold' }}>Media Window</div>
                                    <div style={{ fontSize: '12px', marginBottom: '16px' }}>
                                        Drag & drop images here or click to browse
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>{window.content}</div>
                    )}
                </div>

                {/* Resize Handles */}
                {(isSelected || isHovered) && (
                    <>
                        {/* Corner resize handles */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: '10px',
                                height: '10px',
                                backgroundColor: isPrimary ? '#ff9800' : '#007acc',
                                cursor: 'nw-resize',
                                borderRadius: '0 0 4px 0'
                            }}
                            onMouseDown={(e) => {
                                if (onMouseDown) {
                                    onMouseDown(e, window.id, 'resize', 'bottom-right');
                                }
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '10px',
                                height: '10px',
                                backgroundColor: isPrimary ? '#ff9800' : '#007acc',
                                cursor: 'ne-resize',
                                borderRadius: '0 0 0 4px'
                            }}
                            onMouseDown={(e) => {
                                if (onMouseDown) {
                                    onMouseDown(e, window.id, 'resize', 'bottom-left');
                                }
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: '10px',
                                height: '10px',
                                backgroundColor: isPrimary ? '#ff9800' : '#007acc',
                                cursor: 'ne-resize',
                                borderRadius: '0 4px 0 0'
                            }}
                            onMouseDown={(e) => {
                                if (onMouseDown) {
                                    onMouseDown(e, window.id, 'resize', 'top-right');
                                }
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '10px',
                                height: '10px',
                                backgroundColor: isPrimary ? '#ff9800' : '#007acc',
                                cursor: 'nw-resize',
                                borderRadius: '4px 0 0 0'
                            }}
                            onMouseDown={(e) => {
                                if (onMouseDown) {
                                    onMouseDown(e, window.id, 'resize', 'top-left');
                                }
                            }}
                        />

                        {/* Edge resize handles */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: '10px',
                                right: '10px',
                                height: '4px',
                                backgroundColor: isPrimary ? '#ff9800' : '#007acc',
                                cursor: 'ns-resize'
                            }}
                            onMouseDown={(e) => {
                                if (onMouseDown) {
                                    onMouseDown(e, window.id, 'resize', 'bottom');
                                }
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: '10px',
                                bottom: '10px',
                                right: 0,
                                width: '4px',
                                backgroundColor: isPrimary ? '#ff9800' : '#007acc',
                                cursor: 'ew-resize'
                            }}
                            onMouseDown={(e) => {
                                if (onMouseDown) {
                                    onMouseDown(e, window.id, 'resize', 'right');
                                }
                            }}
                        />
                    </>
                )}
            </>

            {/* Fullscreen code editor overlay */}
            {isEditorFullscreen && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: '#ffffff', zIndex: 99999,
                        display: 'flex', flexDirection: 'column'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 14px', backgroundColor: '#f8f9fa',
                        borderBottom: '1px solid #dee2e6', flexShrink: 0
                    }}>
                        <span style={{ color: '#495057', fontSize: '13px', fontFamily: "Monaco, Consolas, 'Courier New', monospace" }}>
                            {window.title || 'JavaScript Editor'}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => { setIsEditorFullscreen(false); executeJavaScript(); }}
                                style={{ padding: '4px 12px', fontSize: '12px', backgroundColor: '#0e639c', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                            >&#9654; Run</button>
                            <button
                                onClick={() => setIsEditorFullscreen(false)}
                                style={{ padding: '4px 12px', fontSize: '12px', backgroundColor: '#ffffff', color: '#495057', border: '1px solid #ced4da', borderRadius: '3px', cursor: 'pointer' }}
                            >&#x2715; Close</button>
                        </div>
                    </div>
                    <textarea
                        value={window.jsCode || ''}
                        onChange={(e) => onUpdate(window.id, { jsCode: e.target.value })}
                        placeholder="Enter JavaScript code here..."
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                        autoComplete="off"
                        autoFocus
                        style={{
                            flex: 1, width: '100%',
                            fontFamily: "Monaco, Consolas, 'Courier New', monospace",
                            fontSize: '13px', backgroundColor: '#ffffff', color: '#212529',
                            border: 'none', padding: '12px 16px',
                            resize: 'none', outline: 'none', lineHeight: '1.6', boxSizing: 'border-box'
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default WindowPanel;