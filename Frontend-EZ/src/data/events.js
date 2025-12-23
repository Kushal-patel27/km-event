const events = [
  {
    id: '1',
    title: 'Arijit Singh Live',
    date: 'Oct 24, 2026 • 7:00 PM',
    location: 'DY Patil Stadium, Mumbai',
    price: 1999,
    image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&w=800&q=80',
    capacity: 100,
    category: 'Music',
    description: 'Experience the soulful voice of Arijit Singh live in Mumbai. A night of romantic melodies and chart-topping hits.'
  },
  {
    id: '2',
    title: 'Sunburn Goa 2026',
    date: 'Dec 28, 2026 • 4:00 PM',
    location: 'Vagator Beach, Goa',
    price: 1800,
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    capacity: 150,
    category: 'Music',
    description: 'Asia’s biggest electronic music festival returns to Goa. Dance to the beats of top international DJs.'
  },
  {
    id: '3',
    title: 'IPL Final 2026',
    date: 'May 26, 2026 • 7:30 PM',
    location: 'Narendra Modi Stadium, Ahmedabad',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80',
    capacity: 200,
    category: 'Sports',
    description: 'Witness the ultimate cricket showdown. The grand finale of the Indian Premier League.'
  },
  {
    id: '4',
    title: 'Jaipur Lit Fest',
    date: 'Jan 15, 2026 • 10:00 AM',
    location: 'Diggi Palace, Jaipur',
    price: 500,
    image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=800&q=80',
    capacity: 120,
    category: 'Arts',
    description: 'The greatest literary show on Earth. Join authors, thinkers, and humanitarians for inspiring conversations.'
  },
  {
    id: '5',
    title: 'Zakir Khan Live',
    date: 'Nov 12, 2026 • 8:00 PM',
    location: 'Siri Fort Auditorium, Delhi',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=800&q=80',
    capacity: 80,
    category: 'Comedy',
    description: 'Catch the Sakht Launda live with his latest stand-up special. A laughter riot guaranteed.'
  },
  {
    id: '6',
    title: 'Hornbill Festival',
    date: 'Dec 05, 2026 • 9:00 AM',
    location: 'Kisama Village, Nagaland',
    price: 500,
    image: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?auto=format&fit=crop&w=800&q=80',
    capacity: 100,
    category: 'Culture',
    description: 'The festival of festivals. Experience the rich culture, dance, and food of the Naga tribes.'
  },
  {
    id: '7',
    title: 'Rann Utsav',
    date: 'Nov 01, 2026 • 6:00 PM',
    location: 'White Rann, Kutch',
    price: 1950,
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
    capacity: 60,
    category: 'Travel',
    description: 'Celebrate the white desert under the full moon. Folk music, dance, and luxury tents.'
  },
  {
    id: '8',
    title: 'NH7 Weekender',
    date: 'Dec 14, 2026 • 3:00 PM',
    location: 'Mahalakshmi Lawns, Pune',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80',
    capacity: 150,
    category: 'Music',
    description: 'The happiest music festival. Indie, rock, metal, and hip-hop artists from across the globe.'
  },
  {
    id: '9',
    title: 'Pushkar Camel Fair',
    date: 'Nov 15, 2026 • 10:00 AM',
    location: 'Pushkar, Rajasthan',
    price: 500,
    image: 'https://images.unsplash.com/photo-1591264247469-813d51b95d2c?auto=format&fit=crop&w=800&q=80',
    capacity: 500,
    category: 'Culture',
    description: 'One of the world\'s largest cattle fairs. Experience the vibrant colors, folk music, and camel races of Rajasthan.'
  },
  {
    id: '10',
    title: 'Kolkata Durga Puja',
    date: 'Oct 18, 2026 • 6:00 PM',
    location: 'Kolkata, West Bengal',
    price: 0,
    image: 'https://images.unsplash.com/photo-1567591370474-c885b1739305?auto=format&fit=crop&w=800&q=80',
    capacity: 1000,
    category: 'Culture',
    description: 'Witness the grandeur of Durga Puja. Hopping between artistic pandals and enjoying street food in the City of Joy.'
  },
  {
    id: '11',
    title: 'Ziro Festival of Music',
    date: 'Sep 24, 2026 • 2:00 PM',
    location: 'Ziro Valley, Arunachal Pradesh',
    price: 1800,
    image: 'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?auto=format&fit=crop&w=800&q=80',
    capacity: 200,
    category: 'Music',
    description: 'India\'s most eco-friendly music festival set in the stunning Ziro Valley. Indie music, rice beer, and lush green views.'
  },
  {
    id: '12',
    title: 'Magnetic Fields Festival',
    date: 'Dec 11, 2026 • 4:00 PM',
    location: 'Alsisar Mahal, Rajasthan',
    price: 1999,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    capacity: 150,
    category: 'Music',
    description: 'A magical musical carnival where royalty meets contemporary culture in a 17th-century palace.'
  },
  {
    id: '13',
    title: 'Nehru Trophy Boat Race',
    date: 'Aug 08, 2026 • 11:00 AM',
    location: 'Punnamada Lake, Alappuzha',
    price: 500,
    image: 'https://images.unsplash.com/photo-1593693397690-362cb9666c74?auto=format&fit=crop&w=800&q=80',
    capacity: 300,
    category: 'Sports',
    description: 'The fierce excitement of the Snake Boat Race in Kerala\'s backwaters. Rhythmic rowing and cheering crowds.'
  },
  {
    id: '14',
    title: 'Goa Carnival',
    date: 'Feb 14, 2026 • 3:00 PM',
    location: 'Panaji, Goa',
    price: 0,
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    capacity: 500,
    category: 'Culture',
    description: 'A riot of colors, floats, and music. Celebrate the Portuguese heritage of Goa with King Momo leading the parade.'
  },
  {
    id: '15',
    title: 'Jaisalmer Desert Festival',
    date: 'Feb 02, 2026 • 5:00 PM',
    location: 'Sam Sand Dunes, Jaisalmer',
    price: 1000,
    image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80',
    capacity: 100,
    category: 'Travel',
    description: 'Turban tying competitions, Mr. Desert contest, and folk performances amidst the golden sand dunes.'
  },
  {
    id: '16',
    title: 'Mysore Dasara',
    date: 'Oct 20, 2026 • 5:00 PM',
    location: 'Mysore Palace, Karnataka',
    price: 750,
    image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb9d64?auto=format&fit=crop&w=800&q=80',
    capacity: 250,
    category: 'Culture',
    description: 'The royal festival of Karnataka. See the illuminated Mysore Palace and the majestic Jumboo Savari procession.'
  }
]

export default events