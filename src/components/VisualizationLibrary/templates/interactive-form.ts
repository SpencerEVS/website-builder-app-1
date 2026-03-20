export const interactiveForm = {
  name: 'Interactive Form',
  description: 'Form with validation and dynamic feedback',
  code: `// Interactive Contact Form
const formColors = {
  text: (window.globalVariables?.global_style_1) || '#333',
  label: (window.globalVariables?.global_style_2) || '#555',
  border: (window.globalVariables?.global_style_3) || '#ddd',
  primary: (window.globalVariables?.global_style_4) || '#007bff',
  successBg: (window.globalVariables?.global_style_5) || '#d4edda',
  successText: (window.globalVariables?.global_style_6) || '#155724',
};
const formContainer = document.createElement('div');
formContainer.style.cssText = \`max-width: 400px; margin: 0 auto; padding: 20px; font-family: Arial; background: #f9f9f9; border-radius: 8px;\`;

formContainer.innerHTML = \`
    <h3 style="margin-top: 0; color: \${formColors.text}; text-align: center;">Contact Us</h3>
    <form id="contactForm">
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: \${formColors.label};">Name:</label>
            <input type="text" id="name" required style="width: 100%; padding: 8px; border: 1px solid \${formColors.border}; border-radius: 4px; font-size: 14px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: \${formColors.label};">Email:</label>
            <input type="email" id="email" required style="width: 100%; padding: 8px; border: 1px solid \${formColors.border}; border-radius: 4px; font-size: 14px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: \${formColors.label};">Message:</label>
            <textarea id="message" required rows="4" style="width: 100%; padding: 8px; border: 1px solid \${formColors.border}; border-radius: 4px; font-size: 14px; resize: vertical;"></textarea>
        </div>
        <button type="submit" style="width: 100%; padding: 10px; background: \${formColors.primary}; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer;">Send Message</button>
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
    feedback.style.cssText = \`display: block; background: \${formColors.successBg}; color: \${formColors.successText}; padding: 8px; border-radius: 3px; font-size: 11px; border: 1px solid \${formColors.border};\`;
    feedback.textContent = \`Thank you, \${name}! Message sent successfully.\`;
    
    // Clear form
    document.getElementById('contactForm').reset();
    
    console.log('Form submitted:', { name, email, message });
};`
};
