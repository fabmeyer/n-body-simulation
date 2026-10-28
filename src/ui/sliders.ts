/*
 * Parameter sliders (issue #11): G, K, Softening, dt, plus N (issue #10) and the camera's field of view
 * the sliders change the values object in place and call onChange with the key that changed
 * every slider has an editable number box next to it (for N that's the N input from #10), both stay in sync
 */
import type {Params} from '../shared/params.ts';

export const MAX_N = 99999; // the force pass is O(N²), so 10x more Bodies = 100x more work

// the Parameters plus the field of view (writeParams ignores fieldOfView, it's not in the Params struct)
export type SliderValues = Params & {fieldOfView: number};

interface SliderSpec {
    key: keyof SliderValues;
    label: string;
    min: number;
    max: number;
    log: boolean; // logarithmic, to explore over orders of magnitude
    integer: boolean;
    applyWhileDragging: boolean; // false for N: a new N means new buffers, so only when the slider is let go
}

// ranges allow interesting (and a little broken) behaviour, but not ε = 0, dt <= 0 or negative G, K
const SLIDERS: SliderSpec[] = [
    {key: 'G', label: 'G (Attraction)', min: 0.0, max: 20, log: false, integer: false, applyWhileDragging: false},
    {key: 'K', label: 'K (Repulsion)', min: 0.0, max: 20, log: false, integer: false, applyWhileDragging: false},
    {key: 'softening', label: 'ε (Softening)', min: 0.0001, max: 1.0, log: true, integer: false, applyWhileDragging: false},
    {key: 'dt', label: 'dt', min: 0.001, max: 0.1, log: true, integer: false, applyWhileDragging: false},
    {key: 'N', label: 'N (Bodies)', min: 2, max: MAX_N, log: true, integer: true, applyWhileDragging: false},
    {key: 'fieldOfView', label: 'FoV (° zoom)', min: 10, max: 150, log: false, integer: false, applyWhileDragging: true},
];

const SLIDER_STEPS = 1000; // resolution of every range input

function toValue(spec: SliderSpec, position: number): number {
    const t = position / SLIDER_STEPS;
    const value = spec.log ? spec.min * (spec.max / spec.min) ** t : spec.min + (spec.max - spec.min) * t;
    return spec.integer ? Math.round(value) : Number(value.toPrecision(3));
}

function toPosition(spec: SliderSpec, value: number): number {
    const t = spec.log ? Math.log(value / spec.min) / Math.log(spec.max / spec.min) : (value - spec.min) / (spec.max - spec.min);
    return Math.round(t * SLIDER_STEPS);
}

// rejects empty or non-numeric text, clamps the rest to the slider's range (and rounds N)
function parse(spec: SliderSpec, text: string): number | undefined {
    const value = Number(text);
    if (text.trim() === '' || !Number.isFinite(value)) return undefined;
    const clamped = Math.min(spec.max, Math.max(spec.min, value));
    return spec.integer ? Math.round(clamped) : clamped;
}

export function createParameterSliders(container: HTMLElement, params: SliderValues, onChange: (key: keyof SliderValues) => void): void {
    for (const spec of SLIDERS) {
        const label = document.createElement('label');
        label.textContent = spec.label;
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = String(SLIDER_STEPS);
        label.append(slider);

        const box = document.createElement('input');
        box.type = 'number';
        box.min = String(spec.min);
        box.max = String(spec.max);
        box.step = spec.integer ? '1' : 'any';

        const apply = (value: number) => {
            box.value = String(value);
            if (value !== params[spec.key]) {
                params[spec.key] = value;
                onChange(spec.key);
            }
        };

        slider.addEventListener('input', () => {
            const value = toValue(spec, Number(slider.value));
            if (spec.applyWhileDragging) {
                apply(value);
            } else {
                box.value = String(value); // only show it until the slider is let go
            }
        });
        slider.addEventListener('change', () => apply(toValue(spec, Number(slider.value))));
        box.addEventListener('change', () => {
            const value = parse(spec, box.value) ?? params[spec.key]; // invalid: back to the current value
            slider.value = String(toPosition(spec, value));
            apply(value);
        });

        // start at the default Parameters
        box.value = String(params[spec.key]);
        slider.value = String(toPosition(spec, params[spec.key]));
        container.append(label, box);
    }
}
