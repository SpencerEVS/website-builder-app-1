export const simpleCounterTemplate = {
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
};