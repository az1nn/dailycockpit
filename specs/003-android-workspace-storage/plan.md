# Implementation Plan: Android Workspace Storage

## Technical context

- Renderer: React + TypeScript + Vite
- Native shell: Tauri 2.x
- Existing desktop boundary: Rust `WorkspaceService`/`GitService` commands
- Existing native Git engine: `git2` 0.21.x, read-only slice
- Android source access: Storage Access Framework document tree / `content://` URI
- Android working representation candidate: app-owned filesystem materialization
- Canonical user project data: user-selected document tree / explicit import-export source
- Android working copy: derived operational copy, never the only representation of user data expected to outlive the app

## Evidence incorporated before implementation

- Android Storage Access Framework exposes user-selected directory trees as `content://` URIs and grants access through `ContentResolver`, not as ordinary filesystem paths.
- `ACTION_OPEN_DOCUMENT_TREE` supports persisted read/write URI grants through `takePersistableUriPermission`, allowing access to survive process/app restarts and device reboots while the grant and target remain valid.
- Android 11+ restricts selection of several storage roots, so the product cannot assume arbitrary whole-volume access.
- App-specific storage is a real filesystem suitable for native libraries, but its files are removed when the app is uninstalled.
- Tauri mobile plugins provide the supported bridge from Rust to Android/Kotlin platform APIs.
- Existing `git2` operates over filesystem paths, so a document-tree URI must not be handed directly to the Git adapter.

## Constitution check

- Project is unit of interaction: PASS — Android activation still produces one active `ProjectContext`.
- Local-first canonical data: PASS — no hosted backend is introduced; external project source remains user-controlled.
- Explicit mutation boundary: PASS — this wave adds storage import/materialization only; Git/product mutations remain unavailable.
- Ports before implementations: PASS — renderer continues through `WorkspaceService` and `GitService`.
- Spec-driven delivery: PASS — Spec Kit 003 is independent from #002.
- Mobile-first, not mobile-identical: PASS — Android uses SAF semantics instead of desktop directory-picker semantics.
- Reversible AI actions: N/A — no AI action is introduced.

## Architecture decision under S001

Use a hybrid representation for the first Android vertical slice:

```text
Android system document tree
        |
        |  content:// tree URI
        |  persistable read/write grant
        v
AndroidWorkspaceSource
        |
        | import / refresh
        v
App-owned materialized working copy
        |
        +--> WorkspaceService list/read
        |
        `--> GitService (filesystem path only)
```

The SAF tree is the durable user-controlled source reference. The app-owned working copy is operational/derived state used where a filesystem path is required. The working copy must never be presented as though it were the external source itself.

## Boundary model

Evolve workspace metadata so platform representation is explicit:

```text
WorkspaceMetadata
  id
  name
  kind: filesystem | android-materialized
  root              # actual native working root, not a content URI
  sourceUri?        # Android source reference only
  accessState?      # available | permission-lost | source-missing
  isGitRepository
```

Renderer operations continue to pass the opaque/native working `root` only to typed native commands. The UI may display source provenance separately; it must not parse or mutate native locators.

## Android native adapter

Implement a narrow Tauri mobile plugin / platform adapter with commands for:

```text
pick_android_workspace_source()
restore_android_workspace_source()
materialize_android_workspace(sourceUri)
inspect_android_workspace_access(sourceUri)
```

Responsibilities:

1. Launch `ACTION_OPEN_DOCUMENT_TREE`.
2. Request persistable read/write URI permission using the flags returned by Android.
3. Persist only the minimum source descriptor needed to restore the project.
4. Copy the selected tree into an app-owned working directory using `ContentResolver`/document APIs.
5. Never expose unrestricted `ContentResolver`, arbitrary Android intents or a generic filesystem API to the renderer.
6. Reject/skip unsupported virtual or provider-specific entries with explicit diagnostics rather than fabricating files.

## Materialization rules

- Working copy directory is controlled by the app and uniquely associated with the selected source descriptor.
- `.git` is copied as repository metadata but remains hidden from normal workspace listing.
- Relative paths are validated before creation in the working copy.
- Files are copied through bounded streaming; no whole-tree byte buffering.
- Refresh replaces/updates derived working state explicitly; this PR does not implement automatic bidirectional synchronization.
- Writes back to the external SAF source are outside this wave except where required to prove access semantics; product mutations remain approval-gated.

## Git strategy

`git2` continues to receive only an actual app-owned filesystem path. S001 will record whether Android build/runtime support for the current `git2` configuration succeeds. If cross-compilation/runtime fails, the result is evidence for a future `gix` or alternate Git adapter decision rather than a reason to reinterpret `content://` as a path.

## Lifecycle semantics

### App restart

Persist source descriptor + working-copy identity in app state; restore source grant and reuse/refresh the working copy.

### Device reboot

Persisted URI permission is expected to remain valid; validate this on emulator/device before closing S001.

### Source moved/deleted or grant revoked

Mark access unavailable and require explicit user recovery/reselection. Do not silently continue against stale derived state as canonical data.

### Uninstall/reinstall

App-owned working copy is deleted with the app. External SAF source data remains outside app-specific storage, but the app must treat reinstall as a new authorization lifecycle and ask the user to reconnect/import the source again.

## Delivery sequence

1. Create Spec Kit 003 and update S001 with sourced platform constraints.
2. Introduce explicit cross-platform workspace representation without breaking desktop behavior.
3. Add Android mobile bridge for SAF tree selection and persistable permission capture.
4. Add app-owned materialization with scoped path validation and bounded copy behavior.
5. Wire Android open/restore into `WorkspaceService` while keeping desktop picker path unchanged.
6. Reuse existing scoped workspace list/read on the materialized working root.
7. Test Git repository detection/status viability on the materialized root.
8. Add unit/integration tests for workspace-reference and materialization invariants.
9. Add Android build/emulator validation where CI/environment permits.
10. Record physical-device validation separately; keep PR non-ready until it exists.
11. Run convergence and close S001 only when the evidence gates are satisfied.
