
function Midi (ledstrip) {
	this.ledstrip = ledstrip;
	this.ledstrip.clear();
	this.direction = 1;
	// tick counter
	this.t = 0;

	return this;
}

//http://stackoverflow.com/questions/23687635/how-to-stop-audio-in-an-iframe-using-web-audio-api-after-hiding-its-container-di
	var log = console.log.bind(console), keyData = document.getElementById('key_data'),
			deviceInfoInputs = document.getElementById('inputs'), deviceInfoOutputs = document.getElementById('outputs'), midi;
	var AudioContext = AudioContext || webkitAudioContext; // for ios/safari
	var context = new AudioContext();
	var activeNotes = [];
	var btnBox = document.getElementById('content'), btn = document.getElementsByClassName('button');
	var data, cmd, channel, type, note, velocity;
	var rgb = [0, 0, 0];
	var noteStatus = [false, false, false, false, false]; // keeps track if key is pressed
	var releaseMax = 20; // # of tickets that lights should last even if no notes are on
	var releaseCurrent = 0;
	var context = new AudioContext();
	var buffers = [null, null, null, null, null];
	var noteValues = [
		[255,0,0],
		[255,255,106],
		[213,255,234],
		[202,0,35],
		[255,189,53]
	];

	// add event listeners
	document.addEventListener('keydown', keyController);
	document.addEventListener('keyup', keyController);
	//document.addEventListener('keypress', keyController);

	// maybe each led block should have its own event for on/off?
	// keep an array for each note to say if it's on or off
	// prepare audio files
	var notes = ["http://sensori.github.io/audio/C.mp3", "http://sensori.github.io/audio/D.mp3",
								"http://sensori.github.io/audio/E.mp3","http://sensori.github.io/audio/F.mp3",
								"http://sensori.github.io/audio/G.mp3"];
	for(var i = 0; i < noteStatus.length; i++){
		addAudioProperties(i);
	}

Midi.prototype.init = function() {}

Midi.prototype.wave = function (tick) {
	var i, size = this.ledstrip.size();

	// sum the notes-on
	var rgbSum = rgb;//[0,0,0];
	var rgbValues = []; // holds the rgb values that should be summed
	var notesOn = 0;
	for (var j = 0; j < noteValues.length; j++) {
		if (noteStatus[j] == true) {
			// don't sum if this is the first note on
			rgbValues.push(noteValues[j]);// = noteValues[j];
			//rgbSum = AddRgb(rgbSum, noteValues[j]);
			notesOn++;
		}
	}
	for (var k = 0; k < rgbValues.length; k++){
		if (rgbSum[0] == 0 && rgbSum[1] == 0 && rgbSum[2] == 0) {
			rgbSum = rgbValues[k];
		}
		else {
			//rgbValues[j] = notesValues[j];
			rgbSum = AddRgb(rgbSum, rgbValues[k], notesOn);
		}
	}
	//console.log(rgbSum);

	// at least one note was on, reset release
	if (notesOn > 0) {
		releaseCurrent = releaseMax;
	}
	else {
		releaseCurrent--;
	}

	// keep the last color if release has not finished yet
	if (notesOn == 0 && releaseCurrent <= 0) {
		rgbSum[0] = Math.max(rgb[0] - 10, 0);
		rgbSum[1] = Math.max(rgb[1] - 10, 0);
		rgbSum[2] = Math.max(rgb[2] - 10, 0);
	}

	// map the length of the led strip across the rgb value
	// var bin = Math.ceil(rgb[0] / size); // increment to go from 0 to full red
	for (i = 0; i < size; i++) {
		// var red = (0 + bin * i);
		//
		this.ledstrip.buffer[i] = rgbSum;//[red, 0, 0];
	}

	// keep track of current color
	rgb = rgbSum;
}

//TODO: decrease the averaging as more keys are pressed at once to get to white
function AddRgb(rgb1, rgb2, notesOn) {
	// get the averaging factor based on # of notes on
	var factor = Math.max(2 - (0.1 * notesOn), 1);
	return [Math.min(Math.ceil((rgb1[0] + rgb2[0])/factor), 255),
	 				Math.min(Math.ceil((rgb1[1] + rgb2[1])/factor), 255),
	 				Math.min(Math.ceil((rgb1[2] + rgb2[2])/factor), 255)];
}

// http://stackoverflow.com/questions/11409895/whats-the-most-elegant-way-to-cap-a-number-to-a-segment
/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 *
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

function addAudioProperties(index){
	//object.name = object.id;
	//var source = notes[index];
	loadAudio(index, notes[index]);
	/*object.play = function(volume){
		var s = context.createBufferSource();
		var g = context.createGain();
		var v;
		s.buffer = object.buffer;
		s.playbackRate.value = randomRange(0.5, 2);
		if(volume){
			v = rangeMap(volume, 1, 127, 0.2, 2);
			s.connect(g);
			g.gain.value = v * v;
			g.connect(context.destination);
		}
		else{
			s.connect(context.destination);
		}

		s.start();
		//object.s = s;
	}*/
}

function play(volume, index){
	var sourceNode = context.createBufferSource();
	var gainNode = context.createGain();
	var v;
	sourceNode.buffer = buffers[index];

	if(volume){
		v = rangeMap(volume, 1, 127, 0.2, 2);
		sourceNode.connect(gainNode);
		gainNode.gain.value = v * v;
		gainNode.connect(context.destination);
	}
	else{
		sourceNode.connect(gainNode);
		gainNode.gain.value = 0.5;
		gainNode.connect(context.destination);
		//reverb.connect(context.destination);
	}

	sourceNode.start();
	//object.s = s;
}

// audio functions
function loadAudio(index, url){
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';
	request.onload = function(){
		context.decodeAudioData(request.response, function(buffer){
			buffers[index] = buffer;
		});
	}
	request.send();
}

Midi.prototype.animate = function() {
	animation = requestAnimationFrame(this.animate.bind(this)); // preserve our context
	this.wave(this.t++); // calculate waves and increment tick
	this.ledstrip.send(); // update strip
}

		// plays the key's corresponding audio buffer
		// only if the key has just flipped from 'off' to 'on'
		// to avoid stuttering
		function handleKeyPress(index){
			if (noteStatus[index] == false){ // only play if note just flipped to 'on'
				noteStatus[index] = true;
				play(false, index);
			}
		}

		function keyController(e){
			if(e.type == "keydown"){
				//console.log(e.keyCode);
				switch(e.keyCode){
					case 81:
						handleKeyPress(0);
						break;
					case 69:
						handleKeyPress(1);
						break;
					case 84:
						handleKeyPress(2);
						break;
					case 85:
						handleKeyPress(3);
						break;
					case 79:
						handleKeyPress(4);
						break;
					default:
				}
			}
			else if(e.type == "keyup"){
				switch(e.keyCode){
					case 81:
						noteStatus[0] = false;
						break;
					case 69:
						noteStatus[1] = false;
						break;
					case 84:
						noteStatus[2] = false;
						break;
					case 85:
						noteStatus[3] = false;
						break;
					case 79:
						noteStatus[4] = false;
						break;
					default:
				}
			}
			//console.log(noteStatus);
		}

		// midi functions
		function onMIDISuccess(midiAccess){
			midi = midiAccess;
			var inputs = midi.inputs.values();
			// loop through all inputs
			for(var input = inputs.next(); input && !input.done; input = inputs.next()){
				// listen for midi messages
				input.value.onmidimessage = onMIDIMessage;

				listInputs(input);
			}
			// listen for connect/disconnect message
			midi.onstatechange = onStateChange;

			showMIDIPorts(midi);
		}

		function onMIDIMessage(event){
			data = event.data,
			cmd = data[0] >> 4,
			channel = data[0] & 0xf,
			type = data[0] & 0xf0, // channel agnostic message type. Thanks, Phil Burk.
			note = data[1],
			velocity = data[2];
			// with pressure and tilt off
			// note off: 128, cmd: 8
			// note on: 144, cmd: 9
			// pressure / tilt on
			// pressure: 176, cmd 11:
			// bend: 224, cmd: 14
			log('MIDI data', data);
			switch(type){
				case 144: // noteOn message
					noteOn(note, velocity);
					break;
				case 128: // noteOff message
					noteOff(note, velocity);
					break;
			}

			//log('data', data, 'cmd', cmd, 'channel', channel);
			logger(keyData, 'key data', data);
		}

		function onStateChange(event){
			showMIDIPorts(midi);
			var port = event.port, state = port.state, name = port.name, type = port.type;
			if(type == "input")
				log("name", name, "port", port, "state", state);

		}

		function listInputs(inputs){
			var input = inputs.value;
				log("Input port : [ type:'" + input.type + "' id: '" + input.id +
						"' manufacturer: '" + input.manufacturer + "' name: '" + input.name +
						"' version: '" + input.version + "']");
		}

		function noteOn(midiNote, velocity){
			player(midiNote, velocity);

      Midi.ledstrip.buffer[5] = [120, 50, 80];
		}

		function noteOff(midiNote, velocity){
			player(midiNote, velocity);

      Midi.ledstrip.buffer[5] = [255, 255, 255];
		}

		function player(note, velocity){
			var sample = sampleMap['key'+note];
			if(sample){
				if(type == (0x80 & 0xf0) || velocity == 0){ //needs to be fixed for QuNexus, which always returns 144
					btn[sample - 1].classList.remove('active');
					return;
				}
				btn[sample - 1].classList.add('active');
				btn[sample - 1].play(velocity);
			}
		}

		function onMIDIFailure(e){
			log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
		}

		// MIDI utility functions
		function showMIDIPorts(midiAccess){
      var deviceInfoInputs = document.getElementById('inputs');
      var deviceInfoOutputs = document.getElementById('outputs');
			var inputs = midiAccess.inputs,
					outputs = midiAccess.outputs,
					html;
			html = '<h4>MIDI Inputs:</h4><div class="info">';
			inputs.forEach(function(port){
				html += '<p>' + port.name + '<p>';
				html += '<p class="small">connection: ' + port.connection + '</p>';
				html += '<p class="small">state: ' + port.state + '</p>';
				html += '<p class="small">manufacturer: ' + port.manufacturer + '</p>';
				if(port.version){
					html += '<p class="small">version: ' + port.version + '</p>';
				}
			});
			deviceInfoInputs.innerHTML = html + '</div>';

			html = '<h4>MIDI Outputs:</h4><div class="info">';
			outputs.forEach(function(port){
				html += '<p>' + port.name + '<br>';
				html += '<p class="small">manufacturer: ' + port.manufacturer + '</p>';
				if(port.version){
					html += '<p class="small">version: ' + port.version + '</p>';
				}
			});
			deviceInfoOutputs.innerHTML = html + '</div>';
		}

		// utility functions
		function randomRange(min, max){
			return Math.random() * (max + min) + min;
		}

		function rangeMap(x, a1, a2, b1, b2){
			return ((x - a1)/(a2-a1)) * (b2 - b1) + b1;
		}

		function frequencyFromNoteNumber( note ) {
			return 440 * Math.pow(2,(note-69)/12);
		}

		function logger(container, label, data){
			messages = label + " [channel: " + (data[0] & 0xf) + ", cmd: " + (data[0] >> 4) + ", type: " + (data[0] & 0xf0) + " , note: " + data[1] + " , velocity: " + data[2] + "]";
			container.textContent = messages;
		}
