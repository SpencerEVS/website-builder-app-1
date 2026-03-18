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
    appName?: string;
}

const ExportManager: React.FC<ExportManagerProps> = ({ 
    builderPages = [],
    onBuilderPagesChange,
    windows, 
    backgroundConfig, 
    onBackgroundConfigChange, 
    dataConnections = { apiConnections: [], globalVariables: {} },
    onWindowsChange,
    onDataConnectionsChange,
    appName = 'website'
}) => {
    const [exportFormat, setExportFormat] = useState<'html' | 'js' | 'json'>('html');

    const generateMultiPageHTML = (pages: BuilderPage[], dataConnections: DataConnection, appName: string = 'website') => {
        // No default navigation - users can add navigation templates if needed
        // Collect loaded fonts and generate @font-face CSS for embedding
        const gw: any = window;
        const globalFonts = gw.globalFonts || {};
        const fontFaceCSS = Object.keys(globalFonts)
            .filter((name: string) => globalFonts[name] && globalFonts[name].indexOf('data:') === 0)
            .map((name: string) => `  @font-face { font-family: "${name}"; src: url("${globalFonts[name]}"); }`)
            .join('\n');

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
    <title>${appName}</title>
    ${fontFaceCSS ? `<style id="global-fonts">\n${fontFaceCSS}\n</style>` : ''}
    ${pageNavScript}
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
</body>
</html>`;
    };

    const transformWindowsForExport = (windows: WindowPanelType[]) => {
        // Keep all window data intact for JSON export so images survive round-trips.
        // The content field stores the full base64 data URL and must be preserved.
        return windows;
    };

    const handleExport = () => {
        let content = '';
        let fileName = '';
        let mimeType = '';
        const sanitizedAppName = appName.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase() || 'website';

        switch (exportFormat) {
            case 'html':
                content = generateMultiPageHTML(builderPages, dataConnections, appName);
                fileName = `${sanitizedAppName}.html`;
                mimeType = 'text/html';
                break;
            case 'js':
                const allJS = builderPages.map(page => {
                    const pageJS = generateCode(page.windows, 'js', page.backgroundConfig, dataConnections);
                    return `// JavaScript for ${page.name} (${page.id})\n${pageJS}\n`;
                }).join('\n\n');
                
                content = `// Multi-Page Website JavaScript
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
                fileName = `${sanitizedAppName}.js`;
                mimeType = 'text/javascript';
                break;
            case 'json':
                const gw: any = window;
                const exportData = {
                    globalFonts: gw.globalFonts || {},
                    builderPages: builderPages.map(page => ({
                        ...page,
                        windows: transformWindowsForExport(page.windows)
                    })),
                    dataConnections,
                    exportType: 'multi-page',
                    totalPages: builderPages.length
                };
                content = JSON.stringify(exportData, null, 2);
                fileName = `${sanitizedAppName}-config.json`;
                mimeType = 'application/json';
                break;
        }

        // Try File System Access API first
        const globalObj: any = globalThis;
        if (typeof globalObj.showSaveFilePicker === 'function') {
            const ext = fileName.split('.').pop() || '';
            const options = {
                suggestedName: fileName,
                types: [{
                    description: `${ext.toUpperCase()} Files`,
                    accept: {
                        [mimeType]: [`.${ext}`]
                    }
                }]
            };

            globalObj.showSaveFilePicker(options)
                .then((fileHandle: any) => fileHandle.createWritable())
                .then((writable: any) => {
                    writable.write(content);
                    return writable.close();
                })
                .catch((error: any) => {
                    // Fallback on error or cancel
                    if (error.name !== 'AbortError') {
                        downloadFile(fileName, content);
                    }
                });
        } else {
            // Fallback to standard download
            downloadFile(fileName, content);
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
                const gw2: any = window;
                const exportData = {
                    globalFonts: gw2.globalFonts || {},
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
                    if (config.globalFonts && typeof config.globalFonts === 'object') {
                        const gw3: any = window;
                        gw3.globalFonts = config.globalFonts;
                        // Immediately inject fonts into all open windows
                        setTimeout(() => {
                            const gw4: any = window;
                            if (typeof gw4.__injectBuilderFonts === 'function') gw4.__injectBuilderFonts();
                        }, 100);
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
            {/* Import Section */}
            <div style={{ marginBottom: '20px', backgroundColor: '#ffffff', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ padding: '15px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#555', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Import</h3>
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
            </div>

            {/* Export Section */}
            <div style={{ marginBottom: '20px', backgroundColor: '#ffffff', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ padding: '15px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#555', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Export</h3>
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
                            fontSize: '14px',
                            marginBottom: '15px'
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

                    <div style={{ 
                        marginTop: '15px',
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
                            marginTop: '15px', 
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
            </div>
        </div>
    );
};

export default ExportManager;