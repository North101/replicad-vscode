export type InitMessageType = {
  type: 'init'
}

export type FileOpenMessageType = {
  type: 'open'
  fileName: string
  text: string
}

export type FileCloseMessageType = {
  type: 'close'
  fileName: string
}

export type MessageTypes =
  | InitMessageType
  | FileOpenMessageType
  | FileCloseMessageType
