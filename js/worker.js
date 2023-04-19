let timerID;
self.onmessage = (e) => {
	if (e.data === 'play')
		timerID = setInterval(() => postMessage(null), 25);
	else
		clearInterval(timerID);
}