const http = require('http');
const port = process.env.PORT || 3000;
const { PassThrough } = require('stream');
const server = http.createServer((req, res) => {
    if(req.url === '/events') {
        return dispatchEventServerSentEvent(req, res);
    }
    return dispatchHomePage(req, res);
});

server.listen(port);

server.on('error', (err) => {
    console.log(err);
    process.exit(1);
});
  
server.on('listening', () => {
    console.log(`[Http App] Listening on http://localhost:${port}`);
    setInterval(() => { 
        server.getConnections((error, count) => {
            console.log("[Http App] Open Connection Count", count);
        });
    }, 1000);
});


function dispatchEventServerSentEvent(req, res) {
    const channel = new PassThrough();
    const refreshRate = 500; // in milliseconds
    let eventCount = 0, eventId = 0, eventScheduler;
    res.writeHead(200, { 
        'Content-Type': 'text/event-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Encoding': 'identity'
    });
    
    /* Send Events Format
        @eventType - default type 'message'
        @id - string
        @data - string | object
        @retry - Number in milliseconds
    */
    
    eventScheduler = setInterval(() => {
        eventCount++;
        eventId = Date.now();
       
        // Message - Event
        if(eventCount === 1) {
            channel.write(`event:message\n`);
            channel.write(`id:${eventId}\n`);
            channel.write(`data: Event, Welcome to learn about server sent events. <span id="liveUpdate" style="background:gray;color:white;padding:5px;"></span> \n`);
            channel.write(`retry:10000\n\n`);
        }
        
        // Update - Event
        channel.write(`event:update\n`);
        channel.write(`id:${eventId}\n`);
        channel.write(`data:{ "info": "Update Event triggered", "eventCount": ${eventCount} }\n`);
        channel.write(`retry:10000\n\n`);

    }, refreshRate);

    req.on('close', () => {
        console.log("[Http App] Connection Closed by Browser");
        channel.end();
        clearInterval(eventScheduler);
    })

    setTimeout(() => {
    // Close - Event
        channel.write(`event:close\n`);
        channel.write(`id:${eventId}\n`);
        channel.write(`data: Event triggered from server to close the connection at client side.\n`);
        channel.write(`\n`); // end of stream
        channel.end();
        clearInterval(eventScheduler);
    }, 10000);

    return channel.pipe(res);

}

function dispatchHomePage(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
      <head>
        <meta charset="utf-8">
        <title>SSE</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/rxjs/6.6.7/rxjs.umd.min.js" integrity="sha512-0/2ebe9lI6BcinFBXFjbBkquDfccT2wP+E48pecciFuGMXPRNdInXZawHiM2NUUVJ4/aKAzyebbvh+CkvRhwTA==" crossorigin="anonymous"></script>
        </head>
      <body>
      <div id="log"></div>

      </body>
      <script>
        const { Observable, Subject, fromEvent, operators } = rxjs;
        
        const eventSource = new EventSource('/events');

        const element = document.querySelector('#log');
        fromEvent(eventSource, 'message').subscribe(event => {
            element.innerHTML += '<u>' + event.type.toUpperCase() + '</u>' + ': '+ event.data +'<br><br>';
        });
        console.log(operators);
        fromEvent(eventSource, 'update')
        .pipe(
            operators.take(20),
            operators.tap(event => console.log(event)),
            //operators.debounceTime(1000)
            )
        .subscribe(event => {
            document.querySelector('#liveUpdate').innerHTML = event.lastEventId;
            element.innerHTML += '<u>' + event.type.toUpperCase() + '</u>' + ': Event' + '<br>Last Event ID: ' + event.lastEventId + "<br>DATA: " + event.data +'<br><br>';
        });

        fromEvent(eventSource, 'close').subscribe(event => {
            element.innerHTML += '<u>' + event.type.toUpperCase() + '</u>' + ': '+ event.data +'<br><br>';
            eventSource.close();
        });

        fromEvent(eventSource, 'error').subscribe(event => {
            element.innerHTML += '<u>' + 'Error:' + '</u>' + 'Event, Server closes the connection.';
            eventSource.close();
        });
      </script>
    </html>
    `);
}
