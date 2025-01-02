# Game Server Config

These allow you to configure the game server.

The config is set up using [node-config](https://github.com/node-config/node-config).

## `local.json`

```json
{
  "gameServer": {
    "id": "A unique ID for the game server"
  },
  "jwt": {
    "secret": "The same secret that the central server has"
  }
}
```
