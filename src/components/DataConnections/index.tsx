import React, { useState, useEffect, useRef } from 'react';
import { ApiConnection, ApiVariable, ApiArgument, ApiTrigger, DataConnection } from '../../types';

// API Templates for common use cases - Full Featured Version
const apiTemplates = {
    'generic-get': {
        name: 'Generic GET Request',
        description: 'Basic GET request for retrieving data',
        url: 'https://api.example.com/data',
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        params: {},
        arguments: [
            {
                id: 'arg-1',
                name: 'id',
                type: 'static',
                value: '1',
                description: 'Resource ID to fetch'
            }
        ],
        trigger: {
            type: 'cyclic',
            interval: 30000
        },
        sampleResponse: `{
  "id": 1,
  "name": "Sample Data",
  "value": 42,
  "status": "active",
  "timestamp": "2025-10-03T10:00:00Z"
}`,
        variables: [
            { id: 'var-1', name: 'dataValue', jsonPath: 'value', type: 'number', description: 'Main data value' },
            { id: 'var-2', name: 'dataStatus', jsonPath: 'status', type: 'string', description: 'Current status' }
        ]
    },
    'generic-post': {
        name: 'Generic POST Request',
        description: 'POST request for creating/sending data',
        url: 'https://api.example.com/data',
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        params: {},
        arguments: [
            {
                id: 'arg-1',
                name: 'name',
                type: 'variable',
                value: 'userName',
                description: 'Name from global variable'
            },
            {
                id: 'arg-2',
                name: 'value',
                type: 'static',
                value: '100',
                description: 'Static value to send'
            }
        ],
        trigger: {
            type: 'conditional',
            condition: {
                variable: 'sendData',
                operator: '==',
                value: true
            }
        },
        sampleResponse: `{
  "success": true,
  "id": 123,
  "message": "Data created successfully",
  "timestamp": "2025-10-03T10:00:00Z"
}`,
        variables: [
            { id: 'var-1', name: 'postSuccess', jsonPath: 'success', type: 'boolean', description: 'Request success status' },
            { id: 'var-2', name: 'newId', jsonPath: 'id', type: 'number', description: 'ID of created resource' }
        ]
    },
    'generic-put': {
        name: 'Generic PUT Request',
        description: 'PUT request for updating existing data',
        url: 'https://api.example.com/data',
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        params: {},
        arguments: [
            {
                id: 'arg-1',
                name: 'id',
                type: 'variable',
                value: 'recordId',
                description: 'ID of record to update'
            },
            {
                id: 'arg-2',
                name: 'status',
                type: 'static',
                value: 'updated',
                description: 'New status value'
            }
        ],
        trigger: {
            type: 'conditional',
            condition: {
                variable: 'updateTrigger',
                operator: '==',
                value: true
            }
        },
        sampleResponse: `{
  "success": true,
  "updated": true,
  "id": 123,
  "message": "Data updated successfully"
}`,
        variables: [
            { id: 'var-1', name: 'updateSuccess', jsonPath: 'success', type: 'boolean', description: 'Update success status' },
            { id: 'var-2', name: 'updatedId', jsonPath: 'id', type: 'number', description: 'ID of updated resource' }
        ]
    }
};

interface DataConnectionsProps {
    dataConnections: DataConnection;
    onDataConnectionsChange: (connections: DataConnection) => void;
}

const DataConnections: React.FC<DataConnectionsProps> = ({
    dataConnections,
    onDataConnectionsChange
}) => {
    console.log('DataConnections component rendered with:', dataConnections);
    
    const [activeConnection, setActiveConnection] = useState<string | null>(null);
    const [newConnectionName, setNewConnectionName] = useState('');
    const [showAddConnection, setShowAddConnection] = useState(false);
    const [expandedResponse, setExpandedResponse] = useState<boolean>(false);
    const [testingConnection, setTestingConnection] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<Record<string, any>>({});
    const [showHeaderDropdown, setShowHeaderDropdown] = useState<Record<string, boolean>>({});
    const [importError, setImportError] = useState<string | null>(null);
    const [responseContents, setResponseContents] = useState<Record<string, any>>({});
    const [showResponsePanel, setShowResponsePanel] = useState<Record<string, boolean>>({});

    // Ref that always holds the very latest globalVariables — updated immediately in syncApiVariablesToGlobal
    // so that subsequent test calls within the same session see freshly-extracted values (e.g. token)
    // without waiting for the parent re-render cycle to complete.
    const liveGlobalVarsRef = useRef<Record<string, any>>(dataConnections.globalVariables);
    // Keep ref in sync whenever the prop changes
    liveGlobalVarsRef.current = dataConnections.globalVariables;

    // Common header options
    const commonHeaders = [
        { name: 'Accept', value: 'application/json', description: 'Specify accepted response format' },
        { name: 'Authorization', value: 'Bearer your-token-here', description: 'Authentication token' },
        { name: 'Content-Type', value: 'application/json', description: 'Request body format' },
        { name: 'User-Agent', value: 'WebHMI/1.0', description: 'Client identification' },
        { name: 'X-API-Key', value: 'your-api-key', description: 'API key authentication' },
        { name: 'Cache-Control', value: 'no-cache', description: 'Cache behavior' },
        { name: 'Accept-Encoding', value: 'gzip, deflate', description: 'Accepted encodings' },
        { name: 'Connection', value: 'keep-alive', description: 'Connection type' },
        { name: 'Origin', value: 'https://your-domain.com', description: 'Request origin' },
        { name: 'Referer', value: 'https://your-domain.com', description: 'Referring page' },
        { name: 'X-Requested-With', value: 'XMLHttpRequest', description: 'AJAX request identifier' },
        { name: 'Accept-Language', value: 'en-US,en;q=0.9', description: 'Preferred languages' }
    ];

    // Close dropdowns when clicking outside (temporarily disabled for compilation)
    // useEffect(() => {
    //     const handleClickOutside = (event: any) => {
    //         const target = event.target as any;
    //         if (!target.closest('[data-dropdown]')) {
    //             setShowHeaderDropdown({});
    //         }
    //     };

    //     document.addEventListener('mousedown', handleClickOutside);
    //     return () => {
    //         document.removeEventListener('mousedown', handleClickOutside);
    //     };
    // }, []);

    const handleAddConnection = () => {
        console.log('handleAddConnection called with name:', newConnectionName.trim());
        if (!newConnectionName.trim()) return;

        const newConnection: ApiConnection = {
            id: `api-${Date.now()}`,
            name: newConnectionName.trim(),
            url: '',
            method: 'GET',
            headers: {},
            params: {},
            arguments: [],
            trigger: {
                type: 'cyclic',
                interval: 5000
            },
            sampleResponse: '',
            variables: [],
            enabled: true
        };

        console.log('Current dataConnections:', dataConnections);
        console.log('New connection:', newConnection);
        
        onDataConnectionsChange({
            ...dataConnections,
            apiConnections: [...dataConnections.apiConnections, newConnection]
        });

        setActiveConnection(newConnection.id);
        setNewConnectionName('');
        setShowAddConnection(false);
        
        console.log('Connection added, showAddConnection set to false');
    };

    const handleDeleteConnection = (connectionId: string) => {
        const updatedConnections = {
            ...dataConnections,
            apiConnections: dataConnections.apiConnections.filter(conn => conn.id !== connectionId)
        };
        onDataConnectionsChange(updatedConnections);
        
        if (activeConnection === connectionId) {
            setActiveConnection(null);
        }
    };

    const handleUpdateConnection = (connectionId: string, updates: Partial<ApiConnection>) => {
        const updatedConnections = {
            ...dataConnections,
            apiConnections: dataConnections.apiConnections.map(conn =>
                conn.id === connectionId ? { ...conn, ...updates } : conn
            )
        };
        onDataConnectionsChange(updatedConnections);
    };

    // Helper function to analyze response structure and suggest improvements
    const analyzeResponseStructure = (responseData: any) => {
        const analysis: {
            type: string;
            hasValue: boolean;
            isVariableResponse: boolean;
            missingFields: string[];
            suggestedVariables: ApiVariable[];
        } = {
            type: typeof responseData,
            hasValue: false,
            isVariableResponse: false,
            missingFields: [],
            suggestedVariables: []
        };

        if (typeof responseData === 'object' && responseData !== null) {
            // Check if this looks like a variable response
            if (responseData.protocol && responseData.variable) {
                analysis.isVariableResponse = true;
                analysis.hasValue = 'value' in responseData;
                
                if (!analysis.hasValue) {
                    analysis.missingFields.push('value');
                }
            }
        }

        return analysis;
    };

    // Enhanced function to extract variables from response with better analysis
    const extractVariablesFromResponse = (responseData: any, path: string = ''): ApiVariable[] => {
        const variables: ApiVariable[] = [];
        
        const processObject = (obj: any, currentPath: string) => {
            if (obj === null || obj === undefined) return;
            
            if (Array.isArray(obj)) {
                // Top-level or nested array: process each element with numeric index path
                obj.forEach((item, index) => {
                    const itemPath = currentPath ? `${currentPath}.${index}` : String(index);
                    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                        variables.push({
                            id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            name: `item_${index}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
                            jsonPath: itemPath,
                            type: typeof item === 'number' ? 'number' : typeof item === 'boolean' ? 'boolean' : 'string',
                            description: `Auto-extracted from ${itemPath} (${typeof item})`
                        });
                    } else if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                        processObject(item, itemPath);
                    }
                });
                return;
            }

            if (typeof obj === 'object') {
                Object.keys(obj).forEach(key => {
                    const newPath = currentPath ? `${currentPath}.${key}` : key;
                    const value = obj[key];
                    
                    if (value !== null && value !== undefined) {
                        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                            // Create variable for primitive values
                            variables.push({
                                id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                name: key.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
                                jsonPath: newPath,
                                type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
                                description: `Auto-extracted from ${newPath} (${typeof value})`
                            });
                        } else if (typeof value === 'object' && !Array.isArray(value)) {
                            // Recursively process nested objects (limit depth to avoid infinite recursion)
                            if (currentPath.split('.').length < 3) {
                                processObject(value, newPath);
                            }
                        } else if (Array.isArray(value) && value.length > 0) {
                            // Create variable for array length
                            variables.push({
                                id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                name: `${key}_count`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
                                jsonPath: `${newPath}.length`,
                                type: 'number',
                                description: `Count of items in ${newPath}`
                            });
                        }
                    }
                });
            }
        };
        
        processObject(responseData, path);
        return variables;
    };

    // Function to auto-populate variables from response
    const handleAutoPopulateVariables = (connectionId: string) => {
        const responseData = responseContents[connectionId];
        if (!responseData) return;
        
        const extractedVars = extractVariablesFromResponse(responseData);
        if (extractedVars.length === 0) {
            alert('No variables could be extracted from the response. Make sure the response contains JSON data with primitive values (strings, numbers, booleans).');
            return;
        }
        
        const connection = dataConnections.apiConnections.find(c => c.id === connectionId);
        if (!connection) return;
        
        // Merge with existing variables (avoid duplicates by name)
        const existingNames = new Set(connection.variables.map(v => v.name));
        const newVariables = extractedVars.filter(v => !existingNames.has(v.name));
        
        handleUpdateConnection(connectionId, {
            variables: [...connection.variables, ...newVariables]
        });
        
        alert(`Added ${newVariables.length} variables from response data. ${extractedVars.length - newVariables.length} variables were skipped because names already exist.`);
    };

    // Helper function to extract value from response using jsonPath
    const extractValueFromResponse = (responseData: any, jsonPath: string): any => {
        if (!jsonPath) return responseData;
        const pathParts = jsonPath.split('.');
        return pathParts.reduce((obj: any, key: string) => {
            if (obj === undefined || obj === null) return undefined;
            // Try numeric index first so arrays work with '0', '1', etc.
            const idx = Number(key);
            return Number.isInteger(idx) && Array.isArray(obj)
                ? obj[idx]
                : obj[key];
        }, responseData);
    };

    // Helper function to substitute placeholders like {{variableName}} with actual values
    const substitutePlaceholders = (value: string, variables: Record<string, any>): string => {
        if (typeof value !== 'string') return value;
        return value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
            const varValue = variables[varName];
            return varValue !== undefined && varValue !== null ? String(varValue) : match;
        });
    };

    // Helper function to sync extracted API variables to global variables.
    // Accepts an optional baseState so the caller can pass a state object that already
    // contains other pending updates (e.g. sampleResponse), preventing a stale-closure
    // overwrite when multiple onDataConnectionsChange calls are batched together.
    const syncApiVariablesToGlobal = (connectionId: string, responseData: any, baseState?: DataConnection) => {
        const state = baseState || dataConnections;
        const connection = state.apiConnections.find(conn => conn.id === connectionId);
        if (!connection || !connection.variables.length) return;

        const updatedGlobalVariables = { ...liveGlobalVarsRef.current };
        let hasChanges = false;

        connection.variables.forEach(variable => {
            // Extract the value using jsonPath
            const extractedValue = extractValueFromResponse(responseData, variable.jsonPath);
            
            // Always add extracted values to global variables
            // (auto-creates if doesn't exist, or updates if it does)
            updatedGlobalVariables[variable.name] = extractedValue;
            hasChanges = true;
            console.log(`Added/updated global variable '${variable.name}' from API response:`, extractedValue);
        });

        // Update data connections if there were changes
        if (hasChanges) {
            // Update the live ref immediately so the next test call can use the new values
            // even before the parent re-render has delivered the new prop.
            liveGlobalVarsRef.current = updatedGlobalVariables;
            onDataConnectionsChange({
                ...state,
                globalVariables: updatedGlobalVariables
            });
        } else {
            // No variable changes but we still need to persist baseState (e.g. sampleResponse)
            if (baseState) {
                onDataConnectionsChange(baseState);
            }
        }
    };

    const handleTestConnection = async (connectionId: string) => {
        const connection = dataConnections.apiConnections.find(conn => conn.id === connectionId);
        if (!connection) return;

        setTestingConnection(connectionId);
        
        // Build the complete URL with parameters and arguments
        let url = connection.url;
        let requestBody: any = null;
        const urlParams = new URLSearchParams();
        // Declared outside try so catch block can reference it
        const substitutedHeaders: Record<string, string> = {};

        try {
            // Add URL parameters
            Object.entries(connection.params).forEach(([key, value]) => {
                if (value) urlParams.append(key, value);
            });

            // Add arguments as query parameters for GET requests or prepare body for POST/PUT
            if (connection.method === 'GET') {
                connection.arguments.forEach(arg => {
                    if (arg.type === 'static') {
                        urlParams.append(arg.name, arg.value);
                    } else if (arg.type === 'variable') {
                        // For testing, use placeholder values for variables
                        const variableValue = liveGlobalVarsRef.current[arg.value] || `[${arg.value}]`;
                        urlParams.append(arg.name, String(variableValue));
                    }
                });
            } else {
                // For POST/PUT: build body from additionalConfig and/or arguments.
                // - Array additionalConfig → send raw (arrays can't merge with named args)
                // - Object additionalConfig → merge arguments into it (backward-compatible)
                // - No additionalConfig → build body purely from arguments
                const argPayload: any = {};
                connection.arguments.forEach(arg => {
                    if (arg.type === 'static') {
                        argPayload[arg.name] = arg.value;
                    } else if (arg.type === 'variable') {
                        argPayload[arg.name] = liveGlobalVarsRef.current[arg.value] || `[${arg.value}]`;
                    }
                });

                if (connection.additionalConfig) {
                    const substitutedBody = substitutePlaceholders(connection.additionalConfig, liveGlobalVarsRef.current);
                    try {
                        const parsed = JSON.parse(substitutedBody);
                        if (Array.isArray(parsed)) {
                            // Array body — use as-is; named arguments are intentionally ignored
                            requestBody = substitutedBody;
                        } else {
                            // Object body — merge named arguments in (args override additionalConfig keys)
                            requestBody = JSON.stringify({ ...parsed, ...argPayload });
                        }
                    } catch {
                        // Not valid JSON — send raw string as-is
                        requestBody = substitutedBody;
                    }
                } else {
                    // No additionalConfig — build body purely from arguments
                    if (Object.keys(argPayload).length > 0) {
                        requestBody = JSON.stringify(argPayload);
                    }
                }
            }

            // Append query parameters to URL
            if (urlParams.toString()) {
                url += (url.includes('?') ? '&' : '?') + urlParams.toString();
            }

            // Substitute placeholders in headers with actual global variable values
            // Use liveGlobalVarsRef.current so we pick up any values extracted by a
            // preceding test in the same session (e.g. login token) even if the parent
            // hasn't re-rendered yet.
            Object.entries(connection.headers).forEach(([key, value]) => {
                substitutedHeaders[key] = substitutePlaceholders(String(value), liveGlobalVarsRef.current);
            });

            const response = await fetch(url, {
                method: connection.method,
                headers: {
                    ...substitutedHeaders,
                    // Auto-add Content-Type if not already specified and we have a body
                    ...(requestBody && !substitutedHeaders['Content-Type'] && { 'Content-Type': 'application/json' })
                },
                body: requestBody
            });

            const responseText = await response.text();
            let responseData: any;
            
            try {
                responseData = JSON.parse(responseText);
            } catch {
                responseData = responseText; // Keep as plain text if not JSON
            }

            // Create detailed response with request/response info for display
            const parsedBody = requestBody
                ? (() => { try { return JSON.parse(requestBody); } catch { return requestBody; } })()
                : null;
            const detailedResponse = {
                requestDetails: {
                    url: url,
                    method: connection.method,
                    headers: substitutedHeaders,
                    body: parsedBody
                },
                responseDetails: {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    headers: Object.fromEntries(Array.from(response.headers.entries())),
                    timestamp: new Date().toISOString()
                },
                actualResponse: responseData,
                // Add error info for failed HTTP responses
                ...((!response.ok) && {
                    error: {
                        type: 'HTTP Error',
                        message: `${response.status} ${response.statusText}`,
                        troubleshooting: [
                            `${response.status} errors typically mean:`,
                            response.status === 400 ? "Bad Request - Check your request format and parameters" :
                            response.status === 401 ? "Unauthorized - Check your authentication credentials" :
                            response.status === 403 ? "Forbidden - Check your permissions" :
                            response.status === 404 ? "Not Found - Check the URL and endpoint" :
                            response.status === 500 ? "Internal Server Error - Check server logs" :
                            "See server response for details",
                            "Check the actualResponse section below for more details"
                        ]
                    }
                })
            };
            
            const formattedResponse = JSON.stringify(detailedResponse, null, 2);

            // Build the updated state with the new sampleResponse before dispatching.
            // This avoids a stale-closure race: if we called handleUpdateConnection first
            // and then syncApiVariablesToGlobal, the second call would spread from the
            // OLD dataConnections (without sampleResponse) and overwrite the first update.
            const stateWithSample: DataConnection = {
                ...dataConnections,
                apiConnections: dataConnections.apiConnections.map(conn =>
                    conn.id === connectionId ? { ...conn, sampleResponse: formattedResponse } : conn
                )
            };

            // Store clean response data for the response panel
            setResponseContents(prev => ({
                ...prev,
                [connectionId]: responseData
            }));
            
            setTestResults(prev => ({
                ...prev,
                [connectionId]: {
                    success: response.ok,
                    status: response.status,
                    data: responseData,
                    timestamp: new Date().toISOString()
                }
            }));

            // Sync extracted values to global variables (passes stateWithSample as base
            // so both sampleResponse and globalVariables land in a single state update).
            // syncApiVariablesToGlobal will call onDataConnectionsChange with stateWithSample
            // merged with the updated globalVariables, or just stateWithSample if no vars changed.
            syncApiVariablesToGlobal(connectionId, responseData, stateWithSample);

        } catch (error) {
            console.error('API Test Error:', error);
            
            // Create detailed error response with debugging info
            const errorResponse = {
                error: {
                    type: 'Network/Connection Error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    description: 'Failed to connect to the API endpoint'
                },
                requestDetails: {
                    url: url || connection.url,
                    method: connection.method,
                    headers: Object.keys(substitutedHeaders).length > 0 ? substitutedHeaders : connection.headers,
                    body: requestBody
                        ? (() => { try { return JSON.parse(requestBody); } catch { return requestBody; } })()
                        : null
                },
                responseDetails: {
                    status: 'No Response',
                    statusText: 'Connection Failed',
                    ok: false,
                    headers: {},
                    timestamp: new Date().toISOString()
                },
                troubleshooting: {
                    possibleCauses: [
                        "Network connectivity issues",
                        "CORS policy blocking the request",
                        "Server is not running or unreachable",
                        "Incorrect URL or endpoint",
                        "Firewall blocking the connection",
                        "SSL/TLS certificate issues (for HTTPS)"
                    ],
                    nextSteps: [
                        "Check browser console for CORS errors",
                        "Verify the server is running and accessible",
                        "Test the URL directly in your browser",
                        "Check network connectivity",
                        "Verify firewall settings"
                    ]
                },
                timestamp: new Date().toISOString()
            };
            
            const formattedResponse = JSON.stringify(errorResponse, null, 2);
            handleUpdateConnection(connectionId, { sampleResponse: formattedResponse });
            
            // Clear response contents on error
            setResponseContents(prev => ({
                ...prev,
                [connectionId]: null
            }));
            
            setTestResults(prev => ({
                ...prev,
                [connectionId]: {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                }
            }));
        } finally {
            setTestingConnection(null);
        }
    };

    const handleLoadTemplate = (connectionId: string, templateId: string) => {
        const templatesAny: any = apiTemplates;
        const template = templatesAny[templateId];
        if (!template) return;

        const connection = dataConnections.apiConnections.find(conn => conn.id === connectionId);
        if (!connection) return;

        const updatedConnection = {
            ...connection,
            url: template.url,
            method: template.method,
            headers: template.headers,
            arguments: template.arguments,
            variables: template.variables
        };

        const updatedConnections = {
            ...dataConnections,
            apiConnections: dataConnections.apiConnections.map(conn =>
                conn.id === connectionId ? updatedConnection : conn
            )
        };
        onDataConnectionsChange(updatedConnections);
    };

    const addVariable = (connectionId: string, newVariable: ApiVariable) => {
        handleUpdateConnection(connectionId, {
            variables: [...(dataConnections.apiConnections.find(c => c.id === connectionId)?.variables || []), newVariable]
        });
    };

    const updateVariable = (connectionId: string, variableId: string, updatedVariable: Partial<ApiVariable>) => {
        const connection = dataConnections.apiConnections.find(c => c.id === connectionId);
        if (!connection) return;
        
        handleUpdateConnection(connectionId, {
            variables: connection.variables.map(variable =>
                variable.id === variableId ? { ...variable, ...updatedVariable } : variable
            )
        });
    };

    const deleteVariable = (connectionId: string, variableId: string) => {
        const connection = dataConnections.apiConnections.find(c => c.id === connectionId);
        if (!connection) return;
        
        handleUpdateConnection(connectionId, {
            variables: connection.variables.filter(variable => variable.id !== variableId)
        });
    };

    const handleAddVariable = (connectionId: string) => {
        const newVariable: ApiVariable = {
            id: `var-${Date.now()}`,
            name: `variable${Date.now()}`,
            jsonPath: '',
            type: 'string',
            description: ''
        };

        handleUpdateConnection(connectionId, {
            variables: [...(dataConnections.apiConnections.find(c => c.id === connectionId)?.variables || []), newVariable]
        });
    };

    const handleUpdateVariable = (connectionId: string, variableId: string, updates: Partial<ApiVariable>) => {
        const connection = dataConnections.apiConnections.find(c => c.id === connectionId);
        if (!connection) return;

        handleUpdateConnection(connectionId, {
            variables: connection.variables.map(variable =>
                variable.id === variableId ? { ...variable, ...updates } : variable
            )
        });
    };

    const handleDeleteVariable = (connectionId: string, variableId: string) => {
        const connection = dataConnections.apiConnections.find(c => c.id === connectionId);
        if (!connection) return;

        handleUpdateConnection(connectionId, {
            variables: connection.variables.filter(variable => variable.id !== variableId)
        });
    };

    const handleImportGatewayConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result;
                if (typeof result !== 'string') return;
                const content = result;
                const importedData = JSON.parse(content);

                // Support multiple formats:
                // 1. Standard format: { dataConnections: { apiConnections: [], globalVariables: {} }, ... }
                // 2. Legacy gateway format: { apiConnections: [], globalVariables: {} }
                
                let apiConnectionsToImport = [];
                let globalVariablesToImport = {};

                if (importedData.dataConnections && importedData.dataConnections.apiConnections) {
                    // Standard web app / gateway format
                    apiConnectionsToImport = importedData.dataConnections.apiConnections;
                    globalVariablesToImport = importedData.dataConnections.globalVariables || {};
                } else if (importedData.apiConnections && Array.isArray(importedData.apiConnections)) {
                    // Legacy direct format
                    apiConnectionsToImport = importedData.apiConnections;
                    globalVariablesToImport = importedData.globalVariables || {};
                } else {
                    setImportError('Invalid file format: Expected dataConnections object with apiConnections array');
                    return;
                }

                // Merge the imported API connections with existing ones
                onDataConnectionsChange({
                    ...dataConnections,
                    apiConnections: [...dataConnections.apiConnections, ...apiConnectionsToImport],
                    globalVariables: {
                        ...dataConnections.globalVariables,
                        ...globalVariablesToImport
                    }
                });

                setImportError(null);
                alert(`Successfully imported ${apiConnectionsToImport.length} API connections!`);
            } catch (error) {
                console.error('Import error:', error);
                setImportError(error instanceof Error ? error.message : 'Failed to parse JSON file');
            }
        };

        reader.onerror = () => {
            setImportError('Failed to read file');
        };

        reader.readAsText(file);
        // Reset the input so the same file can be imported again
        event.target.value = '';
    };


    const activeConnectionData = dataConnections.apiConnections.find(c => c.id === activeConnection);

    return (
        <div style={{ padding: '20px', height: '100%', overflow: 'auto' }}>
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#343a40' }}>Data Connections</h3>
                <p style={{ fontSize: '12px', color: '#6c757d', margin: '0 0 15px 0' }}>
                    Create API connections and define global variables for your windows
                </p>
            </div>

            {/* Connection List */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px' }}>API Connections</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <label
                            style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                display: 'inline-block'
                            }}
                        >
                            📥 Import from Gateway
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportGatewayConfig}
                                style={{ display: 'none' }}
                            />
                        </label>
                        <button
                            onClick={() => {
                                console.log('Add API button clicked');
                                setShowAddConnection(true);
                            }}
                            style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer'
                            }}
                        >
                            + Add API
                        </button>
                    </div>
                </div>
                {importError && (
                    <div style={{
                        padding: '8px',
                        marginBottom: '10px',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#721c24'
                    }}>
                        ❌ Import Error: {importError}
                        <button
                            onClick={() => setImportError(null)}
                            style={{
                                float: 'right',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                color: '#721c24'
                            }}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* API Templates */}
                {showAddConnection && (
                    <div style={{
                        marginBottom: '10px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        backgroundColor: '#f8f9fa'
                    }}>
                        <div style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                            <h5 style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#495057' }}>📋 Quick Start Templates</h5>
                            <p style={{ margin: 0, fontSize: '11px', color: '#6c757d' }}>Choose a template to get started quickly</p>
                        </div>
                        <div style={{ padding: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                                {Object.entries(apiTemplates).map(([key, template]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            const newConnection: ApiConnection = {
                                                id: `api-${Date.now()}`,
                                                name: template.name,  
                                                url: template.url,
                                                // @ts-ignore
                                                method: template.method,
                                                headers: template.headers,
                                                params: template.params,
                                                // @ts-ignore
                                                body: template.body,
                                                // @ts-ignore
                                                arguments: template.arguments.map(arg => ({ ...arg, id: `arg-${Date.now()}-${Math.random()}` })),
                                                // @ts-ignore
                                                trigger: template.trigger,
                                                sampleResponse: template.sampleResponse,
                                                // @ts-ignore
                                                variables: template.variables.map(variable => ({ ...variable, id: `var-${Date.now()}-${Math.random()}` })),
                                                enabled: true
                                            };
                                            
                                            onDataConnectionsChange({
                                                ...dataConnections,
                                                apiConnections: [...dataConnections.apiConnections, newConnection]
                                            });
                                            
                                            setShowAddConnection(false);
                                            setActiveConnection(newConnection.id);
                                        }}
                                        style={{
                                            padding: '8px',
                                            fontSize: '11px',
                                            backgroundColor: key.includes('s7') ? '#0056b3' : '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            lineHeight: '1.2'
                                        }}
                                        title={template.description}
                                    >
                                        <div style={{ fontWeight: 'bold' }}>{template.name}</div>
                                        <div style={{ fontSize: '10px', opacity: 0.9, marginTop: '2px' }}>
                                            {template.method} • {template.trigger.type}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div style={{ borderTop: '1px solid #dee2e6', padding: '10px' }}>
                            <h6 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#495057' }}>Or create custom connection:</h6>
                            <input
                                type="text"
                                placeholder="Connection name"
                                value={newConnectionName}
                                onChange={(e) => setNewConnectionName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '6px',
                                    fontSize: '12px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '3px',
                                    marginBottom: '8px'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={handleAddConnection}
                                    style={{
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Create Custom
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddConnection(false);
                                        setNewConnectionName('');
                                    }}
                                    style={{
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Connection Items */}
                {dataConnections.apiConnections.map(connection => (
                    <div
                        key={connection.id}
                        style={{
                            padding: '8px',
                            backgroundColor: activeConnection === connection.id ? '#e3f2fd' : '#ffffff',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            marginBottom: '5px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                        onClick={() => setActiveConnection(connection.id)}
                    >
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{connection.name}</div>
                            <div style={{ fontSize: '11px', color: '#6c757d' }}>
                                {connection.method} • {connection.variables.length} variables
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConnection(connection.id);
                            }}
                            style={{
                                padding: '2px 6px',
                                fontSize: '10px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer'
                            }}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {/* Connection Details */}
            {activeConnectionData && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
                        Configure: {activeConnectionData.name}
                    </h4>

                    {/* API Configuration */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                            API URL:
                        </label>
                        <input
                            type="text"
                            placeholder="https://api.example.com/data"
                            value={activeConnectionData.url}
                            onChange={(e) => handleUpdateConnection(activeConnectionData.id, { url: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '6px',
                                fontSize: '12px',
                                border: '1px solid #ced4da',
                                borderRadius: '3px'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                            Method:
                        </label>
                        <select
                            value={activeConnectionData.method}
                            // @ts-ignore
                            onChange={(e) => handleUpdateConnection(activeConnectionData.id, { method: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '6px',
                                fontSize: '12px',
                                border: '1px solid #ced4da',
                                borderRadius: '3px'
                            }}
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>

                    {/* Enable/Disable Connection */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                            <input
                                type="checkbox"
                                checked={activeConnectionData.enabled}
                                onChange={(e) => handleUpdateConnection(activeConnectionData.id, { enabled: e.target.checked })}
                            />
                            Enable Connection
                        </label>
                    </div>

                    {/* Trigger Configuration */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                            Trigger Type:
                        </label>
                        <select
                            value={activeConnectionData.trigger.type}
                            onChange={(e) => {
                                // @ts-ignore
                                const triggerType = e.target.value;
                                const newTrigger: ApiTrigger =
                                    triggerType === 'cyclic'
                                        ? { type: 'cyclic', interval: 5000 }
                                        : triggerType === 'manual'
                                        ? { type: 'manual' }
                                        : { type: 'conditional', condition: { variable: '', operator: '==', value: '' } };
                                handleUpdateConnection(activeConnectionData.id, { trigger: newTrigger });
                            }}
                            style={{
                                width: '100%',
                                padding: '6px',
                                fontSize: '12px',
                                border: '1px solid #ced4da',
                                borderRadius: '3px'
                            }}
                        >
                            <option value="cyclic">Cyclic (Time-based)</option>
                            <option value="conditional">Conditional (Variable-based)</option>
                            <option value="manual">Manual (await only)</option>
                        </select>

                        {/* Manual Trigger Description */}
                        {activeConnectionData.trigger.type === 'manual' && (
                            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '3px', border: '1px solid #dee2e6', fontSize: '11px', color: '#495057' }}>
                                ⏸️ This connection will <strong>not</strong> run automatically. Call it from JS code using:<br />
                                <code style={{ display: 'block', marginTop: '4px', background: '#e9ecef', padding: '4px 6px', borderRadius: '2px', fontFamily: 'monospace' }}>
                                    {`const data = await apiConnections['${activeConnectionData.name}']();`}
                                </code>
                            </div>
                        )}

                        {/* Cyclic Trigger Settings */}
                        {activeConnectionData.trigger.type === 'cyclic' && (
                            <div style={{ marginTop: '8px' }}>
                                <label style={{ display: 'block', fontSize: '11px', marginBottom: '3px' }}>
                                    Interval (milliseconds):
                                </label>
                                <input
                                    type="number"
                                    min="1000"
                                    value={activeConnectionData.trigger.interval || 5000}
                                    onChange={(e) => handleUpdateConnection(activeConnectionData.id, {
                                        trigger: { ...activeConnectionData.trigger, interval: parseInt(e.target.value) }
                                    })}
                                    style={{
                                        width: '100%',
                                        padding: '4px',
                                        fontSize: '11px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '3px'
                                    }}
                                />
                            </div>
                        )}

                        {/* Conditional Trigger Settings */}
                        {activeConnectionData.trigger.type === 'conditional' && activeConnectionData.trigger.condition && (
                            <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: '5px' }}>
                                <input
                                    type="text"
                                    placeholder="Variable name"
                                    value={activeConnectionData.trigger.condition.variable}
                                    onChange={(e) => {
                                        // @ts-ignore
                                        const condition = activeConnectionData.trigger.condition || { variable: '', operator: '==', value: '' };
                                        handleUpdateConnection(activeConnectionData.id, {
                                            trigger: {
                                                ...activeConnectionData.trigger,
                                                condition: { ...condition, variable: e.target.value }
                                            }
                                        });
                                    }}
                                    style={{
                                        padding: '4px',
                                        fontSize: '11px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '3px'
                                    }}
                                />
                                <select
                                    value={activeConnectionData.trigger.condition.operator}
                                    onChange={(e) => {
                                        // @ts-ignore
                                        const condition = activeConnectionData.trigger.condition || { variable: '', operator: '==', value: '' };
                                        handleUpdateConnection(activeConnectionData.id, {
                                            trigger: {
                                                ...activeConnectionData.trigger,
                                                // @ts-ignore
                                                condition: { ...condition, operator: e.target.value }
                                            }
                                        });
                                    }}
                                    style={{
                                        padding: '4px',
                                        fontSize: '11px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '3px'
                                    }}
                                >
                                    <option value="==">=</option>
                                    <option value="!=">≠</option>
                                    <option value=">">&gt;</option>
                                    <option value="<">&lt;</option>
                                    <option value=">=">&gt;=</option>
                                    <option value="<=">&lt;=</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Value"
                                    value={String(activeConnectionData.trigger.condition.value)}
                                    onChange={(e) => {
                                        // @ts-ignore
                                        const condition = activeConnectionData.trigger.condition || { variable: '', operator: '==', value: '' };
                                        handleUpdateConnection(activeConnectionData.id, {
                                            trigger: {
                                                ...activeConnectionData.trigger,
                                                condition: { ...condition, value: e.target.value }
                                            }
                                        });
                                    }}
                                    style={{
                                        padding: '4px',
                                        fontSize: '11px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '3px'
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Headers Section */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                Headers:
                            </label>
                            <div style={{ position: 'relative' }} data-dropdown>
                                <button
                                    onClick={() => {
                                        setShowHeaderDropdown(prev => ({
                                            ...prev,
                                            [activeConnectionData.id]: !prev[activeConnectionData.id]
                                        }));
                                    }}
                                    style={{
                                        padding: '2px 6px',
                                        fontSize: '10px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '2px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    + Add Header ▼
                                </button>
                                
                                {showHeaderDropdown[activeConnectionData.id] && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        backgroundColor: 'white',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        zIndex: 1000,
                                        minWidth: '250px',
                                        maxHeight: '300px',
                                        overflowY: 'auto',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                    }}>
                                        <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                            <strong style={{ fontSize: '11px' }}>Common Headers:</strong>
                                        </div>
                                        {commonHeaders.map((header, index) => (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    const newHeaders = { ...activeConnectionData.headers };
                                                    newHeaders[header.name] = header.value;
                                                    handleUpdateConnection(activeConnectionData.id, { headers: newHeaders });
                                                    setShowHeaderDropdown(prev => ({ ...prev, [activeConnectionData.id]: false }));
                                                }}
                                                style={{
                                                    padding: '6px 8px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    borderBottom: '1px solid #f0f0f0',
                                                    backgroundColor: activeConnectionData.headers[header.name] ? '#e6f3ff' : 'transparent'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!activeConnectionData.headers[header.name]) {
                                                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!activeConnectionData.headers[header.name]) {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }
                                                }}
                                            >
                                                <div style={{ fontWeight: 'bold', color: activeConnectionData.headers[header.name] ? '#007bff' : '#333' }}>
                                                    {header.name}
                                                    {activeConnectionData.headers[header.name] && <span style={{ color: '#28a745' }}> ✓</span>}
                                                </div>
                                                <div style={{ color: '#666', fontSize: '10px' }}>{header.description}</div>
                                                <div style={{ color: '#999', fontSize: '9px', fontFamily: 'monospace' }}>
                                                    {header.value}
                                                </div>
                                            </div>
                                        ))}
                                        <div style={{ borderTop: '1px solid #eee', padding: '8px' }}>
                                            <div
                                                onClick={() => {
                                                    const key = prompt('Custom header name:');
                                                    if (key && key.trim()) {
                                                        const newHeaders = { ...activeConnectionData.headers };
                                                        newHeaders[key.trim()] = '';
                                                        handleUpdateConnection(activeConnectionData.id, { headers: newHeaders });
                                                        setShowHeaderDropdown(prev => ({ ...prev, [activeConnectionData.id]: false }));
                                                    }
                                                }}
                                                style={{
                                                    padding: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    color: '#007bff',
                                                    textAlign: 'center',
                                                    fontWeight: 'bold'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                + Add Custom Header
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {Object.entries(activeConnectionData.headers).map(([key, value]) => (
                            <div key={key} style={{
                                display: 'grid',
                                gridTemplateColumns: '120px 1fr 20px',
                                gap: '5px',
                                alignItems: 'center',
                                marginBottom: '5px',
                                padding: '5px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '3px',
                                border: '1px solid #dee2e6'
                            }}>
                                <input
                                    type="text"
                                    value={key}
                                    readOnly
                                    style={{
                                        padding: '4px',
                                        fontSize: '11px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '3px',
                                        backgroundColor: '#e9ecef'
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Header value"
                                    value={value}
                                    onChange={(e) => {
                                        const newHeaders = { ...activeConnectionData.headers };
                                        newHeaders[key] = e.target.value;
                                        handleUpdateConnection(activeConnectionData.id, { headers: newHeaders });
                                    }}
                                    style={{
                                        padding: '4px',
                                        fontSize: '11px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '3px'
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const newHeaders = { ...activeConnectionData.headers };
                                        delete newHeaders[key];
                                        handleUpdateConnection(activeConnectionData.id, { headers: newHeaders });
                                    }}
                                    style={{
                                        padding: '2px',
                                        fontSize: '10px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '2px',
                                        cursor: 'pointer',
                                        width: '20px',
                                        height: '20px'
                                    }}
                                    title="Delete header"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Body Params Section */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                Body Parameters:
                            </label>
                            <button
                                onClick={() => {
                                    const newArg: ApiArgument = {
                                        id: `arg-${Date.now()}`,
                                        name: '',
                                        type: 'static',
                                        value: ''
                                    };
                                    handleUpdateConnection(activeConnectionData.id, {
                                        arguments: [...activeConnectionData.arguments, newArg]
                                    });
                                }}
                                style={{
                                    padding: '2px 6px',
                                    fontSize: '10px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '2px',
                                    cursor: 'pointer'
                                }}
                            >
                                + Add Parameter
                            </button>
                        </div>

                        {activeConnectionData.arguments.map((arg, index) => (
                            <div key={arg.id} style={{
                                padding: '8px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px',
                                marginBottom: '5px',
                                border: '1px solid #dee2e6'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 20px', gap: '5px', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder="Parameter name"
                                        value={arg.name}
                                        onChange={(e) => {
                                            const newArgs = [...activeConnectionData.arguments];
                                            newArgs[index] = { ...arg, name: e.target.value };
                                            handleUpdateConnection(activeConnectionData.id, { arguments: newArgs });
                                        }}
                                        style={{
                                            padding: '4px',
                                            fontSize: '11px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '3px'
                                        }}
                                    />
                                    <select
                                        value={arg.type}
                                        onChange={(e) => {
                                            const newArgs = [...activeConnectionData.arguments];
                                            // @ts-ignore
                                            newArgs[index] = { ...arg, type: e.target.value };
                                            handleUpdateConnection(activeConnectionData.id, { arguments: newArgs });
                                        }}
                                        style={{
                                            padding: '4px',
                                            fontSize: '11px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '3px'
                                        }}
                                    >
                                        <option value="static">Static</option>
                                        <option value="variable">Variable</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder={arg.type === 'static' ? "Static value" : "Variable name"}
                                        value={arg.value}
                                        onChange={(e) => {
                                            const newArgs = [...activeConnectionData.arguments];
                                            newArgs[index] = { ...arg, value: e.target.value };
                                            handleUpdateConnection(activeConnectionData.id, { arguments: newArgs });
                                        }}
                                        style={{
                                            padding: '4px',
                                            fontSize: '11px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '3px'
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const newArgs = activeConnectionData.arguments.filter(a => a.id !== arg.id);
                                            handleUpdateConnection(activeConnectionData.id, { arguments: newArgs });
                                        }}
                                        style={{
                                            padding: '2px',
                                            fontSize: '10px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '2px',
                                            cursor: 'pointer',
                                            width: '20px',
                                            height: '20px'
                                        }}
                                        title="Delete parameter"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Two-Column Layout: Left (Configuration) | Right (Response & Variables) */}
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                        {/* LEFT COLUMN: Configuration & JSON Body */}
                        <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column' }}>
                    {/* Additional JSON Configuration */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                Additional JSON Body:
                                <span style={{ fontWeight: 'normal', fontSize: '10px', color: '#666', marginLeft: '4px' }}>
                                    {activeConnectionData.method === 'POST' || activeConnectionData.method === 'PUT' ? 
                                        '(object: merged with args  |  array: sent as-is)' : 
                                        '(for POST/PUT requests)'}
                                </span>
                            </label>
                            <button
                                onClick={() => {
                                    if (!activeConnectionData.additionalConfig) {
                                        handleUpdateConnection(activeConnectionData.id, { 
                                            additionalConfig: activeConnectionData.method === 'POST' || activeConnectionData.method === 'PUT' ?
                                                '{\n  "variables": ["var1", "var2"]\n}' :
                                                '{\n  "example": "value"\n}' 
                                        });
                                    } else {
                                        handleUpdateConnection(activeConnectionData.id, { additionalConfig: undefined });
                                    }
                                }}
                                style={{
                                    padding: '2px 6px',
                                    fontSize: '10px',
                                    backgroundColor: activeConnectionData.additionalConfig ? '#dc3545' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '2px',
                                    cursor: 'pointer'
                                }}
                            >
                                {activeConnectionData.additionalConfig ? 'Remove JSON' : 'Add JSON Body'}
                            </button>
                        </div>

                        {activeConnectionData.additionalConfig !== undefined && (
                            <div style={{ marginBottom: '8px' }}>
                                <textarea
                                    placeholder={(activeConnectionData.method === 'POST' || activeConnectionData.method === 'PUT') ? 
                                        '{"variables": ["var1", "var2"], "device": "optional"}' : 
                                        '{"customParam": "value", "array": [1,2,3]}'
                                    }
                                    value={activeConnectionData.additionalConfig || ''}
                                    onChange={(e) => {
                                        handleUpdateConnection(activeConnectionData.id, { additionalConfig: e.target.value });
                                    }}
                                    style={{
                                        width: '100%',
                                        minHeight: '400px',
                                        padding: '8px',
                                        fontSize: '11px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '3px',
                                        fontFamily: 'monospace',
                                        resize: 'vertical'
                                    }}
                                />
                                <div style={{ fontSize: '10px', color: '#6c757d', marginTop: '4px' }}>
                                    {(activeConnectionData.method === 'POST' || activeConnectionData.method === 'PUT') ? (
                                        <>💡 JSON <strong>object</strong> is merged with argument fields below. JSON <strong>array</strong> (e.g. batch) is sent as-is and argument fields are ignored.</>
                                    ) : (
                                        'This JSON will be merged with the request. Use for complex configurations.'
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                        </div>

                        {/* RIGHT COLUMN: Response & Variables */}
                        <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column' }}>
                    {/* Sample Response */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                Sample Response (JSON):
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handleTestConnection(activeConnectionData.id)}
                                    disabled={testingConnection === activeConnectionData.id || !activeConnectionData.url}
                                    style={{
                                        padding: '4px 8px',
                                        fontSize: '10px',
                                        backgroundColor: testingConnection === activeConnectionData.id ? '#6c757d' : '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: testingConnection === activeConnectionData.id || !activeConnectionData.url ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    {testingConnection === activeConnectionData.id ? (
                                        <>🔄 Testing...</>
                                    ) : (
                                        <>🧪 Test API</>
                                    )}
                                </button>
                                <button
                                    onClick={() => setExpandedResponse(!expandedResponse)}
                                    style={{
                                        padding: '4px 8px',
                                        fontSize: '10px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {expandedResponse ? '📐 Collapse' : '📏 Expand'}
                                </button>
                            </div>
                        </div>
                        
                        {/* Test Results */}
                        {testResults[activeConnectionData.id] && (
                            <div style={{
                                marginBottom: '8px',
                                padding: '6px',
                                fontSize: '10px',
                                borderRadius: '3px',
                                backgroundColor: testResults[activeConnectionData.id].success ? '#d4edda' : '#f8d7da',
                                border: `1px solid ${testResults[activeConnectionData.id].success ? '#c3e6cb' : '#f5c6cb'}`,
                                color: testResults[activeConnectionData.id].success ? '#155724' : '#721c24'
                            }}>
                                <strong>Last Test:</strong> {testResults[activeConnectionData.id].success ? 'Success' : 'Failed'} 
                                {testResults[activeConnectionData.id].status && ` (${testResults[activeConnectionData.id].status})`}
                                {testResults[activeConnectionData.id].error && ` - ${testResults[activeConnectionData.id].error}`}
                                <br />
                                <strong>Time:</strong> {new Date(testResults[activeConnectionData.id].timestamp).toLocaleString()}
                            </div>
                        )}
                        
                        <textarea
                            placeholder='{"name": "John", "age": 30, "items": [1, 2, 3]}'
                            value={activeConnectionData.sampleResponse}
                            onChange={(e) => handleUpdateConnection(activeConnectionData.id, { sampleResponse: e.target.value })}
                            style={{
                                width: '100%',
                                height: '400px',
                                padding: '6px',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                border: '1px solid #ced4da',
                                borderRadius: '3px',
                                resize: 'vertical',
                                transition: 'height 0.3s ease'
                            }}
                        />
                    </div>

                    {/* Response Contents Panel */}
                    {responseContents[activeConnectionData.id] && (
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#28a745' }}>
                                    📋 Response Contents:
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleAutoPopulateVariables(activeConnectionData.id)}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '10px',
                                            backgroundColor: '#17a2b8',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        🪄 Auto-populate Variables
                                    </button>
                                    <button
                                        onClick={() => setShowResponsePanel(prev => ({ 
                                            ...prev, 
                                            [activeConnectionData.id]: !prev[activeConnectionData.id] 
                                        }))}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '10px',
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {showResponsePanel[activeConnectionData.id] ? '➖ Hide' : '➕ Show'}
                                    </button>
                                </div>
                            </div>

                            {showResponsePanel[activeConnectionData.id] && (
                                <div style={{
                                    backgroundColor: '#f8f9fa',
                                    border: '1px solid #e9ecef',
                                    borderRadius: '4px',
                                    padding: '12px',
                                    marginBottom: '8px'
                                }}>
                                    {(() => {
                                        const analysis = analyzeResponseStructure(responseContents[activeConnectionData.id]);
                                        return (
                                            <>
                                                {/* Response Analysis */}
                                                <div style={{
                                                    fontSize: '11px',
                                                    marginBottom: '12px',
                                                    padding: '8px',
                                                    backgroundColor: analysis.isVariableResponse 
                                                        ? (analysis.hasValue ? '#d1ecf1' : '#f8d7da')
                                                        : '#e2e3e5',
                                                    border: `1px solid ${
                                                        analysis.isVariableResponse 
                                                            ? (analysis.hasValue ? '#bee5eb' : '#f5c6cb') 
                                                            : '#adb5bd'
                                                    }`,
                                                    borderRadius: '3px'
                                                }}>
                                                    <strong>Response Type:</strong> {
                                                        analysis.isVariableResponse 
                                                            ? `📊 Variable Response ${analysis.hasValue ? '✅' : '❌'}` 
                                                            : `📋 ${analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1)} Data`
                                                    }
                                                    
                                                    {analysis.isVariableResponse && !analysis.hasValue && (
                                                        <>
                                                            <br />
                                                            <span style={{ color: '#721c24', fontWeight: 'bold' }}>
                                                                ⚠️ Warning: Expected 'value' field is missing!
                                                            </span>
                                                            <br />
                                                            <span style={{ fontSize: '10px', fontStyle: 'italic' }}>
                                                                This appears to be a variable response but doesn't contain the actual value. 
                                                                Check if your API endpoint supports GET requests or if it only supports POST for writes.
                                                            </span>
                                                        </>
                                                    )}
                                                    
                                                    {analysis.isVariableResponse && analysis.hasValue && (
                                                        <>
                                                            <br />
                                                            <span style={{ color: '#155724' }}>
                                                                ✅ Contains variable value data
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Structured Data Display */}
                                                {analysis.isVariableResponse ? (
                                                    <div style={{
                                                        backgroundColor: 'white',
                                                        border: '1px solid #dee2e6',
                                                        borderRadius: '3px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            backgroundColor: '#f8f9fa',
                                                            padding: '6px 8px',
                                                            fontSize: '11px',
                                                            fontWeight: 'bold',
                                                            borderBottom: '1px solid #dee2e6'
                                                        }}>
                                                            Variable Data Structure
                                                        </div>
                                                        <div style={{ padding: '8px' }}>
                                                            {Object.entries(responseContents[activeConnectionData.id]).map(([key, value]) => (
                                                                <div key={key} style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    padding: '4px 0',
                                                                    borderBottom: '1px solid #f8f9fa'
                                                                }}>
                                                                    <span style={{
                                                                        minWidth: '80px',
                                                                        fontSize: '10px',
                                                                        fontWeight: 'bold',
                                                                        color: key === 'value' ? '#28a745' : '#6c757d'
                                                                    }}>
                                                                        {key}:
                                                                    </span>
                                                                    <span style={{
                                                                        fontSize: '11px',
                                                                        fontFamily: 'monospace',
                                                                        padding: '2px 6px',
                                                                        backgroundColor: key === 'value' ? '#d4edda' : '#f8f9fa',
                                                                        borderRadius: '2px',
                                                                        marginLeft: '8px',
                                                                        color: key === 'value' ? '#155724' : '#495057'
                                                                    }}>
                                                                        {typeof value === 'string' ? `"${value}"` : String(value)}
                                                                    </span>
                                                                    <span style={{
                                                                        fontSize: '9px',
                                                                        color: '#6c757d',
                                                                        marginLeft: '8px',
                                                                        fontStyle: 'italic'
                                                                    }}>
                                                                        ({typeof value})
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            
                                                            {analysis.missingFields.length > 0 && (
                                                                <div style={{
                                                                    marginTop: '8px',
                                                                    padding: '6px',
                                                                    backgroundColor: '#f8d7da',
                                                                    border: '1px solid #f5c6cb',
                                                                    borderRadius: '3px'
                                                                }}>
                                                                    <div style={{
                                                                        fontSize: '10px',
                                                                        fontWeight: 'bold',
                                                                        color: '#721c24',
                                                                        marginBottom: '4px'
                                                                    }}>
                                                                        Missing Expected Fields:
                                                                    </div>
                                                                    {analysis.missingFields.map(field => (
                                                                        <div key={field} style={{
                                                                            fontSize: '10px',
                                                                            color: '#721c24'
                                                                        }}>
                                                                            ❌ {field} - Expected for variable responses
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <pre style={{
                                                        backgroundColor: 'white',
                                                        border: '1px solid #dee2e6',
                                                        borderRadius: '3px',
                                                        padding: '8px',
                                                        margin: 0,
                                                        fontSize: '11px',
                                                        fontFamily: 'monospace',
                                                        maxHeight: '200px',
                                                        overflow: 'auto',
                                                        whiteSpace: 'pre-wrap'
                                                    }}>
                                                        {JSON.stringify(responseContents[activeConnectionData.id], null, 2)}
                                                    </pre>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                            
                            {/* Quick info when panel is collapsed */}
                            {!showResponsePanel[activeConnectionData.id] && (
                                (() => {
                                    const analysis = analyzeResponseStructure(responseContents[activeConnectionData.id]);
                                    return (
                                        <div style={{
                                            padding: '6px',
                                            fontSize: '10px',
                                            backgroundColor: analysis.isVariableResponse 
                                                ? (analysis.hasValue ? '#e7f3ff' : '#f8d7da')
                                                : '#e7f3ff',
                                            border: `1px solid ${
                                                analysis.isVariableResponse 
                                                    ? (analysis.hasValue ? '#bee5eb' : '#f5c6cb')
                                                    : '#bee5eb'
                                            }`,
                                            borderRadius: '3px',
                                            color: analysis.isVariableResponse 
                                                ? (analysis.hasValue ? '#0c5460' : '#721c24')
                                                : '#0c5460'
                                        }}>
                                            {analysis.isVariableResponse ? (
                                                analysis.hasValue ? (
                                                    <>✅ Variable response with value! Click "Auto-populate" or "Show" to view.</>
                                                ) : (
                                                    <>⚠️ Variable response missing 'value' field! Check API endpoint - might need POST instead of GET.</>
                                                )
                                            ) : (
                                                <>✨ Response data available! Click "Auto-populate Variables" or "Show" to view contents.</>
                                            )}
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    )}

                    {/* Failure Variable Configuration */}
                    <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '3px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                            ⚠️ Failure Tracking Variable:
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., apiCallSuccess"
                            value={activeConnectionData.failureVariable || ''}
                            onChange={(e) => handleUpdateConnection(activeConnectionData.id, { failureVariable: e.target.value || undefined })}
                            style={{
                                width: '100%',
                                padding: '6px',
                                fontSize: '11px',
                                border: '1px solid #ffc107',
                                borderRadius: '3px',
                                marginBottom: '4px'
                            }}
                        />
                        <div style={{ fontSize: '10px', color: '#856404', lineHeight: '1.4' }}>
                            💡 Set a global variable name to track call status: <strong>true</strong> when successful, <strong>false</strong> on API or write failure. If empty, no tracking.
                        </div>
                    </div>

                    {/* Variables */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Variables:</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {responseContents[activeConnectionData.id] && (
                                    <button
                                        onClick={() => handleAutoPopulateVariables(activeConnectionData.id)}
                                        style={{
                                            padding: '2px 6px',
                                            fontSize: '10px',
                                            backgroundColor: '#17a2b8',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🪄 Auto-populate
                                    </button>
                                )}
                                <button
                                    onClick={() => handleAddVariable(activeConnectionData.id)}
                                    style={{
                                        padding: '2px 6px',
                                        fontSize: '10px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    + Add Variable
                                </button>
                            </div>
                        </div>
                        {/* Path syntax hint */}
                        <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '8px', lineHeight: '1.5' }}>
                            <strong>Path syntax:</strong>&nbsp;
                            Object: <code style={{ background: '#f0f0f0', padding: '1px 3px', borderRadius: '2px' }}>data.value</code>&nbsp;&nbsp;
                            Array item: <code style={{ background: '#f0f0f0', padding: '1px 3px', borderRadius: '2px' }}>0.result</code> <span style={{ color: '#999' }}>(index 0, field "result")</span>&nbsp;&nbsp;
                            Nested: <code style={{ background: '#f0f0f0', padding: '1px 3px', borderRadius: '2px' }}>items.0.id</code>
                        </div>

                        {activeConnectionData.variables.map(variable => (
                            <div key={variable.id} style={{
                                padding: '8px',
                                backgroundColor: 'white',
                                border: '1px solid #dee2e6',
                                borderRadius: '3px',
                                marginBottom: '8px'
                            }}>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Variable name"
                                        value={variable.name}
                                        onChange={(e) => handleUpdateVariable(activeConnectionData.id, variable.id, { name: e.target.value })}
                                        style={{
                                            flex: 1,
                                            padding: '4px',
                                            fontSize: '11px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '2px'
                                        }}
                                    />
                                    <select
                                        value={variable.type}
                                        // @ts-ignore
                                        onChange={(e) => handleUpdateVariable(activeConnectionData.id, variable.id, { type: e.target.value })}
                                        style={{
                                            padding: '4px',
                                            fontSize: '11px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '2px'
                                        }}
                                    >
                                        <option value="string">String</option>
                                        <option value="number">Number</option>
                                        <option value="boolean">Boolean</option>
                                        <option value="object">Object</option>
                                        <option value="array">Array</option>
                                    </select>
                                    <button
                                        onClick={() => handleDeleteVariable(activeConnectionData.id, variable.id)}
                                        style={{
                                            padding: '2px 6px',
                                            fontSize: '10px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '2px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="JSON path (e.g., data.name  or  0.result  or  1.result)"
                                    value={variable.jsonPath}
                                    onChange={(e) => handleUpdateVariable(activeConnectionData.id, variable.id, { jsonPath: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '4px',
                                        fontSize: '11px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '2px',
                                        marginBottom: '4px'
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Description (optional)"
                                    value={variable.description || ''}
                                    onChange={(e) => handleUpdateVariable(activeConnectionData.id, variable.id, { description: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '4px',
                                        fontSize: '11px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '2px'
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Global Variables Preview */}
                    {activeConnectionData.variables.length > 0 && (
                        <div style={{
                            padding: '10px',
                            backgroundColor: '#e8f5e8',
                            border: '1px solid #c8e6c9',
                            borderRadius: '3px',
                            fontSize: '11px'
                        }}>
                            <strong>Global Variables Available:</strong>
                            <div style={{ marginTop: '5px', fontFamily: 'monospace' }}>
                                {activeConnectionData.variables.map(variable => (
                                    <div key={variable.id}>
                                        • <code>{variable.name}</code> ({variable.type})
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataConnections;
