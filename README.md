# danchat
> Chat, friends and communication with danchat and [Node.js](https://nodejs.org)

# Getting started
`npm start`  
or  
`npm run demon` - runs [nodemon npm package](https://www.npmjs.com/package/nodemon)

# Structure of main directories
**You have to fill these directories with necessary files to correct work**

### Structure of configurations
```
config/main.json
config/database.json
```
##### main.json
```json
{
   "ip": "127.0.0.1",
   "port" : 80
}
```
##### database.json
```json
{
   "host" : "127.0.0.1",
   "name" : "db_name",
   "user" : "db_user",
   "password" : "db_password",
   "port" : 48,
   "fullhost" : "127.0.0.1:48"
}
```

### Structure of sounds
```
sounds/enter.mp3 //sound of login
sounds/exit.mp3 //sound of logout
sounds/msg.mp3 //sound of message
```

### Structure of images
```
images/bg.jpg //main background
images/default.jpg //default user photo
images/favicon.ico //favicon
```
