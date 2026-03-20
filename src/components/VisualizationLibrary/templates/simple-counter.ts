export const simpleCounter = {
  name: 'Simple Counter',
  description: 'A basic counter with increment/decrement buttons',
  code: `// Simple Counter Example
const getColors = () => ({
  text: (window.globalVariables?.global_style_1) || '#333',
  buttonGreen: (window.globalVariables?.global_style_2) || '#4CAF50',
  buttonRed: (window.globalVariables?.global_style_3) || '#f44336',
});
const colors = getColors();
let count = 0;
const container = document.createElement('div');
container.innerHTML = \`
    <div style="text-align: center; padding: 10px; font-family: Arial;">
        <h3 style="margin: 0 0 10px 0; color: \${colors.text};">Counter: <span id="count">0</span></h3>
        <button id="increment" style="margin: 0 5px; padding: 5px 10px; background: \${colors.buttonGreen}; color: white; border: none; border-radius: 3px; cursor: pointer;">+</button>
        <button id="decrement" style="margin: 0 5px; padding: 5px 10px; background: \${colors.buttonRed}; color: white; border: none; border-radius: 3px; cursor: pointer;">-</button>
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
};
