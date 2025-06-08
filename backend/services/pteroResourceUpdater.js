require('dotenv').config()
const db = require('../lib/db')
const axios = require('axios')

const PTERO_URL = process.env.PTERO_API_URL
const API_KEY = process.env.PTERO_API_KEY

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

async function updateNodeResources() {
  try {
    // 1. Alle Server laden
    const serverRes = await axios.get(`${PTERO_URL}/servers`, { headers })
    const servers = serverRes.data.data

    // 2. Ressourcen pro Node aggregieren
    const usageMap = {}

    await Promise.allSettled(
      servers.map(async (s) => {
        const nodeId = s.attributes.node
        const limits = s.attributes.limits || {}
        const isSuspended = s.attributes.suspended
        const uuid = s.attributes.uuid

        if (!usageMap[nodeId]) {
          usageMap[nodeId] = {
            ram: 0,
            disk: 0,
            cpu: 0,
            total: 0,
            suspended: 0,
            running: 0
          }
        }

        usageMap[nodeId].ram += limits.memory ?? 0
        usageMap[nodeId].disk += limits.disk ?? 0
        usageMap[nodeId].cpu += limits.cpu ?? 0
        usageMap[nodeId].total += 1
        usageMap[nodeId].suspended += isSuspended ? 1 : 0

        if (isSuspended) return // ➤ Suspendierte Server überspringen

        // Client-API statt Application-API
        try {
          const clientUrl = `${PTERO_URL.replace('/api/application', '/api/client')}/servers/${uuid}/resources`
          const res = await axios.get(clientUrl, { headers })
          const state = res.data?.attributes?.current_state
          if (state === 'running') {
            usageMap[nodeId].running += 1
          }
        } catch (err) {
          console.warn(`[WARN] Status für Server ${uuid} konnte nicht ermittelt werden: ${err.message}`)
        }
      })
    )

    // 3. Alle Nodes abfragen
    const { data } = await axios.get(`${PTERO_URL}/nodes`, { headers })
    const nodes = data.data

    for (const node of nodes) {
      const maxRam = node.attributes.memory ?? 0
      const maxDisk = node.attributes.disk ?? 0
      const maxCpu = node.attributes.cpu ?? 0
      const location = node.attributes.location_id ?? 0
      const nodeId = node.attributes.id ?? 0
      const nodeName = node.attributes.name ?? 'Unbekannt'

      const usage = usageMap[nodeId] || {
        ram: 0,
        disk: 0,
        cpu: 0,
        total: 0,
        suspended: 0,
        running: 0
      }

      await db.query(`
        INSERT INTO nodes_resources (
          node_id, node_name, location,
          max_ram, used_ram, max_disk, used_disk, max_cpu, used_cpu,
          servers_running, servers_total, servers_suspended,
          available
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          node_name = VALUES(node_name),
          location = VALUES(location),
          max_ram = VALUES(max_ram),
          used_ram = VALUES(used_ram),
          max_disk = VALUES(max_disk),
          used_disk = VALUES(used_disk),
          max_cpu = VALUES(max_cpu),
          used_cpu = VALUES(used_cpu),
          servers_running = VALUES(servers_running),
          servers_total = VALUES(servers_total),
          servers_suspended = VALUES(servers_suspended),
          available = 1,
          last_update = CURRENT_TIMESTAMP
      `, [
        nodeId, nodeName, location,
        maxRam, usage.ram,
        maxDisk, usage.disk,
        maxCpu, usage.cpu,
        usage.running, usage.total, usage.suspended
      ])
    }

    console.log(`[NODE RESOURCES] Aktualisiert: ${nodes.length} Nodes`)
  } catch (err) {
    console.error('[NODE RESOURCES] Fehler:', err.message)
  }
}

module.exports = updateNodeResources
