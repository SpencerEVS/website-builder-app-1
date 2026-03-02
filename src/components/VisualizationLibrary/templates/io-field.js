// Create IO Field Element
const ioField = document.createElement('input');
ioField.type = 'text';
ioField.placeholder = 'Type something...';
ioField.style.cssText = `
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
`;

ioField.addEventListener('focus', () => {
  ioField.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.6)';
});

ioField.addEventListener('blur', () => {
  ioField.style.boxShadow = '0 0 10px rgba(0, 212, 255, 0.3)';
});

// Read from global variable on load
if (globalVariables.ioFieldValue !== undefined) {
  ioField.value = globalVariables.ioFieldValue;
}

// Write to global variable on change
ioField.addEventListener('change', () => {
  globalVariables.ioFieldValue = ioField.value;
  console.log('Updated ioFieldValue:', ioField.value);
});

// Only update from global variable if field is NOT focused
const updateFromGlobal = () => {
  if (document.activeElement !== ioField && globalVariables.ioFieldValue !== undefined) {
    ioField.value = globalVariables.ioFieldValue;
  }
};

// Check for updates periodically (every 500ms)
setInterval(updateFromGlobal, 500);

// Center container
const container = document.createElement('div');
container.style.cssText = `
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #000;
`;

container.appendChild(ioField);
document.body.appendChild(container);
