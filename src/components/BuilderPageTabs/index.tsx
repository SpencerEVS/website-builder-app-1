import React from 'react';
import { BuilderPage } from '../../types';

interface BuilderPageTabsProps {
    pages: BuilderPage[];
    activePageId: string;
    onPageSelect: (pageId: string) => void;
    onPageAdd: () => void;
    onPageRename: (pageId: string, newName: string) => void;
    onPageDelete: (pageId: string) => void;
}

const BuilderPageTabs: React.FC<BuilderPageTabsProps> = ({
    pages,
    activePageId,
    onPageSelect,
    onPageAdd,
    onPageRename,
    onPageDelete
}) => {
    const [editingPageId, setEditingPageId] = React.useState<string | null>(null);
    const [editingName, setEditingName] = React.useState<string>('');

    const handleRename = (pageId: string, currentName: string) => {
        setEditingPageId(pageId);
        setEditingName(currentName);
    };

    const handleRenameSubmit = (pageId: string) => {
        if (editingName.trim()) {
            onPageRename(pageId, editingName.trim());
        }
        setEditingPageId(null);
        setEditingName('');
    };

    const handleRenameCancel = () => {
        setEditingPageId(null);
        setEditingName('');
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e9ecef',
            padding: '8px 15px',
            minHeight: '40px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            <span style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#6c757d',
                marginRight: '15px',
                flexShrink: 0
            }}>
                Pages:
            </span>
            
            {pages.map((page) => (
                <div
                    key={page.id}
                    className="builder-page-tab"
                    data-page-id={page.id}
                    data-page-name={page.name}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: page.id === activePageId ? '#0066cc' : '#f8f9fa',
                        border: `1px solid ${page.id === activePageId ? '#0066cc' : '#dee2e6'}`,
                        borderRadius: '6px',
                        padding: '6px 10px',
                        margin: '0 4px',
                        cursor: 'pointer',
                        position: 'relative',
                        minWidth: '80px',
                        maxWidth: '150px',
                        fontSize: '12px',
                        fontWeight: page.id === activePageId ? '600' : '400',
                        color: page.id === activePageId ? '#ffffff' : '#495057',
                        transition: 'all 0.2s ease',
                        userSelect: 'none'
                    }}
                    onClick={() => onPageSelect(page.id)}
                    onDoubleClick={() => handleRename(page.id, page.name)}
                >
                    {editingPageId === page.id ? (
                        <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleRenameSubmit(page.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleRenameSubmit(page.id);
                                } else if (e.key === 'Escape') {
                                    handleRenameCancel();
                                }
                            }}
                            style={{
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#ffffff',
                                width: '100%'
                            }}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <>
                            <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1
                            }}>
                                {page.name}
                            </span>
                            {pages.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPageDelete(page.id);
                                    }}
                                    style={{
                                        marginLeft: '6px',
                                        background: 'none',
                                        border: 'none',
                                        color: page.id === activePageId ? '#ffffff' : '#6c757d',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        padding: '1px',
                                        borderRadius: '50%',
                                        width: '14px',
                                        height: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 0.8,
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#dc3545';
                                        e.currentTarget.style.color = '#ffffff';
                                        e.currentTarget.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = page.id === activePageId ? '#ffffff' : '#6c757d';
                                        e.currentTarget.style.opacity = '0.8';
                                    }}
                                    title="Close page"
                                >
                                    ×
                                </button>
                            )}
                        </>
                    )}
                </div>
            ))}
            
            {/* Add New Page Button */}
            <button
                onClick={onPageAdd}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#28a745',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    margin: '0 4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease',
                    minWidth: '24px',
                    height: '26px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#218838';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#28a745';
                }}
                title="Add new page"
            >
                +
            </button>
        </div>
    );
};

export default BuilderPageTabs;