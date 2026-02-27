# Routing

Vio includes a built-in hash-based router. Routes map URL paths to components, support dynamic parameters and query strings, and can be protected with guard functions.

## Defining Routes

A route is an object with a `path` and a `component`. Optionally, add a `guard` function for access control.

```typescript
import { createApp, defineComponent } from '@atrotos/vio'

const Home = defineComponent({
  name: 'Home',
  render() {
    return { tag: 'h1', children: ['Home Page'] }
  }
})

const About = defineComponent({
  name: 'About',
  render() {
    return { tag: 'h1', children: ['About Page'] }
  }
})

const app = createApp({
  root: '#app',
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]
})

app.mount()
```

Routes are matched in order. The first route whose pattern matches the current path wins. If no route matches, `navigate` returns `null` and the page stays on the current route.

### Route Interface

```typescript
interface Route {
  path: string
  component: ComponentDef
  guard?: (storeState: Record<string, unknown>) => boolean
}
```

## Hash-Based Routing

Vio uses **hash-based URLs**. The path portion comes after the `#` in the URL:

```
https://myapp.com/#/           → matches "/"
https://myapp.com/#/about      → matches "/about"
https://myapp.com/#/users/42   → matches "/users/:id"
```

When `app.mount()` is called, Vio reads the current `window.location.hash` and navigates to the matching route. It also listens for the browser's `hashchange` event, so the back/forward buttons work automatically.

::: tip
Hash-based routing works with static file hosts (GitHub Pages, S3, Netlify) without any server configuration. No rewrite rules needed.
:::

## Route Parameters

Use the `:param` syntax to define dynamic segments. Parameters are extracted and made available on the route match.

```typescript
const UserProfile = defineComponent({
  name: 'UserProfile',
  state: {},
  render(state) {
    return {
      tag: 'div',
      children: [
        { tag: 'h1', children: ['User Profile'] },
        { tag: 'p', children: [`User ID: ${state.userId ?? 'unknown'}`] }
      ]
    }
  }
})

const routes = [
  { path: '/', component: Home },
  { path: '/users/:id', component: UserProfile },
  { path: '/posts/:category/:slug', component: PostPage }
]
```

When navigating to `/users/42`, the router produces a `RouteMatch` with:

```typescript
{
  component: UserProfile,
  params: { id: '42' },
  path: '/users/42',
  query: {}
}
```

Multiple parameters work the same way. Navigating to `/posts/tech/my-article` produces:

```typescript
{
  params: { category: 'tech', slug: 'my-article' }
}
```

### RouteMatch Interface

```typescript
interface RouteMatch {
  component: ComponentDef
  params: Record<string, string>
  path: string
  query: Record<string, string>
}
```

::: warning
Route parameters are always strings. If you need a number, parse it yourself: `Number(params.id)`.
:::

## Query Strings

Query strings are parsed automatically from the URL and included in the route match.

```
#/search?q=vio&page=2
```

Produces:

```typescript
{
  path: '/search',
  params: {},
  query: { q: 'vio', page: '2' }
}
```

Both keys and values are `decodeURIComponent`-decoded. Query parameters are always strings, like route params.

## Route Guards

Guards are functions that control access to a route. A guard receives the current **store state** and returns `true` to allow navigation or `false` to deny it.

```typescript
const store = {
  state: {
    user: null,
    isAdmin: false
  },
  actions: {
    login(state, user) {
      return { ...state, user, isAdmin: user.role === 'admin' }
    },
    logout(state) {
      return { ...state, user: null, isAdmin: false }
    }
  }
}

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: LoginPage },
  {
    path: '/dashboard',
    component: Dashboard,
    guard: (storeState) => storeState.user !== null
  },
  {
    path: '/admin',
    component: AdminPanel,
    guard: (storeState) => storeState.isAdmin === true
  }
]

const app = createApp({ root: '#app', store, routes })
app.mount()
```

When a guard returns `false`, the router skips that route and continues checking subsequent routes. If no route matches (all guards fail and no unguarded fallback exists), navigation produces `null`.

::: tip
Guards require a store to be configured. If no store is provided to `createApp`, guard functions are not evaluated and the route matches based on path alone.
:::

### Wildcard Catch-All Route

Use `*` as the path to create a catch-all route for 404 pages:

```typescript
const NotFound = defineComponent({
  name: 'NotFound',
  render() {
    return {
      tag: 'div',
      children: [
        { tag: 'h1', children: ['404'] },
        { tag: 'p', children: ['Page not found'] }
      ]
    }
  }
})

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '*', component: NotFound }  // catches everything else
]
```

The wildcard route can also have a guard. Place it last in the array since routes are matched in order.

## Programmatic Navigation

Navigate from code using `app.navigate()`:

```typescript
// Navigate to a path
app.navigate('/about')
app.navigate('/users/42')
app.navigate('/search?q=vio')
```

`navigate` does two things:

1. Updates `window.location.hash` to `#/path`
2. Resolves the route and mounts the matched component

The previous component is automatically unmounted and the new one is mounted in its place.

::: warning
If no routes are configured, calling `app.navigate()` throws an error: `"No routes configured"`.
:::

## Route Events

Every navigation emits three events on the event bus, in order:

### `route:before`

Emitted before the route change takes effect.

```typescript
app.on('route:before', (event) => {
  console.log('Leaving:', event.payload.from)  // previous path or null
  console.log('Going to:', event.payload.to)   // target path
})
```

### `route:change`

Emitted after the route has been resolved and the new component is about to mount.

```typescript
app.on('route:change', (event) => {
  console.log('From:', event.payload.from)
  console.log('To:', event.payload.to)
  console.log('Params:', event.payload.params)
})
```

### `route:after`

Emitted after the navigation is complete.

```typescript
app.on('route:after', (event) => {
  console.log('Now at:', event.payload.path)
  console.log('Params:', event.payload.params)
})
```

All event handlers receive a `VioEvent` object with `type`, `payload`, and `timestamp`.

## Complete Example

Here is a full routing example with authentication:

```typescript
import { createApp, defineComponent } from '@atrotos/vio'

// --- Components ---

const LoginPage = defineComponent({
  name: 'LoginPage',
  render() {
    return {
      tag: 'div',
      children: [
        { tag: 'h1', children: ['Login'] },
        { tag: 'button', children: ['Sign In'] }
      ]
    }
  }
})

const Dashboard = defineComponent({
  name: 'Dashboard',
  render(state, storeState) {
    const user = storeState?.user as { name: string } | null
    return {
      tag: 'div',
      children: [
        { tag: 'h1', children: [`Welcome, ${user?.name ?? 'User'}`] },
        { tag: 'a', props: { href: '#/settings' }, children: ['Settings'] }
      ]
    }
  }
})

const Settings = defineComponent({
  name: 'Settings',
  render() {
    return { tag: 'h1', children: ['Settings'] }
  }
})

const NotFound = defineComponent({
  name: 'NotFound',
  render() {
    return {
      tag: 'div',
      children: [
        { tag: 'h1', children: ['404 — Not Found'] },
        { tag: 'a', props: { href: '#/' }, children: ['Go Home'] }
      ]
    }
  }
})

// --- Store ---

const store = {
  state: { user: null },
  actions: {
    login(state, user) {
      return { ...state, user }
    },
    logout(state) {
      return { ...state, user: null }
    }
  }
}

// --- Routes ---

const isLoggedIn = (storeState) => storeState.user !== null

const routes = [
  { path: '/', component: LoginPage },
  { path: '/dashboard', component: Dashboard, guard: isLoggedIn },
  { path: '/settings', component: Settings, guard: isLoggedIn },
  { path: '*', component: NotFound }
]

// --- App ---

const app = createApp({ root: '#app', store, routes })

// Log all route changes
app.on('route:change', (event) => {
  console.log(`Navigated: ${event.payload.from} → ${event.payload.to}`)
})

app.mount()

// Simulate login, then navigate
app.dispatch('login', { name: 'Alice' })
app.navigate('/dashboard')
```
