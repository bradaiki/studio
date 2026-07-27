// Enhanced debug script to find the correct Angular component
// Copy and paste this into the browser console

(function debugInstructorButtonV2() {
  console.log('🔍 Enhanced debugging for instructor button...');
  
  // Check URL and localStorage
  console.log('📍 Current URL:', window.location.href);
  console.log('🗄️ localStorage settings:');
  console.log('   instructor-test-mode:', localStorage.getItem('instructor-test-mode'));
  console.log('   instructor-studio-id:', localStorage.getItem('instructor-studio-id'));
  
  // Look for various Angular components
  const possibleSelectors = [
    'app-studio-page',
    'app-studio',
    'ion-content',
    'ion-header',
    '[ng-version]'
  ];
  
  console.log('🔍 Searching for Angular components...');
  
  let foundComponent = null;
  let foundElement = null;
  
  for (const selector of possibleSelectors) {
    const elements = document.querySelectorAll(selector);
    console.log(`   ${selector}: ${elements.length} elements found`);
    
    if (elements.length > 0) {
      for (let i = 0; i < elements.length; i++) {
        try {
          const component = ng.getComponent(elements[i]);
          if (component && (component.canReviewRequests !== undefined || component.studio !== undefined)) {
            console.log(`✅ Found studio component via ${selector}[${i}]`);
            foundComponent = component;
            foundElement = elements[i];
            break;
          }
        } catch (error) {
          // Continue searching
        }
      }
      if (foundComponent) break;
    }
  }
  
  if (foundComponent) {
    console.log('📱 Component properties:');
    console.log('   canReviewRequests:', foundComponent.canReviewRequests);
    console.log('   isLoadingPermissions:', foundComponent.isLoadingPermissions);
    console.log('   pendingRequestCount:', foundComponent.pendingRequestCount);
    console.log('   currentUserId:', foundComponent.currentUserId);
    console.log('   studio:', foundComponent.studio);
    
    // Check if this is the right studio
    if (foundComponent.studio) {
      console.log('   studio.id:', foundComponent.studio.id);
      console.log('   studio.name:', foundComponent.studio.name);
    }
    
    // Look for existing buttons
    const allButtons = document.querySelectorAll('ion-button');
    console.log('🔘 Total ion-buttons found:', allButtons.length);
    
    allButtons.forEach((btn, index) => {
      console.log(`   Button ${index}: "${btn.textContent?.trim()}"`);
    });
    
    // Try to manually enable permissions
    console.log('🔧 Manually enabling instructor permissions...');
    foundComponent.canReviewRequests = true;
    foundComponent.isLoadingPermissions = false;
    foundComponent.pendingRequestCount = 3;
    
    // Trigger change detection
    try {
      const injector = ng.getInjector(foundElement);
      const cdr = injector.get(ng.core.ChangeDetectorRef);
      cdr.detectChanges();
      console.log('✅ Change detection triggered');
      
      // Check for button after change detection
      setTimeout(() => {
        const buttonsAfter = document.querySelectorAll('ion-button');
        console.log('🔘 Buttons after change detection:', buttonsAfter.length);
        
        const reviewButton = Array.from(buttonsAfter).find(btn => 
          btn.textContent && btn.textContent.toLowerCase().includes('review')
        );
        
        if (reviewButton) {
          console.log('✅ SUCCESS: Review button found!');
          reviewButton.style.border = '3px solid red';
          reviewButton.style.backgroundColor = 'yellow';
          console.log('🎯 Button highlighted');
        } else {
          console.log('❌ Review button still not found');
          console.log('🔍 All button texts after change:');
          buttonsAfter.forEach((btn, index) => {
            console.log(`   Button ${index}: "${btn.textContent?.trim()}"`);
          });
        }
      }, 1000);
      
    } catch (error) {
      console.log('⚠️ Could not trigger change detection:', error);
    }
    
  } else {
    console.log('❌ No Angular component with studio properties found');
    console.log('🔍 Let me check what Angular components are available...');
    
    // Try to find any Angular component
    const allElements = document.querySelectorAll('*');
    let angularComponents = 0;
    
    for (let element of allElements) {
      try {
        const component = ng.getComponent(element);
        if (component) {
          angularComponents++;
          console.log('   Found component:', component.constructor.name, 'on', element.tagName);
          if (angularComponents > 10) break; // Limit output
        }
      } catch (error) {
        // Continue
      }
    }
    
    console.log(`📊 Total Angular components found: ${angularComponents}`);
  }
})();