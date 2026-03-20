export const ioField = {
  name: 'IO Field',
  description: 'Input field with global variable sync and external update support',
  code: `// CUSTOMIZE: Change the variable name below to desired global variable (e.g., 'temperature', 'pressure', 'userInput')
const VARIABLE_NAME = 'ioFieldValue';

const ioColors = {
  accent: (window.globalVariables?.global_style_1) || '#00d4ff',
  bg: (window.globalVariables?.global_style_2) || '#000',
};
// Create IO Field Element
const ioField = document.createElement('input');
ioField.type = 'text';
ioField.placeholder = 'Type something...';
ioField.style.cssText = \`
  width: 200px;
  padding: 12px 16px;
  border: 2px solid \${ioColors.accent};
  border-radius: 24px;
  background-color: \${ioColors.bg};
  color: \${ioColors.accent};
  font-family: Arial, sans-serif;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
\`;

ioField.addEventListener('focus', () => {
  ioField.style.boxShadow = \`0 0 20px rgba(0, 212, 255, 0.6)\`;
});

ioField.addEventListener('blur', () => {
  ioField.style.boxShadow = \`0 0 10px rgba(0, 212, 255, 0.3)\`;
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
};
