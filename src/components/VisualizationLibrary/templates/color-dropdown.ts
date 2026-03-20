export const colorDropdown = {
  name: 'Color Dropdown',
  description: 'Dropdown list with color-coded background that tracks a variable',
  code: `// CUSTOMIZE: variable that is SET when dropdown changes AND drives the background color
const EVENT_VARIABLE = 'ADD_L';

// CUSTOMIZE: map EVENT_VARIABLE values to background colors
const dropdownColors = {
  '0': (window.globalVariables?.global_style_1) || '#00B5E2',
  '1': (window.globalVariables?.global_style_2) || '#000000',
};
const DEFAULT_COLOR = (window.globalVariables?.global_style_2) || '#000000';

// CUSTOMIZE: dropdown options (value: label pairs)
const OPTIONS = {
  '0': 'Option 1',
  '1': 'Option 2',
};

const getColor = () => {\n  const val = String(globalVariables[EVENT_VARIABLE]);\n  return dropdownColors[val] || DEFAULT_COLOR;\n};

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
};
