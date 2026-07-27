# Chat Page Scroll Fix - Requirements

## Problem Statement
When chat messages load in the studio page, the entire page scrolls to the bottom instead of just the chat message container scrolling. This has been attempted multiple times without success.

## Root Cause Analysis
After analyzing the CSS and HTML structure, the issue is caused by:

1. **Sticky Input Container**: The `.message-input-container` has `position: sticky` with `bottom: 0`, which causes the browser to scroll the entire page to keep it in view when messages render
2. **Viewport-based Heights**: The `.chat-content` uses `max-height: calc(100vh - 200px)` which ties the chat to the viewport, causing page-level scrolling
3. **Browser Auto-scroll Behavior**: When new DOM elements render (the message list), the browser automatically scrolls to keep focused/sticky elements in view

## User Stories

### 1. Page Should Not Scroll When Chat Loads
**As a** user viewing the studio page  
**I want** the page to stay at the top when a chat loads  
**So that** I can see the studio information without being forced to scroll back up

**Acceptance Criteria:**
- When a chat loads, the main page scroll position remains unchanged
- The page does NOT automatically scroll to the bottom
- The studio hero image and information remain visible
- Only the chat message container scrolls internally

### 2. Chat Messages Should Scroll to Show Recent Messages
**As a** user viewing a chat  
**I want** the chat message list to automatically scroll to show the most recent messages  
**So that** I can see the latest conversation without manually scrolling

**Acceptance Criteria:**
- The `.messages-container` div scrolls to show the most recent messages
- The scroll happens within the chat component only
- The page itself does not scroll
- Older messages can be accessed by scrolling up within the chat container

### 3. Chat Input Should Remain Accessible
**As a** user interacting with a chat  
**I want** the message input field to always be visible at the bottom of the chat  
**So that** I can easily send messages

**Acceptance Criteria:**
- The message input remains at the bottom of the chat component
- The input does not cause page scrolling when it renders
- The input is always accessible without scrolling the page

## Technical Requirements

### CSS Changes Required

1. **Remove Sticky Positioning from Input**
   - Change `.message-input-container` from `position: sticky` to `position: relative` or static
   - Remove `bottom: 0` and `z-index: 10` properties
   - Use flexbox to keep input at bottom instead

2. **Fix Container Heights**
   - Remove viewport-based heights (`calc(100vh - 200px)`)
   - Use fixed pixel heights or percentage-based heights relative to parent
   - Ensure `.messages-container` has `overflow-y: auto` and a defined height

3. **Add Scroll Prevention**
   - Add `overflow-anchor: none` to prevent scroll anchoring
   - Add `scroll-behavior: auto` to prevent smooth scrolling that might trigger page scroll
   - Ensure parent containers don't have `overflow: visible`

4. **Isolate Chat Component**
   - Add `contain: layout style paint` to `.chat-sidebar` (already done)
   - Ensure chat component is self-contained and doesn't affect page layout

### TypeScript Changes Required

1. **Update scrollToBottom() Method**
   - Ensure it only targets `.messages-container`
   - Use `scrollTop` instead of `scrollTo()` or `scrollIntoView()`
   - Add guards to prevent execution during initial render

2. **Add Initial Render Flag**
   - Track when component is initially loading
   - Prevent any scroll operations during first render
   - Allow scroll after messages are fully rendered and positioned

## Success Criteria

1. ✅ Page does NOT scroll when chat loads
2. ✅ Page does NOT scroll when switching between chats
3. ✅ Page does NOT scroll when messages render
4. ✅ Chat message list DOES scroll to show recent messages
5. ✅ Message input remains visible and accessible
6. ✅ No console errors or warnings
7. ✅ Works on both desktop and mobile viewports

## Out of Scope

- Changing the overall layout of the studio page
- Modifying chat functionality beyond scroll behavior
- Adding new features to the chat component
- Performance optimizations unrelated to scrolling

## Dependencies

- Angular change detection cycle
- Ionic framework components
- Browser scroll behavior
- CSS flexbox and grid layout

## Testing Strategy

1. **Manual Testing**
   - Load studio page and verify page stays at top
   - Switch between chats and verify no page scroll
   - Send messages and verify only chat scrolls
   - Test on different screen sizes

2. **Browser Testing**
   - Test in Chrome, Firefox, Safari
   - Test on mobile devices
   - Test with different viewport sizes

3. **Edge Cases**
   - Very long messages
   - Many messages loading at once
   - Rapid chat switching
   - Slow network conditions
