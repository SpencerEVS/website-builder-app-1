import React, { useState, useEffect } from 'react';
import { getCodeTemplates, getHtmlTemplates } from './templates/templateRegistry';

// Load templates from the template registry - kept separate by type
// Templates are stored as standalone files in the templates/ folder
const codeTemplates = getCodeTemplates();
const htmlTemplates = getHtmlTemplates();

interface Template {
    name: string;
    description: string;
    code: string;
    type?: 'javascript' | 'html';
    saved?: string;
    lastModified?: string;
    defaultSize?: { width: number; height: number };
    defaultPosition?: { x: number; y: number };
}

interface VisualizationLibraryProps {
    onSelect?: (id: string) => void;
    onAddTemplate?: (type: 'javascript' | 'html' | 'visualization', template: Template) => void;
    globalVariables?: Record<string, any>;
    onUpdateGlobalVariables?: (variables: Record<string, any>) => void;
}

const VisualizationLibrary: React.FC<VisualizationLibraryProps> = ({ onSelect, onAddTemplate, globalVariables = {}, onUpdateGlobalVariables }) => {
    const [mainTab, setMainTab] = useState<'library' | 'styles'>('library');
    const [activeTab, setActiveTab] = useState<'javascript' | 'html' | 'local'>('javascript');
    const [styleTab, setStyleTab] = useState<'colours' | 'fonts'>('colours');
    const [localTemplates, setLocalTemplates] = useState<Record<string, Template>>({});
    const [nextColorId, setNextColorId] = useState(1);
    const [loadedFonts, setLoadedFonts] = useState<Record<string, string>>({});

    // Sync loaded fonts from window.parent.globalFonts on mount and periodically
    useEffect(() => {
        const syncFonts = () => {
            try {
                const parentWind: any = window.parent;
                if (parentWind && parentWind.globalFonts && typeof parentWind.globalFonts === 'object') {
                    // Only update if fonts actually changed (compare object keys/values)
                    const newFontsStr = JSON.stringify(parentWind.globalFonts);
                    setLoadedFonts(prev => {
                        const prevStr = JSON.stringify(prev);
                        if (newFontsStr !== prevStr) {
                            return parentWind.globalFonts;
                        }
                        return prev;
                    });
                }
            } catch (e) {
                // Ignore cross-origin errors
            }
        };

        // Initial sync
        syncFonts();

        // Poll for changes every 500ms to detect when Font Loader widget adds fonts
        const interval = setInterval(syncFonts, 500);

        return () => clearInterval(interval);
    }, []);

    // Get color variables from global variables (filter for global_style_* variables)
    const getColorVariables = () => {
        const colors: Record<string, string> = {};
        Object.entries(globalVariables).forEach(([key, value]) => {
            if (key.startsWith('global_style_') && typeof value === 'string') {
                colors[key] = value;
            }
        });
        return colors;
    };

    const colorVariables = getColorVariables();

    // Load templates from selected files
    const loadTemplatesFromFiles = (files: FileList) => {
        const templates: any = {};
        let loadedCount = 0;
        
        Array.from(files).forEach((file) => {
            if (!file.name.endsWith('.json')) return;
            
            const reader = new FileReader();
            reader.onload = (event: any) => {
                try {
                    const template = JSON.parse(event.target.result);
                    const templateId = `file_${Date.now()}_${Math.random()}`;
                    templates[templateId] = {
                        ...template,
                        fileName: file.name,
                        filePath: file.webkitRelativePath || file.name
                    };
                    loadedCount++;
                    
                    if (loadedCount === files.length) {
                        setLocalTemplates(templates);
                    }
                } catch (error) {
                    console.error(`Error loading template from ${file.name}:`, error);
                    loadedCount++;
                    
                    if (loadedCount === files.length) {
                        setLocalTemplates(templates);
                    }
                }
            };
            reader.readAsText(file);
        });
    };

    const handleAddTemplate = (templateId: string) => {
        let template = null;
        
        if (activeTab === 'javascript') {
            template = codeTemplates[templateId];
        } else if (activeTab === 'html') {
            template = htmlTemplates[templateId];
        } else if (activeTab === 'local') {
            template = localTemplates[templateId];
        }
        
        if (template && onAddTemplate) {
            const typedTemplate: any = template;
            const windowType = (activeTab === 'local' && typedTemplate.type) ? typedTemplate.type : activeTab;
            onAddTemplate(windowType, typedTemplate);
        }
    };

    const deleteLocalTemplate = (templateId: string) => {
        if (confirm('Remove this template from the current session?')) {
            const updatedTemplates = { ...localTemplates };
            delete updatedTemplates[templateId];
            setLocalTemplates(updatedTemplates);
        }
    };

    const selectTemplateFiles = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.json';
        
        input.onchange = (e: any) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                loadTemplatesFromFiles(files);
            }
        };
        input.click();
    };

    const getCurrentTemplates = () => {
        if (activeTab === 'javascript') return codeTemplates;
        if (activeTab === 'html') return htmlTemplates;
        if (activeTab === 'local') return localTemplates;
        return {};
    };

    const addColorVariable = (hexColor?: string) => {
        // Count existing color variables
        const existingColorCount = Object.keys(globalVariables).filter(
            key => key.startsWith('global_style_')
        ).length;
        
        // Determine the color: black for first, random for subsequent
        const finalColor = hexColor || (existingColorCount === 0 
            ? '#000000'  // First color is black
            : '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')  // Random color
        );
        
        const variableName = `global_style_${nextColorId}`;
        const updatedGlobals = {
            ...globalVariables,
            [variableName]: finalColor
        };
        setNextColorId(prev => prev + 1);
        onUpdateGlobalVariables?.(updatedGlobals);
    };

    const updateColorVariable = (variableName: string, hexColor: string) => {
        const updatedGlobals = {
            ...globalVariables,
            [variableName]: hexColor
        };
        onUpdateGlobalVariables?.(updatedGlobals);
    };

    const deleteColorVariable = (variableName: string) => {
        if (confirm(`Delete ${variableName}?`)) {
            const updatedGlobals = { ...globalVariables };
            delete updatedGlobals[variableName];
            onUpdateGlobalVariables?.(updatedGlobals);
        }
    };

    const addFont = (name: string, base64Data: string) => {
        if (!name.trim() || !base64Data.trim()) return;
        
        const raw = base64Data.trim().replace(/[\r\n\s]/g, '');
        const dataUri = raw.indexOf('data:') === 0 ? raw : 'data:font/ttf;base64,' + raw;
        
        const updatedFonts = {
            ...loadedFonts,
            [name]: dataUri
        };
        setLoadedFonts(updatedFonts);
        
        // Also store in window.parent.globalFonts for persistence
        try {
            const parentWind: any = window.parent;
            parentWind.globalFonts = updatedFonts;
        } catch (e) {
            // Ignore cross-origin errors
        }
    };

    const removeFont = (fontName: string) => {
        if (confirm(`Delete font "${fontName}"?`)) {
            const updatedFonts = { ...loadedFonts };
            delete updatedFonts[fontName];
            setLoadedFonts(updatedFonts);
            
            // Also update window.parent.globalFonts
            try {
                const parentWind: any = window.parent;
                parentWind.globalFonts = updatedFonts;
            } catch (e) {
                // Ignore cross-origin errors
            }
        }
    };

    const currentTemplates = getCurrentTemplates();

    return (
        <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: 'white'
        }}>
            {/* Main Tabs - Library and Styles */}
            <div style={{
                display: 'flex',
                borderBottom: '2px solid #dee2e6',
                backgroundColor: '#ffffff',
                flexShrink: 0
            }}>
                <button
                    onClick={() => setMainTab('library')}
                    style={{
                        flex: 1,
                        padding: '10px 8px',
                        border: 'none',
                        borderBottom: mainTab === 'library' ? '2px solid #007bff' : '2px solid transparent',
                        marginBottom: '-2px',
                        backgroundColor: mainTab === 'library' ? '#f8f9fa' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: mainTab === 'library' ? '700' : '500',
                        color: mainTab === 'library' ? '#007bff' : '#6c757d',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}
                >
                    Library
                </button>
                <button
                    onClick={() => setMainTab('styles')}
                    style={{
                        flex: 1,
                        padding: '10px 8px',
                        border: 'none',
                        borderBottom: mainTab === 'styles' ? '2px solid #007bff' : '2px solid transparent',
                        marginBottom: '-2px',
                        backgroundColor: mainTab === 'styles' ? '#f8f9fa' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: mainTab === 'styles' ? '700' : '500',
                        color: mainTab === 'styles' ? '#007bff' : '#6c757d',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}
                >
                    Styles
                </button>
            </div>

            {/* Content Area */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '15px'
            }}>
                {mainTab === 'library' && (
                    <div>
                        {/* Template Sub-Tabs */}
                        <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => setActiveTab('javascript')}
                    style={{
                        padding: '8px 16px',
                        marginRight: '5px',
                        backgroundColor: activeTab === 'javascript' ? '#007bff' : '#f8f9fa',
                        color: activeTab === 'javascript' ? 'white' : '#333',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px 4px 0 0',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    JavaScript
                </button>
                <button
                    onClick={() => setActiveTab('html')}
                    style={{
                        padding: '8px 16px',
                        marginRight: '5px',
                        backgroundColor: activeTab === 'html' ? '#007bff' : '#f8f9fa',
                        color: activeTab === 'html' ? 'white' : '#333',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px 4px 0 0',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    HTML
                </button>
                <button
                    onClick={() => setActiveTab('local')}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: activeTab === 'local' ? '#007bff' : '#f8f9fa',
                        color: activeTab === 'local' ? 'white' : '#333',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px 4px 0 0',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    My Templates ({Object.keys(localTemplates).length})
                </button>
                        </div>

                        {/* Local Templates File Selection */}
                        {activeTab === 'local' && (
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                                <button
                                    onClick={selectTemplateFiles}
                                    style={{
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                    }}
                                    title="Select individual template files"
                                >
                                    📄 Select Files
                                </button>
                                <div style={{ 
                                    flex: 1,
                                    fontSize: '10px',
                                    color: '#0c5aa6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    paddingLeft: '8px'
                                }}>
                                    💡 Select template files (.json) from your computer
                                </div>
                            </div>
                        )}

                        {/* Template List */}
                        <div>
                            {Object.entries(currentTemplates).length === 0 && activeTab === 'local' ? (
                                <div style={{
                                    padding: '20px',
                                    textAlign: 'center',
                                    color: '#6c757d',
                                    fontSize: '14px'
                                }}>
                                    No template files selected.<br />
                                    Use 📄 Select Files to load templates.
                                </div>
                            ) : (
                                Object.entries(currentTemplates).map(([id, template]) => {
                                    const typedTemplate: any = template;
                                    return (
                                        <div 
                                            key={id}
                                            style={{
                                                marginBottom: '15px',
                                                padding: '12px',
                                                border: '1px solid #dee2e6',
                                                borderRadius: '4px',
                                                backgroundColor: '#f8f9fa',
                                                position: 'relative'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onClick={() => handleAddTemplate(id)}
                                                onMouseEnter={(e) => {
                                                    const parent = e.currentTarget.parentElement;
                                                    if (parent) parent.style.backgroundColor = '#e9ecef';
                                                }}
                                                onMouseLeave={(e) => {
                                                    const parent = e.currentTarget.parentElement;
                                                    if (parent) parent.style.backgroundColor = '#f8f9fa';
                                                }}
                                            >
                                                <h4 style={{ 
                                                    margin: '0 0 5px 0', 
                                                    fontSize: '14px', 
                                                    color: '#007bff',
                                                    paddingRight: activeTab === 'local' ? '30px' : '0'
                                                }}>  
                                                    {typedTemplate.name}
                                                    {activeTab === 'local' && typedTemplate.type && (
                                                        <span style={{
                                                            marginLeft: '8px',
                                                            fontSize: '10px',
                                                            backgroundColor: typedTemplate.type === 'javascript' ? '#28a745' : typedTemplate.type === 'visualization' ? '#6f42c1' : '#fd7e14',
                                                            color: 'white',
                                                            padding: '2px 6px',
                                                            borderRadius: '10px'
                                                        }}>
                                                            {typedTemplate.type.toUpperCase()}
                                                        </span>
                                                    )}
                                                </h4>
                                                <p style={{ 
                                                    margin: 0, 
                                                    fontSize: '12px', 
                                                    color: '#6c757d',
                                                    lineHeight: '1.4'
                                                }}>
                                                    {typedTemplate.description}
                                                </p>
                                                {activeTab === 'local' && typedTemplate.filePath && (
                                                    <p style={{
                                                        margin: '5px 0 0 0',
                                                        fontSize: '10px',
                                                        color: '#868e96',
                                                        fontStyle: 'italic'
                                                    }}>
                                                        📄 {typedTemplate.filePath}
                                                    </p>
                                                )}
                                            </div>
                                            {activeTab === 'local' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteLocalTemplate(id);
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '8px',
                                                        right: '8px',
                                                        width: '20px',
                                                        height: '20px',
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        zIndex: 10
                                                    }}
                                                    title="Remove from current session"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div style={{ 
                            marginTop: '20px', 
                            padding: '10px', 
                            backgroundColor: '#e7f3ff', 
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#0c5aa6'
                        }}>
                            {activeTab === 'local' 
                                ? '💡 Use 💾 Save on JavaScript windows to create template files, then load them here'
                                : '💡 Click on any template to add it as a new window to your canvas'
                            }
                        </div>
                    </div>
                )}

                {mainTab === 'styles' && (
                    <div>
                        {/* Styles Sub-Tabs */}
                        <div style={{ marginBottom: '20px', display: 'flex', gap: '5px' }}>
                            <button
                                onClick={() => setStyleTab('colours')}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: styleTab === 'colours' ? '#007bff' : '#f8f9fa',
                                    color: styleTab === 'colours' ? 'white' : '#333',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '4px 4px 0 0',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: styleTab === 'colours' ? '600' : '500'
                                }}
                            >
                                Colours
                            </button>
                            <button
                                onClick={() => setStyleTab('fonts')}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: styleTab === 'fonts' ? '#007bff' : '#f8f9fa',
                                    color: styleTab === 'fonts' ? 'white' : '#333',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '4px 4px 0 0',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: styleTab === 'fonts' ? '600' : '500'
                                }}
                            >
                                Fonts
                            </button>
                        </div>

                        {styleTab === 'colours' && (
                            <div>
                                <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333' }}>
                                    Global Color Variables
                                </h3>
                                
                                {/* Add Color Button */}
                                <button
                                    onClick={() => addColorVariable()}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        marginBottom: '20px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.4px'
                                    }}
                                >
                                    + Add Color Variable
                                </button>

                                {/* Color Variables List */}
                                {Object.keys(colorVariables).length === 0 ? (
                                    <div style={{
                                        padding: '30px 20px',
                                        textAlign: 'center',
                                        color: '#6c757d',
                                        fontSize: '12px'
                                    }}>
                                        No color variables yet.<br />
                                        Click "Add Color Variable" to create one.
                                    </div>
                                ) : (
                                    Object.entries(colorVariables).map(([name, color]) => (
                                        <div
                                            key={name}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                marginBottom: '8px',
                                                padding: '8px',
                                                border: '1px solid #dee2e6',
                                                borderRadius: '4px',
                                                backgroundColor: '#f8f9fa'
                                            }}
                                        >
                                            <label style={{ fontSize: '10px', color: '#333', fontWeight: '600', margin: 0, minWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {name}
                                            </label>
                                            <input
                                                type='color'
                                                value={color}
                                                onChange={(e) => updateColorVariable(name, e.target.value)}
                                                style={{
                                                    width: '32px',
                                                    height: '28px',
                                                    border: '1px solid #ced4da',
                                                    borderRadius: '3px',
                                                    cursor: 'pointer',
                                                    flexShrink: 0
                                                }}
                                            />
                                            <input
                                                type='text'
                                                value={color}
                                                onChange={(e) => updateColorVariable(name, e.target.value)}
                                                placeholder='#000000'
                                                style={{
                                                    width: '80px',
                                                    padding: '5px 6px',
                                                    fontSize: '11px',
                                                    border: '1px solid #ced4da',
                                                    borderRadius: '3px',
                                                    fontFamily: 'monospace',
                                                    flexShrink: 0
                                                }}
                                            />
                                            <button
                                                onClick={() => deleteColorVariable(name)}
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    padding: 0
                                                }}
                                                title={`Delete ${name}`}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {styleTab === 'fonts' && (
                            <div>
                                <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#333' }}>
                                    Font Manager
                                </h3>
                                
                                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px', fontSize: '11px', color: '#0c5aa6' }}>
                                    💡 <strong>Tip:</strong> Loaded fonts persist until the page is refreshed. Use them in any window with font-family.
                                </div>

                                <label style={{ fontSize: '10px', color: '#333', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                                    Font Name
                                </label>
                                <input 
                                    id="font-name-input"
                                    type='text' 
                                    placeholder='e.g. My Font'
                                    style={{
                                        width: '100%',
                                        padding: '6px',
                                        marginBottom: '12px',
                                        fontSize: '11px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '3px'
                                    }}
                                />

                                <label style={{ fontSize: '10px', color: '#333', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                                    Base64 Data
                                </label>
                                <textarea 
                                    id="font-base64-input"
                                    placeholder='Paste base64 or data:font/ttf;base64,...'
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '6px',
                                        marginBottom: '12px',
                                        fontSize: '11px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '3px',
                                        fontFamily: 'monospace',
                                        resize: 'vertical'
                                    }}
                                />

                                <button
                                    onClick={() => {
                                        const nameInput = document.getElementById('font-name-input');
                                        const base64Input = document.getElementById('font-base64-input');
                                        const nameElem: any = nameInput;
                                        const base64Elem: any = base64Input;
                                        const name = (nameElem?.value || '').trim();
                                        const base64 = (base64Elem?.value || '').trim();
                                        
                                        if (!name) {
                                            alert('Please enter a font name');
                                            return;
                                        }
                                        if (!base64) {
                                            alert('Please paste font base64 data');
                                            return;
                                        }
                                        
                                        addFont(name, base64);
                                        if (nameElem) nameElem.value = '';
                                        if (base64Elem) base64Elem.value = '';
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        marginBottom: '20px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.4px'
                                    }}
                                >
                                    + Load Font
                                </button>

                                {/* Loaded Fonts List */}
                                {Object.keys(loadedFonts).length === 0 ? (
                                    <div style={{
                                        padding: '20px',
                                        textAlign: 'center',
                                        color: '#6c757d',
                                        fontSize: '12px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '4px'
                                    }}>
                                        No fonts loaded yet.<br />
                                        Add a font above to get started.
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '15px' }}>
                                        <div style={{ fontSize: '10px', color: '#333', fontWeight: '600', marginBottom: '8px' }}>
                                            LOADED FONTS ({Object.keys(loadedFonts).length})
                                        </div>
                                        {Object.keys(loadedFonts).map((fontName) => (
                                            <div
                                                key={fontName}
                                                style={{
                                                    marginBottom: '12px',
                                                    border: '1px solid #dee2e6',
                                                    borderRadius: '4px',
                                                    backgroundColor: '#f8f9fa',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '8px',
                                                        backgroundColor: '#fff'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '11px', fontWeight: '500', color: '#333', fontFamily: 'monospace' }}>
                                                        font-family: <strong>{fontName}</strong>
                                                    </span>
                                                    <button
                                                        onClick={() => removeFont(fontName)}
                                                        style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '3px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: 0
                                                        }}
                                                        title={`Remove ${fontName}`}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                <div
                                                    style={{
                                                        padding: '12px 8px',
                                                        fontFamily: fontName,
                                                        fontSize: '18px',
                                                        color: '#333',
                                                        backgroundColor: '#f8f9fa',
                                                        borderTop: '1px solid #dee2e6',
                                                        minHeight: '40px',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    The quick brown fox 0123456789
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VisualizationLibrary;
