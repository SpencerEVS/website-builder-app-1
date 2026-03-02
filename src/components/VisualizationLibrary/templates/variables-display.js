export const variablesDisplayTemplate = {
    name: 'Variables Display',
    description: 'Display all global and API variables in formatted tables (auto-updating)',
    code: `// Variables Display Widget - Auto-updating without manual refresh
// This template displays all global variables and API variables
const container = document.createElement('div');
container.style.cssText = \`
    padding: 20px;
    font-family: 'Segoe UI', Arial, sans-serif;
    background: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    max-width: 800px;
    margin: 0 auto;
\`;

// Create title
const title = document.createElement('h2');
title.textContent = 'System Variables';
title.style.cssText = \`
    color: #333;
    text-align: center;
    margin: 0 0 20px 0;
    padding-bottom: 10px;
    border-bottom: 2px solid #0066cc;
\`;
container.appendChild(title);

// Function to create a variable table
function createVariableTable(variables, title, bgColor) {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 30px;';
    
    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = title;
    sectionTitle.style.cssText = \`
        color: #495057;
        margin: 0 0 15px 0;
        padding: 8px 12px;
        background: \${bgColor};
        border-radius: 4px;
        font-size: 16px;
    \`;
    section.appendChild(sectionTitle);

    if (Object.keys(variables).length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = 'No variables defined';
        emptyMsg.style.cssText = 'color: #6c757d; font-style: italic; text-align: center; padding: 20px;';
        section.appendChild(emptyMsg);
        return section;
    }

    const table = document.createElement('table');
    table.style.cssText = \`
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    \`;

    // Table header
    const thead = document.createElement('thead');
    thead.innerHTML = \`
        <tr style="background: #e9ecef;">
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #495057;">Variable Name</th>
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #495057;">Current Value</th>
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #495057;">Type</th>
        </tr>
    \`;
    table.appendChild(thead);

    // Table body
    const tbody = document.createElement('tbody');
    Object.entries(variables).forEach(([key, value], index) => {
        const row = document.createElement('tr');
        row.style.cssText = \`
            \${index % 2 === 0 ? 'background: #f8f9fa;' : 'background: white;'}
            transition: background-color 0.2s;
        \`;
        row.addEventListener('mouseenter', () => row.style.backgroundColor = '#e3f2fd');
        row.addEventListener('mouseleave', () => row.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white');
        
        row.innerHTML = \`
            <td style="padding: 10px 12px; border-bottom: 1px solid #dee2e6; font-family: monospace; color: #495057;">\${key}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #dee2e6; color: #0066cc; font-weight: 500;">\${String(value)}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #dee2e6; color: #6c757d; font-size: 12px;">\${typeof value}</td>
        \`;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    section.appendChild(table);
    
    return section;
}

// Function to update the display
function updateVariablesDisplay() {
    // Clear existing content (keep title, remove previous sections)
    const existingSections = container.querySelectorAll('div:not(:first-child)');
    existingSections.forEach(section => {
        if (section !== title) {
            section.remove();
        }
    });
    
    // Add Global Variables section
    if (window.globalVariables) {
        const globalSection = createVariableTable(window.globalVariables, 'Global Variables', '#d4edda');
        container.appendChild(globalSection);
    }
    
    // Add API Variables section
    if (window.apiVariables) {
        const apiSection = createVariableTable(window.apiVariables, 'API Variables', '#d1ecf1');
        container.appendChild(apiSection);
    }
    
    // Add timestamp (no refresh button needed since APIs are cyclic)
    const timestamp = document.createElement('div');
    timestamp.textContent = \`Auto-updated: \${new Date().toLocaleString()}\`;
    timestamp.style.cssText = \`
        text-align: center;
        color: #6c757d;
        font-size: 12px;
        margin-top: 10px;
        font-style: italic;
    \`;
    container.appendChild(timestamp);
}

// Initial display
document.body.appendChild(container);
updateVariablesDisplay();

// Auto-refresh every 2 seconds to show updated API data
setInterval(updateVariablesDisplay, 2000);

console.log('Variables Display Widget initialized with auto-refresh (no manual refresh needed)');`
};