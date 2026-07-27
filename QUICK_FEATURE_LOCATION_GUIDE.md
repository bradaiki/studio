# Quick Feature Location Guide

## 🎯 Where to Find Key Features

### Data Source Toggle & Database Seeding

**Location:** Profile/Settings Page → Developer Settings Card

**How to get there:**
1. Click the ⚙️ **Settings icon** in the top-right corner of the app
2. Scroll down to the **"Developer Settings"** card
3. You'll see both features in this card

---

## 📱 Visual Layout

```
┌─────────────────────────────────────────────────┐
│  Profile / Settings Page                        │
│                                                 │
│  [User Profile Info]                            │
│  [Community Profile]                            │
│  [Arts You Practice]                            │
│  [Notification Preferences]                     │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  🔧 Developer Settings                    │ │
│  ├───────────────────────────────────────────┤ │
│  │                                           │ │
│  │  📱/☁️ Data Source                        │ │
│  │  Using local mock data / database         │ │
│  │  [Switch to Database / Mock] ←── TOGGLE  │ │
│  │                                           │ │
│  │  ─────────────────────────────────────    │ │
│  │                                           │ │
│  │  ☁️ Seed Database                         │ │
│  │  Populate database with sample data       │ │
│  │  [Seed Now] ←────────────────── BUTTON   │ │
│  │                                           │ │
│  │  ℹ️ Info:                                 │ │
│  │  Mock Mode: Uses local data               │ │
│  │  Database Mode: Uses AWS DynamoDB         │ │
│  │                                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Visual Indicators

### When in Mock Mode:
```
┌─────────────────────────────────────────────────┐
│  Aiki - @yourhandle  [📱 MOCK MODE] ⚙️ 🚪      │ ← Yellow badge
├─────────────────────────────────────────────────┤
│                                                 │
│  [Your content here]                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### When in Database Mode:
```
┌─────────────────────────────────────────────────┐
│  Aiki - @yourhandle                    ⚙️ 🚪   │ ← No badge
├─────────────────────────────────────────────────┤
│                                                 │
│  [Your content here]                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Quick Actions

### To Switch Data Modes:
```
Settings (⚙️) → Developer Settings → Data Source → [Switch Button]
```

### To Seed Database:
```
Settings (⚙️) → Developer Settings → Seed Database → [Seed Now]
```

---

## 📂 File Reference (for developers)

| Feature | Service File | UI File |
|---------|-------------|---------|
| Data Source Toggle | `src/app/services/data-source.service.ts` | `src/app/profile/profile.page.html` (line 704) |
| Database Seeding | `src/app/services/data-seeding.service.ts` | `src/app/profile/profile.page.html` (line 720) |
| Mock Mode Badge | - | `src/app/tabs/tabs.page.html` (line 5) |

---

## ✅ Status: All Features Working

Both features are **fully functional** and **unchanged** after the Angular/Ionic/Capacitor upgrade.

For detailed information, see: `DATA_SOURCE_AND_SEEDING_LOCATION.md`
