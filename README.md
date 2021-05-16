# Server Sent Events
The Server-Sent Events specification describes a built-in class EventSource, that keeps connection with the server and allows to receive events from it.

Similar to WebSocket, the connection is persistent.

But there are several important differences:

| WebSocket                            | EventSource                        |
| ------------------------------------ | ---------------------------------- |
| Bi-directional: both client and server can exchange messages  | One-directional: only server sends data  |
| Binary and text data                                          | Only text  |
| WebSocket protocol                                            | Regular HTTP |

EventSource is a less-powerful way of communicating with the server than WebSocket.

Why should one ever use it?

The main reason: it’s simpler. In many applications, the power of WebSocket is a little bit too much.

We need to receive a stream of data from server: maybe chat messages or market prices, or whatever. That’s what EventSource is good at. Also it supports auto-reconnect, something we need to implement manually with WebSocket. Besides, it’s a plain old HTTP, not a new protocol.

### How to start

- Step-1
```
npm install
```

- Step-2
```
npm start
```

- Step-3: Open below url in the browser
```
http://localhost:5000
```

