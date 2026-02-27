# Setup

This page walks through installing `vio-devtools` and connecting it to your Vio application.

## Installation

```bash
npm install vio-devtools
```

## Browser-Side Setup

In your application entry point, import `connectDevtools` from the client subpath and pass your Vio app instance:

```ts
import { createApp } from 'vio'
import { connectDevtools } from 'vio-devtools/client'

const app = createApp({
  // your app config
})

// Connect devtools (only in development)
if (import.meta.env.DEV) {
  connectDevtools(app)
}
```

### Options

`connectDevtools` accepts an optional second argument:

```ts
connectDevtools(app, {
  port: 3100,              // WebSocket port (default: 3100)
  onError: (err) => {      // Custom error handler
    console.warn('Devtools connection failed:', err)
  }
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | `number` | `3100` | Port the WebSocket bridge listens on |
| `onError` | `(err: Event) => void` | Console warning | Called when the WebSocket connection fails |

The function returns a `DevtoolsConnection` object:

```ts
interface DevtoolsConnection {
  disconnect(): void   // Close the WebSocket connection
  readonly ws: WebSocket   // The underlying WebSocket instance
}
```

### Disconnecting

To cleanly shut down the devtools connection:

```ts
const devtools = connectDevtools(app)

// Later, when you want to disconnect
devtools.disconnect()
```

## Server-Side: MCP Configuration

The MCP server runs as a Node.js process and communicates with your AI agent over stdio. Configure it in your project's `.mcp.json` file:

```json
{
  "mcpServers": {
    "vio-devtools": {
      "command": "node",
      "args": ["./node_modules/vio-devtools/dist/cli.js"]
    }
  }
}
```

### Custom Port

To use a port other than the default 3100, set the `VIO_DEVTOOLS_PORT` environment variable:

```json
{
  "mcpServers": {
    "vio-devtools": {
      "command": "node",
      "args": ["./node_modules/vio-devtools/dist/cli.js"],
      "env": {
        "VIO_DEVTOOLS_PORT": "4200"
      }
    }
  }
}
```

Make sure the port matches between the MCP server config and the `connectDevtools` call in your browser code:

```ts
connectDevtools(app, { port: 4200 })
```

## Verifying the Connection

Once both sides are running, you should see the following in the MCP server's stderr output:

```
[vio-devtools] WebSocket server listening on port 3100
[vio-devtools] MCP server connected via stdio
```

If the browser client cannot reach the WebSocket server, you will see a warning in the browser console:

```
[vio-devtools] WebSocket error — is the devtools server running?
```

### Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "No Vio app connected" error from MCP tool | Browser client has not connected | Make sure your app is running and `connectDevtools(app)` has been called |
| WebSocket error in browser console | MCP server is not running | Start the MCP server (your AI client should do this automatically via `.mcp.json`) |
| Timeout errors from MCP tools | App is not responding within 5 seconds | Check that the app is not frozen or blocked; the bridge enforces a 5-second timeout |
| Port conflict | Another process is using port 3100 | Set a different port via `VIO_DEVTOOLS_PORT` and the `port` option |

## Connection Flow

The startup order matters:

1. **Start the MCP server** -- your AI client reads `.mcp.json` and launches the Node.js process, which starts the WebSocket bridge on port 3100
2. **Start your Vio app** -- the browser loads your app and `connectDevtools` opens a WebSocket connection to the bridge
3. **Use MCP tools** -- the AI agent can now call any of the 11 devtools tools

::: tip
The MCP server must be running before the browser client connects. If the browser client starts first, it will fail to connect and log a warning. Simply reload the page once the server is ready.
:::
