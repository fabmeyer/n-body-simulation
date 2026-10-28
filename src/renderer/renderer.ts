import bodiesWgsl from './bodies.wgsl?raw';
import {createCamera} from './camera.ts';
import type {CreateRenderer} from '../shared/contract.ts';
import type {BodyBuffers} from '../shared/buffers.ts';
import {initialRadius} from '../shared/initial-radius.ts';

const CLEAR_COLOR = {r: 0.067, g: 0.067, b: 0.067, a: 1}; // same as the page background (#111)
const DEPTH_FORMAT: GPUTextureFormat = 'depth24plus';

export const createRenderer: CreateRenderer = (device, format, canvas, initialBuffers) => {
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
    // the bind group points at the positions buffer, so it is made again when the buffers change
    function bindBuffers(buffers: BodyBuffers) {
        return {
            bindGroup: device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    {binding: 0, resource: {buffer: camera.buffer}},
                    {binding: 1, resource: {buffer: buffers.positions}},
                ],
            }),
            instances: buffers.n,
        };
    }
    let bound = bindBuffers(initialBuffers);
    camera.frameSphere(initialRadius(initialBuffers.n));

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
        setBuffers(buffers) {
            bound = bindBuffers(buffers);
            camera.frameSphere(initialRadius(buffers.n)); // the starting sphere grows with N
        },
        recordDraw(encoder, target) {
            const depth = fitCanvasSize();
            const pass = encoder.beginRenderPass({
                colorAttachments: [{view: target, clearValue: CLEAR_COLOR, loadOp: 'clear', storeOp: 'store'}],
                depthStencilAttachment: {view: depth.createView(), depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'store'},
            });
            pass.setPipeline(pipeline);
            pass.setBindGroup(0, bound.bindGroup);
            pass.draw(6, bound.instances); // 6 vertices = one quad, one instance per Body
            pass.end();
        },
    };
};
