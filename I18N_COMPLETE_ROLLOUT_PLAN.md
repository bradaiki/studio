# Complete i18n Rollout Plan

## Status Overview

### ✅ Already Completed (9 files)
1. Tabs Page
2. Arts Page (list)
3. Art Page (detail) 
4. Profile Page
5. Studios Page (list)
6. Events Page (list)
7. People Page (list)
8. Feed Page
9. App Component

### 🔄 Remaining Files (17 files)

#### Detail Pages (4 files) - HIGH PRIORITY
1. **studio.page.html** - Studio detail page
2. **event.page.html** - Event detail page  
3. **person.page.html** - Person detail page
4. **org.page.html** - Organization detail page

#### Components (7 files) - MEDIUM PRIORITY
5. **studio.component.html** - Studio card component
6. **event.component.html** - Event card component
7. **person.component.html** - Person card component
8. **organization.component.html** - Organization card component
9. **post.component.html** - Post/feed item component
10. **art-studio.component.html** - Art-studio relationship component
11. **user-profile.component.html** - User profile component

#### Forms (3 files) - LOW PRIORITY
12. **art-form.page.html** - Create/edit art form
13. **studio-form.page.html** - Create/edit studio form
14. **org-form.page.html** - Create/edit organization form

#### Other Pages (3 files) - LOW PRIORITY
15. **auth/login.page.html** - Login page
16. **orgs.page.html** - Organizations list page (if different from events)
17. **explore-container.component.html** - Explore container

## Implementation Strategy

### Phase 1: Detail Pages (Current Priority)
These pages show detailed information and have the most user-facing text.

**Estimated Keys per Page:** 15-25 keys
**Total Estimated Keys:** 60-100 keys

### Phase 2: Components
These are reusable components that appear throughout the app.

**Estimated Keys per Component:** 10-20 keys
**Total Estimated Keys:** 70-140 keys

### Phase 3: Forms
Form labels, placeholders, validation messages, and help text.

**Estimated Keys per Form:** 20-30 keys
**Total Estimated Keys:** 60-90 keys

### Phase 4: Other Pages
Remaining pages and utility components.

**Estimated Keys:** 20-40 keys

## Total Estimated Work
- **Files to Update:** 17 HTML templates + 17 TypeScript files = 34 files
- **Translation Keys to Add:** 210-370 keys × 3 languages = 630-1110 translation entries
- **Estimated Time:** 4-6 hours for complete implementation

## Approach

For each file:
1. Read HTML template
2. Identify all hardcoded text
3. Replace with translation pipes
4. Add TranslateModule to TypeScript component
5. Add translation keys to en.json, es.json, ja.json
6. Verify diagnostics pass

## Translation Key Naming Convention

```
[page/component]_detail.[section].[element]
```

Examples:
- `studio_detail.title`
- `studio_detail.not_found`
- `studio_detail.back_button`
- `event_detail.register_button`
- `person_detail.follow_button`

## Priority Order

1. studio.page.html (most complex detail page)
2. event.page.html (already partially done in events list)
3. person.page.html (social features)
4. org.page.html (organizational info)
5. Components (reusable across app)
6. Forms (create/edit functionality)
7. Other pages (utility/auth)

