export const simpleChart = {
  name: 'Simple Chart',
  description: 'Basic data visualization with HTML/CSS',
  code: `// Simple Bar Chart Visualization
const data = [15, 25, 35, 20, 45];
const maxValue = Math.max(...data);

const chartContainer = document.createElement('div');
chartContainer.style.cssText = 'padding: 10px; font-family: Arial; text-align: center;';

const title = document.createElement('h4');
const chartColors = (window.globalVariables?.global_style_1) || '#333';
const chartGreen = (window.globalVariables?.global_style_2) || '#4CAF50';
title.textContent = 'Sales Data';
title.style.cssText = \`margin: 0 0 10px 0; color: \${chartColors};\`;
chartContainer.appendChild(title);

const chartArea = document.createElement('div');
chartArea.style.cssText = 'display: flex; align-items: end; justify-content: center; height: 120px;';

data.forEach((value, index) => {
    const bar = document.createElement('div');
    const height = (value / maxValue) * 100;
    bar.style.cssText = \`
        width: 30px;
        height: \${height}px;
        background: \${chartGreen};
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
};
