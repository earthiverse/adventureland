FROM node:16

# update base image and get latest packages
RUN apt-get update && apt-get upgrade -y

# TODO: Do we want this in the "root" should it live somewhere else?
# Clone a modified copy of Python2 App Engine Local App Server into the python folder along with an initialized database with map files:
RUN git clone https://github.com/kaansoral/adventureland-appserver appserver

# fixing the internal IP address range that wizard put serious limitations on
# for example, you could have 192.168.1.125 but not 192.168.0.1 /shrug
RUN sed -i 's/192.168.1\\..?.?.?/192\\.168\\.(0\\.([1-9]|[1-9]\\d|[12]\\d\\d)|([1-9]|[1-9]\\d|[12]\\d\\d)\\.([1-9]?\\d|[12]\\d\\d))/' /appserver/sdk/lib/cherrypy/cherrypy/wsgiserver/wsgiserver2.py
# RUN sed -i 's/allowed_ips=\[/allowed_ips=["^172\\.(16\\.0\\.([1-9]|[1-9]\\d|[12]\\d\\d)|16\\.([1-9]|[1-9]\\d|[12]\\d\\d)\\.([1-9]?\\d|[12]\\d\\d)|(1[7-9]|2\\d|3[01])(\\.([1-9]?\\d|[12]\\d\\d)){2})$",/g'  /appserver/sdk/lib/cherrypy/cherrypy/wsgiserver/wsgiserver2.py
# should fix when the game servers are trying to call the server
# 2023-11-04 00:40:28 INFO     2023-11-03 23:40:28,108 wsgiserver2.py:2136] --- !!! --- !!! --- Not allowed IP: 172.18.0.1 Requested /
# 2023-11-04 00:40:38 INFO     2023-11-03 23:40:38,250 wsgiserver2.py:2136] --- !!! --- !!! --- Not allowed IP: 172.18.0.1 Requested /

# allow docker ip range
RUN sed -i 's/allowed_ips=\[/allowed_ips=["^172\\.([0-9])+?\\.([0-9])+?\\.([0-9])+?$",/g'  /appserver/sdk/lib/cherrypy/cherrypy/wsgiserver/wsgiserver2.py

# prevent os.exit when running inside docker and you access /admin
# https://github.com/kaansoral/adventureland-appserver/blob/a2beb24b1a8b341ac6781c78aba7f4ae52e54147/sdk/lib/cherrypy/cherrypy/wsgiserver/wsgiserver2.py#L2138
RUN sed -i 's/logging.info("External Allowed IP Tried to Hack!!! %s Requested %s"%(self.env\["REMOTE_ADDR"],self.env\["REQUEST_URI"])); os._exit(0);/logging.info("External Allowed IP Tried to Hack!!! %s Requested %s"%(self.env\["REMOTE_ADDR"],self.env\["REQUEST_URI"]));/g'  /appserver/sdk/lib/cherrypy/cherrypy/wsgiserver/wsgiserver2.py

# get the dev version of python2 to install the reqs lower <-- because Atlus said so :P
RUN apt-get install python2-dev -y

# get pip as per installation instructions - not sure what it is used for
RUN wget https://bootstrap.pypa.io/pip/2.7/get-pip.py
RUN python2.7 get-pip.py
RUN pip2.7 check

# use python to install pip
RUN python2 get-pip.py

# wizard told us to install lxml but python2 can't handle it out with
# supplimentary libraries
RUN apt-get install libxml2-dev libxslt-dev

# install lxml
# TODO: remove lxml since it's not used
# Imported, not used in config.py: from lxml import etree as lxmletree
RUN pip install lxml

RUN pip install flask -t adventureland/lib
# TODO: should probably install requirements instead, in case other requirements are added
# pip install -t lib -r requirements.txt

# why are we copying the current location into adventureland?
# make the AL directory, and enter it
# RUN mkdir adventureland && cd adventureland

# copy from the current location to our AL folder
COPY ../ /adventureland 
# ^^ WORKS

# pretty sure we are running from within .devcontainer, so that makes no sense.

# can't get symbolic links to work :thinking:
# Create a symbolic link 'adventureland' pointing to the workspace
# RUN ln -s /adventureland .
# RUN ln -s . /adventureland
# RUN ln -s ../ /adventureland

# https://stackoverflow.com/a/65443098/28145
# nodejs >= 15 npm install is executed in the root directory of the container 

RUN ls
CMD pwd

# run npm install on /adventureland/scripts
WORKDIR ./adventureland/scripts
RUN npm install

# run npm install on /adventureland/node
WORKDIR ../node
RUN npm install 

# i don't think we need all of these. need to do more research
EXPOSE 8082
EXPOSE 8083
EXPOSE 43291
EXPOSE 8000

# add execution perms to the entrypoints
# RUN chmod +x ../adventureland/appserver-entrypoint.sh
# RUN chmod +x ../adventureland/node-server-entrypoint.sh

# /adventureland
WORKDIR ../
RUN chmod +x appserver-entrypoint.sh
RUN chmod +x node-server-entrypoint.sh

# why are we exposing some ports?

# what are theese entrypoint scripts that we chmod? and what is the default entry point?

# docker-entrypoint.sh is responsible for starting the appserver

#node-entrypoint.sh is for starting the server can we use nodemon / pm2 to restart it on changes?

# https://stackoverflow.com/a/67813516/28145

# doing docker build -t al . && docker-compose up builds the image and starts the servers
