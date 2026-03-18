export interface VisualizationConfig {
    id: string;
    type: string;
    data: any;
    options: any;
}

export interface DragItem {
    type: string;
    id: string;
}

export interface WindowPanel {
    id: string;
    title: string;
    description?: string;
    type: 'javascript' | 'visualization' | 'html';
    content: string;
    position: {
        x: number;
        y: number;
    };
    size: {
        width: number;
        height: number;
    };
    jsCode?: string;
    isExecuting?: boolean;
    showCodeInExport?: boolean; // Whether to show code editor in exported HTML
    isOffCanvas?: boolean; // Whether the window is dragged off the canvas
    layer: number; // Layer number (higher = on top)
    editorElements?: EditorElement[]; // Elements added in the editor
}

export interface BackgroundConfig {
    width: number;
    height: number;
    color: string;
}

export interface LayerState {
    layerNumber: number;
    visible: boolean;
    name: string;
}

export interface BuilderPage {
    id: string;
    name: string;
    windows: WindowPanel[];
    backgroundConfig: BackgroundConfig;
    layerStates: LayerState[]; // Tracks visibility and names for each layer
}

export interface ApiTrigger {
    type: 'cyclic' | 'conditional' | 'manual';
    interval?: number; // For cyclic triggers (in milliseconds)
    condition?: {
        variable: string;
        operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
        value: string | number | boolean;
    };
}

export interface ApiArgument {
    id: string;
    name: string;
    type: 'static' | 'variable';
    value: string; // Static value or variable name
    description?: string;
}

export interface ApiConnection {
    id: string;
    name: string;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers: Record<string, string>;
    params: Record<string, string>;
    body?: any; // For POST/PUT requests with JSON body
    bodyType?: 'none' | 'json' | 'form' | 'raw'; // Body type selector
    arguments: ApiArgument[];
    trigger: ApiTrigger;
    sampleResponse: string;
    variables: ApiVariable[];
    enabled: boolean;
    additionalConfig?: string; // Additional JSON configuration
}

export interface ApiVariable {
    id: string;
    name: string;
    jsonPath: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
}

export interface DataConnection {
    apiConnections: ApiConnection[];
    globalVariables: Record<string, any>;
}

export interface CanvasState {
    windows: WindowPanel[];
    selectedWindow: string | null;
    backgroundConfig: BackgroundConfig;
}

export interface EditorElement {
    id: string;
    type: 'shape' | 'text' | 'button';
    position: { x: number; y: number };
    size: { width: number; height: number };
    properties: {
        // Shape properties
        shapeType?: 'rectangle' | 'circle' | 'triangle';
        fillColor?: string;
        borderColor?: string;
        borderWidth?: number;
        
        // Text properties
        text?: string;
        fontSize?: number;
        fontColor?: string;
        fontWeight?: 'normal' | 'bold';
        textAlign?: 'left' | 'center' | 'right';
        
        // Button properties
        buttonText?: string;
        backgroundColor?: string;
        onClick?: string; // JavaScript code to execute
        
        // Variable linking
        linkedVariables?: {
            [propertyName: string]: string; // property -> global variable name
        };
    };
}

export interface WindowEditorState {
    windowId: string;
    elements: EditorElement[];
    htmlCode: string;
    jsCode: string;
    cssCode: string;
}