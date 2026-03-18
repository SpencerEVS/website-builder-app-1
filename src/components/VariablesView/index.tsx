import React, { useState } from 'react';
import { DataConnection } from '../../types';

interface VariablesViewProps {
  dataConnections: DataConnection;
  onDataConnectionsChange: (dataConnections: DataConnection) => void;
}

const VariablesView: React.FC<VariablesViewProps> = ({ dataConnections, onDataConnectionsChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'global'>('all');
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
  const [editingVariable, setEditingVariable] = useState<{
    originalName: string;
    name: string;
    value: string;
  } | null>(null);

  // Collect all variables from API connections (kept for reference but hidden from display)
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

  // Get set of API variable names for description labeling
  const apiVariableNames = new Set(
    dataConnections.apiConnections.flatMap(conn => conn.variables.map(v => v.name))
  );

  // Convert global variables to display format
  const globalVariables = Object.entries(dataConnections.globalVariables).map(([key, value]) => ({
    id: `global-${key}`,
    name: key,
    type: typeof value,
    value: value,
    source: 'Global',
    sourceType: 'global',
    description: apiVariableNames.has(key) ? 'Global variable (from api)' : 'Global variable'
  }));

  // Combine and filter variables - only show globalVariables (API definitions are redundant)
  const allVariables = [...globalVariables];
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

  const handleStartEdit = (name: string, value: any) => {
    setEditingVariable({
      originalName: name,
      name: name,
      value: String(value)
    });
  };

  const handleSaveEdit = () => {
    if (!editingVariable || !editingVariable.name.trim()) return;
    const entries = Object.entries(dataConnections.globalVariables);
    const idx = entries.findIndex(([k]) => k === editingVariable.originalName);
    if (idx === -1) { setEditingVariable(null); return; }

    // Parse value to match original type
    const originalValue = entries[idx][1];
    let parsedValue: any = editingVariable.value;
    if (typeof originalValue === 'number') {
      parsedValue = parseFloat(editingVariable.value);
      if (isNaN(parsedValue)) parsedValue = 0;
    } else if (typeof originalValue === 'boolean') {
      parsedValue = editingVariable.value.toLowerCase() === 'true';
    }

    // Rebuild object preserving order, replacing the entry
    const newEntries: [string, any][] = entries.map(([k, v], i) =>
      i === idx ? [editingVariable.name.trim(), parsedValue] : [k, v]
    );
    const newGlobals: Record<string, any> = {};
    newEntries.forEach(([k, v]) => { newGlobals[k] = v; });
    onDataConnectionsChange({ ...dataConnections, globalVariables: newGlobals });
    setEditingVariable(null);
  };

  const handleCancelEdit = () => {
    setEditingVariable(null);
  };

  const handleMoveVariable = (name: string, direction: 'up' | 'down') => {
    const entries = Object.entries(dataConnections.globalVariables);
    const idx = entries.findIndex(([k]) => k === name);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= entries.length) return;
    const newEntries = [...entries];
    const temp = newEntries[idx];
    newEntries[idx] = newEntries[swapIdx];
    newEntries[swapIdx] = temp;
    const newGlobals: Record<string, any> = {};
    newEntries.forEach(([k, v]) => { newGlobals[k] = v; });
    onDataConnectionsChange({ ...dataConnections, globalVariables: newGlobals });
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
            gridTemplateColumns: '40px 220px 100px 150px 1fr 120px 160px',
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
          {filteredVariables.map((variable, index) => {
            const isEditing = editingVariable !== null && editingVariable.originalName === variable.name && variable.sourceType === 'global';
            const ev = editingVariable || { originalName: '', name: '', value: '' };
            const globalEntries = Object.entries(dataConnections.globalVariables);
            const globalIdx = variable.sourceType === 'global' ? globalEntries.findIndex(([k]) => k === variable.name) : -1;
            const isFirst = globalIdx === 0;
            const isLast = globalIdx === globalEntries.length - 1;
            return (
              <div
                key={variable.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 220px 100px 150px 1fr 120px 160px',
                  padding: '8px 12px',
                  borderBottom: index < filteredVariables.length - 1 ? '1px solid #dee2e6' : 'none',
                  backgroundColor: isEditing ? '#fffbea' : index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                  fontSize: '13px',
                  alignItems: 'center',
                  gap: '0'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  {getVariableStatusIcon(variable)}
                </div>

                {/* Name cell */}
                <div style={{ fontWeight: 'bold', color: '#333', wordBreak: 'break-word', paddingRight: '6px' }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={ev.name}
                      onChange={(e) => setEditingVariable({ ...ev, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        border: '1px solid #007bff',
                        borderRadius: '3px',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                      autoFocus
                    />
                  ) : variable.name}
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

                <div style={{ color: '#6c757d', fontSize: '12px', wordBreak: 'break-word' }}>
                  {'jsonPath' in variable ? variable.jsonPath : variable.description || '-'}
                </div>

                {/* Value cell */}
                <div style={{ fontSize: '12px', color: '#495057', paddingRight: '6px' }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={ev.value}
                      onChange={(e) => setEditingVariable({ ...ev, value: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        border: '1px solid #007bff',
                        borderRadius: '3px',
                        fontSize: '13px'
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                    />
                  ) : (
                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {'value' in variable ?
                        (typeof variable.value === 'object' ?
                          JSON.stringify(variable.value).substring(0, 20) + '...' :
                          String(variable.value)
                        ) :
                        'Runtime'
                      }
                    </span>
                  )}
                </div>

                {/* Actions cell */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap' }}>
                  {variable.sourceType === 'global' && (
                    isEditing ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          title="Save changes"
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          title="Cancel"
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(variable.name, 'value' in variable ? variable.value : '')}
                          title="Edit name and value"
                          style={{
                            padding: '4px 7px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleMoveVariable(variable.name, 'up')}
                          disabled={isFirst}
                          title="Move up"
                          style={{
                            padding: '4px 6px',
                            backgroundColor: isFirst ? '#e9ecef' : '#6c757d',
                            color: isFirst ? '#adb5bd' : 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: isFirst ? 'not-allowed' : 'pointer'
                          }}
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveVariable(variable.name, 'down')}
                          disabled={isLast}
                          title="Move down"
                          style={{
                            padding: '4px 6px',
                            backgroundColor: isLast ? '#e9ecef' : '#6c757d',
                            color: isLast ? '#adb5bd' : 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: isLast ? 'not-allowed' : 'pointer'
                          }}
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => handleDeleteVariable(variable.name)}
                          title="Delete variable"
                          style={{
                            padding: '4px 7px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️
                        </button>
                      </>
                    )
                  )}
                </div>
              </div>
            );
          })}
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