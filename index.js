const http = require('http');
const port = process.env.PORT || 5000;
require('./src/http-app');
require('./src/hapi-app');
const server = http.createServer(dispatchHomePage);
server.listen(port);
server.on('listening', () => {
    console.log(`[UI App] Listening on http://localhost:${port}`);
});
function dispatchHomePage(req, res) {
    res.writeHead(200, { 
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(`
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
      <head>
        <meta charset="utf-8">
        <title>NJS: Sever Sent Events(SSE) - Demo</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/rxjs/6.6.7/rxjs.umd.min.js" integrity="sha512-0/2ebe9lI6BcinFBXFjbBkquDfccT2wP+E48pecciFuGMXPRNdInXZawHiM2NUUVJ4/aKAzyebbvh+CkvRhwTA==" crossorigin="anonymous"></script>
        <style>    
            .content {
                padding:5px;
            }
            thead,
            tfoot {
                background-color: #3f87a6;
                color: #fff;
                text-align: center;
            }

            tbody {
                background-color: #e4f0f5;
            }

            caption {
                padding: 10px;
                caption-side: bottom;
            }

            table {
                border-collapse: collapse;
                border: 2px solid rgb(200, 200, 200);
                letter-spacing: 1px;
                font-family: sans-serif;
                font-size: .8rem;
                margin:auto;
            }
        </style>
      </head>
      <body>
        <div class="content">
            <p style="text-align:center;"><u><b>Nodejs - Sever Sent Events(SSE) - Demo</b></u></p>
        <table border='1'>    
            <thead>
                <tr>
                    <td>
                        HTTP with RxJs Observable
                    </td>
                    <td>
                        HAPI JS
                    </td>
                </tr>
             </thead> 
             <tbody>
                <tr>
                    <td style="vertical-align:top;padding:5px;">
                        <div id="log"></div>
                    </td>
                    <td style="vertical-align:top;padding:5px;">
                        <div id="log1"></div>
                    </td>
                </tr>
            </tbody>
        </table>
        </div>
      </body>
      <script>
        /*** Http Event Source Listener ***/
        const { Observable, Subject, fromEvent, operators } = rxjs;
        const HttpAppEventSource = new EventSource('http://localhost:3000/events');

        const element = document.querySelector('#log');
        fromEvent(HttpAppEventSource, 'message').subscribe(event => {
            element.innerHTML += '<u>' + event.type.toUpperCase() + '</u>' + ': '+ event.data +'<br><br>';
        });
        fromEvent(HttpAppEventSource, 'update')
        .pipe(
            operators.take(10),
            operators.tap(event => console.log(event)),
            //operators.debounceTime(1000)
            )
        .subscribe(HttpAppEventSource => {
            document.querySelector('#liveUpdate').innerHTML = event.lastEventId;
            element.innerHTML += '<u>' + event.type.toUpperCase() + '</u>' + ': Event' + '<br>Last Event ID: ' + event.lastEventId + "<br>DATA: " + event.data +'<br><br>';
        });

        fromEvent(HttpAppEventSource, 'close').subscribe(event => {
            element.innerHTML += '<u>' + event.type.toUpperCase() + '</u>' + ': '+ event.data +'<br><br>';
            HttpAppEventSource.close();
        });

        fromEvent(HttpAppEventSource, 'error').subscribe(event => {
            element.innerHTML += '<u>' + 'Error:' + '</u>' + 'Event, Server closes the connection.';
            HttpAppEventSource.close();
        });
        
        /*** Hapijs Event Source Listener ***/
        var HapiJsAppEventSource = new EventSource('http://localhost:4000/events');
        const element1 = document.querySelector('#log1');
        HapiJsAppEventSource.onmessage = function(event) {
            element1.innerHTML += '<u>' + event.type.toUpperCase() + '</u>' + ': '+ event.data +'<br><br>';
        };
        HapiJsAppEventSource.addEventListener("update", function(event) {
            document.querySelector('#liveUpdate1').innerHTML = event.lastEventId;
            element1.innerHTML += '<u>' + event.type.toUpperCase() + '</u>' + ': Event' + '<br>Last Event ID: ' + event.lastEventId + "<br>DATA: " + event.data +'<br><br>';
        });
        HapiJsAppEventSource.addEventListener("close", function(e) {
            element1.innerHTML += '<u>' + event.type.toUpperCase() + '</u>' + ': '+ event.data +'<br><br>';
            HapiJsAppEventSource.close();
        });

        HapiJsAppEventSource.onerror = (event) => { 
            element1.innerHTML += '<u>' + 'Error:' + '</u>' + 'Event, Server closes the connection.';
            HapiJsAppEventSource.close();
        }
      </script>
    </html>
    `);
}
