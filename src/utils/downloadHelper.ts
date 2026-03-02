export const downloadFile = (filename: string, content: string) => {
    // Determine the correct MIME type based on file extension
    let mimeType = 'text/plain';
    if (filename.endsWith('.html')) {
        mimeType = 'text/html';
    } else if (filename.endsWith('.js')) {
        mimeType = 'application/javascript';
    } else if (filename.endsWith('.json')) {
        mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
    }, 100);
};