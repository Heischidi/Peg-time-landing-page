document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // GOOGLE SHEETS INTEGRATION
  // ─────────────────────────────────────────────────────────────
  // HOW TO SET UP (one-time, takes ~5 minutes):
  //
  // 1. Create a new Google Sheet (any name, e.g. "PegTime Waitlist")
  // 2. In the sheet, go to Extensions → Apps Script
  // 3. Replace the default code with the script below, then click
  //    Deploy → New deployment → Web app
  //    - Execute as: Me
  //    - Who has access: Anyone
  //    Copy the Web App URL and paste it as SHEET_URL below.
  //
  // ── Apps Script code to paste ──────────────────────────────
  //
  //  function doPost(e) {
  //    try {
  //      var data = JSON.parse(e.postData.contents);
  //      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  //      sheet.appendRow([new Date(), data.email, data.ticket]);
  //      return ContentService
  //        .createTextOutput(JSON.stringify({ result: 'success' }))
  //        .setMimeType(ContentService.MimeType.JSON);
  //    } catch(err) {
  //      return ContentService
  //        .createTextOutput(JSON.stringify({ result: 'error', error: err.toString() }))
  //        .setMimeType(ContentService.MimeType.JSON);
  //    }
  //  }
  //
  // ────────────────────────────────────────────────────────────

  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxqLzguuSCxunN_DZ0WhuRLxlbY9myNaD_w0dMjBhis-8fhwgPfsvYAkXcSN27wWxJBHw/exec';

  async function submitToSheet(email, ticketId) {
    if (SHEET_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
      // No URL configured yet — succeed silently so the UI still works
      console.warn('PegTime: Google Sheets URL not configured yet.');
      return;
    }
    try {
      await fetch(SHEET_URL, {
        method: 'POST',
        // Apps Script requires no-cors for cross-origin POST
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ticket: ticketId })
      });
    } catch (err) {
      // Network errors are silent — the user's ticket is already shown
      console.error('PegTime: Sheet submission failed:', err);
    }
  }

  // ============================================================
  // WAITLIST FLOW & LOCAL STORAGE PERSISTENCE
  // ============================================================

  const heroForm   = document.getElementById('hero-waitlist-form');
  const ctaForm    = document.getElementById('cta-waitlist-form');
  const heroTicket = document.getElementById('hero-ticket');
  const ctaTicket  = document.getElementById('cta-ticket');

  // Restore saved ticket on page load
  function checkSavedWaitlist() {
    const savedEmail  = localStorage.getItem('pegtime_waitlist_email');
    const savedTicket = localStorage.getItem('pegtime_waitlist_num');

    if (savedEmail && savedTicket) {
      showTickets(savedTicket);
    }
  }

  function showTickets(ticketId) {
    // Hero
    if (heroForm)   heroForm.style.display = 'none';
    if (heroTicket) {
      heroTicket.style.display = 'block';
      document.getElementById('hero-ticket-number').textContent = ticketId;
    }
    // CTA
    if (ctaForm)   ctaForm.style.display = 'none';
    if (ctaTicket) {
      ctaTicket.style.display = 'block';
      document.getElementById('cta-ticket-number').textContent = ticketId;
    }
  }

  // Handle a new submission
  async function handleFormSubmit(e) {
    e.preventDefault();
    const form       = e.currentTarget;
    const emailInput = form.querySelector('input[type="email"]');
    const email      = emailInput.value.trim();
    const successMsg = form.querySelector('.form-msg.success');
    const errorMsg   = form.querySelector('.form-msg.error');
    const submitBtn  = form.querySelector('button[type="submit"]');

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      errorMsg.style.display = 'flex';
      successMsg.style.display = 'none';
      return;
    }
    errorMsg.style.display = 'none';

    // Spinner state
    submitBtn.disabled = true;
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = `
      <svg class="spinner" width="16" height="16" viewBox="0 0 50 50"
           style="animation: spin 1s linear infinite;">
        <circle cx="25" cy="25" r="20" fill="none"
                stroke="currentColor" stroke-width="5"
                stroke-dasharray="80, 200"></circle>
      </svg>
    `;

    // Generate ticket ID
    const ticketId = `PEG-${Math.floor(1000 + Math.random() * 9000)}`;

    // Fire-and-forget to Google Sheets
    submitToSheet(email, ticketId);

    // Save to localStorage
    localStorage.setItem('pegtime_waitlist_email', email);
    localStorage.setItem('pegtime_waitlist_num',   ticketId);

    // Brief pause for UX feel, then show ticket
    await new Promise(r => setTimeout(r, 1100));

    form.style.opacity = '0';
    await new Promise(r => setTimeout(r, 300));

    showTickets(ticketId);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
  }

  if (heroForm) heroForm.addEventListener('submit', handleFormSubmit);
  if (ctaForm)  ctaForm.addEventListener('submit',  handleFormSubmit);

  checkSavedWaitlist();


  // ============================================================
  // LIVE SIGNUP COUNTER ANIMATION
  // ============================================================

  const signupCountSpan = document.querySelector('.avatar-text strong');
  if (signupCountSpan) {
    let totalSignups = 422;
    setInterval(() => {
      const delay = Math.random() * 8000 + 10000;
      setTimeout(() => {
        totalSignups += Math.floor(Math.random() * 2) + 1;
        signupCountSpan.textContent = `${totalSignups}+ Winnipeggers`;
      }, delay);
    }, 15000);
  }


  // ============================================================
  // SCROLL REVEAL ANIMATIONS
  // ============================================================

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  const revealTargets = [
    '.steps-grid',
    '.table-container',
    '.cta-box',
    '.appflow-grid',
    '.appflow-example',
    '.about-inner'
  ];

  revealTargets.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)';
      revealObserver.observe(el);
    }
  });

});

// Spinner keyframe injection
const styleSheet = document.createElement('style');
styleSheet.innerText = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);
