// ==========================================
// ENHANCED ARGO LOGIC WITH OCEAN-SPECIFIC DATA
// ==========================================

const oceanRegions = {
    'arabian_sea': {
        name: 'Arabian Sea',
        bounds: [[8, 50], [27, 80]],
        center: [17.5, 65],
        color: '#3b82f6',
        characteristics: {
            avgTemp: 28.5,
            avgSalinity: 36.2,
            depth: 4652,
            description: 'Warm, highly saline waters with strong monsoon influence',
            currents: 'Southwest and Northeast Monsoon currents',
            features: 'High evaporation rates, seasonal upwelling'
        }
    },
    'bay_of_bengal': {
        name: 'Bay of Bengal',
        bounds: [[5, 80], [22, 100]],
        center: [13.5, 90],
        color: '#10b981',
        characteristics: {
            avgTemp: 29.1,
            avgSalinity: 33.8,
            depth: 4694,
            description: 'Warm waters with lower salinity due to river discharge',
            currents: 'East India Coastal Current',
            features: 'Large freshwater input, cyclone formation area'
        }
    },
    'indian_ocean': {
        name: 'Indian Ocean',
        bounds: [[-40, 20], [30, 120]],
        center: [-5, 70],
        color: '#8b5cf6',
        characteristics: {
            avgTemp: 26.8,
            avgSalinity: 35.1,
            depth: 3741,
            description: 'Third largest ocean with diverse temperature zones',
            currents: 'South Equatorial Current, Agulhas Current',
            features: 'Monsoon-driven circulation, warm pool region'
        }
    },
    'equatorial_indian': {
        name: 'Equatorial Indian Ocean',
        bounds: [[-10, 40], [10, 100]],
        center: [0, 70],
        color: '#f59e0b',
        characteristics: {
            avgTemp: 28.2,
            avgSalinity: 34.9,
            depth: 3800,
            description: 'Warm equatorial waters with complex current systems',
            currents: 'Equatorial Counter Current, Equatorial Undercurrent',
            features: 'Indian Ocean Dipole, thermocline variations'
        }
    },
    'southern_ocean': {
        name: 'Southern Ocean',
        bounds: [[-70, 0], [-40, 180]],
        center: [-55, 90],
        color: '#06b6d4',
        characteristics: {
            avgTemp: 4.2,
            avgSalinity: 34.7,
            depth: 3270,
            description: 'Cold, nutrient-rich waters surrounding Antarctica',
            currents: 'Antarctic Circumpolar Current',
            features: 'Sea ice formation, deep water formation, high nutrients'
        }
    }
};

class EnhancedArgoLogic {
    constructor() {
        this.state = {
            chatHistory: [],
            queryResults: null,
            loading: false,
            error: null,
            userLocation: null
        };
        this.listeners = new Map();
        this.mockData = this.generateMockData();
        this.getUserLocation();
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) this.listeners.set(key, []);
        this.listeners.get(key).push(callback);
    }

    setState(key, value) {
        this.state[key] = value;
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => callback(value));
        }
    }

    getState(key) {
        return this.state[key];
    }

    async getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    };
                    this.setState('userLocation', userLocation);
                    console.log('User location detected:', userLocation);
                },
                (error) => {
                    console.log('Location access denied or unavailable:', error);
                    // Default to Indian Ocean center
                    this.setState('userLocation', { lat: 10, lon: 75 });
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        } else {
            console.log('Geolocation not supported');
            this.setState('userLocation', { lat: 10, lon: 75 });
        }
    }

    async processQuery(queryText) {
        this.setState('loading', true);
        this.setState('error', null);

        const userMessage = {
            id: Date.now(),
            message: queryText,
            type: 'user',
            timestamp: new Date().toISOString()
        };
        this.state.chatHistory.push(userMessage);
        this.setState('chatHistory', [...this.state.chatHistory]);

        try {
            // Simulate realistic API delay
            await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

            const results = this.generateQueryResults(queryText);
            this.setState('queryResults', results);

            const assistantMessage = {
                id: Date.now() + 1,
                message: this.generateResponseMessage(results, queryText),
                type: 'assistant',
                timestamp: new Date().toISOString(),
                data: results
            };
            this.state.chatHistory.push(assistantMessage);
            this.setState('chatHistory', [...this.state.chatHistory]);

        } catch (error) {
            this.setState('error', error.message);
        } finally {
            this.setState('loading', false);
        }
    }

    generateQueryResults(query) {
        const lowerQuery = query.toLowerCase();
        let targetOcean = 'indian_ocean';
        let profileCount = 8 + Math.floor(Math.random() * 12);
        
        // Determine target ocean based on query
        if (lowerQuery.includes('arabian sea') || lowerQuery.includes('arabian')) {
            targetOcean = 'arabian_sea';
            profileCount = Math.floor(profileCount * 0.7);
        } else if (lowerQuery.includes('bay of bengal') || lowerQuery.includes('bengal')) {
            targetOcean = 'bay_of_bengal';
            profileCount = Math.floor(profileCount * 0.8);
        } else if (lowerQuery.includes('equator') || lowerQuery.includes('equatorial')) {
            targetOcean = 'equatorial_indian';
            profileCount = Math.floor(profileCount * 0.9);
        } else if (lowerQuery.includes('southern ocean') || lowerQuery.includes('southern') || lowerQuery.includes('antarctic')) {
            targetOcean = 'southern_ocean';
            profileCount = Math.floor(profileCount * 0.6);
        } else if (lowerQuery.includes('indian ocean') || lowerQuery.includes('indian')) {
            targetOcean = 'indian_ocean';
        }

        const oceanData = oceanRegions[targetOcean];
        const profiles = this.generateOceanSpecificProfiles(targetOcean, profileCount);
        
        const floats = profiles.map(p => ({
            id: p.floatId,
            lat: p.location.lat,
            lon: p.location.lon,
            parameters: ['temperature', 'salinity', 'pressure'],
            ocean: targetOcean
        }));

        return {
            profiles,
            floatLocations: floats,
            summary: {
                avgTemperature: oceanData.characteristics.avgTemp + (Math.random() - 0.5) * 2,
                avgSalinity: oceanData.characteristics.avgSalinity + (Math.random() - 0.5) * 0.5,
                count: profileCount,
                ocean: targetOcean
            }
        };
    }

    generateOceanSpecificProfiles(oceanKey, count) {
        const ocean = oceanRegions[oceanKey];
        const profiles = [];
        
        for (let i = 0; i < count; i++) {
            const floatId = `WMO${5900000 + Math.floor(Math.random() * 10000)}`;
            
            // Generate location within ocean bounds
            const latRange = ocean.bounds[1][0] - ocean.bounds[0][0];
            const lonRange = ocean.bounds[1][1] - ocean.bounds[0][1];
            const lat = ocean.bounds[0][0] + Math.random() * latRange;
            const lon = ocean.bounds[0][1] + Math.random() * lonRange;
            
            profiles.push({
                floatId,
                date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
                location: { lat, lon },
                profiles: {
                    temp: this.generateOceanSpecificDepthProfile('temperature', ocean),
                    sal: this.generateOceanSpecificDepthProfile('salinity', ocean)
                },
                ocean: oceanKey
            });
        }
        
        return profiles;
    }

    generateOceanSpecificDepthProfile(parameter, ocean) {
        const profile = [];
        const baseTemp = ocean.characteristics.avgTemp;
        const baseSal = ocean.characteristics.avgSalinity;
        
        for (let depth = 0; depth <= 2000; depth += 25) {
            let value;
            if (parameter === 'temperature') {
                // Ocean-specific temperature profiles
                if (ocean.name === 'Southern Ocean') {
                    // Cold water, gradual decrease
                    value = baseTemp - (depth / 200) * 1.5 + Math.random() * 1 - 0.5;
                    value = Math.max(value, -1);
                } else if (ocean.name === 'Arabian Sea') {
                    // Warm surface, steep thermocline
                    value = baseTemp - (depth / 150) * 2.2 + Math.random() * 1.5 - 0.75;
                    value = Math.max(value, 3);
                } else if (ocean.name === 'Bay of Bengal') {
                    // Warm, stratified
                    value = baseTemp - (depth / 120) * 2.1 + Math.random() * 1.2 - 0.6;
                    value = Math.max(value, 4);
                } else if (ocean.name === 'Equatorial Indian Ocean') {
                    // Warm surface, thermocline variations
                    value = baseTemp - (depth / 110) * 2.3 + Math.sin(depth / 300) * 0.8 + Math.random() * 1 - 0.5;
                    value = Math.max(value, 5);
                } else {
                    // General Indian Ocean
                    value = baseTemp - (depth / 100) * 2 + Math.random() * 2 - 1;
                    value = Math.max(value, 2);
                }
            } else if (parameter === 'salinity') {
                // Ocean-specific salinity profiles
                if (ocean.name === 'Bay of Bengal') {
                    // Lower salinity due to river input
                    value = baseSal - 1 + Math.sin(depth / 400) * 0.8 + Math.random() * 0.3 - 0.15;
                } else if (ocean.name === 'Arabian Sea') {
                    // Higher salinity due to evaporation
                    value = baseSal + Math.sin(depth / 300) * 0.6 + Math.random() * 0.2 - 0.1;
                } else if (ocean.name === 'Southern Ocean') {
                    // Relatively stable salinity
                    value = baseSal + Math.sin(depth / 600) * 0.3 + Math.random() * 0.15 - 0.075;
                } else {
                    // General pattern
                    value = baseSal + Math.sin(depth / 500) * 0.5 + Math.random() * 0.2 - 0.1;
                }
            }
            
            profile.push({
                depth,
                value: parseFloat(value.toFixed(2)),
                qc: 1
            });
        }
        return profile;
    }

    generateResponseMessage(results, query) {
        const { profiles, summary } = results;
        const oceanData = oceanRegions[summary.ocean];
        
        if (profiles.length === 0) {
            return "🔍 I couldn't find any ARGO data matching your criteria. Try adjusting your query or selecting a different ocean region.";
        }

        let response = `🌊 Found ${profiles.length} ARGO profiles in the ${oceanData.name}! `;
        
        response += `\n\n📊 **Data Summary:**\n`;
        response += `• Average Temperature: ${summary.avgTemperature.toFixed(1)}°C\n`;
        response += `• Average Salinity: ${summary.avgSalinity.toFixed(2)} PSU\n`;
        response += `• Ocean Depth: ~${oceanData.characteristics.depth}m\n\n`;
        
        response += `🔍 **Ocean Characteristics:**\n`;
        response += `${oceanData.characteristics.description}\n`;
        response += `• Main Currents: ${oceanData.characteristics.currents}\n`;
        response += `• Key Features: ${oceanData.characteristics.features}\n\n`;
        
        response += `📈 The data is now visualized on the map and charts below. Each float provides detailed temperature and salinity profiles from surface to 2000m depth.`;
        
        return response;
    }

    generateMockData() {
        const profiles = [];
        
        // Generate data for all ocean regions
        Object.keys(oceanRegions).forEach(oceanKey => {
            const ocean = oceanRegions[oceanKey];
            const count = oceanKey === 'indian_ocean' ? 20 : 15;
            
            for (let i = 0; i < count; i++) {
                const floatId = `WMO${5900000 + Math.floor(Math.random() * 10000)}`;
                const latRange = ocean.bounds[1][0] - ocean.bounds[0][0];
                const lonRange = ocean.bounds[1][1] - ocean.bounds[0][1];
                const lat = ocean.bounds[0][0] + Math.random() * latRange;
                const lon = ocean.bounds[0][1] + Math.random() * lonRange;
                
                profiles.push({
                    floatId,
                    date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
                    location: { lat, lon },
                    profiles: {
                        temp: this.generateOceanSpecificDepthProfile('temperature', ocean),
                        sal: this.generateOceanSpecificDepthProfile('salinity', ocean)
                    },
                    ocean: oceanKey
                });
            }
        });
        
        return { profiles };
    }

    getVisualizationData(type) {
        const results = this.state.queryResults;
        if (!results) return null;
        
        switch (type) {
            case 'profiles':
                return results.profiles;
            case 'map':
                return results.floatLocations;
            default:
                return results;
        }
    }

    exportData(format) {
        const data = this.state.queryResults;
        if (!data) {
            alert('No data available to export. Please run a query first.');
            return;
        }
        
        if (format === 'json') {
            const jsonStr = JSON.stringify(data, null, 2);
            this.downloadFile(jsonStr, 'argo_data.json', 'application/json');
        } else if (format === 'csv') {
            const csv = this.convertToCSV(data.profiles);
            this.downloadFile(csv, 'argo_data.csv', 'text/csv');
        }
    }

    convertToCSV(profiles) {
        const headers = ['float_id', 'date', 'lat', 'lon', 'depth', 'temperature', 'salinity', 'ocean'];
        const rows = [headers.join(',')];
        
        profiles.forEach(profile => {
            const tempData = profile.profiles.temp || [];
            tempData.forEach((point, idx) => {
                const salPoint = profile.profiles.sal[idx] || {};
                const row = [
                    profile.floatId,
                    profile.date.toISOString().split('T')[0],
                    profile.location.lat.toFixed(4),
                    profile.location.lon.toFixed(4),
                    point.depth,
                    point.value,
                    salPoint.value || '',
                    profile.ocean
                ];
                rows.push(row.join(','));
            });
        });
        
        return rows.join('\n');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// ==========================================
// ENHANCED UI INTEGRATION
// ==========================================

let argoLogic;
let map;
let mapMarkers = [];
let userLocationMarker = null;

// Initialize the application
window.onload = function() {
    initializeApp();
};

function initializeApp() {
    console.log('🌊 Initializing Enhanced ARGO Explorer...');
    
    // Initialize the logic layer
    argoLogic = new EnhancedArgoLogic();
    
    // Initialize map
    initializeMap();
    
    // Set up event listeners
    setupEventListeners();
    
    // Subscribe to state changes
    subscribeToStateChanges();
    
    // Enable UI elements
    document.getElementById('chat-input').disabled = false;
    document.getElementById('send-btn').disabled = false;
    
    console.log('✅ ARGO Explorer initialized successfully!');
}

function setupEventListeners() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    chatInput.addEventListener('input', function() {
        sendBtn.disabled = this.value.trim() === '' || argoLogic.getState('loading');
    });
}

function subscribeToStateChanges() {
    // Update chat when messages change
    argoLogic.subscribe('chatHistory', updateChatDisplay);
    
    // Update visualizations when results change
    argoLogic.subscribe('queryResults', function(results) {
        if (results) {
            updateStats(results.summary);
            updateMap(results.floatLocations, results.summary.ocean);
            updateCharts(results.profiles);
        }
    });
    
    // Update loading state
    argoLogic.subscribe('loading', function(loading) {
        const loadingEl = document.getElementById('loading-indicator');
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        
        loadingEl.style.display = loading ? 'flex' : 'none';
        chatInput.disabled = loading;
        sendBtn.disabled = loading || chatInput.value.trim() === '';
    });
    
    // Update error state
    argoLogic.subscribe('error', function(error) {
        const errorEl = document.getElementById('error-display');
        const errorText = document.getElementById('error-text');
        if (error) {
            errorText.textContent = error;
            errorEl.style.display = 'flex';
        } else {
            errorEl.style.display = 'none';
        }
    });

    // Update user location
    argoLogic.subscribe('userLocation', function(userLocation) {
        if (userLocation && map) {
            updateUserLocationOnMap(userLocation);
            document.getElementById('user-location-indicator').style.display = 'flex';
        }
    });
}

function initializeMap() {
    // Initialize map centered on Indian Ocean
    map = L.map('ocean-map').setView([10, 75], 4);
    
    // Add beautiful tile layer - Esri Ocean Basemap
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
        maxZoom: 18
    }).addTo(map);
    
    // Add ocean regions
    addOceanRegions();
    
    // Add legend
    addLegend();
    
    console.log('🗺️ Map initialized');
}

function addLegend() {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.backgroundColor = 'rgba(255,255,255,0.8)';
        div.style.padding = '10px';
        div.style.borderRadius = '5px';
        div.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
        
        div.innerHTML = '<h4>ARGO Floats</h4>';
        div.innerHTML += '<i class="fas fa-anchor" style="color: #3b82f6; font-size: 16px;"></i> Float Location<br>';
        div.innerHTML += '<i class="fas fa-user" style="color: #ef4444; font-size: 16px;"></i> Your Location<br>';
        
        return div;
    };
    legend.addTo(map);
}

function addOceanRegions() {
    Object.entries(oceanRegions).forEach(([key, region]) => {
        const rectangle = L.rectangle(region.bounds, {
            color: region.color,
            weight: 3,
            fillOpacity: 0.1,
            dashArray: '5, 5'
        }).addTo(map);
        
        const popupContent = `
            <div class="ocean-info-popup">
                <h4><i class="fas fa-water"></i> ${region.name}</h4>
                <p><strong>Description:</strong> ${region.characteristics.description}</p>
                <div class="characteristics">
                    <div><i class="fas fa-thermometer-half"></i> Avg Temperature: ${region.characteristics.avgTemp}°C</div>
                    <div><i class="fas fa-tint"></i> Avg Salinity: ${region.characteristics.avgSalinity} PSU</div>
                    <div><i class="fas fa-arrows-alt-v"></i> Avg Depth: ${region.characteristics.depth}m</div>
                    <div><i class="fas fa-water"></i> Currents: ${region.characteristics.currents}</div>
                    <div><i class="fas fa-info-circle"></i> Features: ${region.characteristics.features}</div>
                </div>
            </div>
        `;
        
        rectangle.bindPopup(popupContent);
    });
}

function updateUserLocationOnMap(userLocation) {
    // Remove existing user location marker
    if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
    }
    
    // Create custom user location icon
    const userIcon = L.divIcon({
        html: '<div class="user-marker" style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><i class="fas fa-user" style="color: white; font-size: 12px; margin-top: 5px;"></i></div>',
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
    
    // Add user location marker
    userLocationMarker = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon }).addTo(map);
    
    userLocationMarker.bindPopup(`
        <div class="ocean-info-popup">
            <h4><i class="fas fa-map-marker-alt"></i> Your Location</h4>
            <p><strong>Coordinates:</strong> ${userLocation.lat.toFixed(4)}°N, ${userLocation.lon.toFixed(4)}°E</p>
            <p><i class="fas fa-info-circle"></i> Map centered on your location for better ocean data exploration</p>
        </div>
    `);
    
    // Center map on user location with appropriate zoom
    map.setView([userLocation.lat, userLocation.lon], 6);
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    input.value = '';
    await argoLogic.processQuery(message);
}

function sendQuickQuery(query) {
    document.getElementById('chat-input').value = query;
    sendMessage();
}

function updateChatDisplay(chatHistory) {
    const messagesContainer = document.getElementById('chat-messages');
    
    messagesContainer.innerHTML = chatHistory.map(msg => `
        <div class="message ${msg.type}">
            <div>${msg.message.replace(/\n/g, '<br>')}</div>
            <div class="timestamp">
                ${msg.type === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>'} 
                ${new Date(msg.timestamp).toLocaleTimeString()}
            </div>
        </div>
    `).join('');
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateStats(summary) {
    if (summary) {
        const floatCount = argoLogic.getVisualizationData('map')?.length || 0;
        
        // Animate stat updates
        animateValue('total-floats', 0, floatCount, 1000);
        animateValue('total-profiles', 0, summary.count || 0, 1200);
        
        document.getElementById('avg-temp').textContent = 
            summary.avgTemperature ? summary.avgTemperature.toFixed(1) + '°C' : '--';
        document.getElementById('avg-salinity').textContent = 
            summary.avgSalinity ? summary.avgSalinity.toFixed(2) : '--';
    }
}

function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (end - start) * progress);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function updateMap(floatLocations, oceanKey) {
    // Clear existing markers
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];
    
    if (!floatLocations || floatLocations.length === 0) return;
    
    const oceanData = oceanRegions[oceanKey];
    
    // Add new markers with ocean-specific styling
    floatLocations.forEach((float, index) => {
        const floatIcon = L.divIcon({
            html: `<div style="background: ${oceanData.color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><i class="fas fa-anchor" style="color: white; font-size: 12px; margin-top: 5px;"></i></div>`,
            className: 'custom-div-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        
        const marker = L.marker([float.lat, float.lon], { icon: floatIcon }).addTo(map);
        
        marker.bindPopup(`
            <div class="ocean-info-popup">
                <h4><i class="fas fa-anchor"></i> Float ${float.id}</h4>
                <p><strong>Location:</strong> ${float.lat.toFixed(3)}°N, ${float.lon.toFixed(3)}°E</p>
                <p><strong>Ocean:</strong> ${oceanData.name}</p>
                <p><strong>Parameters:</strong> ${float.parameters.join(', ')}</p>
                <p><i class="fas fa-info-circle"></i> Active ARGO profiling float</p>
            </div>
        `);
        
        mapMarkers.push(marker);
    });
    
    // Fit map to show all markers and user location
    if (mapMarkers.length > 0) {
        const group = new L.featureGroup(mapMarkers);
        if (userLocationMarker) {
            group.addLayer(userLocationMarker);
        }
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

function updateCharts(profiles) {
    if (!profiles || profiles.length === 0) return;
    
    updateTemperatureChart(profiles);
    updateSalinityChart(profiles);
}

function updateTemperatureChart(profiles) {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    const traces = profiles.slice(0, 5).map((profile, idx) => ({
        x: profile.profiles.temp?.map(p => p.value) || [],
        y: profile.profiles.temp?.map(p => -p.depth) || [],
        mode: 'lines',
        name: `Float ${profile.floatId.slice(-4)}`,
        line: { 
            width: 3,
            color: colors[idx % colors.length]
        },
        hovertemplate: 'Temp: %{x}°C<br>Depth: %{y}m<extra></extra>'
    }));
    
    const layout = {
        title: {
            text: '🌡️ Temperature vs Depth Profiles',
            font: { color: 'white', size: 16 }
        },
        xaxis: { 
            title: 'Temperature (°C)',
            color: 'white',
            gridcolor: 'rgba(255,255,255,0.2)'
        },
        yaxis: { 
            title: 'Depth (m)',
            color: 'white',
            gridcolor: 'rgba(255,255,255,0.2)'
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0.1)',
        font: { color: 'white' },
        legend: { 
            font: { color: 'white' },
            bgcolor: 'rgba(0,0,0,0.3)'
        },
        margin: { t: 50, r: 50, b: 50, l: 60 }
    };
    
    Plotly.newPlot('temp-chart', traces, layout, {
        responsive: true,
        displayModeBar: false
    });
}

function updateSalinityChart(profiles) {
    const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    const traces = profiles.slice(0, 5).map((profile, idx) => ({
        x: profile.profiles.sal?.map(p => p.value) || [],
        y: profile.profiles.sal?.map(p => -p.depth) || [],
        mode: 'lines',
        name: `Float ${profile.floatId.slice(-4)}`,
        line: { 
            width: 3,
            color: colors[idx % colors.length]
        },
        hovertemplate: 'Salinity: %{x} PSU<br>Depth: %{y}m<extra></extra>'
    }));
    
    const layout = {
        title: {
            text: '🧂 Salinity vs Depth Profiles',
            font: { color: 'white', size: 16 }
        },
        xaxis: { 
            title: 'Salinity (PSU)',
            color: 'white',
            gridcolor: 'rgba(255,255,255,0.2)'
        },
        yaxis: { 
            title: 'Depth (m)',
            color: 'white',
            gridcolor: 'rgba(255,255,255,0.2)'
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0.1)',
        font: { color: 'white' },
        legend: { 
            font: { color: 'white' },
            bgcolor: 'rgba(0,0,0,0.3)'
        },
        margin: { t: 50, r: 50, b: 50, l: 60 }
    };
    
    Plotly.newPlot('sal-chart', traces, layout, {
        responsive: true,
        displayModeBar: false
    });
}

function exportData(format) {
    argoLogic.exportData(format);
}

// Add some visual flair on load
document.addEventListener('DOMContentLoaded', function() {
    // Add subtle animations to stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fadeInUp');
    });
});