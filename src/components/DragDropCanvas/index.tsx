import React, { useState, useCallback } from 'react';
import WindowPanel from '../WindowPanel';
import { WindowPanel as WindowPanelType, CanvasState, BackgroundConfig, DataConnection, LayerState } from '../../types';

interface DragDropCanvasProps {
    windows?: WindowPanelType[];
    onWindowsChange?: (windows: WindowPanelType[]) => void;
    onExport?: (windows: WindowPanelType[], backgroundConfig: BackgroundConfig) => void;
    backgroundConfig?: BackgroundConfig;
    onBackgroundConfigChange?: (config: BackgroundConfig) => void;
    dataConnections?: DataConnection;
    onDataConnectionsChange?: (dataConnections: DataConnection) => void;
    layerStates?: LayerState[];
    onMoveWindowLayer?: (windowId: string, direction: 'up' | 'down') => void;
    onWindowSelect?: (windowId: string | null) => void;
    activeLayer?: number;
}

const DragDropCanvas: React.FC<DragDropCanvasProps> = ({ 
    windows = [], 
    onWindowsChange,
    onExport,
    backgroundConfig = { width: 1200, height: 800, color: '#ffffff' },
    onBackgroundConfigChange,
    dataConnections = { apiConnections: [], globalVariables: {} },
    onDataConnectionsChange,
    layerStates = [],
    onMoveWindowLayer,
    onWindowSelect,
    activeLayer = 1
}) => {
    const [selectedWindows, setSelectedWindows] = useState<string[]>([]);
    const [showGrid, setShowGrid] = useState<boolean>(true);
    const [gridSize, setGridSize] = useState<number>(1);
    const [dragState, setDragState] = useState<{
        isDragging: boolean;
        windowId: string | null;
        startX: number;
        startY: number;
        startWindowX: number;
        startWindowY: number;
    }>({
        isDragging: false,
        windowId: null,
        startX: 0,
        startY: 0,
        startWindowX: 0,
        startWindowY: 0
    });
    const [resizeState, setResizeState] = useState<{
        isResizing: boolean;
        windowId: string | null;
        startX: number;
        startY: number;
        startWidth: number;
        startHeight: number;
        direction: string;
    }>({
        isResizing: false,
        windowId: null,
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
        direction: ''
    });

    // Grid snapping utility
    const snapToGrid = useCallback((value: number) => {
        if (!showGrid) return value;
        return Math.round(value / gridSize) * gridSize;
    }, [showGrid, gridSize]);

    // Mouse event handlers for dragging
    const handleMouseDown = useCallback((e: React.MouseEvent, windowId: string, type: 'drag' | 'resize', direction?: string) => {
        e.stopPropagation();
        const window = windows.find(w => w.id === windowId);
        if (!window) return;

        if (type === 'drag') {
            setDragState({
                isDragging: true,
                windowId,
                startX: e.clientX,
                startY: e.clientY,
                startWindowX: window.position.x,
                startWindowY: window.position.y
            });
        } else if (type === 'resize' && direction) {
            setResizeState({
                isResizing: true,
                windowId,
                startX: e.clientX,
                startY: e.clientY,
                startWidth: window.size.width,
                startHeight: window.size.height,
                direction
            });
        }
    }, [windows]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (dragState.isDragging && dragState.windowId && onWindowsChange) {
            const deltaX = e.clientX - dragState.startX;
            const deltaY = e.clientY - dragState.startY;
            
            const newX = snapToGrid(dragState.startWindowX + deltaX);
            const newY = snapToGrid(dragState.startWindowY + deltaY);

            // Check if window is off canvas (background area)
            const isOffCanvas = newX < 0 || 
                               newY < 0 || 
                               newX > backgroundConfig.width || 
                               newY > backgroundConfig.height;

            const updatedWindows = windows.map(window =>
                window.id === dragState.windowId
                    ? { ...window, position: { x: newX, y: newY }, isOffCanvas }
                    : window
            );
            onWindowsChange(updatedWindows);
        }

        if (resizeState.isResizing && resizeState.windowId && onWindowsChange) {
            const deltaX = e.clientX - resizeState.startX;
            const deltaY = e.clientY - resizeState.startY;
            
            let newWidth = resizeState.startWidth;
            let newHeight = resizeState.startHeight;

            if (resizeState.direction.includes('right')) {
                newWidth = Math.max(gridSize, snapToGrid(resizeState.startWidth + deltaX));
            }
            if (resizeState.direction.includes('left')) {
                newWidth = Math.max(gridSize, snapToGrid(resizeState.startWidth - deltaX));
            }
            if (resizeState.direction.includes('bottom')) {
                newHeight = Math.max(gridSize, snapToGrid(resizeState.startHeight + deltaY));
            }
            if (resizeState.direction.includes('top')) {
                newHeight = Math.max(gridSize, snapToGrid(resizeState.startHeight - deltaY));
            }

            const updatedWindows = windows.map(window =>
                window.id === resizeState.windowId
                    ? { ...window, size: { width: newWidth, height: newHeight } }
                    : window
            );
            onWindowsChange(updatedWindows);
        }
    }, [dragState, resizeState, windows, onWindowsChange, snapToGrid, backgroundConfig, gridSize]);

    const handleMouseUp = useCallback(() => {
        // Check if we were dragging and if the window is off canvas, delete it
        if (dragState.isDragging && dragState.windowId && onWindowsChange) {
            const draggedWindow = windows.find(w => w.id === dragState.windowId);
            if (draggedWindow?.isOffCanvas) {
                const filteredWindows = windows.filter(w => w.id !== dragState.windowId);
                onWindowsChange(filteredWindows);
            } else {
                // Clean up isOffCanvas flag for windows that are back on canvas
                const cleanedWindows = windows.map(w => ({ ...w, isOffCanvas: false }));
                onWindowsChange(cleanedWindows);
            }
        }

        setDragState({
            isDragging: false,
            windowId: null,
            startX: 0,
            startY: 0,
            startWindowX: 0,
            startWindowY: 0
        });
        setResizeState({
            isResizing: false,
            windowId: null,
            startX: 0,
            startY: 0,
            startWidth: 0,
            startHeight: 0,
            direction: ''
        });
    }, [dragState, windows, onWindowsChange]);

    // Add global mouse event listeners
    React.useEffect(() => {
        if (dragState.isDragging || resizeState.isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragState.isDragging, resizeState.isResizing, handleMouseMove, handleMouseUp]);

    const createNewWindow = useCallback((type: 'javascript' | 'html' | 'visualization') => {
        const windowTitle = type === 'visualization' ? 'Media Window' : `${type.charAt(0).toUpperCase() + type.slice(1)} Window`;
        const newWindow: WindowPanelType = {
            id: `window-${Date.now()}`,
            title: windowTitle,
            type,
            content: type === 'html' ? '<div>Hello World!</div>' : '',
            position: { 
                x: snapToGrid(50 + Math.random() * 200), 
                y: snapToGrid(50 + Math.random() * 200) 
            },
            size: { width: snapToGrid(400), height: snapToGrid(300) },
            jsCode: type === 'javascript' ? '// Enter your JavaScript code here\nconsole.log("Hello, World!");' : undefined,
            layer: activeLayer // Use active layer
        };

        const newWindows = [...windows, newWindow];
        if (onWindowsChange) {
            onWindowsChange(newWindows);
        }
        setSelectedWindows([newWindow.id]);
    }, [windows, onWindowsChange, snapToGrid, activeLayer]);

    const updateWindow = useCallback((id: string, updates: Partial<WindowPanelType>) => {
        const newWindows = windows.map(window => 
            window.id === id ? { ...window, ...updates } : window
        );
        if (onWindowsChange) {
            onWindowsChange(newWindows);
        }
    }, [windows, onWindowsChange]);

    const deleteWindow = useCallback((id: string) => {
        const newWindows = windows.filter(window => window.id !== id);
        if (onWindowsChange) {
            onWindowsChange(newWindows);
        }
        if (selectedWindows.includes(id)) {
            setSelectedWindows(selectedWindows.filter(wId => wId !== id));
        }
    }, [windows, onWindowsChange, selectedWindows]);

    const selectWindow = useCallback((id: string, event?: React.MouseEvent) => {
        // Always add to selection if not already selected
        const newSelectedWindows = selectedWindows.includes(id) ? selectedWindows : [...selectedWindows, id];
        setSelectedWindows(newSelectedWindows);
        // Notify of primary (first) selected window
        const primaryWindow = newSelectedWindows.length > 0 ? newSelectedWindows[0] : id;
        onWindowSelect?.(primaryWindow);
    }, [selectedWindows, onWindowSelect]);

    // Alignment and spacing functions
    const alignLeft = useCallback(() => {
        if (selectedWindows.length < 2) return;
        const primaryWindow = windows.find(w => w.id === selectedWindows[0]);
        if (!primaryWindow) return;
        const targetX = primaryWindow.position.x;
        const newWindows = windows.map(w => {
            if (selectedWindows.includes(w.id) && w.id !== selectedWindows[0]) {
                return { ...w, position: { ...w.position, x: targetX } };
            }
            return w;
        });
        onWindowsChange?.(newWindows);
    }, [selectedWindows, windows, onWindowsChange]);

    const alignRight = useCallback(() => {
        if (selectedWindows.length < 2) return;
        const primaryWindow = windows.find(w => w.id === selectedWindows[0]);
        if (!primaryWindow) return;
        const targetRight = primaryWindow.position.x + primaryWindow.size.width;
        const newWindows = windows.map(w => {
            if (selectedWindows.includes(w.id) && w.id !== selectedWindows[0]) {
                return { ...w, position: { ...w.position, x: targetRight - w.size.width } };
            }
            return w;
        });
        onWindowsChange?.(newWindows);
    }, [selectedWindows, windows, onWindowsChange]);

    const alignTop = useCallback(() => {
        if (selectedWindows.length < 2) return;
        const primaryWindow = windows.find(w => w.id === selectedWindows[0]);
        if (!primaryWindow) return;
        const targetY = primaryWindow.position.y;
        const newWindows = windows.map(w => {
            if (selectedWindows.includes(w.id) && w.id !== selectedWindows[0]) {
                return { ...w, position: { ...w.position, y: targetY } };
            }
            return w;
        });
        onWindowsChange?.(newWindows);
    }, [selectedWindows, windows, onWindowsChange]);

    const alignBottom = useCallback(() => {
        if (selectedWindows.length < 2) return;
        const primaryWindow = windows.find(w => w.id === selectedWindows[0]);
        if (!primaryWindow) return;
        const targetBottom = primaryWindow.position.y + primaryWindow.size.height;
        const newWindows = windows.map(w => {
            if (selectedWindows.includes(w.id) && w.id !== selectedWindows[0]) {
                return { ...w, position: { ...w.position, y: targetBottom - w.size.height } };
            }
            return w;
        });
        onWindowsChange?.(newWindows);
    }, [selectedWindows, windows, onWindowsChange]);

    const alignCenterH = useCallback(() => {
        if (selectedWindows.length < 2) return;
        const primaryWindow = windows.find(w => w.id === selectedWindows[0]);
        if (!primaryWindow) return;
        const primaryCenter = primaryWindow.position.x + primaryWindow.size.width / 2;
        const newWindows = windows.map(w => {
            if (selectedWindows.includes(w.id) && w.id !== selectedWindows[0]) {
                return { ...w, position: { ...w.position, x: primaryCenter - w.size.width / 2 } };
            }
            return w;
        });
        onWindowsChange?.(newWindows);
    }, [selectedWindows, windows, onWindowsChange]);

    const alignCenterV = useCallback(() => {
        if (selectedWindows.length < 2) return;
        const primaryWindow = windows.find(w => w.id === selectedWindows[0]);
        if (!primaryWindow) return;
        const primaryCenter = primaryWindow.position.y + primaryWindow.size.height / 2;
        const newWindows = windows.map(w => {
            if (selectedWindows.includes(w.id) && w.id !== selectedWindows[0]) {
                return { ...w, position: { ...w.position, y: primaryCenter - w.size.height / 2 } };
            }
            return w;
        });
        onWindowsChange?.(newWindows);
    }, [selectedWindows, windows, onWindowsChange]);

    const distributeH = useCallback(() => {
        if (selectedWindows.length < 3) return;
        const selectedWins = windows.filter(w => selectedWindows.includes(w.id))
            .sort((a, b) => a.position.x - b.position.x);
        
        // Keep leftmost and rightmost windows in place
        const firstWin = selectedWins[0];
        const lastWin = selectedWins[selectedWins.length - 1];
        const middleWins = selectedWins.slice(1, -1);
        
        // Calculate space available between first and last window centers
        const firstCenter = firstWin.position.x + firstWin.size.width / 2;
        const lastCenter = lastWin.position.x + lastWin.size.width / 2;
        const availableSpace = lastCenter - firstCenter;
        const spacing = availableSpace / (selectedWins.length - 1);
        
        // Position middle windows evenly
        const updatedWins = [firstWin, ...middleWins.map((w, i) => {
            const newCenter = firstCenter + spacing * (i + 1);
            return { ...w, position: { ...w.position, x: newCenter - w.size.width / 2 } };
        }), lastWin];
        
        const newWindows = windows.map(w => updatedWins.find(uw => uw.id === w.id) || w);
        onWindowsChange?.(newWindows);
    }, [selectedWindows, windows, onWindowsChange]);

    const distributeV = useCallback(() => {
        if (selectedWindows.length < 3) return;
        const selectedWins = windows.filter(w => selectedWindows.includes(w.id))
            .sort((a, b) => a.position.y - b.position.y);
        
        // Keep topmost and bottommost windows in place
        const firstWin = selectedWins[0];
        const lastWin = selectedWins[selectedWins.length - 1];
        const middleWins = selectedWins.slice(1, -1);
        
        // Calculate space available between first and last window centers
        const firstCenter = firstWin.position.y + firstWin.size.height / 2;
        const lastCenter = lastWin.position.y + lastWin.size.height / 2;
        const availableSpace = lastCenter - firstCenter;
        const spacing = availableSpace / (selectedWins.length - 1);
        
        // Position middle windows evenly
        const updatedWins = [firstWin, ...middleWins.map((w, i) => {
            const newCenter = firstCenter + spacing * (i + 1);
            return { ...w, position: { ...w.position, y: newCenter - w.size.height / 2 } };
        }), lastWin];
        
        const newWindows = windows.map(w => updatedWins.find(uw => uw.id === w.id) || w);
        onWindowsChange?.(newWindows);
    }, [selectedWindows, windows, onWindowsChange]);

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'g') {
                e.preventDefault();
                setShowGrid(!showGrid);
            }
            if (e.key === 'Delete' && selectedWindows.length > 0) {
                selectedWindows.forEach(id => deleteWindow(id));
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [showGrid, selectedWindows, deleteWindow]);

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !e.ctrlKey && !e.metaKey) {
            setSelectedWindows([]);
            onWindowSelect?.(null);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Toolbar */}
            <div style={{
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #dee2e6',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
            }}>
                <button 
                    onClick={() => createNewWindow('javascript')}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    + JavaScript Window
                </button>
                <button 
                    onClick={() => createNewWindow('html')}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    + HTML Window
                </button>
                <button 
                    onClick={() => createNewWindow('visualization')}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#6f42c1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    + Media Window
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* Grid Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                            <input
                                type="checkbox"
                                checked={showGrid}
                                onChange={(e) => setShowGrid(e.target.checked)}
                            />
                            Grid
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                                type="number"
                                value={gridSize}
                                onChange={(e) => {
                                    const newSize = parseInt(e.target.value, 10);
                                    if (!isNaN(newSize) && newSize >= 1) {
                                        setGridSize(Math.min(newSize, 200)); // Max 200px for practical reasons
                                    }
                                }}
                                disabled={!showGrid}
                                min="1"
                                max="200"
                                style={{
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '3px',
                                    backgroundColor: showGrid ? 'white' : '#f5f5f5',
                                    width: '55px',
                                    height: '24px',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="Grid"
                            />
                            <select
                                value=""
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setGridSize(parseInt(e.target.value, 10));
                                    }
                                }}
                                disabled={!showGrid}
                                style={{
                                    padding: '4px 6px',
                                    fontSize: '12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '3px',
                                    backgroundColor: showGrid ? 'white' : '#f5f5f5',
                                    height: '24px',
                                    cursor: 'pointer',
                                    boxSizing: 'border-box'
                                }}
                                title="Quick preset sizes"
                            >
                                <option value="">▼</option>
                                <option value="10">10px</option>
                                <option value="15">15px</option>
                                <option value="20">20px</option>
                                <option value="25">25px</option>
                                <option value="30">30px</option>
                                <option value="50">50px</option>
                            </select>
                            <span style={{ fontSize: '12px', color: '#6c757d' }}>px</span>
                        </div>
                    </div>

                    {/* Alignment Tools - visible when 2+ windows selected */}
                    {selectedWindows.length >= 2 && (
                        <>
                            <div style={{ width: '1px', height: '24px', backgroundColor: '#dee2e6' }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6c757d' }}>
                                <span style={{ fontWeight: '600' }}>Align:</span>
                                {/* Left Edge */}
                                <button
                                    onClick={alignLeft}
                                    title="Align Left"
                                    style={{
                                        padding: '4px 6px',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
                                        <line x1="2" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="2" />
                                        <line x1="5" y1="4" x2="10" y2="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                        <line x1="5" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                    </svg>
                                </button>
                                {/* Right Edge */}
                                <button
                                    onClick={alignRight}
                                    title="Align Right"
                                    style={{
                                        padding: '4px 6px',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
                                        <line x1="10" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="2" />
                                        <line x1="2" y1="4" x2="7" y2="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                        <line x1="2" y1="8" x2="7" y2="8" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                    </svg>
                                </button>
                                {/* Top Edge */}
                                <button
                                    onClick={alignTop}
                                    title="Align Top"
                                    style={{
                                        padding: '4px 6px',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
                                        <line x1="2" y1="2" x2="10" y2="2" stroke="currentColor" strokeWidth="2" />
                                        <line x1="4" y1="5" x2="4" y2="10" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                        <line x1="8" y1="5" x2="8" y2="10" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                    </svg>
                                </button>
                                {/* Bottom Edge */}
                                <button
                                    onClick={alignBottom}
                                    title="Align Bottom"
                                    style={{
                                        padding: '4px 6px',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
                                        <line x1="2" y1="10" x2="10" y2="10" stroke="currentColor" strokeWidth="2" />
                                        <line x1="4" y1="2" x2="4" y2="7" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                        <line x1="8" y1="2" x2="8" y2="7" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                    </svg>
                                </button>
                                {/* Center H */}
                                <button
                                    onClick={alignCenterH}
                                    title="Align Center Horizontally"
                                    style={{
                                        padding: '4px 6px',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
                                        <line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" strokeWidth="2" />
                                        <line x1="2" y1="4" x2="5" y2="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                        <line x1="7" y1="4" x2="10" y2="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                        <line x1="2" y1="8" x2="5" y2="8" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                        <line x1="7" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                    </svg>
                                </button>
                                {/* Center V */}
                                <button
                                    onClick={alignCenterV}
                                    title="Align Center Vertically"
                                    style={{
                                        padding: '4px 6px',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" style={{ flexShrink: 0 }}>
                                        <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="2" />
                                        <line x1="4" y1="2" x2="4" y2="5" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                        <line x1="4" y1="7" x2="4" y2="10" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                        <line x1="8" y1="2" x2="8" y2="5" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                        <line x1="8" y1="7" x2="8" y2="10" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                                    </svg>
                                </button>
                            </div>

                            {selectedWindows.length >= 3 && (
                                <>
                                    <div style={{ width: '1px', height: '24px', backgroundColor: '#dee2e6' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6c757d' }}>
                                        <span style={{ fontWeight: '600' }}>Distribute:</span>
                                        <button
                                            onClick={distributeH}
                                            title="Distribute Horizontally"
                                            style={{
                                                padding: '4px 8px',
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #dee2e6',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            ↔↔↔
                                        </button>
                                        <button
                                            onClick={distributeV}
                                            title="Distribute Vertically"
                                            style={{
                                                padding: '4px 8px',
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #dee2e6',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            ↕↕↕
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#6c757d' }}>
                            Windows: {windows.length} | Selected: {selectedWindows.length} | Ctrl+G: Grid | Del: Delete
                        </span>
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div 
                style={{
                    flex: 1,
                    position: 'relative',
                    backgroundColor: '#fafafa',
                    overflow: 'auto',
                    padding: '20px',
                    cursor: dragState.isDragging ? 'grabbing' : 'default'
                }}
                onClick={handleCanvasClick}
            >
                {/* Working Area - represents the background dimensions */}
                <div 
                    style={{
                        position: 'relative',
                        width: `${Math.max(backgroundConfig.width, 800)}px`,
                        height: `${Math.max(backgroundConfig.height, 600)}px`,
                        backgroundColor: backgroundConfig.color,
                        border: '1px solid rgba(0,123,255,0.2)',
                        backgroundImage: showGrid ? 
                            `linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                             linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)` : 'none',
                        backgroundSize: showGrid ? `${gridSize}px ${gridSize}px` : 'auto',
                        margin: '0 auto'
                    }}
                >
                    {windows
                        .filter(window => {
                            // Filter windows based on layer visibility
                            const layerState = layerStates.find(layer => layer.layerNumber === window.layer);
                            return layerState ? layerState.visible : true; // Show window if no layer state found
                        })
                        .sort((a, b) => a.layer - b.layer) // Sort by layer (lower layers first in DOM)
                        .map(window => {
                            const layerState = layerStates.find(layer => layer.layerNumber === window.layer);
                            const maxLayer = Math.max(...layerStates.map(l => l.layerNumber), 1);
                            const minLayer = Math.min(...layerStates.map(l => l.layerNumber), 1);
                            
                            return (
                                <div 
                                    key={window.id} 
                                    style={{ 
                                        position: 'absolute', 
                                        zIndex: 10 + window.layer // Higher layer = higher z-index
                                    }}
                                >
                                    <WindowPanel
                                        window={window}
                                        onUpdate={updateWindow}
                                        onDelete={deleteWindow}
                                        onSelect={(id: string) => selectWindow(id)}
                                        isSelected={selectedWindows.includes(window.id)}
                                        isPrimary={selectedWindows[0] === window.id}
                                        onMouseDown={handleMouseDown}
                                        dataConnections={dataConnections}
                                        onDataConnectionsChange={onDataConnectionsChange}
                                        onMoveWindowLayer={onMoveWindowLayer}
                                        maxLayer={maxLayer}
                                        minLayer={minLayer}
                                    />
                                </div>
                            );
                        })}
                    
                    {windows.length === 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            color: '#6c757d',
                            fontSize: '18px',
                            zIndex: 20
                        }}>
                            <p>Welcome to your Website Builder!</p>
                            <p style={{ fontSize: '14px', margin: '10px 0' }}>
                                Click the buttons above to add JavaScript, HTML, or Media windows
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DragDropCanvas;