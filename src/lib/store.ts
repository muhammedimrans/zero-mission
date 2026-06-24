import { create } from 'zustand'
import { NetworkNode, Packet, Circuit } from './types'

interface AppState {
  nodes: NetworkNode[]
  packets: Packet[]
  circuits: Circuit[]
  selectedNode: NetworkNode | null
  hoveredNode: string | null
  activeRoute: string[]
  setNodes: (nodes: NetworkNode[]) => void
  setSelectedNode: (node: NetworkNode | null) => void
  setHoveredNode: (id: string | null) => void
  setActiveRoute: (route: string[]) => void
}

export const useAppStore = create<AppState>((set) => ({
  nodes: [],
  packets: [],
  circuits: [],
  selectedNode: null,
  hoveredNode: null,
  activeRoute: [],
  setNodes: (nodes) => set({ nodes }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setHoveredNode: (id) => set({ hoveredNode: id }),
  setActiveRoute: (route) => set({ activeRoute: route }),
}))
