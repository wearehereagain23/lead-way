(function () {
    // 1. Safe Initialization
    if (typeof window._supabase === 'undefined') {
        window._supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    }
    const db = window._supabase;

    const propertyForm = document.getElementById('properties_form');
    const propertyTableBody = document.getElementById('testimony_table_body');

    // Pagination Elements
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    let currentPage = 0;
    const pageSize = 10; // Number of properties per page

    if (!propertyForm) return;
    const submitBtn = propertyForm.querySelector('button[type="submit"]');

    // --- 1. RENDER TABLE WITH PAGINATION (Targets 'leadway_properties' table) ---
    async function fetchProperties() {
        try {
            const from = currentPage * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await db
                .from('leadway_properties')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            if (!propertyTableBody) return;

            propertyTableBody.innerHTML = '';
            data.forEach((item) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${item.id}</td>
                    <td><input type="text" class="form-control form-control-sm" id="edit_name_${item.id}" value="${item.name || ''}"></td>
                    <td><input type="text" class="form-control form-control-sm" id="edit_loc_${item.id}" value="${item.location || ''}"></td>
                    <td><input type="text" class="form-control form-control-sm" id="edit_amt_${item.id}" value="${item.amount || ''}"></td>
                    <td>
                        <div class="d-flex">
                            <button class="btn btn-sm btn-success me-1" onclick="updateProperty('${item.id}')" title="Update">
                                <i class="ti ti-check"></i>
                            </button>
                            <button class="btn btn-sm btn-info me-1" onclick="previewProperty('${item.id}')" title="View">
                                <i class="ti ti-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteProperty('${item.id}')" title="Delete">
                                <i class="ti ti-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                propertyTableBody.appendChild(tr);
            });

            // Handle Pagination UI
            updatePaginationUI(count);

        } catch (err) {
            console.error("Property fetch error:", err.message);
        }
    }

    function updatePaginationUI(totalCount) {
        const totalPages = Math.ceil(totalCount / pageSize);

        if (pageInfo) {
            pageInfo.innerText = `Page ${currentPage + 1} of ${totalPages || 1}`;
        }

        if (prevBtn) {
            prevBtn.style.display = currentPage > 0 ? 'block' : 'none';
        }

        if (nextBtn) {
            nextBtn.style.display = (currentPage + 1) * pageSize < totalCount ? 'block' : 'none';
        }
    }

    // --- 2. PAGINATION EVENT LISTENERS ---
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                fetchProperties();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentPage++;
            fetchProperties();
        });
    }

    // --- 3. FORM SUBMISSION (Add New Property) ---
    propertyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const location = document.getElementById('location').value;
        const bed = document.getElementById('bed').value;
        const bath = document.getElementById('bath').value;
        const sqft = document.getElementById('sqft').value;
        const amount = document.getElementById('amount').value;
        const imageFile = document.getElementById('imageUpload').files[0];

        if (!name || !location || !imageFile) {
            Swal.fire('Error', 'Please provide Name, Location, and an Image.', 'warning');
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        Swal.fire({ title: 'Uploading Property...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            const fileName = `prop_${Date.now()}_${imageFile.name}`;
            const { error: uploadError } = await db.storage.from('cardimage').upload(fileName, imageFile);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = db.storage.from('cardimage').getPublicUrl(fileName);

            const { error: insertError } = await db.from('leadway_properties').insert([{
                name, location, bed, bath, sqft, amount, image: publicUrl
            }]);

            if (insertError) throw insertError;

            await Swal.fire('Success!', 'Property added successfully.', 'success');
            propertyForm.reset();
            fetchProperties();

        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    // --- 4. WINDOW FUNCTIONS ---
    window.updateProperty = async (id) => {
        const uName = document.getElementById(`edit_name_${id}`).value;
        const uLoc = document.getElementById(`edit_loc_${id}`).value;
        const uAmt = document.getElementById(`edit_amt_${id}`).value;

        try {
            const { error } = await db.from('leadway_properties').update({ name: uName, location: uLoc, amount: uAmt }).eq('id', id);
            if (error) throw error;
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Updated!', showConfirmButton: false, timer: 1500 });
        } catch (err) {
            Swal.fire('Update Failed', err.message, 'error');
        }
    };

    window.previewProperty = async (id) => {
        const { data } = await db.from('leadway_properties').select('*').eq('id', id).single();
        if (data) {
            Swal.fire({
                title: `<strong>${data.name}</strong>`,
                html: `
                    <div style="text-align: left;">
                        <img src="${data.image}" style="width:100%; height:200px; object-fit:cover; border-radius:10px; margin-bottom:15px;" />
                        <p><strong>Location:</strong> ${data.location}</p>
                        <p><strong>Price:</strong> ${data.amount}</p>
                        <hr>
                        <div style="display:flex; justify-content: space-between;">
                            <span><i class="ti ti-bed"></i> ${data.bed} Bed</span>
                            <span><i class="ti ti-bath"></i> ${data.bath} Bath</span>
                            <span><i class="ti ti-maximize"></i> ${data.sqft} sqft</span>
                        </div>
                    </div>
                `
            });
        }
    };

    window.deleteProperty = async (id) => {
        const result = await Swal.fire({
            title: 'Delete property?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete!'
        });

        if (result.isConfirmed) {
            const { error } = await db.from('leadway_properties').delete().eq('id', id);
            if (!error) {
                Swal.fire('Deleted!', '', 'success');
                fetchProperties();
            }
        }
    };

    fetchProperties();
})();