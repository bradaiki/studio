/**
 * Simple browser-compatible setup functions
 * These can be copy-pasted directly into the browser console
 */

// This function can be copy-pasted into the browser console
export const BROWSER_SETUP_SCRIPT = `
(async function setupInstructorInBrowser() {
  try {
    console.log('🚀 Starting instructor setup...');
    
    // Check if we're on the right page
    if (!window.location.pathname.includes('/studio/studio_1')) {
      alert('❌ Please navigate to the Denver Aikido Dojo page first: /studio/studio_1');
      return;
    }
    
    // Try to access the Angular component directly
    const studioElements = document.querySelectorAll('app-studio-page');
    if (studioElements.length === 0) {
      alert('❌ Studio page component not found. Make sure you are on the studio page.');
      return;
    }
    
    // Get the Angular component instance
    let component;
    try {
      component = ng.getComponent(studioElements[0]);
    } catch (error) {
      console.error('Could not access Angular component:', error);
      alert('❌ Could not access Angular component. Try refreshing the page.');
      return;
    }
    
    if (!component) {
      alert('❌ Component instance not found. Try refreshing the page.');
      return;
    }
    
    // Check if the setup method exists
    if (typeof component.setupInstructorTestData === 'function') {
      console.log('✅ Found setup method, calling it...');
      await component.setupInstructorTestData();
    } else {
      console.log('⚠️ Setup method not found on component, trying manual override...');
      
      // Manual override approach
      component.canReviewRequests = true;
      component.pendingRequestCount = 3;
      
      // Trigger change detection
      try {
        const injector = ng.getInjector(studioElements[0]);
        const cdr = injector.get(ng.core.ChangeDetectorRef);
        cdr.detectChanges();
        
        console.log('✅ Manually enabled instructor permissions');
        alert('✅ Instructor permissions enabled temporarily!\\n\\nRefresh the page to see the "Review Join Requests" button.');
      } catch (error) {
        console.error('Could not trigger change detection:', error);
        alert('⚠️ Permissions set but UI may not update. Try refreshing the page.');
      }
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    alert('❌ Setup failed: ' + error.message + '\\n\\nCheck console for details.');
  }
})();
`;

// Alternative approach using localStorage to persist the override
export const PERSISTENT_OVERRIDE_SCRIPT = `
(function enableInstructorMode() {
  // Set a flag in localStorage
  localStorage.setItem('instructor-test-mode', 'true');
  localStorage.setItem('instructor-studio-id', 'studio_1');
  
  console.log('✅ Instructor test mode enabled');
  console.log('🔄 Refresh the page to see instructor features');
  
  alert('✅ Instructor test mode enabled!\\n\\nRefresh the page to see the instructor features.');
})();
`;

// Script to disable the override
export const DISABLE_OVERRIDE_SCRIPT = `
(function disableInstructorMode() {
  localStorage.removeItem('instructor-test-mode');
  localStorage.removeItem('instructor-studio-id');
  
  console.log('✅ Instructor test mode disabled');
  console.log('🔄 Refresh the page to return to normal mode');
  
  alert('✅ Instructor test mode disabled!\\n\\nRefresh the page to return to normal mode.');
})();
`;