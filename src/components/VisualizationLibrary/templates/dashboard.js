export const dashboardTemplate = {
    name: 'Dashboard Layout',
    description: 'Simple dashboard with cards',
    code: `<div style="padding: 20px; background: #f8f9fa; min-height: 100vh; font-family: Arial, sans-serif;">
    <h1 style="margin-bottom: 30px; color: #333;">Dashboard</h1>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0; color: #007bff;">Total Users</h3>
            <p style="font-size: 2em; font-weight: bold; margin: 10px 0; color: #333;">1,234</p>
            <p style="color: #28a745; margin: 0;">↑ 12% from last month</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0; color: #28a745;">Revenue</h3>
            <p style="font-size: 2em; font-weight: bold; margin: 10px 0; color: #333;">$45,678</p>
            <p style="color: #28a745; margin: 0;">↑ 8% from last month</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0; color: #ffc107;">Orders</h3>
            <p style="font-size: 2em; font-weight: bold; margin: 10px 0; color: #333;">567</p>
            <p style="color: #dc3545; margin: 0;">↓ 3% from last month</p>
        </div>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="margin-top: 0;">Recent Activity</h3>
        <ul style="list-style: none; padding: 0;">
            <li style="padding: 10px 0; border-bottom: 1px solid #eee;">User John Doe registered</li>
            <li style="padding: 10px 0; border-bottom: 1px solid #eee;">New order #1234 received</li>
            <li style="padding: 10px 0; border-bottom: 1px solid #eee;">Payment processed for order #1233</li>
        </ul>
    </div>
</div>`
};