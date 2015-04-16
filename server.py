import os
import time
import tornado.ioloop
import tornado.web
import tornado.template
import tornado.websocket
import json

import cloudant

if 'VCAP_SERVICES' in os.environ:
    #convert vcap-services json into a dictionary
    vcap_services = json.loads(os.environ['VCAP_SERVICES'])

    #load information about mysql database into a separate dictionary
    # and then grab the credentials
    for key, value in vcap_services.iteritems():   # iter on both keys and values
        if key.startswith('cloudant'):
            mysql_info = vcap_services[key][0]
    cred = mysql_info['credentials']
            
    #store parameters
    dbhost = cred['host'].encode('utf8')
    dbusername = cred['user'].encode('utf8')
    dbpassword = cred['password'].encode('utf8')
    dbport = cred['port']
else:
    #use these by default
    dbhost = 'b14848a6-af44-4419-ad8b-9f08485aee66-bluemix.cloudant.com'
    dbport = '443'
    dbusername = 'b14848a6-af44-4419-ad8b-9f08485aee66-bluemix'
    dbpassword = 'b1d165bd87a109d7c95ebb67ab75a16370a32809da819e076b4d16d77d807201'
    
account = cloudant.Account(dbusername)
login = account.login(dbusername,dbpassword)
db = account.database('prod')

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
        print(nameList.json()['names'])
        self.write(json.dumps(nameList.json()))
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

