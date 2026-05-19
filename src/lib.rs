use std::env;

use zed_extension_api::{
    self as zed, DownloadedFileType, GithubReleaseOptions, LanguageServerId,
    LanguageServerInstallationStatus,
};

const SERVER_BINARY: &str = "goctl-api-lsp";
const SERVER_ASSET_NAME: &str = "goctl-api-lsp.mjs";
const SERVER_REPOSITORY: &str = "caichuanwang/goctl-zed";
const LOCAL_DEVELOPMENT_SERVER_PATH: &[&str] = &["server", "goctl-api-lsp.mjs"];

struct GoctlExtension;

impl zed::Extension for GoctlExtension {
    fn new() -> Self {
        Self
    }

    fn language_server_command(
        &mut self,
        language_server_id: &LanguageServerId,
        worktree: &zed::Worktree,
    ) -> zed::Result<zed::Command> {
        if language_server_id.as_ref() != "goctl-api-lsp" {
            return Err(format!("unsupported language server: {language_server_id}"));
        }

        if let Some(server_path) = worktree.which(SERVER_BINARY) {
            return Ok(zed::Command {
                command: server_path,
                args: vec![],
                env: worktree.shell_env(),
            });
        }

        let node = zed::node_binary_path().or_else(|_| {
            worktree
                .which("node")
                .ok_or_else(|| "node was not found on PATH; it is required to run goctl-api-lsp".to_string())
        })?;
        let server_path = language_server_path(language_server_id)?;

        Ok(zed::Command {
            command: node,
            args: vec![server_path],
            env: worktree.shell_env(),
        })
    }
}

fn language_server_path(language_server_id: &LanguageServerId) -> zed::Result<String> {
    let extension_work_dir =
        env::current_dir().map_err(|err| format!("failed to get extension work dir: {err}"))?;
    let server_path = extension_work_dir.join(SERVER_ASSET_NAME);
    if server_path.exists() {
        return Ok(server_path.to_string_lossy().to_string());
    }

    let local_development_server_path = LOCAL_DEVELOPMENT_SERVER_PATH
        .iter()
        .fold(extension_work_dir.clone(), |path, component| path.join(component));
    if local_development_server_path.exists() {
        return Ok(local_development_server_path.to_string_lossy().to_string());
    }

    zed::set_language_server_installation_status(
        language_server_id,
        &LanguageServerInstallationStatus::CheckingForUpdate,
    );

    let release = zed::latest_github_release(
        SERVER_REPOSITORY,
        GithubReleaseOptions {
            require_assets: true,
            pre_release: false,
        },
    )
    .map_err(|err| format!("failed to fetch latest goctl-api-lsp release: {err}"))?;

    let asset = release
        .assets
        .iter()
        .find(|asset| asset.name == SERVER_ASSET_NAME)
        .ok_or_else(|| {
            format!(
                "latest {SERVER_REPOSITORY} release {} does not include {SERVER_ASSET_NAME}",
                release.version
            )
        })?;

    zed::set_language_server_installation_status(
        language_server_id,
        &LanguageServerInstallationStatus::Downloading,
    );
    zed::download_file(
        &asset.download_url,
        SERVER_ASSET_NAME,
        DownloadedFileType::Uncompressed,
    )
    .map_err(|err| format!("failed to download {SERVER_ASSET_NAME}: {err}"))?;
    zed::make_file_executable(SERVER_ASSET_NAME)
        .map_err(|err| format!("failed to make {SERVER_ASSET_NAME} executable: {err}"))?;
    zed::set_language_server_installation_status(
        language_server_id,
        &LanguageServerInstallationStatus::None,
    );

    Ok(server_path.to_string_lossy().to_string())
}

zed::register_extension!(GoctlExtension);
