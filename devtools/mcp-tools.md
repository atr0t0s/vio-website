# MCP Tools Reference

This page documents every MCP tool exposed by `vio-devtools`. All tools communicate with the running Vio app through the WebSocket bridge and return JSON responses.

## vio_get_state

Get the local state of a component by its instance ID.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `instanceId` | `string` | Yes | Component instance ID (e.g. `"Counter-1"`) |

**Returns:** The component's state as a JSON object.

**Example:**

```json
// Request
{ "instanceId": "Counter-1" }

// Response
{ "count": 42, "label": "My Counter" }
```

---

## vio_set_state

Update the local state of a component by merging a partial state object into the existing state.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `instanceId` | `string` | Yes | Component instance ID |
| `state` | `Record<string, unknown>` | Yes | Partial state to merge |

**Returns:** `{ "success": true }`

**Example:**

```json
// Request
{ "instanceId": "Counter-1", "state": { "count": 100 } }

// Response
{ "success": true }
```

Only the keys provided in `state` are updated. Existing keys not included in the partial object are left unchanged.

---

## vio_get_store

Get the global store state.

**Parameters:** None.

**Returns:** The entire store state as a JSON object.

**Example:**

```json
// Request
{}

// Response
{
  "todos": [
    { "id": 1, "text": "Learn Vio", "done": false }
  ],
  "filter": "all"
}
```

---

## vio_dispatch

Dispatch an action to the global store.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `action` | `string` | Yes | Action name (e.g. `"addTodo"`) |
| `payload` | `unknown` | No | Action payload |

**Returns:** `{ "success": true }`

**Example:**

```json
// Request
{ "action": "addTodo", "payload": { "text": "Build something" } }

// Response
{ "success": true }
```

---

## vio_navigate

Navigate to a route path.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `path` | `string` | Yes | Route path (e.g. `"/dashboard"`) |

**Returns:** `{ "success": true }`

**Example:**

```json
// Request
{ "path": "/settings" }

// Response
{ "success": true }
```

---

## vio_get_component_tree

Get the full component tree with instance IDs, component names, state, and children.

**Parameters:** None.

**Returns:** A tree structure with the following shape:

```ts
{
  id: string
  name: string
  state: Record<string, unknown>
  children: ComponentNode[]
}
```

**Example:**

```json
// Request
{}

// Response
{
  "id": "AppRoot-1",
  "name": "AppRoot",
  "state": {},
  "children": [
    {
      "id": "Header-1",
      "name": "Header",
      "state": { "title": "My App" },
      "children": []
    },
    {
      "id": "TodoList-1",
      "name": "TodoList",
      "state": { "filter": "active" },
      "children": [
        {
          "id": "TodoItem-1",
          "name": "TodoItem",
          "state": { "editing": false },
          "children": []
        }
      ]
    }
  ]
}
```

This is useful for discovering instance IDs to pass to other tools like `vio_get_state` or `vio_set_state`.

---

## vio_get_registered_components

List all registered component names (not instances).

**Parameters:** None.

**Returns:** An array of component name strings.

**Example:**

```json
// Request
{}

// Response
["AppRoot", "Header", "TodoList", "TodoItem", "Footer"]
```

---

## vio_remove_component

Unmount and remove a component by its instance ID.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `instanceId` | `string` | Yes | Component instance ID to remove |

**Returns:** `{ "success": true }`

**Example:**

```json
// Request
{ "instanceId": "TodoItem-3" }

// Response
{ "success": true }
```

::: warning
This permanently removes the component from the tree. Use with care.
:::

---

## vio_batch

Execute multiple operations atomically. This is useful when you need to make several changes that should be applied together.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `operations` | `Operation[]` | Yes | Array of operations to execute |

Each operation has the following shape:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | `"setState" \| "dispatch" \| "removeComponent" \| "navigate"` | Yes | The operation type |
| `target` | `string` | No | Component instance ID or route path |
| `payload` | `unknown` | No | Action-specific payload |

**Returns:** `{ "success": true }`

**Example:**

```json
// Request
{
  "operations": [
    { "action": "setState", "target": "Counter-1", "payload": { "count": 0 } },
    { "action": "dispatch", "target": "resetAll", "payload": null },
    { "action": "navigate", "target": "/home" }
  ]
}

// Response
{ "success": true }
```

The supported actions are:

| Action | `target` | `payload` |
|--------|----------|-----------|
| `setState` | Component instance ID | Partial state object to merge |
| `dispatch` | Action name | Action payload |
| `removeComponent` | Component instance ID | Not used |
| `navigate` | Route path | Not used |

---

## vio_emit

Emit an event on the event bus.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `event` | `string` | Yes | Event type (e.g. `"state:change"`) |
| `payload` | `Record<string, unknown>` | No | Event payload |

**Returns:** `{ "success": true }`

**Example:**

```json
// Request
{ "event": "user:logout", "payload": { "reason": "session_expired" } }

// Response
{ "success": true }
```

---

## vio_get_event_history

Get the recent event bus history. Returns the last 100 events.

**Parameters:** None.

**Returns:** An array of event objects:

```ts
{
  type: string
  payload: Record<string, unknown>
  timestamp: number
}
```

**Example:**

```json
// Request
{}

// Response
[
  {
    "type": "state:change",
    "payload": { "component": "Counter-1", "key": "count" },
    "timestamp": 1709312400000
  },
  {
    "type": "route:change",
    "payload": { "from": "/home", "to": "/settings" },
    "timestamp": 1709312401000
  }
]
```

---

## Error Handling

All tools follow the same error pattern. If an operation fails, the MCP response will include `isError: true` and a text message describing the problem:

```json
{
  "content": [{ "type": "text", "text": "Error: No Vio app connected. Start your app and call connectDevtools(app)." }],
  "isError": true
}
```

Common errors:

| Error | Cause |
|-------|-------|
| `No Vio app connected` | The browser client is not connected to the WebSocket bridge |
| `Timeout: <method> did not respond within 5000ms` | The app did not respond in time |
| `Unknown method: <name>` | The browser client received an unrecognized method name |
