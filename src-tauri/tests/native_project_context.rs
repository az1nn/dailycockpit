use dailycockpit_lib::project::{
    git_diff, git_status, list_workspace_entries, open_workspace, read_workspace_text,
};
use git2::{Repository, Signature};
use std::fs;
use std::path::Path;
use tempfile::tempdir;

fn commit_initial_file(repo: &Repository, root: &Path) {
    fs::write(root.join("tracked.txt"), "before\n").expect("tracked file");

    let mut index = repo.index().expect("index");
    index.add_path(Path::new("tracked.txt")).expect("index add");
    index.write().expect("index write");
    let tree_id = index.write_tree().expect("tree id");
    let tree = repo.find_tree(tree_id).expect("tree");
    let signature = Signature::now("Daily Cockpit Integration", "integration@example.com")
        .expect("signature");

    repo.commit(Some("HEAD"), &signature, &signature, "initial", &tree, &[])
        .expect("initial commit");
}

#[test]
fn command_surface_opens_lists_and_reads_real_workspace() {
    let root = tempdir().expect("workspace");
    fs::create_dir(root.path().join(".git")).expect("git internals fixture");
    fs::write(root.path().join("README.md"), "# Daily Cockpit\n").expect("readme");

    let metadata = open_workspace(root.path().to_string_lossy().into_owned());
    let entries = list_workspace_entries(root.path().to_string_lossy().into_owned(), None)
        .expect("workspace entries");
    let readme = read_workspace_text(
        root.path().to_string_lossy().into_owned(),
        "README.md".into(),
    )
    .expect("workspace text");

    assert!(metadata.is_ok());
    assert_eq!(entries.len(), 1, ".git must not be exposed as a normal entry");
    assert_eq!(readme, "# Daily Cockpit\n");
}

#[test]
fn command_surface_reports_real_git_status_and_diff() {
    let root = tempdir().expect("repo");
    let repo = Repository::init(root.path()).expect("git init");
    commit_initial_file(&repo, root.path());

    fs::write(root.path().join("tracked.txt"), "after\n").expect("modified file");
    fs::write(root.path().join("untracked.txt"), "new\n").expect("untracked file");

    let status = git_status(root.path().to_string_lossy().into_owned());
    let diff = git_diff(root.path().to_string_lossy().into_owned()).expect("git diff");

    assert!(status.is_ok());
    assert!(diff.contains("tracked.txt"));
    assert!(diff.contains("-before"));
    assert!(diff.contains("+after"));
    assert!(diff.contains("untracked.txt"));
    assert!(diff.contains("+new"));
}
