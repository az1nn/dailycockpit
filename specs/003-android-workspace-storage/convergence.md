# Convergence: Android Workspace Storage

**Feature**: `003-android-workspace-storage`  
**Branch**: `feat/android-workspace-storage-s001`  
**Status**: In progress — implementation present; Android runtime/device gates remain open

## Scope convergence

The implementation remains within the intended wave:

- Android workspace architecture and S001 only;
- no SecretStore or API-key work;
- no OpenAI/agent-provider integration;
- no GitHub OAuth/remote Git;
- no commit/push/merge/reset/patch mutation;
- no calendar or unrelated notes work.

## Architecture convergence

### ProjectContext remains the product unit

PASS at implementation level. Android workspace activation still creates one active `ProjectContext`; platform-specific source identity is metadata on that context rather than a parallel product model.

### Local-first remains canonical

PASS at implementation level. The selected SAF document tree remains the external user-controlled source reference. The app-owned filesystem tree is explicitly modeled as a materialized working copy and is not presented as the durable external source.

### Ports before implementations

PASS at implementation level. The renderer continues to use `WorkspaceService` and `GitService`. Android SAF/`ContentResolver` authority is kept in an internal native plugin and is not exposed as a generic guest API.

### No generic shell/filesystem authority in renderer

PASS at implementation level. New renderer-visible commands are narrow workspace operations (`workspace_runtime`, Android open/restore) and existing scoped list/read commands. There is no arbitrary Android Intent, shell, `ContentResolver`, or unrestricted filesystem bridge.

### Git mutation boundary

PASS. Existing commit/push/merge/reset/apply-patch restrictions remain unchanged.

### Mobile-first, not mobile-identical

PASS at implementation level. Desktop continues to use a filesystem directory picker/path; Android uses SAF source identity plus an app-owned materialized filesystem working copy.

## Spec convergence

### Android source is not a fake desktop path

PASS at implementation level.

- `content://` is stored as `sourceUri` provenance/access metadata.
- `WorkspaceMetadata.root` for an Android project is the actual app-owned filesystem working root.
- `GitService` receives only the filesystem working root.

### Persistable access model

IMPLEMENTED, runtime validation pending.

- picker requests `ACTION_OPEN_DOCUMENT_TREE`;
- returned read/write flags are persisted through `takePersistableUriPermission`;
- selected source URI is stored in app-private preferences;
- restore explicitly reports `not-configured`, `permission-lost`, or `source-missing`.

Required remaining evidence: successful restore after actual Android app restart and device reboot.

### Real workspace list/read

IMPLEMENTED against the materialized working root; Android runtime validation pending.

Existing native scoping still provides:

- canonical root/path validation;
- path-escape protection;
- `.git` hidden from normal listing;
- UTF-8 text-only preview;
- 1 MiB preview limit.

### Materialization safety

IMPLEMENTED, provider/device edge-case evidence pending.

- bounded recursive traversal (50,000-entry safety ceiling);
- stream-based file copy;
- unsafe display names rejected;
- canonical target checked against the staging root;
- staging directory is activated through rename/rotation;
- `.git` is retained for Git but not exposed as a normal workspace entry.

### Project identity

PASS at implementation/test level. The visible Android project name is carried from the selected SAF tree and is not derived from the hashed app-owned working directory. A Rust unit test protects this invariant.

## Validation matrix

| Gate | Current evidence | Status |
|---|---|---|
| Renderer typecheck/build | CI has passed on implementation snapshots; current-head result must remain green | In progress |
| Rust host unit/integration tests | CI has passed with the mobile plugin in the dependency graph; current-head result must remain green | In progress |
| Android SDK/NDK setup | CI setup issue identified (`tools` package obsolete) and corrected; current run reaches Android build | Passing infrastructure step |
| Android arm64 APK build | Current CI executes `tauri android build --debug --apk --target aarch64` | Pending final result |
| Current `git2` Android cross-compilation | Proven only if the Android arm64 build passes | Pending |
| Android emulator boot/install | Not yet executed | Open |
| Real SAF tree selection/import | Requires running Android environment | Open |
| Workspace restore after app restart | Requires running Android environment | Open |
| Git status/diff on materialized repo | Requires running Android environment with a selected repository | Open |
| Reboot persistence | Requires emulator/device lifecycle validation | Open |
| Permission revocation/source missing | Requires Android lifecycle validation | Open |
| Uninstall/reinstall | Design documented; runtime recovery observation still required | Open |
| Physical-device validation | No evidence yet | **Mandatory open gate** |

## S001 conclusion

S001 remains **In progress**.

The hybrid SAF-source + app-owned-working-copy model has converged at the implementation level and resolves the URI/filesystem impedance mismatch without weakening the native authority boundary. It must not be promoted to a final Android storage decision until build, emulator, lifecycle and physical-device evidence close the remaining gates.

## Ready-for-review gate

PR promotion from draft is blocked until at minimum:

1. renderer/native/current Android build gates are green on one HEAD;
2. emulator evidence demonstrates app boot plus real workspace open/import/list/read and restart restoration;
3. Git viability is demonstrated on a materialized repository or a reproducible engine blocker is recorded;
4. reboot/recovery semantics have evidence;
5. at least one physical device has validated the primary workflow.
