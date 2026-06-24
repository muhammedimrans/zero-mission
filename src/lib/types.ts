export type NodeType = 'guard' | 'mix' | 'exit' | 'client' | 'service'

export interface NetworkNode {
  id: string
  type: NodeType
  lat: number
  lng: number
  reputation: number
  latency: number
  connections: string[]
  country: string
  label: string
}

export interface Packet {
  id: string
  path: string[]
  layer: number
  progress: number
  encrypted: boolean
}

export interface Circuit {
  id: string
  guard: string
  mix1: string
  mix2: string
  exit: string
  active: boolean
}
