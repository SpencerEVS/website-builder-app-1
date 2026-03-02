import React, { useState } from 'react';
import { LayerState, WindowPanel } from '../../types';

interface LayerManagementProps {
    layerStates: LayerState[];
    windows: WindowPanel[];
    onLayerVisibilityChange: (layerNumber: number, visible: boolean) => void;
    onLayerNameChange: (layerNumber: number, name: string) => void;
    onMoveWindowToLayer: (windowId: string, newLayer: number) => void;
    onAddNewLayer: () => void;
    onRemoveLayer: (layerNumber: number) => void;
    activeLayer?: number;
    onLayerSelect?: (layerNumber: number) => void;
}

const LayerManagement: React.FC<LayerManagementProps> = ({
    layerStates,
    windows,
    onLayerVisibilityChange,
    onLayerNameChange,
    onMoveWindowToLayer,
    onAddNewLayer,
    onRemoveLayer,
    activeLayer = 1,
    onLayerSelect
}) => {
    const [editingLayer, setEditingLayer] = useState<number | null>(null);
    const [editingName, setEditingName] = useState<string>('');

    const handleStartEdit = (layer: LayerState) => {
        setEditingLayer(layer.layerNumber);
        setEditingName(layer.name);
    };

    const handleSaveEdit = () => {
        if (editingLayer !== null) {
            onLayerNameChange(editingLayer, editingName);
        }
        setEditingLayer(null);
        setEditingName('');
    };

    const handleCancelEdit = () => {
        setEditingLayer(null);
        setEditingName('');
    };

    const getWindowsInLayer = (layerNumber: number) => {
        return windows.filter(window => window.layer === layerNumber);
    };

    // Sort layers by layer number (highest first for visual stacking order)
    const sortedLayers = [...layerStates].sort((a, b) => b.layerNumber - a.layerNumber);

    return (
        <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            height: '100%',
            overflow: 'auto'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: '2px solid #e0e0e0'
            }}>
                <h3 style={{
                    margin: 0,
                    color: '#2c3e50',
                    fontSize: '16px',
                    fontWeight: '600'
                }}>
                    Layer Management
                </h3>
                <button
                    onClick={onAddNewLayer}
                    style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                    title="Add New Layer"
                >
                    + Add Layer
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sortedLayers.map(layer => {
                    const windowsInLayer = getWindowsInLayer(layer.layerNumber);
                    
                    return (
                        <div
                            key={layer.layerNumber}
                            style={{
                                backgroundColor: layer.visible ? 'white' : '#f8f9fa',
                                border: activeLayer === layer.layerNumber ? '2px solid #28a745' : (layer.visible ? '1px solid #007bff' : '1px solid #dee2e6'),
                                borderRadius: '6px',
                                padding: '12px',
                                opacity: layer.visible ? 1 : 0.6,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {/* Layer Header */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={layer.visible}
                                    onChange={(e) => onLayerVisibilityChange(layer.layerNumber, e.target.checked)}
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        cursor: 'pointer'
                                    }}
                                />
                                
                                {editingLayer === layer.layerNumber ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                                            style={{
                                                flex: 1,
                                                padding: '2px 6px',
                                                fontSize: '12px',
                                                border: '1px solid #007bff',
                                                borderRadius: '3px'
                                            }}
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSaveEdit}
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
                                            ✓
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            style={{
                                                padding: '2px 6px',
                                                fontSize: '10px',
                                                backgroundColor: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '2px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span
                                            style={{
                                                flex: 1,
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: layer.visible ? '#2c3e50' : '#6c757d',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleStartEdit(layer)}
                                            title="Click to edit name"
                                        >
                                            {layer.name}
                                        </span>
                                        
                                        <span style={{
                                            fontSize: '11px',
                                            color: '#6c757d',
                                            backgroundColor: '#e9ecef',
                                            padding: '2px 6px',
                                            borderRadius: '10px'
                                        }}>
                                            {windowsInLayer.length} window{windowsInLayer.length !== 1 ? 's' : ''}
                                        </span>

                                        <button
                                            onClick={() => onLayerSelect?.(layer.layerNumber)}
                                            style={{
                                                padding: '2px 6px',
                                                fontSize: '10px',
                                                backgroundColor: activeLayer === layer.layerNumber ? '#28a745' : '#17a2b8',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                fontWeight: '500'
                                            }}
                                            title={activeLayer === layer.layerNumber ? 'Active layer' : 'Set as active layer'}
                                        >
                                            {activeLayer === layer.layerNumber ? '✓ Active' : 'Set Active'}
                                        </button>
                                        
                                        {layerStates.length > 1 && (
                                            <button
                                                onClick={() => onRemoveLayer(layer.layerNumber)}
                                                style={{
                                                    padding: '2px 6px',
                                                    fontSize: '10px',
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '2px',
                                                    cursor: 'pointer'
                                                }}
                                                title="Remove Layer"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Windows in Layer */}
                            {windowsInLayer.length > 0 && (
                                <div style={{
                                    fontSize: '11px',
                                    color: '#6c757d',
                                    marginLeft: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px'
                                }}>
                                    {windowsInLayer.map(window => (
                                        <div
                                            key={window.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '2px 0'
                                            }}
                                        >
                                            <span style={{
                                                color: '#495057',
                                                fontSize: '10px'
                                            }}>
                                                📄 {window.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LayerManagement;