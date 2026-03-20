export const variablesDisplay = {
  name: 'Variables Display',
  description: 'Display all global and API variables (auto-updating, no refresh button)',
  code: `// Variables Display Widget - Auto-updating without manual refresh
const colors = {
  text: (window.globalVariables?.global_style_1) || '#333',
  primary: (window.globalVariables?.global_style_4) || '#0066cc',
  mediumText: (window.globalVariables?.global_style_2) || '#495057',
  border: (window.globalVariables?.global_style_3) || '#dee2e6',
  headerBg: (window.globalVariables?.global_style_12) || '#e9ecef',
  hoverBg: (window.globalVariables?.global_style_13) || '#e3f2fd',
};
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
    color: \${colors.text};
    text-align: center;
    margin: 0 0 20px 0;
    padding-bottom: 10px;
    border-bottom: 2px solid \${colors.primary};
\`;
container.appendChild(title);

// Function to create a variable table
function createVariableTable(variables, tableTitle, bgColor) {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 30px;';
    
    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = tableTitle;
    sectionTitle.style.cssText = \`
        color: \${colors.mediumText};
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
        emptyMsg.style.cssText = \`color: #6c757d; font-style: italic; text-align: center; padding: 20px;\`;
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
        <tr style="background: \${colors.headerBg};">
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid \${colors.border}; font-weight: 600; color: \${colors.mediumText};">Variable Name</th>
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid \${colors.border}; font-weight: 600; color: \${colors.mediumText};">Current Value</th>
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid \${colors.border}; font-weight: 600; color: \${colors.mediumText};">Type</th>
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
        row.addEventListener('mouseenter', () => row.style.backgroundColor = colors.hoverBg);
        row.addEventListener('mouseleave', () => row.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white');
        
        row.innerHTML = \`
            <td style="padding: 10px 12px; border-bottom: 1px solid \${colors.border}; font-family: monospace; color: \${colors.mediumText};">\${key}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid \${colors.border}; color: \${colors.primary}; font-weight: 500;">\${String(value)}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid \${colors.border}; color: #6c757d; font-size: 12px;">\${typeof value}</td>
        \`;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    section.appendChild(table);
    
    return section;
}

// Function to update the display
function updateVariablesDisplay() {
    // Clear existing sections (keep only the title)
    const existingSections = container.querySelectorAll('div, h3, table, p');
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
    
    // Add timestamp only (NO REFRESH BUTTON)
    const timestamp = document.createElement('div');
    timestamp.textContent = \`Auto-updated: \${new Date().toLocaleString()}\`;
    timestamp.style.cssText = \`
        text-align: center;
        color: #6c757d;
        font-size: 12px;
        margin-top: 15px;
        font-style: italic;
    \`;
    container.appendChild(timestamp);
}

// Initial display
document.body.appendChild(container);
updateVariablesDisplay();

// Auto-refresh every 2 seconds (APIs handle data updates cyclically)
setInterval(updateVariablesDisplay, 2000);

console.log('Variables Display Widget initialized - auto-updating without refresh button');`
};
