export const landingPage = {
    name: 'Landing Page',
    description: 'Simple landing page template',
    code: `<script>
// Compute actual colors from global_style variables
const getColor = (key, fallback) => window.globalVariables?.[key] || fallback;
const c1 = getColor('global_style_1', '#333');
const c2 = getColor('global_style_2', '#666');
const c3 = getColor('global_style_3', '#ddd');
const c4 = getColor('global_style_4', '#007bff');
const c5 = getColor('global_style_5', '#28a745');
const c6 = getColor('global_style_6', '#ffc107');
</script>
<div style="max-width: 800px; margin: auto; padding: 20px; font-family: Arial, sans-serif;">
    <header style="text-align: center; margin-bottom: 40px;">
        <h1 id="h1-title" style="font-size: 2.5em; margin-bottom: 10px;">Welcome to Our Service</h1>
        <p id="p-subtitle" style="font-size: 1.2em;">The best solution for your needs</p>
    </header>
    
    <div style="display: flex; gap: 30px; margin-bottom: 40px;">
        <div id="card-fast" style="flex: 1; text-align: center; padding: 20px; border-radius: 8px;">
            <h3 id="h3-fast">Fast</h3>
            <p>Lightning quick performance</p>
        </div>
        <div id="card-reliable" style="flex: 1; text-align: center; padding: 20px; border-radius: 8px;">
            <h3 id="h3-reliable">Reliable</h3>
            <p>99.9% uptime guarantee</p>
        </div>
        <div id="card-easy" style="flex: 1; text-align: center; padding: 20px; border-radius: 8px;">
            <h3 id="h3-easy">Easy</h3>
            <p>Simple to use interface</p>
        </div>
    </div>
    
    <div style="text-align: center;">
        <button id="cta-btn" style="color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 1.1em; cursor: pointer;">
            Get Started
        </button>
    </div>
</div>
<script>
// Apply colors to elements
document.getElementById('h1-title').style.color = c1;
document.getElementById('p-subtitle').style.color = c2;

['card-fast', 'card-reliable', 'card-easy'].forEach(id => {
  const card = document.getElementById(id);
  card.style.border = \`1px solid \${c3}\`;
});

document.getElementById('h3-fast').style.color = c4;
document.getElementById('h3-reliable').style.color = c5;
document.getElementById('h3-easy').style.color = c6;

const btn = document.getElementById('cta-btn');
btn.style.background = c4;
btn.addEventListener('mouseover', () => btn.style.background = c5);
btn.addEventListener('mouseout', () => btn.style.background = c4);
</script>`
};
