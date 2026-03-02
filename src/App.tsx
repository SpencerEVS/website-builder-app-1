import React, { useState } from 'react';
import DragDropCanvas from './components/DragDropCanvas';
import VisualizationLibrary from './components/VisualizationLibrary';
import ExportManager from './components/ExportManager';
import DataConnections from './components/DataConnections';
import VariablesView from './components/VariablesView';
import BuilderPageTabs from './components/BuilderPageTabs';
import LayerManagement from './components/LayerManagement';
import CodeEditor from './components/CodeEditor';
import { WindowPanel, BackgroundConfig, DataConnection, BuilderPage, EditorElement } from './types';
import './App.css';

const App: React.FC = () => {
  // Builder pages state (only for the builder tab)
  const [builderPages, setBuilderPages] = useState<BuilderPage[]>([
    {
      id: 'page-1',
      name: 'Page 1',
      windows: [],
      backgroundConfig: {
        width: 1200,
        height: 800,
        color: '#ffffff'
      },
      layerStates: [
        { layerNumber: 1, visible: true, name: 'Layer 1' },
        { layerNumber: 2, visible: true, name: 'Layer 2' },
        { layerNumber: 3, visible: true, name: 'Layer 3' }
      ]
    }
  ]);
  const [activeBuilderPageId, setActiveBuilderPageId] = useState<string>('page-1');
  
  // Global state (shared across all pages)
  const [dataConnections, setDataConnections] = useState<DataConnection>({
    apiConnections: [],
    globalVariables: {}
  });
  const [activeTab, setActiveTab] = useState<'builder' | 'data' | 'variables' | 'editor'>('builder');
  const [leftPanelVisible, setLeftPanelVisible] = useState<boolean>(false);
  const [layersVisible, setLayersVisible] = useState<boolean>(false);
  const [exportVisible, setExportVisible] = useState<boolean>(false);
  const [activeLayer, setActiveLayer] = useState<number>(1);

  // Expose builder pages to window object for navigation templates
  React.useEffect(() => {
    try {
      const showPage = (pageId: string) => {
        setActiveBuilderPageId(pageId);
      };
      
      // Create individual page functions
      const pageFunctions: { [key: string]: () => void } = {};
      builderPages.forEach(page => {
        const functionName = `goTo${page.name.replace(/[^a-zA-Z0-9]/g, '')}`;
        pageFunctions[functionName] = () => {
          setActiveBuilderPageId(page.id);
        };
      });
      
      // Expose functions directly to window for simple access (multiple methods for reliability)
      Object.assign(window, { 
        builderPages,
        showPage,
        ...pageFunctions
      });
      
      // Also expose page functions array for templates (similar to globalVariables pattern)
      // @ts-ignore
      window.pageFunctions = pageFunctions;
      
      // Explicitly assign each function to window (similar to ExportManager pattern)
      Object.keys(pageFunctions).forEach(funcName => {
        // @ts-ignore
        window[funcName] = pageFunctions[funcName];
      });


    } catch (e) {
      console.log('Could not expose builderPages to window:', e);
    }
  }, [builderPages]);

  // Listen for navigation messages from templates
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'navigatePage' && event.data.pageId) {
        console.log('📨 Received navigation message:', event.data.pageId);
        setActiveBuilderPageId(event.data.pageId);
      }
      
      // Handle requests for page function data
      if (event.data && event.data.type === 'requestPageFunctions') {
        console.log('📨 Received request for page functions');
        const functionData = builderPages.map(page => ({
          id: page.id,
          name: page.name,
          functionName: `goTo${page.name.replace(/[^a-zA-Z0-9]/g, '')}`
        }));
        
        // Send function data back to the requesting iframe
        if (event.source) {
          const source: any = event.source;
          source.postMessage({
            type: 'pageFunctionsResponse',
            functions: functionData
          }, '*');
        }
      }
      
      // Handle function calls from templates
      if (event.data && event.data.type === 'callPageFunction' && event.data.pageId) {
        console.log('📨 Received page function call:', event.data.pageId);
        setActiveBuilderPageId(event.data.pageId);
      }
    };

    const handleNavigationEvent = (event: any) => {
      if (event.detail && event.detail.pageId) {
        console.log('📨 Received navigation event:', event.detail.pageId);
        setActiveBuilderPageId(event.detail.pageId);
      }
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('pageNavigation', handleNavigationEvent);

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('pageNavigation', handleNavigationEvent);
    };
  }, []);

  // Helper functions to get current page data
  const getCurrentBuilderPage = (): BuilderPage => {
    return builderPages.find(p => p.id === activeBuilderPageId) || builderPages[0];
  };

  // Computed values for current page
  const windows = getCurrentBuilderPage().windows;
  const backgroundConfig = getCurrentBuilderPage().backgroundConfig;

  // Builder page management functions
  const handleBuilderPageSelect = (pageId: string) => {
    setActiveBuilderPageId(pageId);
  };

  const handleBuilderPageAdd = () => {
    const newPageId = `page-${Date.now()}`;
    const newPage: BuilderPage = {
      id: newPageId,
      name: `Page ${builderPages.length + 1}`,
      windows: [],
      backgroundConfig: {
        width: 1200,
        height: 800,
        color: '#ffffff'
      },
      layerStates: [
        { layerNumber: 1, visible: true, name: 'Layer 1' },
        { layerNumber: 2, visible: true, name: 'Layer 2' },
        { layerNumber: 3, visible: true, name: 'Layer 3' }
      ]
    };
    setBuilderPages(prev => [...prev, newPage]);
    setActiveBuilderPageId(newPageId);
  };

  const handleBuilderPageRename = (pageId: string, newName: string) => {
    setBuilderPages(prev =>
      prev.map(page =>
        page.id === pageId ? { ...page, name: newName } : page
      )
    );
  };

  const handleBuilderPageDelete = (pageId: string) => {
    if (builderPages.length <= 1) return; // Don't delete the last page

    setBuilderPages(prev => {
      const remainingPages = prev.filter(page => page.id !== pageId);
      // If we're deleting the active page, switch to the first remaining page
      if (activeBuilderPageId === pageId) {
        setActiveBuilderPageId(remainingPages[0].id);
      }
      return remainingPages;
    });
  };

  // Updated setter functions to work with current page
  const setWindows = (newWindows: WindowPanel[] | ((prev: WindowPanel[]) => WindowPanel[])) => {
    setBuilderPages(prev =>
      prev.map(page =>
        page.id === activeBuilderPageId
          ? {
              ...page,
              windows: typeof newWindows === 'function' ? newWindows(page.windows) : newWindows
            }
          : page
      )
    );
  };

  const setBackgroundConfig = (newConfig: BackgroundConfig) => {
    setBuilderPages(prev =>
      prev.map(page =>
        page.id === activeBuilderPageId
          ? { ...page, backgroundConfig: newConfig }
          : page
      )
    );
  };

  const handleAddTemplate = (type: 'javascript' | 'html' | 'visualization', template: any) => {
    const newWindow: WindowPanel = {
      id: `window-${Date.now()}`,
      title: template.name,
      type,
      content: type === 'html' ? template.code : (type === 'visualization' ? template.content : ''),
      position: { 
        x: Math.random() * 300 + 50, 
        y: Math.random() * 200 + 50 
      },
      size: template.defaultSize ? { width: template.defaultSize.width, height: template.defaultSize.height } : { width: 400, height: 300 },
      jsCode: type === 'javascript' ? template.code : undefined,
      layer: activeLayer // Use active layer
    };

    setWindows(prev => [...prev, newWindow]);
  };

  const handleWindowsChange = (newWindows: WindowPanel[]) => {
    setWindows(newWindows);
  };

  // Layer management functions
  const handleLayerVisibilityChange = (layerNumber: number, visible: boolean) => {
    setBuilderPages(prev =>
      prev.map(page =>
        page.id === activeBuilderPageId
          ? {
              ...page,
              layerStates: page.layerStates.map(layer =>
                layer.layerNumber === layerNumber
                  ? { ...layer, visible }
                  : layer
              )
            }
          : page
      )
    );
  };

  const handleLayerNameChange = (layerNumber: number, name: string) => {
    setBuilderPages(prev =>
      prev.map(page =>
        page.id === activeBuilderPageId
          ? {
              ...page,
              layerStates: page.layerStates.map(layer =>
                layer.layerNumber === layerNumber
                  ? { ...layer, name }
                  : layer
              )
            }
          : page
      )
    );
  };

  const handleMoveWindowToLayer = (windowId: string, newLayer: number) => {
    setWindows(prev =>
      prev.map(window =>
        window.id === windowId
          ? { ...window, layer: newLayer }
          : window
      )
    );
  };

  const handleMoveWindowLayer = (windowId: string, direction: 'up' | 'down') => {
    const window = windows.find(w => w.id === windowId);
    const currentPage = builderPages.find(page => page.id === activeBuilderPageId);
    if (!window || !currentPage) return;

    const currentLayer = window.layer;
    const maxLayer = Math.max(...currentPage.layerStates.map(l => l.layerNumber));
    const minLayer = Math.min(...currentPage.layerStates.map(l => l.layerNumber));

    if (direction === 'up' && currentLayer < maxLayer) {
      handleMoveWindowToLayer(windowId, currentLayer + 1);
    } else if (direction === 'down' && currentLayer > minLayer) {
      handleMoveWindowToLayer(windowId, currentLayer - 1);
    }
  };

  const addNewLayer = () => {
    const currentPage = builderPages.find(page => page.id === activeBuilderPageId);
    if (!currentPage) return;

    const maxLayer = Math.max(...currentPage.layerStates.map(l => l.layerNumber));
    const newLayerNumber = maxLayer + 1;

    setBuilderPages(prev =>
      prev.map(page =>
        page.id === activeBuilderPageId
          ? {
              ...page,
              layerStates: [
                ...page.layerStates,
                { layerNumber: newLayerNumber, visible: true, name: `Layer ${newLayerNumber}` }
              ]
            }
          : page
      )
    );
  };

  const removeLayer = (layerNumber: number) => {
    const currentPage = builderPages.find(page => page.id === activeBuilderPageId);
    if (!currentPage || currentPage.layerStates.length <= 1) return;

    // Move all windows from this layer to layer 1
    setWindows(prev =>
      prev.map(window =>
        window.layer === layerNumber
          ? { ...window, layer: 1 }
          : window
      )
    );

    // Remove the layer state
    setBuilderPages(prev =>
      prev.map(page =>
        page.id === activeBuilderPageId
          ? {
              ...page,
              layerStates: page.layerStates.filter(layer => layer.layerNumber !== layerNumber)
            }
          : page
      )
    );
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f7f8fa',
      color: '#2c3e50'
    }}>
      {/* Tab Navigation with Logo */}
      <div style={{
        borderBottom: '3px solid #6c757d',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '20px', paddingRight: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src={process.env.PUBLIC_URL + '/evs-logo.png'} 
              alt="EVS Automation" 
              style={{ 
                height: '50px', 
                width: 'auto',
                padding: '8px'
              }} 
            />
            <div style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '0.5px' }}>
              <span style={{ color: '#1a1a1a' }}>EVS</span>
              <span style={{ color: '#6c757d' }}> AUTOMATION</span>
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            <button
              onClick={() => setActiveTab('builder')}
              style={{
                padding: '14px 24px',
                backgroundColor: activeTab === 'builder' ? '#f8f9fa' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'builder' ? '3px solid #6c757d' : '3px solid transparent',
                fontSize: '15px',
                fontWeight: activeTab === 'builder' ? '700' : '600',
                color: activeTab === 'builder' ? '#1a1a1a' : '#6c757d',
                cursor: 'pointer',
                borderRadius: '6px 6px 0 0',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease'
              }}
            >
              BUILDER
            </button>
            <button
              onClick={() => setActiveTab('data')}
              style={{
                padding: '14px 24px',
                backgroundColor: activeTab === 'data' ? '#f8f9fa' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'data' ? '3px solid #6c757d' : '3px solid transparent',
                fontSize: '15px',
                fontWeight: activeTab === 'data' ? '700' : '600',
                color: activeTab === 'data' ? '#1a1a1a' : '#6c757d',
                cursor: 'pointer',
                borderRadius: '6px 6px 0 0',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease'
              }}
            >
              DATA CONNECTIONS
            </button>
            <button
              onClick={() => setActiveTab('variables')}
              style={{
                padding: '14px 24px',
                backgroundColor: activeTab === 'variables' ? '#f8f9fa' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'variables' ? '3px solid #6c757d' : '3px solid transparent',
                fontSize: '15px',
                fontWeight: activeTab === 'variables' ? '700' : '600',
                color: activeTab === 'variables' ? '#1a1a1a' : '#6c757d',
                cursor: 'pointer',
                borderRadius: '6px 6px 0 0',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease'
              }}
            >
              VARIABLES
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              style={{
                padding: '14px 24px',
                backgroundColor: activeTab === 'editor' ? '#f8f9fa' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'editor' ? '3px solid #6c757d' : '3px solid transparent',
                fontSize: '15px',
                fontWeight: activeTab === 'editor' ? '700' : '600',
                color: activeTab === 'editor' ? '#1a1a1a' : '#6c757d',
                cursor: 'pointer',
                borderRadius: '6px 6px 0 0',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease'
              }}
            >
              EDITOR
            </button>
          </div>

        </div>
      </div>

      {/* Main Layout */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {activeTab === 'builder' ? (
          <>
            {/* Left Sidebar - Templates */}
            {leftPanelVisible && (
              <div 
                style={{
                  width: '250px',
                  backgroundColor: '#ffffff',
                  borderRight: '3px solid rgba(108, 117, 125, 0.3)',
                  overflow: 'auto',
                  transition: 'width 0.3s ease, z-index 0s 0.3s',
                  position: 'relative',
                  zIndex: 1,
                  minWidth: '250px',
                  boxShadow: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.width = '350px';
                  e.currentTarget.style.zIndex = '10';
                  e.currentTarget.style.boxShadow = '2px 0 8px rgba(108,117,125,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.width = '250px';
                  e.currentTarget.style.zIndex = '1';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Clickable Tab Header */}
                <div 
                  onClick={() => setLeftPanelVisible(false)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#ffffff',
                    color: '#1a1a1a',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '2px solid rgba(108, 117, 125, 0.3)',
                    userSelect: 'none'
                  }}
                >
                  <span>TEMPLATES</span>
                  <span style={{ fontSize: '12px' }}>◀</span>
                </div>
                <VisualizationLibrary onAddTemplate={handleAddTemplate} />
              </div>
            )}

            {/* Left Panel Collapsed Tab */}
            {!leftPanelVisible && (
              <div 
                onClick={() => setLeftPanelVisible(true)}
                style={{
                  width: '32px',
                  backgroundColor: '#ffffff',
                  borderRight: '3px solid rgba(108, 117, 125, 0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 1,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  color: '#1a1a1a',
                  fontSize: '14px',
                  fontWeight: '600',
                  writingMode: 'vertical-lr',
                  textOrientation: 'mixed',
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '12px' }}>▶</span>
                  <span>TEMPLATES</span>
                </div>
              </div>
            )}

            {/* Center - Canvas */}
            <div style={{ 
              flex: 1, 
              display: 'flex',
              flexDirection: 'column',
              minWidth: '400px'
            }}>
              {/* Builder Page Tabs */}
              <BuilderPageTabs
                pages={builderPages}
                activePageId={activeBuilderPageId}
                onPageSelect={handleBuilderPageSelect}
                onPageAdd={handleBuilderPageAdd}
                onPageRename={handleBuilderPageRename}
                onPageDelete={handleBuilderPageDelete}
              />
              
              {/* Canvas Area */}
              <div style={{ 
                flex: 1, 
                overflow: 'auto'
              }}>
                <DragDropCanvas 
                  windows={windows}
                  onWindowsChange={handleWindowsChange}
                  backgroundConfig={backgroundConfig}
                  onBackgroundConfigChange={setBackgroundConfig}
                  dataConnections={dataConnections}
                  layerStates={builderPages.find(page => page.id === activeBuilderPageId)?.layerStates || []}
                  onMoveWindowLayer={handleMoveWindowLayer}
                />
              </div>
            </div>

            {/* Right Sidebar - Stacked Collapsible Panels */}
            <>
              {/* Layers Sidebar */}
              {layersVisible && (
                <div 
                  style={{
                    width: '250px',
                    backgroundColor: '#ffffff',
                    borderLeft: '3px solid rgba(108, 117, 125, 0.3)',
                    overflow: 'auto',
                    transition: 'width 0.3s ease, z-index 0s 0.3s',
                    position: 'relative',
                    zIndex: 1,
                    minWidth: '250px',
                    boxShadow: 'none',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.width = '350px';
                    e.currentTarget.style.zIndex = '10';
                    e.currentTarget.style.boxShadow = '-2px 0 8px rgba(108,117,125,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.width = '250px';
                    e.currentTarget.style.zIndex = '1';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Layers Header */}
                  <div 
                    onClick={() => setLayersVisible(false)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: '#ffffff',
                      color: '#1a1a1a',
                      fontSize: '14px',
                      fontWeight: '600',
                      userSelect: 'none',
                      cursor: 'pointer',
                      borderBottom: '2px solid rgba(108, 117, 125, 0.3)',
                      transition: 'background-color 0.2s ease'
                    }}
                    title="Close Layers panel"
                  >
                    <span>LAYERS</span>
                    <span style={{ fontSize: '12px' }}>▶</span>
                  </div>
                  
                  {/* Layers Content */}
                  <div style={{ height: '100%', overflow: 'auto' }}>
                    <LayerManagement
                      layerStates={builderPages.find(page => page.id === activeBuilderPageId)?.layerStates || []}
                      windows={windows}
                      onLayerVisibilityChange={handleLayerVisibilityChange}
                      onLayerNameChange={handleLayerNameChange}
                      onMoveWindowToLayer={handleMoveWindowToLayer}
                      onAddNewLayer={addNewLayer}
                      onRemoveLayer={removeLayer}
                      activeLayer={activeLayer}
                      onLayerSelect={setActiveLayer}
                    />
                  </div>
                </div>
              )}

              {/* Export Sidebar */}
              {exportVisible && (
                <div 
                  style={{
                    width: '250px',
                    backgroundColor: '#ffffff',
                    borderLeft: '3px solid rgba(108, 117, 125, 0.3)',
                    overflow: 'auto',
                    transition: 'width 0.3s ease, z-index 0s 0.3s',
                    position: 'relative',
                    zIndex: 1,
                    minWidth: '250px',
                    boxShadow: 'none',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.width = '350px';
                    e.currentTarget.style.zIndex = '10';
                    e.currentTarget.style.boxShadow = '-2px 0 8px rgba(108,117,125,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.width = '250px';
                    e.currentTarget.style.zIndex = '1';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Export Header */}
                  <div 
                    onClick={() => setExportVisible(false)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: '#ffffff',
                      color: '#1a1a1a',
                      fontSize: '14px',
                      fontWeight: '600',
                      userSelect: 'none',
                      cursor: 'pointer',
                      borderBottom: '2px solid rgba(108, 117, 125, 0.3)',
                      transition: 'background-color 0.2s ease'
                    }}
                    title="Close Export panel"
                  >
                    <span>EXPORT</span>
                    <span style={{ fontSize: '12px' }}>▶</span>
                  </div>
                  
                  {/* Export Content */}
                  <div style={{ height: '100%', overflow: 'auto' }}>
                    <ExportManager 
                      builderPages={builderPages}
                      onBuilderPagesChange={setBuilderPages}
                      windows={windows} 
                      backgroundConfig={backgroundConfig}
                      onBackgroundConfigChange={setBackgroundConfig}
                      dataConnections={dataConnections}
                      onWindowsChange={setWindows}
                      onDataConnectionsChange={setDataConnections}
                    />
                  </div>
                </div>
              )}

              {/* Collapsed Layers Tab */}
              {!layersVisible && (
                <div 
                  onClick={() => setLayersVisible(true)}
                  style={{
                    width: '32px',
                    backgroundColor: '#ffffff',
                    borderLeft: '3px solid rgba(108, 117, 125, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{
                    color: '#1a1a1a',
                    fontSize: '14px',
                    fontWeight: '600',
                    writingMode: 'vertical-lr',
                    textOrientation: 'mixed',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>LAYERS</span>
                    <span style={{ fontSize: '12px' }}>◀</span>
                  </div>
                </div>
              )}

              {/* Collapsed Export Tab */}
              {!exportVisible && (
                <div 
                  onClick={() => setExportVisible(true)}
                  style={{
                    width: '32px',
                    backgroundColor: '#ffffff',
                    borderLeft: '3px solid rgba(108, 117, 125, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{
                    color: '#1a1a1a',
                    fontSize: '14px',
                    fontWeight: '600',
                    writingMode: 'vertical-lr',
                    textOrientation: 'mixed',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>EXPORT</span>
                    <span style={{ fontSize: '12px' }}>◀</span>
                  </div>
                </div>
              )}
            </>
          </>
        ) : activeTab === 'data' ? (
          <div style={{ 
            flex: 1, 
            backgroundColor: '#f7f8fa'
          }}>
            <DataConnections
              dataConnections={dataConnections}
              onDataConnectionsChange={setDataConnections}
            />
          </div>
        ) : activeTab === 'variables' ? (
          <div style={{ 
            flex: 1, 
            backgroundColor: '#f7f8fa'
          }}>
            <VariablesView
              dataConnections={dataConnections}
              onDataConnectionsChange={setDataConnections}
            />
          </div>
        ) : activeTab === 'editor' ? (
          <CodeEditor 
            builderPages={builderPages}
            activeBuilderPageId={activeBuilderPageId}
            dataConnections={dataConnections}
            onBuilderPagesChange={setBuilderPages}
          />
        ) : null}
      </div>
    </div>
  );
};

export default App;

