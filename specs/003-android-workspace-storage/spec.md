# Feature Specification: Android Workspace Storage

**Feature Branch**: `feat/android-workspace-storage-s001`  
**Status**: In progress — S001 evidence gathering  
**Priority**: MVP / Android workspace wave

## Why

Daily Cockpit already opens and reads a real desktop project, but Android cannot safely inherit the desktop assumption that a user-selected project is represented by a normal filesystem path. The Android workspace model must preserve local-first project semantics, durable user-granted access and the existing narrow `WorkspaceService` boundary without inventing filesystem parity that the platform does not provide.

## User scenarios

### P1 — Open or import a real Android project workspace

As a developer on Android, I can choose a project workspace through a platform-supported user-controlled flow and Daily Cockpit establishes it as the active project without requiring unrestricted storage access.

**Acceptance**
- Workspace selection/import is initiated by the user through an Android-supported document/storage flow.
- The selected source is represented explicitly as an Android workspace source rather than being disguised as a desktop path.
- Project name and active workspace metadata are derived from the selected/imported project, not fixtures.
- No broad storage permission or generic filesystem capability is exposed to the renderer.

### P1 — Reopen the project after app restart

As a developer, after granting access to a project I can close and reopen Daily Cockpit and recover the project without selecting it again while the Android grant remains valid.

**Acceptance**
- Durable Android access is requested when the platform supports it.
- The app can detect when a previously granted source is no longer accessible.
- Loss of access becomes an explicit recoverable product state rather than silent fallback data.

### P1 — Browse and read project files through WorkspaceService

As a developer, I can list and read real project files through the same product boundary used on desktop.

**Acceptance**
- Root and nested entries are available through `WorkspaceService`.
- UTF-8 text reads remain size-limited.
- `.git` internals are not surfaced as normal workspace files.
- Workspace reads cannot escape the active project boundary.

### P1 — Preserve Git viability without treating content URIs as paths

As a developer, an Android project that contains a Git repository has an explicit Git capability state based on the storage representation that the native Git engine can actually use.

**Acceptance**
- A selected Android document-tree URI is never passed to Git as though it were a filesystem path.
- Git viability is demonstrated on the chosen working representation or reported as blocked with evidence.
- Existing Git mutation restrictions remain unchanged.

### P1 — Understand lifecycle and recovery

As a developer, Daily Cockpit behaves predictably across restart, reboot and reinstall boundaries.

**Acceptance**
- Restart behavior is validated.
- Reboot behavior is documented and validated where the test environment permits.
- Uninstall/reinstall behavior is documented, including what data is intentionally lost and how a user reconnects to the original project source.
- Source project data expected to outlive the application is not stored only in app-specific storage.

## Functional requirements

- FR-001: The Android app SHALL establish an active project from a user-selected or user-imported workspace source without requiring unrestricted shared-storage access.
- FR-002: The Android workspace representation SHALL distinguish a platform document/source reference from a local filesystem path.
- FR-003: `WorkspaceService` SHALL remain the renderer/domain boundary for workspace open/list/read operations.
- FR-004: The native implementation SHALL preserve durable access to the selected Android source when the platform grant supports persistence.
- FR-005: The system SHALL detect and surface revoked, moved, deleted or otherwise inaccessible Android workspace sources.
- FR-006: Real workspace files SHALL be listable and readable through the native boundary after project activation.
- FR-007: Workspace reads SHALL remain scoped to the active project and SHALL NOT expose `.git` internals as normal project files.
- FR-008: The system SHALL maintain a Git-capability state that is derived from the actual Android working representation.
- FR-009: Android workspace handling SHALL NOT expose a generic shell or generic unrestricted filesystem API to the renderer.
- FR-010: Existing approval-gated Git/workspace mutation invariants SHALL remain unchanged.
- FR-011: The feature SHALL define restart, reboot and uninstall/reinstall behavior and recovery semantics.
- FR-012: Android validation SHALL include emulator evidence and at least one physical-device evidence record before the feature is marked complete.

## Non-goals

- SecretStore or API-key storage.
- OpenAI BYOK or a provider-backed agent runtime.
- GitHub authentication or remote Git operations.
- Git commit, push, merge, destructive checkout or patch application.
- Calendar or additional notes features.
- Pretending Android storage is desktop-identical.

## Success criteria

- SC-001: An Android user can choose/import a real project and see it become the active `ProjectContext`.
- SC-002: After an app restart, the same project can be restored without a new picker interaction while the underlying Android grant remains valid.
- SC-003: Workspace entries and UTF-8 text content are read from real project data through `WorkspaceService`.
- SC-004: No Android document URI is interpreted as a normal desktop filesystem path.
- SC-005: Git capability on Android is either demonstrated against a real filesystem working copy or explicitly reported unavailable with captured evidence.
- SC-006: Renderer/native CI remains green and Android emulator validation passes on the feature HEAD.
- SC-007: Physical-device validation evidence exists before the PR is promoted from draft/implementation state to ready for review.
