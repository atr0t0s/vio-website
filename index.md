---
layout: home
hero:
  name: Vio
  text: The AI-Agent-First Frontend Framework
  tagline: Pure JSON components. Immutable state. Full observability. MCP-ready.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/atr0t0s/vio
features:
  - icon: "{ }"
    title: JSON-to-DOM
    details: Components return pure data structures — no JSX, no templates. Every component tree is a plain JSON object that can be serialized, logged, or sent over the wire.
  - icon: "fn"
    title: Immutable State
    details: All state changes are functional transformations. Local component state and global store both use pure reducer patterns with no mutations.
  - icon: "~>"
    title: Event Bus
    details: Every mutation flows through an observable event stream. Subscribe to state changes, route transitions, component lifecycle, and custom events. Full history tracking.
  - icon: "#/"
    title: Routing
    details: Hash-based routing with parameterized paths, query string parsing, and route guards. Conditional access control backed by store state.
  - icon: "AI"
    title: MCP Devtools
    details: Control your running app from any AI agent via Model Context Protocol. Inspect state, dispatch actions, navigate, and batch operations — all through MCP tools.
  - icon: "<>"
    title: Components
    details: Define components with pure render functions, local state, and lifecycle hooks. Mount, update, and unmount with full programmatic control.
  - icon: "[]"
    title: Forms
    details: Declarative form definitions with field validation, auto-generated HTML, and programmatic value access. Create forms from config, render as component trees.
  - icon: "|>"
    title: Batch Operations
    details: Execute multiple operations atomically — setState, dispatch, navigate, add or remove components in a single call. Designed for AI agent workflows.
---
