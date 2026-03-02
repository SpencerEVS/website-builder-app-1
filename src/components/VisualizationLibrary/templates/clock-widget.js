export const clockWidgetTemplate = {
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
};