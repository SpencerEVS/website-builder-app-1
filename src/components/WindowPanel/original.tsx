import React, { useState, useRef } from 'react';
import { WindowPanel as WindowPanelType } from '../../types';

interface WindowPanelProps {
    window: WindowPanelType;
    onUpdate: (id: string, updates: Partial<WindowPanelType>) => void;
    onDelete: (id: string) => void;
    onSelect: (id: string) => void;
    isSelected: boolean;
    onMouseDown?: (e: React.MouseEvent, windowId: string, type: 'drag' | 'resize', direction?: string) => void;
}

const WindowPanel: React.FC<WindowPanelProps> = ({ 
    window, 
    onUpdate, 
    onDelete, 
    onSelect,
    isSelected,
    onMouseDown 
}) => {
    const [output, setOutput] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [showCodeEditor, setShowCodeEditor] = useState<boolean>(true);
    const [hasExecuted, setHasExecuted] = useState<boolean>(false);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const outputRef = useRef<HTMLDivElement>(null);
    const executionRef = useRef<HTMLDivElement>(null);

    const executeJavaScript = () => {
        if (!window.jsCode) return;

        setError('');
        setOutput('');
        setShowCodeEditor(false);  // Hide code editor when running
        setHasExecuted(true);      // Mark as executed
        
        // Use setTimeout to ensure DOM has updated after state change
        setTimeout(() => {
            try {
                // Get the output container for this specific window
                const outputContainer = executionRef.current;
                if (!outputContainer) {
                    console.error('Output container not found');
                    return;
                }

                // Clear previous content
                outputContainer.innerHTML = '';
                
                // Create a sandbox for code execution
                const originalConsoleLog = console.log;
                const logs: string[] = [];
                
                console.log = (...args) => {
                    logs.push(args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' '));
                };

                // Create a sandboxed document-like object that operates within the window
                const sandboxDocument = {
                    createElement: (tagName: string) => {
                        return document.createElement(tagName);
                    },
                    getElementById: (id: string) => {
                        return outputContainer.querySelector(`#${id}`);
                    },
                    querySelector: (selector: string) => {
                        return outputContainer.querySelector(selector);
                    },
                    querySelectorAll: (selector: string) => {
                        return outputContainer.querySelectorAll(selector);
                    },
                    body: {
                        appendChild: (element: HTMLElement) => {
                            if (outputContainer) {
                                outputContainer.appendChild(element);
                            }
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

                // Create a sandboxed window object
                const sandboxWindow = {
                    alert: (message: string) => {
                        const alertDiv = document.createElement('div');
                        alertDiv.style.cssText = 'background: #fff3cd; border: 1px solid #ffeaa7; padding: 8px; margin: 5px 0; border-radius: 4px; color: #856404;';
                        alertDiv.textContent = `Alert: ${message}`;
                        if (outputContainer) {
                            outputContainer.appendChild(alertDiv);
                        }
                    },
                    console: {
                        log: (...args: any[]) => {
                            const message = args.map(arg => 
                                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                            ).join(' ');
                            logs.push(message);
                            
                            // Create a visual log output in the container immediately
                            const logDiv = document.createElement('div');
                            logDiv.style.cssText = 'background: #f8f9fa; border-left: 3px solid #007bff; padding: 4px 8px; margin: 2px 0; font-family: monospace; font-size: 11px; color: #495057;';
                            logDiv.textContent = message;
                            if (outputContainer) {
                                outputContainer.appendChild(logDiv);
                            }
                        }
                    }
                };

                // Execute the code with sandboxed environment
                const func = new Function('document', 'window', window.jsCode || '');
                const result = func(sandboxDocument, sandboxWindow);
                
                // Restore console.log
                console.log = originalConsoleLog;
                
                // If there's a return value from the function, display it
                if (result !== undefined && result !== null) {
                    const resultDiv = document.createElement('div');
                    resultDiv.style.cssText = 'background: #e8f5e8; border: 1px solid #4caf50; padding: 8px; margin: 5px 0; border-radius: 4px; font-family: monospace; font-size: 12px;';
                    resultDiv.textContent = `Return value: ${String(result)}`;
                    outputContainer.appendChild(resultDiv);
                }
                
                // If nothing was displayed, show a success message
                if (outputContainer && outputContainer.children.length === 0) {
                    const successDiv = document.createElement('div');
                    successDiv.style.cssText = 'background: #d4edda; border: 1px solid #c3e6cb; padding: 8px; margin: 5px 0; border-radius: 4px; color: #155724; font-size: 12px;';
                    successDiv.textContent = 'Code executed successfully (no visible output)';
                    outputContainer.appendChild(successDiv);
                }
                
            } catch (err) {
                const errorMessage = `Error: ${err instanceof Error ? err.message : String(err)}`;
                setError(errorMessage);
                
                // Display error in the execution container
                const outputContainer = executionRef.current;
                if (outputContainer) {
                    outputContainer.innerHTML = '';
                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = 'background: #f8d7da; border: 1px solid #f5c6cb; padding: 8px; margin: 5px 0; border-radius: 4px; color: #721c24; font-family: monospace; font-size: 12px;';
                    errorDiv.textContent = errorMessage;
                    outputContainer.appendChild(errorDiv);
                }
            }
        }, 10); // Small delay to ensure DOM updates
    };

    const handleResize = (e: any, direction: any, ref: any) => {
        onUpdate(window.id, {
            size: {
                width: ref.offsetWidth,
                height: ref.offsetHeight
            }
        });
    };

    return (
        <div 
            className={`window-panel ${isSelected ? 'selected' : ''}`}
            style={{
                width: window.size.width,
                height: window.size.height,
                position: 'absolute',
                left: window.position.x,
                top: window.position.y,
                border: window.isOffCanvas ? '2px solid #dc3545' : (isHovered || isSelected ? '2px solid #007acc' : '1px solid rgba(0,0,0,0.1)'),
                backgroundColor: window.isOffCanvas ? '#ffe6e6' : 'white',
                borderRadius: '4px',
                boxShadow: window.isOffCanvas ? '0 4px 20px rgba(220,53,69,0.3)' : (isHovered || isSelected ? '0 4px 20px rgba(0,0,0,0.15)' : '0 2px 10px rgba(0,0,0,0.05)'),
                display: 'flex',
                flexDirection: 'column',
                zIndex: isSelected ? 1000 : 1,
                opacity: 1,
                transition: 'all 0.2s ease'
            }}
            onClick={() => onSelect(window.id)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <>
                {(isHovered || isSelected) && (
                    <header 
                        className="window-header"
                        style={{
                            padding: '8px 12px',
                            backgroundColor: 'rgba(240, 240, 240, 0.95)',
                            backdropFilter: 'blur(10px)',
                            borderBottom: '1px solid rgba(204, 204, 204, 0.5)',
                            cursor: 'move',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderRadius: '4px 4px 0 0',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            zIndex: 10,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseDown={(e) => {
                            if (onMouseDown) {
                                onMouseDown(e, window.id, 'drag');
                            }
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: '14px' }}>{window.title}</h3>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {window.type === 'javascript' && (
                                <>
                                    {!hasExecuted && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                executeJavaScript();
                                            }}
                                            style={{
                                                padding: '2px 6px',
                                                fontSize: '11px',
                                                backgroundColor: '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '2px',
                                                cursor: 'pointer'
                                            }}
                                            title="Run JavaScript Code"
                                        >
                                            ▶ Run
                                        </button>
                                    )}
                                    {hasExecuted && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowCodeEditor(true);
                                                setHasExecuted(false);
                                                if (executionRef.current) {
                                                    executionRef.current.innerHTML = '';
                                                }
                                                setOutput('');
                                                setError('');
                                            }}
                                            style={{
                                                padding: '2px 6px',
                                                fontSize: '11px',
                                                backgroundColor: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '2px',
                                                cursor: 'pointer'
                                            }}
                                            title="Edit Code"
                                        >
                                            📝 Edit
                                        </button>
                                    )}
                                </>
                            )}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(window.id);
                                }}
                                style={{
                                    padding: '2px 6px',
                                    fontSize: '12px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '2px',
                                    cursor: 'pointer'
                                }}
                                title="Delete Window"
                            >
                                ×
                            </button>
                        </div>
                    </header>
                )}
                
                <div 
                    className="window-content"
                    style={{
                        flex: 1,
                        padding: (isHovered || isSelected) ? '48px 8px 8px 8px' : '8px',
                        overflow: 'auto',
                        transition: 'padding 0.2s ease'
                    }}
                >
                    {window.type === 'javascript' ? (
                        <div style={{ height: '100%', width: '100%' }}>
                            {showCodeEditor ? (
                                <textarea
                                    value={window.jsCode || ''}
                                    onChange={(e) => onUpdate(window.id, { jsCode: e.target.value })}
                                    placeholder="Enter JavaScript code here..."
                                    style={{
                                        height: '100%',
                                        width: '100%',
                                        fontFamily: 'Monaco, Consolas, monospace',
                                        fontSize: '12px',
                                        border: '1px solid #ddd',
                                        padding: '8px',
                                        resize: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            ) : (
                                <div 
                                    ref={executionRef}
                                    className="js-execution-container"
                                    style={{
                                        height: '100%',
                                        width: '100%',
                                        border: 'none',
                                        padding: '0px',
                                        backgroundColor: 'transparent',
                                        overflow: 'auto',
                                        position: 'relative'
                                    }}
                                >
                                </div>
                            )}
                        </div>
                    ) : window.type === 'html' ? (
                        <div>
                            <textarea
                                value={window.content}
                                onChange={(e) => onUpdate(window.id, { content: e.target.value })}
                                placeholder="Enter HTML content here..."
                                style={{
                                    width: '100%',
                                    height: '60%',
                                    fontFamily: 'Monaco, Consolas, monospace',
                                    fontSize: '12px',
                                    border: '1px solid #ddd',
                                    padding: '8px',
                                    resize: 'none'
                                }}
                            />
                            <div 
                                style={{
                                    marginTop: '8px',
                                    border: '1px solid #ddd',
                                    padding: '8px',
                                    height: '35%',
                                    overflow: 'auto'
                                }}
                                dangerouslySetInnerHTML={{ __html: window.content }}
                            />
                        </div>
                    ) : (
                        <div>{window.content}</div>
                    )}
                </div>

                {/* Resize Handles */}
                {isSelected && (
                    <>
                        {/* Corner resize handles */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: '10px',
                                height: '10px',
                                backgroundColor: '#007acc',
                                cursor: 'nw-resize',
                                borderRadius: '0 0 4px 0'
                            }}
                            onMouseDown={(e) => {
                                if (onMouseDown) {
                                    onMouseDown(e, window.id, 'resize', 'bottom-right');
                                }
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '10px',
                                height: '10px',
                                backgroundColor: '#007acc',
                                cursor: 'ne-resize',
                                borderRadius: '0 0 0 4px'
                            }}
                            onMouseDown={(e) => {
                                if (onMouseDown) {
                                    onMouseDown(e, window.id, 'resize', 'bottom-left');
                                }
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: '10px',
                                height: '10px',
                                backgroundColor: '#007acc',
                                cursor: 'ne-resize',
                                borderRadius: '0 4px 0 0'
                            }}
                            onMouseDown={(e) => {
                                if (onMouseDown) {
                                    onMouseDown(e, window.id, 'resize', 'top-right');
                                }
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '10px',
                                height: '10px',
                                backgroundColor: '#007acc',
                                cursor: 'nw-resize',
                                borderRadius: '4px 0 0 0'
                            }}
                            onMouseDown={(e) => {
                                if (onMouseDown) {
                                    onMouseDown(e, window.id, 'resize', 'top-left');
                                }
                            }}
                        />

                        {/* Edge resize handles */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: '10px',
                                right: '10px',
                                height: '4px',
                                backgroundColor: '#007acc',
                                cursor: 'ns-resize'
                            }}
                            onMouseDown={(e) => {
                                if (onMouseDown) {
                                    onMouseDown(e, window.id, 'resize', 'bottom');
                                }
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: '10px',
                                bottom: '10px',
                                right: 0,
                                width: '4px',
                                backgroundColor: '#007acc',
                                cursor: 'ew-resize'
                            }}
                            onMouseDown={(e) => {
                                if (onMouseDown) {
                                    onMouseDown(e, window.id, 'resize', 'right');
                                }
                            }}
                        />
                    </>
                )}
            </>
        </div>
    );
};

export default WindowPanel;