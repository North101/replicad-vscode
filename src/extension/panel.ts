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
    },
  )
  panel.onDidDispose(() => {
    panel = null
  })

  // Set URI to be the path to bundle
  const scriptPath: vscode.Uri = vscode.Uri.joinPath(context.extensionUri, 'build', 'webview.js')

  // Set webview URI to pass into html script
  const scriptUri: vscode.Uri = panel.webview.asWebviewUri(scriptPath)

  // Render html of webview here
  panel.webview.html = createWebviewHTML(scriptUri)

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

function updatePanel(document?: vscode.TextDocument) {
  if (!panel) return

  const isJavascript = document?.languageId == 'javascript'
  if (!isJavascript) return

  setPanelTitle(panel, document)
  sendPanelMessage(panel, {
    type: 'code',
    value: document.getText(),
  })
}

function setPanelTitle(panel: vscode.WebviewPanel, document: vscode.TextDocument) {
  panel.title = `Preview ${path.basename(document.uri.fsPath)}`
}

function sendPanelMessage(panel: vscode.WebviewPanel, msg: MessageTypes) {
  panel.webview.postMessage(msg)
}

// Creates the HTML page for webview
function createWebviewHTML(scriptUri: vscode.Uri) {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Replicad sample app</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="https://replicad.xyz/img/favicon.ico" />
    <link rel="stylesheet" href="https://unpkg.com/mvp.css">
  </head>
  <body>
    <div id="root" />
    <style>
      body {
        background: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
      }
    </style>
    <script>
      const vscode = acquireVsCodeApi()
      window.onload = () => vscode.postMessage({
        type: 'init',
      })
    </script>
    <script src="${scriptUri}" />
  </body>
</html>
`
}
