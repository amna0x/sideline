import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { useStore } from '../store/index.js'
import { useSocket } from './useSocket.js'

export function useVault() {
  const userId = useStore((s) => s.user?.id)
  const [items, setItems] = useState([])
  const [owned, setOwned] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [i, u] = await Promise.all([
        api.vaultItems().catch(() => []),
        userId ? api.userVault(userId).catch(() => []) : Promise.resolve([])
      ])
      setItems(i || [])
      setOwned(u || [])
    } catch (e) { setError(e) }
    finally { setLoading(false) }
  }, [userId])

  useEffect(() => { load() }, [load])

  useSocket({
    'vault:supply_update': ({ vault_item_id, remaining_supply }) => {
      setItems((cur) => cur.map((x) => x.id === vault_item_id ? { ...x, remaining_supply } : x))
    },
    'vault:minted': (record) => {
      if (record.user_id === userId) setOwned((cur) => [...cur, record])
    }
  })

  async function redeem(userVaultId) {
    const r = await api.redeem({ user_id: userId, user_vault_id: userVaultId })
    setOwned((cur) => cur.map((x) => x.id === userVaultId ? { ...x, redeemed: true, code: r.code } : x))
    return r
  }

  return { items, owned, loading, error, reload: load, redeem }
}
