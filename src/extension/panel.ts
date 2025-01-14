import path from 'path'
import vscode from 'vscode'
import { MessageTypes } from '../types'

let panel: vscode.WebviewPanel | null = null

export function createPanel(context: vscode.ExtensionContext) {
  if (panel) return

  // Utilize method on vscode.window object to create webview
  panel = vscode.window.createWebviewPanel(
    'webview',
    'Preview Replicad Model',
    {
      viewColumn: vscode.ViewColumn.Beside,
      preserveFocus: true,
    },
    {
      enableScripts: true,
      enableFindWidget: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(context.extensionPath, 'build')),
      ],
    },
  )
  panel.onDidDispose(() => {
    panel = null
  })

  // Render html of webview here
  panel.webview.html = createWebviewHTML(
    panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'build', 'webview.js')),
    panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'build', 'replicad-vscode.css')),
  )

  panel.webview.onDidReceiveMessage(e => {
    const msg: MessageTypes = e
    switch (msg.type) {
      case 'init': {
        updatePanel(vscode.window.activeTextEditor?.document)
      }
    }
  })
}

export function onDidSaveTextDocument(document: vscode.TextDocument) {
  if (document != vscode.window.activeTextEditor?.document) return

  updatePanel(document)
}

export function onDidChangeActiveTextEditor(editor?: vscode.TextEditor) {
  updatePanel(editor?.document)
}

export function onDidCloseTextDocument(document: vscode.TextDocument) {
  if (!panel) return

  const fileName = document.fileName
  sendPanelMessage(panel, {
    type: 'close',
    fileName,
  })
}

function updatePanel(document?: vscode.TextDocument) {
  if (!panel) return

  const isJavascript = document?.languageId == 'javascript'
  if (!isJavascript) return

  const fileName = document.fileName
  const text = document.getText()
  if (!text.includes('replicad')) return

  setPanelTitle(panel, document)
  sendPanelMessage(panel, {
    type: 'open',
    fileName,
    text,
  })
}

const setPanelTitle = (panel: vscode.WebviewPanel, document: vscode.TextDocument) => {
  panel.title = `Preview ${path.basename(document.uri.fsPath)}`
}

const sendPanelMessage = (panel: vscode.WebviewPanel, msg: MessageTypes) => {
  panel.webview.postMessage(msg)
}

// Creates the HTML page for webview
const createWebviewHTML = (scriptUri: vscode.Uri, styleUri: vscode.Uri) => {
  // Use a nonce to only allow specific scripts to be run
  const nonce = getNonce()

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Replicad sample app</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="${styleUri}">
    <style>
      body {
        padding: 0;
        margin: 0;
        background: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
      }
      .modal-content {
        color: var(--bs-body-color);
      }
    </style>
  </head>
  <body>
    <div id="root" />
    <script>
      const vscode = acquireVsCodeApi()
      window.onload = () => vscode.postMessage({
        type: 'init',
      })
    </script>
    <script nonce="${nonce}" src="${scriptUri}" />
  </body>
</html>
`
}

const getNonce = () => {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
