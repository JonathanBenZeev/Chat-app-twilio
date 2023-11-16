require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')
const cookieParser = require('cookie-parser')
const { jwt: { AccessToken  } } = require('twilio');
const ChatGrant = AccessToken.ChatGrant;
const { VideoGrant } = require('twilio').jwt.AccessToken;


const app = express()
const http = require('http').createServer(app)
app.use(cookieParser())
app.use(express.json())

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'public')))
} else {
  const corsOptions = {
    origin: [
      'http://127.0.0.1:5173',
      'https://localhost:5173',
    ],
    credentials: true,
  }
  app.use(cors(corsOptions))
}

const authRoutes = require('./api/auth/auth.routes')
const userRoutes = require('./api/user/user.routes')

// twilio token
app.get('/api/token', (req, res) => {
    const identity = req.query.identity;
       console.log(identity);
    const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY,
        process.env.TWILIO_API_SECRET,
        {identity}
    );
    // console.log(token);
    // token.addGrant(new ChatGrant({
    //     serviceSid: process.env.TWILIO_CHAT_SERVICE_SID,
    // }));
    const chatGrant = new ChatGrant({
        serviceSid: process.env.TWILIO_CHAT_SERVICE_SID,
    });
    token.addGrant(chatGrant);

    // Video grant
    const videoGrant = new VideoGrant();
    token.addGrant(videoGrant);
   

    res.send({
        identity: identity,
        token: token.toJwt(),
    });
});


// routes
const setupAsyncLocalStorage = require('./middlewares/setupAls.middleware')
app.all('*', setupAsyncLocalStorage)

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)

app.get('/**', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

const logger = require('./services/logger.service')
const port = process.env.PORT || 3030

http.listen(port, () => {
  logger.info('Server is running on port: ' + port)
})
