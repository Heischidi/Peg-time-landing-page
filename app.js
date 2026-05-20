document.addEventListener('DOMContentLoaded', () => {

  // Winnipeg Simulation Datasets
  const simulationData = {
    routes: {
      "11": {
        routeNum: "11",
        routeName: "Portage Ave",
        dest: "Kildonan Place",
        stopId: "Stop 10060",
        stopName: "Portage & Vaughan"
      },
      "60": {
        routeNum: "60",
        routeName: "Pembina Hwy",
        dest: "Downtown",
        stopId: "Stop 10624",
        stopName: "Pembina at University"
      },
      "BLUE": {
        routeNum: "BLU",
        routeName: "Rapid Transit",
        dest: "St. Norbert / U of M",
        stopId: "Stop 50150",
        stopName: "Osborne Rapid Station"
      }
    },
    scenarios: {
      rush: {
        delayMin: 9,
        badgeClass: "delayed",
        badgeText: "Late (+9 min)",
        metaText: "Friday Rush Hour Portage Ave",
        schedTime: "5:12 PM",
        predTime: "5:21 PM",
        leaveTime: "5:16 PM",
        feedback: "Bus delayed by 9 mins due to Portage Ave construction traffic. Leave home 4 mins later than scheduled. Stay warm inside!",
        timelineFill: 65,
        chartHeights: [20, 45, 80, 95, 75, 45, 20]
      },
      winter: {
        delayMin: 26,
        badgeClass: "severe",
        badgeText: "Severe Delay (+26 min)",
        metaText: "-30°C Winnipeg Blizzard",
        schedTime: "5:12 PM",
        predTime: "5:38 PM",
        leaveTime: "5:33 PM",
        feedback: "Severe winter ice roads are slowing down buses citywide. PegTime suggests delaying your departure by 21 minutes to dodge the frostbite.",
        timelineFill: 35,
        chartHeights: [45, 60, 95, 100, 90, 85, 75]
      },
      construction: {
        delayMin: 12,
        badgeClass: "delayed",
        badgeText: "Late (+12 min)",
        metaText: "Pembina Hwy Lane Bottleneck",
        schedTime: "5:12 PM",
        predTime: "5:24 PM",
        leaveTime: "5:19 PM",
        feedback: "Pembina Highway is squeezed down to single lanes. PegTime learns this pattern to offset your walking time. Leave at 5:19 PM.",
        timelineFill: 55,
        chartHeights: [15, 30, 60, 75, 85, 55, 35]
      },
      normal: {
        delayMin: 1,
        badgeClass: "on-time",
        badgeText: "On Time (+1 min)",
        metaText: "Standard Off-Peak Commute",
        schedTime: "5:12 PM",
        predTime: "5:13 PM",
        leaveTime: "5:08 PM",
        feedback: "Traffic is moving smoothly across Winnipeg. Take a normal 5-minute headstart and leave your door at 5:08 PM.",
        timelineFill: 85,
        chartHeights: [10, 15, 25, 35, 30, 20, 10]
      }
    }
  };

  // State Management
  let currentRoute = "11";
  let currentScenario = "rush";

  // Cache Simulator DOM Elements
  const routeBtns = document.querySelectorAll('.route-btn');
  const scenarioBtns = document.querySelectorAll('.scenario-btn');
  const estStopDisplay = document.getElementById('est-stop-display');
  const estSchedDisplay = document.getElementById('est-sched-display');
  const estPredDisplay = document.getElementById('est-pred-display');
  const estLeaveDisplay = document.getElementById('est-leave-display');
  const estFeedbackDisplay = document.getElementById('est-feedback-display');

  // Cache Hero Mockup DOM Elements (for real-time synchronization!)
  const mockupStopName = document.getElementById('mockup-stop-name');
  const mockupRouteBadge = document.getElementById('mockup-route-badge');
  const mockupRouteDest = document.getElementById('mockup-route-dest');
  const mockupStopId = document.getElementById('mockup-stop-id');
  const mockupDelayBadge = document.getElementById('mockup-delay-badge');
  const mockupDelayMeta = document.getElementById('mockup-delay-meta');
  const mockupSchedTime = document.getElementById('mockup-sched-time');
  const mockupLeaveTime = document.getElementById('mockup-leave-time');
  const mockupNotificationText = document.getElementById('mockup-notification-text');
  const mockupTimelineFill = document.getElementById('mockup-timeline-fill');
  const mockupTimelineBus = document.getElementById('mockup-timeline-bus');
  const mockupTimelinePercent = document.getElementById('mockup-timeline-percent');
  const mockupPredictionCard = document.getElementById('mockup-prediction-card');
  const mlChartBars = document.querySelectorAll('.ml-chart .chart-bar');

  // Function to calculate customized Winnipeg delay times
  function updateSimulation() {
    const routeObj = simulationData.routes[currentRoute];
    const scenObj = simulationData.scenarios[currentScenario];

    // Calculate time offsets dynamically based on Winnipeg stop details
    let schedHr = 5;
    let schedMin = 12;
    
    // Shift scheduled times slightly to look authentic per stop
    if (currentRoute === "60") {
      schedHr = 8;
      schedMin = 42;
    } else if (currentRoute === "BLUE") {
      schedHr = 7;
      schedMin = 24;
    }

    const formatTime = (hr, min) => {
      let suffix = hr >= 12 ? "PM" : "AM";
      let formattedHr = hr % 12 || 12;
      let formattedMin = min < 10 ? "0" + min : min;
      return `${formattedHr}:${formattedMin} ${suffix}`;
    };

    // Calculate times
    const schedText = formatTime(schedHr, schedMin);
    
    let totalPredMins = schedMin + scenObj.delayMin;
    let predHr = schedHr;
    if (totalPredMins >= 60) {
      predHr += Math.floor(totalPredMins / 60);
      totalPredMins = totalPredMins % 60;
    }
    const predText = formatTime(predHr, totalPredMins);

    // Leave-by calculation (typically arrival time minus 5 mins walking headstart)
    let totalLeaveMins = totalPredMins - 5;
    let leaveHr = predHr;
    if (totalLeaveMins < 0) {
      leaveHr -= 1;
      totalLeaveMins = 60 + totalLeaveMins;
    }
    const leaveText = formatTime(leaveHr, totalLeaveMins);

    // Update main Simulator widget text
    estStopDisplay.textContent = `${routeObj.stopName} — Stop ${routeObj.stopId.split(' ')[1]}`;
    estSchedDisplay.textContent = schedText;
    estPredDisplay.textContent = predText;
    estLeaveDisplay.textContent = leaveText;
    
    // Customize feedback strings for specific Winnipeg locations
    let customFeedback = scenObj.feedback;
    if (currentRoute === "60") {
      customFeedback = customFeedback.replace("Portage Ave", "Pembina Hwy").replace("Portage", "Pembina");
    } else if (currentRoute === "BLUE") {
      customFeedback = customFeedback.replace("Portage Ave", "Osborne RT Transit corridor").replace("Portage", "Osborne Station");
    }
    estFeedbackDisplay.textContent = customFeedback;

    // UPDATE HERO PHONE MOCKUP FOR MAGICAL LIVE INTERACTION FEEL!
    mockupStopName.textContent = routeObj.stopName;
    mockupRouteBadge.textContent = routeObj.routeNum;
    mockupRouteDest.textContent = routeObj.dest;
    mockupStopId.textContent = routeObj.stopId;
    
    mockupSchedTime.textContent = schedText;
    mockupLeaveTime.textContent = leaveText;

    // Update delay badge styles
    mockupDelayBadge.className = `app-delay-badge ${scenObj.badgeClass}`;
    mockupDelayBadge.textContent = scenObj.badgeText;
    mockupDelayMeta.textContent = scenObj.metaText;

    // Notification banner styling & text
    mockupPredictionCard.className = `app-prediction-card ${scenObj.delayMin > 5 ? 'delay-alert' : ''}`;
    
    let walkingDelta = scenObj.delayMin - 5;
    if (walkingDelta > 0) {
      mockupNotificationText.innerHTML = `Leave house in <strong>${walkingDelta} mins</strong>. Do not rush—bus is running behind.`;
    } else if (scenObj.delayMin <= 1) {
      mockupNotificationText.innerHTML = `Leave house <strong>now</strong>. Route is clear, bus is running on schedule.`;
    } else {
      mockupNotificationText.innerHTML = `Leave house <strong>in 1 min</strong>. Bus is running slightly delayed.`;
    }

    // Update mockup progress line
    mockupTimelineFill.style.width = `${scenObj.timelineFill}%`;
    mockupTimelineBus.style.left = `${scenObj.timelineFill}%`;
    mockupTimelinePercent.textContent = `${scenObj.timelineFill}% complete`;

    // Dynamic ML chart bars
    mlChartBars.forEach((bar, idx) => {
      const height = scenObj.chartHeights[idx] || 20;
      bar.style.height = `${height}%`;
    });
  }

  // Bind Simulator Route Button clicks
  routeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      routeBtns.forEach(b => b.classList.remove('active'));
      const activeBtn = e.currentTarget;
      activeBtn.classList.add('active');
      
      currentRoute = activeBtn.getAttribute('data-route');
      updateSimulation();
    });
  });

  // Bind Simulator Scenario Button clicks
  scenarioBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      scenarioBtns.forEach(b => b.classList.remove('active'));
      const activeBtn = e.currentTarget;
      activeBtn.classList.add('active');
      
      currentScenario = activeBtn.getAttribute('data-scenario');
      updateSimulation();
    });
  });

  // Initial Simulator Run
  updateSimulation();


  // WAITLIST FLOW & BROWSER LOCAL STORAGE PERSISTENCE
  const heroForm = document.getElementById('hero-waitlist-form');
  const ctaForm = document.getElementById('cta-waitlist-form');
  const heroTicket = document.getElementById('hero-ticket');
  const ctaTicket = document.getElementById('cta-ticket');

  // Load ticket details from LocalStorage if they already exist
  function checkSavedWaitlist() {
    const savedEmail = localStorage.getItem('pegtime_waitlist_email');
    const savedTicket = localStorage.getItem('pegtime_waitlist_num');
    const savedPos = localStorage.getItem('pegtime_waitlist_pos');

    if (savedEmail && savedTicket && savedPos) {
      // Hide hero form and show saved ticket
      heroForm.style.display = 'none';
      heroTicket.style.display = 'block';
      document.getElementById('hero-ticket-number').textContent = savedTicket;
      document.getElementById('hero-ticket-pos').textContent = `#${savedPos}`;

      // Hide footer form and show saved ticket
      ctaForm.style.display = 'none';
      ctaTicket.style.display = 'block';
      document.getElementById('cta-ticket-number').textContent = savedTicket;
      document.getElementById('cta-ticket-pos').textContent = `#${savedPos}`;
    }
  }

  // Handle new submission
  function handleFormSubmit(e, formType) {
    e.preventDefault();
    const form = e.currentTarget;
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput.value.trim();
    const successMsg = form.querySelector('.form-msg.success');
    const errorMsg = form.querySelector('.form-msg.error');
    const submitBtn = form.querySelector('button');

    // Simple email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      errorMsg.style.display = 'flex';
      successMsg.style.display = 'none';
      return;
    }

    // Hide error
    errorMsg.style.display = 'none';
    
    // Simulate submission spinner state
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `
      <svg class="spinner" width="16" height="16" viewBox="0 0 50 50" style="animation: spin 1s linear infinite;">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="80, 200"></circle>
      </svg>
    `;

    setTimeout(() => {
      // Calculate dynamic positions & ticket IDs
      const posNumber = Math.floor(Math.random() * 20) + 420;
      const ticketId = `PEG-${Math.floor(1000 + Math.random() * 9000)}`;

      // Save to localStorage
      localStorage.setItem('pegtime_waitlist_email', email);
      localStorage.setItem('pegtime_waitlist_num', ticketId);
      localStorage.setItem('pegtime_waitlist_pos', posNumber);

      // Hide form & show ticket with transition animations
      form.style.opacity = '0';
      
      setTimeout(() => {
        form.style.display = 'none';
        
        if (formType === 'hero') {
          heroTicket.style.display = 'block';
          document.getElementById('hero-ticket-number').textContent = ticketId;
          document.getElementById('hero-ticket-pos').textContent = `#${posNumber}`;
          
          // Sync with CTA ticket as well
          ctaForm.style.display = 'none';
          ctaTicket.style.display = 'block';
          document.getElementById('cta-ticket-number').textContent = ticketId;
          document.getElementById('cta-ticket-pos').textContent = `#${posNumber}`;
        } else {
          ctaTicket.style.display = 'block';
          document.getElementById('cta-ticket-number').textContent = ticketId;
          document.getElementById('cta-ticket-pos').textContent = `#${posNumber}`;
          
          // Sync with Hero ticket as well
          heroForm.style.display = 'none';
          heroTicket.style.display = 'block';
          document.getElementById('hero-ticket-number').textContent = ticketId;
          document.getElementById('hero-ticket-pos').textContent = `#${posNumber}`;
        }
      }, 300);

    }, 1200);
  }

  // Bind both form submits
  if (heroForm) {
    heroForm.addEventListener('submit', (e) => handleFormSubmit(e, 'hero'));
  }
  if (ctaForm) {
    ctaForm.addEventListener('submit', (e) => handleFormSubmit(e, 'cta'));
  }

  // Initial check
  checkSavedWaitlist();


  // ANIMATED TICKER TICKING (Simulation of live Winnipeg riders joining queue!)
  const signupCountSpan = document.querySelector('.avatar-text strong');
  if (signupCountSpan) {
    let totalSignups = 422;
    setInterval(() => {
      // Randomly increment by 1 or 2 riders every 10-18 seconds
      const delay = Math.random() * 8000 + 10000;
      setTimeout(() => {
        totalSignups += Math.floor(Math.random() * 2) + 1;
        signupCountSpan.textContent = `${totalSignups}+ Winnipeggers`;
      }, delay);
    }, 15000);
  }


  // SCROLL REVEAL ANIMATIONS (Intersection Observer)
  const observerOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: "0px"
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Apply reveal triggers to panels
  const revealElements = [
    document.querySelector('.estimator-box'),
    document.querySelector('.steps-grid'),
    document.querySelector('.table-container'),
    document.querySelector('.cta-box')
  ];

  revealElements.forEach(el => {
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
      revealObserver.observe(el);
    }
  });

});

// Spinner dynamic keyframe insertion for JS spin loaders
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
