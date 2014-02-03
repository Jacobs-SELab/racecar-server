SocketIO communication
======================

Server listens to:
'init' -> {team: ''}

Server emits:
'init_[teamname]' -> {driver: {}, map: [[]]}
'status_[teamname]' -> {position: {x: 22.2, y: 22.2, angle: 22.2}, timePassed: 2222222, speed: 22.2, health: 20}
