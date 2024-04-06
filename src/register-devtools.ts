import { commands, ExtensionContext, ExtensionMode } from "vscode";

export function registerDevToolCommand(context: ExtensionContext) {
  if (context.extensionMode === ExtensionMode.Development) {
    commands.registerCommand(
      "workbench.action.webview.openDeveloperTools",
      () => {
        return;
      }
    );
  }
}
