# Project Info Updates

Quick guide for updating the project info dialog content.

## Updating the Changelog

```bash
npm run changelog:add
```

- Prompts for date (defaults to today)
- Select change type (feature, improvement, bugfix, etc.)
- Enter single-line title
- Automatically updates `public/changelog.yaml`

## Updating Contributors

```bash
npm run analyze-commits
```

- Scans git repositories for commit data
- Generates `git-commit-analysis.json`
- Updates contributor avatars and stats in project info dialog

## Updating Project Links

- Edit `links-section.tsx` directly
- Modify the `projectLinks` array
- Add/remove/update links with title, icon, and URL
- Links automatically appear as pills in the dialog

## Manual Editing

- **Changelog**: Edit `public/changelog.yaml` directly if needed
- **Contributors**: Manually edit `git-commit-analysis.json` if necessary
- **Links**: Edit the `projectLinks` array in `links-section.tsx`
