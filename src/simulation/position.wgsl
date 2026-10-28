// the Params struct is added in front of this file (simulation.ts)
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read_write> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> velocities: array<vec4f>;

override WORKGROUP_SIZE: u32; // set in simulation.ts

@compute @workgroup_size(WORKGROUP_SIZE)
fn cs_main(@builtin(global_invocation_id) global_id: vec3u) {
    let id = global_id.x;
    if (id >= params.N) {
        return;
    }
    positions[id] += vec4f(velocities[id].xyz * params.dt, 0.0); // uses the new velocity, w (mass) stays
}
