# Deal Inactivity Badge Implementation

## Overview
Added a "No action for X days" indicator on deal cards, similar to Pipedrive's inactivity tracking.

## Files Modified/Created

### 1. **New Utility File**: `src/utils/dealInactivity.ts`
Contains two functions:
- `calculateInactivityDays(deal: Deal)`: Calculates days since last activity
  - Uses `modifiedDate` or `updatedDate` as last activity
  - Falls back to `createdDate` if no activity exists
  - Returns `null` if no dates available
  
- `formatInactivityBadge(days: number)`: Formats the badge text (e.g., "33d")

### 2. **Updated Component**: `src/components/pipeline/deal/dealItem.tsx`
- Imported utility functions
- Added inactivity calculation on component render
- Inserted badge JSX with Material-UI Tooltip
- Badge only shows when `inactivityDays > 0`

### 3. **Updated Styles**: `src/App.css`
Added `.deal-inactivity-badge` class:
- Positioned top-right (below the 3-dot menu)
- Subtle gray styling (not dominant)
- Small font size (10px)
- Minimal padding and border

## Design Decisions

### Positioning
- Placed at `top: 6px, right: 28px` to avoid overlapping the dropdown menu button
- Uses `position: absolute` within the card

### Styling (Theme-agnostic)
- Gray color scheme (`#666` text, `#f5f5f5` background)
- Uses spacing and size to indicate secondary importance
- No bright colors to avoid dominating the card

### Behavior
- Badge appears only when there's inactivity (days > 0)
- Tooltip shows on hover: "No actions for X day(s)"
- Does not affect card layout or height

## Technical Implementation

### Data Source
Uses existing Deal model fields:
- `modifiedDate` (primary)
- `updatedDate` (fallback)
- `createdDate` (final fallback)

### Calculation Logic
```typescript
const lastActivityDate = deal.modifiedDate || deal.updatedDate;
const referenceDate = lastActivityDate || deal.createdDate;
const diffDays = Math.floor((now - activityDate) / (1000 * 60 * 60 * 24));
```

### No Breaking Changes
- No API modifications required
- Uses existing data structure
- Purely UI enhancement
- Non-intrusive implementation

## Usage Example
When a deal has no activity for 33 days:
- Badge displays: `33d`
- Hover tooltip: "No actions for 33 days"

## Future Enhancements (Optional)
- Color coding based on threshold (e.g., red after 30 days)
- Configurable thresholds per pipeline
- Click to view last activity details
