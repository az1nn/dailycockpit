# S001 — Android Workspace Storage

- Status: Open — preliminary constraint captured
- Updated: 2026-09-15

## Question

How should Daily Cockpit expose a durable project workspace on Android while preserving local-first semantics and safe Git/file access?

## Preliminary evidence

The official Tauri dialog plugin supports Android generally but explicitly does **not** support folder picking on Android. Desktop directory selection therefore cannot be copied to Android as the storage architecture.

## What Wave 2 proves

Wave 2 proves the capability contract and desktop native path:

```text
ProjectContext -> WorkspaceService/GitService -> Tauri native adapter
```

It does not prove the Android storage adapter.

## S001 experiments still required

- Evaluate Android Storage Access Framework/content URI behavior for a project tree.
- Test durable permission grants across restart/reboot/reinstall boundaries.
- Determine whether libgit2/gix can operate directly on the selected representation or whether a materialized app-owned workspace is required.
- Test clone/import/export ergonomics for repositories larger than a toy project.
- Verify symlink, file watcher, rename and atomic-write behavior.
- Validate emulator and at least one physical-device workflow.

## Exit criterion

S001 is complete only when one Android workspace model supports open/import, read/write, Git operations, restart persistence and recovery with evidence from emulator/device testing.
