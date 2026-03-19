import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DataConnection, BuilderPage } from '../../types';

interface CodeEditorProps {
  builderPages: BuilderPage[];
  activeBuilderPageId: string;
  dataConnections: DataConnection;
  onBuilderPagesChange: (pages: BuilderPage[]) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  builderPages,
  activeBuilderPageId,
  dataConnections,
  onBuilderPagesChange
}) => {
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState<boolean>(false);
  const [editorWidth, setEditorWidth] = useState<number>(380);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(380);

  const handleDragStart = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = editorWidth;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = startXRef.current - e.clientX;
      setEditorWidth(Math.max(200, Math.min(900, startWidthRef.current + delta)));
    };
    const handleMouseUp = () => { isDraggingRef.current = false; };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Helper functions with memoization
  const getCurrentBuilderPage = useMemo((): BuilderPage => {
    return builderPages.find(p => p.id === activeBuilderPageId) || builderPages[0];
  }, [builderPages, activeBuilderPageId]);

  const windows = useMemo(() => getCurrentBuilderPage.windows, [getCurrentBuilderPage]);

  const selectedWindowData = useMemo(() => {
    return selectedWindow ? windows.find(w => w.id === selectedWindow) : null;
  }, [windows, selectedWindow]);

  // Handle window code update
  const handleCodeChange = (code: string) => {
    if (!selectedWindow) return;
    
    const updatedPages = builderPages.map(page => {
      if (page.id !== activeBuilderPageId) return page;
      
      return {
        ...page,
        windows: page.windows.map(window => {
          if (window.id !== selectedWindow) return window;
          
          // For HTML windows, update content. For JS windows, update jsCode
          if (window.type === 'html') {
            return { ...window, content: code };
          } else {
            return { ...window, jsCode: code };
          }
        })
      };
    });
    
    onBuilderPagesChange(updatedPages);
  };

  return (
    <div style={{ 
      flex: 1, 
      backgroundColor: '#ffffff',
      fontFamily: '"Segoe UI", "Arial", sans-serif',
      display: 'flex',
      height: '100%',
      color: '#495057'
    }}>
      {/* Left Panel - Window List */}
      <div style={{
        width: '220px',
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #dee2e6',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px',
        overflow: 'auto'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '600', color: '#495057', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Windows
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {windows.map(window => (
            <div
              key={window.id}
              onClick={() => setSelectedWindow(window.id)}
              style={{
                padding: '8px 10px',
                backgroundColor: selectedWindow === window.id ? '#e3f2fd' : '#ffffff',
                border: selectedWindow === window.id ? '1px solid #0066cc' : '1px solid #dee2e6',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s ease',
                color: selectedWindow === window.id ? '#0066cc' : '#495057'
              }}
              onMouseEnter={(e) => {
                if (selectedWindow !== window.id) {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedWindow !== window.id) {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }
              }}
            >
              <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                {window.title}
              </div>
              <div style={{ fontSize: '10px', color: '#6c757d' }}>
                {window.type}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Panel - Code Execution */}
      <div style={{
        flex: 1,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #dee2e6',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #dee2e6',
          fontSize: '12px',
          fontWeight: '500',
          color: '#495057'
        }}>
          {selectedWindowData ? `Execution: ${selectedWindowData.title}` : 'Select a window'}
        </div>
        
        <div style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#ffffff',
          padding: '0'
        }}>
          {selectedWindowData && (
            <WindowContentRenderer 
              key={selectedWindowData.id}
              window={selectedWindowData} 
              dataConnections={dataConnections} 
            />
          )}
        </div>
      </div>

      {/* Right Panel - Code Editor */}
      <div style={{
        width: `${editorWidth}px`,
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #dee2e6',
        position: 'relative',
        flexShrink: 0
      }}>
        {/* Drag-to-resize handle */}
        <div
          onMouseDown={handleDragStart}
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px',
            cursor: 'ew-resize', zIndex: 10, backgroundColor: 'transparent',
            transition: 'background-color 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0066cc44'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        />
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #dee2e6',
          fontSize: '12px',
          fontWeight: '500',
          color: '#495057',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>Code Editor</span>
          {selectedWindowData && (
            <button
              onClick={() => setIsEditorFullscreen(true)}
              title="Expand editor"
              style={{
                padding: '2px 7px',
                fontSize: '11px',
                backgroundColor: '#ffffff',
                color: '#495057',
                border: '1px solid #ced4da',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >&#x26F6; Expand</button>
          )}
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedWindowData ? (
            <textarea
              value={selectedWindowData.type === 'html' ? (selectedWindowData.content || '') : (selectedWindowData.jsCode || '')}
              onChange={(e) => handleCodeChange(e.target.value)}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              style={{
                flex: 1,
                border: 'none',
                padding: '12px',
                fontSize: '12px',
                fontFamily: "Monaco, Consolas, 'Courier New', monospace",
                backgroundColor: '#ffffff',
                color: '#212529',
                resize: 'none',
                outline: 'none',
                lineHeight: '1.5'
              }}
            />
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6c757d',
              fontSize: '12px'
            }}>
              Select a window to edit code
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen code editor overlay */}
      {isEditorFullscreen && selectedWindowData && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#ffffff', zIndex: 99999,
            display: 'flex', flexDirection: 'column'
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 14px', backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #dee2e6', flexShrink: 0
          }}>
            <span style={{ color: '#495057', fontSize: '13px', fontFamily: "Monaco, Consolas, 'Courier New', monospace" }}>
              {selectedWindowData.title}
            </span>
            <button
              onClick={() => setIsEditorFullscreen(false)}
              style={{ padding: '4px 12px', fontSize: '12px', backgroundColor: '#ffffff', color: '#495057', border: '1px solid #ced4da', borderRadius: '3px', cursor: 'pointer' }}
            >&#x2715; Close</button>
          </div>
          <textarea
            value={selectedWindowData.type === 'html' ? (selectedWindowData.content || '') : (selectedWindowData.jsCode || '')}
            onChange={(e) => handleCodeChange(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            autoFocus
            style={{
              flex: 1, width: '100%',
              fontFamily: "Monaco, Consolas, 'Courier New', monospace",
              fontSize: '13px', backgroundColor: '#ffffff', color: '#212529',
              border: 'none', padding: '12px 16px',
              resize: 'none', outline: 'none', lineHeight: '1.6', boxSizing: 'border-box'
            }}
          />
        </div>
      )}
    </div>
  );
};

// Separate component to render just the window content
const WindowContentRenderer: React.FC<{
  window: any;
  dataConnections: DataConnection;
}> = ({ window, dataConnections }) => {
  if (window.type === 'javascript') {
    return <JavaScriptWindowRenderer window={window} dataConnections={dataConnections} />;
  } else if (window.type === 'html') {
    return <HtmlWindowRenderer window={window} />;
  } else if (window.type === 'visualization') {
    return <VisualizationWindowRenderer window={window} />;
  }
  return null;
};

// JavaScript window renderer - mimics WindowPanel execution
const JavaScriptWindowRenderer: React.FC<{
  window: any;
  dataConnections: DataConnection;
}> = ({ window, dataConnections }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current || !window.jsCode) return;

    const executeCode = async () => {
      try {
        const outputContainer = contentRef.current;
        if (!outputContainer) return;

        // Clear previous content
        outputContainer.innerHTML = '';

        // Bridge to the real browser window
        const realWin = document.defaultView || window;
        const pageFunctionsProxy: any = {};

        try {
          if (realWin && typeof realWin === 'object') {
            // @ts-ignore
            if (realWin.pageFunctions && typeof realWin.pageFunctions === 'object') {
              // @ts-ignore
              Object.keys(realWin.pageFunctions).forEach((name: string) => {
                // @ts-ignore
                const fn = realWin[name] || realWin.pageFunctions[name];
                if (typeof fn === 'function') {
                  pageFunctionsProxy[name] = (...args: any[]) => fn(...args);
                }
              });
            } else {
              Object.keys(realWin).forEach((key: string) => {
                // @ts-ignore
                if (key.startsWith('goTo') && typeof realWin[key] === 'function') {
                  // @ts-ignore
                  pageFunctionsProxy[key] = (...args: any[]) => realWin[key](...args);
                }
              });
            }
          }
        } catch (err) {
          // Continue without navigation
        }

        // Create sandboxed document
        const sandboxDocument = {
          createElement: (tagName: string) => document.createElement(tagName),
          getElementById: (id: string) => outputContainer.querySelector(`#${id}`),
          querySelector: (selector: string) => outputContainer.querySelector(selector),
          querySelectorAll: (selector: string) => outputContainer.querySelectorAll(selector),
          body: {
            appendChild: (element: HTMLElement) => {
              if (outputContainer) outputContainer.appendChild(element);
              return element;
            },
            removeChild: (element: HTMLElement) => {
              if (outputContainer && outputContainer.contains(element)) {
                outputContainer.removeChild(element);
              }
              return element;
            }
          }
        };

        // Create sandboxed window
        const sandboxWindow = {
          alert: (message: string) => {
            const alertDiv = document.createElement('div');
            alertDiv.style.cssText = 'background: #fff3cd; border: 1px solid #ffeaa7; padding: 8px; margin: 5px 0; border-radius: 4px; color: #856404;';
            alertDiv.textContent = `Alert: ${message}`;
            if (outputContainer) outputContainer.appendChild(alertDiv);
          },
          console: {
            log: (...args: any[]) => {
              const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              ).join(' ');
              
              const logDiv = document.createElement('div');
              logDiv.style.cssText = 'background: #f8f9fa; border-left: 3px solid #007bff; padding: 4px 8px; margin: 2px 0; font-family: monospace; font-size: 11px; color: #495057;';
              logDiv.textContent = message;
              if (outputContainer) outputContainer.appendChild(logDiv);
            }
          },
          showPage: (...args: any[]) => {
            try {
              // @ts-ignore
              if (realWin && typeof realWin.showPage === 'function') {
                // @ts-ignore
                return realWin.showPage(...args);
              }
            } catch (e) {}
          },
          // @ts-ignore
          builderPages: (realWin && realWin.builderPages) || [],
          pageFunctions: pageFunctionsProxy,
          globalVariables: dataConnections.globalVariables,
          apiVariables: {}
        };

        // Attach page functions
        try {
          Object.entries(pageFunctionsProxy).forEach(([name, fn]) => {
            // @ts-ignore
            sandboxWindow[name] = fn;
          });
        } catch (e) {}

        // Execute the code — only valid JS identifier names can be spread as named params
        const isValidIdentifier = (n: string) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(n);
        const globalVarEntries = Object.entries(dataConnections.globalVariables).filter(([k]) => isValidIdentifier(k));
        const globalVarNames = globalVarEntries.map(([k]) => k);
        const globalVarValues = globalVarEntries.map(([, v]) => v);
        const apiVarNames: string[] = [];
        const apiVarValues: any[] = [];

        // Build apiConnections map so user code can: await apiConnections['Name']()
        const apiConnectionsMap: Record<string, () => Promise<any>> = {};
        (dataConnections.apiConnections || []).filter((c: any) => c.enabled).forEach((c: any) => {
          apiConnectionsMap[c.name] = async () => {
            try {
              const params = { ...(c.params || {}) };
              let url = c.url;
              const headers = { ...(c.headers || {}) };
              let requestOptions: any = { method: c.method || 'GET', headers };
              if ((c.method || 'GET') === 'GET') {
                const qs = new URLSearchParams(params).toString();
                if (qs) url = url + '?' + qs;
              } else {
                requestOptions.body = JSON.stringify(params);
                requestOptions.headers['Content-Type'] = 'application/json';
              }
              const res = await fetch(url, requestOptions);
              return await res.json();
            } catch (e) {
              console.error('API call failed for ' + c.name, e);
              return null;
            }
          };
        });

        const allParamNames = ['document', 'window', 'globalVariables', 'apiVariables', 'apiConnections', ...globalVarNames, ...apiVarNames];
        const allParamValues = [sandboxDocument, sandboxWindow, dataConnections.globalVariables, {}, apiConnectionsMap, ...globalVarValues, ...apiVarValues];

        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const func = new AsyncFunction(...allParamNames, window.jsCode);
        const result = func(...allParamValues);

        if (result && typeof result.catch === 'function') {
          result.catch((err: any) => {
            if (contentRef.current) {
              contentRef.current.innerHTML = `<div style="color: #dc3545; padding: 10px; font-family: monospace; white-space: pre-wrap; font-size: 12px;">Error: ${String(err)}</div>`;
            }
          });
        } else if (result !== undefined && result !== null) {
          const resultDiv = document.createElement('div');
          resultDiv.style.cssText = 'background: #e8f5e8; border: 1px solid #4caf50; padding: 8px; margin: 5px 0; border-radius: 4px; font-family: monospace; font-size: 12px;';
          resultDiv.textContent = `Return value: ${String(result)}`;
          outputContainer.appendChild(resultDiv);
        }
      } catch (error) {
        if (contentRef.current) {
          contentRef.current.innerHTML = `<div style="color: #dc3545; padding: 10px; font-family: monospace; white-space: pre-wrap; font-size: 12px;">Error: ${String(error)}</div>`;
        }
      }
    };

    executeCode();
  }, [window.jsCode, dataConnections]);

  return <div ref={contentRef} style={{ width: '100%', height: '100%', overflow: 'auto' }} />;
};

// HTML window renderer
const HtmlWindowRenderer: React.FC<{ window: any }> = ({ window }) => {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <iframe
        srcDoc={window.content || ''}
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
      />
    </div>
  );
};

// Visualization window renderer
const VisualizationWindowRenderer: React.FC<{ window: any }> = ({ window }) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      {window.imageData ? (
        <img 
          src={window.imageData} 
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          alt=""
        />
      ) : (
        <div style={{ color: '#6c757d' }}>No image loaded</div>
      )}
    </div>
  );
};

export default CodeEditor;