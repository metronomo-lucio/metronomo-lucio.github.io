const interval = 25;
let timerID = null;
self.onmessage = function(e) {
	switch (e.data.action) {
		case 'start':
			timerID = setInterval(function () {postMessage("tick")}, interval)
			break;
		case 'stop':
			clearInterval(timerID);
			break;
	}
}