// the Params struct is added in front of this file (simulation.ts)
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> velocities: array<vec4f>;

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) id_a: vec3u) {
    let id = id_a.x;
    if (id >= params.N) {
        return;
    }
    let xi = positions[id].xyz;
    var a = vec3f(0.0);
    // j == id adds nothing because d is 0
    for (var j = 0u; j < params.N; j++) {
        let d = positions[j].xyz - xi;
        let s = sqrt(dot(d, d) + params.softening * params.softening);
        let s3 = s * s * s;
        a += positions[j].w * (params.G / s3 - params.K / (s3 * s * s)) * d; // G pulls, K pushes
    }
    velocities[id] = vec4f(velocities[id].xyz + a * params.dt, velocities[id].w);
}
