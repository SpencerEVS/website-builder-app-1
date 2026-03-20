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

    const outputRef = useRef<HTMLDivElement>(null);
    const executionRef = useRef<HTMLDivElement>(null);
    const apiPollingRef = useRef<ReturnType<typeof setInterval>[]>([]);
    // Holds the currently-registered unhandledrejection listener so it can be
    // removed when the widget re-runs or the component unmounts.
    const unhandledRejectionHandlerRef = useRef<((e: PromiseRejectionEvent) => void) | null>(null);
    const uncaughtErrorHandlerRef = useRef<((e: ErrorEvent) => void) | null>(null);
    // Tracks whether this component instance is still mounted.
    // All async callbacks (Promise.then, setTimeout inside executeJavaScript) check this
    // before writing to DOM or calling onDataConnectionsChange, so that a page switch
    // can't push stale state into the app or write to a detached DOM node.
    const isMountedRef = useRef<boolean>(true);
    // Always holds the latest dataConnections prop so async callbacks (setInterval, etc)
    // that outlive the initial render can see newly-loaded/enabled connections.
    const dataConnectionsRef = useRef(dataConnections);
    useEffect(() => { dataConnectionsRef.current = dataConnections; }, [dataConnections]);
    // ONE shared globalVariables object on globalThis so every sandbox reads/writes
    // the same reference — cross-window updates are visible instantly without a re-render.
    const gThis: any = globalThis;
    if (!gThis._hmiGlobalVars) gThis._hmiGlobalVars = {};
    Object.assign(gThis._hmiGlobalVars, dataConnections.globalVariables);
    const sandboxGlobalVarsRef = useRef<Record<string, any>>(gThis._hmiGlobalVars);
    useEffect(() => {
        Object.assign(gThis._hmiGlobalVars, dataConnections.globalVariables);
        sandboxGlobalVarsRef.current = gThis._hmiGlobalVars;
    }, [dataConnections.globalVariables]);
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
                if (unhandledRejectionHandlerRef.current) {
                    globalThis.removeEventListener('unhandledrejection', unhandledRejectionHandlerRef.current);
                    unhandledRejectionHandlerRef.current = null;
                }
                if (uncaughtErrorHandlerRef.current) {
                    globalThis.removeEventListener('error', uncaughtErrorHandlerRef.current);
                    uncaughtErrorHandlerRef.current = null;
                }
                isMountedRef.current = false;
            };
        }
        return () => {
            apiPollingRef.current.forEach(id => clearInterval(id));
            apiPollingRef.current = [];
            if (unhandledRejectionHandlerRef.current) {
                globalThis.removeEventListener('unhandledrejection', unhandledRejectionHandlerRef.current);
                unhandledRejectionHandlerRef.current = null;
            }
            if (uncaughtErrorHandlerRef.current) {
                globalThis.removeEventListener('error', uncaughtErrorHandlerRef.current);
                uncaughtErrorHandlerRef.current = null;
            }
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
        // Remove any previously-registered unhandledrejection listener from a prior run
        if (unhandledRejectionHandlerRef.current) {
            globalThis.removeEventListener('unhandledrejection', unhandledRejectionHandlerRef.current);
            unhandledRejectionHandlerRef.current = null;
        }
        if (uncaughtErrorHandlerRef.current) {
            globalThis.removeEventListener('error', uncaughtErrorHandlerRef.current);
            uncaughtErrorHandlerRef.current = null;
        }
        
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
                    // Always use the live ref so stale closure doesn't read/write a detached object
                    const liveConnections = dataConnectionsRef.current;
                    // sandboxGlobalVarsRef.current is the most up-to-date variable store:
                    // it receives direct sandbox writes AND is updated by every fetchApiData call.
                    const liveVars = sandboxGlobalVarsRef.current;
                    try {
                        // Build arguments from configuration
                        const apiArgs: Record<string, any> = {};
                        connection.arguments?.forEach((arg: any) => {
                            if (arg.name && arg.value) {
                                if (arg.type === 'variable') {
                                    apiArgs[arg.name] = liveVars[arg.value] || null;
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
                            substitutedHeaders[key] = substitutePlaceholders(String(value), liveVars);
                        });
                        // Debug: log any header that still contains unsubstituted {{...}} placeholders
                        const unsubstituted = Object.entries(substitutedHeaders).filter(([, v]) => /\{\{/.test(v));
                        if (unsubstituted.length > 0) {
                            console.warn(`[fetchApiData:${connection.name}] Unsubstituted placeholders in headers:`, unsubstituted, '| liveVars keys:', Object.keys(liveVars));
                        } else {
                            console.debug(`[fetchApiData:${connection.name}] Headers OK, liveVars keys:`, Object.keys(liveVars));
                        }
                        
                        let requestOptions: RequestInit = {
                            method: connection.method,
                            headers: substitutedHeaders
                        };
                        
                        if (connection.method === 'GET') {
                            const queryString = new URLSearchParams(params).toString();
                            url = queryString ? url + '?' + queryString : url;
                        } else {
                            // Mirror the exact body-building logic from the test handler:
                            // - Array additionalConfig → send raw (e.g. Siemens S7 batch read)
                            // - Object additionalConfig → merge args into it
                            // - No additionalConfig → build from args only
                            const argPayload: Record<string, any> = { ...params };

                            let requestBody: string | null = null;
                            if (connection.additionalConfig) {
                                const substitutedBody = substitutePlaceholders(connection.additionalConfig, liveVars);
                                try {
                                    const parsed = JSON.parse(substitutedBody);
                                    if (Array.isArray(parsed)) {
                                        // Array body — send raw; named args ignored
                                        requestBody = substitutedBody;
                                    } else {
                                        // Object body — merge args in (args override additionalConfig keys)
                                        requestBody = JSON.stringify({ ...parsed, ...argPayload });
                                    }
                                } catch (e) {
                                    // Not valid JSON — send raw string as-is
                                    requestBody = substitutedBody;
                                }
                            } else if (Object.keys(argPayload).length > 0) {
                                requestBody = JSON.stringify(argPayload);
                            }

                            if (requestBody !== null) {
                                requestOptions.body = requestBody;
                                requestOptions.headers = {
                                    ...requestOptions.headers,
                                    // Auto-add Content-Type only if not already specified
                                    ...(!substitutedHeaders['Content-Type'] && { 'Content-Type': 'application/json' })
                                };
                            }
                        }
                        
                        const response = await fetch(url, requestOptions);
                        const data = await response.json();
                        
                        // Extract variables from response and push to React state immediately.
                        // Write to sandboxGlobalVarsRef.current (stable, never-replaced object that
                        // the sandbox holds a reference to) so the sandbox sees updates instantly.
                        // Also call onDataConnectionsChange after every fetch so the DataConnections
                        // panel and other UI always reflects current values.
                        const updatedGlobalVariables = { ...liveVars };
                        let anyExtracted = false;

                        connection.variables.forEach((variable: any) => {
                            try {
                                let variableValue: any;
                                const jp = variable.jsonPath;
                                if (jp !== undefined && jp !== null && jp !== '') {
                                    // Walk the path — numeric string segments index into arrays
                                    const pathParts = String(jp).split('.');
                                    variableValue = pathParts.reduce((obj: any, key: string) => {
                                        if (obj === undefined || obj === null) return undefined;
                                        // Try numeric index first so arrays work with '0', '1', etc.
                                        const idx = Number(key);
                                        return Number.isInteger(idx) && Array.isArray(obj)
                                            ? obj[idx]
                                            : obj[key];
                                    }, data);
                                } else {
                                    variableValue = data;
                                }
                                
                                const key = `${connection.name}_${variable.name}`;
                                apiVariables[key] = variableValue;
                                directApiVariables[variable.name] = variableValue;
                                updatedGlobalVariables[variable.name] = variableValue;
                                // Write into the stable sandbox object so sandbox reads it immediately
                                sandboxGlobalVarsRef.current[variable.name] = variableValue;
                                globalVariableUpdates[variable.name] = variableValue;
                                anyExtracted = true;
                            } catch (e) {
                                console.warn(`Could not extract variable ${variable.name}:`, e);
                                const key = `${connection.name}_${variable.name}`;
                                apiVariables[key] = null;
                                directApiVariables[variable.name] = null;
                                // Mark as failure if variable extraction fails
                                if (connection.failureVariable) {
                                    updatedGlobalVariables[connection.failureVariable] = false;
                                    sandboxGlobalVarsRef.current[connection.failureVariable] = false;
                                    globalVariableUpdates[connection.failureVariable] = false;
                                }
                            }
                        });

                        // Set failure variable to true on successful API call
                        if (connection.failureVariable) {
                            updatedGlobalVariables[connection.failureVariable] = true;
                            sandboxGlobalVarsRef.current[connection.failureVariable] = true;
                            globalVariableUpdates[connection.failureVariable] = true;
                        }

                        // Push to React state so DataConnections panel and other components
                        // see the updated values (guards: still mounted, callback exists)
                        if (anyExtracted && isMountedRef.current && onDataConnectionsChange) {
                            onDataConnectionsChange({
                                ...liveConnections,
                                globalVariables: updatedGlobalVariables
                            });
                        }
                        
                        return data;
                    } catch (error) {
                        console.error(`API call failed for ${connection.name}:`, error);
                        // Set failure variable to false on error
                        if (connection.failureVariable) {
                            sandboxGlobalVarsRef.current[connection.failureVariable] = false;
                            globalVariableUpdates[connection.failureVariable] = false;
                        }
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
                // Each fetchApiData call now calls onDataConnectionsChange itself,
                // so no separate Promise.all flush is needed.
                const enabledConnections = dataConnections.apiConnections
                    .filter((connection: any) => connection.enabled);
                enabledConnections.forEach((connection: any) => fetchApiData(connection));

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
                // The Proxy resolves each connection LAZILY from dataConnectionsRef.current
                // so setInterval callbacks that fire after initial load will find connections
                // that weren't enabled/available when the widget first ran.
                const _proxyTarget: any = {};
                const apiConnectionsMap = new Proxy(_proxyTarget, {
                    get(_target: any, prop: string | symbol) {
                        const key = typeof prop === 'symbol' ? String(prop) : prop;
                        // skip internal JS engine checks
                        if (key === 'then' || key === 'catch' || key === 'finally') return undefined;
                        const live = dataConnectionsRef.current.apiConnections
                            .find((c: any) => c.enabled && c.name === key);
                        if (live) return () => fetchApiData(live);
                        return () => {
                            console.warn(`apiConnections['${key}'] is not available (connection not enabled or name mismatch).`);
                            return Promise.resolve(null);
                        };
                    }
                });
                // Also expose on sandboxWindow so window.apiConnections works too
                sandboxWindow['apiConnections'] = apiConnectionsMap;

                // Execute the code with sandboxed environment
                // Only pass variables whose names are valid JS identifiers as named params;
                // others are still accessible via window.globalVariables / globalVariables.
                // Use sandboxGlobalVarsRef.current — the stable object that fetchApiData writes to
                // and the sandbox holds a reference to, so live mutations are always visible.
                const isValidIdentifier = (n: string) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(n);
                const globalVarEntries = Object.entries(sandboxGlobalVarsRef.current).filter(([k]) => isValidIdentifier(k));
                const globalVarNames = globalVarEntries.map(([k]) => k);
                const globalVarValues = globalVarEntries.map(([, v]) => v);
                const apiVarEntries = Object.entries(directApiVariables).filter(([k]) => isValidIdentifier(k));
                const apiVarNames = apiVarEntries.map(([k]) => k);
                const apiVarValues = apiVarEntries.map(([, v]) => v);
                
                const allParamNames = ['document', 'window', 'process', 'globalVariables', 'apiVariables', 'apiConnections', ...globalVarNames, ...apiVarNames];
                const sandboxProcess = { env: { NODE_ENV: 'production' } };
                const allParamValues = [sandboxDocument, sandboxWindow, sandboxProcess, sandboxGlobalVarsRef.current, directApiVariables, apiConnectionsMap, ...globalVarValues, ...apiVarValues];
                
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

                // Catch unhandled promise rejections from setInterval(async()=>{}) and similar.
                // These never reach result.catch() because they are separate promise chains.
                // event.preventDefault() stops the browser from treating this as a fatal error.
                const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
                    event.preventDefault(); // suppress browser freeze / console error overlay
                    if (!isMountedRef.current) return;
                    const container = executionRef.current;
                    if (!container) return;
                    const msg = `Async Error: ${event.reason instanceof Error ? event.reason.message : String(event.reason)}`;
                    console.warn('Widget unhandled rejection (suppressed):', msg);
                    // Deduplicate — find existing box with same message and bump counter instead
                    const existing = Array.from(container.querySelectorAll<HTMLElement>('[data-widget-err]'))
                        .find(el => el.dataset.widgetErrMsg === msg);
                    if (existing) {
                        const n = parseInt(existing.dataset.widgetErrCount || '1', 10) + 1;
                        existing.dataset.widgetErrCount = String(n);
                        existing.textContent = `${msg} (×${n})`;
                        return;
                    }
                    const errDiv = document.createElement('div');
                    errDiv.style.cssText = 'background: #fff3cd; border: 1px solid #ffc107; padding: 8px; margin: 5px 0; border-radius: 4px; color: #856404; font-family: monospace; font-size: 12px;';
                    errDiv.textContent = msg;
                    errDiv.dataset.widgetErr = '1';
                    errDiv.dataset.widgetErrMsg = msg;
                    errDiv.dataset.widgetErrCount = '1';
                    container.appendChild(errDiv);
                };
                globalThis.addEventListener('unhandledrejection', handleUnhandledRejection);
                unhandledRejectionHandlerRef.current = handleUnhandledRejection;

                // Catch synchronous errors thrown inside setInterval(()=>{}) / setTimeout(()=>{})
                // (non-async callbacks — these become global ErrorEvents, not promise rejections)
                const handleUncaughtError = (event: ErrorEvent) => {
                    event.preventDefault(); // suppress browser freeze
                    if (!isMountedRef.current) return;
                    const container = executionRef.current;
                    if (!container) return;
                    const msg = `Error: ${event.message || String(event)}`;
                    console.warn('Widget uncaught error (suppressed):', msg);
                    // Deduplicate
                    const existing = Array.from(container.querySelectorAll<HTMLElement>('[data-widget-err]'))
                        .find(el => el.dataset.widgetErrMsg === msg);
                    if (existing) {
                        const n = parseInt(existing.dataset.widgetErrCount || '1', 10) + 1;
                        existing.dataset.widgetErrCount = String(n);
                        existing.textContent = `${msg} (×${n})`;
                        return;
                    }
                    const errDiv = document.createElement('div');
                    errDiv.style.cssText = 'background: #f8d7da; border: 1px solid #f5c6cb; padding: 8px; margin: 5px 0; border-radius: 4px; color: #721c24; font-family: monospace; font-size: 12px;';
                    errDiv.textContent = msg;
                    errDiv.dataset.widgetErr = '1';
                    errDiv.dataset.widgetErrMsg = msg;
                    errDiv.dataset.widgetErrCount = '1';
                    container.appendChild(errDiv);
                };
                globalThis.addEventListener('error', handleUncaughtError);
                uncaughtErrorHandlerRef.current = handleUncaughtError;

                let result: any = undefined;
                try {
                    // Use AsyncFunction so `await` works anywhere in user code
                    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                    
                    // Wrap user code in try/catch to prevent page freeze
                    // This catches errors in setInterval, setTimeout, promises, etc.
                    const wrappedCode = `
try {
${window.jsCode || ''}
} catch (e) {
    console.error('User code error:', e);
    throw e;
}
`;
                    const func = new AsyncFunction(...allParamNames, wrappedCode);
                    result = func(...allParamValues);
                    // Attach a .catch so unhandled async errors show up in the widget
                    if (result && typeof result.then === 'function') {
                        result.catch((asyncErr: any) => {
                            if (!isMountedRef.current) return; // component unmounted — don't touch DOM
                            const container = executionRef.current;
                            if (!container) return;
                            const msg = `Error: ${asyncErr instanceof Error ? asyncErr.message : String(asyncErr)}`;
                            const errDiv = document.createElement('div');
                            errDiv.style.cssText = 'background: #f8d7da; border: 1px solid #f5c6cb; padding: 8px; margin: 5px 0; border-radius: 4px; color: #721c24; font-family: monospace; font-size: 12px;';
                            errDiv.textContent = msg;
                            container.appendChild(errDiv);
                        });
                        result = undefined; // Don't display "Return value: [object Promise]"
                    }
                } catch (execError) {
                    // Clean up error handlers
                    outputContainer?.removeEventListener('error', handleAsyncError, true);
                    globalThis.removeEventListener('unhandledrejection', handleUnhandledRejection);
                    unhandledRejectionHandlerRef.current = null;
                    globalThis.removeEventListener('error', handleUncaughtError);
                    uncaughtErrorHandlerRef.current = null;
                    
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
                // NOTE: handleUnhandledRejection stays registered for the lifetime of this widget
                // so that setInterval/setTimeout async errors are caught even after the outer function returns.

                // Set up automatic re-fetching for ALL enabled API connections
                // Uses the connection's configured interval, or 5000ms as default
                // Important: Look up connection by NAME on each tick, not by captured reference,
                // so that connection config changes (enable/disable, interval change, URL change) are reflected in real-time
                dataConnections.apiConnections
                    .filter((connection: any) => connection.enabled && connection.trigger?.type !== 'manual')
                    .forEach((connection: any) => {
                        const connectionName = connection.name;
                        const interval = connection.trigger?.interval > 0 ? connection.trigger.interval : 5000;
                        const intervalId = setInterval(() => {
                            try {
                                // Always look up the freshest connection config by name from the live ref
                                const liveConnection = dataConnectionsRef.current.apiConnections?.find(
                                    (c: any) => c && c.name === connectionName
                                );
                                // Only fetch if the connection is still enabled
                                if (liveConnection && liveConnection.enabled) {
                                    fetchApiData(liveConnection).catch(() => {});
                                }
                            } catch (e) {
                                // Silently catch any polling errors
                                console.error(`Polling error for connection "${connectionName}":`, e);
                            }
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
                                    cursor: 'grab',
                                    color: '#333'
                                }}
                                onClick={(e) => {
                                    onSelect(window.id, e);
                                }}
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
                        padding: '0',
                        overflow: 'auto'
                    }}
                >

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
                                            padding: '0',
                                            resize: 'none',
                                            boxSizing: 'border-box',
                                            outline: 'none',
                                            lineHeight: '1.5',
                                            cursor: 'text'
                                        }}
                                    />
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
                                        padding: '0',
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
<script>
// Make globalVariables available to HTML templates
window.globalVariables = ${JSON.stringify(dataConnections?.globalVariables || {})};
</script>
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