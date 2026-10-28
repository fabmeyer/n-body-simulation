// every Body is a round dot facing the camera: one quad (6 vertices) per instance, no vertex buffer

// same layout as camera.ts
struct Camera {
    viewProjection: mat4x4f,
    right: vec4f, // camera x axis in world space, w unused
    up: vec4f, // camera y axis in world space, w unused
}

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<storage, read> positions: array<vec4f>; // read-only, vertex shaders can't write storage

const DOT_RADIUS = 0.1; // a tenth of the Equilibrium distance

struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) corner: vec2f, // -1..1 inside the quad
}

@vertex
fn vs_main(@builtin(vertex_index) vertex: u32, @builtin(instance_index) body: u32) -> VertexOut {
    // two triangles = one quad
    let corners = array(
        vec2f(-1, -1), vec2f(1, -1), vec2f(-1, 1),
        vec2f(-1, 1), vec2f(1, -1), vec2f(1, 1),
    );
    let corner = corners[vertex];
    // move along the camera's right and up, so the quad is always parallel to the screen (billboard)
    // this is the same as adding the offset in camera space after the view transform
    let offset = (camera.right.xyz * corner.x + camera.up.xyz * corner.y) * DOT_RADIUS;

    var out: VertexOut;
    out.position = camera.viewProjection * vec4f(positions[body].xyz + offset, 1.0);
    out.corner = corner;
    return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4f {
    let r2 = dot(in.corner, in.corner);
    if (r2 > 1.0) {
        discard; // cut the quad into a circle
    }
    let shade = 1.0 - 0.4 * r2; // a bit darker towards the edge
    return vec4f(vec3f(0.85, 0.9, 1.0) * shade, 1.0);
}
