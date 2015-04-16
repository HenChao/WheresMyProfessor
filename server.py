import os
import time
import tornado.ioloop
import tornado.web
import tornado.template
import tornado.websocket
import json

import cloudant

dbhost = 'b14848a6-af44-4419-ad8b-9f08485aee66-bluemix.cloudant.com'
dbport = '443'
dbusername = 'b14848a6-af44-4419-ad8b-9f08485aee66-bluemix'
dbpassword = 'b1d165bd87a109d7c95ebb67ab75a16370a32809da819e076b4d16d77d807201'
    
account = cloudant.Account(dbusername)
login = account.login(dbusername,dbpassword)
db = account.database('prod')
dbLocations = account.database('locations')

class IndexHandler(tornado.web.RequestHandler):
	@tornado.web.asynchronous
	def get(self):
		loader = tornado.template.Loader("templates/")
		self.write(loader.load("index.html").generate())
		self.finish()

class SearchHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        doc = db.document('users')
        nameList = doc.get()
        self.write(json.dumps(nameList.json()))
        self.finish()

class FindHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        view = dbLocations.design('findLocations').view('locationView')
        locationList = view.get(params={
            'keys' : '["' + self.get_argument('findName') + '"]'
        })
        self.write(json.dumps(locationList.json()))
        self.finish()

class InsertHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        dataName = self.get_argument('name')
        dataPosX = self.get_argument('posX')
        dataPosY = self.get_argument('posY')

        doc = dbLocations.document(str(time.time()))
        resp = doc.put(params={
            'name' : dataName,
            'posX' : dataPosX,
            'posY' : dataPosY,
            'time' : str(time.time())
        })
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
        (r'/search', SearchHandler),
        (r'/find', FindHandler),
        (r'/insert', InsertHandler),
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

