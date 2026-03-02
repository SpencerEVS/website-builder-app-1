import React, { useState } from 'react';
import { DataConnection } from '../../types';

interface VariablesViewProps {
  dataConnections: DataConnection;
  onDataConnectionsChange: (dataConnections: DataConnection) => void;
}

const VariablesView: React.FC<VariablesViewProps> = ({ dataConnections, onDataConnectionsChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'api' | 'global'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVariable, setNewVariable] = useState<{
    name: string;
    type: 'string' | 'number' | 'boolean';
    value: string;
    description: string;
  }>({
    name: '',
    type: 'string',
    value: '',
    description: ''
  });

  // Collect all variables from API connections
  const apiVariables = dataConnections.apiConnections.flatMap(connection => 
    connection.variables.map(variable => ({
      ...variable,
      // Use the type defined in the API variable definition
      type: variable.type,
      source: connection.name,
      sourceType: 'api',
      connectionId: connection.id,
      enabled: connection.enabled
    }))
  );

  // Convert global variables to display format
  const globalVariables = Object.entries(dataConnections.globalVariables).map(([key, value]) => ({
    id: `global-${key}`,
    name: key,
    type: typeof value,
    value: value,
    source: 'Global',
    sourceType: 'global',
    description: 'Global variable'
  }));

  // Combine and filter variables
  const allVariables = [...apiVariables, ...globalVariables];
  const filteredVariables = allVariables.filter(variable => {
    const matchesSearch = variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variable.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || variable.sourceType === filterType;
    return matchesSearch && matchesFilter;
  });

  const getVariableStatusIcon = (variable: any) => {
    if (variable.sourceType === 'global') return '🌐';
    return variable.enabled ? '🟢' : '🔴';
  };

  const getVariableTypeColor = (type: string) => {
    switch (type) {
      case 'string': return '#28a745';
      case 'number': return '#007bff';
      case 'boolean': return '#6f42c1';
      case 'object': return '#fd7e14';
      case 'array': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const handleCreateVariable = () => {
    if (!newVariable.name.trim()) return;
    
    let parsedValue: any = newVariable.value;
    if (newVariable.type === 'number') {
      parsedValue = parseFloat(newVariable.value) || 0;
    } else if (newVariable.type === 'boolean') {
      parsedValue = newVariable.value.toLowerCase() === 'true';
    }

    onDataConnectionsChange({
      ...dataConnections,
      globalVariables: {
        ...dataConnections.globalVariables,
        [newVariable.name]: parsedValue
      }
    });

    // Reset form
    setNewVariable({ name: '', type: 'string', value: '', description: '' });
    setShowCreateForm(false);
  };

  const handleDeleteVariable = (variableName: string) => {
    const { [variableName]: deleted, ...remainingVariables } = dataConnections.globalVariables;
    onDataConnectionsChange({
      ...dataConnections,
      globalVariables: remainingVariables
    });
  };

  const handleUpdateVariable = (variableName: string, newValue: any) => {
    onDataConnectionsChange({
      ...dataConnections,
      globalVariables: {
        ...dataConnections.globalVariables,
        [variableName]: newValue
      }
    });
  };

  return (
    <div style={{ 
      padding: '20px', 
      height: '100%', 
      overflow: 'auto',
      backgroundColor: '#ffffff'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ 
          margin: '0 0 10px 0', 
          color: '#333',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          📊 Variables Overview
        </h2>
        <p style={{ 
          margin: 0, 
          color: '#6c757d',
          fontSize: '14px'
        }}>
          View all global variables and API-extracted data points
        </p>
      </div>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => {
            // @ts-ignore
            setFilterType(e.target.value);
          }}
          style={{
            padding: '8px 12px',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Variables ({allVariables.length})</option>
          <option value="api">API Variables ({apiVariables.length})</option>
          <option value="global">Global Variables ({globalVariables.length})</option>
        </select>
        
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '12px 16px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {showCreateForm ? (
            <>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>×</span>
              <span>Cancel</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>+</span>
              <span>Create Global Variable</span>
            </>
          )}
        </button>
      </div>

      {/* Create Variable Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Create New Global Variable</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px',
            marginBottom: '15px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>
                Variable Name *
              </label>
              <input
                type="text"
                value={newVariable.name}
                onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                placeholder="Enter variable name"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>
                Type
              </label>
              <select
                value={newVariable.type}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'string' || value === 'number' || value === 'boolean') {
                    setNewVariable({ ...newVariable, type: value });
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>
                Initial Value *
              </label>
              <input
                type={newVariable.type === 'number' ? 'number' : 'text'}
                value={newVariable.value}
                onChange={(e) => setNewVariable({ ...newVariable, value: e.target.value })}
                placeholder={
                  newVariable.type === 'boolean' ? 'true or false' :
                  newVariable.type === 'number' ? 'Enter number' : 'Enter text value'
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>
              Description (Optional)
            </label>
            <input
              type="text"
              value={newVariable.description}
              onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
              placeholder="Describe what this variable is used for"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreateVariable}
              disabled={!newVariable.name.trim() || !newVariable.value.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: newVariable.name.trim() && newVariable.value.trim() ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: newVariable.name.trim() && newVariable.value.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              ✅ Create Variable
            </button>
            <button
              onClick={() => {
                setNewVariable({ name: '', type: 'string', value: '', description: '' });
                setShowCreateForm(false);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: '#6c757d',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Variables List */}
      {filteredVariables.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6c757d'
        }}>
          {searchTerm || filterType !== 'all' ? (
            <>
              <h3>No variables found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </>
          ) : (
            <>
              <h3>No variables available</h3>
              <p>Create API connections or global variables to see them here</p>
            </>
          )}
        </div>
      ) : (
        <div style={{
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 200px 100px 150px 1fr 100px 100px',
            backgroundColor: '#f8f9fa',
            padding: '12px',
            borderBottom: '1px solid #dee2e6',
            fontWeight: 'bold',
            fontSize: '12px',
            color: '#495057'
          }}>
            <div>Status</div>
            <div>Variable Name</div>
            <div>Type</div>
            <div>Source</div>
            <div>Description/Path</div>
            <div>Value</div>
            <div>Actions</div>
          </div>

          {/* Table Body */}
          {filteredVariables.map((variable, index) => (
            <div
              key={variable.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 200px 100px 150px 1fr 100px 100px',
                padding: '12px',
                borderBottom: index < filteredVariables.length - 1 ? '1px solid #dee2e6' : 'none',
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                fontSize: '13px',
                alignItems: 'center'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                {getVariableStatusIcon(variable)}
              </div>
              <div style={{ 
                fontWeight: 'bold',
                color: '#333',
                wordBreak: 'break-word'
              }}>
                {variable.name}
              </div>
              <div>
                <span style={{
                  backgroundColor: getVariableTypeColor(variable.type),
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  {variable.type.toUpperCase()}
                </span>
              </div>
              <div style={{ color: '#6c757d' }}>
                {variable.source}
              </div>
              <div style={{ 
                color: '#6c757d',
                fontSize: '12px',
                wordBreak: 'break-word'
              }}>
                {'jsonPath' in variable ? variable.jsonPath : variable.description || '-'}
              </div>
              <div style={{ 
                fontSize: '12px',
                color: '#495057',
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {'value' in variable ? 
                  (typeof variable.value === 'object' ? 
                    JSON.stringify(variable.value).substring(0, 20) + '...' : 
                    String(variable.value)
                  ) : 
                  'Runtime'
                }
              </div>
              <div style={{ textAlign: 'center' }}>
                {variable.sourceType === 'global' && (
                  <button
                    onClick={() => handleDeleteVariable(variable.name)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      margin: '0 auto'
                    }}
                    title="Delete global variable"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Summary</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px',
          fontSize: '14px'
        }}>
          <div>
            <strong>Total Variables:</strong> {allVariables.length}
          </div>
          <div>
            <strong>API Connections:</strong> {dataConnections.apiConnections.length}
          </div>
          <div>
            <strong>Active APIs:</strong> {dataConnections.apiConnections.filter(api => api.enabled).length}
          </div>
          <div>
            <strong>Global Variables:</strong> {globalVariables.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariablesView;