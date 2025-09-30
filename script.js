// API Configuration
const API_KEY = 'your_api_key_here'; // You'll get this from OpenWeatherMap
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// DOM Elements
const elements = {
    cityInput: document.getElementById('city-input'),
    searchBtn: document.getElementById('search-btn'),
    locationBtn: document.getElementById('location-btn'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    errorMessage: document.getElementById('error-message'),
    weatherInfo: document.getElementById('weather-info'),
    recentSearches: document.getElementById('recent-searches'),
    recentList: document.getElementById('recent-list'),
    cityName: document.getElementById('city-name'),
    weatherIcon: document.getElementById('weather-icon'),
    temp: document.getElementById('temp'),
    weatherDesc: document.getElementById('weather-description'),
    feelsLike: document.getElementById('feels-like'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('wind-speed'),
    pressure: document.getElementById('pressure'),
    celsiusBtn: document.getElementById('celsius-btn'),
    fahrenheitBtn: document.getElementById('fahrenheit-btn')
};

// State
let currentUnit = 'celsius';
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

// Initialize the app
function init() {
    loadRecentSearches();
    attachEventListeners();
    
    // Check if there's a last searched city
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        getWeatherByCity(lastCity);
    }
}

// Event Listeners
function attachEventListeners() {
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.locationBtn.addEventListener('click', handleLocationSearch);
    elements.cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    elements.celsiusBtn.addEventListener('click', () => switchUnit('celsius'));
    elements.fahrenheitBtn.addEventListener('click', () => switchUnit('fahrenheit'));
}

// Handle city search
function handleSearch() {
    const city = elements.cityInput.value.trim();
    if (city) {
        getWeatherByCity(city);
    }
}

// Handle location-based search
function handleLocationSearch() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }
    
    showLoading();
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            getWeatherByCoords(latitude, longitude);
        },
        (error) => {
            showError('Unable to retrieve your location');
        }
    );
}

// Get weather by city name
async function getWeatherByCity(city) {
    showLoading();
    try {
        const response = await fetch(`${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`);
        
        if (!response.ok) {
            throw new Error('City not found');
        }
        
        const data = await response.json();
        displayWeather(data);
        addToRecentSearches(city);
        localStorage.setItem('lastCity', city);
    } catch (error) {
        showError(error.message);
    }
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        
        if (!response.ok) {
            throw new Error('Weather data not available');
        }
        
        const data = await response.json();
        displayWeather(data);
    } catch (error) {
        showError(error.message);
    }
}

// Display weather data
function displayWeather(data) {
    hideAllSections();
    
    elements.cityName.textContent = `${data.name}, ${data.sys.country}`;
    elements.weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    elements.weatherIcon.alt = data.weather[0].description;
    elements.weatherDesc.textContent = data.weather[0].description;
    
    updateTemperatures(data);
    
    elements.feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
    elements.humidity.textContent = data.main.humidity;
    elements.windSpeed.textContent = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h
    elements.pressure.textContent = data.main.pressure;
    
    elements.weatherInfo.classList.remove('hidden');
}

// Update temperatures based on current unit
function updateTemperatures(data) {
    if (currentUnit === 'celsius') {
        elements.temp.textContent = Math.round(data.main.temp);
        elements.feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
    } else {
        const tempF = (data.main.temp * 9/5) + 32;
        const feelsLikeF = (data.main.feels_like * 9/5) + 32;
        elements.temp.textContent = Math.round(tempF);
        elements.feelsLike.textContent = `${Math.round(feelsLikeF)}°F`;
    }
}

// Switch between Celsius and Fahrenheit
function switchUnit(unit) {
    if (unit === currentUnit) return;
    
    currentUnit = unit;
    elements.celsiusBtn.classList.toggle('active', unit === 'celsius');
    elements.fahrenheitBtn.classList.toggle('active', unit === 'fahrenheit');
    
    // Re-fetch weather data to update temperatures
    const currentCity = elements.cityName.textContent.split(',')[0];
    if (currentCity) {
        getWeatherByCity(currentCity);
    }
}

// Recent searches functionality
function addToRecentSearches(city) {
    recentSearches = recentSearches.filter(search => search !== city);
    recentSearches.unshift(city);
    recentSearches = recentSearches.slice(0, 5); // Keep only last 5 searches
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    loadRecentSearches();
}

function loadRecentSearches() {
    elements.recentList.innerHTML = '';
    
    if (recentSearches.length > 0) {
        recentSearches.forEach(city => {
            const div = document.createElement('div');
            div.className = 'recent-item';
            div.textContent = city;
            div.addEventListener('click', () => {
                elements.cityInput.value = city;
                getWeatherByCity(city);
            });
            elements.recentList.appendChild(div);
        });
        elements.recentSearches.classList.remove('hidden');
    } else {
        elements.recentSearches.classList.add('hidden');
    }
}

// UI Helper Functions
function showLoading() {
    hideAllSections();
    elements.loading.classList.remove('hidden');
}

function showError(message) {
    hideAllSections();
    elements.errorMessage.textContent = message;
    elements.error.classList.remove('hidden');
}

function hideAllSections() {
    elements.loading.classList.add('hidden');
    elements.error.classList.add('hidden');
    elements.weatherInfo.classList.add('hidden');
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);