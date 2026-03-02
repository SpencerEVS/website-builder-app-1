export const interactiveFormTemplate = {
    name: 'Interactive Form',
    description: 'Form with validation and dynamic feedback',
    code: `// Interactive Contact Form
const formContainer = document.createElement('div');
formContainer.style.cssText = 'max-width: 400px; margin: 0 auto; padding: 20px; font-family: Arial; background: #f9f9f9; border-radius: 8px;';

formContainer.innerHTML = \`
    <h3 style="margin-top: 0; color: #333; text-align: center;">Contact Us</h3>
    <form id="contactForm">
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Name:</label>
            <input type="text" id="name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Email:</label>
            <input type="email" id="email" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #555;">Message:</label>
            <textarea id="message" required rows="4" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; resize: vertical;"></textarea>
        </div>
        <button type="submit" style="width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer;">Send Message</button>
    </form>
    <div id="feedback" style="margin-top: 15px; padding: 10px; border-radius: 4px; display: none;"></div>
\`;

document.body.appendChild(formContainer);

// Form submission handler
document.getElementById('contactForm').onsubmit = (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    const feedback = document.getElementById('feedback');
    feedback.style.cssText = 'display: block; background: #d4edda; color: #155724; padding: 8px; border-radius: 3px; font-size: 11px; border: 1px solid #c3e6cb;';
    feedback.textContent = \`Thank you, \${name}! Message sent successfully.\`;
    
    // Clear form
    document.getElementById('contactForm').reset();
    
    console.log('Form submitted:', { name, email, message });
};`
};