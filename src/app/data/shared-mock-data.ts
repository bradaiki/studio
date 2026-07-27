// Shared mock data used by both MockDataService and DataSeedingService
// This ensures consistency between local mock data and seeded database data

export const MOCK_ARTS = [
  {
    name: 'Aikido',
    type: 'aikido',
    description: 'Aikido is a modern Japanese martial art that emphasizes harmony and the redirection of an attacker\'s energy. Founded by Morihei Ueshiba in the early 20th century, it combines joint locks, throws, and pins with spiritual and philosophical principles.',
    shortDescription: 'A Japanese martial art focused on harmony and redirecting energy',
    image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=400&fit=crop&auto=format',
    category: 'martial-arts',
    origin: 'Japan, early 20th century',
    philosophy: 'The way of harmonious spirit',
    benefits: ['Improved balance', 'Mental focus', 'Stress reduction', 'Self-defense', 'Flexibility'],
    techniques: ['Ikkyo', 'Nikyo', 'Sankyo', 'Irimi', 'Tenkan'],
    equipment: ['Gi', 'Hakama', 'Bokken', 'Jo', 'Tanto'],
    difficulty: 'intermediate',
    physicalDemands: 'moderate',
    mentalAspects: ['Mindfulness', 'Non-violence', 'Spiritual awareness', 'Patience'],
    relatedArts: [],
    organizations: [],
    studios: [],
    isPublic: true
  },
  {
    name: 'Hatha Yoga',
    type: 'yoga',
    description: 'Traditional yoga focusing on physical postures, breathing techniques, and meditation.',
    shortDescription: 'Traditional yoga for body and mind balance',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop&auto=format',
    category: 'wellness',
    origin: 'India, ancient tradition',
    philosophy: 'Union of body, mind, and spirit',
    benefits: ['Flexibility', 'Better posture', 'Stress reduction', 'Improved breathing', 'Mental clarity'],
    techniques: ['Sun Salutation', 'Warrior poses', 'Tree pose', 'Downward dog', 'Savasana'],
    equipment: ['Yoga mat', 'Blocks', 'Strap', 'Bolster', 'Blanket'],
    difficulty: 'beginner',
    physicalDemands: 'low',
    mentalAspects: ['Mindfulness', 'Breath awareness', 'Inner peace', 'Self-acceptance'],
    relatedArts: [],
    organizations: [],
    studios: [],
    isPublic: true
  },
  {
    name: 'Pottery',
    type: 'pottery',
    description: 'The ancient art of shaping clay into functional or decorative ceramic objects.',
    shortDescription: 'Creating ceramic art from clay',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=400&fit=crop&auto=format',
    category: 'crafts',
    origin: 'Ancient civilizations worldwide',
    philosophy: 'Transforming earth into art through patience and skill',
    benefits: ['Stress relief', 'Hand-eye coordination', 'Focus', 'Accomplishment', 'Mindfulness'],
    techniques: ['Wheel throwing', 'Hand building', 'Centering', 'Trimming', 'Glazing'],
    equipment: ['Potter\'s wheel', 'Clay', 'Kiln', 'Tools', 'Glazes', 'Sponges'],
    difficulty: 'intermediate',
    physicalDemands: 'moderate',
    mentalAspects: ['Patience', 'Creative expression', 'Problem-solving', 'Attention to detail'],
    relatedArts: [],
    organizations: [],
    studios: [],
    isPublic: true
  },
  {
    name: 'Brazilian Jiu-Jitsu',
    type: 'jujitsu',
    description: 'Ground-fighting martial art emphasizing technique and leverage over strength.',
    shortDescription: 'The gentle art of ground fighting',
    image: 'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=800&h=400&fit=crop&auto=format',
    category: 'martial-arts',
    origin: 'Brazil, early 20th century',
    philosophy: 'Using technique and leverage to overcome size and strength',
    benefits: ['Full-body workout', 'Self-defense', 'Problem-solving', 'Confidence', 'Mental toughness'],
    techniques: ['Guard positions', 'Mount control', 'Back control', 'Submissions', 'Sweeps'],
    equipment: ['BJJ gi', 'Belt', 'Rash guard', 'Shorts', 'Mouthguard'],
    difficulty: 'intermediate',
    physicalDemands: 'high',
    mentalAspects: ['Strategic thinking', 'Staying calm', 'Humility', 'Continuous learning'],
    relatedArts: [],
    organizations: [],
    studios: [],
    isPublic: true
  },
  {
    name: 'Woodworking',
    type: 'woodworking',
    description: 'The craft of creating functional and artistic objects from wood.',
    shortDescription: 'Crafting with wood',
    image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=400&fit=crop&auto=format',
    category: 'crafts',
    origin: 'Ancient craft worldwide',
    philosophy: 'Respecting the material and bringing out natural beauty',
    benefits: ['Practical skills', 'Creative expression', 'Accomplishment', 'Stress relief', 'Problem-solving'],
    techniques: ['Measuring', 'Sawing', 'Joinery', 'Planing', 'Sanding', 'Finishing'],
    equipment: ['Hand saws', 'Power tools', 'Measuring tools', 'Clamps', 'Sandpaper', 'Safety gear'],
    difficulty: 'intermediate',
    physicalDemands: 'moderate',
    mentalAspects: ['Attention to detail', 'Spatial reasoning', 'Planning', 'Patience'],
    relatedArts: [],
    organizations: [],
    studios: [],
    isPublic: true
  }
];

export const MOCK_ORGANIZATIONS = [
  { name: 'International Aikido Federation', description: 'Premier global Aikido organization', type: 'martial-arts', foundedYear: 1976, headquarters: 'Tokyo, Japan', memberCount: 50000, website: 'https://aikido-international.org', contactEmail: 'info@aikido-international.org', isVerified: true, heroImage: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=400&fit=crop&auto=format&q=80' },
  { name: 'Yoga Alliance', description: 'Largest yoga community association', type: 'wellness', foundedYear: 1999, headquarters: 'Arlington, VA', memberCount: 100000, website: 'https://yogaalliance.org', contactEmail: 'info@yogaalliance.org', isVerified: true, heroImage: 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&h=400&fit=crop&auto=format&q=80' },
  { name: 'American Craft Council', description: 'Championing craft artists', type: 'crafts', foundedYear: 1943, headquarters: 'Minneapolis, MN', memberCount: 25000, website: 'https://craftcouncil.org', contactEmail: 'council@craftcouncil.org', isVerified: true, heroImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=400&fit=crop&auto=format&q=80' },
  { name: 'International BJJ Federation', description: 'Governing body for BJJ', type: 'martial-arts', foundedYear: 1994, headquarters: 'Rio de Janeiro, Brazil', memberCount: 75000, website: 'https://ibjjf.com', contactEmail: 'contact@ibjjf.com', isVerified: true, heroImage: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&h=400&fit=crop&auto=format&q=80' },
  { name: 'World Karate Federation', description: 'Olympic karate organization', type: 'martial-arts', foundedYear: 1990, headquarters: 'Madrid, Spain', memberCount: 200000, website: 'https://wkf.net', contactEmail: 'info@wkf.net', isVerified: true, heroImage: 'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=800&h=400&fit=crop&auto=format&q=80' },
  { name: 'National Pottery Association', description: 'Supporting ceramic artists', type: 'crafts', foundedYear: 1985, headquarters: 'Portland, OR', memberCount: 15000, website: 'https://pottery-association.org', contactEmail: 'hello@pottery-association.org', isVerified: true, heroImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=400&fit=crop&auto=format&q=80' },
  { name: 'International Yoga Federation', description: 'Promoting yoga education', type: 'wellness', foundedYear: 1987, headquarters: 'New Delhi, India', memberCount: 80000, website: 'https://iyf.org', contactEmail: 'contact@iyf.org', isVerified: true, heroImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop&auto=format&q=80' },
  { name: 'Woodworkers Guild of America', description: 'Community of woodworkers', type: 'crafts', foundedYear: 2008, headquarters: 'Denver, CO', memberCount: 35000, website: 'https://wwgoa.com', contactEmail: 'support@wwgoa.com', isVerified: true, heroImage: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=400&fit=crop&auto=format&q=80' },
  { name: 'United States Judo Federation', description: 'Developing judo athletes', type: 'martial-arts', foundedYear: 1952, headquarters: 'Colorado Springs, CO', memberCount: 45000, website: 'https://usjf.com', contactEmail: 'info@usjf.com', isVerified: true, heroImage: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=400&fit=crop&auto=format&q=80' },
  { name: 'International Pilates Association', description: 'Pilates instruction standards', type: 'wellness', foundedYear: 2005, headquarters: 'London, UK', memberCount: 30000, website: 'https://pilates-association.org', contactEmail: 'info@pilates-association.org', isVerified: true, heroImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=400&fit=crop&auto=format&q=80' },
  { name: 'Global Martial Arts Federation', description: 'Uniting martial artists worldwide', type: 'martial-arts', foundedYear: 2010, headquarters: 'Singapore', memberCount: 120000, website: 'https://gmaf.org', contactEmail: 'contact@gmaf.org', isVerified: true, heroImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop&auto=format&q=80' }
];

// Generator functions for large datasets
export function generateMockStudios(count: number = 107) {
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston', 'Portland', 'Miami', 'Atlanta', 'Las Vegas', 'Detroit'];
  const studioTypes = ['Dojo', 'Studio', 'Academy', 'Center', 'School', 'Institute', 'Workshop', 'Space'];
  const artTypes = ['Aikido', 'Yoga', 'BJJ', 'Karate', 'Pottery', 'Woodworking', 'Pilates', 'Judo', 'Taekwondo'];
  
  // Curated Unsplash images for different art types
  const artImages: { [key: string]: string[] } = {
    'Aikido': [
      'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop&auto=format'
    ],
    'Yoga': [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=400&fit=crop&auto=format'
    ],
    'BJJ': [
      'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=400&fit=crop&auto=format'
    ],
    'Karate': [
      'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop&auto=format'
    ],
    'Pottery': [
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=800&h=400&fit=crop&auto=format'
    ],
    'Woodworking': [
      'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=400&fit=crop&auto=format'
    ],
    'Pilates': [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop&auto=format'
    ],
    'Judo': [
      'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=400&fit=crop&auto=format'
    ],
    'Taekwondo': [
      'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=400&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop&auto=format'
    ]
  };
  
  const studios = [];
  for (let i = 0; i < count; i++) {
    const city = cities[i % cities.length];
    const type = studioTypes[i % studioTypes.length];
    const art = artTypes[i % artTypes.length];
    const slug = `${city.toLowerCase().replace(/\s+/g, '-')}-${art.toLowerCase()}-${i}`;
    
    // Get appropriate image for this art type
    const images = artImages[art] || artImages['Aikido'];
    const heroImage = images[i % images.length];
    
    studios.push({
      name: `${city} ${art} ${type}`,
      description: `Premier ${art.toLowerCase()} training facility in ${city}`,
      address: `${100 + i} Main Street, ${city}`,
      city: city,
      state: 'State',
      zipCode: `${10000 + i}`,
      country: 'USA',
      phone: `(555) ${String(i).padStart(3, '0')}-${String(i * 10).padStart(4, '0')}`,
      email: `info@${slug}.example.com`,
      website: `https://${slug}.example.com`,
      heroImage: heroImage,
      primaryArt: art.toLowerCase(),
      instructorCount: Math.floor(Math.random() * 10) + 3,
      memberCount: Math.floor(Math.random() * 200) + 50,
      establishedYear: 1990 + Math.floor(Math.random() * 34),
      facilities: ['Training area', 'Changing rooms', 'Equipment storage'],
      amenities: ['Parking', 'WiFi', 'Water fountain'],
      isVerified: i % 3 === 0
    });
  }
  return studios;
}

export function generateMockPeople(count: number = 154) {
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'];
  const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green'];
  
  const people: any[] = [];

  // Add well-known users first (userId matches Cognito sub)
  people.push({
    userId: '74b874a8-a0e1-7052-d963-51a1303f1c2b', // brad@aikicode.com
    handle: '@Tony',
    displayName: 'Tony',
    bio: 'Platform administrator and developer',
    location: 'HQ',
    website: '',
    profileImage: 'https://ui-avatars.com/api/?name=Tony&size=300&background=random&color=fff',
    isInstructor: false,
    isVerified: true,
    isAdmin: true,
    joinedDate: new Date(2020, 0, 1).toISOString()
  });

  people.push({
    userId: '6478c468-b011-70e0-b5bb-e11009070cc4', // brad@aikicode.org
    handle: '@Winnie',
    displayName: 'Winnie',
    bio: 'Just browsing',
    location: '',
    website: '',
    profileImage: 'https://ui-avatars.com/api/?name=Winnie&size=300&background=random&color=fff',
    isInstructor: false,
    isVerified: false,
    isAdmin: false,
    joinedDate: new Date(2024, 0, 1).toISOString()
  });

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const handle = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${i}`;
    
    // Use UI Avatars as a reliable placeholder service
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&size=300&background=random&color=fff`;
    
    people.push({
      handle: handle,
      displayName: `${firstName} ${lastName}`,
      bio: `Passionate practitioner and instructor with ${Math.floor(Math.random() * 20) + 1} years of experience`,
      location: `City ${i % 25}`,
      website: `https://example.com/users/${handle}`,
      profileImage: avatarUrl,
      isInstructor: i % 5 === 0,
      isVerified: i % 10 === 0,
      isAdmin: false,
      joinedDate: new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString()
    });
  }
  return people;
}

export function generateMockPosts(count: number = 153, people: any[] = []) {
  const postContents = [
    'Just completed an amazing training session!',
    'Excited to share my progress with the community',
    'Looking forward to the upcoming workshop',
    'Great class today, learned so much',
    'Proud of my students\' achievements',
    'New technique unlocked!',
    'Training hard for the next competition',
    'Grateful for this incredible journey',
    'Another milestone reached',
    'The community here is amazing'
  ];
  
  const posts = [];
  const mockPeople = people.length > 0 ? people : generateMockPeople(154);
  
  for (let i = 0; i < count; i++) {
    const author = mockPeople[i % mockPeople.length];
    
    posts.push({
      content: postContents[i % postContents.length] + ` #${i}`,
      authorId: author.id || `mock-person-${i % mockPeople.length}`,
      authorName: author.displayName,
      authorHandle: author.handle,
      authorImage: author.profileImage,
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 20),
      shares: Math.floor(Math.random() * 10),
      createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString()
    });
  }
  return posts;
}

export function generateMockEvents(count: number = 23, studios: any[] = []) {
  // Event types that match the filter segments in the UI
  const eventTypes: Array<'seminar' | 'workshop' | 'tournament' | 'meetup'> = ['seminar', 'workshop', 'tournament', 'meetup'];
  const eventNames = ['Beginner', 'Advanced', 'Master Class', 'Special', 'Annual', 'Monthly'];
  const instructorNames = ['Sensei Tanaka', 'Master Chen', 'Professor Silva', 'Instructor Williams', 'Coach Martinez', 'Sifu Wong'];
  const instructorRanks = ['5th Dan Black Belt', '6th Dan Black Belt', '3rd Degree Black Belt', 'Master Instructor', 'Head Coach', '4th Dan Black Belt'];
  const difficulties: Array<'beginner' | 'intermediate' | 'advanced' | 'all-levels'> = ['beginner', 'intermediate', 'advanced', 'all-levels'];
  
  // Curated event images
  const eventImages = [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=800&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=400&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=400&fit=crop&auto=format'
  ];
  
  const events = [];
  const mockStudios = studios.length > 0 ? studios : generateMockStudios(107);
  
  for (let i = 0; i < count; i++) {
    const studio = mockStudios[i % mockStudios.length];
    const eventType = eventTypes[i % eventTypes.length]; // Cycle through valid types
    const difficulty = difficulties[i % difficulties.length];
    
    const startDate = new Date(2026, Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 28) + 1);
    startDate.setHours(9 + Math.floor(Math.random() * 9), 0, 0, 0); // Set time between 9 AM and 6 PM
    
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + Math.floor(Math.random() * 4) + 2);
    
    const isFree = i % 5 === 0;
    const price = isFree ? 0 : Math.floor(Math.random() * 100) + 25;
    
    events.push({
      title: `${eventNames[i % eventNames.length]} ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`,
      description: `Join us for an exciting ${eventType} event. This ${difficulty} level event is perfect for practitioners looking to enhance their skills and connect with the community.`,
      date: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
      time: startDate.toTimeString().split(' ')[0].substring(0, 5), // HH:MM format
      endDate: endDate.toISOString().split('T')[0],
      location: studio.name,
      address: studio.address,
      type: eventType, // Use the valid event type
      instructor: instructorNames[i % instructorNames.length],
      instructorRank: instructorRanks[i % instructorRanks.length],
      cost: isFree ? 'Free' : `$${price}`,
      maxParticipants: Math.floor(Math.random() * 50) + 20,
      currentParticipants: Math.floor(Math.random() * 15),
      difficulty: difficulty,
      image: eventImages[i % eventImages.length],
      featured: i % 7 === 0,
      tags: [eventType, difficulty, 'training', 'community'],
      organizer: studio.name,
      contactEmail: studio.email || `info@${studio.name.toLowerCase().replace(/\s+/g, '-')}.example.com`,
      contactPhone: studio.phone || `(555) ${String(i).padStart(3, '0')}-${String(i * 10).padStart(4, '0')}`,
      requirements: eventType === 'tournament' ? ['Valid membership', 'Appropriate rank', 'Competition gear'] : 
                    eventType === 'seminar' ? ['Open mind', 'Note-taking materials'] :
                    ['Appropriate attire', 'Water bottle'],
      whatToBring: eventType === 'tournament' ? ['Gi or uniform', 'Protective gear', 'Water bottle', 'Towel'] :
                   eventType === 'workshop' ? ['Training clothes', 'Notebook', 'Water bottle'] :
                   ['Training attire', 'Water bottle', 'Positive attitude']
    });
  }
  return events;
}
