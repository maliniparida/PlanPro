/* =========================================================
   PLANPRO
   Main Application JavaScript
   ========================================================= */

"use strict";

/* =========================================================
   STORAGE KEYS
   ========================================================= */

const STORAGE = {
    events: "planpro_events",
    registrations: "planpro_registrations",
    resources: "planpro_resources",
    vendors: "planpro_vendors",
    expenses: "planpro_expenses",
    sponsorships: "planpro_sponsorships",
    approvals: "planpro_approvals",
    alerts: "planpro_alerts",
    activities: "planpro_activities",
    settings: "planpro_settings",
    loggedIn: "planpro_logged_in"
};

/* =========================================================
   APPLICATION STATE
   ========================================================= */

let events = [];
let registrations = [];
let resources = [];
let vendors = [];
let expenses = [];
let sponsorships = [];
let approvals = [];
let alerts = [];
let activities = [];

let settings = {
    organizerName: "Administrator",
    email: "admin@example.com",
    urgentAlerts: true,
    reminders: true,
    activityNotifications: true,
    alarmEnabled: true
};

let currentAlarmAlert = null;
let alarmAudioContext = null;
let alarmInterval = null;

/* =========================================================
   DOM HELPER
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function $all(selector) {
    return document.querySelectorAll(selector);
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    initializeApplication();
});

function initializeApplication() {
    setupLogin();
    setupNavigation();
    setupModals();
    setupForms();
    setupButtons();
    setupSearchAndFilters();
    setupAlertSystem();
    setupSettings();
    setupNotificationPanel();

    renderAll();

    if (localStorage.getItem(STORAGE.loggedIn) === "true") {
        showApplication();
    } else {
        showLogin();
    }
}

/* =========================================================
   STORAGE
   ========================================================= */

function loadData() {
    events = readStorage(STORAGE.events, []);
    registrations = readStorage(STORAGE.registrations, []);
    resources = readStorage(STORAGE.resources, []);
    vendors = readStorage(STORAGE.vendors, []);
    expenses = readStorage(STORAGE.expenses, []);
    sponsorships = readStorage(STORAGE.sponsorships, []);
    approvals = readStorage(STORAGE.approvals, []);
    alerts = readStorage(STORAGE.alerts, []);
    activities = readStorage(STORAGE.activities, []);
    settings = {
        ...settings,
        ...readStorage(STORAGE.settings, {})
    };

    if (!events.length) {
        seedDemoData(false);
    }
}

function readStorage(key, fallback) {
    try {
        const data = localStorage.getItem(key);

        if (!data) {
            return fallback;
        }

        return JSON.parse(data);
    } catch (error) {
        console.error("Storage read error:", error);
        return fallback;
    }
}

function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function saveAll() {
    writeStorage(STORAGE.events, events);
    writeStorage(STORAGE.registrations, registrations);
    writeStorage(STORAGE.resources, resources);
    writeStorage(STORAGE.vendors, vendors);
    writeStorage(STORAGE.expenses, expenses);
    writeStorage(STORAGE.sponsorships, sponsorships);
    writeStorage(STORAGE.approvals, approvals);
    writeStorage(STORAGE.alerts, alerts);
    writeStorage(STORAGE.activities, activities);
    writeStorage(STORAGE.settings, settings);
}

/* =========================================================
   LOGIN
   ========================================================= */

function setupLogin() {
    const form = $("loginForm");

    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const username = $("loginUsername").value.trim();
        const password = $("loginPassword").value;

        if (!username || !password) {
            showLoginError("Please enter your username and password.");
            return;
        }

        /*
         * Frontend demo authentication.
         * Any non-empty username/password is accepted.
         */
        localStorage.setItem(STORAGE.loggedIn, "true");

        settings.organizerName = username;
        saveAll();

        $("topbarUsername").textContent = username;
        $("welcomeUsername").textContent = username;
        $("settingsName").value = username;

        showApplication();

        showToast(
            "success",
            "Login successful",
            "Welcome to PlanPro."
        );
    });

    const toggle = $("togglePassword");

    if (toggle) {
        toggle.addEventListener("click", () => {
            const input = $("loginPassword");

            if (input.type === "password") {
                input.type = "text";
                toggle.textContent = "🙈";
            } else {
                input.type = "password";
                toggle.textContent = "👁";
            }
        });
    }
}

function showLoginError(message) {
    const error = $("loginError");

    if (error) {
        error.textContent = message;
    }
}

function showLogin() {
    $("loginScreen")?.classList.remove("hidden");
    $("appShell")?.classList.add("hidden");
}

function showApplication() {
    $("loginScreen")?.classList.add("hidden");
    $("appShell")?.classList.remove("hidden");

    updateUserDisplay();
    renderAll();
}

function updateUserDisplay() {
    const name =
        settings.organizerName ||
        $("loginUsername")?.value ||
        "Administrator";

    if ($("topbarUsername")) {
        $("topbarUsername").textContent = name;
    }

    if ($("welcomeUsername")) {
        $("welcomeUsername").textContent = name;
    }

    if ($("settingsName")) {
        $("settingsName").value = name;
    }

    const avatar = document.querySelector(".user-avatar");

    if (avatar) {
        avatar.textContent =
            name.charAt(0).toUpperCase();
    }
}

/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {
    stopAlarm();

    localStorage.removeItem(STORAGE.loggedIn);

    showLogin();

    $("loginPassword").value = "";
    $("loginError").textContent = "";

    showToast(
        "success",
        "Logged out",
        "You have been logged out of PlanPro."
    );
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {
    $all(".nav-link[data-section]").forEach(button => {
        button.addEventListener("click", () => {
            navigateTo(button.dataset.section);
        });
    });

    $all("[data-section-link]").forEach(button => {
        button.addEventListener("click", () => {
            navigateTo(button.dataset.sectionLink);
        });
    });

    $("mobileMenuBtn")?.addEventListener("click", () => {
        $("sidebar")?.classList.add("open");
    });

    $("closeSidebar")?.addEventListener("click", () => {
        $("sidebar")?.classList.remove("open");
    });

    $("topAlertButton")?.addEventListener("click", () => {
        navigateTo("alerts");
    });

    $("logoutButton")?.addEventListener("click", logout);
}

function navigateTo(sectionName) {
    $all(".content-section").forEach(section => {
        section.classList.remove("active");
    });

    const target = $(`section-${sectionName}`);

    if (!target) return;

    target.classList.add("active");

    $all(".nav-link[data-section]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.section === sectionName
        );
    });

    const title =
        target.dataset.title ||
        sectionName;

    if ($("currentPageTitle")) {
        $("currentPageTitle").textContent = title;
    }

    $("sidebar")?.classList.remove("open");

    if (sectionName === "analytics") {
        setTimeout(renderCharts, 100);
    }

    if (sectionName === "reports") {
        populateEventSelects();
    }
}

/* =========================================================
   MODALS
   ========================================================= */

function setupModals() {
    $all("[data-open-modal]").forEach(button => {
        button.addEventListener("click", () => {
            openModal(button.dataset.openModal);
        });
    });

    $all("[data-close-modal]").forEach(button => {
        button.addEventListener("click", () => {
            closeModal(button.dataset.closeModal);
        });
    });

    $all(".modal-overlay").forEach(overlay => {
        overlay.addEventListener("click", event => {
            if (event.target === overlay) {
                overlay.classList.add("hidden");
            }
        });
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            $all(".modal-overlay").forEach(modal => {
                modal.classList.add("hidden");
            });
        }
    });
}

function openModal(id) {
    const modal = $(id);

    if (!modal) return;

    populateEventSelects();

    modal.classList.remove("hidden");
}

function closeModal(id) {
    $(id)?.classList.add("hidden");
}

/* =========================================================
   BUTTONS
   ========================================================= */

function setupButtons() {
    $("dashboardAlertButton")?.addEventListener(
        "click",
        openUrgentAlertModal
    );

    $("sendUrgentAlertButton")?.addEventListener(
        "click",
        openUrgentAlertModal
    );

    $("turnOffAlarmButton")?.addEventListener(
        "click",
        turnOffAlarm
    );

    $("dashboardViewAlert")?.addEventListener(
        "click",
        () => navigateTo("alerts")
    );

    $("clearResolvedAlerts")?.addEventListener(
        "click",
        clearResolvedAlerts
    );

    $("generateReportButton")?.addEventListener(
        "click",
        generateReport
    );

    $("exportCsvButton")?.addEventListener(
        "click",
        exportCSV
    );

    $("runTestsButton")?.addEventListener(
        "click",
        runSystemTests
    );

    $("seedDemoDataButton")?.addEventListener(
        "click",
        () => {
            seedDemoData(true);
            renderAll();

            showToast(
                "success",
                "Demo data loaded",
                "Sample platform data is ready."
            );
        }
    );

    $("clearAllDataButton")?.addEventListener(
        "click",
        clearAllData
    );

    $("printTicketButton")?.addEventListener(
        "click",
        () => window.print()
    );
}

/* =========================================================
   FORM SETUP
   ========================================================= */

function setupForms() {
    $("eventForm")?.addEventListener(
        "submit",
        handleEventSubmit
    );

    $("registrationForm")?.addEventListener(
        "submit",
        handleRegistrationSubmit
    );

    $("resourceForm")?.addEventListener(
        "submit",
        handleResourceSubmit
    );

    $("vendorForm")?.addEventListener(
        "submit",
        handleVendorSubmit
    );

    $("expenseForm")?.addEventListener(
        "submit",
        handleExpenseSubmit
    );

    $("sponsorshipForm")?.addEventListener(
        "submit",
        handleSponsorshipSubmit
    );

    $("approvalForm")?.addEventListener(
        "submit",
        handleApprovalSubmit
    );

    $("urgentAlertForm")?.addEventListener(
        "submit",
        handleUrgentAlertSubmit
    );
}

/* =========================================================
   EVENT MANAGEMENT
   ========================================================= */

function handleEventSubmit(event) {
    event.preventDefault();

    const id =
        $("eventId").value ||
        generateId("EV");

    const name =
        $("eventName").value.trim();

    const date =
        $("eventDate").value;

    const time =
        $("eventTime").value;

    const venue =
        $("eventVenue").value.trim();

    const capacity =
        Number($("eventCapacity").value);

    const budget =
        Number($("eventBudget").value);

    const status =
        $("eventStatus").value;

    const description =
        $("eventDescription").value.trim();

    if (!name || !date || !time || !venue) {
        showToast(
            "error",
            "Missing information",
            "Please complete all required event fields."
        );
        return;
    }

    if (capacity <= 0 || budget < 0) {
        showToast(
            "error",
            "Invalid values",
            "Capacity must be positive and budget cannot be negative."
        );
        return;
    }

    const duplicateVenue = events.some(item => {
        return (
            item.id !== id &&
            item.date === date &&
            item.time === time &&
            item.venue.toLowerCase() === venue.toLowerCase()
        );
    });

    if (duplicateVenue) {
        showToast(
            "warning",
            "Scheduling conflict",
            "Another event is already scheduled at this venue and time."
        );
        return;
    }

    const existingIndex =
        events.findIndex(item => item.id === id);

    const eventData = {
        id,
        name,
        date,
        time,
        venue,
        capacity,
        budget,
        status,
        description,
        createdAt:
            existingIndex >= 0
                ? events[existingIndex].createdAt
                : new Date().toISOString()
    };

    if (existingIndex >= 0) {
        events[existingIndex] = eventData;

        addActivity(
            "Event updated",
            `${name} was updated.`
        );
    } else {
        events.push(eventData);

        addActivity(
            "Event created",
            `${name} was added to PlanPro.`
        );
    }

    saveAll();

    $("eventForm").reset();
    $("eventId").value = "";

    closeModal("eventModal");

    renderAll();

    showToast(
        "success",
        "Event saved",
        `${name} has been saved successfully.`
    );
}

function editEvent(id) {
    const event = events.find(item => item.id === id);

    if (!event) return;

    $("eventId").value = event.id;
    $("eventName").value = event.name;
    $("eventDate").value = event.date;
    $("eventTime").value = event.time;
    $("eventVenue").value = event.venue;
    $("eventCapacity").value = event.capacity;
    $("eventBudget").value = event.budget;
    $("eventStatus").value = event.status;
    $("eventDescription").value = event.description || "";

    $("eventModalTitle").textContent =
        "Edit Event";

    openModal("eventModal");
}

function deleteEvent(id) {
    const event = events.find(item => item.id === id);

    if (!event) return;

    const confirmed = confirm(
        `Delete "${event.name}"?`
    );

    if (!confirmed) return;

    events = events.filter(item => item.id !== id);

    registrations = registrations.filter(
        item => item.eventId !== id
    );

    resources = resources.filter(
        item => item.eventId !== id
    );

    expenses = expenses.filter(
        item => item.eventId !== id
    );

    sponsorships = sponsorships.filter(
        item => item.eventId !== id
    );

    approvals = approvals.filter(
        item => item.eventId !== id
    );

    vendors = vendors.map(vendor => {
        if (vendor.eventId === id) {
            return {
                ...vendor,
                eventId: "",
                availability: "available"
            };
        }

        return vendor;
    });

    saveAll();

    addActivity(
        "Event deleted",
        `${event.name} was removed.`
    );

    renderAll();

    showToast(
        "success",
        "Event deleted",
        "The event and related demo records were removed."
    );
}

/* =========================================================
   REGISTRATION MANAGEMENT
   ========================================================= */

function handleRegistrationSubmit(event) {
    event.preventDefault();

    const eventId =
        $("registrationEvent").value;

    const selectedEvent =
        events.find(item => item.id === eventId);

    if (!selectedEvent) {
        showToast(
            "error",
            "Select an event",
            "Please select an existing event."
        );
        return;
    }

    const currentCount =
        registrations.filter(
            item =>
                item.eventId === eventId &&
                item.status !== "cancelled"
        ).length;

    if (currentCount >= selectedEvent.capacity) {
        showToast(
            "error",
            "Event capacity reached",
            "No more registrations can be accepted."
        );
        return;
    }

    const name =
        $("attendeeName").value.trim();

    const email =
        $("attendeeEmail").value.trim();

    const phone =
        $("attendeePhone").value.trim();

    if (!name || !email) {
        showToast(
            "error",
            "Missing information",
            "Name and email are required."
        );
        return;
    }

    const registration = {
        id: generateId("REG"),
        ticketId: generateTicketId(),
        eventId,
        name,
        email,
        phone,
        status: "registered",
        registeredAt:
            new Date().toISOString()
    };

    registrations.push(registration);

    saveAll();

    addActivity(
        "New registration",
        `${name} registered for ${selectedEvent.name}.`
    );

    $("registrationForm").reset();

    closeModal("registrationModal");

    renderAll();

    showTicket(registration);

    showToast(
        "success",
        "Registration completed",
        "A digital ticket has been generated."
    );
}

function checkInRegistration(id) {
    const registration =
        registrations.find(item => item.id === id);

    if (!registration) return;

    if (
        registration.status === "checked-in"
    ) {
        showToast(
            "warning",
            "Already checked in",
            "This ticket has already been checked in."
        );
        return;
    }

    if (
        registration.status === "cancelled"
    ) {
        showToast(
            "error",
            "Invalid ticket",
            "Cancelled tickets cannot be checked in."
        );
        return;
    }

    const eventRegistrations =
        registrations.filter(
            item =>
                item.eventId === registration.eventId &&
                item.status === "checked-in"
        );

    const selectedEvent =
        events.find(
            item =>
                item.id === registration.eventId
        );

    if (
        selectedEvent &&
        eventRegistrations.length >= selectedEvent.capacity
    ) {
        showToast(
            "error",
            "Capacity exceeded",
            "The event capacity has been reached."
        );
        return;
    }

    registration.status = "checked-in";
    registration.checkedInAt =
        new Date().toISOString();

    saveAll();

    addActivity(
        "Attendee checked in",
        `${registration.name} checked in successfully.`
    );

    renderAll();

    showToast(
        "success",
        "Check-in successful",
        `${registration.name} is now checked in.`
    );
}

function cancelRegistration(id) {
    const registration =
        registrations.find(item => item.id === id);

    if (!registration) return;

    registration.status = "cancelled";

    saveAll();

    renderAll();

    showToast(
        "success",
        "Registration cancelled",
        `${registration.name}'s registration was cancelled.`
    );
}

function showTicket(registration) {
    const event =
        events.find(
            item =>
                item.id === registration.eventId
        );

    if (!event) return;

    $("ticketContent").innerHTML = `
        <div class="ticket-card">

            <div class="ticket-brand">
                <strong>PLANPRO</strong>
                <span class="ticket-id">
                    ${escapeHtml(registration.ticketId)}
                </span>
            </div>

            <div class="ticket-person">
                <h3>
                    ${escapeHtml(registration.name)}
                </h3>

                <p>
                    ${escapeHtml(registration.email)}
                </p>
            </div>

            <div class="ticket-details">

                <div class="ticket-detail">
                    <span>Event</span>
                    <strong>
                        ${escapeHtml(event.name)}
                    </strong>
                </div>

                <div class="ticket-detail">
                    <span>Date</span>
                    <strong>
                        ${formatDate(event.date)}
                    </strong>
                </div>

                <div class="ticket-detail">
                    <span>Venue</span>
                    <strong>
                        ${escapeHtml(event.venue)}
                    </strong>
                </div>

                <div class="ticket-detail">
                    <span>Ticket</span>
                    <strong>
                        ${escapeHtml(registration.ticketId)}
                    </strong>
                </div>

            </div>

        </div>
    `;

    openModal("ticketModal");
}

/* =========================================================
   RESOURCE MANAGEMENT
   ========================================================= */

function handleResourceSubmit(event) {
    event.preventDefault();

    const eventId =
        $("resourceEvent").value;

    const selectedEvent =
        events.find(item => item.id === eventId);

    if (!selectedEvent) {
        showToast(
            "error",
            "Invalid event",
            "Select a valid event."
        );
        return;
    }

    const name =
        $("resourceName").value.trim();

    const required =
        Number($("resourceRequired").value);

    const available =
        Number($("resourceAvailable").value);

    const type =
        $("resourceType").value;

    if (
        !name ||
        required < 0 ||
        available < 0
    ) {
        showToast(
            "error",
            "Invalid resource values",
            "Resource quantities cannot be negative."
        );
        return;
    }

    resources.push({
        id: generateId("RES"),
        eventId,
        name,
        required,
        available,
        type,
        createdAt:
            new Date().toISOString()
    });

    saveAll();

    addActivity(
        "Resource added",
        `${name} was planned for ${selectedEvent.name}.`
    );

    $("resourceForm").reset();
    closeModal("resourceModal");

    renderAll();

    showToast(
        "success",
        "Resource saved",
        "Resource coordination information has been updated."
    );
}

function deleteResource(id) {
    resources =
        resources.filter(item => item.id !== id);

    saveAll();
    renderAll();

    showToast(
        "success",
        "Resource removed",
        "The resource record was removed."
    );
}

/* =========================================================
   VENDOR MANAGEMENT
   ========================================================= */

function handleVendorSubmit(event) {
    event.preventDefault();

    const name =
        $("vendorName").value.trim();

    const service =
        $("vendorService").value.trim();

    const phone =
        $("vendorPhone").value.trim();

    const email =
        $("vendorEmail").value.trim();

    const availability =
        $("vendorAvailability").value;

    const eventId =
        $("vendorEvent").value;

    if (!name || !service) {
        showToast(
            "error",
            "Missing information",
            "Vendor name and service are required."
        );
        return;
    }

    if (eventId) {
        const conflict =
            vendors.some(
                vendor =>
                    vendor.eventId === eventId &&
                    vendor.email === email &&
                    email
            );

        if (conflict) {
            showToast(
                "warning",
                "Vendor conflict",
                "This vendor is already assigned to the selected event."
            );
            return;
        }
    }

    vendors.push({
        id: generateId("VEN"),
        name,
        service,
        phone,
        email,
        availability:
            eventId
                ? "assigned"
                : availability,
        eventId,
        createdAt:
            new Date().toISOString()
    });

    saveAll();

    addActivity(
        "Vendor added",
        `${name} was added as a ${service} provider.`
    );

    $("vendorForm").reset();
    closeModal("vendorModal");

    renderAll();

    showToast(
        "success",
        "Vendor saved",
        `${name} has been added.`
    );
}

function assignVendor(id) {
    const vendor =
        vendors.find(item => item.id === id);

    if (!vendor) return;

    const eventId =
        prompt(
            "Enter the Event ID to assign this vendor:"
        );

    if (!eventId) return;

    const event =
        events.find(item => item.id === eventId);

    if (!event) {
        showToast(
            "error",
            "Event not found",
            "Enter a valid event ID."
        );
        return;
    }

    vendor.eventId = eventId;
    vendor.availability = "assigned";

    saveAll();
    renderAll();

    showToast(
        "success",
        "Vendor assigned",
        `${vendor.name} is assigned to ${event.name}.`
    );
}

function unassignVendor(id) {
    const vendor =
        vendors.find(item => item.id === id);

    if (!vendor) return;

    vendor.eventId = "";
    vendor.availability = "available";

    saveAll();
    renderAll();

    showToast(
        "success",
        "Vendor unassigned",
        `${vendor.name} is available again.`
    );
}

function deleteVendor(id) {
    vendors =
        vendors.filter(item => item.id !== id);

    saveAll();
    renderAll();

    showToast(
        "success",
        "Vendor removed",
        "Vendor information was removed."
    );
}

/* =========================================================
   EXPENSE MANAGEMENT
   ========================================================= */

function handleExpenseSubmit(event) {
    event.preventDefault();

    const eventId =
        $("expenseEvent").value;

    const selectedEvent =
        events.find(item => item.id === eventId);

    const amount =
        Number($("expenseAmount").value);

    if (!selectedEvent) {
        showToast(
            "error",
            "Invalid event",
            "Please select a valid event."
        );
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        showToast(
            "error",
            "Invalid expense",
            "Expense amount must be greater than zero."
        );
        return;
    }

    const expense = {
        id: generateId("EXP"),
        eventId,
        category:
            $("expenseCategory").value,
        description:
            $("expenseDescription").value.trim(),
        amount,
        date:
            $("expenseDate").value ||
            getToday()
    };

    expenses.push(expense);

    saveAll();

    addActivity(
        "Expense recorded",
        `${formatCurrency(amount)} recorded for ${selectedEvent.name}.`
    );

    $("expenseForm").reset();

    closeModal("expenseModal");

    renderAll();

    showToast(
        "success",
        "Expense saved",
        "The expense was recorded successfully."
    );
}

function deleteExpense(id) {
    expenses =
        expenses.filter(item => item.id !== id);

    saveAll();
    renderAll();

    showToast(
        "success",
        "Expense removed",
        "The expense record was removed."
    );
}

/* =========================================================
   SPONSORSHIP
   ========================================================= */

function handleSponsorshipSubmit(event) {
    event.preventDefault();

    const eventId =
        $("sponsorEvent").value;

    const selectedEvent =
        events.find(item => item.id === eventId);

    const amount =
        Number($("sponsorAmount").value);

    const sponsor =
        $("sponsorName").value.trim();

    if (!selectedEvent || !sponsor) {
        showToast(
            "error",
            "Missing information",
            "Event and sponsor are required."
        );
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        showToast(
            "error",
            "Invalid sponsorship",
            "Sponsorship amount must be greater than zero."
        );
        return;
    }

    sponsorships.push({
        id: generateId("SPO"),
        eventId,
        sponsor,
        amount,
        date:
            $("sponsorDate").value ||
            getToday()
    });

    saveAll();

    addActivity(
        "Sponsorship received",
        `${formatCurrency(amount)} received from ${sponsor}.`
    );

    $("sponsorshipForm").reset();

    closeModal("sponsorshipModal");

    renderAll();

    showToast(
        "success",
        "Sponsorship saved",
        "The sponsorship record was added."
    );
}

function deleteSponsorship(id) {
    sponsorships =
        sponsorships.filter(
            item => item.id !== id
        );

    saveAll();
    renderAll();

    showToast(
        "success",
        "Sponsorship removed",
        "The sponsorship record was removed."
    );
}

/* =========================================================
   APPROVALS
   ========================================================= */

function handleApprovalSubmit(event) {
    event.preventDefault();

    const eventId =
        $("approvalEvent").value;

    const selectedEvent =
        events.find(item => item.id === eventId);

    if (!selectedEvent) {
        showToast(
            "error",
            "Invalid event",
            "Select an event."
        );
        return;
    }

    const request =
        $("approvalRequest").value.trim();

    if (!request) {
        showToast(
            "error",
            "Missing request",
            "Please enter an approval request."
        );
        return;
    }

    approvals.push({
        id: generateId("APP"),
        request,
        eventId,
        requester:
            $("approvalRequester").value.trim() ||
            settings.organizerName,
        amount:
            Number($("approvalAmount").value) || 0,
        date: getToday(),
        status: "pending"
    });

    saveAll();

    addActivity(
        "Approval requested",
        `${request} was submitted for review.`
    );

    $("approvalForm").reset();

    closeModal("approvalModal");

    renderAll();

    showToast(
        "success",
        "Approval submitted",
        "The request is now pending."
    );
}

function updateApproval(id, status) {
    const approval =
        approvals.find(item => item.id === id);

    if (!approval) return;

    approval.status = status;

    saveAll();

    addActivity(
        "Approval updated",
        `${approval.request} is now ${status}.`
    );

    renderAll();

    showToast(
        status === "approved"
            ? "success"
            : "warning",
        "Approval updated",
        `Request marked as ${status}.`
    );
}

/* =========================================================
   URGENT ALERT SYSTEM
   ========================================================= */

function setupAlertSystem() {
    $("cancelUrgentAlert")?.addEventListener(
        "click",
        () => closeModal("urgentAlertModal")
    );

    $("closeUrgentAlertModal")?.addEventListener(
        "click",
        () => closeModal("urgentAlertModal")
    );

    $("alertMessage")?.addEventListener(
        "input",
        updateAlertCharacterCount
    );

    $("alarmEnabled")?.addEventListener(
        "change",
        event => {
            settings.alarmEnabled =
                event.target.checked;

            saveAll();
        }
    );
}

function openUrgentAlertModal() {
    populateEventSelects();

    $("urgentAlertModal")?.classList.remove(
        "hidden"
    );
}

function updateAlertCharacterCount() {
    const message =
        $("alertMessage")?.value || "";

    if ($("alertCharacterCount")) {
        $("alertCharacterCount").textContent =
            message.length;
    }
}

function handleUrgentAlertSubmit(event) {
    event.preventDefault();

    const recipient =
        $("alertRecipient").value;

    const eventId =
        $("alertEvent").value;

    const message =
        $("alertMessage").value.trim();

    if (!message) {
        showToast(
            "error",
            "Message required",
            "Enter an urgent message."
        );
        return;
    }

    const alertRecord = {
        id: generateId("ALT"),
        recipient,
        eventId,
        message,
        createdAt:
            new Date().toISOString(),
        status: "active"
    };

    alerts.unshift(alertRecord);

    addActivity(
        "Urgent alert sent",
        `Alert sent to ${recipient}.`
    );

    saveAll();

    $("urgentAlertForm").reset();
    updateAlertCharacterCount();

    closeModal("urgentAlertModal");

    renderAll();

    showToast(
        "error",
        "Urgent alert sent",
        "Recipients have been notified."
    );

    if (settings.alarmEnabled) {
        showAlarm(alertRecord);
    }
}

function showAlarm(alertRecord) {
    currentAlarmAlert = alertRecord;

    $("alarmMessage").textContent =
        alertRecord.message;

    $("alarmRecipient").textContent =
        alertRecord.recipient;

    $("alarmTime").textContent =
        formatTime(alertRecord.createdAt);

    $("urgentAlertOverlay")?.classList.remove(
        "hidden"
    );

    startAlarm();
}

function startAlarm() {
    stopAlarmAudioOnly();

    try {
        alarmAudioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

        playAlarmTone();

        alarmInterval =
            setInterval(
                playAlarmTone,
                1300
            );

    } catch (error) {
        console.warn(
            "Audio alarm unavailable:",
            error
        );
    }
}

function playAlarmTone() {
    if (!alarmAudioContext) return;

    const oscillator =
        alarmAudioContext.createOscillator();

    const gain =
        alarmAudioContext.createGain();

    oscillator.type = "square";

    oscillator.frequency.setValueAtTime(
        760,
        alarmAudioContext.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
        480,
        alarmAudioContext.currentTime + 0.35
    );

    gain.gain.setValueAtTime(
        0.0001,
        alarmAudioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.22,
        alarmAudioContext.currentTime + 0.03
    );

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        alarmAudioContext.currentTime + 0.4
    );

    oscillator.connect(gain);
    gain.connect(alarmAudioContext.destination);

    oscillator.start();

    oscillator.stop(
        alarmAudioContext.currentTime + 0.45
    );
}

function stopAlarmAudioOnly() {
    if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
    }

    if (alarmAudioContext) {
        try {
            alarmAudioContext.close();
        } catch (error) {}

        alarmAudioContext = null;
    }
}

function stopAlarm() {
    stopAlarmAudioOnly();

    $("urgentAlertOverlay")?.classList.add(
        "hidden"
    );

    currentAlarmAlert = null;
}

function turnOffAlarm() {
    if (currentAlarmAlert) {
        const alertRecord =
            alerts.find(
                item =>
                    item.id === currentAlarmAlert.id
            );

        if (alertRecord) {
            alertRecord.status = "resolved";
            alertRecord.resolvedAt =
                new Date().toISOString();
        }

        saveAll();

        addActivity(
            "Urgent alert resolved",
            "The emergency alarm was turned off."
        );

        renderAll();
    }

    stopAlarm();

    showToast(
        "success",
        "Alarm turned off",
        "The urgent alert has been acknowledged."
    );
}

function clearResolvedAlerts() {
    alerts =
        alerts.filter(
            alert => alert.status !== "resolved"
        );

    saveAll();
    renderAll();

    showToast(
        "success",
        "Alerts cleared",
        "Resolved alerts were removed from history."
    );
}

/* =========================================================
   SEARCH AND FILTERS
   ========================================================= */

function setupSearchAndFilters() {
    $("eventSearch")?.addEventListener(
        "input",
        renderEvents
    );

    $("eventStatusFilter")?.addEventListener(
        "change",
        renderEvents
    );

    $("registrationSearch")?.addEventListener(
        "input",
        renderRegistrations
    );

    $("registrationEventFilter")?.addEventListener(
        "change",
        renderRegistrations
    );

    $("registrationStatusFilter")?.addEventListener(
        "change",
        renderRegistrations
    );

    $("vendorSearch")?.addEventListener(
        "input",
        renderVendors
    );

    $("vendorAvailabilityFilter")?.addEventListener(
        "change",
        renderVendors
    );
}

/* =========================================================
   SETTINGS
   ========================================================= */

function setupSettings() {
    $("profileSettingsForm")?.addEventListener(
        "submit",
        event => {
            event.preventDefault();

            settings.organizerName =
                $("settingsName").value.trim() ||
                "Administrator";

            settings.email =
                $("settingsEmail").value.trim();

            saveAll();
            updateUserDisplay();

            showToast(
                "success",
                "Profile saved",
                "Organizer information has been updated."
            );
        }
    );

    $("settingUrgentAlerts")?.addEventListener(
        "change",
        event => {
            settings.urgentAlerts =
                event.target.checked;

            saveAll();
        }
    );

    $("settingReminders")?.addEventListener(
        "change",
        event => {
            settings.reminders =
                event.target.checked;

            saveAll();
        }
    );

    $("settingActivity")?.addEventListener(
        "change",
        event => {
            settings.activityNotifications =
                event.target.checked;

            saveAll();
        }
    );
}

/* =========================================================
   NOTIFICATION PANEL
   ========================================================= */

function setupNotificationPanel() {
    $("closeNotificationPanel")?.addEventListener(
        "click",
        () => {
            $("notificationPanel")?.classList.add(
                "hidden"
            );
        }
    );
}

/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll() {
    populateEventSelects();

    renderDashboard();
    renderEvents();
    renderRegistrations();
    renderResources();
    renderVendors();
    renderBudget();
    renderSponsorship();
    renderApprovals();
    renderAlerts();
    renderAnalytics();
    renderReportsDefaults();
    renderTestingDefaults();
    renderSettings();

    updateAlertCounters();
    renderNotificationList();
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {
    const totalRegistrations =
        registrations.length;

    const checkedIn =
        registrations.filter(
            item =>
                item.status === "checked-in"
        ).length;

    const attendanceRate =
        totalRegistrations
            ? (checkedIn / totalRegistrations) * 100
            : 0;

    const totalBudget =
        sum(
            events,
            item => Number(item.budget) || 0
        );

    const totalExpenses =
        sum(
            expenses,
            item => Number(item.amount) || 0
        );

    const totalSponsorship =
        sum(
            sponsorships,
            item => Number(item.amount) || 0
        );

    const balance =
        totalBudget +
        totalSponsorship -
        totalExpenses;

    setText(
        "kpiTotalEvents",
        events.length
    );

    setText(
        "kpiTotalRegistrations",
        totalRegistrations
    );

    setText(
        "kpiCheckedIn",
        checkedIn
    );

    setText(
        "kpiAttendanceRate",
        `${attendanceRate.toFixed(1)}%`
    );

    setText(
        "kpiTotalBudget",
        formatCurrency(totalBudget)
    );

    setText(
        "kpiTotalExpenses",
        formatCurrency(totalExpenses)
    );

    setText(
        "kpiTotalSponsorship",
        formatCurrency(totalSponsorship)
    );

    setText(
        "kpiBalance",
        formatCurrency(balance)
    );

    setText(
        "dashboardBudget",
        formatCurrency(totalBudget)
    );

    setText(
        "dashboardExpenses",
        formatCurrency(totalExpenses)
    );

    setText(
        "dashboardSponsorship",
        formatCurrency(totalSponsorship)
    );

    const budgetPercent =
        totalBudget
            ? Math.min(
                100,
                (totalExpenses / totalBudget) * 100
            )
            : 0;

    setText(
        "dashboardBudgetPercent",
        `${budgetPercent.toFixed(1)}%`
    );

    if ($("dashboardBudgetProgress")) {
        $("dashboardBudgetProgress").style.width =
            `${budgetPercent}%`;
    }

    renderDashboardEvents();
    renderDashboardResources();
    renderDashboardActivity();
    renderDashboardAlert();
}

function renderDashboardEvents() {
    const container =
        $("dashboardEvents");

    if (!container) return;

    const upcoming =
        [...events]
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            )
            .slice(0, 5);

    if (!upcoming.length) {
        container.innerHTML =
            emptyState(
                "📅",
                "No events yet",
                "Create your first event."
            );
        return;
    }

    container.innerHTML =
        upcoming.map(event => `
            <div class="event-item">

                <div class="event-date-box">
                    <strong>
                        ${getDay(event.date)}
                    </strong>

                    <small>
                        ${getMonth(event.date)}
                    </small>
                </div>

                <div class="event-info">
                    <strong>
                        ${escapeHtml(event.name)}
                    </strong>

                    <span>
                        ${escapeHtml(event.venue)}
                        · ${formatTimeString(event.time)}
                    </span>
                </div>

                ${statusPill(event.status)}

            </div>
        `).join("");
}

function renderDashboardResources() {
    const container =
        $("dashboardResources");

    if (!container) return;

    const items =
        resources.slice(0, 5);

    if (!items.length) {
        container.innerHTML =
            emptyState(
                "🧰",
                "No resources",
                "Add resources for event coordination."
            );
        return;
    }

    container.innerHTML =
        items.map(resource => {
            const shortage =
                resource.required -
                resource.available;

            const event =
                events.find(
                    item =>
                        item.id === resource.eventId
                );

            return `
                <div class="resource-row">

                    <div class="resource-row-icon">
                        🧰
                    </div>

                    <div class="resource-row-content">
                        <strong>
                            ${escapeHtml(resource.name)}
                        </strong>

                        <span>
                            ${escapeHtml(
                                event?.name ||
                                "Unknown event"
                            )}
                        </span>
                    </div>

                    <span class="resource-count">
                        ${resource.available}
                        /
                        ${resource.required}
                    </span>

                    ${shortage > 0
                        ? statusPill("shortage")
                        : statusPill("sufficient")
                    }

                </div>
            `;
        }).join("");
}

function renderDashboardActivity() {
    const container =
        $("dashboardActivity");

    if (!container) return;

    if (!activities.length) {
        container.innerHTML =
            emptyState(
                "⚡",
                "No activity",
                "Recent platform activity will appear here."
            );
        return;
    }

    container.innerHTML =
        activities
            .slice(0, 6)
            .map(activity => `
                <div class="activity-item">

                    <span class="activity-dot"></span>

                    <div>
                        <strong>
                            ${escapeHtml(activity.title)}
                        </strong>

                        <span>
                            ${escapeHtml(activity.description)}
                            · ${formatTime(activity.createdAt)}
                        </span>
                    </div>

                </div>
            `)
            .join("");
}

function renderDashboardAlert() {
    const active =
        alerts.find(
            item =>
                item.status === "active"
        );

    const strip =
        $("dashboardUrgentStrip");

    if (!strip) return;

    if (!active) {
        strip.classList.add("hidden");
        return;
    }

    strip.classList.remove("hidden");

    setText(
        "dashboardUrgentMessage",
        active.message
    );
}

/* =========================================================
   EVENTS TABLE
   ========================================================= */

function renderEvents() {
    const tbody =
        $("eventsTableBody");

    if (!tbody) return;

    const search =
        ($("eventSearch")?.value || "")
            .toLowerCase();

    const filter =
        $("eventStatusFilter")?.value ||
        "all";

    const filtered =
        events.filter(event => {
            const matchesSearch =
                event.name
                    .toLowerCase()
                    .includes(search) ||
                event.venue
                    .toLowerCase()
                    .includes(search);

            const matchesStatus =
                filter === "all" ||
                event.status === filter;

            return (
                matchesSearch &&
                matchesStatus
            );
        });

    if (!filtered.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    ${emptyState(
                        "📅",
                        "No events found",
                        "Create an event or change your filters."
                    )}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML =
        filtered.map(event => {
            const registered =
                registrations.filter(
                    item =>
                        item.eventId === event.id &&
                        item.status !== "cancelled"
                ).length;

            return `
                <tr>

                    <td>
                        <span class="table-primary">
                            ${escapeHtml(event.name)}
                        </span>
                    </td>

                    <td>
                        ${formatDate(event.date)}
                        <br>
                        <small>
                            ${formatTimeString(event.time)}
                        </small>
                    </td>

                    <td>
                        ${escapeHtml(event.venue)}
                    </td>

                    <td>
                        ${registered}
                        /
                        ${event.capacity}
                    </td>

                    <td>
                        ${formatCurrency(event.budget)}
                    </td>

                    <td>
                        ${statusPill(event.status)}
                    </td>

                    <td>
                        <div class="table-actions">

                            <button
                                class="table-action"
                                onclick="editEvent('${event.id}')"
                            >
                                Edit
                            </button>

                            <button
                                class="table-action danger"
                                onclick="deleteEvent('${event.id}')"
                            >
                                Delete
                            </button>

                        </div>
                    </td>

                </tr>
            `;
        }).join("");
}

/* =========================================================
   REGISTRATIONS TABLE
   ========================================================= */

function renderRegistrations() {
    const tbody =
        $("registrationsTableBody");

    if (!tbody) return;

    const search =
        ($("registrationSearch")?.value || "")
            .toLowerCase();

    const eventFilter =
        $("registrationEventFilter")?.value ||
        "all";

    const statusFilter =
        $("registrationStatusFilter")?.value ||
        "all";

    const filtered =
        registrations.filter(item => {
            const event =
                events.find(
                    eventItem =>
                        eventItem.id === item.eventId
                );

            const matchesSearch =
                item.name
                    .toLowerCase()
                    .includes(search) ||
                item.email
                    .toLowerCase()
                    .includes(search);

            const matchesEvent =
                eventFilter === "all" ||
                item.eventId === eventFilter;

            const matchesStatus =
                statusFilter === "all" ||
                item.status === statusFilter;

            return (
                matchesSearch &&
                matchesEvent &&
                matchesStatus
            );
        });

    const checked =
        registrations.filter(
            item =>
                item.status === "checked-in"
        ).length;

    const absent =
        registrations.filter(
            item =>
                item.status === "absent"
        ).length;

    const rate =
        registrations.length
            ? checked /
              registrations.length *
              100
            : 0;

    setText(
        "registrationSummaryTotal",
        registrations.length
    );

    setText(
        "registrationSummaryChecked",
        checked
    );

    setText(
        "registrationSummaryAbsent",
        absent
    );

    setText(
        "registrationSummaryRate",
        `${rate.toFixed(1)}%`
    );

    if (!filtered.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    ${emptyState(
                        "👥",
                        "No registrations",
                        "Register an attendee to see them here."
                    )}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML =
        filtered.map(item => {
            const event =
                events.find(
                    eventItem =>
                        eventItem.id === item.eventId
                );

            return `
                <tr>

                    <td>
                        <span class="table-primary">
                            ${escapeHtml(item.name)}
                        </span>
                    </td>

                    <td>
                        ${escapeHtml(
                            event?.name || "Unknown"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(item.ticketId)}
                    </td>

                    <td>
                        ${escapeHtml(item.email)}
                    </td>

                    <td>
                        ${statusPill(item.status)}
                    </td>

                    <td>
                        ${formatDateTime(
                            item.registeredAt
                        )}
                    </td>

                    <td>

                        <div class="table-actions">

                            <button
                                class="table-action"
                                onclick="showTicketById('${item.id}')"
                            >
                                Ticket
                            </button>

                            ${
                                item.status === "registered"
                                ? `
                                    <button
                                        class="table-action"
                                        onclick="checkInRegistration('${item.id}')"
                                    >
                                        Check In
                                    </button>
                                `
                                : ""
                            }

                            ${
                                item.status !== "cancelled"
                                ? `
                                    <button
                                        class="table-action danger"
                                        onclick="cancelRegistration('${item.id}')"
                                    >
                                        Cancel
                                    </button>
                                `
                                : ""
                            }

                        </div>

                    </td>

                </tr>
            `;
        }).join("");
}

function showTicketById(id) {
    const registration =
        registrations.find(
            item => item.id === id
        );

    if (registration) {
        showTicket(registration);
    }
}

/* =========================================================
   RESOURCE TABLE
   ========================================================= */

function renderResources() {
    const tbody =
        $("resourcesTableBody");

    if (!tbody) return;

    const sufficient =
        resources.filter(
            item =>
                item.available >= item.required
        ).length;

    const shortage =
        resources.filter(
            item =>
                item.available < item.required
        ).length;

    const available =
        sum(
            resources,
            item => Number(item.available) || 0
        );

    setText(
        "resourceTotal",
        resources.length
    );

    setText(
        "resourceSufficient",
        sufficient
    );

    setText(
        "resourceShortage",
        shortage
    );

    setText(
        "resourceAvailable",
        available
    );

    if (!resources.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    ${emptyState(
                        "🧰",
                        "No resources",
                        "Add resources to coordinate event requirements."
                    )}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML =
        resources.map(resource => {
            const event =
                events.find(
                    item =>
                        item.id === resource.eventId
                );

            const difference =
                resource.available -
                resource.required;

            const sufficientStatus =
                difference >= 0;

            return `
                <tr>

                    <td>
                        <span class="table-primary">
                            ${escapeHtml(resource.name)}
                        </span>
                    </td>

                    <td>
                        ${escapeHtml(
                            event?.name || "Unknown"
                        )}
                    </td>

                    <td>
                        ${resource.required}
                    </td>

                    <td>
                        ${resource.available}
                    </td>

                    <td>
                        ${
                            difference >= 0
                                ? `+${difference}`
                                : difference
                        }
                    </td>

                    <td>
                        ${
                            sufficientStatus
                                ? statusPill("sufficient")
                                : statusPill("shortage")
                        }
                    </td>

                    <td>

                        <button
                            class="table-action danger"
                            onclick="deleteResource('${resource.id}')"
                        >
                            Delete
                        </button>

                    </td>

                </tr>
            `;
        }).join("");
}

/* =========================================================
   VENDOR TABLE
   ========================================================= */

function renderVendors() {
    const tbody =
        $("vendorsTableBody");

    if (!tbody) return;

    const search =
        ($("vendorSearch")?.value || "")
            .toLowerCase();

    const filter =
        $("vendorAvailabilityFilter")?.value ||
        "all";

    const filtered =
        vendors.filter(vendor => {
            const matchesSearch =
                vendor.name
                    .toLowerCase()
                    .includes(search) ||
                vendor.service
                    .toLowerCase()
                    .includes(search);

            const matchesFilter =
                filter === "all" ||
                vendor.availability === filter;

            return (
                matchesSearch &&
                matchesFilter
            );
        });

    const assigned =
        vendors.filter(
            item =>
                item.availability === "assigned"
        ).length;

    const available =
        vendors.filter(
            item =>
                item.availability === "available"
        ).length;

    const services =
        new Set(
            vendors.map(
                item => item.service
            )
        ).size;

    setText(
        "vendorTotal",
        vendors.length
    );

    setText(
        "vendorAvailable",
        available
    );

    setText(
        "vendorAssigned",
        assigned
    );

    setText(
        "vendorServices",
        services
    );

    if (!filtered.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    ${emptyState(
                        "🏢",
                        "No vendors found",
                        "Add a vendor to manage service providers."
                    )}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML =
        filtered.map(vendor => {
            const event =
                events.find(
                    item =>
                        item.id === vendor.eventId
                );

            return `
                <tr>

                    <td>
                        <span class="table-primary">
                            ${escapeHtml(vendor.name)}
                        </span>
                    </td>

                    <td>
                        ${escapeHtml(vendor.service)}
                    </td>

                    <td>
                        ${escapeHtml(
                            vendor.phone || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            vendor.email || "—"
                        )}
                    </td>

                    <td>
                        ${statusPill(
                            vendor.availability
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            event?.name || "Unassigned"
                        )}
                    </td>

                    <td>

                        <div class="table-actions">

                            ${
                                vendor.eventId
                                    ? `
                                        <button
                                            class="table-action"
                                            onclick="unassignVendor('${vendor.id}')"
                                        >
                                            Unassign
                                        </button>
                                    `
                                    : `
                                        <button
                                            class="table-action"
                                            onclick="assignVendor('${vendor.id}')"
                                        >
                                            Assign
                                        </button>
                                    `
                            }

                            <button
                                class="table-action danger"
                                onclick="deleteVendor('${vendor.id}')"
                            >
                                Delete
                            </button>

                        </div>

                    </td>

                </tr>
            `;
        }).join("");
}

/* =========================================================
   BUDGET
   ========================================================= */

function renderBudget() {
    const totalBudget =
        sum(
            events,
            item => Number(item.budget) || 0
        );

    const totalExpenses =
        sum(
            expenses,
            item => Number(item.amount) || 0
        );

    const totalSponsorship =
        sum(
            sponsorships,
            item => Number(item.amount) || 0
        );

    const balance =
        totalBudget +
        totalSponsorship -
        totalExpenses;

    setText(
        "budgetPageTotal",
        formatCurrency(totalBudget)
    );

    setText(
        "budgetPageExpenses",
        formatCurrency(totalExpenses)
    );

    setText(
        "budgetPageSponsorship",
        formatCurrency(totalSponsorship)
    );

    setText(
        "budgetPageBalance",
        formatCurrency(balance)
    );

    setText(
        "budgetChartBudget",
        formatCurrency(totalBudget)
    );

    setText(
        "budgetChartSpent",
        formatCurrency(totalExpenses)
    );

    const percent =
        totalBudget
            ? Math.min(
                100,
                totalExpenses /
                totalBudget *
                100
            )
            : 0;

    setText(
        "budgetChartPercent",
        `${percent.toFixed(1)}%`
    );

    if ($("budgetChartProgress")) {
        $("budgetChartProgress").style.width =
            `${percent}%`;
    }

    renderExpensesList();
    renderExpensesTable();
}

function renderExpensesList() {
    const container =
        $("expensesList");

    if (!container) return;

    if (!expenses.length) {
        container.innerHTML =
            emptyState(
                "₹",
                "No expenses",
                "Add an expense to begin tracking spending."
            );
        return;
    }

    container.innerHTML =
        [...expenses]
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            )
            .slice(0, 5)
            .map(expense => {
                const event =
                    events.find(
                        item =>
                            item.id === expense.eventId
                    );

                return `
                    <div class="activity-item">

                        <span class="activity-dot"></span>

                        <div>
                            <strong>
                                ${escapeHtml(
                                    expense.description
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    event?.name || "Unknown"
                                )}
                                ·
                                ${formatCurrency(
                                    expense.amount
                                )}
                            </span>
                        </div>

                    </div>
                `;
            })
            .join("");
}

function renderExpensesTable() {
    const tbody =
        $("expensesTableBody");

    if (!tbody) return;

    if (!expenses.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    ${emptyState(
                        "₹",
                        "No expenses",
                        "Expense records will appear here."
                    )}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML =
        [...expenses]
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            )
            .map(expense => {
                const event =
                    events.find(
                        item =>
                            item.id === expense.eventId
                    );

                return `
                    <tr>

                        <td>
                            ${formatDate(expense.date)}
                        </td>

                        <td>
                            ${escapeHtml(
                                event?.name || "Unknown"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                expense.category
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                expense.description
                            )}
                        </td>

                        <td>
                            ${formatCurrency(
                                expense.amount
                            )}
                        </td>

                        <td>
                            ${statusPill("approved")}
                        </td>

                        <td>
                            <button
                                class="table-action danger"
                                onclick="deleteExpense('${expense.id}')"
                            >
                                Delete
                            </button>
                        </td>

                    </tr>
                `;
            })
            .join("");
}

/* =========================================================
   SPONSORSHIP RENDERING
   ========================================================= */

function renderSponsorship() {
    const total =
        sum(
            sponsorships,
            item => Number(item.amount) || 0
        );

    const count =
        sponsorships.length;

    const average =
        count
            ? total / count
            : 0;

    setText(
        "sponsorshipTotal",
        formatCurrency(total)
    );

    setText(
        "sponsorshipCount",
        count
    );

    setText(
        "sponsorshipAverage",
        formatCurrency(average)
    );

    const tbody =
        $("sponsorshipTableBody");

    if (!tbody) return;

    if (!sponsorships.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    ${emptyState(
                        "💰",
                        "No sponsorships",
                        "Add sponsorship support for an event."
                    )}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML =
        sponsorships.map(item => {
            const event =
                events.find(
                    eventItem =>
                        eventItem.id === item.eventId
                );

            return `
                <tr>

                    <td>
                        ${formatDate(item.date)}
                    </td>

                    <td>
                        ${escapeHtml(
                            event?.name || "Unknown"
                        )}
                    </td>

                    <td>
                        <span class="table-primary">
                            ${escapeHtml(item.sponsor)}
                        </span>
                    </td>

                    <td>
                        ${formatCurrency(item.amount)}
                    </td>

                    <td>
                        <button
                            class="table-action danger"
                            onclick="deleteSponsorship('${item.id}')"
                        >
                            Delete
                        </button>
                    </td>

                </tr>
            `;
        }).join("");
}

/* =========================================================
   APPROVALS
   ========================================================= */

function renderApprovals() {
    const pending =
        approvals.filter(
            item =>
                item.status === "pending"
        ).length;

    const approved =
        approvals.filter(
            item =>
                item.status === "approved"
        ).length;

    const rejected =
        approvals.filter(
            item =>
                item.status === "rejected"
        ).length;

    setText(
        "approvalPending",
        pending
    );

    setText(
        "approvalApproved",
        approved
    );

    setText(
        "approvalRejected",
        rejected
    );

    setText(
        "approvalTotal",
        approvals.length
    );

    const tbody =
        $("approvalsTableBody");

    if (!tbody) return;

    if (!approvals.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    ${emptyState(
                        "✓",
                        "No approval requests",
                        "New workflow requests will appear here."
                    )}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML =
        approvals.map(item => {
            const event =
                events.find(
                    eventItem =>
                        eventItem.id === item.eventId
                );

            return `
                <tr>

                    <td>
                        <span class="table-primary">
                            ${escapeHtml(item.request)}
                        </span>
                    </td>

                    <td>
                        ${escapeHtml(
                            event?.name || "Unknown"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(item.requester)}
                    </td>

                    <td>
                        ${formatCurrency(item.amount)}
                    </td>

                    <td>
                        ${formatDate(item.date)}
                    </td>

                    <td>
                        ${statusPill(item.status)}
                    </td>

                    <td>

                        <div class="table-actions">

                            ${
                                item.status === "pending"
                                    ? `
                                        <button
                                            class="table-action"
                                            onclick="updateApproval('${item.id}', 'approved')"
                                        >
                                            Approve
                                        </button>

                                        <button
                                            class="table-action danger"
                                            onclick="updateApproval('${item.id}', 'rejected')"
                                        >
                                            Reject
                                        </button>
                                    `
                                    : "—"
                            }

                        </div>

                    </td>

                </tr>
            `;
        }).join("");
}

/* =========================================================
   ALERT RENDERING
   ========================================================= */

function renderAlerts() {
    const container =
        $("alertsList");

    if (!container) return;

    const active =
        alerts.filter(
            item =>
                item.status === "active"
        ).length;

    const resolved =
        alerts.filter(
            item =>
                item.status === "resolved"
        ).length;

    setText(
        "alertTotal",
        alerts.length
    );

    setText(
        "alertActive",
        active
    );

    setText(
        "alertResolved",
        resolved
    );

    if (!alerts.length) {
        container.innerHTML =
            emptyState(
                "🚨",
                "No urgent alerts",
                "Alert history will appear here."
            );
        return;
    }

    container.innerHTML =
        alerts.map(alert => {
            const event =
                events.find(
                    item =>
                        item.id === alert.eventId
                );

            return `
                <div class="alert-history-item">

                    <div class="alert-history-icon">
                        🚨
                    </div>

                    <div class="alert-history-content">

                        <div class="alert-history-top">

                            <strong>
                                ${
                                    alert.status === "active"
                                        ? "Active Alert"
                                        : "Resolved Alert"
                                }
                            </strong>

                            <time>
                                ${formatDateTime(
                                    alert.createdAt
                                )}
                            </time>

                        </div>

                        <p>
                            ${escapeHtml(alert.message)}
                        </p>

                        <span class="alert-recipient">
                            To:
                            ${escapeHtml(
                                alert.recipient
                            )}
                            ${
                                event
                                    ? ` · Event: ${escapeHtml(event.name)}`
                                    : ""
                            }
                        </span>

                    </div>

                    <div class="alert-history-actions">

                        ${
                            alert.status === "active"
                                ? `
                                    <span class="alert-active-label">
                                        ACTIVE
                                    </span>
                                `
                                : `
                                    <span class="status-pill success">
                                        RESOLVED
                                    </span>
                                `
                        }

                    </div>

                </div>
            `;
        }).join("");
}

function updateAlertCounters() {
    const active =
        alerts.filter(
            item =>
                item.status === "active"
        ).length;

    const topCount =
        $("topAlertCount");

    const sideCount =
        $("sidebarAlertCount");

    if (topCount) {
        topCount.textContent = active;
        topCount.style.display =
            active ? "block" : "none";
    }

    if (sideCount) {
        sideCount.textContent = active;
        sideCount.style.display =
            active ? "inline-block" : "none";
    }
}

/* =========================================================
   ANALYTICS
   ========================================================= */

function renderAnalytics() {
    const totalRegistrations =
        registrations.length;

    const checked =
        registrations.filter(
            item =>
                item.status === "checked-in"
        ).length;

    const attendance =
        totalRegistrations
            ? checked /
              totalRegistrations *
              100
            : 0;

    const expected =
        Math.round(
            totalRegistrations * 0.9
        );

    const budget =
        sum(
            events,
            item => Number(item.budget) || 0
        );

    const expensesTotal =
        sum(
            expenses,
            item => Number(item.amount) || 0
        );

    const budgetUsage =
        budget
            ? expensesTotal /
              budget *
              100
            : 0;

    const sponsorshipTotal =
        sum(
            sponsorships,
            item => Number(item.amount) || 0
        );

    setText(
        "analyticsRegistrations",
        totalRegistrations
    );

    setText(
        "analyticsAttendance",
        `${attendance.toFixed(1)}%`
    );

    setText(
        "analyticsExpected",
        expected
    );

    setText(
        "analyticsBudgetUsage",
        `${budgetUsage.toFixed(1)}%`
    );

    setText(
        "analyticsExpenses",
        formatCurrency(expensesTotal)
    );

    setText(
        "analyticsSponsorship",
        formatCurrency(sponsorshipTotal)
    );

    const tbody =
        $("analyticsEventTableBody");

    if (tbody) {
        if (!events.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        ${emptyState(
                            "📊",
                            "No event data",
                            "Create events to see analytics."
                        )}
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML =
                events.map(event => {
                    const registered =
                        registrations.filter(
                            item =>
                                item.eventId === event.id &&
                                item.status !== "cancelled"
                        ).length;

                    const checkedIn =
                        registrations.filter(
                            item =>
                                item.eventId === event.id &&
                                item.status === "checked-in"
                        ).length;

                    const expected =
                        Math.round(
                            registered * 0.9
                        );

                    const attendance =
                        registered
                            ? checkedIn /
                              registered *
                              100
                            : 0;

                    const eventExpenses =
                        sum(
                            expenses.filter(
                                item =>
                                    item.eventId === event.id
                            ),
                            item =>
                                Number(item.amount) || 0
                        );

                    const eventSponsorship =
                        sum(
                            sponsorships.filter(
                                item =>
                                    item.eventId === event.id
                            ),
                            item =>
                                Number(item.amount) || 0
                        );

                    const balance =
                        Number(event.budget) +
                        eventSponsorship -
                        eventExpenses;

                    return `
                        <tr>

                            <td>
                                <span class="table-primary">
                                    ${escapeHtml(event.name)}
                                </span>
                            </td>

                            <td>
                                ${registered}
                            </td>

                            <td>
                                ${expected}
                            </td>

                            <td>
                                ${checkedIn}
                            </td>

                            <td>
                                ${attendance.toFixed(1)}%
                            </td>

                            <td>
                                ${formatCurrency(
                                    event.budget
                                )}
                            </td>

                            <td>
                                ${formatCurrency(
                                    eventExpenses
                                )}
                            </td>

                            <td>
                                ${formatCurrency(balance)}
                            </td>

                        </tr>
                    `;
                }).join("");
        }
    }

    renderAnalyticsResources();
    renderCharts();
}

function renderAnalyticsResources() {
    const container =
        $("analyticsResourceStatus");

    if (!container) return;

    if (!resources.length) {
        container.innerHTML =
            emptyState(
                "🧰",
                "No resource plans",
                "Add resources to see coordination status."
            );
        return;
    }

    container.innerHTML =
        resources.map(resource => {
            const event =
                events.find(
                    item =>
                        item.id === resource.eventId
                );

            const difference =
                resource.available -
                resource.required;

            return `
                <div class="resource-row">

                    <div class="resource-row-icon">
                        🧰
                    </div>

                    <div class="resource-row-content">
                        <strong>
                            ${escapeHtml(resource.name)}
                        </strong>

                        <span>
                            ${escapeHtml(
                                event?.name || "Unknown event"
                            )}
                            · Required:
                            ${resource.required}
                            · Available:
                            ${resource.available}
                        </span>
                    </div>

                    <div>
                        ${
                            difference >= 0
                                ? statusPill("sufficient")
                                : statusPill("shortage")
                        }
                    </div>

                </div>
            `;
        }).join("");
}

/* =========================================================
   VANILLA CANVAS CHARTS
   ========================================================= */

function renderCharts() {
    drawAttendanceChart();
    drawBudgetChart();
}

function drawAttendanceChart() {
    const canvas =
        $("attendanceChart");

    if (!canvas) return;

    const ctx =
        canvas.getContext("2d");

    const width =
        canvas.width;

    const height =
        canvas.height;

    ctx.clearRect(
        0,
        0,
        width,
        height
    );

    const labels =
        events.slice(0, 6)
            .map(event =>
                truncate(event.name, 12)
            );

    const values =
        events.slice(0, 6)
            .map(event => {
                const registered =
                    registrations.filter(
                        item =>
                            item.eventId === event.id &&
                            item.status !== "cancelled"
                    ).length;

                const checked =
                    registrations.filter(
                        item =>
                            item.eventId === event.id &&
                            item.status === "checked-in"
                    ).length;

                return registered
                    ? checked /
                      registered *
                      100
                    : 0;
            });

    drawBarChart(
        ctx,
        width,
        height,
        labels,
        values,
        100,
        "%"
    );
}

function drawBudgetChart() {
    const canvas =
        $("budgetChart");

    if (!canvas) return;

    const ctx =
        canvas.getContext("2d");

    const width =
        canvas.width;

    const height =
        canvas.height;

    ctx.clearRect(
        0,
        0,
        width,
        height
    );

    const budget =
        sum(
            events,
            item => Number(item.budget) || 0
        );

    const expensesTotal =
        sum(
            expenses,
            item => Number(item.amount) || 0
        );

    const sponsorshipTotal =
        sum(
            sponsorships,
            item => Number(item.amount) || 0
        );

    const max =
        Math.max(
            budget,
            expensesTotal,
            sponsorshipTotal,
            1
        );

    drawBarChart(
        ctx,
        width,
        height,
        [
            "Budget",
            "Expenses",
            "Sponsorship"
        ],
        [
            budget,
            expensesTotal,
            sponsorshipTotal
        ],
        max,
        "₹"
    );
}

function drawBarChart(
    ctx,
    width,
    height,
    labels,
    values,
    maxValue,
    suffix
) {
    const padding = 45;

    const chartWidth =
        width -
        padding * 2;

    const chartHeight =
        height -
        padding * 2;

    ctx.strokeStyle =
        "rgba(255,255,255,0.08)";

    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
        const y =
            padding +
            chartHeight -
            i / 4 *
            chartHeight;

        ctx.beginPath();
        ctx.moveTo(
            padding,
            y
        );
        ctx.lineTo(
            width - padding,
            y
        );
        ctx.stroke();
    }

    if (!labels.length) {
        ctx.fillStyle =
            "#6f7890";

        ctx.font =
            "13px Segoe UI";

        ctx.textAlign =
            "center";

        ctx.fillText(
            "No data available",
            width / 2,
            height / 2
        );

        return;
    }

    const barGap = 18;

    const barWidth =
        Math.max(
            20,
            (
                chartWidth -
                barGap * (labels.length - 1)
            ) /
            labels.length
        );

    values.forEach(
        (value, index) => {
            const normalized =
                maxValue
                    ? value / maxValue
                    : 0;

            const barHeight =
                normalized *
                chartHeight;

            const x =
                padding +
                index *
                (barWidth + barGap);

            const y =
                padding +
                chartHeight -
                barHeight;

            const gradient =
                ctx.createLinearGradient(
                    0,
                    y,
                    0,
                    y + barHeight
                );

            gradient.addColorStop(
                0,
                "#927aff"
            );

            gradient.addColorStop(
                1,
                "#3b82f6"
            );

            ctx.fillStyle =
                gradient;

            roundRect(
                ctx,
                x,
                y,
                barWidth,
                Math.max(
                    3,
                    barHeight
                ),
                6
            );

            ctx.fill();

            ctx.fillStyle =
                "#aab2c5";

            ctx.font =
                "9px Segoe UI";

            ctx.textAlign =
                "center";

            const displayValue =
                suffix === "%"
                    ? `${value.toFixed(0)}%`
                    : formatShortCurrency(value);

            ctx.fillText(
                displayValue,
                x + barWidth / 2,
                Math.max(
                    12,
                    y - 7
                )
            );

            ctx.fillStyle =
                "#6f7890";

            ctx.fillText(
                labels[index],
                x + barWidth / 2,
                height - 14
            );
        }
    );
}

function roundRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
) {
    const r =
        Math.min(
            radius,
            width / 2,
            height / 2
        );

    ctx.beginPath();

    ctx.moveTo(
        x + r,
        y
    );

    ctx.arcTo(
        x + width,
        y,
        x + width,
        y + height,
        r
    );

    ctx.arcTo(
        x + width,
        y + height,
        x,
        y + height,
        r
    );

    ctx.arcTo(
        x,
        y + height,
        x,
        y,
        r
    );

    ctx.arcTo(
        x,
        y,
        x + width,
        y,
        r
    );

    ctx.closePath();
}

/* =========================================================
   REPORTS
   ========================================================= */

function renderReportsDefaults() {
    populateEventSelects();
}

function generateReport() {
    const eventId =
        $("reportEventSelect").value;

    const reportType =
        $("reportType").value;

    const event =
        events.find(
            item =>
                item.id === eventId
        );

    if (!event) {
        showToast(
            "error",
            "Select an event",
            "Choose an event before generating the report."
        );
        return;
    }

    const eventRegistrations =
        registrations.filter(
            item =>
                item.eventId === eventId &&
                item.status !== "cancelled"
        );

    const checked =
        eventRegistrations.filter(
            item =>
                item.status === "checked-in"
        ).length;

    const expected =
        Math.round(
            eventRegistrations.length * 0.9
        );

    const eventExpenses =
        sum(
            expenses.filter(
                item =>
                    item.eventId === eventId
            ),
            item =>
                Number(item.amount) || 0
        );

    const eventSponsorship =
        sum(
            sponsorships.filter(
                item =>
                    item.eventId === eventId
            ),
            item =>
                Number(item.amount) || 0
        );

    const eventResources =
        resources.filter(
            item =>
                item.eventId === eventId
        );

    const attendance =
        eventRegistrations.length
            ? checked /
              eventRegistrations.length *
              100
            : 0;

    const balance =
        Number(event.budget) +
        eventSponsorship -
        eventExpenses;

    const content =
        $("reportPreviewContent");

    if (!content) return;

    let html = `
        <div class="report-section">

            <h4>
                Event Overview
            </h4>

            <p>
                <strong>
                    ${escapeHtml(event.name)}
                </strong>
                ·
                ${formatDate(event.date)}
                ·
                ${escapeHtml(event.venue)}
            </p>

        </div>
    `;

    if (
        reportType === "complete" ||
        reportType === "attendance"
    ) {
        html += `
            <div class="report-section">

                <h4>
                    Attendance
                </h4>

                <div class="report-stat-grid">

                    <div class="report-stat">
                        <span>Registered</span>
                        <strong>
                            ${eventRegistrations.length}
                        </strong>
                    </div>

                    <div class="report-stat">
                        <span>Expected</span>
                        <strong>
                            ${expected}
                        </strong>
                    </div>

                    <div class="report-stat">
                        <span>Checked In</span>
                        <strong>
                            ${checked}
                        </strong>
                    </div>

                    <div class="report-stat">
                        <span>Attendance Rate</span>
                        <strong>
                            ${attendance.toFixed(1)}%
                        </strong>
                    </div>

                </div>

            </div>
        `;
    }

    if (
        reportType === "complete" ||
        reportType === "financial"
    ) {
        html += `
            <div class="report-section">

                <h4>
                    Financial Summary
                </h4>

                <div class="report-stat-grid">

                    <div class="report-stat">
                        <span>Budget</span>
                        <strong>
                            ${formatCurrency(event.budget)}
                        </strong>
                    </div>

                    <div class="report-stat">
                        <span>Expenses</span>
                        <strong>
                            ${formatCurrency(eventExpenses)}
                        </strong>
                    </div>

                    <div class="report-stat">
                        <span>Sponsorship</span>
                        <strong>
                            ${formatCurrency(eventSponsorship)}
                        </strong>
                    </div>

                    <div class="report-stat">
                        <span>Balance</span>
                        <strong>
                            ${formatCurrency(balance)}
                        </strong>
                    </div>

                </div>

            </div>
        `;
    }

    if (
        reportType === "complete" ||
        reportType === "resources"
    ) {
        html += `
            <div class="report-section">

                <h4>
                    Resource Coordination
                </h4>

                ${
                    eventResources.length
                        ? eventResources
                            .map(resource => {
                                const difference =
                                    resource.available -
                                    resource.required;

                                return `
                                    <p>
                                        <strong>
                                            ${escapeHtml(
                                                resource.name
                                            )}
                                        </strong>
                                        :
                                        Required
                                        ${resource.required},
                                        Available
                                        ${resource.available},
                                        ${
                                            difference >= 0
                                                ? "Sufficient"
                                                : `Shortage of ${Math.abs(difference)}`
                                        }
                                    </p>
                                `;
                            })
                            .join("")
                        : `
                            <p>
                                No resource records are available.
                            </p>
                        `
                }

            </div>
        `;
    }

    content.innerHTML = html;

    setText(
        "reportGeneratedDate",
        formatDateTime(
            new Date().toISOString()
        )
    );

    showToast(
        "success",
        "Report generated",
        "The event report is ready for review."
    );
}

/* =========================================================
   CSV EXPORT
   ========================================================= */

function exportCSV() {
    if (!events.length) {
        showToast(
            "warning",
            "No data",
            "Create an event before exporting."
        );
        return;
    }

    const rows = [
        [
            "Event",
            "Date",
            "Venue",
            "Capacity",
            "Registered",
            "Checked In",
            "Expected Attendance",
            "Attendance Rate",
            "Budget",
            "Expenses",
            "Sponsorship",
            "Balance"
        ]
    ];

    events.forEach(event => {
        const registered =
            registrations.filter(
                item =>
                    item.eventId === event.id &&
                    item.status !== "cancelled"
            ).length;

        const checked =
            registrations.filter(
                item =>
                    item.eventId === event.id &&
                    item.status === "checked-in"
            ).length;

        const expected =
            Math.round(
                registered * 0.9
            );

        const attendance =
            registered
                ? checked /
                  registered *
                  100
                : 0;

        const eventExpenses =
            sum(
                expenses.filter(
                    item =>
                        item.eventId === event.id
                ),
                item =>
                    Number(item.amount) || 0
            );

        const eventSponsorship =
            sum(
                sponsorships.filter(
                    item =>
                        item.eventId === event.id
                ),
                item =>
                    Number(item.amount) || 0
            );

        const balance =
            Number(event.budget) +
            eventSponsorship -
            eventExpenses;

        rows.push([
            event.name,
            event.date,
            event.venue,
            event.capacity,
            registered,
            checked,
            expected,
            attendance.toFixed(1) + "%",
            event.budget,
            eventExpenses,
            eventSponsorship,
            balance
        ]);
    });

    const csv =
        rows
            .map(row =>
                row.map(csvEscape).join(",")
            )
            .join("\n");

    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download =
        `planpro-event-report-${getToday()}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    showToast(
        "success",
        "CSV exported",
        "Event analytics have been exported successfully."
    );
}

function csvEscape(value) {
    const stringValue =
        String(value ?? "");

    return `"${stringValue.replace(
        /"/g,
        '""'
    )}"`;
}

/* =========================================================
   SYSTEM TESTING
   ========================================================= */

function renderTestingDefaults() {
    setText("testTotal", "0");
    setText("testPassed", "0");
    setText("testFailed", "0");
    setText("testPassRate", "0%");

    const container =
        $("testingResults");

    if (container && !container.children.length) {
        container.innerHTML =
            emptyState(
                "🧪",
                "Testing not run",
                "Click Run All Tests to validate the platform."
            );
    }
}

function runSystemTests() {
    const tests = [
        {
            name:
                "Event information validation",
            description:
                "Checks that event records contain valid information.",
            test: () =>
                events.every(
                    event =>
                        event.name &&
                        event.date &&
                        event.venue &&
                        event.capacity > 0 &&
                        event.budget >= 0
                )
        },

        {
            name:
                "Negative expense rejection",
            description:
                "Checks that stored expenses are not negative.",
            test: () =>
                expenses.every(
                    expense =>
                        Number(expense.amount) >= 0
                )
        },

        {
            name:
                "Sponsorship validation",
            description:
                "Checks that sponsorship amounts are valid.",
            test: () =>
                sponsorships.every(
                    item =>
                        item.sponsor &&
                        Number(item.amount) > 0
                )
        },

        {
            name:
                "Attendance validation",
            description:
                "Checks that checked-in attendees do not exceed registrations.",
            test: () =>
                events.every(event => {
                    const registered =
                        registrations.filter(
                            item =>
                                item.eventId === event.id &&
                                item.status !== "cancelled"
                        ).length;

                    const checked =
                        registrations.filter(
                            item =>
                                item.eventId === event.id &&
                                item.status === "checked-in"
                        ).length;

                    return checked <= registered;
                })
        },

        {
            name:
                "Resource reference validation",
            description:
                "Checks that resources reference existing events.",
            test: () =>
                resources.every(
                    resource =>
                        events.some(
                            event =>
                                event.id === resource.eventId
                        )
                )
        },

        {
            name:
                "Resource coordination calculation",
            description:
                "Checks required versus available quantities.",
            test: () =>
                resources.every(
                    resource =>
                        Number(resource.required) >= 0 &&
                        Number(resource.available) >= 0
                )
        },

        {
            name:
                "Financial calculation",
            description:
                "Checks budget and expense calculations.",
            test: () => {
                const budget =
                    sum(
                        events,
                        item =>
                            Number(item.budget) || 0
                    );

                const expensesTotal =
                    sum(
                        expenses,
                        item =>
                            Number(item.amount) || 0
                    );

                return (
                    budget >= 0 &&
                    expensesTotal >= 0
                );
            }
        },

        {
            name:
                "Registration ticket validation",
            description:
                "Checks that registrations contain unique ticket identifiers.",
            test: () => {
                const tickets =
                    registrations.map(
                        item =>
                            item.ticketId
                    );

                return (
                    tickets.length ===
                    new Set(tickets).size
                );
            }
        },

        {
            name:
                "Alert system validation",
            description:
                "Checks that alert records contain required fields.",
            test: () =>
                alerts.every(
                    alert =>
                        alert.id &&
                        alert.recipient &&
                        alert.message &&
                        alert.status
                )
        }
    ];

    const results =
        tests.map(test => {
            let passed = false;

            try {
                passed =
                    Boolean(test.test());
            } catch (error) {
                passed = false;
            }

            return {
                ...test,
                passed
            };
        });

    const passed =
        results.filter(
            result => result.passed
        ).length;

    const failed =
        results.length -
        passed;

    const rate =
        results.length
            ? passed /
              results.length *
              100
            : 0;

    setText(
        "testTotal",
        results.length
    );

    setText(
        "testPassed",
        passed
    );

    setText(
        "testFailed",
        failed
    );

    setText(
        "testPassRate",
        `${rate.toFixed(1)}%`
    );

    const container =
        $("testingResults");

    if (container) {
        container.innerHTML =
            results.map(result => `
                <div
                    class="test-result ${
                        result.passed
                            ? ""
                            : "failed"
                    }"
                >

                    <div class="test-result-icon">
                        ${
                            result.passed
                                ? "✓"
                                : "×"
                        }
                    </div>

                    <div class="test-result-content">

                        <strong>
                            ${escapeHtml(result.name)}
                        </strong>

                        <span>
                            ${escapeHtml(result.description)}
                        </span>

                    </div>

                    <span class="test-status">
                        ${
                            result.passed
                                ? "PASSED"
                                : "FAILED"
                        }
                    </span>

                </div>
            `).join("");
    }

    showToast(
        failed
            ? "warning"
            : "success",
        "Testing complete",
        `${passed} passed, ${failed} failed.`
    );
}

/* =========================================================
   SETTINGS RENDER
   ========================================================= */

function renderSettings() {
    updateUserDisplay();

    if ($("settingsEmail")) {
        $("settingsEmail").value =
            settings.email || "";
    }

    if ($("settingUrgentAlerts")) {
        $("settingUrgentAlerts").checked =
            settings.urgentAlerts;
    }

    if ($("settingReminders")) {
        $("settingReminders").checked =
            settings.reminders;
    }

    if ($("settingActivity")) {
        $("settingActivity").checked =
            settings.activityNotifications;
    }

    if ($("alarmEnabled")) {
        $("alarmEnabled").checked =
            settings.alarmEnabled;
    }
}

/* =========================================================
   SELECT OPTIONS
   ========================================================= */

function populateEventSelects() {
    const selects = [
        "registrationEvent",
        "resourceEvent",
        "vendorEvent",
        "expenseEvent",
        "sponsorEvent",
        "approvalEvent",
        "alertEvent",
        "reportEventSelect",
        "registrationEventFilter"
    ];

    selects.forEach(id => {
        const select = $(id);

        if (!select) return;

        const current =
            select.value;

        let firstOption =
            "";

        if (
            id === "registrationEventFilter"
        ) {
            firstOption =
                `<option value="all">All Events</option>`;
        } else if (
            id === "vendorEvent"
        ) {
            firstOption =
                `<option value="">No Event</option>`;
        } else if (
            id === "alertEvent"
        ) {
            firstOption =
                `<option value="">General Platform Alert</option>`;
        } else if (
            id === "reportEventSelect"
        ) {
            firstOption =
                `<option value="">Select an event</option>`;
        } else {
            firstOption =
                `<option value="">Select event</option>`;
        }

        select.innerHTML =
            firstOption +
            events.map(event => `
                <option value="${event.id}">
                    ${escapeHtml(event.name)}
                </option>
            `).join("");

        if (
            events.some(
                event =>
                    event.id === current
            )
        ) {
            select.value = current;
        }
    });
}

/* =========================================================
   ACTIVITY
   ========================================================= */

function addActivity(
    title,
    description
) {
    activities.unshift({
        id: generateId("ACT"),
        title,
        description,
        createdAt:
            new Date().toISOString()
    });

    activities =
        activities.slice(0, 50);

    writeStorage(
        STORAGE.activities,
        activities
    );
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function renderNotificationList() {
    const container =
        $("notificationList");

    if (!container) return;

    const items =
        activities.slice(0, 8);

    if (!items.length) {
        container.innerHTML =
            emptyState(
                "🔔",
                "No notifications",
                "Recent activity will appear here."
            );
        return;
    }

    container.innerHTML =
        items.map(item => `
            <div class="notification-item">

                <span class="notification-item-icon">
                    ⚡
                </span>

                <div>

                    <strong>
                        ${escapeHtml(item.title)}
                    </strong>

                    <p>
                        ${escapeHtml(item.description)}
                    </p>

                    <time>
                        ${formatDateTime(item.createdAt)}
                    </time>

                </div>

            </div>
        `).join("");
}

/* =========================================================
   DEMO DATA
   ========================================================= */

function seedDemoData(showMessage = true) {
    const today =
        new Date();

    const datePlus =
        days => {
            const date =
                new Date(today);

            date.setDate(
                date.getDate() + days
            );

            return date
                .toISOString()
                .split("T")[0];
        };

    events = [
        {
            id: "EV001",
            name:
                "Tech Innovation Summit",
            date:
                datePlus(7),
            time:
                "10:00",
            venue:
                "Convention Hall",
            capacity:
                1000,
            budget:
                250000,
            status:
                "upcoming",
            description:
                "Technology and innovation event.",
            createdAt:
                new Date().toISOString()
        },

        {
            id: "EV002",
            name:
                "Campus Cultural Fest",
            date:
                datePlus(15),
            time:
                "09:30",
            venue:
                "University Ground",
            capacity:
                1500,
            budget:
                180000,
            status:
                "upcoming",
            description:
                "Annual cultural celebration.",
            createdAt:
                new Date().toISOString()
        },

        {
            id: "EV003",
            name:
                "Business Networking Meet",
            date:
                datePlus(-20),
            time:
                "18:00",
            venue:
                "Grand Conference Center",
            capacity:
                400,
            budget:
                90000,
            status:
                "completed",
            description:
                "Professional networking event.",
            createdAt:
                new Date().toISOString()
        }
    ];

    registrations = [
        {
            id: "REG001",
            ticketId:
                "TKT-10001",
            eventId:
                "EV001",
            name:
                "Aarav Sharma",
            email:
                "aarav@example.com",
            phone:
                "9876543210",
            status:
                "checked-in",
            registeredAt:
                new Date().toISOString(),
            checkedInAt:
                new Date().toISOString()
        },

        {
            id: "REG002",
            ticketId:
                "TKT-10002",
            eventId:
                "EV001",
            name:
                "Priya Das",
            email:
                "priya@example.com",
            phone:
                "9876543211",
            status:
                "registered",
            registeredAt:
                new Date().toISOString()
        },

        {
            id: "REG003",
            ticketId:
                "TKT-10003",
            eventId:
                "EV002",
            name:
                "Rohan Patel",
            email:
                "rohan@example.com",
            phone:
                "9876543212",
            status:
                "checked-in",
            registeredAt:
                new Date().toISOString(),
            checkedInAt:
                new Date().toISOString()
        },

        {
            id: "REG004",
            ticketId:
                "TKT-10004",
            eventId:
                "EV003",
            name:
                "Sneha Mishra",
            email:
                "sneha@example.com",
            phone:
                "9876543213",
            status:
                "checked-in",
            registeredAt:
                new Date().toISOString(),
            checkedInAt:
                new Date().toISOString()
        }
    ];

    resources = [
        {
            id:
                "RES001",
            eventId:
                "EV001",
            name:
                "Chairs",
            required:
                900,
            available:
                850,
            type:
                "attendance",
            createdAt:
                new Date().toISOString()
        },

        {
            id:
                "RES002",
            eventId:
                "EV001",
            name:
                "Projectors",
            required:
                2,
            available:
                3,
            type:
                "manual",
            createdAt:
                new Date().toISOString()
        },

        {
            id:
                "RES003",
            eventId:
                "EV002",
            name:
                "Microphones",
            required:
                6,
            available:
                6,
            type:
                "manual",
            createdAt:
                new Date().toISOString()
        },

        {
            id:
                "RES004",
            eventId:
                "EV002",
            name:
                "Tables",
            required:
                30,
            available:
                22,
            type:
                "manual",
            createdAt:
                new Date().toISOString()
        }
    ];

    vendors = [
        {
            id:
                "VEN001",
            name:
                "Fresh Bites Catering",
            service:
                "Catering",
            phone:
                "9876500011",
            email:
                "freshbites@example.com",
            availability:
                "assigned",
            eventId:
                "EV001",
            createdAt:
                new Date().toISOString()
        },

        {
            id:
                "VEN002",
            name:
                "Sound Pro Events",
            service:
                "Sound System",
            phone:
                "9876500012",
            email:
                "soundpro@example.com",
            availability:
                "available",
            eventId:
                "",
            createdAt:
                new Date().toISOString()
        },

        {
            id:
                "VEN003",
            name:
                "Vision Photography",
            service:
                "Photography",
            phone:
                "9876500013",
            email:
                "vision@example.com",
            availability:
                "assigned",
            eventId:
                "EV002",
            createdAt:
                new Date().toISOString()
        }
    ];

    expenses = [
        {
            id:
                "EXP001",
            eventId:
                "EV001",
            category:
                "Venue",
            description:
                "Hall booking",
            amount:
                60000,
            date:
                datePlus(-2)
        },

        {
            id:
                "EXP002",
            eventId:
                "EV001",
            category:
                "Equipment",
            description:
                "Audio equipment",
            amount:
                30000,
            date:
                datePlus(-1)
        },

        {
            id:
                "EXP003",
            eventId:
                "EV002",
            category:
                "Decoration",
            description:
                "Stage decoration",
            amount:
                25000,
            date:
                datePlus(-3)
        }
    ];

    sponsorships = [
        {
            id:
                "SPO001",
            eventId:
                "EV001",
            sponsor:
                "TechNova Solutions",
            amount:
                75000,
            date:
                datePlus(-4)
        },

        {
            id:
                "SPO002",
            eventId:
                "EV002",
            sponsor:
                "Campus Partners",
            amount:
                50000,
            date:
                datePlus(-5)
        }
    ];

    approvals = [
        {
            id:
                "APP001",
            request:
                "Additional sound equipment",
            eventId:
                "EV001",
            requester:
                "Administrator",
            amount:
                18000,
            date:
                datePlus(-1),
            status:
                "pending"
        },

        {
            id:
                "APP002",
            request:
                "Venue decoration budget",
            eventId:
                "EV002",
            requester:
                "Administrator",
            amount:
                25000,
            date:
                datePlus(-4),
            status:
                "approved"
        }
    ];

    alerts = [];

    activities = [
        {
            id:
                "ACT001",
            title:
                "Dashboard initialized",
            description:
                "PlanPro is ready for event operations.",
            createdAt:
                new Date().toISOString()
        },

        {
            id:
                "ACT002",
            title:
                "Resource shortage detected",
            description:
                "Chairs are below the required quantity.",
            createdAt:
                new Date(
                    Date.now() - 3600000
                ).toISOString()
        },

        {
            id:
                "ACT003",
            title:
                "Sponsorship recorded",
            description:
                "TechNova Solutions sponsorship was added.",
            createdAt:
                new Date(
                    Date.now() - 7200000
                ).toISOString()
        }
    ];

    saveAll();

    if (showMessage) {
        showToast(
            "success",
            "Demo data loaded",
            "PlanPro has been populated with sample records."
        );
    }
}

/* =========================================================
   CLEAR DATA
   ========================================================= */

function clearAllData() {
    const confirmed =
        confirm(
            "Are you sure you want to clear all PlanPro data?"
        );

    if (!confirmed) return;

    events = [];
    registrations = [];
    resources = [];
    vendors = [];
    expenses = [];
    sponsorships = [];
    approvals = [];
    alerts = [];
    activities = [];

    saveAll();

    renderAll();

    showToast(
        "success",
        "Data cleared",
        "All platform records have been removed."
    );
}

/* =========================================================
   UTILITIES
   ========================================================= */

function generateId(prefix) {
    return (
        prefix +
        "-" +
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 7)
            .toUpperCase()
    );
}

function generateTicketId() {
    return (
        "TKT-" +
        Date.now().toString().slice(-7)
    );
}

function sum(
    array,
    callback
) {
    return array.reduce(
        (total, item) =>
            total +
            Number(callback(item) || 0),
        0
    );
}

function formatCurrency(value) {
    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(
        Number(value) || 0
    );
}

function formatShortCurrency(value) {
    const number =
        Number(value) || 0;

    if (number >= 10000000) {
        return (
            "₹" +
            (number / 10000000)
                .toFixed(1) +
            "Cr"
        );
    }

    if (number >= 100000) {
        return (
            "₹" +
            (number / 100000)
                .toFixed(1) +
            "L"
        );
    }

    if (number >= 1000) {
        return (
            "₹" +
            (number / 1000)
                .toFixed(1) +
            "K"
        );
    }

    return "₹" + number;
}

function formatDate(value) {
    if (!value) return "—";

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function formatDateTime(value) {
    if (!value) return "—";

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

function formatTime(value) {
    if (!value) return "—";

    return new Date(
        value
    ).toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

function formatTimeString(value) {
    if (!value) return "—";

    const parts =
        value.split(":");

    let hour =
        Number(parts[0]);

    const minute =
        parts[1] || "00";

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;
}

function getToday() {
    return new Date()
        .toISOString()
        .split("T")[0];
}

function getDay(date) {
    return new Date(date)
        .getDate()
        .toString()
        .padStart(2, "0");
}

function getMonth(date) {
    return new Date(date)
        .toLocaleDateString(
            "en-IN",
            {
                month: "short"
            }
        );
}

function truncate(
    value,
    length
) {
    const string =
        String(value || "");

    return string.length > length
        ? string.slice(0, length) + "…"
        : string;
}

function escapeHtml(value) {
    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

function setText(
    id,
    value
) {
    const element = $(id);

    if (element) {
        element.textContent =
            value;
    }
}

function emptyState(
    icon,
    title,
    message
) {
    return `
        <div class="empty-state">

            <div class="empty-icon">
                ${icon}
            </div>

            <h3>
                ${escapeHtml(title)}
            </h3>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>
    `;
}

function statusPill(status) {
    const normalized =
        String(status || "")
            .toLowerCase();

    let label =
        status || "Unknown";

    let className =
        "info";

    if (
        normalized === "approved" ||
        normalized === "checked-in" ||
        normalized === "available" ||
        normalized === "sufficient" ||
        normalized === "completed"
    ) {
        className = "success";
    }

    if (
        normalized === "pending" ||
        normalized === "registered" ||
        normalized === "upcoming" ||
        normalized === "assigned"
    ) {
        className = "warning";
    }

    if (
        normalized === "rejected" ||
        normalized === "cancelled" ||
        normalized === "shortage"
    ) {
        className = "danger";
    }

    if (normalized === "ongoing") {
        className = "info";
    }

    return `
        <span class="status-pill ${className}">
            ${escapeHtml(
                String(label)
                    .replace(
                        "-",
                        " "
                    )
            )}
        </span>
    `;
}

/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    type,
    title,
    message
) {
    const container =
        $("toastContainer");

    if (!container) return;

    const icon =
        type === "success"
            ? "✓"
            : type === "error"
                ? "!"
                : type === "warning"
                    ? "⚠"
                    : "ℹ";

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    toast.innerHTML = `
        <span class="toast-icon">
            ${icon}
        </span>

        <div class="toast-content">

            <strong>
                ${escapeHtml(title)}
            </strong>

            <span>
                ${escapeHtml(message)}
            </span>

        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform =
            "translateX(20px)";

        setTimeout(
            () => toast.remove(),
            250
        );
    }, 3500);
}

/* =========================================================
   GLOBAL WINDOW FUNCTIONS
   ========================================================= */

window.editEvent = editEvent;
window.deleteEvent = deleteEvent;

window.checkInRegistration =
    checkInRegistration;

window.cancelRegistration =
    cancelRegistration;

window.showTicketById =
    showTicketById;

window.deleteResource =
    deleteResource;

window.assignVendor =
    assignVendor;

window.unassignVendor =
    unassignVendor;

window.deleteVendor =
    deleteVendor;

window.deleteExpense =
    deleteExpense;

window.deleteSponsorship =
    deleteSponsorship;

window.updateApproval =
    updateApproval;