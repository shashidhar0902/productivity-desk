# HourlyUpdates

A lightweight notes app to track what you learn every hour, every day.

It runs as a single `index.html` file in your browser and stores data locally on your computer (browser localStorage).

## What This App Does

- Shows your current hour range (example: `6 AM - 7 AM`)
- Lets you add multiple learning points for each hour
- Stores notes date-wise and hour-wise
- Lets you browse previous days
- Supports search across all saved notes
- Exports a single day as Markdown (`.md`)
- Backs up all data as JSON (`.json`)
- Restores backup data with:
  - `Merge` (safe, recommended)
  - `Replace All` (overwrites current data)

## Quick Start

1. Open `index.html` in any modern browser (Chrome, Edge, Firefox).
2. Start typing what you learned in the current hour box.
3. Press `Enter` or click `+ Add`.
4. Expand any hour block to add more notes.

No installation required.

## Daily Usage

1. Open `index.html`.
2. Add notes in the current hour card at the top.
3. Add extra notes inside specific hour blocks if needed.
4. Use the date arrows to view previous days.
5. Use `Search` to find notes from any day.

## Data Storage

- Data is saved in your browser localStorage.
- Data key used by the app: `hourly_notes_v1`.
- If browser storage is cleared, local data can be lost.

That is why backup and restore are included.

## Backup and Restore (Important)

### Backup all data

1. Click `Backup` in the header.
2. A full backup file downloads, for example: `hourly-backup-2026-03-16.json`.
3. Save this file in a safe place (cloud drive, USB, etc.).

### Restore data

1. Click `Restore`.
2. Select your backup `.json` file.
3. Choose one option:

- `Merge (Recommended)`: adds backup notes to current notes without deleting existing data.
- `Replace All`: removes current data and replaces it completely with backup data.

## Suggested Backup Routine

- Daily: backup at end of day
- Weekly: keep one extra copy in cloud storage
- Before browser cleanup/update: take a backup first

## Keyboard Tips

- `Enter` in add-note input: quick add note
- `Enter` while editing a note: save changes
- `Escape` while editing a note: cancel edit

## Browser Compatibility

Tested best on latest:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox

## Troubleshooting

### Notes are not saving

- Check browser localStorage is enabled.
- Avoid private/incognito mode for long-term storage.

### Restore file is rejected

- Make sure it is a valid `.json` backup file from this app.
- Try opening the JSON to confirm it is not empty/corrupted.

### I lost my notes

- Use your latest backup file and restore.
- If no backup exists and localStorage was cleared, recovery is usually not possible.

## Project Structure

```text
HourlyUpdates/
  index.html
  README.md
```

## Improvement Ideas

- Installable PWA for offline desktop/mobile usage
- Hourly reminder notifications
- Weekly/monthly analytics dashboard
- Tag-based notes (`#python`, `#system-design`)
- Full import/export history snapshots

## License

Personal use. Add a license file if you plan to share publicly.
