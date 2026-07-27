// Debug script to check why the instructor button isn't showing
// Copy and paste this into the browser console on the Denver Aikido Dojo page

(function debugInstructorButton() {
  console.log('🔍 Debugging instructor button visibility...');
  
  // Check if we're on the right page
  console.log('📍 Current URL:', window.location.href);
  console.log('📍 Should be on: /studio/studio_1');
  
  // Check localStorage settings
  console.log('🗄️ localStorage settings:');
  console.log('   instructor-test-mode:', localStorage.getItem('instructor-test-mode'));
  console.log('   instructor-studio-id:', localStorage.getItem('instructor-studio-id'));
  
  // Try to find the Angular component
  const studioElements = document.querySelectorAll('app-studio-page');
  console.log('🔍 Found studio page elements:', studioElements.length);
  
  if (studioElements.length > 0) {
    try {
      const component = ng.getComponent(studioElements[0]);
      console.log('📱 Component found:', !!component);
      
      if (component) {
        console.log('🔐 Component permission properties:');
        console.log('   canReviewRequests:', component.canReviewRequests);
        console.log('   isLoadingPermissions:', component.isLoadingPermissions);
        console.log('   pendingRequestCount:', component.pendingRequestCount);
        console.log('   currentUserId:', component.currentUserId);
        console.log('   studio:', component.studio);
        
        // Check if the button element exists in DOM
        const reviewButton = document.querySelector('ion-button[ng-reflect-disabled]');
        const allButtons = document.querySelectorAll('ion-button');
        console.log('🔘 Total buttons found:', allButtons.length);
        console.log('🔘 Review button found:', !!reviewButton);
        
        // Look for the specific button text
        const buttonWithText = Array.from(allButtons).find(btn => 
          btn.textContent && btn.textContent.includes('Review')
        );
        console.log('🔘 Button with "Review" text:', !!buttonWithText);
        
        // Try to manually set the permissions
        console.log('🔧 Attempting to manually enable permissions...');
        component.canReviewRequests = true;
        component.isLoadingPermissions = false;
        component.pendingRequestCount = 3;
        
        // Trigger change detection
        try {
          const injector = ng.getInjector(studioElements[0]);
          const cdr = injector.get(ng.core.ChangeDetectorRef);
          cdr.detectChanges();
          console.log('✅ Change detection triggered');
        } catch (error) {
          console.log('⚠️ Could not trigger change detection:', error.message);
        }
        
        // Check again after manual changes
        setTimeout(() => {
          const buttonAfter = Array.from(document.querySelectorAll('ion-button')).find(btn => 
            btn.textContent && btn.textContent.includes('Review')
          );
          console.log('🔘 Button visible after manual changes:', !!buttonAfter);
          
          if (buttonAfter) {
            console.log('✅ SUCCESS: Button is now visible!');
            buttonAfter.style.border = '2px solid red';
            buttonAfter.style.backgroundColor = 'yellow';
            console.log('🎯 Button highlighted with red border and yellow background');
          } else {
            console.log('❌ Button still not visible. Checking template conditions...');
            
            // Check if the *ngIf conditions are met
            console.log('📋 Template condition check:');
            console.log('   canReviewRequests && !isLoadingPermissions =', 
              component.canReviewRequests && !component.isLoadingPermissions);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error accessing component:', error);
    }
  } else {
    console.log('❌ No studio page elements found. Make sure you are on the studio page.');
  }
})();