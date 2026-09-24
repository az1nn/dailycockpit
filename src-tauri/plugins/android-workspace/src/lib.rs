use serde::Deserialize;
use tauri::{plugin::Builder, Runtime};

#[cfg(target_os = "android")]
use tauri::{plugin::PluginHandle, Manager};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AndroidWorkspaceMaterialization {
    pub root: String,
    pub name: String,
    pub source_uri: String,
    pub access_state: String,
    pub can_write: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AndroidWorkspaceRestore {
    pub available: bool,
    pub root: Option<String>,
    pub name: Option<String>,
    pub source_uri: Option<String>,
    pub access_state: String,
    pub can_write: bool,
}

#[cfg(target_os = "android")]
pub struct AndroidWorkspace<R: Runtime>(PluginHandle<R>);

#[cfg(target_os = "android")]
impl<R: Runtime> AndroidWorkspace<R> {
    pub fn pick_and_materialize(&self) -> Result<AndroidWorkspaceMaterialization, String> {
        self.0
            .run_mobile_plugin("pickAndMaterialize", serde_json::json!({}))
            .map_err(|error| error.to_string())
    }

    pub fn restore_and_materialize(&self) -> Result<AndroidWorkspaceRestore, String> {
        self.0
            .run_mobile_plugin("restoreAndMaterialize", serde_json::json!({}))
            .map_err(|error| error.to_string())
    }
}

#[cfg(target_os = "android")]
pub trait AndroidWorkspaceExt<R: Runtime> {
    fn android_workspace(&self) -> &AndroidWorkspace<R>;
}

#[cfg(target_os = "android")]
impl<R: Runtime, T: Manager<R>> AndroidWorkspaceExt<R> for T {
    fn android_workspace(&self) -> &AndroidWorkspace<R> {
        self.state::<AndroidWorkspace<R>>().inner()
    }
}

pub fn init<R: Runtime>() -> tauri::plugin::TauriPlugin<R> {
    Builder::new("android-workspace")
        .setup(|app, api| {
            #[cfg(target_os = "android")]
            {
                let handle = api.register_android_plugin(
                    "com.dailycockpit.workspace",
                    "AndroidWorkspacePlugin",
                )?;
                app.manage(AndroidWorkspace(handle));
            }
            Ok(())
        })
        .build()
}
