// shared by all shaders, params.ts reads the layout from here
struct Params {
    G: f32,
    K: f32,
    softening: f32, // must be > 0, otherwise NaN
    dt: f32,
    N: u32,
}
