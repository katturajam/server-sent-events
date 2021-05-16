const { PassThrough } = require('stream');
const Hapi = require('hapi');
const server = new Hapi.Server();
server.connection({
    port: '4000'
});

// server.load = {
//     sampleInterval: 1000
// };

server.route([{
    method: 'GET',
    path: '/',
    config: {
        handler: function (request, reply) {
            return reply(`
            <!DOCTYPE html>
            <html lang="en" dir="ltr">
            <head>
                <meta charset="utf-8">
                <title>SSE</title>
            </head>
            <body>
                <pre id="log"></pre>
            </body>
            <script>
                var eventSource = new EventSource('/events');
                eventSource.onmessage = function(event) {
                document.getElementById('log').innerHTML += event.type + " - " + event.data +'<br>';
                };
                eventSource.addEventListener("update", function(event) {
                    document.getElementById('log').innerHTML += event.type + " - " + event.data +'<br>';
                });
                // eventSource.addEventListener("message", function(e) {
                //     console.log("Message", e.data)
                //   })
                eventSource.onerror = (event) => { 
                    document.getElementById('log').innerHTML += 'Server closes the connection<br>';
                    eventSource.close();
                }
                eventSource.addEventListener("close", function(e) {
                    document.getElementById('log').innerHTML += event.type + " - " + event.data +'<br>';
                    eventSource.close() 
                })
            </script>
            </html>
            `).type('text/html');
        }
    }
},
{
    method: 'GET',
    path: '/events',
    config: {
        // cors: { 
        //     origin: ['*'],
        //     additionalHeaders: ['cache-control', 'x-requested-with']
        // },
        handler: function (request, reply) {
            const channel = new PassThrough();
            const refreshRate = 500; // in milliseconds;
            let eventCount = 0, eventId = 0;
            /* Send Events Format
                @eventType - default type 'message'
                @id - string
                @data - string | object
                @retry - Number in milliseconds
            */
            
            let eventScheduler = setInterval(() => {
                eventCount++;
                eventId = Date.now();
       
                // Message - Event
                if(eventCount === 1) {
                    channel.write(`event:message\n`);
                    channel.write(`id:${eventId}\n`);
                    channel.write(`data: Event, Welcome to learn about server sent events. <span id="liveUpdate1" style="background:yellow;color:black;padding:5px;"></span> \n`);
                    channel.write(`retry:10000\n\n`);
                }

                // Update - Event
                channel.write(`event:update\n`);
                channel.write(`id:${eventId}\n`);
                channel.write(`data:{ "info": "Update Event triggered", "eventCount": ${eventCount} }\n`);
                channel.write(`retry:10000\n\n`);

            }, refreshRate)

            request.raw.req.on("close", function() {
                console.info("[Hapijs App] Connection Closed by Browser");
                channel.end();
                clearInterval(eventScheduler);
            });

            setTimeout(() =>{
                channel.write(`event:close\n`);
                channel.write(`id:${eventCount}\n`);
                channel.write(`data: Event triggered from server to close the connection at client side.\n`);
                channel.write(`retry:10000\n\n`);
                channel.end();
                clearInterval(eventScheduler);
            }, 10000);
            
            /* Native nodejs response without framework */
                //request.raw.res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'connection': 'keep-alive', 'cache-control': 'no-cache' });
                //channel.pipe(request.raw.res);

            /* Reply must be set header
                Content-Encoding: identity
            */
            return reply(channel)
                .type('text/event-stream')
                .header('Access-Control-Allow-Origin', '*')
                //.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
                .header('Cache-Control','no-cache')
                .header('Connection','keep-alive')
                .header('Content-Encoding', 'identity');
        }
    }
}]);

server.start(function (err) {  
    console.log(`[Hapijs App] Listening on http://localhost:${server.info.port}`);
    // setInterval(() => { 
    //     server.getConnections((error, count) => {
    //         console.log("Open Connection Count", count);
    //     });
    // }, 1000);
});
