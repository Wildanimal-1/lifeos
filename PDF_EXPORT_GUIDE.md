# PDF Export Guide - LifeOS Demo Mode

## Overview
LifeOS provides two methods for generating PDF reports with demo screenshots for judges and evaluators.

## Method 1: Browser Print-to-PDF (Recommended for Screenshots)
**Best for: Complete reports with embedded images**

### Steps:
1. Run any command in LifeOS (e.g., "Plan my week")
2. Wait for execution to complete
3. Scroll down to see results and screenshots section
4. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)
5. Select "Save as PDF" as the printer destination
6. Click "Save"

### Features:
- ✅ Includes all screenshots embedded in the PDF
- ✅ Full-color graphics and images
- ✅ Execution plan and summary
- ✅ Email, calendar, and study summaries
- ✅ Complete audit log
- ✅ Demo Mode header with safety notice

### Output Path:
- Default: `~/Downloads/LifeOS.pdf` (or browser's download folder)

## Method 2: jsPDF Download Button
**Best for: Text-based reports without images**

### Steps:
1. Run any command in LifeOS
2. Click the "Download PDF Report" button (red button, top-right)
3. PDF automatically downloads as `lifeos-demo-report.pdf`

### Features:
- ✅ Execution plan and summary
- ✅ Email, calendar, and study summaries
- ✅ Complete audit log with timestamps
- ✅ Demo Mode safety notice
- ✅ Screenshot references (text-only)
- ❌ No embedded images (jsPDF limitation)

### Output Path:
- Default: `~/Downloads/lifeos-demo-report.pdf`

## Screenshot Assets

All screenshots are stored in `/public/screenshots/` and accessible via web browser:

| Filename | Description | URL |
|----------|-------------|-----|
| `dashboard-main.png` | Main dashboard interface | `/screenshots/dashboard-main.png` |
| `command-interface.png` | Natural language command input | `/screenshots/command-interface.png` |
| `calendar-management.png` | Calendar optimization view | `/screenshots/calendar-management.png` |
| `execution-results.png` | Complete execution results | `/screenshots/execution-results.png` |

## Demo Mode Safety Features

Both PDF methods include Demo Mode safety indicators:

1. **Header Notice**: "DEMO MODE - Safe for Judges | Mock Data Only"
2. **Audit Log Entry**: Shows demo mode enforcement
3. **Safety Notes**:
   - Uses mock data only
   - Auto-send forced to false
   - No outgoing messages to non-demo accounts
   - All actions logged transparently

## Public URL Access

When deployed, screenshots are accessible at:
```
https://your-domain.com/screenshots/dashboard-main.png
https://your-domain.com/screenshots/command-interface.png
https://your-domain.com/screenshots/calendar-management.png
https://your-domain.com/screenshots/execution-results.png
```

## Technical Notes

### Why Two Methods?

**jsPDF** is a JavaScript library that generates PDFs programmatically using text and vector graphics. It cannot embed PNG/JPG images without complex base64 encoding, which significantly increases PDF file size.

**Browser Print** uses the browser's native rendering engine, which can display images, custom fonts, and complex layouts before converting to PDF.

### Image Display in Web View

The screenshots section appears in the web interface after any command execution. If images fail to load, they gracefully hide without breaking the layout (using `onError` handler).

### Print Optimization

The screenshots section has the `no-print` class, which hides it during jsPDF generation but shows it during browser print. This prevents duplication in the audit log section.

## Recommendation for Judges

**Use Browser Print-to-PDF (Ctrl+P / Cmd+P)** for the most complete demo report with all visual examples embedded.

The generated PDF will include:
- Full execution results
- Visual screenshots of the interface
- Complete audit trail
- Demo Mode safety notices
- Timezone and configuration details

---

**Generated**: 2025-11-20
**LifeOS Version**: 2.1.0 (Demo Mode)
**Default Output**: `lifeos-demo-report.pdf`
