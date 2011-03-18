var common = require('./common');
var createParser = require('./streams').createParser;
var createRouter = require('./web').createRouter;

var net = require('net');

var noop = function() {};

// The main low-level socket interface for all non-browser communication
// It wraps an existing connection in a json socket interface and can be used
// by both a client connection and a server connection
var createSocket = function(connection, options) {
	var that = common.createEmitter();
	var framing = options && options.framing;
	
	// if the buffer is opening we want to buffer all data
	// until its fully connected
	var send = function(sendRaw) {
		if (connection.readyState !== 'opening') {
			return sendRaw;
		}
		var buffer = [];
		
		connection.on('connect', function() {
			// override the send ref so we go directly to the connection from now on
			send = sendRaw;
			
			while (buffer.length) {
				send(buffer.shift());
			}
		});
		
		// until the socket has connected we just buffer the data
		return function(data) {
			buffer.push(data);
		};
	}(function(data) {
		if (framing) {
			connection.write('\u0000', 'binary');
		}	
		connection.write(Buffer.byteLength(data)+'\n'+data+'\n');
		if (framing) {
			connection.write('\uffff', 'binary');
		}
	});
	
	var heartbeat;
	
	var onclose = common.once(function(hadError) {
		clearInterval(heartbeat);
		that.emit('close', hadError);
	});
	
	connection.on('error', onclose);
	connection.on('close', onclose);
	
	connection.setTimeout(2*60*1000, function() {
		connection.destroy();
	});	
	connection.on('end', function() {
		connection.destroy();
	});
	
	var parser = createParser(connection);	
	var parse;
	var steps = [
		function(next) {
			if (!framing) {
				next();
				return;
			}
			parser.skip([0, 255]);
			parser.onend = next;
		},	
		function(next) {
			parser.buffer();

			parser.find(10);
			parser.onend = next;
		},
		function(next) {
			var length = parseInt(parser.data.toString('ascii'), 10)+1;

			parser.buffer();
			parser.content(length);
			parser.onend = next;
		},
		function() {
			try {
				var message = parser.data.toString('utf-8');

				switch (message) {
					case 'ping\n':
					send('pong');
					break;
					case 'pong\n':
					break;
					default:
					that.emit('message', JSON.parse(message));
					break;
				}
				parse();
			}
			catch(err) {
				connection.destroy(err);
			}
		}
	];
	
	parse = function() {
		common.step(steps);
	};
	parse();
		
	that.heartbeat = function(active) {
		clearInterval(heartbeat);

		if (active === false) {
			return;
		}
		
		heartbeat = setInterval(function() {
			send('ping');
		}, 60*1000);
	};
	that.destroy = function() {
		connection.destroy();
	};
	that.send = function(message) {
		send(JSON.stringify(message));
	};
	
	return that;
};

var connect = function(port, host) {
	var sock = createSocket(net.createConnection(port, host));
	
	sock.heartbeat();
	
	return sock;
};

// The main server interface for all non-browser communication
var createServer = function(onsocket) {
	return net.createServer(function(connection) {
		onsocket(createSocket(connection));
	});
};

var onwebsocket = function(callback) {
	var crypto = require('crypto');
	
	var sign = function(request, head) {
		var md5 = crypto.createHash('md5');
		var k1 = request.headers['sec-websocket-key1'];
		var k2 = request.headers['sec-websocket-key2'];

		[k1, k2].forEach(function(k){
			var n = parseInt(k.replace(/[^\d]/g, ''), 10);
			var spaces = k.replace(/[^ ]/g, '').length;

			if (spaces === 0 || n % spaces !== 0){
				return null;
			}
			n /= spaces;
			md5.update(String.fromCharCode(
				n >> 24 & 0xFF,
				n >> 16 & 0xFF,
				n >> 8  & 0xFF,
				n       & 0xFF));
		});
		md5.update(head.toString('binary'));
		return md5.digest('binary');	
	};

	return function(request, connection, head) {
		connection.setNoDelay(true);	

		var sec = 'sec-websocket-key1' in request.headers ? 'Sec-' : '';
		var token = sec && sign(request, head);

		if (token === null) {
			connection.destroy();
			return;
		}

		var handshake = [
			'HTTP/1.1 101 Web Socket Protocol Handshake', 
			'Upgrade: WebSocket', 
			'Connection: Upgrade',
			sec + 'WebSocket-Origin: ' + request.headers.origin || 'null',
			sec + 'WebSocket-Location: ws://' + request.headers.host + (request.realUrl || request.url)
		].join('\r\n');

		connection.write(handshake + '\r\n\r\n' + token, 'binary');	
		callback(connection);
	};
};

var listen = function(server, fn) {
	server = createRouter(server);

	server.upgrade(onwebsocket(function(connection) {
		fn(createSocket(connection, {framing:true}));
	}));
///	server.request(/^\/socket\//, '/', onlongpoll(fn));
};

exports.createServer = createServer;

createServer(function(sock) {
	sock.on('message', function(message) {
		console.log(message);
		sock.send(message);
	});
	sock.on('close', function() {
		console.log('server-client closed!');
	});	
}).listen('/tmp/test.sock', function() {
	var sock = connect('/tmp/test.sock');
	
	sock.send({hello:'world'});
	
	sock.on('message', function(message) {
		console.log(message);
	});
	sock.on('close', function() {
		console.log('client-server closed!');
	});
});

var s = createRouter();

listen(s, function(sock) {
	sock.on('message', function(message) {
		console.log('ws', message);
		sock.send(message);
	});
	sock.on('close', function() {
		console.log('ws', 'close');
	});
	console.log('sock!');
});

s.listen(9999);