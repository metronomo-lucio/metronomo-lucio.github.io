let audioBuffer = null;
let audioContext = null;
let avgTap = 0.0;
let currentSong = -1;
let isPlaying = false;
let nextNoteTime = 0.0;
let prevTapTime = 0.0;
const maxTempo = 250;
const minTempo = 50;
const playIcon = document.getElementById('playIcon');
const playStop = document.getElementById('playStop');
const scheduleAheadTime = 0.1;
const songName = document.getElementById('songName');
const songTable = document.getElementById('songsTable');
const tempo = document.getElementById('tempo');
const timerWorker = new Worker("js/worker.js");
const songList = [
    {
        "name": "Verte Así",
        "tempo": 140
    },
    {
        "name": "Que se yo qué hacer",
        "tempo": 138
    },
    {
        "name": "El Payaso",
        "tempo": 120
    },
    {
        "name": "Macumba",
        "tempo": 95
    },
    {
        "name": "Pampa y la Via",
        "tempo": 156
    },
    {
        "name": "En la Calle",
        "tempo": 150
    },
    {
        "name": "Bailando al cielo",
        "tempo": 150
    },
    {
        "name": "Sabor a danza",
        "tempo": 150
    }
]

function schedule() {
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime)
        beepAndSchedule();
}

function beepAndSchedule() {
    play(audioBuffer, nextNoteTime);
    nextNoteTime += (60 / getTempo());
}

async function initAudio() {
    if (!audioContext)
        audioContext = new window.AudioContext();
    if (!audioBuffer)
        audioBuffer = await fetch('sounds/b.mp3').then(res => res.arrayBuffer()).then(buffer => audioContext.decodeAudioData(buffer));
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
        currentNote = 0;
        nextNoteTime = audioContext.currentTime;
        msg = 'play';
        add = 'stop';
    }
    isPlaying = !isPlaying;
    timerWorker.postMessage({'action': msg});
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

function prevNext(next) {
    currentSong = currentSong + (next ? 1 : -1);
    len = songList.length;
    currentSong = currentSong === len ? 0 : currentSong === -1 ? (len - 1) : currentSong;
    loadCurrentSong();
}

timerWorker.onmessage = function (e) {
    schedule();
};

loadSongList();
