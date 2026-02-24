// contact.js
(function () {
    const db = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

    document.addEventListener('submit', async (e) => {
        if (e.target.classList.contains('customer_form')) {
            e.preventDefault();
            const form = e.target;
            const submitBtn = form.querySelector('button');

            // 1. Get Form Values
            const name = form.querySelector('#name').value;
            const phone = form.querySelector('#number').value;
            const email = form.querySelector('#email').value;
            const subject = form.querySelector('#subject').value;
            const message = form.querySelector('#message').value;

            if (!email || !message) {
                return Swal.fire('Error', 'Email and Message are required.', 'warning');
            }

            submitBtn.disabled = true;
            Swal.fire({ title: 'Connecting...', didOpen: () => Swal.showLoading() });

            try {
                // 2. Fetch the current Admin Email from the DB
                const { data: admin, error } = await db.from('admin').select('email').eq('id', 2).single();
                if (error) throw error;

                // 3. Construct the Mailto Link
                const mailtoLink = `mailto:${admin.email}?subject=${encodeURIComponent(subject || 'General Inquiry')}&body=${encodeURIComponent(
                    `From: ${name}\nPhone: ${phone}\nEmail: ${email}\n\nMessage:\n${message}`
                )}`;

                // 4. Open Email App
                window.location.href = mailtoLink;

                Swal.fire('Success', 'Your email app has been opened.', 'success');
                form.reset();
            } catch (err) {
                Swal.fire('Error', 'Could not retrieve admin contact info.', 'error');
            } finally {
                submitBtn.disabled = false;
            }
        }
    });
})();