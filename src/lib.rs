use std::env;

use zed_extension_api::{self as zed, LanguageServerId};

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

        let node = zed::node_binary_path().or_else(|_| {
            worktree
                .which("node")
                .ok_or_else(|| "node was not found on PATH; it is required to run goctl-api-lsp".to_string())
        })?;
        let extension_work_dir =
            env::current_dir().map_err(|err| format!("failed to get extension work dir: {err}"))?;
        let server_path = extension_work_dir
            .join("server")
            .join("goctl-api-lsp.mjs")
            .to_string_lossy()
            .to_string();

        Ok(zed::Command {
            command: node,
            args: vec![server_path],
            env: worktree.shell_env(),
        })
    }
}

zed::register_extension!(GoctlExtension);
