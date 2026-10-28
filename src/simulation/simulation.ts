import paramsWgsl from '../shared/params.wgsl?raw';
import forceWgsl from './force.wgsl?raw';
import positionWgsl from './position.wgsl?raw';
import type {CreateSimulation} from '../shared/contract.ts';

// the only place the workgroup size is set, both shaders get it as an override constant
const WORKGROUP_SIZE = 64;

export const createSimulation: CreateSimulation = (device, buffers) => {
    // ?raw doesn't resolve #include, so the Params struct is just put in front
    const forceModule = device.createShaderModule({code: paramsWgsl + forceWgsl});
    const positionModule = device.createShaderModule({code: paramsWgsl + positionWgsl});

    const forcePipeline = device.createComputePipeline({
        layout: 'auto',
        compute: {module: forceModule, entryPoint: 'cs_main', constants: {WORKGROUP_SIZE}},
    });
    const positionPipeline = device.createComputePipeline({
        layout: 'auto',
        compute: {module: positionModule, entryPoint: 'cs_main', constants: {WORKGROUP_SIZE}},
    });

    const entries = [
        {binding: 0, resource: {buffer: buffers.params}},
        {binding: 1, resource: {buffer: buffers.positions}},
        {binding: 2, resource: {buffer: buffers.velocities}},
    ];
    // the 'auto' layouts of the two pipelines differ, so two bind groups
    const forceBindGroup = device.createBindGroup({layout: forcePipeline.getBindGroupLayout(0), entries});
    const positionBindGroup = device.createBindGroup({layout: positionPipeline.getBindGroupLayout(0), entries});

    const workgroups = Math.ceil(buffers.n / WORKGROUP_SIZE);

    return {
        recordStep(encoder) {
            const computePass = encoder.beginComputePass();
            computePass.setPipeline(forcePipeline);
            computePass.setBindGroup(0, forceBindGroup);
            computePass.dispatchWorkgroups(workgroups);
            computePass.setPipeline(positionPipeline); // after the force pass, so positions use the new velocities
            computePass.setBindGroup(0, positionBindGroup);
            computePass.dispatchWorkgroups(workgroups);
            computePass.end();
        },
    };
};
