# Analysis: Android Workspace Storage

## Decision frame

S001 asks which Android workspace representation can preserve local-first semantics, survive normal lifecycle events and still support native filesystem/Git operations safely.

The candidates are evaluated against five constraints:

1. user-controlled durable source access;
2. compatibility with `WorkspaceService` list/read behavior;
3. compatibility with native Git engines that expect filesystem paths;
4. lifecycle/recovery behavior;
5. narrow native authority with no broad storage bypass.

## Candidate A — Direct SAF document tree

```text
ACTION_OPEN_DOCUMENT_TREE
  -> content:// tree URI
  -> persisted URI grant
  -> ContentResolver / DocumentsContract
```

### Strengths

- Native Android user-consent model.
- No broad storage permission required for the selected tree.
- Persistable URI grants can survive restart/reboot while the target and grant remain valid.
- External source data is not tied to the app-specific lifecycle and can remain after uninstall.

### Constraints

- The selected tree is a document-provider URI, not an ordinary filesystem path.
- File operations depend on provider capabilities and `ContentResolver`/document APIs.
- Large recursive traversal can be costly.
- Android 11+ prevents selection of several roots through `ACTION_OPEN_DOCUMENT_TREE`.
- Current `git2` boundary cannot consume the URI directly as a repository filesystem path.

### Result

**Insufficient as the sole working representation** for the current Git-backed product slice. It remains the preferred user-controlled source reference.

## Candidate B — App-owned workspace only

```text
import/copy
  -> app files directory
  -> WorkspaceService / GitService
```

### Strengths

- Real filesystem semantics.
- Direct compatibility with scoped Rust filesystem reads.
- Natural fit for `git2`, atomic file operations and future file watching.
- Simpler native test surface.

### Constraints

- App-specific files are removed on uninstall.
- Without an external source/export relationship, user project data would exist only inside the app lifecycle.
- Import/export and recovery semantics become mandatory product concerns.

### Result

**Suitable as an operational working copy, not as the only durable user project representation.**

## Candidate C — Hybrid source + working copy

```text
SAF document tree (source)
  -> persisted content URI grant
  -> explicit import/refresh
  -> app-owned materialized working copy
  -> WorkspaceService / GitService
```

### Strengths

- Preserves Android's user-controlled storage contract.
- Keeps a durable source reference separate from derived operational state.
- Gives Git and scoped Rust reads a real filesystem working tree.
- Makes desktop and Android implementations different behind the same product ports rather than pretending they are identical.
- Provides an explicit recovery story after reinstall: reconnect to external source and rematerialize.

### Costs / risks

- Requires import/refresh lifecycle management.
- Working copy can become stale relative to the source if synchronization is implicit.
- Recursive materialization performance depends on provider behavior and repository size.
- Bidirectional synchronization is non-trivial and deliberately out of scope for this wave.

### Result

**Selected for the first vertical slice, subject to emulator/device evidence.**

## Contract impact

The existing string `root` is valid for the desktop filesystem implementation but is too ambiguous to describe Android source identity. The least disruptive migration is:

- keep `root` as the actual native working root used by existing typed commands;
- add explicit workspace `kind` and optional `sourceUri`/access state to metadata;
- never place `content://` into `root`;
- keep platform-specific source handling inside the native adapter.

A future opaque `WorkspaceId` can replace raw working roots if later security work shows that the renderer should not carry native paths at all. That is not required to prove S001 and should not be conflated with SecretStore or unrelated authority work.

## Security analysis

### Preserved invariants

- No generic shell in renderer.
- No generic filesystem API added.
- Android access is user-selected and scoped to one document tree.
- URI grant is persisted only for the selected tree.
- Materialization target is app-owned.
- Relative path validation remains mandatory before writes into the working copy.
- Git mutations stay unavailable.

### New risks to test

- Document names containing separators or traversal-like sequences.
- Duplicate/provider-normalized names.
- Symlink behavior after materialization.
- Very large files and large directory counts.
- Virtual documents or providers that do not expose ordinary byte streams.
- Permission revoked after a previous successful import.
- Source moved/deleted while stale materialized data remains.

## Lifecycle conclusions

- **Restart:** should restore through persisted URI grant and stored source descriptor.
- **Reboot:** Android supports persistable grants; must be validated before completion.
- **Uninstall:** app-specific working data is removed. External document source can remain, but reconnect/reselection is required as part of a fresh app authorization lifecycle.
- **Reinstall recovery:** user selects the external source again; Daily Cockpit creates a new working copy.

## Git viability hypothesis

The hybrid model removes the URI/path impedance mismatch because Git operates on the materialized filesystem tree. Two independent questions remain to validate:

1. Does current `git2`/libgit2 cross-compile and run acceptably in the Tauri Android target?
2. Does copying `.git` plus worktree content from the selected source preserve a usable repository for local read operations?

Failure of either question does not invalidate SAF as the source model; it becomes evidence to replace the Android Git implementation behind `GitService` (for example with `gix`) or to constrain Git capability until a later wave.

## Convergence criteria

S001 remains open until all of the following have evidence:

- real Android tree selection/import;
- persisted access after app restart;
- list/read through `WorkspaceService`;
- reboot behavior recorded;
- uninstall/reinstall recovery documented;
- Git viability demonstrated or explicitly blocked with reproducible evidence;
- emulator validation;
- physical-device validation.
