import {
  ExtensionContext,
  OutputChannel,
  ViewColumn,
  commands,
  window,
} from "vscode";
import { Viewer } from "./viewer";
import { registerDevToolCommand } from "./register-devtools";
import { APPLICATION_CONSTANTS } from "./constants";

export function activate(context: ExtensionContext) {
  let openPreviewCommand = commands.registerCommand(
    APPLICATION_CONSTANTS.openPreviewCommand,
    () => {
      const editor = window.activeTextEditor;

      commands.executeCommand(
        "vscode.openWith",
        editor?.document?.uri,
        APPLICATION_CONSTANTS.viewTypeId,
        {
          preview: true,
          viewColumn: ViewColumn.Beside,
        }
      );
    }
  );

  let openInViewer = commands.registerCommand(
    APPLICATION_CONSTANTS.openInViewerCommand,
    () => {
      const editor = window.activeTextEditor;

      commands.executeCommand(
        "vscode.openWith",
        editor?.document?.uri,
        APPLICATION_CONSTANTS.viewTypeId,
        {
          preview: false,
          viewColumn: ViewColumn.Active,
        }
      );
    }
  );

  let openInTextEditorCommand = commands.registerCommand(
    APPLICATION_CONSTANTS.openInTextEditorCommand,
    () => {
      const editor = window.activeTextEditor;

      commands.executeCommand(
        "workbench.action.reopenTextEditor",
        editor?.document?.uri
      );
    }
  );

  context.subscriptions.push(openPreviewCommand);
  context.subscriptions.push(openInViewer);
  context.subscriptions.push(openInTextEditorCommand);

  context.subscriptions.push(Viewer.register(context));
  registerDevToolCommand(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}
