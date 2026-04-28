// Socket.io event registration + helper emitters consumed by the simulator/engine.

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[socket] + ${socket.id}`)

    socket.on('match:join', (matchId) => {
      socket.join(`match:${matchId}`)
    })

    socket.on('disconnect', () => console.log(`[socket] - ${socket.id}`))
  })
}

export const emit = {
  matchUpdate: (io, _matchId, payload) => io.emit('match:update', payload),
  matchEvent: (io, _matchId, ev) => io.emit('match:event', ev),
  matchPulse: (io, _matchId, zones) => io.emit('match:pulse', zones),
  matchGoal: (io, drop) => io.emit('match:goal', drop),
  predictionNew: (io, p) => io.emit('prediction:new', p),
  predictionResolved: (io, payload) => io.emit('prediction:resolved', payload),
  leaderboardUpdate: (io) => io.emit('leaderboard:update'),
  vaultMinted: (io, record) => io.emit('vault:minted', record),
  vaultSupply: (io, payload) => io.emit('vault:supply_update', payload)
}
