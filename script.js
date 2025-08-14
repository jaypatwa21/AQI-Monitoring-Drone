let map;
            let marker;
            let currentPosition = { lat: 23.0225, lng: 72.5714 }; // Default to Ahmedabad if Geo fails
            let myChart; // Make chart globally accessible

            // --- Google Maps Functions ---

            // Initialize Google Maps
            function initMap() {
                const mapOptions = {
                    zoom: 14, // Slightly zoomed out
                    center: currentPosition,
                    mapTypeId: 'roadmap', // Use standard map type
                    disableDefaultUI: true, // Cleaner look
                    zoomControl: true,
                    styles: [ // Dark mode map styles (same as before)
                        {"elementType": "geometry", "stylers": [{"color": "#242f3e"}]},
                        {"elementType": "labels.text.stroke", "stylers": [{"color": "#242f3e"}]},
                        {"elementType": "labels.text.fill", "stylers": [{"color": "#746855"}]},
                        {"featureType": "administrative.locality","elementType": "labels.text.fill","stylers": [{"color": "#d59563"}]},
                        {"featureType": "poi","elementType": "labels.text.fill","stylers": [{"color": "#d59563"}]},
                        {"featureType": "poi.park","elementType": "geometry","stylers": [{"color": "#263c3f"}]},
                        {"featureType": "poi.park","elementType": "labels.text.fill","stylers": [{"color": "#6b9a76"}]},
                        {"featureType": "road","elementType": "geometry","stylers": [{"color": "#38414e"}]},
                        {"featureType": "road","elementType": "geometry.stroke","stylers": [{"color": "#212a37"}]},
                        {"featureType": "road","elementType": "labels.text.fill","stylers": [{"color": "#9ca5b3"}]},
                        {"featureType": "road.highway","elementType": "geometry","stylers": [{"color": "#746855"}]},
                        {"featureType": "road.highway","elementType": "geometry.stroke","stylers": [{"color": "#1f2835"}]},
                        {"featureType": "road.highway","elementType": "labels.text.fill","stylers": [{"color": "#f3d19c"}]},
                        {"featureType": "transit", "elementType": "geometry", "stylers": [{"color": "#2f3948"}]},
                        {"featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{"color": "#d59563"}]},
                        {"featureType": "water","elementType": "geometry","stylers": [{"color": "#17263c"}]},
                        {"featureType": "water","elementType": "labels.text.fill","stylers": [{"color": "#515c6d"}]},
                        {"featureType": "water","elementType": "labels.text.stroke","stylers": [{"color": "#17263c"}]}
                    ]
                };

                map = new google.maps.Map(document.getElementById('map'), mapOptions);

                // Create the initial marker (color will be updated later)
                marker = new google.maps.Marker({
                    position: currentPosition,
                    map: map,
                    title: 'Sensor Location' // Changed title
                });

                // Try to get user's current location
                getCurrentLocation();
            }

            // Get marker color based on AQI (using EPA levels)
            function getMarkerColor(aqi) {
                if (aqi === null || isNaN(aqi)) return '#cccccc'; // Default grey if no data
                if (aqi <= 50) return '#4caf50';  // Good - Green
                if (aqi <= 100) return '#ffc107'; // Moderate - Yellow
                if (aqi <= 150) return '#ff9800'; // Unhealthy for Sensitive Groups - Orange
                if (aqi <= 200) return '#f44336'; // Unhealthy - Red
                if (aqi <= 300) return '#9c27b0'; // Very Unhealthy - Purple
                return '#880e4f';                 // Hazardous - Dark Purple (Maroon)
            }

            // Update marker color based on AQI
            function updateMarkerAppearance(aqi) {
                const color = getMarkerColor(aqi);
                if (marker) {
                    marker.setIcon({
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: color,
                        fillOpacity: 0.9,
                        strokeColor: '#ffffff', // White border for better visibility
                        strokeOpacity: 0.7,
                        strokeWeight: 1.5,
                        scale: 12 // Slightly larger marker
                    });
                }
            }

            // Get current position (optional, can center on a fixed sensor location)
            function getCurrentLocation() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            currentPosition = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            };
                            console.log("Geolocation success:", currentPosition);
                            if (map) {
                                map.setCenter(currentPosition);
                                if (marker) {
                                    marker.setPosition(currentPosition);
                                } else {
                                     // Create marker if it doesn't exist yet
                                     marker = new google.maps.Marker({
                                        position: currentPosition,
                                        map: map,
                                        title: 'Current Location'
                                    });
                                    updateMarkerAppearance(null); // Set default color initially
                                }
                            }
                        },
                        (error) => {
                            console.warn("Error getting location:", error.message, "- Using default location.");
                            // Keep default location if geolocation fails or is denied
                             if (map) {
                                map.setCenter(currentPosition); // Center on default
                                if (marker) marker.setPosition(currentPosition);
                            }
                        },
                        { timeout: 5000, enableHighAccuracy: false } // Options for geolocation
                    );
                } else {
                    console.warn("Geolocation is not supported by this browser. Using default location.");
                     if (map) {
                        map.setCenter(currentPosition); // Center on default
                        if (marker) marker.setPosition(currentPosition);
                    }
                }
            }

            // --- UI Update Functions ---

            // Update time and date
            function updateDateTime() {
                const now = new Date();
                document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            // Progress ring animation
            function setProgress(element, percent) {
                const circle = element.querySelector('.progress-ring-circle');
                if (!circle) return; // Exit if circle not found

                const radius = circle.r.baseVal.value;
                const circumference = radius * 2 * Math.PI;
                circle.style.strokeDasharray = `${circumference} ${circumference}`;

                // Clamp percentage between 0 and 100 for visual representation
                const clampedPercent = Math.max(0, Math.min(100, percent));
                const offset = circumference - (clampedPercent / 100 * circumference);
                circle.style.strokeDashoffset = offset;

                // Optional: Change color based on value for AQI ring
                if (element.id === 'aqiRing') {
                    const aqiValue = parseFloat(document.getElementById('aqi').textContent);
                    circle.style.stroke = getMarkerColor(aqiValue); // Reuse map color logic
                }
                 // Optional: Change color based on value for PM2.5 ring
                if (element.id === 'dustRing') { // Using the old ID 'dustRing' for the PM2.5 SVG element
                     const pm25Value = parseFloat(document.getElementById('pm25').textContent);
                     if (pm25Value <= 12) circle.style.stroke = '#4caf50'; // Good
                     else if (pm25Value <= 35) circle.style.stroke = '#ffc107'; // Moderate
                     else if (pm25Value <= 55) circle.style.stroke = '#ff9800'; // Unhealthy Sensitive
                     else if (pm25Value <= 150) circle.style.stroke = '#f44336'; // Unhealthy
                     else if (pm25Value <= 250) circle.style.stroke = '#9c27b0'; // Very Unhealthy
                     else circle.style.stroke = '#880e4f'; // Hazardous
                 }
            }


            // Initialize chart
            function initializeChart() {
                const ctx = document.getElementById('sensorChart').getContext('2d');
                const gradient = ctx.createLinearGradient(0, 0, 0, 300); // Adjusted height
                gradient.addColorStop(0, 'rgba(76, 175, 80, 0.4)');   // Slightly more visible start
                gradient.addColorStop(1, 'rgba(76, 175, 80, 0)');

                myChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: [], // Start with empty labels
                        datasets: [{
                            label: 'AQI',
                            borderColor: '#4caf50', // AQI color
                            backgroundColor: gradient,
                            data: [],
                            fill: true,
                            tension: 0.4,
                            pointRadius: 2, // Smaller points
                            pointBackgroundColor: '#4caf50'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                mode: 'index',
                                intersect: false
                            }
                        },
                        scales: {
                            y: {
                                // beginAtZero: true, // Let chart decide based on data for better visibility
                                suggestedMin: 0,
                                suggestedMax: 200, // Start with a reasonable max suggestion
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    color: '#8b8b9a'
                                }
                            },
                            x: {
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    color: '#8b8b9a',
                                    maxTicksLimit: 12 // Limit number of time labels shown
                                }
                            }
                        },
                         animation: {
                            duration: 500 // Smooth transition duration
                        }
                    }
                });
            }

            // --- Data Fetching and Processing ---

            async function fetchData() {
                // IMPORTANT: Replace with your ESP32's actual IP Address
                const esp32_ip = "YOUR_IP_ADDRESS_HERE"; // <-- CHANGE THIS
                const url = `http://${esp32_ip}/data`;

                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                         throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();

                    console.log("Received data:", data); // Log received data for debugging

                    // Update metric cards and rings using received data
                    const aqi = data.aqi !== undefined && !isNaN(data.aqi) ? Math.round(data.aqi) : '--'; // Use AQI from ESP32
                    document.getElementById('aqi').textContent = aqi;
                    // Scale progress ring: 0 AQI = 0%, 300+ AQI = 100%
                    setProgress(document.getElementById('aqiRing'), aqi === '--' ? 0 : (aqi / 300) * 100);

                    const temp = data.temperature !== undefined && !isNaN(data.temperature) ? data.temperature.toFixed(1) : '--';
                    document.getElementById('temp').textContent = `${temp}°C`;
                     // Scale progress ring: 0°C = 0%, 50°C = 100%
                    setProgress(document.getElementById('tempRing'), temp === '--' ? 0 : (parseFloat(temp) / 50) * 100);

                    const humidity = data.humidity !== undefined && !isNaN(data.humidity) ? data.humidity.toFixed(1) : '--';
                    document.getElementById('humidity').textContent = `${humidity}%`;
                    setProgress(document.getElementById('humidityRing'), humidity === '--' ? 0 : parseFloat(humidity)); // Humidity is already 0-100

                    const pm25 = data.pm2_5 !== undefined && !isNaN(data.pm2_5) ? data.pm2_5 : '--';
                    document.getElementById('pm25').textContent = `${pm25} µg/m³`; // Updated ID and Unit
                    // Scale progress ring: 0 µg/m³ = 0%, 150 µg/m³ = 100% (around top of Unhealthy)
                    setProgress(document.getElementById('dustRing'), pm25 === '--' ? 0 : (pm25 / 150) * 100); // Use old SVG ID 'dustRing'

                    // Update Map Marker
                    updateMarkerAppearance(aqi === '--' ? null : aqi);

                    // Update chart
                    if (myChart && aqi !== '--') {
                        const now = moment().format('HH:mm:ss'); // More precise time for chart

                        // Limit data points to ~1 hour (e.g., 30 points * 2 sec = 1 min -> ~1800 points for 1 hour)
                        const maxDataPoints = 1800; // Keep about 1 hour of data (1800 points * 2s interval)

                        if (myChart.data.labels.length >= maxDataPoints) {
                            myChart.data.labels.shift(); // Remove oldest label
                            myChart.data.datasets[0].data.shift(); // Remove oldest data point
                        }

                        myChart.data.labels.push(now);
                        myChart.data.datasets[0].data.push(aqi);
                        myChart.update(); // Update chart smoothly
                    }

                } catch (error) {
                    console.error('Error fetching or processing data:', error);
                    // Optionally display an error message on the dashboard
                    document.getElementById('aqi').textContent = 'ERR';
                    document.getElementById('temp').textContent = 'ERR';
                    document.getElementById('humidity').textContent = 'ERR';
                    document.getElementById('pm25').textContent = 'ERR';
                    updateMarkerAppearance(null); // Set marker to default/error color
                }
            }

            // --- Initialization ---

            // Initialize everything when the DOM is ready
            document.addEventListener('DOMContentLoaded', () => {
                updateDateTime(); // Initial date/time display
                setInterval(updateDateTime, 1000); // Update date/time every second

                initMap(); // Initialize Google Map
                initializeChart(); // Initialize Chart.js

                fetchData(); // Fetch initial data immediately
                setInterval(fetchData, 5000); // Fetch new data every 5 seconds (adjust as needed)
            });
