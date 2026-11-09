// Keep location details in the recorded history and exports, but simplify play feedback.
export const formatEventForDisplay = (event: string) => event.replace(/\s+(?:to|at)\s+\(-?\d+,\s*-?\d+\)/g, '');
