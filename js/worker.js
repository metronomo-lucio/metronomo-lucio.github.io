const interval = 25;
let timerID = null;
self.onmessage = function(e) {
	switch (e.data.action) {
		case 'play':
			timerID = setInterval(function () {
				postMessage(0)
			}, interval)
			break;
		case 'stop':
			clearInterval(timerID);
			break;
	}
}