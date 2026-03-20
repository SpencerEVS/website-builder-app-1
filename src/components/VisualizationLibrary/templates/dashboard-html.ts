export const dashboardHtml = {
    name: 'Dashboard Layout',
    description: 'Simple dashboard with cards',
    code: `<script>
const getColor = (key, fallback) => window.globalVariables?.[key] || fallback;
const c1 = getColor('global_style_1', '#333');
const c4 = getColor('global_style_4', '#007bff');
const c5 = getColor('global_style_5', '#28a745');
const c6 = getColor('global_style_6', '#ffc107');
const c9 = getColor('global_style_9', '#f8f9fa');
const c10 = getColor('global_style_10', '#dc3545');
const c11 = getColor('global_style_11', '#eee');
</script>
<div id="dashboard-root" style="padding: 20px; min-height: 100vh; font-family: Arial, sans-serif;">
    <h1 id="dashboard-title" style="margin-bottom: 30px;">Dashboard</h1>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 id="h3-users" style="margin-top: 0;">Total Users</h3>
            <p id="p-users-count" style="font-size: 2em; font-weight: bold; margin: 10px 0;">1,234</p>
            <p id="p-users-trend" style="margin: 0;">↑ 12% from last month</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 id="h3-revenue" style="margin-top: 0;">Revenue</h3>
            <p id="p-revenue-amount" style="font-size: 2em; font-weight: bold; margin: 10px 0;">$45,678</p>
            <p id="p-revenue-trend" style="margin: 0;">↑ 8% from last month</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 id="h3-orders" style="margin-top: 0;">Orders</h3>
            <p id="p-orders-count" style="font-size: 2em; font-weight: bold; margin: 10px 0;">567</p>
            <p id="p-orders-trend" style="margin: 0;">↓ 3% from last month</p>
        </div>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="margin-top: 0;">Recent Activity</h3>
        <ul id="activity-list" style="list-style: none; padding: 0;">
            <li>User John Doe registered</li>
            <li>New order #1234 received</li>
            <li>Payment processed for order #1233</li>
        </ul>
    </div>
</div>
<script>
// Apply colors
document.getElementById('dashboard-root').style.background = c9;
document.getElementById('dashboard-title').style.color = c1;

document.getElementById('h3-users').style.color = c4;
document.getElementById('p-users-count').style.color = c1;
document.getElementById('p-users-trend').style.color = c5;

document.getElementById('h3-revenue').style.color = c5;
document.getElementById('p-revenue-amount').style.color = c1;
document.getElementById('p-revenue-trend').style.color = c5;

document.getElementById('h3-orders').style.color = c6;
document.getElementById('p-orders-count').style.color = c1;
document.getElementById('p-orders-trend').style.color = c10;

// Color activity list items
document.querySelectorAll('#activity-list li').forEach(li => {
  li.style.padding = '10px 0';
  li.style.borderBottom = \`1px solid \${c11}\`;
});
</script>`
};
