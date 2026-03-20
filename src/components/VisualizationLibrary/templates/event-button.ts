export const eventButton = {
  name: 'Event Button',
  description: 'Button that displays a variable and sets an event variable on click; background tracks the event variable',
  code: `// CUSTOMIZE: variable whose value is shown as button label
const DISPLAY_VARIABLE = 'Left_Interval';

// CUSTOMIZE: variable that is SET when the button is clicked AND drives the background color
const EVENT_VARIABLE = 'List_Select';

// CUSTOMIZE: map EVENT_VARIABLE values to background colors
const buttonColors = {
  '0': (window.globalVariables?.global_style_2) || '#000000',
  '1': (window.globalVariables?.global_style_1) || '#00B5E2',
};
const DEFAULT_COLOR = (window.globalVariables?.global_style_2) || '#000000';

const getColor = () => {
  const val = String(globalVariables[EVENT_VARIABLE]);
  return buttonColors[val] || DEFAULT_COLOR;
};

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
};
