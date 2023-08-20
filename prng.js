function pseudoRandomNoGenerator(min, max) {
    const MAX_UINT32 = Math.pow(2, 32) - 1;
    let rnds = new Uint32Array(1);
    crypto.getRandomValues(rnds);
    let n = rnds[0] / MAX_UINT32;
    return Math.floor(n * (max - min) + min);
}