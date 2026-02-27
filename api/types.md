# Types

Complete reference for all TypeScript types exported by Vio.

## Import

All types are available as named exports from the `vio` package:

```ts
import type {
  VioNodeDescriptor,
  VioChild,
  ComponentDef,
  ComponentContext,
  ComponentInstance,
  Route,
  StoreConfig,
  AppConfig,
  VioEvent,
  VioEventType,
  BatchOperation,
} from 'vio'

import type { VioApp } from 'vio'
import type { VioForm } from 'vio'
import type { RouteMatch } from 'vio'
```

---

## VioNodeDescriptor {#vionodedescriptor}

Describes a virtual DOM node in Vio's rendering system.

```ts
interface VioNodeDescriptor {
  tag: string | RenderFunction | ComponentDef
  props?: Record<string, unknown>
  children?: VioChild[]
  key?: string | number
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `tag` | `string \| RenderFunction \| ComponentDef` | Yes | HTML tag name, a render function, or a component definition |
| `props` | `Record<string, unknown>` | No | Element attributes and properties |
| `children` | `VioChild[]` | No | Child nodes |
| `key` | `string \| number` | No | Unique key for efficient diffing |

```ts
const node: VioNodeDescriptor = {
  tag: 'div',
  props: { class: 'container', id: 'main' },
  children: [
    { tag: 'h1', children: ['Hello'] },
    { tag: 'p', children: ['Welcome to Vio'] }
  ]
}
```

---

## VioChild {#viochild}

A union type representing any valid child of a `VioNodeDescriptor`.

```ts
type VioChild = VioNodeDescriptor | string | number | boolean | null | undefined
```

Strings and numbers are rendered as text nodes. `boolean`, `null`, and `undefined` are ignored during rendering.

---

## RenderFunction {#renderfunction}

The function signature for a component's render method.

```ts
type RenderFunction = (
  state: Record<string, unknown>,
  store?: Record<string, unknown>
) => VioNodeDescriptor
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | `Record<string, unknown>` | The component's local state |
| `store` | `Record<string, unknown>` | The global store state (if a store is configured) |

---

## ComponentDef {#componentdef}

Defines the shape and behavior of a component.

```ts
interface ComponentDef {
  name: string
  state?: Record<string, unknown>
  render: RenderFunction
  onMount?: (ctx: ComponentContext) => void | (() => void)
  onUpdate?: (ctx: ComponentContext, prevState: Record<string, unknown>) => void
  onUnmount?: (ctx: ComponentContext) => void
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Unique component name |
| `state` | `Record<string, unknown>` | No | Initial state |
| `render` | `RenderFunction` | Yes | Render function returning a virtual node |
| `onMount` | `(ctx: ComponentContext) => void \| (() => void)` | No | Called after mount; may return cleanup function |
| `onUpdate` | `(ctx: ComponentContext, prevState) => void` | No | Called after state changes |
| `onUnmount` | `(ctx: ComponentContext) => void` | No | Called before removal |

See: [defineComponent](./define-component)

---

## ComponentContext {#componentcontext}

Passed to lifecycle hooks, providing methods to interact with the component.

```ts
interface ComponentContext {
  setState: (partial: Record<string, unknown>) => void
  getState: () => Record<string, unknown>
  emit: (event: string, payload?: unknown) => void
  getRef: (name: string) => HTMLElement | null
}
```

| Method | Description |
|--------|-------------|
| `setState(partial)` | Merge partial state and trigger re-render |
| `getState()` | Get a copy of current state |
| `emit(event, payload?)` | Emit an event on the application event bus |
| `getRef(name)` | Get a DOM element by ref name |

See: [defineComponent - ComponentContext](./define-component#componentcontext)

---

## ComponentInstance {#componentinstance}

Represents a mounted component tracked by the runtime.

```ts
interface ComponentInstance {
  id: string
  def: ComponentDef
  state: Record<string, unknown>
  node: VioNodeDescriptor | null
  element: HTMLElement | null
  cleanup?: () => void
}
```

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Auto-generated unique instance ID |
| `def` | `ComponentDef` | The component definition |
| `state` | `Record<string, unknown>` | Current state |
| `node` | `VioNodeDescriptor \| null` | Last rendered virtual node |
| `element` | `HTMLElement \| null` | The component's DOM element |
| `cleanup` | `(() => void) \| undefined` | Cleanup function from `onMount` |

See: [defineComponent - ComponentInstance](./define-component#componentinstance)

---

## Route {#route}

Defines a route mapping between a URL path and a component.

```ts
interface Route {
  path: string
  component: ComponentDef
  guard?: (store: Record<string, unknown>) => boolean
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `path` | `string` | Yes | URL pattern (supports `:param` dynamic segments and `*` wildcard) |
| `component` | `ComponentDef` | Yes | Component to render when matched |
| `guard` | `(store) => boolean` | No | Guard function; returns `false` to skip this route |

See: [Router](./router)

---

## RouteMatch {#routematch}

Returned by the router when a path matches a route.

```ts
interface RouteMatch {
  component: ComponentDef
  params: Record<string, string>
  path: string
  query: Record<string, string>
}
```

| Property | Type | Description |
|----------|------|-------------|
| `component` | `ComponentDef` | The matched component |
| `params` | `Record<string, string>` | Dynamic path parameters |
| `path` | `string` | The matched pathname |
| `query` | `Record<string, string>` | Parsed query string parameters |

See: [Router](./router)

---

## StoreConfig {#storeconfig}

Configuration for the global store.

```ts
interface StoreConfig {
  state: Record<string, unknown>
  actions: Record<string, StoreAction>
}

interface StoreAction {
  (state: Record<string, unknown>, payload?: unknown): Record<string, unknown>
}
```

| Property | Type | Description |
|----------|------|-------------|
| `state` | `Record<string, unknown>` | Initial store state |
| `actions` | `Record<string, StoreAction>` | Map of action name to handler. Each handler receives the current state and optional payload, and returns the new state. |

See: [Store](./store)

---

## AppConfig {#appconfig}

Configuration passed to [`createApp`](./create-app).

```ts
interface AppConfig {
  root: string | HTMLElement
  routes?: Route[]
  store?: StoreConfig
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `root` | `string \| HTMLElement` | Yes | CSS selector or DOM element to mount the app into |
| `routes` | `Route[]` | No | Route definitions for client-side routing |
| `store` | `StoreConfig` | No | Global store configuration |

See: [createApp](./create-app)

---

## VioEvent {#vioevent}

Represents an event emitted on the event bus.

```ts
interface VioEvent {
  type: VioEventType | string
  payload: Record<string, unknown>
  timestamp: number
}
```

| Property | Type | Description |
|----------|------|-------------|
| `type` | `VioEventType \| string` | Event type (built-in or custom) |
| `payload` | `Record<string, unknown>` | Event data |
| `timestamp` | `number` | Unix timestamp in milliseconds (`Date.now()`) |

See: [EventBus](./event-bus)

---

## VioEventType {#vioeventtype}

A union of all built-in event type strings.

```ts
type VioEventType =
  | 'state:change'
  | 'store:change'
  | 'component:mount'
  | 'component:update'
  | 'component:unmount'
  | 'route:before'
  | 'route:change'
  | 'route:after'
  | 'batch:start'
  | 'batch:end'
```

| Value | Source | Description |
|-------|--------|-------------|
| `state:change` | Renderer | Component state was updated |
| `store:change` | Store | Global store state changed via dispatch |
| `component:mount` | Renderer | A component was mounted to the DOM |
| `component:update` | Renderer | A component was re-rendered |
| `component:unmount` | Renderer | A component was removed from the DOM |
| `route:before` | Router | Before a route change |
| `route:change` | Router | Route has changed |
| `route:after` | Router | After a route change |
| `batch:start` | App | A batch operation started |
| `batch:end` | App | A batch operation completed |

See: [EventBus](./event-bus)

---

## BatchOperation {#batchoperation}

Describes a single operation within a batch call.

```ts
interface BatchOperation {
  action: 'setState' | 'addComponent' | 'removeComponent' | 'updateProps' | 'dispatch' | 'navigate'
  target?: string
  payload?: unknown
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `action` | `string` | Yes | The operation type |
| `target` | `string` | No | Instance ID or path, depending on the action |
| `payload` | `unknown` | No | Data for the operation |

### Supported Actions

| Action | `target` | `payload` | Description |
|--------|----------|-----------|-------------|
| `setState` | Instance ID | `Record<string, unknown>` | Merge state into a component |
| `dispatch` | -- | `{ action: string, value?: unknown }` | Dispatch a store action |
| `removeComponent` | Instance ID | -- | Unmount a component |
| `navigate` | Path string | -- | Navigate to a route |
| `addComponent` | -- | -- | Reserved for future use |
| `updateProps` | -- | -- | Reserved for future use |

See: [createApp - batch](./create-app#batch-ops), [Batch Operations guide](/guide/batch-operations)

---

## VioForm {#vioform}

Interface for form objects returned by [`createForm`](./forms).

```ts
interface VioForm {
  getValues(): Record<string, unknown>
  setValue(field: string, value: unknown): void
  validate(): Record<string, string | null>
  isValid(): boolean
  reset(): void
  toNodeDescriptor(): VioNodeDescriptor
}
```

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getValues()` | `Record<string, unknown>` | Get all current field values |
| `setValue(field, value)` | `void` | Set a field value |
| `validate()` | `Record<string, string \| null>` | Run all validators; returns errors map |
| `isValid()` | `boolean` | `true` if all fields pass validation |
| `reset()` | `void` | Reset all fields to initial values |
| `toNodeDescriptor()` | `VioNodeDescriptor` | Generate a form node descriptor |

See: [Forms](./forms)

---

## FormConfig {#formconfig}

Configuration for [`createForm`](./forms).

```ts
interface FormConfig {
  fields: Record<string, FieldDef>
  onSubmit?: (values: Record<string, unknown>) => void
}
```

See: [Forms](./forms)

---

## FieldDef {#fielddef}

Defines a single form field.

```ts
interface FieldDef {
  initial: unknown
  validate?: (value: unknown) => string | null
  label?: string
  type?: string
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `initial` | `unknown` | Yes | Initial value |
| `validate` | `(value: unknown) => string \| null` | No | Validation function; return `null` for valid or an error message |
| `label` | `string` | No | Display label |
| `type` | `string` | No | HTML input type (defaults to `'text'`) |

See: [Forms](./forms)

---

## HttpResponse {#httpresponse}

Response object returned by all `HttpClient` methods.

```ts
interface HttpResponse<T = unknown> {
  data: T
  status: number
  headers: Headers
}
```

| Property | Type | Description |
|----------|------|-------------|
| `data` | `T` | Parsed response body |
| `status` | `number` | HTTP status code |
| `headers` | `Headers` | Standard `Headers` object |

See: [HttpClient](./http-client)
