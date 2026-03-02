import React, { useState } from 'react';
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

    const handleTestConnection = async (connectionId: string) => {
        const connection = dataConnections.apiConnections.find(conn => conn.id === connectionId);
        if (!connection) return;

        setTestingConnection(connectionId);

        try {
            const response = await fetch(connection.url, {
                method: connection.method,
                headers: connection.headers,
                body: connection.body
            });
            const data = await response.json();
            
            setTestResults(prev => ({
                ...prev,
                [connectionId]: {
                    success: true,
                    status: response.status,
                    data: data,
                    timestamp: new Date().toISOString()
                }
            }));
        } catch (error) {
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
                                const newTrigger: ApiTrigger = triggerType === 'cyclic' 
                                    ? { type: 'cyclic', interval: 5000 }
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
                        </select>

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

                    {/* API Arguments */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                API Arguments:
                            </label>
                            <button
                                onClick={() => {
                                    const newArg: ApiArgument = {
                                        id: `arg-${Date.now()}`,
                                        name: '',
                                        type: 'static',
                                        value: '',
                                        description: ''
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
                                + Add Argument
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
                                        placeholder="Argument name"
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
                                        title="Delete argument"
                                    >
                                        ×
                                    </button>
                                </div>
                                {arg.description !== undefined && (
                                    <input
                                        type="text"
                                        placeholder="Description (optional)"
                                        value={arg.description}
                                        onChange={(e) => {
                                            const newArgs = [...activeConnectionData.arguments];
                                            newArgs[index] = { ...arg, description: e.target.value };
                                            handleUpdateConnection(activeConnectionData.id, { arguments: newArgs });
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '4px',
                                            fontSize: '11px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '3px',
                                            marginTop: '5px'
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

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
                                height: expandedResponse ? '300px' : '80px',
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

                    {/* Variables */}
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Variables:</label>
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
                                    placeholder="JSON path (e.g., data.name or items[0])"
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
            )}
        </div>
    );
};

export default DataConnections;
