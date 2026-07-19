const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types; // Import ObjectId correctly
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const FriendRequest = require('./models/FriendRequest');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Middleware for authentication (if needed)
  socket.use((packet, next) => {
    // Add token validation logic if required
    next();
  });

  // Handle user login
  socket.on('user-login', async (userId) => {
    try {
      // Update the user's socketId in the database
      await User.findByIdAndUpdate(userId, { socketId: socket.id });
      console.log(`User ${userId} is now online with socket ID:`, socket.id);
    } catch (error) {
      console.error('Error updating user socket ID:', error);
      socket.emit('error', { message: 'Internal server error. Please try again.' });
    }
  });

  // Sending friend request
  socket.on('send-friend-request', async ({ fromUserId, toUserId }) => {
    console.log('Friend request sent from:', fromUserId, 'to:', toUserId);
    try {
      const recipient = await User.findById(toUserId);
      if (recipient && recipient.socketId) {
        io.to(recipient.socketId).emit('new-friend-request', {
          fromUserId,
          message: 'You have a new friend request!',
        });
      } else {
        console.log('Recipient is offline. Consider queuing notifications.');
        // Implement queuing logic for offline users
      }
    } catch (error) {
      console.error('Error in send-friend-request:', error);
      socket.emit('error', { message: 'Could not send friend request.' });
    }
  });

  // Accepting friend request
  socket.on('accept-friend-request', async ({ fromUserId, toUserId }) => {
    console.log('Friend request accepted by:', toUserId, 'from:', fromUserId);
    try {
      const sender = await User.findById(fromUserId);
      if (sender && sender.socketId) {
        io.to(sender.socketId).emit('friend-request-accepted', {
          toUserId,
          message: 'Your friend request has been accepted!',
        });
      } else {
        console.log('Sender is offline. Consider queuing notifications.');
      }
    } catch (error) {
      console.error('Error in accept-friend-request:', error);
      socket.emit('error', { message: 'Could not process the request.' });
    }
  });

  // Handle user disconnect
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    try {
      await User.updateOne({ socketId: socket.id }, { $unset: { socketId: '' } });
    } catch (error) {
      console.error('Error during user disconnect cleanup:', error);
    }
  });

  // Join Chat Room
  socket.on('join-chat', (conversationId) => {
    socket.join(conversationId);
    console.log(`User with socket ID: ${socket.id} joined chat room: ${conversationId}`);
  });

  // Typing Indicators
  socket.on('typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('typing', { conversationId, userId });
  });

  socket.on('stop-typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('stop-typing', { conversationId, userId });
  });

  // Send Message
  socket.on('send-message', async (data) => {
    const { conversationId, sender, text, image } = data;
    const message = new Message({ conversationId, sender, text, image });
    await message.save();

    io.to(conversationId).emit('receive-message', message);
    
    // Notify receiver if they are not in the chat but online?
    // (This part matches existing 'receive-message' for notifications, 
    // but usually notifications are separate if the user isn't locally in the room)
  });

  // Mark messages as read
  socket.on('mark-messages-read', async ({ conversationId, userId }) => {
    try {
      // Update all messages in this conversation sent by OTHER users to 'read'
      await Message.updateMany(
        { conversationId, sender: { $ne: userId }, status: { $ne: 'read' } },
        { $set: { status: 'read' } }
      );
      
      // Notify the sender(s) that their messages were read
      // We emit to the room, so if the sender is there, they get the update
      io.to(conversationId).emit('messages-read', { conversationId });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Mark specific message as delivered
  socket.on('message-delivered', async ({ messageId }) => {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId, 
        { status: 'delivered' }, 
        { new: true }
      );
      if (message) {
        io.to(message.conversationId.toString()).emit('message-status-update', message);
      }
    } catch (error) {
      console.error('Error marking message as delivered:', error);
    }
  });
});

// Chat Image Upload Route
app.post('/api/chat/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.status(200).json({ filePath: req.file.path });
});


// Sign Up Route
app.post('/signup', upload.single('profilePicture'), async (req, res) => {
  const { username, password, name, email } = req.body;
  const profilePicture = req.file ? req.file.path : ''; // Get the file path

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Validate the password using the regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).',
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      password: hashedPassword,
      name,
      email,
      profilePicture, // Save the file path in the database
    });

    await newUser.save(); // Save the new user to the database

    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' }); // Return error if user doesn't exist
    }

    // Check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials' }); // Return error if password is incorrect
    }

    // Generate Access Token (Short-lived)
    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '15m', 
    });

    // Generate Refresh Token (Long-lived)
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Save Refresh Token to Database (Rotation Strategy)
    user.refreshToken = refreshToken;
    await user.save();

    // Send Refresh Token as HttpOnly Cookie
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      sameSite: 'Strict', // or 'None' if cross-site
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({ token: accessToken, userId: user._id }); // Return access token and user ID
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' }); // Handle server errors
  }
});

// Refresh Token Route
app.get('/refresh-token', async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' });

  const refreshToken = cookies.jwt;

  try {
    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).json({ message: 'Forbidden' }); // Detection of token reuse could be implemented here

    jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, decoded) => {
      if (err || user._id.toString() !== decoded.userId) return res.status(403).json({ message: 'Forbidden' });

      // Rotation: Generate new tokens
      const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
      const newRefreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      // Save new Refresh Token
      user.refreshToken = newRefreshToken;
      await user.save();

      // Send new Refresh Token cookie
      res.cookie('jwt', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ token: accessToken });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Logout Route
app.post('/logout', async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); // No content

  const refreshToken = cookies.jwt;

  // Is refreshToken in db?
  const user = await User.findOne({ refreshToken });
  if (!user) {
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'Strict', secure: process.env.NODE_ENV === 'production' });
    return res.sendStatus(204);
  }

  // Delete refreshToken in db
  user.refreshToken = '';
  await user.save();

  res.clearCookie('jwt', { httpOnly: true, sameSite: 'Strict', secure: process.env.NODE_ENV === 'production' });
  res.sendStatus(204);
});

// Search Users Route
app.get('/search-users', async (req, res) => {
  const { query, userId } = req.query; // Get the search query and userId from the URL

  try {
    // Find the logged-in user and get their friends list
    const user = await User.findById(userId).populate('friends');
    const friendIds = user.friends.map(friend => friend._id); // Extract friend IDs

    // Find users whose username matches the query (case-insensitive) and are not already friends
    const users = await User.find({
      username: { $regex: query, $options: 'i' }, // Case-insensitive search
      _id: { $nin: [...friendIds, userId] }, // Exclude the user and their friends
    }, 'username name profilePicture').lean(); // Use .lean() to convert to plain JavaScript objects

    // Check for pending friend requests
    const usersWithStatus = await Promise.all(users.map(async (foundUser) => {
      const request = await FriendRequest.findOne({
        $or: [
          { from: userId, to: foundUser._id, status: 'pending' },
          { from: foundUser._id, to: userId, status: 'pending' }
        ]
      });

      let status = 'none';
      if (request) {
        if (request.from.toString() === userId) {
          status = 'sent';
        } else {
          status = 'received';
        }
      }

      return { ...foundUser, requestStatus: status };
    }));

    res.status(200).json(usersWithStatus); // Return the list of matching users with request status
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' }); // Handle server errors
  }
});

// Send Friend Request Route
app.post('/send-friend-request', async (req, res) => {
  const { fromUserId, toUserId } = req.body; // Get sender and receiver IDs from the request body

  try {
    console.log("Sending friend request from:", fromUserId, "to:", toUserId); // Debugging

    // Check if the users are already friends
    const fromUser = await User.findById(fromUserId);
    if (fromUser.friends.includes(toUserId)) {
      return res.status(400).json({ message: 'You are already friends with this user.' });
    }

    // Check if a pending request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { from: fromUserId, to: toUserId },
        { from: toUserId, to: fromUserId },
      ],
      status: { $in: ['pending', 'accepted'] }, // Check for pending or accepted requests
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'Friend request already sent or received.' });
      }
      if (existingRequest.status === 'accepted') {
        return res.status(400).json({ message: 'You are already friends with this user.' });
      }
    }

    // Create a new friend request
    const newRequest = new FriendRequest({ from: fromUserId, to: toUserId });
    await newRequest.save(); // Save the new friend request to the database

    console.log("Friend request saved successfully:", newRequest); // Debugging

    // Emit a notification to the recipient
    const recipient = await User.findById(toUserId);
    if (recipient && recipient.socketId) {
      io.to(recipient.socketId).emit('new-friend-request', {
        fromUserId,
        message: 'You have a new friend request!',
      });
    }

    res.status(201).json({ message: 'Friend request sent successfully' }); // Return success message
  } catch (err) {
    console.error("Error sending friend request:", err); // Debugging
    res.status(500).json({ message: 'Something went wrong' }); // Handle server errors
  }
});

// Respond to Friend Request Route
app.post('/respond-friend-request', async (req, res) => {
  const { requestId, status } = req.body; // status can be 'accepted' or 'rejected'

  try {
    console.log("Responding to friend request ID:", requestId, "with status:", status); // Debugging

    // Find the friend request
    const request = await FriendRequest.findById(requestId);
    if (!request) {
      console.log("Friend request not found:", requestId); // Debugging
      return res.status(404).json({ message: 'Friend request not found' }); // Return error if request doesn't exist
    }

    // Update the request status
    request.status = status;
    await request.save(); // Save the updated request

    console.log("Friend request updated successfully:", request); // Debugging

    // If the request is accepted, add each user to the other's friends list
    if (status === 'accepted') {
      await User.findByIdAndUpdate(request.from, { $push: { friends: request.to } }); // Add receiver to sender's friends list
      await User.findByIdAndUpdate(request.to, { $push: { friends: request.from } }); // Add sender to receiver's friends list

      console.log("Users added to each other's friends list:", request.from, request.to); // Debugging

      // Emit a notification to the sender
      const sender = await User.findById(request.from);
      if (sender && sender.socketId) {
        io.to(sender.socketId).emit('friend-request-accepted', {
          toUserId: request.to,
          message: 'Your friend request has been accepted!',
        });
      }
    }

    res.status(200).json({ message: 'Friend request updated successfully' }); // Return success message
  } catch (err) {
    console.error("Error responding to friend request:", err); // Debugging
    res.status(500).json({ message: 'Something went wrong' }); // Handle server errors
  }
});

// Fetch Pending Friend Requests Route
app.get('/pending-friend-requests/:userId', async (req, res) => {
  const { userId } = req.params; // Get the user ID from the URL

  try {
    console.log("Fetching pending friend requests for user:", userId); // Debugging

    // Find all pending requests where the user is the recipient
    const requests = await FriendRequest.find({ to: userId, status: 'pending' })
      .populate('from'); // Populate the 'from' field with the full sender user document

    console.log("Pending friend requests fetched:", requests); // Debugging

    res.status(200).json(requests); // Return the list of pending requests
  } catch (err) {
    console.error("Error fetching pending friend requests:", err); // Debugging
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Friend Recommendations Route
app.get('/friend-recommendations/:userId', async (req, res) => {
  const { userId } = req.params; // Get the user ID from the URL

  try {
    // Convert userId to ObjectId
    const userIdObjectId = new ObjectId(userId); // Use 'new' keyword

    // Get the user's friends
    const user = await User.findById(userIdObjectId).populate('friends');
    const friendIds = user.friends.map(friend => friend._id); // Extract friend IDs

    // Get pending friend requests involving the user
    const pendingRequests = await FriendRequest.find({
      $or: [{ from: userIdObjectId }, { to: userIdObjectId }],
      status: 'pending',
    });

    // Extract user IDs involved in pending requests
    const pendingUserIds = pendingRequests.map(request =>
      request.from.equals(userIdObjectId) ? request.to : request.from
    );

    // Debugging: Log excluded user IDs
    console.log("Excluding user IDs:", [...friendIds, userIdObjectId, ...pendingUserIds]);

    // Find users who are friends of the user's friends but not already friends with the user
    const recommendations = await User.aggregate([
      {
        $match: {
          _id: { $nin: [...friendIds, userIdObjectId, ...pendingUserIds] }, // Exclude the user, their friends, and users with pending requests
          friends: { $in: friendIds }, // Users who are friends with the user's friends
        },
      },
      {
        $project: {
          username: 1,
          name: 1,
          profilePicture: 1,
          mutualFriends: {
            $size: {
              $setIntersection: ['$friends', friendIds], // Calculate the number of mutual friends
            },
          },
        },
      },
      {
        $sort: { mutualFriends: -1 }, // Sort by mutual friends (descending)
      },
      {
        $limit: 10, // Limit the number of recommendations
      },
    ]);

    res.status(200).json(recommendations); // Return the list of recommended users
  } catch (err) {
    console.error("Error fetching friend recommendations:", err); // Debugging
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Fetch Friend List Route
app.get('/friend-list/:userId', async (req, res) => {
  const { userId } = req.params; // Get the user ID from the URL

  try {
    // Find the user and populate the 'friends' field with name, profilePicture, and username
    const user = await User.findById(userId).populate('friends', 'username name profilePicture');

    if (!user) {
      return res.status(404).json({ message: 'User not found' }); // Return error if user doesn't exist
    }

    res.status(200).json(user.friends); // Return the list of friends with name and profilePicture
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' }); // Handle server errors
  }
});

// Unfriend Route
app.post('/unfriend', async (req, res) => {
  const { userId, friendId } = req.body; // Get user ID and friend ID from the request body

  try {
    // Remove the friend from the user's friends list
    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });

    // Remove the user from the friend's friends list
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

    res.status(200).json({ message: 'Unfriended successfully' }); // Return success message
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' }); // Handle server errors
  }
});

// New Conversation Route
app.post('/api/conversations', async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    // Check if a conversation already exists
    const existingConversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (existingConversation) {
      return res.status(200).json(existingConversation);
    }

    // If no conversation exists, create a new one
    const newConversation = new Conversation({
      members: [senderId, receiverId],
    });

    const savedConversation = await newConversation.save();
    res.status(200).json(savedConversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get Conversation of a User
app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const conversation = await Conversation.find({
      members: { $in: [req.params.userId] },
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Add Message
app.post('/api/messages', async (req, res) => {
  const newMessage = new Message(req.body);

  try {
    const savedMessage = await newMessage.save();
    res.status(200).json(savedMessage);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get Messages
app.get('/api/messages/:conversationId', async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
});


// Fetch User by ID Route
app.get('/user/:userId', async (req, res) => {
  const { userId } = req.params; // Get the user ID from the URL

  try {
    console.log("Fetching user with ID:", userId); // Debugging

    // Find user by ID and return name, profilePicture, username, bio, work, location
    const user = await User.findById(userId, 'username name profilePicture bio work location');

    if (!user) {
      console.log("User not found:", userId); // Debugging
      return res.status(404).json({ message: 'User not found' }); // Return error if user doesn't exist
    }

    console.log("User fetched successfully:", user); // Debugging
    res.status(200).json(user); // Return the user object
  } catch (err) {
    console.error("Error fetching user:", err); // Debugging
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Delete User Profile Route
app.delete('/delete-profile/:userId', async (req, res) => {
  const { userId } = req.params; // Get the user ID from the URL

  try {
    console.log("Deleting user with ID:", userId); // Debugging

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found:", userId); // Debugging
      return res.status(404).json({ message: 'User not found' }); // Return error if user doesn't exist
    }

    // Delete all friend requests involving this user
    await FriendRequest.deleteMany({
      $or: [{ from: userId }, { to: userId }],
    });

    // Remove the user from all friends lists
    await User.updateMany(
      { friends: userId },
      { $pull: { friends: userId } }
    );

    // Delete the user
    await User.findByIdAndDelete(userId);

    console.log("User deleted successfully:", userId); // Debugging
    res.status(200).json({ message: 'Profile deleted successfully' }); // Return success message
  } catch (err) {
    console.error("Error deleting user profile:", err); // Debugging
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Profile Update route
app.put('/edit-profile/:userId', upload.single('profilePicture'), async (req, res) => {
  const { userId } = req.params;
  const { name, email, bio, work, location } = req.body;
  const profilePicture = req.file ? req.file.path : '';

  try {
    const updateData = { name, email, bio, work, location };
    if (profilePicture) {
      updateData.profilePicture = profilePicture;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Change Password Route
app.post('/change-password/:userId', async (req, res) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the current password is correct
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Validate the new password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).',
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

// Start the server
const crypto = require('crypto');

// Forgot Password Route
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate token
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In a real app, send email here. For demo, return token.
    console.log(`Reset Token for ${email}: ${token}`);
    res.status(200).json({ message: 'Password reset link sent (check console for token)', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password Route
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({ 
      resetPasswordToken: token, 
      resetPasswordExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});