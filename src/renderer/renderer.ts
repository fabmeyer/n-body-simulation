import bodiesWgsl from './bodies.wgsl?raw';
import {createCamera} from './camera.ts';
import type {CreateRenderer} from '../shared/contract.ts';

const CLEAR_COLOR = {r: 0.067, g: 0.067, b: 0.067, a: 1}; // same as the page background (#111)
const DEPTH_FORMAT: GPUTextureFormat = 'depth24plus';

export const createRenderer: CreateRenderer = (device, format, canvas, buffers) => {
    const module = device.createShaderModule({code: bodiesWgsl});
    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {module, entryPoint: 'vs_main'},
        fragment: {module, entryPoint: 'fs_main', targets: [{format}]},
        primitive: {topology: 'triangle-list'},
        // near Bodies cover far ones, independent of the draw order
        depthStencil: {format: DEPTH_FORMAT, depthWriteEnabled: true, depthCompare: 'less'},
    });

    const camera = createCamera(device);
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: {buffer: camera.buffer}},
            {binding: 1, resource: {buffer: buffers.positions}},
        ],
    });

    // the depth texture and the aspect ratio follow the canvas, which changes size on resize
    let depthTexture: GPUTexture | undefined;
    function fitCanvasSize(): GPUTexture {
        if (depthTexture && depthTexture.width === canvas.width && depthTexture.height === canvas.height) {
            return depthTexture;
        }
        depthTexture?.destroy();
        depthTexture = device.createTexture({
            size: [canvas.width, canvas.height],
            format: DEPTH_FORMAT,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        camera.setAspect(canvas.width / canvas.height);
        return depthTexture;
    }

    return {
        recordDraw(encoder, target) {
            const depth = fitCanvasSize();
            const pass = encoder.beginRenderPass({
                colorAttachments: [{view: target, clearValue: CLEAR_COLOR, loadOp: 'clear', storeOp: 'store'}],
                depthStencilAttachment: {view: depth.createView(), depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'store'},
            });
            pass.setPipeline(pipeline);
            pass.setBindGroup(0, bindGroup);
            pass.draw(6, buffers.n); // 6 vertices = one quad, one instance per Body
            pass.end();
        },
    };
};
