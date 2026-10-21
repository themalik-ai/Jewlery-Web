# SCARLET Acceptance Test Report

**Test date:** 20 October 2026  
**Build:** local production build (`npm run build`)  
**Browsers/viewports:** Chromium, 1280×800 / 1280×1400 desktop and 390×844 mobile  
**Backend suite:** isolated SQLite database on a separate test port (`npm run test:api`)

No reference video file was present, so visual comparison used the supplied written direction rather than frame-for-frame source footage. Screenshots are in `docs/screenshots/`.

| # | Acceptance criterion | Result | Evidence / notes |
|---:|---|:---:|---|
| 1 | Catalogue | **Pass** | Browser showed names, original images and PKR prices; API suite verified all 28 complete records. |
| 2 | Add charm | **Pass** | Clicking/tapping a card created a selected state, canvas node and correct live total. |
| 3 | Drag charm | **Pass** | Continuous pointer drag from catalogue to canvas added the intended product at the drop position. A synthetic `pointerType: touch` path at 390×844 also added the intended product. Native Pointer Events are used for mouse/touch/stylus. |
| 4 | Move charm | **Pass** | Dragged one existing instance from `t=0.500` to `t=0.362`; local state retained one instance with the same ID. Keyboard movement was also verified (`t=0.362` → `0.350`). |
| 5 | Remove charm | **Pass** | Quantity-minus removed one duplicate and immediately updated persistent design state and price. Canvas X, selected-panel delete and keyboard Delete share the same state operation. |
| 6 | Undo | **Pass** | Undo restored both a moved charm and a fully cleared 3-charm design. |
| 7 | Redo | **Pass** | Redo restored the undone move; obsolete redo is cleared by new committed changes in the store reducer. |
| 8 | Clear | **Pass** | Custom confirmation opened; confirming produced an empty design while Undo remained available. Cart state is separate. |
| 9 | Zoom | **Pass** | Zoom changed from 100% to 115%; all product IDs and normalised `t` positions were byte-for-byte unchanged. |
| 10 | Quantity | **Pass** | Plus created a second unique charm instance at the next open chain position; minus removed one; counts and totals changed correctly. |
| 11 | Price | **Pass** | Isolated API test created a direct-product + necklace order and asserted the exact database-derived subtotal, chain price, shipping and final total. |
| 12 | Cart persistence | **Pass** | Added a product, reloaded the route and observed the persisted line and header badge from versioned localStorage. |
| 13 | Design persistence | **Pass** | Design survived reload; checkout preserved instance IDs, product IDs and positions; API test parsed the saved order snapshot and asserted `t=0.55`. |
| 14 | Checkout | **Pass** | Required fields validate; a complete order was transactionally recorded and confirmation route loaded. Order tracking found it only with matching contact information. |
| 15 | Payment | **Pass** | COD order remained `unpaid`; bank transfer is labelled `pending`; confirmation explicitly states no online payment was processed. No fake provider response exists. |
| 16 | Mobile | **Pass** | 390×844 screenshots verified editor, wrapped/scrollable tools, two-column catalogue, floating help and fixed bottom navigation. `scrollWidth === clientWidth === 390` confirmed no page overflow. |
| 17 | Accessibility | **Pass** | Skip link, semantic headings, labels, focus rings, live toasts, dialog semantics and accessible button names were present in accessibility snapshots. Focused charm moved with ArrowLeft and supports Delete. |
| 18 | Administration | **Pass** | `/api/admin/stats` returned 401 without a token; valid bcrypt login issued JWT and loaded protected dashboard stats. Product/category/order/settings routes enforce roles. |
| 19 | Error handling | **Pass** | Catalogue/network error UI, product 404, client/server checkout errors, unavailable-product 409, wrong tracking contact 404, image fallback and upload validation are implemented. API suite exercised conflict and auth failures. |
| 20 | Regression | **Pass** | Strict TypeScript/Vite build passed after editor, catalogue, cart, order and admin tests. API suite re-seeds an isolated database and passed all 19 assertions. |

## API smoke output

`npm run test:api` passed 19 assertions covering:

- catalogue and category loading;
- product detail;
- order transaction;
- authoritative pricing;
- offline payment status;
- necklace configuration snapshot;
- idempotent retry;
- permitted/denied order tracking;
- unauthorised admin rejection;
- authenticated admin statistics;
- transactional inventory decrement;
- category administration;
- protected settings;
- unavailable-product conflict.

## Visual review

Checked and adjusted at comparable wide and narrow widths:

- ivory/blush/burgundy/gold palette;
- desktop header and mobile bottom bar;
- canvas border, chain curvature, empty state and charm scale;
- toolbar placement and checkout emphasis;
- catalogue density (six columns on wide builder, two on mobile);
- selected cards, quantity controls and running total;
- footer contrast and policy/demo labelling.

## Required pre-launch UAT

Although the Pointer Events touch path is exercised in Chromium, perform final physical-device UAT on representative iOS Safari and Android Chrome devices. Also replace all demo content, configure real contact details, complete legal/merchant review and connect a verified payment provider before any production sales claim.
