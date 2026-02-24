(function () {
    // Check if libraries are loaded
    if (typeof supabase === 'undefined') {
        console.error("Supabase library not found. Ensure the CDN script is placed above this file.");
        return;
    }

    if (typeof CONFIG === 'undefined') {
        console.error("CONFIG not found. Ensure config.js is placed above this file.");
        return;
    }

    // Initialize Supabase Client
    const db = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    const container = document.getElementById('property-list-container');

    async function loadProperties() {
        try {
            const { data, error } = await db
                .from('leadway_properties')
                .select('*')
                .limit(3)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!container) return;

            container.innerHTML = '';

            if (data.length === 0) {
                container.innerHTML = '<div class="col-12 text-center"><p>No properties found.</p></div>';
                return;
            }

            data.forEach((item) => {
                const propertyHTML = `
                    <div class="col-xl-4 col-lg-6 col-md-6 fadeinup wow">
                        <div class="popular-list-1 grid-style">
                            <div class="thumb-wrapper">
                                <img src="${item.image}" alt="${item.name}" style="height: 280px; width: 100%; object-fit: cover;">
                                <div class="popular-badge">
                                    <img src="images/sell_rent_icon.svg" alt="icon">
                                    <p>For Sale</p>
                                </div>
                            </div>
                            <div class="property-content">
                                <div class="media-body">
                                    <h3 class="box-title">
                                      <a href="./property-details/index.html?id=${item.id}">${item.name}</a>
                                    </h3>
                                    <div class="box-text">${item.location}</div>
                                </div>
                                <ul class="property-featured">
                                    <li>Bed ${item.bed || 0}</li>
                                    <li>Bath ${item.bath || 0}</li>
                                    <li>${item.sqft || 0} sqft</li>
                                </ul>
                                <div class="property-bottom">
                                    <h6 class="box-title">${item.amount}</h6>
                                    <a class="th-btn sm style3 pill" href="property/index.html">Contact Agent</a>
                                </div>
                            </div>
                        </div>
                    </div>`;
                container.insertAdjacentHTML('beforeend', propertyHTML);
            });
        } catch (err) {
            console.error("Error fetching properties:", err.message);
        }
    }

    loadProperties();
})();