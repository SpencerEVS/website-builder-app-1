import React, { useState } from 'react';

// Fixed templates with variables-display without refresh button
const codeTemplates = {
    'simple-counter': {
        name: 'Simple Counter',
        description: 'A basic counter with increment/decrement buttons',
        code: `// Simple Counter Example
let count = 0;
const container = document.createElement('div');
container.innerHTML = \`
    <div style="text-align: center; padding: 10px; font-family: Arial;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Counter: <span id="count">0</span></h3>
        <button id="increment" style="margin: 0 5px; padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">+</button>
        <button id="decrement" style="margin: 0 5px; padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer;">-</button>
    </div>
\`;

document.body.appendChild(container);

document.getElementById('increment').onclick = () => {
    count++;
    document.getElementById('count').textContent = count;
    console.log('Count incremented to:', count);
};

document.getElementById('decrement').onclick = () => {
    count--;
    document.getElementById('count').textContent = count;
    console.log('Count decremented to:', count);
};`
    },
    'data-visualization': {
        name: 'Simple Chart',
        description: 'Basic data visualization with HTML/CSS',
        code: `// Simple Bar Chart Visualization
const data = [15, 25, 35, 20, 45];
const maxValue = Math.max(...data);

const chartContainer = document.createElement('div');
chartContainer.style.cssText = 'padding: 10px; font-family: Arial; text-align: center;';

const title = document.createElement('h4');
title.textContent = 'Sales Data';
title.style.cssText = 'margin: 0 0 10px 0; color: #333;';
chartContainer.appendChild(title);

const chartArea = document.createElement('div');
chartArea.style.cssText = 'display: flex; align-items: end; justify-content: center; height: 120px;';

data.forEach((value, index) => {
    const bar = document.createElement('div');
    const height = (value / maxValue) * 100;
    bar.style.cssText = \`
        width: 30px;
        height: \${height}px;
        background: #4CAF50;
        margin: 0 2px;
        display: flex;
        align-items: end;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
    \`;
    bar.textContent = value;
    chartArea.appendChild(bar);
});

chartContainer.appendChild(chartArea);
document.body.appendChild(chartContainer);

console.log('Chart rendered with data:', data);`
    },
    'interactive-form': {
        name: 'Interactive Form',
        description: 'Form with validation and dynamic feedback',
        code: `// Interactive Contact Form
const formContainer = document.createElement('div');
formContainer.style.cssText = 'max-width: 400px; margin: 0 auto; padding: 20px; font-family: Arial; background: #f9f9f9; border-radius: 8px;';

formContainer.innerHTML = \`
    <h3 style="margin-top: 0; color: #333; text-align: center;">Contact Us</h3>
    <form id="contactForm">
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Name:</label>
            <input type="text" id="name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Email:</label>
            <input type="email" id="email" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Message:</label>
            <textarea id="message" required rows="4" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; resize: vertical;"></textarea>
        </div>
        <button type="submit" style="width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer;">Send Message</button>
    </form>
    <div id="feedback" style="margin-top: 15px; padding: 10px; border-radius: 4px; display: none;"></div>
\`;

document.body.appendChild(formContainer);

// Form submission handler
document.getElementById('contactForm').onsubmit = (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    const feedback = document.getElementById('feedback');
    feedback.style.cssText = 'display: block; background: #d4edda; color: #155724; padding: 8px; border-radius: 3px; font-size: 11px; border: 1px solid #c3e6cb;';
    feedback.textContent = \`Thank you, \${name}! Message sent successfully.\`;
    
    // Clear form
    document.getElementById('contactForm').reset();
    
    console.log('Form submitted:', { name, email, message });
};`
    },
    'clock-widget': {
        name: 'Digital Clock',
        description: 'Real-time digital clock widget',
        code: `// Digital Clock Widget
const clockContainer = document.createElement('div');
clockContainer.style.cssText = \`
    text-align: center;
    padding: 15px;
    font-family: 'Arial', monospace;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
\`;

const clockDisplay = document.createElement('div');
clockDisplay.id = 'clock';
clockDisplay.style.cssText = 'font-size: 18px; font-weight: bold; margin-bottom: 5px; letter-spacing: 1px;';

const dateDisplay = document.createElement('div');
dateDisplay.id = 'date';
dateDisplay.style.cssText = 'font-size: 11px; opacity: 0.9;';

clockContainer.appendChild(clockDisplay);
clockContainer.appendChild(dateDisplay);
document.body.appendChild(clockContainer);

function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString();
    const date = now.toLocaleDateString();
    
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    
    if (clockEl) clockEl.textContent = time;
    if (dateEl) dateEl.textContent = date;
}

updateClock();
const clockInterval = setInterval(updateClock, 1000);

console.log('Digital clock widget initialized');

// Cleanup function (optional)
// clearInterval(clockInterval);`
    },
    'variables-display': {
        name: 'Variables Display',
        description: 'Display all global and API variables (auto-updating, no refresh button)',
        code: `// Variables Display Widget - Auto-updating without manual refresh
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
function createVariableTable(variables, tableTitle, bgColor) {
    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom: 30px;';
    
    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = tableTitle;
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
    },
    'io-field': {
        name: 'IO Field',
        description: 'Input field with global variable sync and external update support',
        code: `// CUSTOMIZE: Change the variable name below to desired global variable (e.g., 'temperature', 'pressure', 'userInput')
const VARIABLE_NAME = 'ioFieldValue';

// Create IO Field Element
const ioField = document.createElement('input');
ioField.type = 'text';
ioField.placeholder = 'Type something...';
ioField.style.cssText = \`
  width: 200px;
  padding: 12px 16px;
  border: 2px solid #00d4ff;
  border-radius: 24px;
  background-color: #000;
  color: #00d4ff;
  font-family: Arial, sans-serif;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
\`;

ioField.addEventListener('focus', () => {
  ioField.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.6)';
});

ioField.addEventListener('blur', () => {
  ioField.style.boxShadow = '0 0 10px rgba(0, 212, 255, 0.3)';
});

// Read from global variable on load
if (globalVariables[VARIABLE_NAME] !== undefined) {
  ioField.value = globalVariables[VARIABLE_NAME];
}

// Track previous value to detect external changes
let previousGlobalValue = globalVariables[VARIABLE_NAME];
let isUserEditing = false;
let editTimeoutId = null;

// Mark as editing when user types
ioField.addEventListener('input', () => {
  // Initialize variable on first edit if not already set
  if (globalVariables[VARIABLE_NAME] === undefined) globalVariables[VARIABLE_NAME] = '';
  isUserEditing = true;
  // Clear any existing timeout
  if (editTimeoutId) clearTimeout(editTimeoutId);
  // Reset editing flag after 1 second of no typing
  editTimeoutId = setTimeout(() => {
    isUserEditing = false;
  }, 1000);
});

// Write to global variable on change (blur event)
ioField.addEventListener('change', () => {
  globalVariables[VARIABLE_NAME] = ioField.value;
  previousGlobalValue = ioField.value;
  isUserEditing = false;
  if (editTimeoutId) clearTimeout(editTimeoutId);
  console.log('Updated ' + VARIABLE_NAME + ':', ioField.value);
});

// Also save on blur to ensure changes are captured
ioField.addEventListener('blur', () => {
  globalVariables[VARIABLE_NAME] = ioField.value;
  previousGlobalValue = ioField.value;
  isUserEditing = false;
  if (editTimeoutId) clearTimeout(editTimeoutId);
});

// Cyclically update from global variable (every interval check)
const updateFromGlobal = () => {
  // Don't update if user is actively editing
  if (isUserEditing) return;
  
  // Update field to match global variable every cycle
  ioField.value = globalVariables[VARIABLE_NAME];
  previousGlobalValue = globalVariables[VARIABLE_NAME];
};

// Check for updates periodically (every 500ms)
setInterval(updateFromGlobal, 500);

// Center container
const container = document.createElement('div');
container.style.cssText = \`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: transparent;
\`;

container.appendChild(ioField);
document.body.appendChild(container);`
    },
    'event-button': {
        name: 'Event Button',
        description: 'Button that displays a variable and sets an event variable on click; background tracks the event variable',
        code: `// CUSTOMIZE: variable whose value is shown as button label
const DISPLAY_VARIABLE = 'Left_Interval';

// CUSTOMIZE: variable that is SET when the button is clicked AND drives the background color
const EVENT_VARIABLE = 'List_Select';

// CUSTOMIZE: map EVENT_VARIABLE values to background colors
const COLOR_MAP = {
  '0': '#000000',
  '1': '#00B5E2',
};
const DEFAULT_COLOR = '#000000';

const getColor = () => COLOR_MAP[String(globalVariables[EVENT_VARIABLE])] || DEFAULT_COLOR;

// Create button
const button = document.createElement('button');
button.style.cssText = \`
  width: 150px;
  padding: 12px 16px;
  border: 3px solid #FFFFFF;
  border-radius: 24px;
  background-color: \${getColor()};
  color: #FFFFFF;
  font-family: Arial, sans-serif;
  font-size: 16px;
  font-weight: bold;
  outline: none;
  transition: background-color 0.3s ease;
  box-shadow: 0 0 10px rgba(255,255,255,0.3);
  cursor: pointer;
\`;

button.textContent = String(globalVariables[DISPLAY_VARIABLE]);

button.addEventListener('focus', () => { button.style.boxShadow = '0 0 20px rgba(255,255,255,0.6)'; });
button.addEventListener('blur',  () => { button.style.boxShadow = '0 0 10px rgba(255,255,255,0.3)'; });

button.addEventListener('click', () => {
  // Initialize variables on first click if not already set
  if (globalVariables[DISPLAY_VARIABLE] === undefined) globalVariables[DISPLAY_VARIABLE] = '0';
  if (globalVariables[EVENT_VARIABLE] === undefined) globalVariables[EVENT_VARIABLE] = '0';
  globalVariables[EVENT_VARIABLE] = String(1);
  button.style.backgroundColor = getColor();
  console.log(EVENT_VARIABLE + ' set to:', globalVariables[EVENT_VARIABLE]);
});

// Sync display text and background every 500ms
setInterval(() => {
  button.textContent = String(globalVariables[DISPLAY_VARIABLE]);
  button.style.backgroundColor = getColor();
}, 500);

const container = document.createElement('div');
container.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:transparent;';
container.appendChild(button);
document.body.appendChild(container);`
    },
    'color-dropdown': {
        name: 'Color Dropdown',
        description: 'Dropdown list with color-coded background that tracks a variable',
        code: `// CUSTOMIZE: variable that is SET when dropdown changes AND drives the background color
const EVENT_VARIABLE = 'ADD_L';

// CUSTOMIZE: map EVENT_VARIABLE values to background colors
const COLOR_MAP = {
  '0': '#00B5E2',
  '1': '#000000',
};
const DEFAULT_COLOR = '#000000';

// CUSTOMIZE: dropdown options (value: label pairs)
const OPTIONS = {
  '0': 'Option 1',
  '1': 'Option 2',
};

const getColor = () => COLOR_MAP[String(globalVariables[EVENT_VARIABLE])] || DEFAULT_COLOR;

// Initialize variables if they don't exist
if (globalVariables[EVENT_VARIABLE] === undefined) globalVariables[EVENT_VARIABLE] = 0;

// Create dropdown
const select = document.createElement('select');
select.style.cssText = \`
  width: 650px;
  padding: 12px 16px;
  border: 3px solid #FFFFFF;
  border-radius: 30px;
  background-color: \${getColor()};
  color: #FFFFFF;
  font-family: Arial, sans-serif;
  font-size: 16px;
  font-weight: bold;
  outline: none;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 0 10px rgba(255,255,255,0.3);
  cursor: pointer;
\`;

// Add options
Object.entries(OPTIONS).forEach(([value, label]) => {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  select.appendChild(option);
});

// Set initial value
select.value = String(globalVariables[EVENT_VARIABLE]);

select.addEventListener('change', () => {
  globalVariables[EVENT_VARIABLE] = parseInt(select.value);
  select.style.backgroundColor = getColor();
  console.log(EVENT_VARIABLE + ' set to:', globalVariables[EVENT_VARIABLE]);
});

select.addEventListener('mouseenter', () => { 
  select.style.color = 'rgba(255,255,255,0.6)';
  select.style.boxShadow = 'inset 0 0 20px rgba(255,255,255,0.6)';
});

select.addEventListener('mouseleave', () => {   
  select.style.color = 'rgba(255,255,255,1.0)';
  select.style.boxShadow = '0 0 10px rgba(255,255,255,0.3)';
});

// Sync dropdown value and background color every 500ms
setInterval(() => {
  select.style.backgroundColor = getColor();
  select.value = String(globalVariables[EVENT_VARIABLE]);
}, 500);

const container = document.createElement('div');
container.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:transparent;';
container.appendChild(select);
document.body.appendChild(container);`
    },
    'page-navigation': {
        name: 'Page Navigation',
        description: 'Navigation buttons for all pages in the builder',
        code: `// Page Navigation Menu
const container = document.createElement('div');
container.style.cssText = 'padding: 20px; font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); max-width: 600px; margin: 20px auto;';

const title = document.createElement('h2');
title.textContent = '📄 Page Navigation';
title.style.cssText = 'color: white; text-align: center; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid rgba(255,255,255,0.3);';
container.appendChild(title);

const buttonContainer = document.createElement('div');
buttonContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;';

const funcs = window.pageFunctions || {};
const keys = Object.keys(funcs);

if (keys.length === 0) {
    const msg = document.createElement('p');
    msg.textContent = 'No pages found. Create multiple pages to see navigation buttons.';
    msg.style.cssText = 'color: rgba(255,255,255,0.9); font-style: italic; text-align: center; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 8px; margin: 0;';
    container.appendChild(msg);
} else {
    keys.forEach(funcName => {
        const btn = document.createElement('button');
        btn.textContent = '📄 ' + funcName.replace(/^goTo/, '').replace(/([A-Z])/g, ' $1').trim();
        btn.style.cssText = 'padding: 12px 20px; background: rgba(255,255,255,0.2); color: white; border: 2px solid rgba(255,255,255,0.3); border-radius: 25px; cursor: pointer; font-size: 14px; font-weight: 500;';
        btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,0.35)'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(255,255,255,0.2)'; });
        btn.addEventListener('click', () => {
            if (typeof funcs[funcName] === 'function') funcs[funcName]();
        });
        buttonContainer.appendChild(btn);
    });
    container.appendChild(buttonContainer);
}

document.body.appendChild(container);`
    }
};

const htmlTemplates = {
    'landing-page': {
        name: 'Landing Page', 
        description: 'Simple landing page template',
        code: `<div style="max-width: 800px; margin: auto; padding: 20px; font-family: Arial, sans-serif;">
    <header style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #333; font-size: 2.5em; margin-bottom: 10px;">Welcome to Our Service</h1>
        <p style="color: #666; font-size: 1.2em;">The best solution for your needs</p>
    </header>
    
    <div style="display: flex; gap: 30px; margin-bottom: 40px;">
        <div style="flex: 1; text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h3 style="color: #007bff;">Fast</h3>
            <p>Lightning quick performance</p>
        </div>
        <div style="flex: 1; text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h3 style="color: #28a745;">Reliable</h3>
            <p>99.9% uptime guarantee</p>
        </div>
        <div style="flex: 1; text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h3 style="color: #ffc107;">Easy</h3>
            <p>Simple to use interface</p>
        </div>
    </div>
    
    <div style="text-align: center;">
        <button style="background: #007bff; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 1.1em; cursor: pointer;">
            Get Started
        </button>
    </div>
</div>`
    },
    'font-loader': {
        name: 'Font Loader',
        description: 'Load custom fonts — paste base64, set a name, click Load',
        defaultSize: { width: 1200, height: 800 },
        defaultPosition: { x: 0, y: 0 },
        code: `<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 16px; background: #1e1e2e; color: #cdd6f4; font-family: sans-serif; font-size: 13px; }
  .note { background: #2a2a3e; border-left: 3px solid #28a745; padding: 8px 12px; border-radius: 4px; font-size: 12px; color: #a6adc8; margin-bottom: 14px; }
  .note strong { color: #28a745; }
  h3 { font-size: 14px; color: #cba6f7; margin: 0 0 12px 0; }
  label { display: block; font-size: 11px; color: #a6adc8; margin-bottom: 3px; margin-top: 8px; }
  input[type=text] { width: 100%; padding: 5px 8px; font-size: 13px; background: #313244; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; outline: none; }
  textarea { width: 100%; padding: 5px 8px; font-size: 11px; background: #181825; color: #a6adc8; border: 1px solid #45475a; border-radius: 4px; outline: none; font-family: monospace; resize: vertical; }
  .load-btn { margin-top: 10px; padding: 7px 14px; font-size: 13px; background: #28a745; color: #ffffff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; }
  .load-btn:hover { background: #218838; }
  #status { margin-top: 7px; font-size: 12px; font-weight: bold; min-height: 18px; padding: 6px 10px; border-radius: 4px; background: #2a2a3e; }
  #status:empty { background: transparent; padding: 0; }
  #status.ok { color: #28a745; }
  #status.err { color: #f38ba8; }
  hr { border: none; border-top: 1px solid #313244; margin: 14px 0; }
  #preview-input { width: 100%; padding: 5px 8px; font-size: 13px; background: #181825; color: #cdd6f4; border: 1px solid #45475a; border-radius: 4px; outline: none; margin-bottom: 10px; }
  #font-list { display: flex; flex-direction: column; gap: 8px; }
  .font-row { background: #313244; border-radius: 4px; padding: 8px 10px; }
  .font-row-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .font-name-label { font-size: 10px; color: #a6adc8; letter-spacing: 0.05em; text-transform: uppercase; }
  .font-sample { font-size: 22px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .remove-btn { font-size: 11px; background: transparent; border: 1px solid #45475a; color: #f38ba8; border-radius: 3px; cursor: pointer; padding: 1px 6px; }
</style>

<div class="note"><strong>Tip:</strong> Once your fonts are loaded, this window can be safely removed — fonts persist in the background until the page is refreshed.</div>
<h3>Font Loader</h3>
<label for="fn">Font Name</label>
<input id="fn" type="text" placeholder="e.g. My Font" />
<label for="fb">Base64 Data (paste raw base64 OR full data URI)</label>
<textarea id="fb" rows="4" placeholder="AAEF... or data:font/ttf;base64,AAEF..."></textarea>
<button class="load-btn" id="load-btn">Load Font</button>
<div id="status"></div>
<hr>
<input id="preview-input" type="text" placeholder="Preview text…" value="The quick brown fox 0123456789" />
<div id="font-list"></div>

<script>
(function() {
  var injected = {};

  function detectMime(b64) {
    try {
      var d = atob(b64.substring(0, 12));
      if (d.charCodeAt(0) === 0 && d.charCodeAt(1) === 1) return 'font/ttf';
      if (d.substring(0, 4) === 'OTTO') return 'font/otf';
      if (d.substring(0, 4) === 'wOFF') return 'font/woff';
      if (d.substring(0, 4) === 'wOF2') return 'font/woff2';
      if (d.substring(0, 4) === 'true') return 'font/ttf';
      // AAEF starts == \\x00\\x01\\x00\\x00 which is charCode 0,1 — caught above
    } catch(e) {}
    return 'font/ttf';
  }

  function makeDataUri(raw) {
    raw = raw.trim().replace(/[\\r\\n\\s]/g, '');
    if (raw.indexOf('data:') === 0) return raw;
    return 'data:' + detectMime(raw) + ';base64,' + raw;
  }

  function injectStyle(name, uri) {
    if (injected[name]) return;
    var el = document.getElementById('_gf_styles');
    if (!el) { el = document.createElement('style'); el.id = '_gf_styles'; document.head.appendChild(el); }
    el.textContent += '@font-face { font-family: "' + name + '"; src: url("' + uri + '"); }\\n';
    injected[name] = true;
  }

  document.getElementById('load-btn').addEventListener('click', function() {
    var name = document.getElementById('fn').value.trim();
    var raw  = document.getElementById('fb').value.trim();
    var st   = document.getElementById('status');
    if (!name) { st.textContent = '✗ Enter a font name.'; st.className = 'err'; return; }
    if (!raw)  { st.textContent = '✗ Paste font base64 data.'; st.className = 'err'; return; }
    try {
      var uri = makeDataUri(raw);
      window.parent.globalFonts = window.parent.globalFonts || {};
      window.parent.globalFonts[name] = uri;
      st.textContent = '✓ "' + name + '" loaded — use font-family: "' + name + '" in any window';
      st.className = 'ok';
      renderList();
    } catch(e) {
      st.textContent = '✗ Error: ' + e.message;
      st.className = 'err';
    }
    try { injectFontsEverywhere(); } catch(eInj) {}
  });

  function renderList() {
    var gf = (window.parent && window.parent.globalFonts) ? window.parent.globalFonts : {};
    var names = Object.keys(gf).filter(function(n) { return gf[n] && gf[n].indexOf('data:') === 0; });
    var list = document.getElementById('font-list');
    var text = document.getElementById('preview-input').value || 'AaBbCc 0123456789';
    names.forEach(function(n) { injectStyle(n, gf[n]); });
    list.innerHTML = '';
    if (!names.length) {
      list.innerHTML = '<div style="color:#585b70;font-size:12px;margin-top:6px;">No fonts loaded yet.</div>';
      return;
    }
    names.forEach(function(name) {
      var row = document.createElement('div');
      row.className = 'font-row';
      row.innerHTML =
        '<div class="font-row-header">' +
          '<span class="font-name-label">' + name + '</span>' +
          '<button class="remove-btn" data-f="' + name + '">✕</button>' +
        '</div>' +
        '<div class="font-sample" style="font-family:\\'' + name + '\\'">' + text + '</div>';
      list.appendChild(row);
    });
    Array.from(list.querySelectorAll('.remove-btn')).forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (window.parent.globalFonts) delete window.parent.globalFonts[btn.getAttribute('data-f')];
        renderList();
        try { injectFontsEverywhere(); } catch(eInj) {}
      });
    });
  }

  // Inject font CSS directly into all open builder iframes and the parent document head
  // This avoids changing srcDoc (which would reload the iframes)
  function injectFontsEverywhere() {
    var allF = (window.parent && window.parent.globalFonts) ? window.parent.globalFonts : {};
    var css = Object.keys(allF).map(function(fn) {
      return '@font-face { font-family: "' + fn + '"; src: url("' + allF[fn] + '"); }';
    }).join('\\n');
    // 1. Inject into parent document.head for JS-type windows rendered in main DOM
    try {
      var pDoc = window.parent.document;
      var pStyle = pDoc.getElementById('__builderFonts');
      if (!pStyle) { pStyle = pDoc.createElement('style'); pStyle.id = '__builderFonts'; pDoc.head.appendChild(pStyle); }
      pStyle.textContent = css;
    } catch(e) {}
    // 2. Inject into every iframe on the parent page (HTML-type windows)
    try {
      var frames = window.parent.document.querySelectorAll('iframe');
      for (var i = 0; i < frames.length; i++) {
        try {
          var fdoc = frames[i].contentDocument;
          if (!fdoc || !fdoc.head) continue;
          var fStyle = fdoc.getElementById('__globalFonts');
          if (!fStyle) { fStyle = fdoc.createElement('style'); fStyle.id = '__globalFonts'; fdoc.head.appendChild(fStyle); }
          fStyle.textContent = css;
        } catch(fe) {}
      }
    } catch(e2) {}
  }

  document.getElementById('preview-input').addEventListener('input', renderList);
  renderList();
  setInterval(renderList, 1000);
})();
</script>`
    },
    'dashboard': {
        name: 'Dashboard Layout',
        description: 'Simple dashboard with cards',
        code: `<div style="padding: 20px; background: #f8f9fa; min-height: 100vh; font-family: Arial, sans-serif;">
    <h1 style="margin-bottom: 30px; color: #333;">Dashboard</h1>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0; color: #007bff;">Total Users</h3>
            <p style="font-size: 2em; font-weight: bold; margin: 10px 0; color: #333;">1,234</p>
            <p style="color: #28a745; margin: 0;">↑ 12% from last month</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0; color: #28a745;">Revenue</h3>
            <p style="font-size: 2em; font-weight: bold; margin: 10px 0; color: #333;">$45,678</p>
            <p style="color: #28a745; margin: 0;">↑ 8% from last month</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0; color: #ffc107;">Orders</h3>
            <p style="font-size: 2em; font-weight: bold; margin: 10px 0; color: #333;">567</p>
            <p style="color: #dc3545; margin: 0;">↓ 3% from last month</p>
        </div>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="margin-top: 0;">Recent Activity</h3>
        <ul style="list-style: none; padding: 0;">
            <li style="padding: 10px 0; border-bottom: 1px solid #eee;">User John Doe registered</li>
            <li style="padding: 10px 0; border-bottom: 1px solid #eee;">New order #1234 received</li>
            <li style="padding: 10px 0; border-bottom: 1px solid #eee;">Payment processed for order #1233</li>
        </ul>
    </div>
</div>`
    }
};

interface Template {
    name: string;
    description: string;
    code: string;
    type?: 'javascript' | 'html';
    saved?: string;
    lastModified?: string;
    defaultSize?: { width: number; height: number };
    defaultPosition?: { x: number; y: number };
}

interface VisualizationLibraryProps {
    onSelect?: (id: string) => void;
    onAddTemplate?: (type: 'javascript' | 'html' | 'visualization', template: Template) => void;
}

const VisualizationLibrary: React.FC<VisualizationLibraryProps> = ({ onSelect, onAddTemplate }) => {
    const [activeTab, setActiveTab] = useState<'javascript' | 'html' | 'local'>('javascript');
    const [localTemplates, setLocalTemplates] = useState<Record<string, Template>>({});

    // Load templates from selected files
    const loadTemplatesFromFiles = (files: FileList) => {
        const templates: any = {};
        let loadedCount = 0;
        
        Array.from(files).forEach((file) => {
            if (!file.name.endsWith('.json')) return;
            
            const reader = new FileReader();
            reader.onload = (event: any) => {
                try {
                    const template = JSON.parse(event.target.result);
                    const templateId = `file_${Date.now()}_${Math.random()}`;
                    templates[templateId] = {
                        ...template,
                        fileName: file.name,
                        filePath: file.webkitRelativePath || file.name
                    };
                    loadedCount++;
                    
                    if (loadedCount === files.length) {
                        setLocalTemplates(templates);
                    }
                } catch (error) {
                    console.error(`Error loading template from ${file.name}:`, error);
                    loadedCount++;
                    
                    if (loadedCount === files.length) {
                        setLocalTemplates(templates);
                    }
                }
            };
            reader.readAsText(file);
        });
    };

    const handleAddTemplate = (templateId: string) => {
        let template = null;
        
        if (activeTab === 'javascript') {
            if (templateId === 'simple-counter') template = codeTemplates['simple-counter'];
            if (templateId === 'data-visualization') template = codeTemplates['data-visualization'];
            if (templateId === 'interactive-form') template = codeTemplates['interactive-form'];
            if (templateId === 'clock-widget') template = codeTemplates['clock-widget'];
            if (templateId === 'variables-display') template = codeTemplates['variables-display'];
            if (templateId === 'io-field') template = codeTemplates['io-field'];
            if (templateId === 'event-button') template = codeTemplates['event-button'];
            if (templateId === 'page-navigation') template = codeTemplates['page-navigation'];
            if (templateId === 'color-dropdown') template = codeTemplates['color-dropdown'];
        } else if (activeTab === 'html') {
            if (templateId === 'landing-page') template = htmlTemplates['landing-page'];
            if (templateId === 'font-loader') template = htmlTemplates['font-loader'];
            if (templateId === 'dashboard') template = htmlTemplates['dashboard'];
        } else if (activeTab === 'local') {
            template = localTemplates[templateId];
        }
        
        if (template && onAddTemplate) {
            const typedTemplate: any = template;
            const windowType = (activeTab === 'local' && typedTemplate.type) ? typedTemplate.type : activeTab;
            onAddTemplate(windowType, typedTemplate);
        }
    };

    const deleteLocalTemplate = (templateId: string) => {
        if (confirm('Remove this template from the current session?')) {
            const updatedTemplates = { ...localTemplates };
            delete updatedTemplates[templateId];
            setLocalTemplates(updatedTemplates);
        }
    };



    const selectTemplateFiles = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.json';
        
        input.onchange = (e: any) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                loadTemplatesFromFiles(files);
            }
        };
        input.click();
    };

    const getCurrentTemplates = () => {
        if (activeTab === 'javascript') return codeTemplates;
        if (activeTab === 'html') return htmlTemplates;
        if (activeTab === 'local') return localTemplates;
        return {};
    };

    const currentTemplates = getCurrentTemplates();

    return (
        <div style={{ 
            padding: '15px', 
            backgroundColor: 'white', 
            borderRight: '1px solid #dee2e6',
            height: '100%',
            overflowY: 'auto'
        }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Template Library</h2>
            
            {/* Tabs */}
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => setActiveTab('javascript')}
                    style={{
                        padding: '8px 16px',
                        marginRight: '5px',
                        backgroundColor: activeTab === 'javascript' ? '#007bff' : '#f8f9fa',
                        color: activeTab === 'javascript' ? 'white' : '#333',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px 4px 0 0',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    JavaScript
                </button>
                <button
                    onClick={() => setActiveTab('html')}
                    style={{
                        padding: '8px 16px',
                        marginRight: '5px',
                        backgroundColor: activeTab === 'html' ? '#007bff' : '#f8f9fa',
                        color: activeTab === 'html' ? 'white' : '#333',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px 4px 0 0',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    HTML
                </button>
                <button
                    onClick={() => setActiveTab('local')}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: activeTab === 'local' ? '#007bff' : '#f8f9fa',
                        color: activeTab === 'local' ? 'white' : '#333',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px 4px 0 0',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    My Templates ({Object.keys(localTemplates).length})
                </button>
            </div>

            {/* Local Templates File Selection */}
            {activeTab === 'local' && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                    <button
                        onClick={selectTemplateFiles}
                        style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}
                        title="Select individual template files"
                    >
                        📄 Select Files
                    </button>
                    <div style={{ 
                        flex: 1,
                        fontSize: '10px',
                        color: '#0c5aa6',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '8px'
                    }}>
                        💡 Select template files (.json) from your computer
                    </div>
                </div>
            )}

            {/* Template List */}
            <div>
                {Object.entries(currentTemplates).length === 0 && activeTab === 'local' ? (
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#6c757d',
                        fontSize: '14px'
                    }}>
                        No template files selected.<br />
                        Use 📄 Select Files to load templates.
                    </div>
                ) : (
                    Object.entries(currentTemplates).map(([id, template]) => {
                        const typedTemplate: any = template;
                        return (
                        <div 
                            key={id}
                            style={{
                                marginBottom: '15px',
                                padding: '12px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                backgroundColor: '#f8f9fa',
                                position: 'relative'
                            }}
                        >
                            <div
                                style={{
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onClick={() => handleAddTemplate(id)}
                                onMouseEnter={(e) => {
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) parent.style.backgroundColor = '#e9ecef';
                                }}
                                onMouseLeave={(e) => {
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) parent.style.backgroundColor = '#f8f9fa';
                                }}
                            >
                                <h4 style={{ 
                                    margin: '0 0 5px 0', 
                                    fontSize: '14px', 
                                    color: '#007bff',
                                    paddingRight: activeTab === 'local' ? '30px' : '0'
                                }}>  
                                    {typedTemplate.name}
                                    {activeTab === 'local' && typedTemplate.type && (
                                        <span style={{
                                            marginLeft: '8px',
                                            fontSize: '10px',
                                            backgroundColor: typedTemplate.type === 'javascript' ? '#28a745' : typedTemplate.type === 'visualization' ? '#6f42c1' : '#fd7e14',
                                            color: 'white',
                                            padding: '2px 6px',
                                            borderRadius: '10px'
                                        }}>
                                            {typedTemplate.type.toUpperCase()}
                                        </span>
                                    )}
                                </h4>
                                <p style={{ 
                                    margin: 0, 
                                    fontSize: '12px', 
                                    color: '#6c757d',
                                    lineHeight: '1.4'
                                }}>
                                    {typedTemplate.description}
                                </p>
                                {activeTab === 'local' && typedTemplate.filePath && (
                                    <p style={{
                                        margin: '5px 0 0 0',
                                        fontSize: '10px',
                                        color: '#868e96',
                                        fontStyle: 'italic'
                                    }}>
                                        📄 {typedTemplate.filePath}
                                    </p>
                                )}
                            </div>
                            {activeTab === 'local' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteLocalTemplate(id);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        width: '20px',
                                        height: '20px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10
                                    }}
                                    title="Remove from current session"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                        );
                    })
                )}
            </div>

            <div style={{ 
                marginTop: '20px', 
                padding: '10px', 
                backgroundColor: '#e7f3ff', 
                borderRadius: '4px',
                fontSize: '12px',
                color: '#0c5aa6'
            }}>
                {activeTab === 'local' 
                    ? '💡 Use 💾 Save on JavaScript windows to create template files, then load them here'
                    : '💡 Click on any template to add it as a new window to your canvas'
                }
            </div>
        </div>
    );
};

export default VisualizationLibrary;