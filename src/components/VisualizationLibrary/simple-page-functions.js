// Simple Page Functions Template Code
const pageNavigationTemplate = `// Page Functions Menu - Simple Navigation
const container = document.createElement('div');
container.style.cssText = 'padding: 20px; font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); max-width: 600px; margin: 20px auto; border: 2px solid rgba(255,255,255,0.1);';

const title = document.createElement('h2');
title.textContent = '📄 Page Navigation';
title.style.cssText = 'color: white; text-align: center; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid rgba(255,255,255,0.3);';
container.appendChild(title);

let currentPageFunctions = {};

function requestPageFunctions() {
    console.log('Requesting page functions from parent window...');
    
    const messageListener = (event) => {
        if (event.data && event.data.type === 'pageFunctionsResponse') {
            console.log('Received page functions response:', event.data.functions);
            currentPageFunctions = {};
            
            event.data.functions.forEach(func => {
                currentPageFunctions[func.functionName] = {
                    id: func.id,
                    name: func.name
                };
            });
            
            displayButtons();
            window.removeEventListener('message', messageListener);
        }
    };
    
    window.addEventListener('message', messageListener);
    
    if (window.parent) {
        window.parent.postMessage({
            type: 'requestPageFunctions'
        }, '*');
    }
    
    setTimeout(() => {
        if (Object.keys(currentPageFunctions).length === 0) {
            showEmptyState();
        }
    }, 1000);
}

function displayButtons() {
    const existingSections = container.querySelectorAll('.buttons-section');
    existingSections.forEach(section => section.remove());
    
    if (Object.keys(currentPageFunctions).length > 0) {
        const section = document.createElement('div');
        section.classList.add('buttons-section');
        
        const sectionTitle = document.createElement('h3');
        sectionTitle.textContent = 'Available Pages';
        sectionTitle.style.cssText = 'color: white; margin: 0 0 15px 0; padding: 8px 12px; background: rgba(255,255,255,0.2); border-radius: 6px;';
        section.appendChild(sectionTitle);

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;';

        Object.entries(currentPageFunctions).forEach(([functionName, data]) => {
            const button = document.createElement('button');
            button.textContent = '📄 ' + data.name;
            button.style.cssText = 'padding: 12px 20px; background: rgba(255,255,255,0.2); color: white; border: 2px solid rgba(255,255,255,0.3); border-radius: 25px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s ease;';
            
            button.addEventListener('click', () => {
                console.log('Calling page function:', functionName);
                
                if (window.parent && data.id) {
                    window.parent.postMessage({
                        type: 'callPageFunction',
                        pageId: data.id,
                        functionName: functionName
                    }, '*');
                    
                    button.style.background = 'rgba(40, 167, 69, 0.8)';
                    setTimeout(() => {
                        button.style.background = 'rgba(255,255,255,0.2)';
                    }, 200);
                }
            });
            
            buttonContainer.appendChild(button);
        });

        section.appendChild(buttonContainer);
        container.appendChild(section);
    }
}

function showEmptyState() {
    const emptySection = document.createElement('div');
    emptySection.classList.add('buttons-section');
    
    const emptyMsg = document.createElement('p');
    emptyMsg.textContent = 'No page functions found. Create multiple pages to see navigation functions.';
    emptyMsg.style.cssText = 'color: rgba(255,255,255,0.9); font-style: italic; text-align: center; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 8px;';
    emptySection.appendChild(emptyMsg);
    
    container.appendChild(emptySection);
}

// Initialize
document.body.appendChild(container);
setTimeout(() => { requestPageFunctions(); }, 100);
console.log('Page Functions Menu initialized');`;

module.exports = pageNavigationTemplate;