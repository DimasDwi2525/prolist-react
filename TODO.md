# TODO: Add Work Order Event Listeners and Update Notification Types

## Tasks

- [x] Add state variables for shownWorkOrderCreatedIds and shownWorkOrderUpdatedIds in MainLayout.jsx
- [x] Add Echo listeners for 'workorder.created' and 'workorder.updated' channels in MainLayout.jsx
- [x] Update cleanup in MainLayout.jsx to stop listening to new work order events
- [x] Update notification type checks in NotificationDropdown.jsx to handle "work_order_created" and "work_order_updated"
- [x] Test notifications by triggering work order creation/update events
