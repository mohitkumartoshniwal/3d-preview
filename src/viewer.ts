import {
  CustomReadonlyEditorProvider,
  ExtensionContext,
  window,
  Disposable,
  WebviewPanel,
  Uri,
  CustomDocumentOpenContext,
  CancellationToken,
  workspace,
  Webview,
  commands,
} from "vscode";
import { APPLICATION_CONSTANTS } from "./constants";
import Doc from "./doc";
import { getNonce, getUri } from "./utils";

export class Viewer implements CustomReadonlyEditorProvider<Doc> {
  static register(context: ExtensionContext): Disposable {
    const viewer = new Viewer(context);
    const disposable = window.registerCustomEditorProvider(
      Viewer._viewType,
      viewer,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    );

    return disposable;
  }

  private static readonly _viewType = APPLICATION_CONSTANTS.viewTypeId;
  private _currentPanel: WebviewPanel | null = null;

  constructor(private readonly _context: ExtensionContext) {}

  //   private readonly _onDidChangeCustomDocument = new EventEmitter<
  //     CustomDocumentEditEvent<Doc>
  //   >();

  //   onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

  async openCustomDocument(
    uri: Uri,
    openContext: CustomDocumentOpenContext,
    token: CancellationToken
  ): Promise<Doc> {
    // const buffer = await workspace.fs.readFile(uri);
    //  TODO is Uint8Array required??
    const buffer = new Uint8Array(await workspace.fs.readFile(uri));
    const doc = new Doc(uri, buffer);
    return doc;
  }

  resolveCustomEditor(
    document: Doc,
    webviewPanel: WebviewPanel,
    token: CancellationToken
  ) {
    this._currentPanel = webviewPanel;
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [Uri.joinPath(this._context.extensionUri, "out")],
    };

    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    webviewPanel.webview.onDidReceiveMessage(
      async (eventData: { type: string; [key: string]: any }) => {
        const { type, ...data } = eventData;
        if (type === APPLICATION_CONSTANTS.READY) {
          const ext = document.uri.fsPath.toLowerCase().split(".").at(-1);

          webviewPanel.webview.postMessage({
            type: ext,
            blob: document.buffer,
          });
        }
      }
    );
  }

  getHtmlForWebview(webview: Webview): string {
    const js = [
      getUri(webview, this._context.extensionUri, "out", "app", "main.js"),
    ];

    const css = [
      getUri(webview, this._context.extensionUri, "out", "app", "main.css"),
    ];

    const nonce = getNonce();

    // NEED TO ADD CSP IF POSSIBLE WITHOUT BREAKING FUNCTIONALITY
    //   <meta
    //   http-equiv="Content-Security-Policy"
    //   content="default-src 'none'; connect-src https://www.gstatic.com/ blob: data:; img-src ${webview.cspSource} https: blob:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'nonce-${nonce}'; style-src-elem ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource} data:;"
    // />

    return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="${css}">
      </head>
      <body>
        <canvas class="experience"></canvas>
        <div class="model-preview-overlay">
          <div class="loading-text">Loading...</div>
        </div>
        <script type="module" nonce="${nonce}" src="${js}"></script>
      </body>
    </html>
  `;
  }
}
