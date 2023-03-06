const listURL = 'data/list.json';
const maxTempo = 250;
const minTempo = 50;
const noteLength = 0.07;
const oscilatorType = 'square';
const pitchBeatOne = 1100;
const pitchBeats = 840;
const scheduleAheadTime = 0.1;
const songName = document.getElementById('songName');
const songTable = document.getElementById('songsTable');
const tempo = document.getElementById('tempo');
const timerWorker = new Worker("js/worker.js");
let audioContext = null;
let avgTap = 0;
let currentBeat = 0;
let currentSong = null;
let isPlaying = false;
let nextNoteTime = 0.0;
let prevTapTime = 0;
let songList = [];

function scheduler() {
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
        scheduleBeat();
        increaseBeat();
    }
}

function scheduleBeat() {
    let osc = audioContext.createOscillator();
    osc.type = oscilatorType;
    osc.connect(audioContext.destination);
    osc.frequency.value = currentBeat === 0 ? pitchBeatOne : pitchBeats;
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
    if ((now - prevTapTime > 2)) {
        prevTapTime = now;
        avgTap = 0;
        return
    }
    avgTap = (avgTap + (60 / (now - prevTapTime))) / 2;
    prevTapTime = now;
    setTempo(avgTap);
}

function init() {
    timerWorker.onmessage = function (e) {
        scheduler();
    };
    fetchSongList();
}

async function fetchSongList() {
    loadSongList(await (await fetch(listURL)).json());
}

function loadSongList(songs) {
    songList = songs;
    songList.forEach((song, index) => {
        let row = songTable.insertRow();
        row.insertCell(0).innerText = index + 1;
        row.insertCell(1).innerText = song.name;
        row.insertCell(2).innerText = song.tempo;
        row.onclick = function () {
            currentSong = index;
            loadCurrentSong();
        }
    });
    currentSong = 0;
    loadCurrentSong();
}

function loadCurrentSong() {
    let song = songList[currentSong];
    setTempo(song.tempo);
    songName.innerText = (currentSong + 1) + ': ' + song.name;
}

function next() {
    currentSong++;
    currentSong = currentSong === songList.length ? 0 : currentSong;
    loadCurrentSong();
}

function prev() {
    currentSong = currentSong === 0 ? songList.length - 1 : --currentSong;
    loadCurrentSong();
}
