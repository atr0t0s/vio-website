# defineComponent

Creates a component definition object from a configuration. This is the standard way to define reusable UI components in Vio.

## Import

```ts
import { defineComponent } from '@atrotos/vio'
```

## Signature

```ts
function defineComponent(def: {
  name: string
  state?: Record<string, unknown>
  render: RenderFunction
  onMount?: (ctx: ComponentContext) => void | (() => void)
  onUpdate?: (ctx: ComponentContext, prevState: Record<string, unknown>) => void
  onUnmount?: (ctx: ComponentContext) => void
}): ComponentDef
```

## Parameters

The function accepts a single configuration object with the following properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Unique name for the component |
| `state` | `Record<string, unknown>` | No | Initial state object (defaults to `{}`) |
| `render` | [`RenderFunction`](#renderfunction) | Yes | Pure function that returns a virtual node descriptor |
| `onMount` | `(ctx: ComponentContext) => void \| (() => void)` | No | Called when the component is mounted to the DOM. May return a cleanup function. |
| `onUpdate` | `(ctx: ComponentContext, prevState: Record<string, unknown>) => void` | No | Called after the component state changes and the DOM is updated |
| `onUnmount` | `(ctx: ComponentContext) => void` | No | Called when the component is removed from the DOM |

## Return Type

Returns a [`ComponentDef`](./types#componentdef) object.

## RenderFunction

```ts
type RenderFunction = (
  state: Record<string, unknown>,
  store?: Record<string, unknown>
) => VioNodeDescriptor
```

The render function receives the component's local state and, optionally, the global store state. It must return a [`VioNodeDescriptor`](./types#vionodedescriptor).

```ts
const Counter = defineComponent({
  name: 'Counter',
  state: { count: 0 },
  render: (state) => ({
    tag: 'div',
    children: [
      { tag: 'span', children: [`Count: ${state.count}`] },
      { tag: 'button', props: { id: 'inc' }, children: ['+'] }
    ]
  })
})
```

## ComponentContext Interface {#componentcontext}

The lifecycle hooks (`onMount`, `onUpdate`, `onUnmount`) receive a `ComponentContext` object that provides methods to interact with the component.

```ts
interface ComponentContext {
  setState: (partial: Record<string, unknown>) => void
  getState: () => Record<string, unknown>
  emit: (event: string, payload?: unknown) => void
  getRef: (name: string) => HTMLElement | null
}
```

### setState(partial)

Merges a partial state into the component's current state and triggers a re-render.

| Parameter | Type | Description |
|-----------|------|-------------|
| `partial` | `Record<string, unknown>` | Key-value pairs to merge into the current state |

```ts
onMount: (ctx) => {
  ctx.setState({ loading: true })
}
```

### getState()

Returns a copy of the component's current state.

```ts
onUpdate: (ctx, prevState) => {
  const current = ctx.getState()
  if (current.count !== prevState.count) {
    console.log('Count changed!')
  }
}
```

### emit(event, payload?)

Emits an event on the application's event bus.

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `string` | Event type |
| `payload` | `unknown` | Optional event data |

```ts
onMount: (ctx) => {
  ctx.emit('counter:ready', { id: 'main-counter' })
}
```

### getRef(name)

Returns a DOM element by its `ref` prop name, or `null` if not found.

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | The ref name to look up |

```ts
onMount: (ctx) => {
  const input = ctx.getRef('search-input')
  if (input) input.focus()
}
```

## ComponentInstance Type {#componentinstance}

When a component is mounted, Vio creates a `ComponentInstance` to track it internally. This type is used primarily by the runtime and devtools.

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
| `def` | `ComponentDef` | The component definition used to create this instance |
| `state` | `Record<string, unknown>` | Current component state |
| `node` | `VioNodeDescriptor \| null` | Last rendered virtual node |
| `element` | `HTMLElement \| null` | DOM element the component is rendered into |
| `cleanup` | `(() => void) \| undefined` | Cleanup function returned by `onMount`, if any |

## Lifecycle Hooks

Components have three lifecycle hooks that run at specific points:

### onMount

Called once after the component is rendered and inserted into the DOM. Use this for setting up event listeners, timers, or fetching data.

If you return a function from `onMount`, it will be called as a cleanup when the component unmounts.

```ts
const Timer = defineComponent({
  name: 'Timer',
  state: { seconds: 0 },
  render: (state) => ({
    tag: 'p',
    children: [`Elapsed: ${state.seconds}s`]
  }),
  onMount: (ctx) => {
    const id = setInterval(() => {
      const { seconds } = ctx.getState() as { seconds: number }
      ctx.setState({ seconds: seconds + 1 })
    }, 1000)

    // Cleanup: stop the timer when the component unmounts
    return () => clearInterval(id)
  }
})
```

### onUpdate

Called after every state change and re-render. Receives the previous state as the second argument.

```ts
const Logger = defineComponent({
  name: 'Logger',
  state: { value: '' },
  render: (state) => ({
    tag: 'input',
    props: { value: state.value }
  }),
  onUpdate: (ctx, prevState) => {
    const current = ctx.getState()
    if (current.value !== prevState.value) {
      ctx.emit('logger:changed', { value: current.value })
    }
  }
})
```

### onUnmount

Called when the component is about to be removed from the DOM. Use this for final cleanup that is not covered by the `onMount` return value.

```ts
const Tracker = defineComponent({
  name: 'Tracker',
  state: {},
  render: () => ({ tag: 'div', children: ['Tracking...'] }),
  onUnmount: (ctx) => {
    ctx.emit('tracker:stopped')
  }
})
```

## Full Example

```ts
import { defineComponent } from '@atrotos/vio'

const TodoList = defineComponent({
  name: 'TodoList',
  state: {
    items: [],
    input: ''
  },
  render: (state) => ({
    tag: 'div',
    children: [
      { tag: 'h2', children: ['Todo List'] },
      {
        tag: 'ul',
        children: (state.items as string[]).map((item) => ({
          tag: 'li',
          children: [item]
        }))
      },
      { tag: 'input', props: { id: 'todo-input', value: state.input } },
      { tag: 'button', props: { id: 'add-btn' }, children: ['Add'] }
    ]
  }),
  onMount: (ctx) => {
    ctx.emit('todo:mounted')
  },
  onUpdate: (ctx, prevState) => {
    const current = ctx.getState()
    if ((current.items as string[]).length !== (prevState.items as string[]).length) {
      ctx.emit('todo:changed', { count: (current.items as string[]).length })
    }
  }
})
```

## Related

- [ComponentDef type](./types#componentdef)
- [ComponentContext type](./types#componentcontext)
- [ComponentInstance type](./types#componentinstance)
- [Components guide](/guide/components)
- [createApp](./create-app)
