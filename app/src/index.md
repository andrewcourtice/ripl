---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Ripl"
  text: "One API. Any Context."
  tagline: "A unified API for drawing abstract shapes to different contexts"
  actions:
    - theme: brand
      text: Get Started
      link: /docs/core/getting-started/installation
    - theme: alt
      text: Charts
      link: /docs/charts/
    - theme: alt
      text: 3D
      link: /docs/3d/
    - theme: alt
      text: Demos
      link: /demos/

features:
  - title: Simple
    details: Ripl provides a simple API for drawing to multiple contexts. It also emulates DOM features that most devs will be familiar with such as heirarchy, events, styling and querying.
  - title: Modular
    details: Ripl is designed to be as modular as possible while still maintaining a sensible set of core functionality. Don't ship what you don't use.
  - title: Performant
    details: Ripl uses concepts such as hoisted scene buffers and virtual DOM trees (svg) to accurately render between multiple contexts at high speed.
---

