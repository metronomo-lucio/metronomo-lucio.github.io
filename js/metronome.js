const firstNotePitch = 1100;
const maxTempo = 250;
const minTempo = 50;
const noteLength = 0.05;
const oscilatorType = 'square';
const otherNotePitch = 833;
const scheduleAheadTime = 0.1;
const tempo = document.getElementById('tempo');
const timerWorker = new Worker("js/worker.js");
let audioContext = null;
let avgTap = 0;
let currentBeat = 0;
let isPlaying = false;
let nextNoteTime = 0.0;
let prevTapTime = 0;


timerWorker.onmessage = function (e) {
    scheduler();
};

function scheduler() {
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
        scheduleOscilator();
        increaseBeat();
    }
}

function scheduleOscilator() {
    let osc = audioContext.createOscillator();
    osc.type = oscilatorType;
    osc.connect(audioContext.destination);
    osc.frequency.value = currentBeat === 0 ? firstNotePitch : otherNotePitch;
    osc.start(nextNoteTime);
    osc.stop(nextNoteTime + noteLength);
}

function increaseBeat() {
    nextNoteTime += (60 / getTempo());
    currentBeat = currentBeat === 3 ? 0 : ++currentBeat;
}

function initAudio() {
    if (audioContext)
        return
    audioContext = new window.AudioContext();
    let node = audioContext.createBufferSource();
    node.buffer = audioContext.createBuffer(1, 1, 22050);;
    node.connect(audioContext.destination);
    node.start(0);
}

function startStop() {
    initAudio();
    let msg = 'stop';
    if (!isPlaying) {
        currentNote = 0;
        nextNoteTime = audioContext.currentTime;
        msg = 'start';
    }
    timerWorker.postMessage({ 'action': msg });
    isPlaying = !isPlaying;
}

function limitTempo(value) {
    return value < minTempo ? minTempo : value > maxTempo ? maxTempo : Number(value).toFixed(1);
}

function getTempo() {
    return limitTempo(tempo.value);
}

function setTempo(value) {
    tempo.value = limitTempo(value);
}

function taptempo() {
    const now = Date.now() / 1000;
    if ((now - prevTapTime > 2)) {
        prevTapTime = now;
        avgTap = 0;
        return
    }
    avgTap = (avgTap + (60 / (now - prevTapTime))) / 2;
    prevTapTime = now;
    setTempo(avgTap);
}
