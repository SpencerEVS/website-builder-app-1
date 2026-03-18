import React, { useState, useRef } from 'react';
import { LayerState, WindowPanel, BackgroundConfig, BuilderPage, DataConnection } from '../../types';

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
    selectedWindow?: WindowPanel | null;
    onWindowUpdate?: (windowId: string, updates: Partial<WindowPanel>) => void;
    backgroundConfig?: BackgroundConfig;
    onBackgroundConfigChange?: (config: BackgroundConfig) => void;
    builderPages?: BuilderPage[];
    activeBuilderPageId?: string;
    onBuilderPageNameChange?: (pageId: string, name: string) => void;
    appName?: string;
    onAppNameChange?: (name: string) => void;
    dataConnections?: DataConnection;
    onDataConnectionsChange?: (dataConnections: DataConnection) => void;
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
    onLayerSelect,
    selectedWindow,
    onWindowUpdate,
    backgroundConfig = { width: 1200, height: 800, color: '#ffffff' },
    onBackgroundConfigChange,
    builderPages = [],
    activeBuilderPageId,
    onBuilderPageNameChange,
    appName = 'My Web App',
    onAppNameChange,
    dataConnections,
    onDataConnectionsChange
}) => {
    const [panelTab, setPanelTab] = useState<'layers' | 'properties' | 'variables'>('layers');
    const [editingLayer, setEditingLayer] = useState<number | null>(null);
    const [editingName, setEditingName] = useState<string>('');
    const [codeEditorHeight, setCodeEditorHeight] = useState<number>(300);
    const codeEditorDragRef = useRef<{ startY: number; startHeight: number } | null>(null);
    const [windowPropsEdit, setWindowPropsEdit] = useState({
        name: selectedWindow?.title || '',
        description: selectedWindow?.description || '',
        posX: selectedWindow?.position.x || 0,
        posY: selectedWindow?.position.y || 0,
        width: selectedWindow?.size.width || 0,
        height: selectedWindow?.size.height || 0
    });

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

    // Update windowPropsEdit when selectedWindow changes
    React.useEffect(() => {
        if (selectedWindow) {
            setWindowPropsEdit({
                name: selectedWindow.title || '',
                description: selectedWindow.description || '',
                posX: selectedWindow.position.x || 0,
                posY: selectedWindow.position.y || 0,
                width: selectedWindow.size.width || 0,
                height: selectedWindow.size.height || 0
            });
            setPanelTab('properties');
        }
    }, [selectedWindow]);

    const handleWindowPropChange = (key: string, value: any) => {
        const updatedProps = { ...windowPropsEdit, [key]: value };
        setWindowPropsEdit(updatedProps);
        
        // Auto-save on change
        if (!selectedWindow) return;
        if (key === 'name') {
            onWindowUpdate?.(selectedWindow.id, { title: value });
        } else if (key === 'description') {
            onWindowUpdate?.(selectedWindow.id, { description: value });
        } else if (key === 'posX' || key === 'posY') {
            onWindowUpdate?.(selectedWindow.id, {
                position: { x: updatedProps.posX, y: updatedProps.posY }
            });
        } else if (key === 'width' || key === 'height') {
            onWindowUpdate?.(selectedWindow.id, {
                size: { width: updatedProps.width, height: updatedProps.height }
            });
        }
    };

    const panelTabs: ('layers' | 'properties' | 'variables')[] = ['layers', 'properties', 'variables'];

    // Handle code editor resizing
    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!codeEditorDragRef.current) return;
            const delta = e.clientY - codeEditorDragRef.current.startY;
            const newHeight = Math.max(100, codeEditorDragRef.current.startHeight + delta);
            setCodeEditorHeight(newHeight);
        };

        const handleMouseUp = () => {
            codeEditorDragRef.current = null;
        };

        if (codeEditorDragRef.current) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [codeEditorHeight]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: '#f8f9fa',
            boxSizing: 'border-box',
            width: '100%'
        }}>
            {/* Tab Bar */}
            <div style={{
                display: 'flex',
                borderBottom: '2px solid #dee2e6',
                backgroundColor: '#ffffff',
                flexShrink: 0
            }}>
                {panelTabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setPanelTab(tab)}
                        style={{
                            flex: 1,
                            padding: '10px 8px',
                            border: 'none',
                            borderBottom: panelTab === tab ? '2px solid #007bff' : '2px solid transparent',
                            marginBottom: '-2px',
                            backgroundColor: panelTab === tab ? '#f8f9fa' : '#ffffff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: panelTab === tab ? '700' : '500',
                            color: panelTab === tab ? '#007bff' : '#6c757d',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {tab === 'layers' && 'Layers'}
                        {tab === 'properties' && 'Properties'}
                        {tab === 'variables' && 'Variables'}
                        {tab === 'properties' && selectedWindow && (
                            <span style={{
                                display: 'inline-block',
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: '#28a745',
                                marginLeft: '5px',
                                verticalAlign: 'middle'
                            }} />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: '15px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>

                {/* ── LAYERS TAB ── */}
                {panelTab === 'layers' && (
                    <>
                        {/* Layer Management Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '15px',
                            paddingBottom: '10px',
                            borderBottom: '2px solid #e0e0e0'
                        }}>
                            <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '16px', fontWeight: '600' }}>
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
                                            transition: 'all 0.2s ease',
                                            overflow: 'hidden',
                                            boxSizing: 'border-box',
                                            minWidth: 0
                                        }}
                                    >
                                        {/* Layer Header */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            marginBottom: windowsInLayer.length > 0 ? '8px' : '0',
                                            minWidth: 0,
                                            overflow: 'hidden'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={layer.visible}
                                                onChange={(e) => onLayerVisibilityChange(layer.layerNumber, e.target.checked)}
                                                style={{ width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                                            />
                                            {editingLayer === layer.layerNumber ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
                                                    <input
                                                        type="text"
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                                                        style={{ flex: 1, padding: '2px 6px', fontSize: '12px', border: '1px solid #007bff', borderRadius: '3px', minWidth: 0 }}
                                                        autoFocus
                                                    />
                                                    <button onClick={handleSaveEdit} style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', flexShrink: 0 }}>✓</button>
                                                    <button onClick={handleCancelEdit} style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span
                                                        style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: '600', color: layer.visible ? '#2c3e50' : '#6c757d', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                        onClick={() => handleStartEdit(layer)}
                                                        title="Click to edit name"
                                                    >
                                                        {layer.name}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: '#6c757d', backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '10px', flexShrink: 0 }}>
                                                        {windowsInLayer.length} window{windowsInLayer.length !== 1 ? 's' : ''}
                                                    </span>
                                                    <button
                                                        onClick={() => onLayerSelect?.(layer.layerNumber)}
                                                        style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: activeLayer === layer.layerNumber ? '#28a745' : '#17a2b8', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: '500', flexShrink: 0 }}
                                                        title={activeLayer === layer.layerNumber ? 'Active layer' : 'Set as active layer'}
                                                    >
                                                        {activeLayer === layer.layerNumber ? '✓ Active' : 'Set Active'}
                                                    </button>
                                                    {layerStates.length > 1 && (
                                                        <button
                                                            onClick={() => onRemoveLayer(layer.layerNumber)}
                                                            style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', flexShrink: 0 }}
                                                            title="Remove Layer"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {windowsInLayer.length > 0 && (
                                            <div style={{ fontSize: '11px', color: '#6c757d', marginLeft: '24px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                {windowsInLayer.map(w => (
                                                    <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 0' }}>
                                                        <span style={{ color: '#495057', fontSize: '10px' }}>📄 {w.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* ── PROPERTIES TAB ── */}
                {panelTab === 'properties' && (
                    <>
                        {!selectedWindow ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {/* Page Name */}
                                <div>
                                    <label style={{ fontSize: '11px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Page Name</label>
                                    <input
                                        type="text"
                                        value={builderPages.find(p => p.id === activeBuilderPageId)?.name || ''}
                                        onChange={(e) => {
                                            if (activeBuilderPageId) {
                                                onBuilderPageNameChange?.(activeBuilderPageId, e.target.value);
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '7px 8px',
                                            fontSize: '13px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            boxSizing: 'border-box'
                                        }}
                                        placeholder="Enter page name"
                                    />
                                </div>

                                {/* App Name */}
                                <div>
                                    <label style={{ fontSize: '11px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>App Name</label>
                                    <input
                                        type="text"
                                        value={appName}
                                        onChange={(e) => onAppNameChange?.(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '7px 8px',
                                            fontSize: '13px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            boxSizing: 'border-box'
                                        }}
                                        placeholder="Enter app name"
                                    />
                                </div>

                                <h3 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#555', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Background Settings</h3>
                                
                                <div>
                                    <label style={{ fontSize: '11px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Width (px)</label>
                                    <input
                                        type="number"
                                        value={backgroundConfig.width}
                                        onChange={(e) => onBackgroundConfigChange?.({
                                            ...backgroundConfig,
                                            width: parseInt(e.target.value) || 1200
                                        })}
                                        style={{
                                            width: '100%',
                                            padding: '7px 8px',
                                            fontSize: '13px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '11px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Height (px)</label>
                                    <input
                                        type="number"
                                        value={backgroundConfig.height}
                                        onChange={(e) => onBackgroundConfigChange?.({
                                            ...backgroundConfig,
                                            height: parseInt(e.target.value) || 800
                                        })}
                                        style={{
                                            width: '100%',
                                            padding: '7px 8px',
                                            fontSize: '13px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '11px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Background Color</label>
                                    <input
                                        type="color"
                                        value={backgroundConfig.color}
                                        onChange={(e) => onBackgroundConfigChange?.({
                                            ...backgroundConfig,
                                            color: e.target.value
                                        })}
                                        style={{
                                            width: '100%',
                                            height: '36px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minHeight: 0 }}>
                                {/* Name */}
                                <div>
                                    <label style={{ fontSize: '11px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Name</label>
                                    <input
                                        type="text"
                                        value={windowPropsEdit.name}
                                        onChange={(e) => handleWindowPropChange('name', e.target.value)}
                                        style={{ width: '100%', padding: '7px 8px', fontSize: '13px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }}
                                        placeholder="Window name"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label style={{ fontSize: '11px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Description</label>
                                    <textarea
                                        value={windowPropsEdit.description}
                                        onChange={(e) => handleWindowPropChange('description', e.target.value)}
                                        style={{ width: '100%', padding: '7px 8px', fontSize: '13px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box', minHeight: '52px', resize: 'vertical', fontFamily: 'inherit' }}
                                        placeholder="Window description"
                                    />
                                </div>

                                {/* Position */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>X</label>
                                        <input type="number" value={windowPropsEdit.posX} onChange={(e) => handleWindowPropChange('posX', parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '7px 8px', fontSize: '13px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Y</label>
                                        <input type="number" value={windowPropsEdit.posY} onChange={(e) => handleWindowPropChange('posY', parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '7px 8px', fontSize: '13px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
                                    </div>
                                </div>

                                {/* Size */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Width</label>
                                        <input type="number" value={windowPropsEdit.width} onChange={(e) => handleWindowPropChange('width', parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '7px 8px', fontSize: '13px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: '#555', fontWeight: '600', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Height</label>
                                        <input type="number" value={windowPropsEdit.height} onChange={(e) => handleWindowPropChange('height', parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '7px 8px', fontSize: '13px', border: '1px solid #ced4da', borderRadius: '4px', boxSizing: 'border-box' }} />
                                    </div>
                                </div>

                                {/* Code / Content editor with resize handle */}
                                {(selectedWindow.type === 'javascript' || selectedWindow.type === 'html') && (
                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <label style={{ fontSize: '11px', color: '#555', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                                {selectedWindow.type === 'javascript' ? 'JavaScript Code' : 'HTML Content'}
                                            </label>
                                            <span style={{ fontSize: '10px', color: '#6c757d', backgroundColor: '#e9ecef', padding: '2px 6px', borderRadius: '8px' }}>
                                                {selectedWindow.type === 'javascript' ? 'JS' : 'HTML'}
                                            </span>
                                        </div>
                                        {/* Resize Handle */}
                                        <div
                                            onMouseDown={(e) => {
                                                codeEditorDragRef.current = { startY: e.clientY, startHeight: codeEditorHeight };
                                                e.preventDefault();
                                            }}
                                            style={{
                                                height: '6px',
                                                backgroundColor: '#e9ecef',
                                                cursor: 'row-resize',
                                                borderRadius: '3px',
                                                margin: '4px 0',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d0d3d8'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#e9ecef'; }}
                                        />
                                        <textarea
                                            value={selectedWindow.type === 'javascript' ? (selectedWindow.jsCode || '') : (selectedWindow.content || '')}
                                            onChange={(e) => {
                                                if (selectedWindow.type === 'javascript') {
                                                    onWindowUpdate?.(selectedWindow.id, { jsCode: e.target.value });
                                                } else {
                                                    onWindowUpdate?.(selectedWindow.id, { content: e.target.value });
                                                }
                                            }}
                                            spellCheck={false}
                                            style={{
                                                width: '100%',
                                                flex: 1,
                                                padding: '10px',
                                                fontSize: '12px',
                                                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                boxSizing: 'border-box',
                                                resize: 'none',
                                                backgroundColor: '#ffffff',
                                                color: '#333333',
                                                lineHeight: '1.5',
                                                tabSize: 2
                                            }}
                                            placeholder={selectedWindow.type === 'javascript' ? '// Write JavaScript here...' : '<!-- Write HTML here -->'}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ── VARIABLES TAB ── */}
                {panelTab === 'variables' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Global Variables Section */}
                        <div>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#555', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Global Variables</h3>
                            {!dataConnections || Object.keys(dataConnections.globalVariables).length === 0 ? (
                                <div style={{ padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>
                                    No global variables defined
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {Object.entries(dataConnections.globalVariables).map(([name, value]) => (
                                        <div key={name} style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e9ecef', borderRadius: '4px', fontSize: '12px' }}>
                                            <div style={{ fontWeight: '600', color: '#495057', marginBottom: '4px' }}>
                                                {name}
                                            </div>
                                            <div style={{ color: '#6c757d', wordBreak: 'break-word' }}>
                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Page Functions Section */}
                        <div>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#555', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Page Functions</h3>
                            {!builderPages || builderPages.length === 0 ? (
                                <div style={{ padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>
                                    No pages created yet
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {builderPages.map(page => {
                                        const functionName = `goTo${page.name.replace(/[^a-zA-Z0-9]/g, '')}`;
                                        return (
                                            <div key={page.id} style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid #e9ecef', borderRadius: '4px', fontSize: '12px' }}>
                                                <div style={{ fontWeight: '600', color: '#495057', marginBottom: '4px' }}>
                                                    📄 {page.name}
                                                </div>
                                                <div style={{ color: '#6c757d', fontSize: '11px', fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}>
                                                    {functionName}()
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>                    </div>
                )}
            </div>
        </div>
    );
};

export default LayerManagement;