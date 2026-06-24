import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { NetworkNode, NodeType } from '@/lib/types'

const countries = ['US', 'DE', 'NL', 'JP', 'SG', 'BR', 'AU', 'CA', 'FR', 'GB', 'SE', 'CH']

function randomNode(i: number): NetworkNode {
  const types: NodeType[] = ['guard', 'mix', 'mix', 'mix', 'exit']
  const type = types[Math.floor(Math.random() * types.length)]
  return {
    id: `node-${i}`,
    type,
    lat: (Math.random() - 0.5) * 160,
    lng: (Math.random() - 0.5) * 360,
    reputation: 0.7 + Math.random() * 0.3,
    latency: 10 + Math.floor(Math.random() * 90),
    connections: [],
    country: countries[Math.floor(Math.random() * countries.length)],
    label: `${type.charAt(0).toUpperCase() + type.slice(1)}-${i.toString().padStart(3, '0')}`,
  }
}

export function useNetworkData() {
  const setNodes = useAppStore((s) => s.setNodes)
  useEffect(() => {
    const nodes = Array.from({ length: 50 }, (_, i) => randomNode(i))
    // wire connections
    nodes.forEach((n, i) => {
      n.connections = [
        nodes[(i + 1) % nodes.length].id,
        nodes[(i + 3) % nodes.length].id,
      ]
    })
    setNodes(nodes)
  }, [setNodes])
}
