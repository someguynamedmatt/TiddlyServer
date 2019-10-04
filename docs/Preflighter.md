---
id: preflighter
title: Preflighter
---

The preflighter gives you the ability to do whatever you want with a request before TiddlyServer takes it. The preflighter is a function which accepts a RequestEvent object, and returns a promise which resolves to a RequestEvent object. The preflighter may also return a promise resolving to `{ handled: true }`. This is enough to cancel further processing for that request. 

The object will always be either a RequestEventHTTP or RequestEventWS object for HTTP and WebSockets, respectively. 

<div style="color: #000000;background-color: #ffffff;font-family: Menlo, Monaco, 'Courier New', monospace;font-weight: normal;font-size: 12px;line-height: 18px;white-space: pre; overflow: scroll hidden;"><span style="color: #af00db;">export</span><span style="color: #000000;">&nbsp;</span><span style="color: #0000ff;">interface</span><span style="color: #000000;">&nbsp;</span><span style="color: #267f99;">RequestEventHTTP</span><span style="color: #000000;">&nbsp;</span><span style="color: #0000ff;">extends</span><span style="color: #000000;">&nbsp;</span><span style="color: #267f99;">RequestEvent</span><span style="color: #000000;">&nbsp;{&nbsp;</span><span style="color: #001080;">response</span><span style="color: #000000;">:</span><span style="color: #000000;">&nbsp;</span><span style="color: #267f99;">http</span><span style="color: #000000;">.</span><span style="color: #267f99;">ServerResponse</span><span style="color: #000000;">; }</span></div>
<div style="color: #000000;background-color: #ffffff;font-family: Menlo, Monaco, 'Courier New', monospace;font-weight: normal;font-size: 12px;line-height: 18px;white-space: pre;"><span style="color: #af00db;">export</span><span style="color: #000000;">&nbsp;</span><span style="color: #0000ff;">interface</span><span style="color: #000000;">&nbsp;</span><span style="color: #267f99;">RequestEventWS</span><span style="color: #000000;">&nbsp;</span><span style="color: #0000ff;">extends</span><span style="color: #000000;">&nbsp;</span><span style="color: #267f99;">RequestEvent</span><span style="color: #000000;">&nbsp;{&nbsp;</span><span style="color: #001080;">client</span><span style="color: #000000;">:</span><span style="color: #000000;">&nbsp;</span><span style="color: #267f99;">WebSocket</span><span style="color: #000000;">; }</span></div>

<div style="color: rgb(0, 0, 0); font-family: Menlo, Monaco, &quot;Courier New&quot;, monospace; font-size: 12px; line-height: 18px; white-space: pre; overflow: scroll hidden;"><div><span style="color: rgb(175, 0, 219);">export</span> <span style="color: rgb(0, 0, 255);">interface</span> <span style="color: rgb(38, 127, 153);">RequestEvent</span> {</div><div>&nbsp;&nbsp;<span style="color: rgb(0, 128, 0);">/** mark the request as handled, canceling any further processing */</span></div><div>&nbsp;&nbsp;<span style="color: rgb(0, 16, 128);">handled</span>: <span style="color: rgb(38, 127, 153);">boolean</span>;</div><div>&nbsp;&nbsp;<span style="color: rgb(0, 128, 0);">/** the username to give to data folders and anywhere else it is needed */</span></div><div>&nbsp;&nbsp;<span style="color: rgb(0, 16, 128);">username</span>: <span style="color: rgb(38, 127, 153);">string</span>;</div><div>&nbsp;&nbsp;<span style="color: rgb(0, 128, 0);">/** auth account key to be applied to this request */</span></div><div>&nbsp;&nbsp;<span style="color: rgb(0, 16, 128);">authAccountKey</span>: <span style="color: rgb(38, 127, 153);">string</span>;</div><div>&nbsp;&nbsp;<span style="color: rgb(0, 128, 0);">/** hostLevelPermissions key to be applied to this request */</span></div><div>&nbsp;&nbsp;<span style="color: rgb(0, 16, 128);">localAddressPermissionsKey</span>: <span style="color: rgb(38, 127, 153);">string</span>;</div><div>&nbsp;&nbsp;<span style="color: rgb(0, 16, 128);">interface</span>: {</div><div>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(0, 128, 0);">/** HTTP server "host" option for this request (i.e. server.listen bind address) */</span></div><div>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(0, 16, 128);">iface</span>: <span style="color: rgb(38, 127, 153);">string</span>,</div><div>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(0, 128, 0);">/** the host header */</span></div><div>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(0, 16, 128);">host</span>: <span style="color: rgb(38, 127, 153);">string</span> | <span style="color: rgb(38, 127, 153);">undefined</span>,</div><div>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(0, 128, 0);">/** socket.localAddress */</span></div><div>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: rgb(0, 16, 128);">addr</span>: <span style="color: rgb(38, 127, 153);">string</span></div><div>&nbsp;&nbsp;};</div><div>&nbsp;&nbsp;<span style="color: rgb(0, 128, 0);">/** tree hosts array index to be applied to this request */</span></div><div>&nbsp;&nbsp;<span style="color: rgb(0, 16, 128);">treeHostIndex</span>: <span style="color: rgb(38, 127, 153);">number</span>;</div><div>&nbsp;&nbsp;<span style="color: rgb(0, 128, 0);">/** the ServerConfig currently in use on the server */</span></div><div>&nbsp;&nbsp;<span style="color: rgb(0, 0, 255);">readonly</span> <span style="color: rgb(0, 16, 128);">settings</span>: <span style="color: rgb(38, 127, 153);">ServerConfig</span>;</div><div>&nbsp;&nbsp;<span style="color: rgb(0, 16, 128);">request</span>: <span style="color: rgb(38, 127, 153);">http</span>.<span style="color: rgb(38, 127, 153);">IncomingMessage</span>;</div><div>&nbsp;&nbsp;<span style="color: rgb(0, 128, 0);">/** A custom debug output may be set, otherwise the default is used */</span></div><div>&nbsp;&nbsp;<span style="color: rgb(0, 16, 128);">debugOutput</span>: <span style="color: rgb(38, 127, 153);">Writable</span>;</div><div>}</div></div>

Technically the preflighter could return an object with a completely different request and response for the server to handle. However, the logger has already attached itself to the original request, so that is the one that will be logged, rather than the new one. 