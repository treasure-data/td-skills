# Create a New Journey Version

Create a new draft version of an existing journey and apply changes.

## How versioning works

- `version create` creates a new **draft** on the server, cloned from the current latest. The launched version is preserved.
- `pull` downloads a YAML with ALL versions in the `journeys` array. Each entry has `version`, `state`, and optionally `latest: true`.
- `push` updates ONLY the `latest: true` entry on the server. It does NOT create versions — it updates the existing draft in place.

You cannot skip `version create`. Without it, `push` would overwrite the launched version directly.

## Steps

### 1. Create draft on server
```bash
tdx journey version create "<journey-name>" -y
```

### 2. Pull and edit
```bash
tdx journey pull "<journey-name>"
```
The YAML contains a `journeys` array with all versions. Only edit the entry with `latest: true` (the new draft). Do NOT:
- Add or remove entries in the `journeys` array
- Modify `version`, `state`, or `latest` fields
- Rebuild from scratch — make targeted edits only

Refer to the Build Process templates (`templates/step1-criteria.yml`, etc.) for correct YAML syntax when adding or modifying steps, segments, or activations.

### 3. Preview

Call `preview_journey` with the YAML file path. Ask the client to verify the visual flow structure (stage names, branch paths, merge and end points) before pushing.

### 4. Push

```bash
tdx journey push "<journey-name>" --dry-run   # preview diff
tdx journey push "<journey-name>"              # apply to server
```

This updates the draft version only. The launched version is untouched.

### 5. Verify

```bash
tdx journey versions "<journey-name>"
tdx journey version view "<journey-name>" --version <N>
```

The new version remains in **draft** state. The client launches it from the TD console when ready.
