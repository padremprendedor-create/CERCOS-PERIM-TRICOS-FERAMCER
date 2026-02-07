/* ==========================================
   FERAMCER EIRL - Landing Page JavaScript
   ========================================== */

// ==========================================
// SUPABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = 'https://qfrelimflhxeuxebhkka.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcmVsaW1mbGh4ZXV4ZWJoa2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzk4MjcsImV4cCI6MjA4NjA1NTgyN30.ZhW1zM69wPX9Xx-DdkcYygFI6ZvXMS3gG4TE0y6X2RI';

// Supabase client - initialized after DOM loads
let supabase = null;

document.addEventListener('DOMContentLoaded', function () {

    // Initialize Supabase safely
    try {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase initialized successfully');
        } else {
            console.warn('Supabase SDK not loaded - form will redirect to WhatsApp only');
        }
    } catch (error) {
        console.error('Error initializing Supabase:', error);
    }

    // ==========================================
    // LOCATION VARIABLES
    // ==========================================
    let selectedLocation = {
        lat: null,
        lng: null,
        text: ''
    };

    // Plaza de Huánuco default coordinates
    const defaultLocation = {
        lat: -9.930096,
        lng: -76.242195,
        text: 'Plaza de Armas de Huánuco'
    };

    // Leaflet map and marker references
    let map = null;
    let marker = null;
    let searchTimeout = null;
    let selectedResultIndex = -1;

    // ==========================================
    // DARK MODE TOGGLE
    // ==========================================
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;

    // Check for saved theme preference or default to system preference
    function getPreferredTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }
        // Check system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Apply theme
    function setTheme(theme) {
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
        }
        localStorage.setItem('theme', theme);
    }

    // Initialize theme on page load
    setTheme(getPreferredTheme());

    // Toggle theme on button click
    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);

            // Add a subtle animation feedback
            themeToggle.style.transform = 'scale(0.9)';
            setTimeout(() => {
                themeToggle.style.transform = '';
            }, 150);
        });
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });

    // ==========================================
    // INITIALIZE LEAFLET MAP
    // ==========================================
    function initMap() {
        if (map) return; // Already initialized

        // Create map centered on Plaza de Huánuco
        map = L.map('leafletMap').setView([defaultLocation.lat, defaultLocation.lng], 15);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(map);

        // Create custom icon
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background: linear-gradient(135deg, #f97316, #dc5a18);
                width: 36px;
                height: 36px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
            "><span style="transform: rotate(45deg); color: white; font-size: 16px; font-weight: bold;">●</span></div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36]
        });

        // Add draggable marker
        marker = L.marker([defaultLocation.lat, defaultLocation.lng], {
            draggable: true,
            icon: customIcon
        }).addTo(map);

        // Update coordinates when marker is dragged
        marker.on('dragend', function (e) {
            const pos = e.target.getLatLng();
            updateSelectedLocation(pos.lat, pos.lng);
            reverseGeocode(pos.lat, pos.lng);
        });

        // Click on map to move marker
        map.on('click', function (e) {
            marker.setLatLng(e.latlng);
            updateSelectedLocation(e.latlng.lat, e.latlng.lng);
            reverseGeocode(e.latlng.lat, e.latlng.lng);
        });

        // Set initial location
        selectedLocation = { ...defaultLocation };
        updateCoordsDisplay();
    }

    // ==========================================
    // NOMINATIM SEARCH API (OpenStreetMap)
    // ==========================================
    async function searchPlaces(query) {
        if (!query || query.length < 3) {
            hideSearchResults();
            return;
        }

        const searchResults = document.getElementById('searchResults');
        searchResults.innerHTML = '<div class="search-loading">🔍 Buscando...</div>';
        searchResults.classList.add('active');

        try {
            // Use Nominatim API (free, no API key needed)
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=pe&limit=6&addressdetails=1`;

            const response = await fetch(url, {
                headers: {
                    'Accept-Language': 'es'
                }
            });

            if (!response.ok) throw new Error('Error de red');

            const results = await response.json();

            if (results.length === 0) {
                searchResults.innerHTML = '<div class="search-no-results">📍 No se encontraron resultados. Intenta con otra búsqueda.</div>';
                return;
            }

            // Render results
            searchResults.innerHTML = results.map((result, index) => {
                const name = result.display_name.split(',')[0];
                const address = result.display_name.split(',').slice(1, 4).join(',');
                const icon = getPlaceIcon(result.type, result.class);

                return `
                    <div class="search-result-item" data-lat="${result.lat}" data-lng="${result.lon}" data-name="${result.display_name}" data-index="${index}">
                        <span class="search-result-icon">${icon}</span>
                        <div class="search-result-info">
                            <div class="search-result-name">${name}</div>
                            <div class="search-result-address">${address}</div>
                        </div>
                    </div>
                `;
            }).join('');

            // Add click handlers to results
            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', function () {
                    selectSearchResult(this);
                });
            });

            selectedResultIndex = -1;

        } catch (error) {
            console.error('Error buscando:', error);
            searchResults.innerHTML = '<div class="search-no-results">❌ Error al buscar. Intenta de nuevo.</div>';
        }
    }

    function getPlaceIcon(type, placeClass) {
        // Return appropriate icon based on place type
        const icons = {
            'city': '🏙️',
            'town': '🏘️',
            'village': '🏡',
            'suburb': '🏘️',
            'neighbourhood': '📍',
            'road': '🛣️',
            'highway': '🛣️',
            'building': '🏢',
            'house': '🏠',
            'shop': '🏪',
            'amenity': '📍',
            'place': '📍'
        };
        return icons[type] || icons[placeClass] || '📍';
    }

    function selectSearchResult(element) {
        const lat = parseFloat(element.dataset.lat);
        const lng = parseFloat(element.dataset.lng);
        const name = element.dataset.name;

        // Move map and marker
        map.setView([lat, lng], 17);
        marker.setLatLng([lat, lng]);

        // Update location
        updateSelectedLocation(lat, lng, name.split(',').slice(0, 3).join(', '));

        // Update search input with selected place
        document.getElementById('searchLocation').value = name.split(',')[0];

        // Hide results
        hideSearchResults();

        // Show notification
        showNotification('📍 Ubicación seleccionada', 'success');
    }

    function hideSearchResults() {
        const searchResults = document.getElementById('searchResults');
        searchResults.classList.remove('active');
        searchResults.innerHTML = '';
        selectedResultIndex = -1;
    }

    function reverseGeocode(lat, lng) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: { 'Accept-Language': 'es' }
        })
            .then(response => response.json())
            .then(data => {
                if (data && data.display_name) {
                    selectedLocation.text = data.display_name.split(',').slice(0, 4).join(', ');
                    updateCoordsDisplay();
                }
            })
            .catch(err => console.log('Reverse geocode error:', err));
    }

    function updateSelectedLocation(lat, lng, text = '') {
        selectedLocation.lat = lat;
        selectedLocation.lng = lng;
        if (text) selectedLocation.text = text;
        updateCoordsDisplay();
    }

    function updateCoordsDisplay() {
        const coordsDisplay = document.getElementById('coordsDisplay');
        if (coordsDisplay && selectedLocation.lat && selectedLocation.lng) {
            coordsDisplay.textContent = `Coordenadas: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`;
        }
    }

    // ==========================================
    // MAPS MODAL HANDLING
    // ==========================================
    const btnUbicacion = document.getElementById('btnUbicacion');
    const mapsModal = document.getElementById('mapsModal');
    const closeMapsModal = document.getElementById('closeMapsModal');
    const confirmLocation = document.getElementById('confirmLocation');
    const ubicacionDisplay = document.getElementById('ubicacionSeleccionada');
    const searchInput = document.getElementById('searchLocation');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');

    // Debug logs
    console.log('btnUbicacion found:', !!btnUbicacion);
    console.log('mapsModal found:', !!mapsModal);

    // Open maps modal
    if (btnUbicacion) {
        console.log('Adding click listener to btnUbicacion');
        btnUbicacion.addEventListener('click', function () {
            console.log('btnUbicacion clicked!');
            console.log('mapsModal element:', mapsModal);
            if (mapsModal) {
                mapsModal.classList.add('active');
                console.log('Added active class to mapsModal');
            } else {
                console.error('mapsModal is null!');
            }
            document.body.style.overflow = 'hidden';

            // Initialize map when modal opens (needs to be visible)
            setTimeout(() => {
                initMap();
                if (map) map.invalidateSize();
                // Focus search input
                if (searchInput) searchInput.focus();
            }, 150);
        });
    } else {
        console.error('btnUbicacion not found in DOM!');
    }

    // Live search as user types (with debounce)
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const query = e.target.value.trim();

            // Clear previous timeout
            if (searchTimeout) clearTimeout(searchTimeout);

            if (query.length < 3) {
                hideSearchResults();
                return;
            }

            // Debounce: wait 400ms after user stops typing
            searchTimeout = setTimeout(() => {
                searchPlaces(query);
            }, 400);
        });

        // Keyboard navigation in results
        searchInput.addEventListener('keydown', function (e) {
            const items = searchResults.querySelectorAll('.search-result-item');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedResultIndex = Math.min(selectedResultIndex + 1, items.length - 1);
                updateSelectedItem(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedResultIndex = Math.max(selectedResultIndex - 1, 0);
                updateSelectedItem(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedResultIndex >= 0 && items[selectedResultIndex]) {
                    selectSearchResult(items[selectedResultIndex]);
                } else if (searchInput.value.trim().length >= 3) {
                    searchPlaces(searchInput.value.trim());
                }
            } else if (e.key === 'Escape') {
                hideSearchResults();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.maps-search-wrapper')) {
                hideSearchResults();
            }
        });
    }

    function updateSelectedItem(items) {
        items.forEach((item, index) => {
            if (index === selectedResultIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    // Search button click
    if (searchBtn) {
        searchBtn.addEventListener('click', function () {
            const query = searchInput.value.trim();
            if (query.length >= 3) {
                searchPlaces(query);
            } else {
                showNotification('Escribe al menos 3 caracteres para buscar', 'error');
            }
        });
    }

    // Close maps modal
    if (closeMapsModal) {
        closeMapsModal.addEventListener('click', function () {
            mapsModal.classList.remove('active');
            document.body.style.overflow = '';
            hideSearchResults();
        });
    }

    // Close on backdrop click
    if (mapsModal) {
        mapsModal.addEventListener('click', function (e) {
            if (e.target === mapsModal) {
                mapsModal.classList.remove('active');
                document.body.style.overflow = '';
                hideSearchResults();
            }
        });
    }

    // Close on ESC key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && mapsModal && mapsModal.classList.contains('active')) {
            mapsModal.classList.remove('active');
            document.body.style.overflow = '';
            hideSearchResults();
        }
    });

    // Confirm location selection
    if (confirmLocation) {
        confirmLocation.addEventListener('click', function () {
            // Validate location selected
            if (!selectedLocation.lat || !selectedLocation.lng) {
                selectedLocation = { ...defaultLocation };
            }

            // Update hidden form fields
            document.getElementById('ubicacionLat').value = selectedLocation.lat;
            document.getElementById('ubicacionLng').value = selectedLocation.lng;
            document.getElementById('ubicacionTexto').value = selectedLocation.text || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`;

            // Update display
            ubicacionDisplay.innerHTML = `
                <div class="ubicacion-label">
                    <span>✅</span> Ubicación seleccionada
                </div>
                <div>${selectedLocation.text || 'Ubicación en mapa'}</div>
                <div class="ubicacion-coords">Coordenadas: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}</div>
            `;
            ubicacionDisplay.classList.add('active');

            // Change button style
            btnUbicacion.classList.add('location-selected');
            btnUbicacion.innerHTML = '<span class="location-icon">✅</span> Ubicación seleccionada';

            // Close modal
            mapsModal.classList.remove('active');
            document.body.style.overflow = '';

            // Show notification
            showNotification('¡Ubicación confirmada correctamente!', 'success');
        });
    }

    // ==========================================
    // FORM HANDLING - Now triggers after location
    // ==========================================
    const quoteForm = document.getElementById('quoteForm');

    // Create submit button dynamically after location is selected
    function addSubmitButton() {
        // Check if submit button already exists
        if (document.getElementById('btnSubmitForm')) return;

        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.id = 'btnSubmitForm';
        submitBtn.className = 'cta-button cta-submit';
        submitBtn.innerHTML = '📲 Enviar cotización por WhatsApp';
        submitBtn.style.marginTop = '1rem';

        quoteForm.appendChild(submitBtn);
    }

    // Watch for location selection to show submit button
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.target.classList.contains('active')) {
                addSubmitButton();
            }
        });
    });

    if (ubicacionDisplay) {
        observer.observe(ubicacionDisplay, { attributes: true, attributeFilter: ['class'] });
    }

    if (quoteForm) {
        quoteForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Get form values
            const nombre = document.getElementById('nombre').value.trim();
            const telefono = document.getElementById('telefono').value.trim();
            const metros = document.getElementById('metros').value;
            const altura = document.getElementById('altura').value;
            const ubicacionLat = document.getElementById('ubicacionLat').value;
            const ubicacionLng = document.getElementById('ubicacionLng').value;
            const ubicacionTexto = document.getElementById('ubicacionTexto').value;

            // Validate
            if (!nombre || !telefono || !metros || !altura) {
                showNotification('Por favor completa todos los campos.', 'error');
                return;
            }

            if (!ubicacionLat || !ubicacionLng) {
                showNotification('Por favor selecciona la ubicación de tu proyecto.', 'error');
                btnUbicacion.focus();
                return;
            }

            // Save to Supabase (if available)
            if (supabase) {
                try {
                    const { error } = await supabase
                        .from('leads')
                        .insert([{
                            nombre: nombre,
                            telefono: telefono,
                            tipo_cerco: altura,
                            metros_lineales: parseFloat(metros),
                            lat: parseFloat(ubicacionLat),
                            lng: parseFloat(ubicacionLng),
                            direccion: ubicacionTexto
                        }]);

                    if (error) {
                        console.error('Supabase error:', error);
                    } else {
                        console.log('Lead saved to Supabase successfully');
                    }
                } catch (err) {
                    console.error('Error saving lead:', err);
                }
            }

            // Build Google Maps link for the location
            const mapsLink = `https://www.google.com/maps?q=${ubicacionLat},${ubicacionLng}`;

            // Build WhatsApp message
            const message = `🏗️ *NUEVA SOLICITUD DE COTIZACIÓN*

👤 *Nombre:* ${nombre}
📱 *WhatsApp:* ${telefono}
📏 *Metros lineales:* ${metros} m
📐 *Altura deseada:* ${altura} m

📍 *Ubicación del proyecto:*
${ubicacionTexto || 'Ver en mapa'}
🗺️ ${mapsLink}

_Solicitud enviada desde la web FERAMCER_`;

            // Encode message for WhatsApp URL
            const encodedMessage = encodeURIComponent(message);

            // WhatsApp business number (replace with actual number)
            const whatsappNumber = '51999888777'; // Formato: código país + número

            // Create WhatsApp URL
            const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

            // Show success notification
            showNotification('¡Perfecto! Te redirigimos a WhatsApp...', 'success');

            // Open WhatsApp in new tab after short delay
            setTimeout(() => {
                window.open(whatsappURL, '_blank');
            }, 800);
        });
    }

    // ==========================================
    // NOTIFICATION SYSTEM
    // ==========================================
    function showNotification(message, type = 'info') {
        // Remove any existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            z-index: 100000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-family: 'Inter', sans-serif;
            font-size: 1rem;
            animation: slideDown 0.3s ease forwards;
            max-width: 90%;
        `;

        // Add animation keyframes if not already added
        if (!document.querySelector('#notification-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'notification-styles';
            styleSheet.textContent = `
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                @keyframes slideUp {
                    from {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }

        // Add to DOM
        document.body.appendChild(notification);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // ==========================================
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ==========================================
    // HEADER SCROLL EFFECT
    // ==========================================
    const header = document.querySelector('.header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        } else {
            header.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    });

    // ==========================================
    // INTERSECTION OBSERVER FOR ANIMATIONS
    // ==========================================
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const animateOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                animateOnScroll.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add animation styles
    const animationStyles = document.createElement('style');
    animationStyles.textContent = `
        .animate-target {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .animate-target.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        .step-card.animate-target {
            transition-delay: calc(var(--index) * 0.1s);
        }
    `;
    document.head.appendChild(animationStyles);

    // Observe sections
    const sectionsToAnimate = document.querySelectorAll('.diferencial-content, .confianza-content, .urgencia-content, .cta-final-content');
    sectionsToAnimate.forEach(section => {
        section.classList.add('animate-target');
        animateOnScroll.observe(section);
    });

    // Observe step cards - they already have opacity:0 in CSS
    // Just add animate-in class when they come into view
    const stepCards = document.querySelectorAll('.step-card');
    stepCards.forEach(card => {
        animateOnScroll.observe(card);
    });

    // ==========================================
    // INPUT FORMATTING
    // ==========================================
    const telefonoInput = document.getElementById('telefono');
    if (telefonoInput) {
        telefonoInput.addEventListener('input', function (e) {
            // Remove non-digits
            let value = e.target.value.replace(/\D/g, '');

            // Format as XXX XXX XXX
            if (value.length > 3 && value.length <= 6) {
                value = value.slice(0, 3) + ' ' + value.slice(3);
            } else if (value.length > 6) {
                value = value.slice(0, 3) + ' ' + value.slice(3, 6) + ' ' + value.slice(6, 9);
            }

            e.target.value = value;
        });
    }

    // ==========================================
    // METROS INPUT VALIDATION
    // ==========================================
    const metrosInput = document.getElementById('metros');
    if (metrosInput) {
        metrosInput.addEventListener('input', function (e) {
            // Ensure positive number
            if (e.target.value < 0) {
                e.target.value = 0;
            }
        });
    }

    // ==========================================
    // CONSOLE INFO
    // ==========================================
    console.log('%c FERAMCER EIRL ', 'background: #1a1a1a; color: #f97316; font-size: 20px; font-weight: bold; padding: 10px 20px;');
    console.log('%c Cercos Perimétricos de Concreto ', 'color: #6b7280; font-size: 12px;');

});
