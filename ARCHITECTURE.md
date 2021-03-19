# Architecture

The point of this document is to provide you with a high-level mental map of how DesThree works.

## How it works

DesThree unites two large existing projects: [Desmos](https://www.desmos.com/calculator) graphing calculator and [three.js](https://threejs.org/). The difficulty in connecting these two arises from the fact that they are built on different paradigms. Desmos is [Declarative](https://en.wikipedia.org/wiki/Declarative_programming), whereas JavaScript (and three.js) is [Imperative](https://en.wikipedia.org/wiki/Imperative_programming), the key difference being that **order of expressions does not matter in Desmos, but it does in JavaScript**. In Desmos, if you type `y=ax^2` then `a=5`, you expect the first expression to update based on the value of `a`, but JavaScript requires everything to be defined in order. This complicates matters.

Let's take an overview of how DesThree works.

  - The `graphChanged` event (via Desmos API) is activated every time the graph's permanent state changes, mostly changes in the expression text (like `c = Sphere(1)` changing to `c = Sphere(10)`)
  - DesThree looks through all the expressions and filters for those that are marked as relevant by starting with `@3`
  - DesThree parses all the expressions and convert them into a flat form (a "definition") containing one variable set to the result of one DesThree function: `Show(Mesh(Box(u,2,1+2), NormalMaterial()))` becomes equivalent to something like `s=Show(a)`, `a=Mesh(b, c)`, `b=Box(u,2,1+2)`, `c=NormalMaterial()` (Here we're assuming that `u` is defined in a Desmos slider, let's say `u=2.5`). Each definition keeps track of:
    - the variables it defines (`s`, `a`, `b`, or `c`)
    - the function it uses (`Show`, `Mesh`, `Box`, or `NormalMaterial`)
    - the arguments (`a`, `b`, `[u,2,1+2]`, or none)
    - some other details
  - DesThree uses helper expressions (via Desmos API) to determine values such as `u` or `1+2` that Desmos knows how to compute.

### An example

Let's assume we're using the same setup as earlier with `s`, `a`, `b`, and `c`:

Assuming we set the slider `u=2.5`
  - The variable `c` has no arguments, so it is immediately defined. The `NormalMaterial` function creates a three.js material object. Since `c` changed value (to being defined), it updates `a` with this value. At this point, `b` is still not defined, so `a` cannot yet be determined
  - One at a time, the helper expressions for `u`, `2`, and `1+2` resolve to a single value such as `2.5` or `3`. Once all are defined, the variable `b` has enough information to be defined. The `Box` function now creates a three.js geometry object to represent the box (width 2.5, length 2, height 3). Since `b` is now defined, it updates `a` with its value.
  - Now, `a` knows that all of its arguments are resolved, so the `Mesh` function creates a three.js Mesh object that unites the geometry and material together. Since `a` is now defined, it updates `s` with the mesh value
  - The argument `s` is defined, so it places `a`'s Mesh object into three.js's scene
  - The scene is re-rendered

Let's suppose now that the slider for the variable `u` is changed to `u=3.1`
  - The helper expression for `u` informs `b` of this new value, so `b` has to dispose its old geometry and create a *completely new* three.js geometry object to represent the box with its new dimensions
  - The variable `b` tells `a` that its geometry changed, so `a` updates the geometry attribute of its mesh
  - Now the mesh of `a` is changed, so `s` changes the mesh in three.js's scene
  - The scene is re-rendered

Let's suppose now that the slider for the variable `u` is deleted by the user
  - The helper expression for `u` tells `b` that it is undefined, so `b` marks itself as undefined and notifies `a`.
  - `a` can't be defined without a geometry, so it marks itself as undefined
  - `s` can't be defined without the mesh `a` being defined, so it removes the mesh from the three.js scene.
  - The scene is re-rendered

As you can see, the implementation of declarative languages like Desmos/DesThree can get a little confusing, but the hard part (of managing state and everything) is already done in this project. As long as DesThree functions take only numbers (or lists) and have well-defined initialization code, they aren't too hard to modify.

## Project code layout

The `src/` folder contains most of the project code. The entry point is `src/index.js`, which essentially just initializes `CalcThree` once the global `Calc` object is available.

The architecture mirrors the architecture of desmos.com:
 - Just as `Calc` on desmos.com is an instance of `Desmos`, we let `CalcThree` be an instance of `DesThree`. In both cases, these contain all of the state and functions
 - We use the Model-View-Controller architecture
 - The controller (`src/Controller.js` and `src/functions/*`) manages most of the action: processing changes in `Calc` and user inputs to change the model
 - The model (`src/Model.js`) is the internal data structure of the project. When it changes, it notifies the view so that the view can stay updated
 - The view (`src/View.js`) is what interacts directly with the page. It renders all the 3d stuff and messes with the page's DOM

There should be no direct interaction from controller to view without passing through model.

## Build tooling configuration

We use Webpack to produce a single userscript file, which can be directly loaded into Tampermonkey.

See the config in `config/*` and `package.json` scripts.
