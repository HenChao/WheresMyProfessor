import os
import time
import tornado.ioloop
import tornado.web
import tornado.template
import tornado.websocket

class IndexHandler(tornado.web.RequestHandler):
	@tornado.web.asynchronous
	def get(self):
		loader = tornado.template.Loader("templates/")
		self.write(loader.load("index.html").generate())
		self.finish()

class WebSocketHandler(tornado.websocket.WebSocketHandler):
	webSocketClients = dict()

	def open(self, *args):
		id = int(self.get_argument("Id"))
		self.webSocketClients[id] = {"id":id, "object":self}
		print ("Socket connection open")

	def on_message(self, message):
		id = int(self.get_argument("Id"))
		print ("Client ID %d sent message: %s" % (id, message))
		for client in self.webSocketClients:
			if client != id:
				self.webSocketClients[client]['object'].write_message(message)

	def on_close(self):
		id = int(self.get_argument("Id"))
		if id in self.webSocketClients:
			del self.webSocketClients[id]

port = os.getenv('VCAP_APP_PORT', '5000')
app = tornado.web.Application([
		(r'/static/(.*)', tornado.web.StaticFileHandler, {'path': 'static/'}),
		(r'/', IndexHandler),
		(r'/socket', WebSocketHandler),
		])

if __name__ == '__main__':
	app.listen(int(port))
	print("Server running on port: %s" % port)
	try:
		tornado.ioloop.IOLoop.instance().start()
	except KeyboardInterrupt:
		print("Shutting down webserver")
		tornado.ioloop.IOLoop.instance().stop()

