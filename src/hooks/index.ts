import { useState } from 'react';

export const useDragDrop = () => {
    const [droppedItems, setDroppedItems] = useState<any[]>([]);

    const handleDrop = (item: any) => {
        setDroppedItems((prevItems) => [...prevItems, item]);
    };

    const handleRemove = (itemId: string) => {
        setDroppedItems((prevItems) => prevItems.filter((item: any) => item.id !== itemId));
    };

    return {
        droppedItems,
        handleDrop,
        handleRemove,
    };
};

export const useVisualizationConfig = (initialConfig: any) => {
    const [config, setConfig] = useState(initialConfig);

    const updateConfig = (newConfig: any) => {
        setConfig((prevConfig: any) => ({ ...prevConfig, ...newConfig }));
    };

    return {
        config,
        updateConfig,
    };
};