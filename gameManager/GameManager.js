const PlayerModel = require('./PlayerModel');
const Spawner = require('./Spawner');
const levelData = require('../public/assets/level/large_level.json');
const SpawnerType = require('./utils');

export default class GameManager {
  constructor(io) {
    // socket logic connection.
    this.io = io;

    this.spawners = {};
    this.chests = {};
    this.monsters = {};
    this.players = {};

    this.playerLocations = [];
    this.chestLocations = {};
    this.monsterLocations = {};
  }

  setup() {
    this.parseMapData();
    this.setupEventListener();
    this.setupSpawners();
  }

  parseMapData() { // Problemas en el traspaso del mapa!!
    this.levelData = levelData;
    this.levelData.layers.forEach((layer) => {
      if (layer.name === 'player_locations') {
        layer.objects.forEach((obj) => {
          this.playerLocations.push([obj.x, obj.y]);
        });
      } else if (layer.name === 'chest_locations') {
        layer.objects.forEach((obj) => {
          console.log(obj.properties.find((o) => o.value === '1'));
          if (this.chestLocations[obj.properties.spawner]) {
            this.chestLocations[obj.properties.spawner].push([obj.x, obj.y]);
          } else {
            this.chestLocations[obj.properties.spawner] = [[obj.x, obj.y]];
          }
        });
        console.log(this.chestLocations);
      } else if (layer.name === 'monster_locations') {
        layer.objects.forEach((obj) => {
          if (this.monsterLocations[obj.properties.spawner]) {
            this.monsterLocations[obj.properties.spawner].push([obj.x, obj.y]);
          } else {
            this.monsterLocations[obj.properties.spawner] = [[obj.x, obj.y]];
          }
        });
        console.log(this.monsterLocations);
      }
    });
  }

  setupEventListener() {
    // Socket logic.
    this.io.on('connection', (socket) => {
      // Player disconnected.
      socket.on('disconnect', () => {
        // delete user data from server.
        delete this.players[socket.id];

        // emit a message to all players to delete this player.
        this.io.emit('desconectar', socket.id);
      });
      // New Player.
      socket.on('newPlayer', () => {
        // create a new Player
        this.spawnPlayer(socket.id);
        console.log(socket.id);

        // send the players objecto to the new player
        socket.emit('currentPlayers', this.players);

        // send the monsters objecto to the new player
        socket.emit('currentMonsters', this.monsters);

        // send the chests objecto to the new player
        socket.emit('currentChests', this.chests);

        // inform the other players of the new player that joined.
        socket.broadcast.emit('spawnPlayer', this.players[socket.id]);
      });
      // Players move.
      socket.on('playerMovement', (playerData) => {
        if (this.players[socket.id]) {
          this.players[socket.id].x = playerData.x;
          this.players[socket.id].y = playerData.y;
          this.players[socket.id].flipX = playerData.flipX;
          this.players[socket.id].playerAttacking = playerData.playerAttacking;
          this.players[socket.id].currentDirection = playerData.currentDirection;
          // emita a message to all players about the player that move.
          this.io.emit('playerMoved', this.players[socket.id]);
        }
      });

      // player connected to our game.
      console.log('Player connected to our game');
      console.log(socket.id);
    });
  }

  setupSpawners() {
    const config = {
      spawnInterval: 3000,
      limit: 3,
      spawnerType: SpawnerType.CHEST,
      id: '',
    };
    let spawner;

    // create chest spawners
    Object.keys(this.chestLocations).forEach((key) => {
      config.id = `chest-${key}`;
      spawner = new Spawner(
        config,
        this.chestLocations[key],
        this.addChest.bind(this),
        this.deleteChest.bind(this),
      );
      this.spawners[spawner.id] = spawner;
    });

    // create monster spawners
    Object.keys(this.monsterLocations).forEach((key) => {
      config.id = `monster-${key}`;
      config.spawnerType = SpawnerType.MONSTER;

      spawner = new Spawner(
        config,
        this.monsterLocations[key],
        this.addMonster.bind(this),
        this.deleteMonster.bind(this),
        this.moveMonsters.bind(this),
      );
      this.spawners[spawner.id] = spawner;
    });
  }

  // Funciones para Spawner.
  addChest(chestId, chest) {
    console.log('addchest', chestId);
    this.chests[chestId] = chest;
    this.io.emit('chestSpawned', chest);
  }

  deleteChest(chestId) {
    console.log('deleteChest', chestId);
    delete this.chests[chestId];
    this.io.emit('chestRemoved', chestId);
  }

  addMonster(monsterId, monster) {
    console.log('addMonster', monsterId);
    this.monsters[monsterId] = monster;
    this.io.emit('monsterSpawned', monster);
  }

  deleteMonster(monsterId) {
    console.log('deleteMonster', monsterId);
    delete this.monsters[monsterId];
    this.io.emit('monsterRemoved', monsterId);
  }

  moveMonsters() {
    this.io.emit('monsterMovement', this.monsters);
  }

  spawnPlayer(playerId) {
    const player = new PlayerModel(this.playerLocations, playerId);
    this.players[playerId] = player;
  }
}
