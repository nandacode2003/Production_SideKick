const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { Match, Event, Chat } = require('../models/index');

router.delete('/user/:email', async (req, res) => {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET)
    return res.status(401).json({ error: 'Unauthorized' });
  try {
    await User.deleteOne({ email: req.params.email });
    res.json({ message: `Deleted user ${req.params.email}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/seed', async (req, res) => {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const USERS = [
    { name: 'Rahul Kumar',  email: 'rahul@sidekick-demo.com',  phone: '9000000001', city: 'Bhubaneswar', vibe: 'Adventurer', interests: ['Movies', 'Cricket', 'Travel'],      bio: 'Always up for spontaneous plans',  availability: { weekdays: false, weekends: true,  evenings: true  } },
    { name: 'Priya Sharma', email: 'priya@sidekick-demo.com',  phone: '9000000002', city: 'Cuttack',      vibe: 'Foodie',     interests: ['Food', 'Coffee', 'Movies'],       bio: 'Weekend foodie explorer',          availability: { weekdays: false, weekends: true,  evenings: true  } },
    { name: 'Arjun Patel',  email: 'arjun@sidekick-demo.com',  phone: '9000000003', city: 'Cuttack',      vibe: 'Planner',    interests: ['Sports', 'Gaming', 'Music'],      bio: "Let's make it happen",             availability: { weekdays: true,  weekends: true,  evenings: false } },
    { name: 'Sneha Reddy',  email: 'sneha@sidekick-demo.com',  phone: '9000000004', city: 'Bhubaneswar', vibe: 'Socialite',  interests: ['Dancing', 'Music', 'Hangout'],    bio: 'Life of the party',                availability: { weekdays: false, weekends: true,  evenings: true  } },
    { name: 'Vikram Singh', email: 'vikram@sidekick-demo.com', phone: '9000000005', city: 'Cuttack',      vibe: 'Go-Getter',  interests: ['Cricket', 'Sports', 'Adventure'], bio: 'Challenge accepted',               availability: { weekdays: true,  weekends: true,  evenings: true  } },
    { name: 'Ananya Das',   email: 'ananya@sidekick-demo.com', phone: '9000000006', city: 'Cuttack',      vibe: 'Chill One',  interests: ['Books', 'Coffee', 'Art'],         bio: 'Bookworm seeking company',         availability: { weekdays: true,  weekends: false, evenings: true  } },
    { name: 'Rohan Mehta',  email: 'rohan@sidekick-demo.com',  phone: '9000000007', city: 'Bhubaneswar', vibe: 'Adventurer', interests: ['Travel', 'Adventure', 'Food'],    bio: 'Wanderlust soul',                  availability: { weekdays: false, weekends: true,  evenings: true  } },
    { name: 'Kavya Nair',   email: 'kavya@sidekick-demo.com',  phone: '9000000008', city: 'Cuttack',      vibe: 'Foodie',     interests: ['Food', 'Movies', 'Music'],        bio: "Feed me and tell me I'm pretty",   availability: { weekdays: false, weekends: true,  evenings: true  } },
    { name: 'Aditya Joshi', email: 'aditya@sidekick-demo.com', phone: '9000000009', city: 'Cuttack',      vibe: 'Planner',    interests: ['Study', 'Books', 'Coffee'],       bio: 'Study buddy needed',               availability: { weekdays: true,  weekends: false, evenings: false } },
    { name: 'Ishita Gupta', email: 'ishita@sidekick-demo.com', phone: '9000000010', city: 'Bhubaneswar', vibe: 'Socialite',  interests: ['Hangout', 'Dancing', 'Movies'],   bio: "Let's go out!",                    availability: { weekdays: false, weekends: true,  evenings: true  } },
  ];

  try {
    const emails = USERS.map(u => u.email);
    await User.deleteMany({ email: { $in: emails } });
    await Event.deleteMany({ title: { $in: ['Movie Night: Pushpa 3', 'Cricket at the Maidan', 'Cafe Hopping', 'Study Session: DSA', 'Live Music Jam'] } });

    const hash = await bcrypt.hash('sidekick123', 12);
    const createdUsers = await User.insertMany(USERS.map(u => ({
      ...u, password: hash,
      isEmailVerified: true, isIdVerified: true, isFaceVerified: true,
      safetyScore: 90 + Math.floor(Math.random() * 11),
    })));

    const byName = {};
    createdUsers.forEach(u => { byName[u.name] = u; });

    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const saturday = new Date(); saturday.setDate(saturday.getDate() + ((6 - saturday.getDay() + 7) % 7 || 7));
    const sunday   = new Date(); sunday.setDate(sunday.getDate()     + ((0 - sunday.getDay()   + 7) % 7 || 7));
    const monday   = new Date(); monday.setDate(monday.getDate()     + ((1 - monday.getDay()   + 7) % 7 || 7));
    const friday   = new Date(); friday.setDate(friday.getDate()     + ((5 - friday.getDay()   + 7) % 7 || 7));

    await Event.insertMany([
      { title: 'Movie Night: Pushpa 3', description: 'Lets watch Pushpa 3 together!',                    category: 'movie',  creator: byName['Priya Sharma']._id, city: 'Cuttack',      location: 'Central Mall',            date: tomorrow, time: '7:00 PM',  maxParticipants: 4,  participants: [byName['Priya Sharma']._id], status: 'upcoming' },
      { title: 'Cricket at the Maidan', description: 'Friendly cricket match, all skill levels welcome', category: 'sports', creator: byName['Vikram Singh']._id, city: 'Cuttack',      location: 'Barabati Stadium Ground', date: saturday, time: '6:00 AM',  maxParticipants: 10, participants: [byName['Vikram Singh']._id, byName['Arjun Patel']._id], status: 'upcoming' },
      { title: 'Cafe Hopping',          description: 'Explore the best cafes in Bhubaneswar',            category: 'food',   creator: byName['Rohan Mehta']._id,  city: 'Bhubaneswar', location: 'Infocity Area',           date: sunday,   time: '4:00 PM',  maxParticipants: 3,  participants: [byName['Rohan Mehta']._id], status: 'upcoming' },
      { title: 'Study Session: DSA',    description: 'Group study for Data Structures and Algorithms',   category: 'study',  creator: byName['Aditya Joshi']._id, city: 'Cuttack',      location: 'Central Library',         date: monday,   time: '10:00 AM', maxParticipants: 5,  participants: [byName['Aditya Joshi']._id, byName['Ananya Das']._id], status: 'upcoming' },
      { title: 'Live Music Jam',        description: 'Enjoy live music performances at Esplanade',       category: 'music',  creator: byName['Sneha Reddy']._id,  city: 'Bhubaneswar', location: 'Esplanade Mall',          date: friday,   time: '8:00 PM',  maxParticipants: 6,  participants: [byName['Sneha Reddy']._id, byName['Ishita Gupta']._id], status: 'upcoming' },
    ]);

    const m2 = await Match.create({ users: [byName['Arjun Patel']._id, byName['Vikram Singh']._id], initiator: byName['Arjun Patel']._id, status: 'accepted', compatibilityScore: 85, matchedInterests: ['Sports', 'Cricket'] });
    const m3 = await Match.create({ users: [byName['Rahul Kumar']._id, byName['Rohan Mehta']._id],  initiator: byName['Rahul Kumar']._id,  status: 'accepted', compatibilityScore: 78, matchedInterests: ['Travel', 'Adventure'] });
    await Match.create({ users: [byName['Priya Sharma']._id, byName['Kavya Nair']._id], initiator: byName['Priya Sharma']._id, status: 'pending', compatibilityScore: 72, matchedInterests: ['Food', 'Movies'] });

    await Chat.create({ match: m2._id, participants: [byName['Arjun Patel']._id, byName['Vikram Singh']._id], messages: [{ sender: byName['Arjun Patel']._id, text: 'Hey! Ready for cricket on Saturday?', read: true, createdAt: new Date() }, { sender: byName['Vikram Singh']._id, text: 'Absolutely! See you at 6AM 🏏', read: false, createdAt: new Date() }], lastMessage: { text: 'Absolutely! See you at 6AM 🏏', sender: byName['Vikram Singh']._id, createdAt: new Date() } });
    await Chat.create({ match: m3._id, participants: [byName['Rahul Kumar']._id, byName['Rohan Mehta']._id], messages: [{ sender: byName['Rahul Kumar']._id, text: 'Fellow traveler! Where next?', read: true, createdAt: new Date() }], lastMessage: { text: 'Fellow traveler! Where next?', sender: byName['Rahul Kumar']._id, createdAt: new Date() } });

    res.json({ message: 'Database seeded with 10 users, 5 events, 3 matches' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
