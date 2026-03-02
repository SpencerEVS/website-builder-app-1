import React, { useState } from 'react';
import { downloadFile } from '../../utils/downloadHelper';
import { generateCode } from '../../utils/codeGenerator';
import { WindowPanel as WindowPanelType, BackgroundConfig, DataConnection, BuilderPage } from '../../types';

interface ExportManagerProps {
    // Multi-page builder data
    builderPages?: BuilderPage[];
    onBuilderPagesChange?: (pages: BuilderPage[]) => void;
    // Legacy single-page props (for backward compatibility)
    windows: WindowPanelType[];
    backgroundConfig: BackgroundConfig;
    onBackgroundConfigChange: (config: BackgroundConfig) => void;
    dataConnections?: DataConnection;
    onWindowsChange?: (windows: WindowPanelType[]) => void;
    onDataConnectionsChange?: (dataConnections: DataConnection) => void;
}

const ExportManager: React.FC<ExportManagerProps> = ({ 
    builderPages = [],
    onBuilderPagesChange,
    windows, 
    backgroundConfig, 
    onBackgroundConfigChange, 
    dataConnections = { apiConnections: [], globalVariables: {} },
    onWindowsChange,
    onDataConnectionsChange
}) => {
    const [exportFormat, setExportFormat] = useState<'html' | 'js' | 'json'>('html');
    const [isExportExpanded, setIsExportExpanded] = useState(false);
    const [isImportExpanded, setIsImportExpanded] = useState(false);
    const [isGlobalVariablesExpanded, setIsGlobalVariablesExpanded] = useState(false);
    const [isPageFunctionsExpanded, setIsPageFunctionsExpanded] = useState(false);

    const generateMultiPageHTML = (pages: BuilderPage[], dataConnections: DataConnection) => {
        // No default navigation - users can add navigation templates if needed

        // Generate each page content without titles
        const pagesHTML = pages.map((page, index) => {
            const pageHTML = generateCode(page.windows, 'html', page.backgroundConfig, dataConnections);
            
            // Extract the body content from the generated HTML
            const bodyMatch = pageHTML.match(/<body[^>]*>([\s\S]*)<\/body>/);
            let bodyContent = bodyMatch ? bodyMatch[1] : '';
            
            // Fix JavaScript container IDs to be unique across pages
            bodyContent = bodyContent.replace(/js-container-(\d+)/g, `js-container-page${index}-$1`);
            bodyContent = bodyContent.replace(/getElementById\('js-container-(\d+)'\)/g, `getElementById('js-container-page${index}-$1')`);
            
            // Show first page by default, hide others
            const isFirstPage = index === 0;
            
            return `
        <div id="${page.id}" data-page="${page.id}" class="page-content" style="
            display: ${isFirstPage ? 'block' : 'none'};
            position: relative;
            width: ${page.backgroundConfig.width || 1200}px;
            height: ${page.backgroundConfig.height || 800}px;
            background-color: ${page.backgroundConfig.color || '#ffffff'};
            overflow: visible;
        ">
            ${bodyContent}
        </div>`;
        }).join('\n');

        // Page navigation JavaScript (for navigation templates to use)
        const pageNavScript = `
        <script>
            // Global API functions and variables
            window.apiData = {};
            window.globalVariables = ${JSON.stringify(dataConnections?.globalVariables || {})};
            window.builderPages = ${JSON.stringify(pages.map(p => ({ id: p.id, name: p.name })))};
            
            // Initialize API variables object
            window.apiVariables = {};
            ${dataConnections?.apiConnections.map(api => 
                api.variables.map(variable => 
                    `window.apiVariables['${api.name}_${variable.name}'] = '${variable.type}_value_${variable.name}';`
                ).join('\n            ')
            ).join('\n            ')}
            
            // Copy global variables to window object
            Object.assign(window, window.globalVariables);

            // Page navigation system (for navigation templates)
            function showPage(pageId) {
                // Hide all pages
                const allPages = document.querySelectorAll('.page-content');
                allPages.forEach(page => {
                    page.style.display = 'none';
                });
                
                // Show selected page and update body background
                const targetPage = document.getElementById(pageId);
                if (targetPage) {
                    targetPage.style.display = 'block';
                    
                    // Update body and html background to match page
                    const pageBackgroundColor = targetPage.style.backgroundColor || window.getComputedStyle(targetPage).backgroundColor;
                    if (pageBackgroundColor && pageBackgroundColor !== 'rgba(0, 0, 0, 0)' && pageBackgroundColor !== 'transparent') {
                        document.body.style.backgroundColor = pageBackgroundColor;
                        document.documentElement.style.backgroundColor = pageBackgroundColor;
                    }
                }
                
                // Update navigation active state (if navigation exists)
                document.querySelectorAll('.nav-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                document.querySelectorAll('[data-page-id="' + pageId + '"]').forEach(btn => {
                    btn.classList.add('active');
                });
                
                // Dispatch custom event for navigation templates
                document.dispatchEvent(new CustomEvent('pageChanged', { 
                    detail: { pageId: pageId } 
                }));
            }

            // Initialize on page load
            document.addEventListener('DOMContentLoaded', function() {
                // Always start with the first page
                const firstPageId = '${pages[0]?.id || 'page-1'}';
                showPage(firstPageId);
            });

            // Listen for navigation events from navigation templates
            document.addEventListener('pageNavigation', function(e) {
                if (e.detail && e.detail.pageId) {
                    showPage(e.detail.pageId);
                }
            });

            // Individual page functions for easy navigation (matching editor format)
            ${pages.map(page => `
            window.goTo${page.name.replace(/[^a-zA-Z0-9]/g, '')} = function() {
                showPage('${page.id}');
            };`).join('')}

            // Create pageFunctions object like in the editor
            window.pageFunctions = {
                ${pages.map(page => `'goTo${page.name.replace(/[^a-zA-Z0-9]/g, '')}': window.goTo${page.name.replace(/[^a-zA-Z0-9]/g, '')}`).join(',\n                ')}
            };


        </script>`;

        // Complete HTML document
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Page Website - ${pages.length} Pages</title>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: ${pages[0]?.backgroundConfig?.color || '#ffffff'};
            min-height: 100vh;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .nav-button.active {
            background-color: #28a745 !important;
            font-weight: 600 !important;
        }
        .page-content {
            position: relative;
        }
        /* Window positioning styles for visualizations */
        .window {
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
        /* Styles from generateCode for proper window positioning */
        .website-container {
            position: relative;
            width: 100%;
            height: 100%;
            background-color: transparent;
            overflow: visible;
        }
        .window-container {
            position: absolute;
            background: transparent;
            border: none;
            overflow: visible;
            font-family: Arial, sans-serif;
        }
        /* Responsive design */
        @media (max-width: 768px) {
            .page-content {
                width: 100% !important;
                padding: 10px !important;
                box-sizing: border-box;
            }
        }
    </style>
</head>
<body>
    ${pagesHTML}
    ${pageNavScript}
</body>
</html>`;
    };

    const transformWindowsForExport = (windows: WindowPanelType[]) => {
        // Keep all window data intact for JSON export so images survive round-trips.
        // The content field stores the full base64 data URL and must be preserved.
        return windows;
    };    const handleExport = () => {
        switch (exportFormat) {
            case 'html':
                // Always use multi-page export now
                const htmlCode = generateMultiPageHTML(builderPages, dataConnections);
                downloadFile('website.html', htmlCode);
                break;
            case 'js':
                // Always use multi-page JS export
                const allJS = builderPages.map(page => {
                    const pageJS = generateCode(page.windows, 'js', page.backgroundConfig, dataConnections);
                    return `// JavaScript for ${page.name} (${page.id})\n${pageJS}\n`;
                }).join('\n\n');
                
                const combinedJS = `// Multi-Page Website JavaScript
// Global Variables
window.builderPages = ${JSON.stringify(builderPages.map(p => ({ id: p.id, name: p.name })))};
window.globalVariables = ${JSON.stringify(dataConnections?.globalVariables || {})};

// Page Navigation Function
function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.style.display = 'block';
    }
    window.location.hash = pageId;
}

${allJS}`;
                downloadFile('website.js', combinedJS);
                break;
            case 'json':
                // Always use multi-page format
                const exportData = {
                    builderPages: builderPages.map(page => ({
                        ...page,
                        windows: transformWindowsForExport(page.windows)
                    })),
                    dataConnections,
                    exportType: 'multi-page',
                    totalPages: builderPages.length
                };
                const jsonCode = JSON.stringify(exportData, null, 2);
                downloadFile('website-config.json', jsonCode);
                break;
        }
    };

    const previewCode = () => {
        let code;
        
        // Always use multi-page preview
        if (exportFormat === 'html') {
            code = generateMultiPageHTML(builderPages, dataConnections);
        } else if (exportFormat === 'js') {
            // Combined JavaScript for all pages
            const allJS = builderPages.map(page => {
                const pageJS = generateCode(page.windows, 'js', page.backgroundConfig, dataConnections);
                return `// JavaScript for ${page.name} (${page.id})\n${pageJS}\n`;
            }).join('\n\n');
            
            code = `// Multi-Page Website JavaScript
// Global Variables
window.builderPages = ${JSON.stringify(builderPages.map(p => ({ id: p.id, name: p.name })))};
window.globalVariables = ${JSON.stringify(dataConnections?.globalVariables || {})};

${allJS}`;
            } else {
                // JSON preview
                const exportData = {
                    builderPages: builderPages.map(page => ({
                        ...page,
                        windows: transformWindowsForExport(page.windows)
                    })),
                    dataConnections,
                    exportType: 'multi-page',
                    totalPages: builderPages.length
                };
                code = JSON.stringify(exportData, null, 2);
            }
        
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
            if (exportFormat === 'html') {
                previewWindow.document.write(code);
                previewWindow.document.close();
            } else {
                previewWindow.document.write(`
                    <html>
                        <head>
                            <title>${builderPages.length > 0 ? 'Multi-Page' : 'Single-Page'} Code Preview - ${exportFormat.toUpperCase()}</title>
                            <style>
                                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                                pre { 
                                    background: #f5f5f5; 
                                    padding: 20px; 
                                    font-family: 'Courier New', monospace; 
                                    white-space: pre-wrap; 
                                    border-left: 4px solid #007bff;
                                    overflow-x: auto;
                                }
                                .header {
                                    background: #007bff;
                                    color: white;
                                    padding: 10px 20px;
                                    margin: -20px -20px 20px -20px;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <h2>${builderPages.length > 0 ? `Multi-Page Website (${builderPages.length} pages)` : 'Single-Page Website'} - ${exportFormat.toUpperCase()} Preview</h2>
                            </div>
                            <pre>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                        </body>
                    </html>
                `);
                previewWindow.document.close();
            }
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target && e.target.result;
                if (!result || typeof result !== 'string') return;
                const content = result;
                const config = JSON.parse(content);

                // Check if it's a multi-page format or legacy format
                if (config.builderPages && Array.isArray(config.builderPages)) {
                    // Multi-page format — restore any legacy 'image' type windows to 'visualization'
                    const restoredPages = config.builderPages.map((page: any) => ({
                        ...page,
                        windows: (page.windows || []).map((w: any) => 
                            w.type === 'image' ? { ...w, type: 'visualization' } : w
                        )
                    }));
                    if (onBuilderPagesChange) {
                        onBuilderPagesChange(restoredPages);
                    }
                    
                    if (config.dataConnections && onDataConnectionsChange) {
                        onDataConnectionsChange(config.dataConnections);
                    }
                } else {
                    // Legacy single-page format
                    if (config.windows && Array.isArray(config.windows)) {
                        if (onWindowsChange) {
                            onWindowsChange(config.windows);
                        }
                    }

                    if (config.backgroundConfig) {
                        onBackgroundConfigChange(config.backgroundConfig);
                    }

                    if (config.dataConnections && onDataConnectionsChange) {
                        onDataConnectionsChange(config.dataConnections);
                    }
                }

                alert('Configuration imported successfully!');
            } catch (error) {
                alert('Error importing configuration: Invalid JSON file');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        
        // Reset the input value so the same file can be imported again
        event.target.value = '';
    };

    return (
        <div style={{ 
            padding: '15px', 
            backgroundColor: 'white', 
            borderLeft: '1px solid #dee2e6',
            height: '100%',
            overflow: 'auto'
        }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Configuration Manager</h2>

            {/* Import Section */}
            <div style={{ marginBottom: '20px', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                <div 
                    style={{ 
                        padding: '12px 15px', 
                        backgroundColor: '#f8f9fa', 
                        borderBottom: isImportExpanded ? '1px solid #dee2e6' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                    onClick={() => setIsImportExpanded(!isImportExpanded)}
                >
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#28a745' }}>📥 Import Configuration</h3>
                    <span style={{ fontSize: '14px' }}>{isImportExpanded ? '▼' : '▶'}</span>
                </div>
                
                {isImportExpanded && (
                    <div style={{ padding: '15px' }}>
                        <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#6c757d' }}>
                            Import a previously exported JSON configuration file to restore windows, background settings, and data connections.
                        </p>
                        
                        <input
                            type="file"
                            accept=".json,application/json"
                            onChange={handleImport}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        />
                        
                        <div style={{ 
                            marginTop: '10px', 
                            padding: '10px', 
                            backgroundColor: '#fff3cd', 
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#856404'
                        }}>
                            ⚠️ Importing will replace your current configuration. Make sure to export your current work first!
                        </div>
                    </div>
                )}
            </div>

            {/* Export Section */}
            <div style={{ marginBottom: '20px', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                <div 
                    style={{ 
                        padding: '12px 15px', 
                        backgroundColor: '#f8f9fa', 
                        borderBottom: isExportExpanded ? '1px solid #dee2e6' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                    onClick={() => setIsExportExpanded(!isExportExpanded)}
                >
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#0066cc' }}>📤 Export Configuration</h3>
                    </div>
                    <span style={{ fontSize: '14px' }}>{isExportExpanded ? '▼' : '▶'}</span>
                </div>
                
                {isExportExpanded && (
                    <div style={{ padding: '15px' }}>
            
            {/* Background Configuration */}
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#495057' }}>Background Settings</h4>
                
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        Width (px):
                    </label>
                    <input
                        type="number"
                        value={backgroundConfig.width}
                        onChange={(e) => onBackgroundConfigChange({
                            ...backgroundConfig,
                            width: parseInt(e.target.value) || 1200
                        })}
                        style={{
                            width: '100%',
                            padding: '4px 8px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '12px'
                        }}
                    />
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        Height (px):
                    </label>
                    <input
                        type="number"
                        value={backgroundConfig.height}
                        onChange={(e) => onBackgroundConfigChange({
                            ...backgroundConfig,
                            height: parseInt(e.target.value) || 800
                        })}
                        style={{
                            width: '100%',
                            padding: '4px 8px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '12px'
                        }}
                    />
                </div>
                
                <div style={{ marginBottom: '0' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        Background Color:
                    </label>
                    <input
                        type="color"
                        value={backgroundConfig.color}
                        onChange={(e) => onBackgroundConfigChange({
                            ...backgroundConfig,
                            color: e.target.value
                        })}
                        style={{
                            width: '100%',
                            height: '32px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    />
                </div>
            </div>


            
            <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: 'bold' 
                }}>
                    Export Format:
                </label>
                <select 
                    value={exportFormat}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'html' || value === 'js' || value === 'json') {
                            setExportFormat(value);
                        }
                    }}
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                >
                    <option value="html">
                        Complete HTML
                    </option>
                    <option value="js">
                        Javascript Only
                    </option>
                    <option value="json">
                        JSON Configuration
                    </option>
                </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={handleExport}
                    disabled={windows.length === 0}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: windows.length === 0 ? '#6c757d' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: windows.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginBottom: '10px'
                    }}
                >
                    Download {exportFormat.toUpperCase()}
                </button>
                
                <button 
                    onClick={previewCode}
                    disabled={windows.length === 0}
                    style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: windows.length === 0 ? '#6c757d' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: windows.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                    }}
                >
                    Preview Code
                </button>
            </div>

            <div style={{ 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px',
                fontSize: '12px'
            }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Export Info:</h4>
                <p style={{ margin: '5px 0' }}>Windows: {windows.length}</p>
                <p style={{ margin: '5px 0' }}>
                    JavaScript Windows: {windows.filter(w => w.type === 'javascript').length}
                </p>
                <p style={{ margin: '5px 0' }}>
                    HTML Windows: {windows.filter(w => w.type === 'html').length}
                </p>
                <p style={{ margin: '5px 0' }}>
                    Visualization Windows: {windows.filter(w => w.type === 'visualization').length}
                </p>
            </div>

                        {windows.length === 0 && (
                            <div style={{ 
                                marginTop: '20px', 
                                padding: '15px', 
                                backgroundColor: '#fff3cd', 
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: '#856404'
                            }}>
                                ⚠️ Add some windows to your canvas before exporting
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Global Variables Section */}
            <div style={{ marginBottom: '20px', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                <div 
                    style={{ 
                        padding: '12px 15px', 
                        backgroundColor: '#f8f9fa', 
                        borderBottom: isGlobalVariablesExpanded ? '1px solid #dee2e6' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                    onClick={() => setIsGlobalVariablesExpanded(!isGlobalVariablesExpanded)}
                >
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#6f42c1' }}>🌐 Global Variables</h3>
                    <span style={{ fontSize: '14px' }}>{isGlobalVariablesExpanded ? '▼' : '▶'}</span>
                </div>
                
                {isGlobalVariablesExpanded && (
                    <div style={{ padding: '15px' }}>
                        <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#6c757d' }}>
                            View and reference your global variables for API connections and data management.
                        </p>
                        
                        {dataConnections.apiConnections.length > 0 ? (
                            <div>
                                {/* API Connections and their Variables */}
                                {dataConnections.apiConnections.map(api => (
                                    <div key={api.id} style={{ 
                                        marginBottom: '20px', 
                                        padding: '15px', 
                                        backgroundColor: '#f0f8ff', 
                                        borderRadius: '4px', 
                                        border: '1px solid #b3d9ff' 
                                    }}>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6f42c1', marginBottom: '8px' }}>
                                            API: {api.name} ({api.method})
                                        </div>
                                        <div style={{ 
                                            fontSize: '11px', 
                                            fontFamily: 'Monaco, Consolas, "Lucida Console", monospace', 
                                            backgroundColor: '#ffffff', 
                                            padding: '8px', 
                                            borderRadius: '3px', 
                                            border: '1px solid #dee2e6',
                                            marginBottom: '8px'
                                        }}>
                                            <div style={{ marginBottom: '4px', color: '#28a745' }}>
                                                // Call this API:<br/>
                                                <strong>await fetch{api.name.replace(/[^a-zA-Z0-9]/g, '')}()</strong>
                                            </div>
                                            {api.variables.length > 0 && (
                                                <>
                                                    <div style={{ marginBottom: '2px', color: '#6c757d' }}>// Available variables:</div>
                                                    {api.variables.map(variable => (
                                                        <div key={variable.id} style={{ color: '#dc3545' }}>
                                                            <strong>{variable.name}</strong> ({variable.type})
                                                            {variable.description && <span style={{ color: '#6c757d' }}> - {variable.description}</span>}
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Current Global Variables Values */}
                                {Object.keys(dataConnections.globalVariables).length > 0 && (
                                    <div style={{ 
                                        backgroundColor: '#f8f9fa', 
                                        border: '1px solid #dee2e6',
                                        borderRadius: '4px',
                                        padding: '12px',
                                        marginBottom: '15px'
                                    }}>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>
                                            Current Variable Values:
                                        </h4>
                                        {Object.entries(dataConnections.globalVariables).map(([key, value]) => (
                                            <div key={key} style={{ 
                                                margin: '8px 0',
                                                padding: '8px',
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #e9ecef',
                                                borderRadius: '3px',
                                                fontSize: '11px',
                                                fontFamily: 'Monaco, Consolas, "Lucida Console", monospace'
                                            }}>
                                                <div style={{ color: '#007bff', fontWeight: 'bold' }}>
                                                    {key}:
                                                </div>
                                                <div style={{ color: '#28a745', marginTop: '2px' }}>
                                                    {String(value)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div style={{ 
                                    padding: '10px', 
                                    backgroundColor: '#e7f3ff', 
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    color: '#0c5460'
                                }}>
                                    💡 <strong>Usage Tips:</strong><br/>
                                    • Use these variables in your JavaScript and HTML windows after calling the API functions<br/>
                                    • Reference them as <code style={{ backgroundColor: '#fff', padding: '1px 4px', borderRadius: '2px' }}>variableName</code> in your code<br/>
                                    • Variables are updated automatically when API calls succeed
                                </div>
                            </div>
                        ) : (
                            <div style={{ 
                                padding: '20px', 
                                backgroundColor: '#f8f9fa', 
                                borderRadius: '4px',
                                textAlign: 'center',
                                fontSize: '12px',
                                color: '#6c757d'
                            }}>
                                <div style={{ fontSize: '24px', marginBottom: '10px' }}>📊</div>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>No Global Variables</div>
                                <div>Configure API connections in the Data Connections tab to create global variables</div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Page Functions Section */}
            {builderPages.length > 0 && (
                <div style={{ marginBottom: '20px', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                    <div 
                        style={{ 
                            padding: '12px 15px', 
                            backgroundColor: '#f8f9fa', 
                            borderBottom: isPageFunctionsExpanded ? '1px solid #dee2e6' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                        onClick={() => setIsPageFunctionsExpanded(!isPageFunctionsExpanded)}
                    >
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#dc3545' }}>🔧 Page Functions</h3>
                        <span style={{ fontSize: '14px' }}>{isPageFunctionsExpanded ? '▼' : '▶'}</span>
                    </div>
                    
                    {isPageFunctionsExpanded && (
                        <div style={{ padding: '15px' }}>
                            <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#6c757d' }}>
                                Each page has a dedicated function that can be called to navigate to it. Use these functions in your JavaScript code or templates.
                            </p>
                            
                            <div style={{ 
                                marginBottom: '15px',
                                padding: '12px',
                                backgroundColor: '#fff3cd',
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: '#856404'
                            }}>
                                💡 <strong>Usage:</strong> Call any of these functions from JavaScript code, buttons, or navigation templates to switch pages.
                            </div>
                            
                            {builderPages.map(page => {
                                const functionName = `goTo${page.name.replace(/[^a-zA-Z0-9]/g, '')}`;
                                return (
                                    <div key={page.id} style={{ 
                                        margin: '8px 0',
                                        padding: '12px',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #e9ecef',
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                    }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between',
                                            marginBottom: '8px'
                                        }}>
                                            <div style={{ fontWeight: 'bold', color: '#495057' }}>
                                                📄 {page.name}
                                            </div>
                                            <div style={{ 
                                                fontSize: '10px',
                                                color: '#6c757d',
                                                fontFamily: 'Monaco, Consolas, monospace',
                                                backgroundColor: '#f8f9fa',
                                                padding: '2px 6px',
                                                borderRadius: '3px'
                                            }}>
                                                ID: {page.id}
                                            </div>
                                        </div>
                                        <div style={{ 
                                            fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
                                            backgroundColor: '#f8f9fa',
                                            padding: '8px',
                                            borderRadius: '3px',
                                            color: '#dc3545',
                                            fontWeight: 'bold'
                                        }}>
                                            {functionName}()
                                        </div>
                                        <div style={{ 
                                            marginTop: '6px',
                                            fontSize: '11px',
                                            color: '#6c757d'
                                        }}>
                                            Example: <code style={{ backgroundColor: '#f8f9fa', padding: '1px 4px', borderRadius: '2px' }}>
                                                onclick="{functionName}()"
                                            </code>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            <div style={{ 
                                marginTop: '15px',
                                padding: '12px',
                                backgroundColor: '#e7f3ff', 
                                borderRadius: '4px',
                                fontSize: '11px',
                                color: '#0c5460'
                            }}>
                                <strong>Also Available:</strong><br/>
                                • <code style={{ backgroundColor: '#fff', padding: '1px 4px', borderRadius: '2px' }}>showPage(pageId)</code> - Generic function that takes a page ID<br/>
                                • Functions are available in exported HTML and can be used in navigation templates
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExportManager;