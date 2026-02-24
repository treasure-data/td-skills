# Create a New Journey Version

Create a new draft version of an existing journey and apply changes.

`version create` clones the entire existing journey — you already have a complete YAML. Do NOT rebuild from scratch via the Build Process. Make targeted edits only, but refer to the Build Process templates (`templates/step1-criteria.yml`, etc.) for correct YAML syntax when adding or modifying steps, segments, or activations.

## Steps

### 1. Create a new draft version
```bash
tdx journey version create "<journey-name>" -y
```
Creates a draft version cloned from the current latest. Auto-named `"{name} vN+1"`.

### 2. Pull the draft and make targeted edits
```bash
tdx journey pull "<journey-name>"
```
The pulled YAML contains the new draft version only. Edit this single version — do NOT add multiple versions to one YAML file. `tdx journey version create` already created the new version on the server; you are just editing it.

### 3. Push changes
```bash
tdx journey push "<journey-name>" --dry-run   # preview
tdx journey push "<journey-name>"              # apply
```

### 4. Verify
```bash
tdx journey versions "<journey-name>"          # confirm new version listed
tdx journey version view "<journey-name>" --version <N>  # inspect details
```

The new version remains in **draft** state. The client launches it from the TD console when ready.
