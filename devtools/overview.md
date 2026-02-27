# Devtools Overview

Vio Devtools is an MCP (Model Context Protocol) integration that exposes a running Vio application to AI agents. Any MCP-compatible client -- such as Claude Desktop, Cursor, or Claude Code -- can inspect component trees, read and write state, dispatch store actions, navigate routes, and more, all while your app is running in the browser.

## Why Devtools?

Traditional browser devtools are designed for humans. Vio Devtools is designed for AI agents. Instead of clicking through panels, an agent calls structured MCP tools to understand and control your application programmatically. This enables workflows like:

- **AI-assisted debugging** -- an agent inspects component state and event history to diagnose issues
- **Automated testing** -- an agent navigates routes, dispatches actions, and asserts on state
- **Live prototyping** -- an agent modifies component state in real time to explore UI variations

## Architecture

Vio Devtools consists of three layers connected in a pipeline:

```
┌──────────────┐       stdio        ┌──────────────┐    WebSocket     ┌──────────────┐
│              │ ◄────────────────► │              │ ◄──────────────► │              │
│   AI Agent   │                    │  MCP Server  │    port 3100     │   Browser    │
│  (Claude,    │   MCP Protocol     │  (Node.js)   │                  │   Client     │
│   Cursor)    │                    │              │                  │  (Vio App)   │
│              │ ◄────────────────► │              │ ◄──────────────► │              │
└──────────────┘                    └──────────────┘                  └──────────────┘
```

### MCP Server (stdio)

The MCP server is a Node.js process that communicates with the AI agent over standard input/output using the Model Context Protocol. It registers 11 tools that map to Vio app operations. When the agent calls a tool, the server forwards the request over WebSocket to the browser client and returns the response.

### WebSocket Bridge

The bridge is a `WebSocketServer` running on port 3100 (configurable via the `VIO_DEVTOOLS_PORT` environment variable). It accepts a single browser client connection at a time. Each MCP tool call is serialized as a JSON-RPC-style message with an auto-incrementing `id`, `method`, and `params`. The bridge enforces a 5-second timeout per call.

### Browser Client

The browser client is a lightweight WebSocket connection embedded in your Vio app. When it receives a request from the bridge, it calls the corresponding method on the Vio app instance (e.g., `app.getState()`, `app.dispatch()`) and sends the result back. No UI is rendered -- it is purely a programmatic interface.

## Request Lifecycle

1. The AI agent calls an MCP tool, for example `vio_get_state({ instanceId: "Counter-1" })`
2. The MCP server receives the call and forwards it to the WebSocket bridge
3. The bridge sends a JSON message to the connected browser client: `{ id: 1, method: "getState", params: { instanceId: "Counter-1" } }`
4. The browser client calls `app.getState("Counter-1")` and sends back: `{ id: 1, result: { count: 42 } }`
5. The bridge resolves the pending call and the MCP server returns the result to the agent

## Available Tools

Vio Devtools exposes 11 MCP tools:

| Tool | Description |
|------|-------------|
| `vio_get_state` | Get component local state |
| `vio_set_state` | Merge partial state into a component |
| `vio_get_store` | Read the global store |
| `vio_dispatch` | Dispatch an action to the store |
| `vio_navigate` | Navigate to a route |
| `vio_get_component_tree` | Get the full component tree |
| `vio_get_registered_components` | List registered component names |
| `vio_remove_component` | Unmount a component |
| `vio_batch` | Execute multiple operations atomically |
| `vio_emit` | Emit an event on the event bus |
| `vio_get_event_history` | Get the last 100 events |

See the [MCP Tools Reference](./mcp-tools) for full parameter and return type documentation.

## Next Steps

- [Setup](./setup) -- install and configure devtools in your project
- [MCP Tools Reference](./mcp-tools) -- detailed documentation for every tool
