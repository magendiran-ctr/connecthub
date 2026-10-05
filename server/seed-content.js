import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { Comment, Follow, Like, Post, User } from "./models/index.js";

const image = (id, width = 1200, height = 1500) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=85`;

const featuredCreators = [
  {
    name: "The Matchday",
    username: "thematchday",
    category: "sports",
    bio: "Big plays, local teams and the moments after the final whistle.",
    photo: "photo-1461896836934-ffe607ba8211",
  },
  {
    name: "Ria Moves",
    username: "fitwithria",
    category: "fitness",
    bio: "Realistic training, recovery days and small wins.",
    photo: "photo-1534438327276-14e5300c3a48",
  },
  {
    name: "The Laugh Track",
    username: "laughinghour",
    category: "comedy",
    bio: "Tiny sketches about the very serious business of being human.",
    photo: "photo-1527224857830-43a7acc85260",
  },
  {
    name: "Soft Focus",
    username: "softfocusdaily",
    category: "aesthetics",
    bio: "Light, color and little details worth noticing.",
    photo: "photo-1490750967868-88aa4486c946",
  },
  {
    name: "Weekend Frames",
    username: "weekendframes",
    category: "travel",
    bio: "Slow weekends, open roads and places with a story.",
    photo: "photo-1500530855697-b586d89ba3ee",
  },
  {
    name: "City Bites",
    username: "citybites",
    category: "travel",
    bio: "Street food, neighborhood tables and the people behind them.",
    photo: "photo-1504674900247-0877df9cc836",
  },
  {
    name: "SoundCheck",
    username: "soundcheck",
    category: "music",
    bio: "Small venues, big choruses and new sounds.",
    photo: "photo-1524368535928-5b5e00ddc76b",
  },
  {
    name: "Campus Diaries",
    username: "campusdiaries",
    category: "lifestyle",
    bio: "Study breaks, late-night ideas and campus life.",
    photo: "photo-1529156069898-49953e39b3ac",
  },
];

const featuredPosts = [
  [
    "thematchday",
    "Last-minute winner. Whole stand on its feet. #football #matchday",
    "photo-1574629810360-7efbbe195018",
    "reel",
  ],
  [
    "thematchday",
    "Sunday league, perfect weather, and a team that never stops running. #grassroots #football",
    "photo-1517466787929-bc90951d0974",
    "post",
  ],
  [
    "thematchday",
    "Warm-up rituals before the biggest game of the season. #sports #ritual",
    "photo-1521412644187-c49fa049e84d",
    "reel",
  ],
  [
    "thematchday",
    "The view from courtside says it all. #basketball #courtside",
    "photo-1546519638-68e109498ffc",
    "post",
  ],
  [
    "fitwithria",
    "Thirty minutes, a playlist, and showing up for yourself. #fitness #workout",
    "photo-1534438327276-14e5300c3a48",
    "reel",
  ],
  [
    "fitwithria",
    "Strong is built one ordinary session at a time. #strength #gym",
    "photo-1517836357463-d25dfeac3438",
    "post",
  ],
  [
    "fitwithria",
    "A mobility flow for the days after leg day. Save this for later. #recovery #mobility",
    "photo-1544367567-0f2fcb009e0b",
    "reel",
  ],
  [
    "fitwithria",
    "Rest days are part of the plan, too. #wellness #balance",
    "photo-1546483875-ad9014c88eba",
    "post",
  ],
  [
    "laughinghour",
    "Me saying 'one more episode' at 1:47 a.m. #relatable #comedy",
    "photo-1527224857830-43a7acc85260",
    "reel",
  ],
  [
    "laughinghour",
    "The group chat has appointed me as the unofficial trip planner again. #friends #sketch",
    "photo-1529156069898-49953e39b3ac",
    "reel",
  ],
  [
    "laughinghour",
    "POV: the meeting could have been a voice note. #workhumor #office",
    "photo-1497366754035-f200968a6e72",
    "post",
  ],
  [
    "laughinghour",
    "When the food arrives and suddenly everyone is a photographer. #foodie #comedy",
    "photo-1504674900247-0877df9cc836",
    "reel",
  ],
  [
    "softfocusdaily",
    "Late afternoon light doing its thing. #aesthetic #goldenhour",
    "photo-1490750967868-88aa4486c946",
    "post",
  ],
  [
    "softfocusdaily",
    "A quiet desk, fresh flowers, and nowhere to rush. #slowmorning #details",
    "photo-1497366216548-37526070297c",
    "reel",
  ],
  [
    "softfocusdaily",
    "Blue hour over the neighborhood. #citylights #mood",
    "photo-1519608487953-e999c86e7450",
    "post",
  ],
  [
    "softfocusdaily",
    "Little colors from today's walk. #colorstudy #everydaybeauty",
    "photo-1494438639946-1ebd1d20bf85",
    "reel",
  ],
  [
    "weekendframes",
    "Took the slower road and found this little lookout. #weekendtrip #travel",
    "photo-1500530855697-b586d89ba3ee",
    "post",
  ],
  [
    "weekendframes",
    "A train window, a new playlist, and a day with no schedule. #travelnotes #reel",
    "photo-1474487548417-781cb71495f3",
    "reel",
  ],
  [
    "weekendframes",
    "The kind of coastline that makes you miss your stop. #ocean #wander",
    "photo-1507525428034-b723cf961d3e",
    "post",
  ],
  [
    "citybites",
    "Found the best noodles on a side street. #streetfood #food",
    "photo-1569718212165-3a8278d5f624",
    "post",
  ],
  [
    "citybites",
    "Crispy edges, extra herbs, no leftovers. #comfortfood #tastetest",
    "photo-1565299624946-b28f40a0ae38",
    "reel",
  ],
  [
    "citybites",
    "The tiny cafe with the very serious cardamom buns. #coffeestop #localfood",
    "photo-1509042239860-f550ce710b93",
    "post",
  ],
  [
    "soundcheck",
    "The room knew every word by the second chorus. #livemusic #gig",
    "photo-1514525253161-7a46d19cd819",
    "reel",
  ],
  [
    "soundcheck",
    "New track for the late-night walk home. #nowplaying #music",
    "photo-1470225620780-dba8ba36b745",
    "post",
  ],
  [
    "campusdiaries",
    "Library study break that turned into a sunset break. #campuslife #study",
    "photo-1523050854058-8df90110c9f1",
    "post",
  ],
  [
    "campusdiaries",
    "The five-minute coffee run that saved the group project. #studentlife #reel",
    "photo-1511920170033-f8396924c348",
    "reel",
  ],
];

const themes = {
  sports: {
    bio: "Matchday moments, local teams and the work behind every win.",
    hashtags: ["sports", "matchday"],
    photos: [
      "photo-1461896836934-ffe607ba8211",
      "photo-1574629810360-7efbbe195018",
      "photo-1546519638-68e109498ffc",
      "photo-1517466787929-bc90951d0974",
      "photo-1521412644187-c49fa049e84d",
      "photo-1531415074968-036ba1b575da",
      "photo-1504450758481-7338eba7524a",
      "photo-1508098682722-e99c43a406b2",
      "photo-1522778119026-d647f0596c20",
      "photo-1579952363873-27f3bade9f55",
    ],
    moments: [
      "a last-minute winner",
      "the first whistle",
      "a perfect pass",
      "the away-day crowd",
      "extra time under the lights",
      "a team huddle",
      "the post-game high five",
      "a quiet training session",
      "a courtside view",
      "the long road to game day",
    ],
  },
  fitness: {
    bio: "Training, recovery and small wins that add up.",
    hashtags: ["fitness", "gym"],
    photos: [
      "photo-1534438327276-14e5300c3a48",
      "photo-1517836357463-d25dfeac3438",
      "photo-1544367567-0f2fcb009e0b",
      "photo-1518611012118-696072aa579a",
      "photo-1571019613454-1cb2f99b2d8b",
      "photo-1583454110551-21f2fa2afe61",
      "photo-1599058917212-d750089bc07a",
      "photo-1581009146145-b5ef050c2e1e",
      "photo-1534258936925-c58bed479fcb",
      "photo-1579758629938-03607ccdbaba",
    ],
    moments: [
      "showing up for leg day",
      "a new personal best",
      "the warm-up that changed everything",
      "a mobility reset",
      "a steady morning run",
      "the last set",
      "a much-needed rest day",
      "finding a new training rhythm",
      "stronger form, lighter weights",
      "the walk home after a good session",
    ],
  },
  comedy: {
    bio: "Short sketches about the everyday plot twists.",
    hashtags: ["comedy", "relatable"],
    photos: [
      "photo-1527224857830-43a7acc85260",
      "photo-1529156069898-49953e39b3ac",
      "photo-1497366754035-f200968a6e72",
      "photo-1492684223066-81342ee5ff30",
      "photo-1511988617509-a57c8a288659",
      "photo-1521737711867-e3b97375f902",
      "photo-1531058020387-3be344556be6",
      "photo-1497366216548-37526070297c",
      "photo-1517245386807-bb43f82c33c4",
      "photo-1516321318423-f06f85e504b3",
    ],
    moments: [
      "saying one more episode at 2 a.m.",
      "the group chat making the plans",
      "a meeting that could be an email",
      "trying to leave the house on time",
      "the dramatic food delivery refresh",
      "accidentally matching outfits",
      "the friend who always says five minutes",
      "a very serious coffee order",
      "the camera opening at the wrong time",
      "pretending the plant is still fine",
    ],
  },
  education: {
    bio: "Study habits, curious questions and learning out loud.",
    hashtags: ["learning", "studygram"],
    photos: [
      "photo-1456513080510-7bf3a84b82f8",
      "photo-1497633762265-9d179a990aa6",
      "photo-1501504905252-473c47e087f8",
      "photo-1524995997946-a1c2e315a42f",
      "photo-1519682337058-a94d519337bc",
      "photo-1434030216411-0b793f4b4173",
      "photo-1512820790803-83ca734da794",
      "photo-1455390582262-044cdead277a",
      "photo-1516979187457-637abb4f9353",
      "photo-1521587760476-6c12a4b040da",
    ],
    moments: [
      "the concept that finally clicked",
      "a study break with a proper walk",
      "one page of notes that made it clear",
      "learning something outside the syllabus",
      "the question that opened a new rabbit hole",
      "a quiet library afternoon",
      "a better way to remember the details",
      "the group study session that worked",
      "a small milestone worth celebrating",
      "starting before everything feels perfect",
    ],
  },
  aesthetics: {
    bio: "Light, color and little details worth keeping.",
    hashtags: ["aesthetic", "dailylook"],
    photos: [
      "photo-1490750967868-88aa4486c946",
      "photo-1494438639946-1ebd1d20bf85",
      "photo-1519608487953-e999c86e7450",
      "photo-1497366216548-37526070297c",
      "photo-1441974231531-c6227db76b6e",
      "photo-1500534623283-312aade485b7",
      "photo-1511818966892-d7d671e672a2",
      "photo-1519710164239-da123dc03ef4",
      "photo-1492684223066-81342ee5ff30",
      "photo-1506157786151-b8491531f063",
    ],
    moments: [
      "late afternoon window light",
      "fresh flowers on the desk",
      "a blue-hour walk",
      "the colors on the way home",
      "a slow Sunday morning",
      "rain on the city windows",
      "the little corner cafe",
      "a favorite book and a quiet hour",
      "a golden-hour view",
      "the details in an ordinary day",
    ],
  },
  travel: {
    bio: "Slow weekends, new streets and stories from the road.",
    hashtags: ["travel", "weekendtrip"],
    photos: [
      "photo-1500530855697-b586d89ba3ee",
      "photo-1474487548417-781cb71495f3",
      "photo-1507525428034-b723cf961d3e",
      "photo-1500534314209-a25ddb2bd429",
      "photo-1482192596544-9eb780fc7f66",
      "photo-1469854523086-cc02fe5d8800",
      "photo-1441974231531-c6227db76b6e",
      "photo-1500534623283-312aade485b7",
      "photo-1519501025264-65ba15a82390",
      "photo-1501785888041-af3ef285b470",
    ],
    moments: [
      "taking the slower road",
      "a train window with no schedule",
      "the coastline before breakfast",
      "getting happily lost downtown",
      "the view from the last stop",
      "a new city on foot",
      "the tiny guesthouse garden",
      "a mountain morning",
      "the market just after sunrise",
      "a weekend with no itinerary",
    ],
  },
  food: {
    bio: "Neighborhood tables, street food and good company.",
    hashtags: ["foodie", "citybites"],
    photos: [
      "photo-1504674900247-0877df9cc836",
      "photo-1565299624946-b28f40a0ae38",
      "photo-1509042239860-f550ce710b93",
      "photo-1569718212165-3a8278d5f624",
      "photo-1476224203421-9ac39bcb3327",
      "photo-1547592180-85f173990554",
      "photo-1555939594-58d7cb561ad1",
      "photo-1540189549336-e6e99c3679fe",
      "photo-1414235077428-338989a2e8c0",
      "photo-1546069901-ba9599a7e63c",
    ],
    moments: [
      "the best noodles on a side street",
      "crispy edges and extra herbs",
      "a tiny cafe with perfect coffee",
      "the family recipe everyone asked for",
      "the first bite while it is still hot",
      "a market stall worth the detour",
      "Sunday lunch that ran long",
      "the dessert we said we would share",
      "a new place around the corner",
      "the table full of friends",
    ],
  },
  music: {
    bio: "Live rooms, new sounds and songs worth replaying.",
    hashtags: ["music", "soundcheck"],
    photos: [
      "photo-1514525253161-7a46d19cd819",
      "photo-1470225620780-dba8ba36b745",
      "photo-1524368535928-5b5e00ddc76b",
      "photo-1501386761578-eac5c94b800a",
      "photo-1459749411175-04bf5292ceea",
      "photo-1506157786151-b8491531f063",
      "photo-1493225457124-a3eb161ffa5f",
      "photo-1516280440614-37939bbacd81",
      "photo-1501612780327-45045538702b",
      "photo-1510915361894-db8b60106cb1",
    ],
    moments: [
      "the room singing the second chorus",
      "a soundcheck before doors",
      "the last song of the night",
      "a new track for the ride home",
      "front row with old friends",
      "the quiet before the encore",
      "a record shop find",
      "the band everyone should know",
      "a tiny venue with huge energy",
      "the playlist for a long walk",
    ],
  },
  lifestyle: {
    bio: "Little routines, people and places that make a day.",
    hashtags: ["lifestyle", "everyday"],
    photos: [
      "photo-1529156069898-49953e39b3ac",
      "photo-1497366216548-37526070297c",
      "photo-1511920170033-f8396924c348",
      "photo-1500530855697-b586d89ba3ee",
      "photo-1511988617509-a57c8a288659",
      "photo-1521737711867-e3b97375f902",
      "photo-1531058020387-3be344556be6",
      "photo-1492684223066-81342ee5ff30",
      "photo-1517245386807-bb43f82c33c4",
      "photo-1497366754035-f200968a6e72",
    ],
    moments: [
      "a coffee run that turned into a walk",
      "a desk reset before Monday",
      "a long lunch with good people",
      "a new playlist for the commute",
      "the five-minute break we needed",
      "a small win from this week",
      "a slow start and a clear head",
      "an afternoon outside the routine",
      "the little ritual that keeps me grounded",
      "a day that went better than planned",
    ],
  },
  fashion: {
    bio: "Personal style, repeat outfits and color experiments.",
    hashtags: ["style", "outfitinspo"],
    photos: [
      "photo-1529139574466-a303027c1d8b",
      "photo-1490481651871-ab68de25d43d",
      "photo-1483985988355-763728e1935b",
      "photo-1524504388940-b1c1722653e1",
      "photo-1524250502761-1ac6f2e30d43",
      "photo-1515886657613-9f3515b0c78f",
      "photo-1485230895905-ec40ba36b9bc",
      "photo-1496747611176-843222e1e57c",
      "photo-1515372039744-b8f02a3ae446",
      "photo-1539109136881-3be0616acf4b",
    ],
    moments: [
      "the jacket that makes the outfit",
      "a favorite look on repeat",
      "today's color combination",
      "vintage finds with a story",
      "comfortable shoes, better plans",
      "a wardrobe remix",
      "the details on this old favorite",
      "getting dressed for no reason",
      "a new local designer",
      "the outfit that came together last minute",
    ],
  },
  gaming: {
    bio: "Co-op nights, close matches and favorite builds.",
    hashtags: ["gaming", "playtogether"],
    photos: [
      "photo-1542751371-adc38448a05e",
      "photo-1547394765-185e1e68f34e",
      "photo-1493711662062-fa541adb3fc8",
      "photo-1511512578047-dfb367046420",
      "photo-1593305841991-05c297ba4575",
      "photo-1603481546238-487240415921",
      "photo-1535223289827-42f1e9919769",
      "photo-1552820728-8b83bb6b773f",
      "photo-1525869811964-53594bfcb4b2",
      "photo-1560253023-3ec5d502959f",
    ],
    moments: [
      "the co-op run that finally worked",
      "one more match with the squad",
      "a clutch finish nobody expected",
      "the new setup feeling just right",
      "a favorite level revisited",
      "the best kind of friendly competition",
      "the first look at a new game",
      "the late-night lobby",
      "a build that finally came together",
      "the team call after the win",
    ],
  },
  technology: {
    bio: "Useful tools, curious experiments and things being built.",
    hashtags: ["technology", "buildinpublic"],
    photos: [
      "photo-1518770660439-4636190af475",
      "photo-1498050108023-c5249f4df085",
      "photo-1516321318423-f06f85e504b3",
      "photo-1519389950473-47ba0277781c",
      "photo-1535223289827-42f1e9919769",
      "photo-1550751827-4bd374c3f58b",
      "photo-1485827404703-89b55fcc595e",
      "photo-1526374965328-7f61d4dc18c5",
      "photo-1563986768609-322da13575f3",
      "photo-1558494949-ef010cbdcc31",
    ],
    moments: [
      "a tiny tool that saved an hour",
      "the bug that taught me something",
      "a weekend prototype taking shape",
      "a cleaner version of the first idea",
      "the first successful deploy",
      "a useful shortcut worth sharing",
      "a notebook full of rough ideas",
      "making the boring part easier",
      "a small open-source contribution",
      "the team demo that finally clicked",
    ],
  },
  art: {
    bio: "Sketchbooks, works in progress and color studies.",
    hashtags: ["art", "creativeprocess"],
    photos: [
      "photo-1460661419201-fd4cecdf8a8b",
      "photo-1513364776144-60967b0f800f",
      "photo-1513519245088-0e12902e5a38",
      "photo-1541961017774-22349e4a1262",
      "photo-1515405295579-ba7b45403062",
      "photo-1531058020387-3be344556be6",
      "photo-1547891654-e66ed7ebb968",
      "photo-1577083552431-6e5fd01aa342",
      "photo-1579783902614-a3fb3927b6a5",
      "photo-1501472312651-726afe119ff1",
    ],
    moments: [
      "a sketch that became something else",
      "the colors from this morning",
      "a work in progress on the studio floor",
      "the happy accident in the last layer",
      "a page from the current notebook",
      "trying a different brush today",
      "an idea worth following",
      "making a mess before it makes sense",
      "a tiny study in warm light",
      "the piece that took the scenic route",
    ],
  },
  beauty: {
    bio: "Everyday routines, honest reviews and self-care notes.",
    hashtags: ["beauty", "selfcare"],
    photos: [
      "photo-1524504388940-b1c1722653e1",
      "photo-1524250502761-1ac6f2e30d43",
      "photo-1516975080664-ed2fc6a32937",
      "photo-1522335789203-aabd1fc54bc9",
      "photo-1596462502278-27bfdc403348",
      "photo-1570172619644-dfd03ed5d881",
      "photo-1608248543803-ba4f8c70ae0b",
      "photo-1611930022073-b7a4ba5fcccd",
      "photo-1601049541289-9b1b7bbbfe19",
      "photo-1556229010-6c3f2c9ca5f8",
    ],
    moments: [
      "a five-minute morning routine",
      "the shade that surprised me",
      "a no-rush reset after a long week",
      "keeping the routine simple today",
      "a small detail that changed the look",
      "the everyday product I finished",
      "a soft color for a quiet day",
      "getting ready with a favorite playlist",
      "a routine that feels like mine",
      "a little time set aside for myself",
    ],
  },
  education: {
    bio: "Study habits, curious questions and learning out loud.",
    hashtags: ["learning", "studygram"],
    photos: [
      "photo-1456513080510-7bf3a84b82f8",
      "photo-1497633762265-9d179a990aa6",
      "photo-1501504905252-473c47e087f8",
      "photo-1524995997946-a1c2e315a42f",
      "photo-1519682337058-a94d519337bc",
      "photo-1434030216411-0b793f4b4173",
      "photo-1512820790803-83ca734da794",
      "photo-1455390582262-044cdead277a",
      "photo-1516979187457-637 ಸಮ?",
    ],
    moments: [
      "the concept that finally clicked",
      "a study break with a proper walk",
      "one page of notes that made it clear",
      "learning something outside the syllabus",
      "the question that opened a new rabbit hole",
      "a quiet library afternoon",
      "a better way to remember the details",
      "the group study session that worked",
      "a small milestone worth celebrating",
      "starting before everything feels perfect",
    ],
  },
};

themes.education.photos = [
  "photo-1456513080510-7bf3a84b82f8",
  "photo-1497633762265-9d179a990aa6",
  "photo-1501504905252-473c47e087f8",
  "photo-1524995997946-a1c2e315a42f",
  "photo-1519682337058-a94d519337bc",
  "photo-1434030216411-0b793f4b4173",
  "photo-1512820790803-83ca734da794",
  "photo-1455390582262-044cdead277a",
  "photo-1516979187457-637abb4f9353",
  "photo-1521587760476-6c12a4b040da",
];

const categoryNames = Object.keys(themes);
const firstNames = [
  "Aarav",
  "Maya",
  "Kai",
  "Zara",
  "Ishaan",
  "Nina",
  "Rohan",
  "Anika",
  "Dev",
  "Leah",
  "Arjun",
  "Sara",
  "Kabir",
  "Mira",
  "Ethan",
  "Tara",
  "Neel",
  "Aisha",
  "Omar",
  "Kavya",
];
const lastNames = [
  "Shah",
  "Rao",
  "Mehta",
  "Sen",
  "Patel",
  "Nair",
  "Das",
  "Kapoor",
  "Ali",
  "Roy",
  "Khan",
  "Iyer",
  "Bose",
  "Singh",
  "Fernandes",
  "Verma",
  "Joshi",
  "Menon",
  "George",
  "Reddy",
];
const creators = [...featuredCreators];

for (let index = creators.length; index < 150; index += 1) {
  const generatedIndex = index - featuredCreators.length;
  const category = categoryNames[generatedIndex % categoryNames.length];
  const theme = themes[category];
  creators.push({
    name: `${firstNames[generatedIndex % firstNames.length]} ${lastNames[Math.floor(generatedIndex / firstNames.length) % lastNames.length]}`,
    username: `creator_${String(index + 1).padStart(3, "0")}`,
    category,
    bio: theme.bio,
    photo: theme.photos[generatedIndex % theme.photos.length],
  });
}

const totalPosts = creators.length * 10;
const totalReels = creators.length * 3;
const dryRun = process.argv.includes("--dry-run");

if (
  !Object.entries(themes).every(
    ([category, theme]) =>
      theme.photos.length >= 10 && new Set(theme.photos).size >= 10,
  ) ||
  !creators.every((creator, creatorIndex) => {
    const photos = Array.from(
      { length: 10 },
      (_, postIndex) =>
        themes[creator.category].photos[
          (creatorIndex + postIndex) % themes[creator.category].photos.length
        ],
    );
    return new Set(photos).size === 10;
  })
) {
  throw new Error("Each profile needs ten unique, related post images");
}

if (dryRun) {
  console.log(
    `Dry run: ${creators.length} profiles, ${totalPosts} posts, ${totalReels} Reel posts, ten unique related images per profile, and ${creators.length * 20} generated follows. MongoDB was not contacted.`,
  );
  process.exit(0);
}

await connectDB();
const password = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
const operationsInBatches = async (Model, operations, batchSize = 500) => {
  for (let offset = 0; offset < operations.length; offset += batchSize) {
    await Model.bulkWrite(operations.slice(offset, offset + batchSize), {
      ordered: false,
    });
  }
};

await operationsInBatches(
  User,
  creators.map((creator) => ({
    updateOne: {
      filter: { username: creator.username },
      update: {
        $setOnInsert: {
          name: creator.name,
          username: creator.username,
          email: `${creator.username}@connecthub.dev`,
          password,
          category: creator.category,
          bio: creator.bio,
          profileImage: image(creator.photo, 320, 320),
          coverImage: image(creator.photo),
          location: "Bengaluru, India",
          isVerified: featuredCreators.some(
            (featured) => featured.username === creator.username,
          ),
          role: "user",
        },
      },
      upsert: true,
    },
  })),
);

const persistedUsers = await User.find({
  username: { $in: creators.map((creator) => creator.username) },
})
  .select("_id username")
  .lean();
const userByUsername = new Map(
  persistedUsers.map((user) => [user.username, user]),
);
const seedUsers = creators.map((creator) =>
  userByUsername.get(creator.username),
);
const featuredPostsByUser = featuredPosts.map(
  ([username, content, photo, mediaType]) => {
    const user = userByUsername.get(username);
    return {
      updateOne: {
        filter: { userId: user._id, content },
        update: {
          $set: { imageUrl: image(photo) },
          $setOnInsert: {
            userId: user._id,
            content,
            mediaType,
            hashtags: (content.match(/#\w+/g) || []).map((tag) =>
              tag.slice(1).toLowerCase(),
            ),
            location: user.location || "Bengaluru, India",
            privacy: "public",
          },
        },
        upsert: true,
      },
    };
  },
);

const captionTemplates = [
  "Today's {moment} was the best part of the day.",
  "A little reminder to make time for {moment}.",
  "POV: you found your new favorite {moment}.",
  "Keeping this {moment} moment forever.",
  "Consider this your sign to try {moment}.",
  "Good people, good light, and {moment}.",
  "Current mood: {moment}.",
  "Not a highlight reel, just a really good {moment} day.",
  "What's your favorite kind of {moment}?",
  "More of this {moment}, please.",
];
const generatedPosts = [];
const postOwnerIndex = new Map();

creators.forEach((creator, creatorIndex) => {
  const theme = themes[creator.category];
  theme.moments.forEach((moment, postIndex) => {
    const content = `${captionTemplates[postIndex].replace("{moment}", moment)} #${theme.hashtags[0]} #${theme.hashtags[1]}`;
    const seedKey = `connecthub-community-v1-${creator.username}-${postIndex + 1}`;
    generatedPosts.push({
      seedKey,
      userId: seedUsers[creatorIndex]._id,
      content,
      imageUrl: image(
        theme.photos[(creatorIndex + postIndex) % theme.photos.length],
      ),
      mediaType: postIndex % 4 === 0 ? "reel" : "post",
      hashtags: [theme.hashtags[0], theme.hashtags[1]],
      location: "Bengaluru, India",
      privacy: "public",
      likesCount: 3,
      commentsCount: 2,
      viewsCount: Math.floor(500 + Math.random() * 25000),
      createdAt: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ),
    });
    postOwnerIndex.set(seedKey, { creatorIndex, postIndex });
  });
});

await operationsInBatches(Post, [
  ...featuredPostsByUser,
  ...generatedPosts.map(({ imageUrl, ...post }) => ({
    updateOne: {
      filter: { seedKey: post.seedKey },
      update: { $set: { imageUrl }, $setOnInsert: post },
      upsert: true,
    },
  })),
]);

const persistedPosts = await Post.find({
  seedKey: { $in: generatedPosts.map((post) => post.seedKey) },
})
  .select("_id seedKey")
  .lean();
const postBySeedKey = new Map(
  persistedPosts.map((post) => [post.seedKey, post]),
);
const likeOperations = [];
const commentOperations = [];
const commentTexts = [
  "This is exactly the energy I needed today.",
  "Saving this one for later. More of this, please!",
];

for (const post of generatedPosts) {
  const persistedPost = postBySeedKey.get(post.seedKey);
  const { creatorIndex } = postOwnerIndex.get(post.seedKey);
  for (let offset = 1; offset <= 3; offset += 1) {
    const user = seedUsers[(creatorIndex + offset) % seedUsers.length];
    likeOperations.push({
      updateOne: {
        filter: { userId: user._id, postId: persistedPost._id },
        update: {
          $setOnInsert: { userId: user._id, postId: persistedPost._id },
        },
        upsert: true,
      },
    });
  }
  for (let offset = 4; offset <= 5; offset += 1) {
    const user = seedUsers[(creatorIndex + offset) % seedUsers.length];
    const text =
      commentTexts[
        (creatorIndex + postOwnerIndex.get(post.seedKey).postIndex + offset) %
          commentTexts.length
      ];
    commentOperations.push({
      updateOne: {
        filter: { userId: user._id, postId: persistedPost._id, text },
        update: {
          $setOnInsert: { userId: user._id, postId: persistedPost._id, text },
        },
        upsert: true,
      },
    });
  }
}

const followOperations = [];
for (let index = 0; index < seedUsers.length; index += 1) {
  for (let offset = 1; offset <= 20; offset += 1) {
    const followerId = seedUsers[index]._id;
    const followingId = seedUsers[(index + offset) % seedUsers.length]._id;
    followOperations.push({
      updateOne: {
        filter: { followerId, followingId },
        update: { $setOnInsert: { followerId, followingId } },
        upsert: true,
      },
    });
  }
}

const demoUsers = await User.find({ email: /@connecthub\.dev$/ })
  .select("_id")
  .lean();
for (const follower of demoUsers) {
  for (const creator of featuredCreators) {
    const followingId = userByUsername.get(creator.username)._id;
    if (String(follower._id) === String(followingId)) continue;
    followOperations.push({
      updateOne: {
        filter: { followerId: follower._id, followingId },
        update: {
          $setOnInsert: { followerId: follower._id, followingId },
        },
        upsert: true,
      },
    });
  }
}

await operationsInBatches(Follow, followOperations);
await operationsInBatches(Like, likeOperations);
await operationsInBatches(Comment, commentOperations);

console.log(
  `Seeded ${creators.length} demo profiles, at least 10 posts per profile, ${totalReels} Reel posts, a follow graph, and likes/comments. Existing user content was kept.`,
);
await mongoose.disconnect();
