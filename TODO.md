# Update ManPowerProjectTable.jsx to Match ProjectTable.jsx Display

## Pending Tasks

- [ ] Import FilterBar component and add it above the controls.
- [ ] Add state for filters (year: current year, rangeType: "monthly", month: null, from: "", to: ""), availableYears ([]), and filtering (false).
- [ ] Update fetchProjects to accept filterParams, build query string with year, range_type, month, from_date, to_date, and set availableYears from response.filters.available_years.
- [ ] Add handleFilterChange function to update filters state and call fetchProjects with API filters.
- [ ] Add useEffect to expose window.parentRefreshProjects for modal communication.
- [ ] Update actions renderer: Use flex wrapper, styled view button with SVG icon, hover effects matching ProjectTable (green theme), remove any edit functionality.
- [ ] Update HotTable configuration: Add manualColumnMove, rowHeights: 50, calculate dynamic height (Math.min(pageSize \* 50 + 50, window.innerHeight - 250)), ensure fixedColumnsLeft: 3.
- [ ] Remove openCreateModal and related create modal code since ManPower is view-only.
- [ ] Ensure renderers (dateRenderer, percentRenderer, statusRenderer) are consistent.
