# danchat
>Chat, friends and communication with danchat and [Node.js](https://nodejs.org)

# Getting started
`npm start`  
or  
`npm run demon` - runs [nodemon npm package](https://www.npmjs.com/package/nodemon)

# Structure of configurations
```
config/main.json
config/database.json
```
#### main.json
```
{
   "ip": "127.0.0.1",
   "port" : 80
}
```
#### database.json
```
{
   "host" : "127.0.0.1",
   "name" : "db_name",
   "user" : "db_user",
   "password" : "db_password",
   "port" : 48,
   "fullhost" : "127.0.0.1:48"
}
```
