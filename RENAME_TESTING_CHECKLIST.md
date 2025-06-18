# Rename Functionality Testing Checklist

## Pre-Testing Setup

- [ ] Application is running (`npm run dev`)
- [ ] Electron window is open and functional
- [ ] File explorer is visible with some test files/folders

## Basic Rename Testing

### Context Menu Rename

- [ ] Right-click on a file
- [ ] Verify "Rename" option appears in context menu
- [ ] Click "Rename" option
- [ ] Verify multi-step dialog opens (not old HTML dialog)
- [ ] Verify current filename is pre-filled in input
- [ ] Verify dialog title shows "Rename File"
- [ ] Change filename to a new valid name
- [ ] Click "Complete" or press Enter
- [ ] Verify file is renamed successfully
- [ ] Verify toast notification appears

### Folder Rename via Context Menu

- [ ] Right-click on a folder
- [ ] Click "Rename" option
- [ ] Verify dialog title shows "Rename Folder"
- [ ] Rename folder to a new valid name
- [ ] Verify folder is renamed successfully

### Command Palette Rename

- [ ] Select a file by clicking on it
- [ ] Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
- [ ] Type "rename" in command palette
- [ ] Verify "Rename Selected Item" command appears
- [ ] Verify description shows the selected file name
- [ ] Press Enter or click the command
- [ ] Verify rename dialog opens
- [ ] Complete the rename operation
- [ ] Verify file is renamed successfully

## Validation Testing

### Required Field Validation

- [ ] Open rename dialog
- [ ] Clear the input field (make it empty)
- [ ] Verify error message appears: "File name is required" or "Folder name is required"
- [ ] Verify "Complete" button is disabled or shows validation error
- [ ] Enter a valid name
- [ ] Verify error message disappears

### Character Restriction Validation

- [ ] Open rename dialog
- [ ] Enter a name with forward slash: `test/file`
- [ ] Verify error message: "File name cannot contain slashes"
- [ ] Enter a name with backslash: `test\file`
- [ ] Verify error message appears
- [ ] Remove invalid characters
- [ ] Verify error message disappears

### Length Validation

- [ ] Open rename dialog
- [ ] Enter a very long name (over 255 characters)
- [ ] Verify error message: "File name is too long"
- [ ] Reduce length to under 255 characters
- [ ] Verify error message disappears

### Duplicate Name Validation

- [ ] Create two test files: `test1.txt` and `test2.txt`
- [ ] Try to rename `test1.txt` to `test2.txt`
- [ ] Verify error message: "A file with this name already exists"
- [ ] Try to rename to a unique name
- [ ] Verify rename succeeds

### Same Name "Rename"

- [ ] Open rename dialog for a file
- [ ] Keep the same name (don't change anything)
- [ ] Complete the rename
- [ ] Verify operation completes without error (no-op)

## Error Handling Testing

### File System Errors

- [ ] Try to rename a file that doesn't exist (if possible)
- [ ] Verify appropriate error toast appears
- [ ] Try to rename to an invalid system name (like `CON` on Windows)
- [ ] Verify error handling works

### Cancellation Testing

- [ ] Open rename dialog
- [ ] Press Escape key
- [ ] Verify dialog closes without making changes
- [ ] Open rename dialog again
- [ ] Click outside dialog or close button
- [ ] Verify dialog closes without making changes

## Keyboard Navigation Testing

### Dialog Navigation

- [ ] Open rename dialog
- [ ] Verify input field is automatically focused
- [ ] Verify current name is selected (for easy replacement)
- [ ] Press Tab to navigate through dialog elements
- [ ] Verify proper focus management
- [ ] Press Enter with valid input
- [ ] Verify rename completes

### Command Palette Navigation

- [ ] Press `Ctrl+Shift+P`
- [ ] Use arrow keys to navigate to "Rename Selected Item"
- [ ] Press Enter to execute
- [ ] Verify rename dialog opens

## Multi-Selection Testing

### No Selection

- [ ] Clear all selections (click empty space)
- [ ] Open command palette
- [ ] Find "Rename Selected Item" command
- [ ] Verify description shows "Select a file or folder to rename"
- [ ] Verify command doesn't execute harmful action when no selection

### Multiple Selection

- [ ] Select multiple files (Ctrl+click)
- [ ] Open command palette
- [ ] Find "Rename Selected Item" command
- [ ] Verify description shows "Select only one item to rename"
- [ ] Verify command provides helpful feedback

## UI/UX Testing

### Visual Consistency

- [ ] Verify rename dialog matches other multi-step dialogs in style
- [ ] Verify icons are consistent (Edit3 icon for rename)
- [ ] Verify color scheme matches application theme
- [ ] Verify typography and spacing are consistent

### Responsive Design

- [ ] Test rename dialog on different window sizes
- [ ] Verify dialog remains usable and well-positioned
- [ ] Verify text doesn't overflow or get cut off

### Theme Compatibility

- [ ] Test rename functionality in light theme
- [ ] Test rename functionality in dark theme
- [ ] Verify all text is readable in both themes
- [ ] Verify validation errors are visible in both themes

## Integration Testing

### File System Integration

- [ ] Verify renamed files appear correctly in OS file explorer
- [ ] Verify renamed folders appear correctly in OS file explorer
- [ ] Verify file extensions are preserved
- [ ] Verify file contents remain unchanged after rename

### Application State Consistency

- [ ] Rename a file
- [ ] Verify file explorer updates immediately
- [ ] Verify any open terminals show correct paths
- [ ] Verify breadcrumb navigation updates if applicable

### Refresh and Persistence

- [ ] Rename a file
- [ ] Refresh the directory view
- [ ] Verify renamed file persists correctly
- [ ] Navigate away and back to directory
- [ ] Verify rename persisted correctly

## Performance Testing

### Large Files

- [ ] Test renaming very large files
- [ ] Verify operation completes in reasonable time
- [ ] Verify UI remains responsive during operation

### Many Files

- [ ] Test rename in directory with many files
- [ ] Verify duplicate detection works efficiently
- [ ] Verify UI remains responsive

## Success Criteria

✅ **All basic rename operations work correctly**
✅ **All validation rules are enforced properly**
✅ **Error handling is comprehensive and user-friendly**
✅ **Keyboard navigation is fully functional**
✅ **UI is consistent with application design**
✅ **Integration with file system works correctly**
✅ **Performance is acceptable for typical use cases**

## Notes Section

_Use this space to record any issues found during testing_

---

**Testing Date:** ****\_\_\_****
**Tested By:** ****\_\_\_****
**Application Version:** ****\_\_\_****
**Operating System:** ****\_\_\_****

## Issues Found

_Record any bugs or issues discovered during testing_

| Issue | Severity | Description | Status |
| ----- | -------- | ----------- | ------ |
|       |          |             |        |

## Recommendations

_Any suggestions for improvements or enhancements_
