export interface InitMessageType {
  type: 'init'
}

export interface CodeMessageType {
  type: 'code'
  value: string | null
}

export type MessageTypes =
  | InitMessageType
  | CodeMessageType
