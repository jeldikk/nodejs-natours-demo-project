# Demo project of nodejs, mongo rest api

The main aim of this project is, It is a good snapshot for learning on how to create and manage folder structure about api's & database handling.

This is a Monolithic project

### Implementation methodology
This project also employees some good coding methodologies
- By having leaner controllers and fat models; by putting all business logic into controllers and model logic into mongoose controllers
- by having global Error Handling mechanism through error middleware
- different routes for different features and inbuilt databases
- emailing feature using nodemailer
- different files for handling webserver and external servers.

### Strategies
This project also helps in understanding different strategies used to secure api data from
- NoSQL query injection attack - by sanitizing the query before execution
- Cross-Site Scripting Errors - santizing html and javascript
- Securing headers - by using express-helmet to secure http headers
- Rate Limiting - by limiting the request frequency by limiting number of times an IP address can get data with in a given time.
