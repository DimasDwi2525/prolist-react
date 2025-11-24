# TODO: Make UserTable, PackingListPage, and OutstandingProjectTable read-only with handsontableRenderers.js

## UserTable.jsx

- Remove inline editing (remove afterChange callback).
- Remove add (+) button or disable it.
- Remove or disable edit and delete action buttons in the Actions column.
- Replace existing custom renderers for Role and Department columns with imported handsontableRenderers.js renderers like textRenderer.
- Set all columns to readOnly, including the Actions column (remove button functions).
- Remove or disable modal form for creating/editing users.

## PackingListPage.jsx

- Remove Edit and Delete buttons in the Actions column or remove the Actions column entirely.
- Use handsontableRenderers.js renderers for columns:
  - textRenderer for text columns,
  - dateRenderer for date columns.
- Set all columns to readOnly.
- Remove or disable modal for creating/editing packing lists.
- Remove Add Packing List button.

## OutstandingProjectTable.jsx

- Keep the "PIC" column photo renderer but modify it to include the Upload Photo button below the photo inside the same cell.
- Remove the separate "Action" column (the one with the Upload button).
- Ensure the Upload Photo button calls the same upload logic as before.
- Keep merges and cell styling intact.
- Make the table read-only (remove editable callbacks if any).
- Remove search input box (optional, if you want fully read-only display).

## Common

- Import needed renderers from src/utils/handsontableRenderers.js in all 3 files.
- Use these renderers consistently for text, date, and other data in all tables.

## Testing

- Verify all tables render data correctly with handsontableRenderers.js renderers.
- Verify no inline editing or modal form for create/edit is possible.
- Verify Upload Photo button is shown below photo in OutstandingProjectTable.jsx and works as expected.
