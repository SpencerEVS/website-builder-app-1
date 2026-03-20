export const pageNavigation = {
  name: 'Page Navigation',
  description: 'Dynamic navigation bar that scans page functions and creates navigation buttons',
  code: `try {
  // Get colors from global variables first, then fall back to defaults
  const getColor = (key, fallback) => window.globalVariables?.[key] || fallback;
  const colors = {
    navBg: getColor('global_style_9', '#f8f9fa'),      // Navigation bar background
    btnBg: getColor('global_style_4', '#007bff'),      // Button background
    btnText: getColor('global_style_3', '#ffffff')     // Button text color
  };

  // Get all available page functions from window
  const getAvailablePages = () => {
    const pages = [];
    
    // First, try window.pageFunctions object
    if (window.pageFunctions && typeof window.pageFunctions === 'object') {
      for (const key in window.pageFunctions) {
        if (key.startsWith('goTo') && typeof window.pageFunctions[key] === 'function') {
          const pageName = key.substring(4);
          pages.push({
            key: key,
            label: pageName.replace(/([A-Z])/g, ' \$1').trim(),
            fn: window.pageFunctions[key]
          });
        }
      }
    }
    
    // Also scan window object for goTo* functions directly
    for (const key in window) {
      if (key.startsWith('goTo') && typeof window[key] === 'function') {
        if (!pages.find(p => p.key === key)) {
          const pageName = key.substring(4);
          pages.push({
            key: key,
            label: pageName.replace(/([A-Z])/g, ' \$1').trim(),
            fn: window[key]
          });
        }
      }
    }
    
    return pages;
  };

  // Create navigation container
  const nav = document.createElement('nav');
  if (!nav) throw new Error('Failed to create nav element');
  
  nav.style.background = colors.navBg;
  nav.style.display = 'flex';
  nav.style.gap = '10px';
  nav.style.padding = '15px 20px';
  nav.style.borderBottom = '3px solid ' + colors.btnBg;
  nav.style.flexWrap = 'wrap';
  nav.style.alignItems = 'center';

  // Get page functions and create buttons
  const pages = getAvailablePages();

  if (pages.length === 0) {
    const debugMsg = document.createElement('div');
    debugMsg.style.color = '#666';
    debugMsg.style.padding = '10px';
    debugMsg.style.background = '#f0f0f0';
    debugMsg.style.borderRadius = '4px';
    debugMsg.style.fontSize = '12px';
    debugMsg.textContent = 'ℹ️ No page functions found. Create multiple pages to enable navigation.';
    nav.appendChild(debugMsg);
  } else {
    pages.forEach(page => {
      const btn = document.createElement('button');
      if (!btn) return;
      
      btn.textContent = page.label || page.key;
      btn.style.padding = '10px 20px';
      btn.style.background = colors.btnBg;
      btn.style.color = colors.btnText;
      btn.style.border = 'none';
      btn.style.borderRadius = '5px';
      btn.style.cursor = 'pointer';
      btn.style.fontWeight = 'bold';
      btn.style.transition = 'background 0.3s ease, transform 0.1s ease';
      
      const hoverColor = '#0056b3';
      
      btn.addEventListener('mouseover', function() {
        this.style.background = hoverColor;
        this.style.transform = 'scale(1.05)';
      });
      
      btn.addEventListener('mouseout', function() {
        this.style.background = colors.btnBg;
        this.style.transform = 'scale(1)';
      });
      
      if (page.fn && typeof page.fn === 'function') {
        btn.addEventListener('click', page.fn);
      }
      
      nav.appendChild(btn);
    });
  }

  // Append nav to the beginning of the body
  const appendNav = () => {
    if (!nav) return;
    
    if (document.body) {
      if (document.body.firstChild) {
        document.body.insertBefore(nav, document.body.firstChild);
      } else {
        document.body.appendChild(nav);
      }
    } else {
      const readyHandler = () => {
        if (document.body) {
          if (document.body.firstChild) {
            document.body.insertBefore(nav, document.body.firstChild);
          } else {
            document.body.appendChild(nav);
          }
        }
        document.removeEventListener('DOMContentLoaded', readyHandler);
      };
      document.addEventListener('DOMContentLoaded', readyHandler);
    }
  };
  
  appendNav();
} catch(e) {
  console.error('Page Navigation Error:', e);
}
`
};
