use git2::{DiffFormat, DiffOptions, ErrorCode, Repository, StatusOptions};
use serde::Serialize;
use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};

const MAX_WORKSPACE_ENTRIES: usize = 200;
const MAX_TEXT_FILE_BYTES: u64 = 1024 * 1024;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceMetadata {
    root: String,
    name: String,
    is_git_repository: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    path: String,
    kind: &'static str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitStatusPayload {
    branch: String,
    clean: bool,
    changed_paths: Vec<String>,
    remote_url: Option<String>,
    repository_root: String,
}

fn canonical_directory(path: &Path) -> Result<PathBuf, String> {
    let canonical = fs::canonicalize(path)
        .map_err(|error| format!("Unable to open workspace: {error}"))?;
    let metadata = fs::metadata(&canonical)
        .map_err(|error| format!("Unable to inspect workspace: {error}"))?;

    if !metadata.is_dir() {
        return Err("Selected workspace is not a directory.".into());
    }

    Ok(canonical)
}

fn canonical_scoped_path(root: &Path, relative: &Path) -> Result<(PathBuf, PathBuf), String> {
    let canonical_root = canonical_directory(root)?;
    let joined = if relative.as_os_str().is_empty() {
        canonical_root.clone()
    } else {
        canonical_root.join(relative)
    };
    let canonical_target = fs::canonicalize(&joined)
        .map_err(|error| format!("Unable to resolve workspace path: {error}"))?;

    if !canonical_target.starts_with(&canonical_root) {
        return Err("Workspace path escapes the active project root.".into());
    }

    Ok((canonical_root, canonical_target))
}

fn workspace_metadata(path: &Path) -> Result<WorkspaceMetadata, String> {
    let canonical = canonical_directory(path)?;
    let name = canonical
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("workspace")
        .to_string();

    Ok(WorkspaceMetadata {
        root: canonical.to_string_lossy().into_owned(),
        name,
        is_git_repository: Repository::open(&canonical).is_ok(),
    })
}

fn workspace_entries(root: &Path, relative: Option<&Path>) -> Result<Vec<FileEntry>, String> {
    let relative = relative.unwrap_or_else(|| Path::new(""));
    let (canonical_root, target) = canonical_scoped_path(root, relative)?;

    if !target.is_dir() {
        return Err("Workspace listing target is not a directory.".into());
    }

    let mut entries = Vec::new();
    let read_dir = fs::read_dir(&target)
        .map_err(|error| format!("Unable to list workspace: {error}"))?;

    for entry in read_dir.take(MAX_WORKSPACE_ENTRIES) {
        let entry = entry.map_err(|error| format!("Unable to read workspace entry: {error}"))?;
        if entry.file_name() == ".git" {
            continue;
        }

        let file_type = entry
            .file_type()
            .map_err(|error| format!("Unable to inspect workspace entry: {error}"))?;
        let path = entry.path();
        let relative_path = path
            .strip_prefix(&canonical_root)
            .map_err(|_| "Workspace entry escaped the active root.".to_string())?;

        entries.push(FileEntry {
            path: relative_path.to_string_lossy().into_owned(),
            kind: if file_type.is_dir() { "directory" } else { "file" },
        });
    }

    entries.sort_by(|left, right| {
        let left_directory = left.kind == "directory";
        let right_directory = right.kind == "directory";
        right_directory
            .cmp(&left_directory)
            .then_with(|| left.path.to_lowercase().cmp(&right.path.to_lowercase()))
    });

    Ok(entries)
}

fn workspace_text(root: &Path, relative: &Path) -> Result<String, String> {
    let (_, target) = canonical_scoped_path(root, relative)?;
    let metadata = fs::metadata(&target)
        .map_err(|error| format!("Unable to inspect workspace file: {error}"))?;

    if !metadata.is_file() {
        return Err("Workspace path is not a file.".into());
    }
    if metadata.len() > MAX_TEXT_FILE_BYTES {
        return Err("Workspace text preview is limited to 1 MiB.".into());
    }

    fs::read_to_string(&target)
        .map_err(|_| "Workspace preview currently supports UTF-8 text files only.".into())
}

fn open_repository(root: &Path) -> Result<Repository, String> {
    let canonical = canonical_directory(root)?;
    Repository::open(&canonical).map_err(|_| "Selected workspace is not a Git repository.".into())
}

fn current_branch(repo: &Repository) -> Result<String, String> {
    match repo.head() {
        Ok(head) if head.is_branch() => Ok(head.shorthand().unwrap_or("unknown").to_string()),
        Ok(head) => Ok(head
            .target()
            .map(|oid| format!("detached@{}", &oid.to_string()[..7]))
            .unwrap_or_else(|| "detached".into())),
        Err(error) if error.code() == ErrorCode::UnbornBranch => Ok("unborn".into()),
        Err(error) => Err(format!("Unable to inspect Git HEAD: {error}")),
    }
}

fn inspect_git_status(root: &Path) -> Result<GitStatusPayload, String> {
    let repo = open_repository(root)?;
    let branch = current_branch(&repo)?;
    let mut options = StatusOptions::new();
    options.include_untracked(true).recurse_untracked_dirs(true);
    let statuses = repo
        .statuses(Some(&mut options))
        .map_err(|error| format!("Unable to inspect Git status: {error}"))?;

    let changed_paths: BTreeSet<String> = statuses
        .iter()
        .filter_map(|entry| entry.path().map(str::to_string))
        .collect();
    let remote_url = repo
        .find_remote("origin")
        .ok()
        .and_then(|remote| remote.url().map(str::to_string));
    let repository_root = repo
        .workdir()
        .unwrap_or_else(|| repo.path())
        .to_string_lossy()
        .into_owned();

    Ok(GitStatusPayload {
        branch,
        clean: changed_paths.is_empty(),
        changed_paths: changed_paths.into_iter().collect(),
        remote_url,
        repository_root,
    })
}

fn render_git_diff(root: &Path) -> Result<String, String> {
    let repo = open_repository(root)?;
    let head_tree = repo.head().ok().and_then(|head| head.peel_to_tree().ok());
    let mut options = DiffOptions::new();
    options
        .show_untracked_content(true)
        .recurse_untracked_dirs(true)
        .context_lines(3);

    let diff = repo
        .diff_tree_to_workdir_with_index(head_tree.as_ref(), Some(&mut options))
        .map_err(|error| format!("Unable to calculate Git diff: {error}"))?;
    let mut output = String::new();

    diff.print(DiffFormat::Patch, |_delta, _hunk, line| {
        match line.origin() {
            '+' | '-' | ' ' => output.push(line.origin()),
            _ => {}
        }
        output.push_str(&String::from_utf8_lossy(line.content()));
        true
    })
    .map_err(|error| format!("Unable to render Git diff: {error}"))?;

    Ok(output)
}

#[tauri::command]
pub fn open_workspace(path: String) -> Result<WorkspaceMetadata, String> {
    workspace_metadata(Path::new(&path))
}

#[tauri::command]
pub fn list_workspace_entries(
    root: String,
    relative: Option<String>,
) -> Result<Vec<FileEntry>, String> {
    workspace_entries(Path::new(&root), relative.as_deref().map(Path::new))
}

#[tauri::command]
pub fn read_workspace_text(root: String, path: String) -> Result<String, String> {
    workspace_text(Path::new(&root), Path::new(&path))
}

#[tauri::command]
pub fn git_status(root: String) -> Result<GitStatusPayload, String> {
    inspect_git_status(Path::new(&root))
}

#[tauri::command]
pub fn git_diff(root: String) -> Result<String, String> {
    render_git_diff(Path::new(&root))
}

#[cfg(test)]
mod tests {
    use super::*;
    use git2::Signature;
    use tempfile::tempdir;

    #[test]
    fn workspace_text_rejects_paths_outside_root() {
        let parent = tempdir().expect("temp parent");
        let root = parent.path().join("project");
        fs::create_dir(&root).expect("project directory");
        fs::write(parent.path().join("outside.txt"), "secret").expect("outside file");

        let result = workspace_text(&root, Path::new("../outside.txt"));

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("escapes"));
    }

    #[test]
    fn workspace_listing_hides_git_internals() {
        let root = tempdir().expect("workspace");
        fs::create_dir(root.path().join(".git")).expect("git directory");
        fs::write(root.path().join("README.md"), "hello").expect("readme");

        let entries = workspace_entries(root.path(), None).expect("entries");

        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].path, "README.md");
    }

    #[test]
    fn git_status_and_diff_reflect_real_worktree_changes() {
        let root = tempdir().expect("repo");
        let repo = Repository::init(root.path()).expect("git init");
        fs::write(root.path().join("tracked.txt"), "before\n").expect("tracked file");

        let mut index = repo.index().expect("index");
        index.add_path(Path::new("tracked.txt")).expect("index add");
        index.write().expect("index write");
        let tree_id = index.write_tree().expect("tree id");
        let tree = repo.find_tree(tree_id).expect("tree");
        let signature = Signature::now("Daily Cockpit Test", "test@example.com").expect("signature");
        repo.commit(Some("HEAD"), &signature, &signature, "initial", &tree, &[])
            .expect("initial commit");
        drop(tree);

        fs::write(root.path().join("tracked.txt"), "after\n").expect("modified file");

        let status = inspect_git_status(root.path()).expect("status");
        let diff = render_git_diff(root.path()).expect("diff");

        assert!(!status.clean);
        assert_eq!(status.changed_paths, vec!["tracked.txt"]);
        assert!(diff.contains("tracked.txt"));
        assert!(diff.contains("-before"));
        assert!(diff.contains("+after"));
    }
}
