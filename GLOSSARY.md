# N-Body Simulation

A real-time, time-discrete 3D n-body simulation that runs entirely in the browser on the GPU.

## Language

### Physics

**Body**:
A single simulated point mass with a position and a velocity.
_Avoid_: Particle, point, star

**Attraction**:
The force pulling every pair of Bodies together; it dominates at large separations (far-field).
_Avoid_: Gravity (unless it is exactly Newtonian), pull

**Repulsion**:
The force pushing every pair of Bodies apart; it dominates at small separations (near-field).
_Avoid_: Collision, push, pressure

**Equilibrium distance**:
The separation r₀ at which Attraction and Repulsion between two Bodies cancel out.
_Avoid_: Rest length, radius

**Softening**:
A small length ε added to every separation so the forces stay finite when two Bodies get very close.
_Avoid_: Epsilon (in prose), smoothing

**Initial conditions**:
The positions and velocities of all Bodies before the first Step.
_Avoid_: Setup, scene, seed

**Step**:
One advance of every Body by a fixed time interval `dt`; the Simulation moves forward only in Steps.
_Avoid_: Tick, frame, iteration

**Parameters**:
The user-tunable constants that shape the Simulation: the strengths of Attraction and Repulsion, the Softening, `dt`, and the number of Bodies.
_Avoid_: Config, settings, constants, uniforms

### System

**Simulation**:
The part of the system that advances the state of all bodies through time.
_Avoid_: Backend, physics engine

**Renderer**:
The part of the system that draws the current positions of all Bodies to the screen.
_Avoid_: Frontend, view
