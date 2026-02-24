(function () {
    const db = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    const container = document.getElementById('property-list-container');

    async function loadProperties() {
        try {
            const { data, error } = await db.from('leadway_properties').select('*').order('created_at', { ascending: false });
            if (error || !container) return;

            container.innerHTML = '';
            data.forEach((item) => {
                const propertyHTML = `
                    <div class="col-xl-4 col-lg-6 col-md-6">
                        <div class="popular-list-1 grid-style">
                            <div class="thumb-wrapper">
                                <img src="${item.image}" alt="${item.name}" style="height: 280px; width: 100%; object-fit: cover;">
                            </div>
                            <div class="property-content">
                                <div class="media-body">
                                    <h3 class="box-title">${item.name}</h3>
                                    <div class="box-text">${item.location}</div>
                                </div>
                                <ul class="property-featured">
                                    <li>Bed ${item.bed || 0}</li>
                                    <li>Bath ${item.bath || 0}</li>
                                    <li>${item.sqft || 0} sqft</li>
                                </ul>
                                <div class="property-bottom">
                                    <h6 class="box-title">${item.amount}</h6>
                                    <button class="th-btn sm style3 pill" onclick="openInquiry('${item.id}')">Inquire Now</button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                container.insertAdjacentHTML('beforeend', propertyHTML);
            });
        } catch (err) { console.error(err); }
    }

    // --- The Inquiry Swal UI ---
    window.openInquiry = async (id) => {
        // Fetch item details and admin email
        const { data: item } = await db.from('leadway_properties').select('*').eq('id', id).single();
        const { data: admin } = await db.from('admin').select('email').eq('id', 2).single();

        if (!item || !admin) return Swal.fire('Error', 'Information not found.', 'error');

        Swal.fire({
            title: `Inquire about ${item.name}`,
            html: `
                <div style="text-align: left;">
                    <img src="${item.image}" style="width:100%; height:150px; object-fit:cover; border-radius:8px; margin-bottom:15px;">
                    <p><strong>Price:</strong> ${item.amount} | <strong>Location:</strong> ${item.location}</p>
                    <hr>
                    <input type="email" id="swal-user-email" class="swal2-input" placeholder="Your Email">
                    <input type="text" id="swal-subject" class="swal2-input" placeholder="Subject" value="Inquiry: ${item.name}">
                    <textarea id="swal-message" class="swal2-textarea" placeholder="Tell us what you want to know..."></textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Open Email App',
            preConfirm: () => {
                const uEmail = document.getElementById('swal-user-email').value;
                const uMsg = document.getElementById('swal-message').value;
                const uSub = document.getElementById('swal-subject').value;
                if (!uEmail || !uMsg) {
                    Swal.showValidationMessage('Please fill in your email and message');
                }
                return { uEmail, uMsg, uSub };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Construct the email body with property info included
                const body = `Hi Lead-Way Real Estate,\n\nI am interested in the following property:\n- Name: ${item.name}\n- Price: ${item.amount}\n- Location: ${item.location}\n\nMy Message:\n${result.value.uMsg}\n\nMy Email: ${result.value.uEmail}`;

                const mailto = `mailto:${admin.email}?subject=${encodeURIComponent(result.value.uSub)}&body=${encodeURIComponent(body)}`;

                window.location.href = mailto;
            }
        });
    };

    loadProperties();
})();