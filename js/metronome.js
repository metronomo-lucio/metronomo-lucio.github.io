let audioBuffer;
let audioContext;
let avgTap;
let currentSong;
let isPlaying = false;
let nextNoteTime;
let prevTapTime = 0;
const maxTempo = 250;
const minTempo = 50;
const playIcon = document.getElementById('playIcon');
const playStop = document.getElementById('playStop');
const scheduleAheadTime = 0.1;
const songName = document.getElementById('songName');
const songTable = document.getElementById('songsTable');
const tempo = document.getElementById('tempo');
const timerWorker = new Worker('js/worker.js');
const songList = [
    ['Verte Así', 140],
    ['Que se yo qué hacer', 138],
    ['El Payaso', 120],
    ['Macumba', 95],
    ['Pampa y la Via', 156],
    ['En la Calle', 150],
    ['Bailando al cielo', 150],
    ['Sabor a danza', 150]
]
const songListLength = songList.length;

function schedule() {
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime){
        play(audioBuffer, nextNoteTime);
        nextNoteTime += (60 / getTempo());
    }
}

async function initAudio() {
    if (!audioContext)
        audioContext = new window.AudioContext();
    if (!audioBuffer)
        audioBuffer = await fetch('sounds/b.mp3')
            .then(res => res.arrayBuffer())
            .then(buffer => audioContext.decodeAudioData(buffer));
    play(audioContext.createBuffer(1, 1, 22050));
}

function play(buffer, when=0){
    let node = new AudioBufferSourceNode(audioContext, {'buffer': buffer});
    node.connect(audioContext.destination);
    node.start(when);
}

function startStop() {
    let msg = 'stop';
    let add = 'play';
    if (!isPlaying) {
        initAudio();
        nextNoteTime = audioContext.currentTime;
        msg = 'play';
        add = 'stop';
    }
    isPlaying = !isPlaying;
    timerWorker.postMessage(msg);
    playStop.classList.remove(msg);
    playStop.classList.add(add);
    playIcon.classList.remove('fa-' + msg);
    playIcon.classList.add('fa-' + add);
}

function limitTempo(value) {
    return value < minTempo ? minTempo : value > maxTempo ? maxTempo : Number(value).toFixed(0);
}

function getTempo() {
    return limitTempo(tempo.value);
}

function setTempo(value) {
    tempo.value = limitTempo(value);
}

function taptempo() {
    const now = Date.now() / 1000;
    if (now - prevTapTime > 2) {
        prevTapTime = now;
        avgTap = 0;
        return;
    }
    avgTap = (avgTap + (60 / (now - prevTapTime))) / 2;
    prevTapTime = now;
    setTempo(avgTap);
}

function loadSongList() {
    songList.forEach(([name, tempo], index) => {
        const row = songTable.insertRow();
        row.insertCell(0).innerText = index + 1;
        row.insertCell(1).innerText = name;
        row.insertCell(2).innerText = tempo;
        row.onclick = () => {
            currentSong = index;
            loadCurrentSong();
        }
    });
    currentSong = 0;
    loadCurrentSong();
}

function loadCurrentSong() {
    let [name, tempo] = songList[currentSong];
    setTempo(tempo);
    songName.innerText = (currentSong + 1) + ': ' + name;
}

function prevNext(next) {
    currentSong = currentSong + (next ? 1 : -1);
    if (currentSong === songListLength)
        currentSong = 0
    else if (currentSong === -1)
        currentSong = songListLength - 1
    loadCurrentSong();
}

timerWorker.onmessage = () => schedule();

loadSongList();