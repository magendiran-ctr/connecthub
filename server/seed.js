import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import {
  User,
  Post,
  Comment,
  Like,
  Follow,
  Notification,
  Message,
  SavedPost,
} from "./models/index.js";

await connectDB();
await Promise.all(
  [User, Post, Comment, Like, Follow, Notification, Message, SavedPost].map(
    (Model) => Model.deleteMany({}),
  ),
);
const image = (id, width = 1200, height = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=85`;
const portraits = [
  "photo-1535713875002-d1d0cf377fde",
  "photo-1494790108377-be9c29b29330",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1534528741775-53994a69daeb",
  "photo-1500648767791-00dcc994a43e",
  "photo-1531123897727-8f129e1688ce",
  "photo-1507003211169-0a1dd7228f2d",
  "photo-1544005313-94ddf0286df2",
  "photo-1508214751196-bcfd4ca60f91",
  "photo-1527980965255-d3b416303d12",
  "photo-1517841905240-472988babdf9",
  "photo-1506277886164-e25aa3f4ef7f",
];
const password = await bcrypt.hash("Password123!", 12);
const people = [
  [
    "Aisha Khan",
    "aisha.khan",
    "creator",
    "Product designer building thoughtful digital experiences.",
    false,
  ],
  [
    "Dev Patel",
    "dev.patel",
    "technology",
    "Frontend engineer and open-source contributor.",
    false,
  ],
  [
    "Meera Iyer",
    "meera.iyer",
    "business",
    "Founder stories, leadership and community.",
    false,
  ],
  [
    "Arjun Rao",
    "arjun.rao",
    "creator",
    "Photographer documenting city life.",
    false,
  ],
  [
    "Nila Das",
    "nila.das",
    "creator",
    "Writer, reader and curious human.",
    false,
  ],
  [
    "ConnectWire",
    "connectwire",
    "news",
    "Breaking stories and global context, curated for your feed.",
    true,
  ],
  [
    "ScreenScene",
    "screenscene",
    "entertainment",
    "Film, streaming, culture and red-carpet moments.",
    true,
  ],
  [
    "FutureStack",
    "futurestack",
    "technology",
    "The people and ideas shaping tomorrow.",
    true,
  ],
  [
    "The Matchday",
    "thematchday",
    "sports",
    "The stories behind the score.",
    true,
  ],
  [
    "Market Brief",
    "marketbrief",
    "business",
    "Smart business news in five minutes.",
    true,
  ],
  [
    "Maya Kapoor",
    "mayakapoor",
    "entertainment",
    "Actor, producer and lifelong storyteller.",
    true,
  ],
  [
    "Style Ledger",
    "styleledger",
    "fashion",
    "The looks, designers and ideas moving fashion forward.",
    true,
  ],
  [
    "Passport Notes",
    "passportnotes",
    "travel",
    "Travel stories for curious people.",
    true,
  ],
  [
    "SoundCheck",
    "soundcheck",
    "music",
    "New music, live sessions and culture.",
    true,
  ],
  [
    "Green Signal",
    "greensignal",
    "news",
    "Climate reporting that makes a difference.",
    true,
  ],
  [
    "Food Atlas",
    "foodatlas",
    "travel",
    "Recipes, tables and places worth traveling for.",
    true,
  ],
  ["Rohan Shah", "rohan.shah", "creator", "Building in public.", false],
  ["Tara Singh", "tara.singh", "creator", "Community designer.", false],
  ["Kabir Mehta", "kabir.mehta", "creator", "Independent maker.", false],
  ["Anya Roy", "anya.roy", "creator", "Creative director.", false],
  ["Vikram Bose", "vikram.bose", "creator", "Design systems advocate.", false],
  ["Ishita Sen", "ishita.sen", "creator", "Climate communicator.", false],
  ["Neel Joshi", "neel.joshi", "creator", "Data and storytelling.", false],
  ["Sana Ali", "sana.ali", "creator", "Culture writer.", false],
  ["Kiran Nair", "kiran.nair", "creator", "Developer relations.", false],
  ["Priya Menon", "priya.menon", "creator", "Designing calmer digital spaces.", false],
  ["Omar Farooq", "omar.farooq", "creator", "Street photography and everyday stories.", false],
  ["Zoya Fernandes", "zoya.fernandes", "creator", "Finding color in ordinary days.", false],
  ["Rhea Kapoor", "rhea.kapoor", "fashion", "Independent style and emerging designers.", false],
  ["Naveen Kumar", "naveen.kumar", "sports", "Local teams and weekend matchdays.", false],
  ["Anand Krishnan", "anand.krishnan", "technology", "Small tools, useful ideas.", false],
  ["Lina George", "lina.george", "travel", "Slow trips and good food.", false],
  ["Siddharth Jain", "siddharth.jain", "business", "Building thoughtful businesses.", false],
  ["Pooja Nair", "pooja.nair", "creator", "Books, sketches and quiet mornings.", false],
  ["Farhan Sheikh", "farhan.sheikh", "music", "Live music from local venues.", false],
  ["Mira Bose", "mira.bose", "creator", "Making things with friends.", false],
  ["Tanya Verma", "tanya.verma", "creator", "Notes from a creative life.", false],
  ["Ibrahim Khan", "ibrahim.khan", "creator", "People and places worth remembering.", false],
  ["Kavya Reddy", "kavya.reddy", "creator", "A little art every day.", false],
  ["Rahul Das", "rahul.das", "creator", "Learning in public, one project at a time.", false],
];
const users = await User.insertMany(
  people.map(([name, username, category, bio, isVerified], i) => ({
    name,
    username,
    email: `${username}@connecthub.dev`,
    password,
    profileImage: image(portraits[i % portraits.length], 240, 240),
    coverImage: image(
      [
        "photo-1497366754035-f200968a6e72",
        "photo-1517245386807-bb43f82c33c4",
        "photo-1497366216548-37526070297c",
      ][i % 3],
    ),
    bio,
    location: [
      "Bengaluru, India",
      "Mumbai, India",
      "Chennai, India",
      "Delhi, India",
    ][i % 4],
    skills: ["Design", "React", "Storytelling"].slice(0, (i % 3) + 1),
    category,
    isVerified,
    role: i === 0 ? "admin" : "user",
  })),
);
const byUsername = Object.fromEntries(
  users.map((user) => [user.username, user]),
);
const samples = [
  [
    "connectwire",
    "Public spaces made for people, not cars. #news #cities",
    image("photo-1477959858617-67f85cf4f1df"),
  ],
  [
    "screenscene",
    "An independent film and a room full of stories. #cinema #culture",
    image("photo-1489599849927-2ee91cede3ba"),
  ],
  [
    "mayakapoor",
    "A quiet moment before the premiere. #actorslife #film",
    image("photo-1488426862026-3ee34a7d66df"),
  ],
  [
    "futurestack",
    "More time for making, less time on busywork. #technology #ai",
    image("photo-1518770660439-4636190af475"),
  ],
  [
    "thematchday",
    "The crowd, the lights, the final whistle. #sports #matchday",
    image("photo-1461896836934-ffe607ba8211"),
  ],
  [
    "marketbrief",
    "Three signals founders are watching this quarter. #business #startups",
    image("photo-1551288049-bebda4e38f71"),
  ],
  [
    "styleledger",
    "Street style, with a point of view. #fashion #style",
    image("photo-1490481651871-ab68de25d43d"),
  ],
  [
    "passportnotes",
    "Sunrise trains and cities waking up. #travel #wanderlust",
    image("photo-1500530855697-b586d89ba3ee"),
  ],
  [
    "soundcheck",
    "One chorus, one room, everyone singing. #music #live",
    image("photo-1524368535928-5b5e00ddc76b"),
  ],
  [
    "greensignal",
    "Local people making change close to home. #climate #news",
    image("photo-1469474968028-56623f02e42e"),
  ],
  [
    "foodatlas",
    "The best meal was the unplanned one. #food #travel",
    image("photo-1504674900247-0877df9cc836"),
  ],
  [
    "aisha.khan",
    "A small feature, a smoother day. #buildinpublic #design",
    image("photo-1558655146-9f40138edfeb"),
  ],
  [
    "dev.patel",
    "Making space for curiosity. #community",
    image("photo-1516321318423-f06f85e504b3"),
  ],
  [
    "arjun.rao",
    "The city at blue hour. #photography #citylife",
    image("photo-1449824913935-59a10b8d2000"),
  ],
];
const exploreVisuals = [
  "photo-1498050108023-c5249f4df085",
  "photo-1500534314209-a25ddb2bd429",
  "photo-1482192596544-9eb780fc7f66",
  "photo-1519608487953-e999c86e7450",
  "photo-1469854523086-cc02fe5d8800",
  "photo-1441974231531-c6227db76b6e",
  "photo-1507525428034-b723cf961d3e",
  "photo-1519501025264-65ba15a82390",
  "photo-1511818966892-d7d671e672a2",
  "photo-1519710164239-da123dc03ef4",
  "photo-1492684223066-81342ee5ff30",
  "photo-1506157786151-b8491531f063",
  "photo-1529139574466-a303027c1d8b",
  "photo-1524250502761-1ac6f2e30d43",
  "photo-1483985988355-763728e1935b",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1534528741775-53994a69daeb",
  "photo-1517841905240-472988babdf9",
  "photo-1500534623283-312aade485b7",
  "photo-1460661419201-fd4cecdf8a8b",
];
const captions = [
  "A little color for today. #creative",
  "A favorite city moment. #photography",
  "From sketch to screen. #design",
  "Taking the morning slowly. #community",
  "Somewhere new. #travel",
  "Making things worth sharing. #creator",
];
const filler = Array.from({ length: 100 }, (_, i) => {
  const author = users[i % users.length];
  return [
    author.username,
    captions[i % captions.length],
    image(exploreVisuals[i % exploreVisuals.length]),
  ];
});
const posts = await Post.insertMany(
  [...samples, ...filler].map(([username, content, imageUrl], i) => ({
    userId: byUsername[username]._id,
    content,
    imageUrl,
    mediaType: i >= samples.length && i < samples.length + 5 ? "reel" : "post",
    viewsCount: Math.floor(800 + i * 319),
    hashtags: (content.match(/#\w+/g) || []).map((tag) =>
      tag.slice(1).toLowerCase(),
    ),
    location: byUsername[username].location,
  })),
);
const follows = [];
for (let i = 0; i < users.length; i++)
  for (let step = 1; step <= 8; step++)
    follows.push({
      followerId: users[i]._id,
      followingId: users[(i + step) % users.length]._id,
    });
for (const user of users)
  for (const channel of users.filter((item) => item.category !== "creator"))
    if (user.username !== channel.username)
      follows.push({ followerId: user._id, followingId: channel._id });
await Follow.insertMany(follows, { ordered: false }).catch(() => {});
for (let i = 0; i < posts.length * 3; i++) {
  const post = posts[i % posts.length],
    user = users[(i + 3) % users.length];
  try {
    await Like.create({ userId: user._id, postId: post._id });
    await Post.findByIdAndUpdate(post._id, { $inc: { likesCount: 1 } });
  } catch {}
}
for (let i = 0; i < posts.length * 2; i++) {
  const post = posts[i % posts.length];
  await Comment.create({
    postId: post._id,
    userId: users[(i + 5) % users.length]._id,
    text: [
      "This is a great perspective.",
      "Saving this for later.",
      "Exactly the conversation we need.",
    ][i % 3],
  });
  await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: 1 } });
}
console.log(
  `Seeded ${users.length} profiles, ${posts.length} image-rich posts and an expanded follower graph. Login: aisha.khan@connecthub.dev / Password123!`,
);
process.exit();
