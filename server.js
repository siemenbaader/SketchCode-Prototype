var http = require('http');
var fs = require('fs');
var spawn = require('child_process').spawn;
var parse = require('url').parse;

var server = http.createServer();

server.on('request', function(request, response) {
	var url = parse(request.url);
	
	fs.readFile('.'+url.pathname, function(err, buffer) {
		if (err) {
			response.writeHead(404);
			response.end();
			return;
		}
		response.writeHead(200);
		response.end(buffer);
	});
});

server.listen(11111);

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

var rpc = http.createServer();

rpc.on('upgrade', onwebsocket(function(connection) {	
	connection.setEncoding('utf-8');
		
	var child;
	
	connection.on('data', function(data) {
		data = JSON.parse(data.substring(1, data.length-1));
		
		switch (data.type) {
			case 'put':
			console.log('put', data);
			return;
			case 'run':
			child && child.kill();
			
			child = spawn('node', ['foo.js'])
			child.stdout.setEncoding('utf-8');
			child.stdout.on('data', function(data) {
				connection.write('\u0000', 'binary');
				connection.write(data);
				connection.write('\uffff', 'binary');				
			});
			return;
		}
	});
}));


rpc.listen(11112);