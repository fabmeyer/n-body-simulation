// debugging tool: copy a GPU buffer into a MAP_READ buffer and read it on the CPU
// the source buffer needs COPY_SRC (positions and velocities have it)

// maps a MAP_READ buffer that is already filled (or will be by submitted work) and returns a copy
export async function readMapped(staging: GPUBuffer): Promise<Float32Array> {
    await staging.mapAsync(GPUMapMode.READ);
    const data = new Float32Array(staging.getMappedRange().slice(0)); // copy, the mapped range is gone after unmap
    staging.unmap();
    return data;
}

export async function readBuffer(device: GPUDevice, source: GPUBuffer): Promise<Float32Array> {
    const staging = device.createBuffer({size: source.size, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ});
    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(source, 0, staging, 0, source.size);
    device.queue.submit([encoder.finish()]);
    const data = await readMapped(staging);
    staging.destroy();
    return data;
}
