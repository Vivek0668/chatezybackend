const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Message = require('./models/Message');
const ws = require('ws');
const fs = require('fs');
const { ObjectId } = mongoose.Types; 

dotenv.config();

const port = process.env.PORT || 4040;


mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Database connected successfully"))
  .catch(err => console.log('Database connection failed', err));

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);


const app = express();
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(express.json());
app.use(cookieParser());


const corsOptions = {
  origin: 'http://localhost:5173', 
  credentials: true,
};
app.use(cors(corsOptions));


async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) reject(err);
        resolve(userData);
      });
    } else {
      reject('no token');
    }
  });
}


app.get('/test', (req, res) => {
  res.json('test ok');
});


app.get('/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: ourUserId },
        { sender: ourUserId, recipient: userId }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});


app.get('/people', async (req, res) => {
  try {
    const users = await User.find({}, { _id: 1, username: 1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});


app.get('/profile', async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      throw new Error('No token');
    }
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
});


app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const foundUser = await User.findOne({ username });
    if (!foundUser) {
      throw new Error('User not found');
    }
    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (!passOk) {
      throw new Error('Invalid password');
    }
    const token = jwt.sign({ userId: foundUser._id, username }, jwtSecret, {});
    res.cookie('token', token, { sameSite: 'none', secure: true }).json({ id: foundUser._id });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});


app.post('/logout', (req, res) => {
  res.clearCookie('token').json('ok');
});


app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({ username, password: hashedPassword });
    const token = jwt.sign({ userId: createdUser._id, username }, jwtSecret, {});
    res.cookie('token', token, { sameSite: 'none', secure: true }).status(201).json({ id: createdUser._id });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});


const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
});

const wss = new ws.WebSocketServer({ server });

wss.on('connection', (connection, req) => {
  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach(client => {
      client.send(JSON.stringify({
        online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username })),
      }));
    });
  }

  connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAboutOnlinePeople();
      console.log('dead');
    }, 1000);
  }, 5000);


  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies.split(';').find(str => str.trim().startsWith('token='));
    if (tokenCookieString) {
      const token = tokenCookieString.split('=')[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }
  }


  connection.on('message', async (message) => {
    const messageData = JSON.parse(message.toString());
    const { recipient, text, file } = messageData;

    if (!recipient || !ObjectId.isValid(recipient)) {
      console.error('Invalid recipient ID:', recipient);
      return;
    }

    let filename = null;
    if (file) {
      const parts = file.name.split('.');
      const ext = parts[parts.length - 1];
      filename = Date.now() + '.' + ext;
      const path = __dirname + '/uploads/' + filename;
      fs.writeFile(path, Buffer.from(file.data.split(',')[1], 'base64'), () => {
        console.log('File saved:', path);
      });
    }


    if (recipient && (text || file)) {
      try {
        const messageDoc = await Message.create({
          sender: connection.userId,
          recipient,
          text,
          file: file ? filename : null,
        });
        console.log('Message created:', messageDoc);

     
        [...wss.clients]
          .filter(c => c.userId === recipient)
          .forEach(c => c.send(JSON.stringify({
            text,
            sender: connection.userId,
            recipient,
            file: file ? filename : null,
            _id: messageDoc._id,
          })));
      } catch (err) {
        console.error('Error creating message:', err);
      }
    }
  });


  notifyAboutOnlinePeople();
});
