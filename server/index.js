require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/user");
const bcrypt = require("bcryptjs");
const Event = require("./models/event");
const Resource = require("./models/resources");
const Message = require("./models/message");
const jwt = require("jsonwebtoken");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


let isDatabaseConnected = false;
const localEvents = [];
const localResources = [];

function findItemIndexById(collection, id) {
  return collection.findIndex((item) => String(item._id) === String(id));
}

function requireAuth(req, res, next) {
  try {
    if (!JWT_SECRET) {
      return res.status(500).send("Missing JWT_SECRET in server .env");
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).send("Authorization token is required.");
    }

    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).send("Invalid or expired token.");
  }
}

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.status(200).send("Server is running ");
});

// Signup API
app.post("/signup", async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      return res.status(503).send("Signup is unavailable until the database connects.");
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).send("Name, email, and password are required.");
    }

    if (password.length < 6) {
      return res.status(400).send("Password must be at least 6 characters.");
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });

    if (existingUser) {
      return res.status(409).send("An account with this email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    await newUser.save();

    res.send("User registered successfully ✅");
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post("/login", async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      return res.status(503).send("Login is unavailable until the database connects.");
    }

    if (!JWT_SECRET) {
      return res.status(500).send("Missing JWT_SECRET in server .env");
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Email and password are required.");
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(400).send("User not found ❌");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send("Wrong password ❌");
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET);

    res.json({
      message: "Login successful ✅",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/me", requireAuth, async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      return res.status(503).send("Profile is unavailable until the database connects.");
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send("User not found.");
    }

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    return res.status(401).send("Invalid or expired token.");
  }
});

app.get("/users", requireAuth, async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      return res.status(503).send("Users are unavailable until the database connects.");
    }

    const users = await User.find().select("_id name email").sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/messages/:userId/:selectedUserId", requireAuth, async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      return res.status(503).send("Messages are unavailable until the database connects.");
    }

    const { userId, selectedUserId } = req.params;

    if (String(req.user.id) !== String(userId)) {
      return res.status(403).send("You can only access your own conversations.");
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: selectedUserId },
        { sender: selectedUserId, receiver: userId },
      ],
    })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post("/messages", requireAuth, async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      return res.status(503).send("Messages are unavailable until the database connects.");
    }

    const { receiver, text } = req.body;
    const sender = req.user.id;

    if (!receiver || !text || !text.trim()) {
      return res.status(400).send("Receiver and message are required.");
    }

    const message = await Message.create({
      sender,
      receiver,
      text: text.trim(),
    });

    const populatedMessage = await message.populate([
      { path: "sender", select: "name email" },
      { path: "receiver", select: "name email" },
    ]);

    io.to(sender).emit("receivePrivateMessage", populatedMessage);
    io.to(receiver).emit("receivePrivateMessage", populatedMessage);

    res.json(populatedMessage);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Add Event API
app.post("/add-event", requireAuth, async (req, res) => {
  try {
    const { title, description, date } = req.body;

    if (!title || !description || !date) {
      return res.status(400).send("Title, description, and date are required.");
    }

    if (!isDatabaseConnected) {
      localEvents.push({
        _id: `local-event-${Date.now()}`,
        title,
        description,
        date,
      });

      return res.send("Event added locally. Database is currently offline.");
    }

    const newEvent = new Event({
      title,
      description,
      date,
    });

    await newEvent.save();

    res.send("Event added successfully ✅");
  } catch (err) {
    res.status(500).send(err);
  }
});

// Get Events API
app.get("/events", async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      return res.json(localEvents);
    }

    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put("/events/:id", requireAuth, async (req, res) => {
  try {
    const { title, description, date } = req.body;

    if (!title || !description || !date) {
      return res.status(400).send("Title, description, and date are required.");
    }

    if (!isDatabaseConnected) {
      const eventIndex = findItemIndexById(localEvents, req.params.id);

      if (eventIndex === -1) {
        return res.status(404).send("Event not found.");
      }

      localEvents[eventIndex] = {
        ...localEvents[eventIndex],
        title,
        description,
        date,
      };

      return res.send("Event updated locally.");
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, date },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).send("Event not found.");
    }

    return res.send("Event updated successfully ✅");
  } catch (err) {
    return res.status(500).send(err);
  }
});

app.delete("/events/:id", requireAuth, async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      const eventIndex = findItemIndexById(localEvents, req.params.id);

      if (eventIndex === -1) {
        return res.status(404).send("Event not found.");
      }

      localEvents.splice(eventIndex, 1);
      return res.send("Event deleted locally.");
    }

    const deletedEvent = await Event.findByIdAndDelete(req.params.id);

    if (!deletedEvent) {
      return res.status(404).send("Event not found.");
    }

    return res.send("Event deleted successfully ✅");
  } catch (err) {
    return res.status(500).send(err);
  }
});

// Add Resource API
app.post("/add-resource", requireAuth, async (req, res) => {
  try {
    const { title, link, subject } = req.body;

    if (!title || !link || !subject) {
      return res.status(400).send("Title, link, and subject are required.");
    }

    if (!isDatabaseConnected) {
      localResources.push({
        _id: `local-resource-${Date.now()}`,
        title,
        link,
        subject,
      });

      return res.send("Resource added locally. Database is currently offline.");
    }

    const newResource = new Resource({
      title,
      link,
      subject,
    });

    await newResource.save();

    res.send("Resource added successfully ✅");
  } catch (err) {
    res.status(500).send(err);
  }
});
// Get Resources API
app.get("/resources", async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      return res.json(localResources);
    }

    const resources = await Resource.find();
    res.json(resources);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put("/resources/:id", requireAuth, async (req, res) => {
  try {
    const { title, link, subject } = req.body;

    if (!title || !link || !subject) {
      return res.status(400).send("Title, link, and subject are required.");
    }

    if (!isDatabaseConnected) {
      const resourceIndex = findItemIndexById(localResources, req.params.id);

      if (resourceIndex === -1) {
        return res.status(404).send("Resource not found.");
      }

      localResources[resourceIndex] = {
        ...localResources[resourceIndex],
        title,
        link,
        subject,
      };

      return res.send("Resource updated locally.");
    }

    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id,
      { title, link, subject },
      { new: true }
    );

    if (!updatedResource) {
      return res.status(404).send("Resource not found.");
    }

    return res.send("Resource updated successfully ✅");
  } catch (err) {
    return res.status(500).send(err);
  }
});

app.delete("/resources/:id", requireAuth, async (req, res) => {
  try {
    if (!isDatabaseConnected) {
      const resourceIndex = findItemIndexById(localResources, req.params.id);

      if (resourceIndex === -1) {
        return res.status(404).send("Resource not found.");
      }

      localResources.splice(resourceIndex, 1);
      return res.send("Resource deleted locally.");
    }

    const deletedResource = await Resource.findByIdAndDelete(req.params.id);

    if (!deletedResource) {
      return res.status(404).send("Resource not found.");
    }

    return res.send("Resource deleted successfully ✅");
  } catch (err) {
    return res.status(500).send(err);
  }
});

app.post("/chat", requireAuth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).send("Message is required");
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).send("Missing GEMINI_API_KEY in server .env");
    }

    let events = [];
    let resources = [];

    if (isDatabaseConnected) {
      events = await Event.find();
      resources = await Resource.find();
    } else {
      events = localEvents;
      resources = localResources;
    }

    const eventsText = events
      .map((event) => {
        return `Title: ${event.title}, Date: ${event.date}, Description: ${event.description}`;
      })
      .join("\n");

    const resourcesText = resources
      .map((resource) => {
        return `Title: ${resource.title}, Subject: ${resource.subject}, Link: ${resource.link}`;
      })
      .join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        You are a helpful campus assistant for the Synergia student platform.

        Use the following Synergia data to answer the user's question.
        If the answer is not in this data, say you could not find it in Synergia.

        Events:
        ${eventsText || "No events available."}

        Resources:
        ${resourcesText || "No resources available."}

        User question:
        ${message.trim()}
`,
    });

    res.send(response.text || "No response generated.");
  } catch (err) {
    console.error("Chat Error:", err);
    res
      .status(err.status || 500)
      .send(err?.message || "Server error in chatbot");
  }
});


const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinUserRoom", (userId) => {
    if (!userId) {
      return;
    }

    socket.join(userId);
    console.log(`User ${userId} joined private chat room`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(8000, () => {
  console.log("Server running on port 8000");
});



if (!MONGO_URI) {
  console.log("Missing MONGO_URI in server .env");
} else {
  mongoose.connect(MONGO_URI)
  .then(() => {
    isDatabaseConnected = true;
    console.log("MongoDB connected ✅");
  })
  .catch((err) => console.log(err));
}
