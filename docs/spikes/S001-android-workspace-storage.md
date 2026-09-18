# S001 — Android Workspace Storage

- Status: In progress — hybrid model implemented as validation hypothesis
- Updated: 2026-09-17
- Feature: `specs/003-android-workspace-storage/`

## Question

How should Daily Cockpit expose a durable project workspace on Android while preserving local-first semantics and safe Git/file access?

## Evidence accumulated

### Desktop parity is invalid

The official Tauri dialog plugin does not provide Android folder-picking semantics equivalent to the desktop directory picker. Wave 2 therefore remains evidence for the capability boundary, not for the Android storage representation.

### Android SAF source semantics

Android Storage Access Framework exposes a user-selected document tree as a `content://` URI. The application accesses that tree through Android document/content APIs rather than treating it as a normal filesystem path.

`ACTION_OPEN_DOCUMENT_TREE` can grant read/write access to a selected tree. When the returned grant includes persistable permission flags, the app can call `takePersistableUriPermission` so the authorization can survive normal process/app restarts and device reboot while the grant and target remain valid.

Android 11+ also restricts which roots can be selected. Daily Cockpit therefore must not require whole-volume/root access or bypass SAF with broad storage authority.

### Git/filesystem impedance mismatch

The existing Daily Cockpit `git2` adapter operates on real filesystem paths. A SAF `content://` tree URI is not a filesystem path and must never be sent to `GitService` as one.

This creates two distinct concepts:

```text
Android source reference
  content:// URI + persisted grant

Android operational working copy
  app-owned filesystem directory
```

### App lifecycle

App-specific files provide normal filesystem behavior for native libraries, but Android removes app-specific data when the application is uninstalled. Therefore app-owned storage is suitable as a derived working copy, not as the only representation of user project data expected to outlive the app.

After reinstall, Daily Cockpit must treat workspace authorization as new: the user reconnects/selects the external source and the app rematerializes its working copy.

## Candidate evaluation

### A — Direct SAF document tree

```text
Android document tree
        ↓
content:// URI
        ↓
persistable permission
        ↓
ContentResolver / document APIs
```

**Result:** retained as the user-controlled source reference, rejected as the sole working representation for the current Git-backed slice because `git2` requires a filesystem path.

### B — App-owned workspace only

```text
import
  ↓
app private storage
  ↓
WorkspaceService / GitService
```

**Result:** retained as the operational filesystem representation, rejected as the sole durable user-project representation because it is deleted on uninstall and would make recovery/export semantics mandatory for data durability.

### C — Hybrid source + materialized working copy

```text
SAF document tree
        ↓
content:// URI + persisted grant
        ↓
explicit materialization / refresh
        ↓
app-owned working copy
        ↓
WorkspaceService + GitService
```

**Current hypothesis:** selected for implementation and validation.

The external SAF tree remains the source/provenance reference. The app-owned working copy is derived operational state used for scoped filesystem reads and Git. Daily Cockpit does not claim that the two are the same representation and does not implement implicit bidirectional synchronization in this wave.

## Implementation evidence on feature branch

Branch: `feat/android-workspace-storage-s001`

Implemented so far:

- independent Spec Kit `003-android-workspace-storage`;
- internal Tauri mobile plugin for Android workspace access;
- `ACTION_OPEN_DOCUMENT_TREE` picker;
- persisted read/write URI permission capture through `takePersistableUriPermission`;
- source URI persistence in app state;
- source-access recovery states (`not-configured`, `permission-lost`, `source-missing`);
- bounded recursive materialization into app-owned storage;
- staging/rename activation of refreshed working copies;
- path/name validation before writes into the working copy;
- `.git` materialized for Git while remaining hidden by normal `WorkspaceService` listing;
- explicit workspace metadata distinguishing `filesystem` from `android-materialized`;
- renderer runtime detection, Android open/import and startup restore path;
- no generic Android intent, `ContentResolver`, shell or filesystem authority exposed to the renderer;
- Git mutations remain unavailable.

## Evidence still required

S001 is **not complete** yet. Required remaining validation:

- renderer/native CI on the implementation HEAD;
- Android target build/cross-compilation with the current `git2` configuration;
- real SAF import on emulator;
- persisted access after app restart;
- repository detection/status/diff against a materialized repository;
- device-reboot behavior;
- permission-revocation/source-missing recovery;
- at least one physical-device workflow;
- performance/ergonomics notes for a non-toy repository;
- symlink/provider edge-case observations sufficient to define later write/sync work.

## Exit criterion

S001 is complete only when the selected Android workspace model supports real open/import, scoped list/read, restart persistence, documented reboot/reinstall recovery and demonstrated Git viability (or a reproducible Git-engine blocker) with emulator and physical-device evidence.

Until those gates are closed, the hybrid model remains the implementation hypothesis rather than a frozen cross-platform storage decision.
