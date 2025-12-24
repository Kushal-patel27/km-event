import React, { useState, useRef, useEffect } from 'react';

const INDIAN_CITIES = [
  "Agartala", "Agra", "Ahmedabad", "Ahmednagar", "Aizawl", "Ajmer", "Akola", "Aligarh", "Allahabad", "Alwar", "Ambala", "Amravati", "Amritsar", "Anand", "Anantapur", "Asansol", "Aurangabad",
  "Bangalore", "Bareilly", "Belgaum", "Bhavnagar", "Bhilai", "Bhilwara", "Bhiwandi", "Bhopal", "Bhubaneswar", "Bikaner", "Bilaspur", "Bokaro",
  "Chandigarh", "Chennai", "Coimbatore", "Cuttack",
  "Dehradun", "Delhi", "Dhanbad", "Dhule", "Durgapur",
  "Erode","Godhra",
  "Faridabad", "Firoz,abad",
  "Gandhinagar", "Gangtok", "Gaya", "Ghaziabad", "Gorakhpur", "Gulbarga", "Guntur", "Gurgaon", "Guwahati", "Gwalior",
  "Hubli-Dharwad", "Hyderabad",
  "Imphal", "Indore",
  "Jabalpur", "Jaipur", "Jalandhar", "Jalgaon", "Jammu", "Jamnagar", "Jamshedpur", "Jhansi", "Jodhpur",
  "Kakinada", "Kalyan-Dombivli", "Kanpur", "Karnal", "Kochi", "Kolhapur", "Kolkata", "Kollam", "Kota", "Kozhikode", "Kurnool",
  "Latur", "Lucknow", "Ludhiana",
  "Madurai", "Malegaon", "Mangalore", "Mathura", "Meerut", "Moradabad", "Mumbai", "Muzaffarnagar", "Mysore",
  "Nagpur", "Nanded", "Nashik", "Navi Mumbai", "Nellore", "Nizamabad", "Noida",
  "Panipat", "Panvel", "Parbhani", "Patiala", "Patna", "Pimpri-Chinchwad", "Pondicherry", "Pune",
  "Raipur", "Rajahmundry", "Rajkot", "Ranchi", "Ratlam", "Rourkela",
  "Sagar", "Salem", "Sangli", "Satara", "Secunderabad", "Shillong", "Shimla", "Siliguri", "Solapur", "Srinagar", "Surat",
  "Thane", "Thanjavur", "Thiruvananthapuram", "Thrissur", "Tiruchirappalli", "Tirunelveli", "Tirupati", "Tiruppur",
  "Udaipur", "Ujjain",
  "Vadodara", "Varanasi", "Vasai-Virar", "Vellore", "Vijayawada", "Visakhapatnam",
  "Warangal"
];

const CitySelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Select City');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city) => {
    setSelectedCity(city);
    setIsOpen(false);
    // Add your logic here to filter events/bookings by city
    console.log('Selected city:', city);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="hidden sm:inline">{selectedCity}</span>
        <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 z-50 border border-gray-100 dark:border-gray-700 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Location</span>
          </div>
          {INDIAN_CITIES.map((city) => (
            <button
              key={city}
              onClick={() => handleSelect(city)}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-between group"
            >
              {city}
              {selectedCity === city && (
                <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitySelector;