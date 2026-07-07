const fields = {
    fullName: document.getElementById("fullName"),
    jobTitle: document.getElementById("jobTitle"),
    company: document.getElementById("company"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    location: document.getElementById("location"),
    bio: document.getElementById("bio"),
    linkedin: document.getElementById("linkedin"),
    github: document.getElementById("github"),
    instagram: document.getElementById("instagram"),
    portfolio: document.getElementById("portfolio"),
    accentColor: document.getElementById("accentColor"),
    showContact: document.getElementById("showContact")
};

const card = document.getElementById("businessCard");
const profileVisual = document.getElementById("profileVisual");
const socialLinks = document.getElementById("socialLinks");
const toast = document.getElementById("toast");
let profileImageData = "";
let selectedTemplate = "modern";
let toastTimeout;

const defaultText = {
    name: "",
    title: "",
    company: "",
    email: "",
    phone: "",
    location: "",
    bio: ""
};

const templateDefaults = {
    modern: "#2f6bff",
    developer: "#b5ff3c",
    creative: "#db4fbb",
    minimal: "#b58b61"
};

function getInitials(name) {
    return name.trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0].toUpperCase())
        .join("") || "";
}

function validUrl(url) {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

function updateProfile(name) {
    if (profileImageData) {
        profileVisual.classList.remove("initials-placeholder");
        profileVisual.innerHTML = `<img src="${profileImageData}" alt="${name || "Profile"} profile image">`;
    } else {
        profileVisual.classList.add("initials-placeholder");
        profileVisual.textContent = getInitials(name);
    }
}

const svgIcons = {
    linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`,
    github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0 3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
    portfolio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
};

function formatUrlForDisplay(url) {
    if (!url) return "";
    return url.replace(/^(https?:\/\/)?(www\.)?/, "");
}

function getInitials(name) {
    return name.trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0].toUpperCase())
        .join("") || "YN";
}

function validUrl(url) {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

function updateProfile(name) {
    if (profileImageData) {
        profileVisual.classList.remove("initials-placeholder");
        profileVisual.innerHTML = `<img src="${profileImageData}" alt="${name || "Profile"} profile image">`;
    } else {
        profileVisual.classList.add("initials-placeholder");
        profileVisual.textContent = getInitials(name);
    }
}

function updateSocialLinks() {
    const socialData = [
        { field: fields.linkedin.value, icon: svgIcons.linkedin, label: "LinkedIn" },
        { field: fields.github.value, icon: svgIcons.github, label: "GitHub" },
        { field: fields.instagram.value, icon: svgIcons.instagram, label: "Instagram" },
        { field: fields.portfolio.value, icon: svgIcons.portfolio, label: "Portfolio" }
    ];

    socialLinks.innerHTML = socialData
        .filter(item => item.field.trim())
        .map(item => `
      <a class="social-link" href="${validUrl(item.field)}" target="_blank" rel="noopener noreferrer"
         aria-label="${item.label}" title="${item.label}">
        ${item.icon}
        <span class="social-text">${formatUrlForDisplay(item.field)}</span>
      </a>
    `).join("");
}

function validateName() {
    const nameError = document.getElementById("nameError");
    const name = fields.fullName.value.trim();
    if (!name) {
        nameError.textContent = "Full Name is required.";
        fields.fullName.classList.add("input-error");
        return false;
    } else {
        nameError.textContent = "";
        fields.fullName.classList.remove("input-error");
        return true;
    }
}

function validateEmail() {
    const emailError = document.getElementById("emailError");
    const email = fields.email.value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError.textContent = "Please enter a valid email address.";
        fields.email.classList.add("input-error");
        return false;
    } else {
        emailError.textContent = "";
        fields.email.classList.remove("input-error");
        return true;
    }
}

function validateForm() {
    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    return isNameValid && isEmailValid;
}

function updatePreview() {
    const name = fields.fullName.value.trim();

    document.getElementById("previewName").textContent = name || defaultText.name;
    document.getElementById("previewTitle").textContent = fields.jobTitle.value.trim() || defaultText.title;
    document.getElementById("previewCompany").textContent = fields.company.value.trim() || defaultText.company;
    document.getElementById("previewBio").textContent = fields.bio.value.trim() || defaultText.bio;
    document.getElementById("previewEmail").textContent = fields.email.value.trim() || defaultText.email;
    document.getElementById("previewPhone").textContent = fields.phone.value.trim() || defaultText.phone;
    document.getElementById("previewLocation").textContent = fields.location.value.trim() || defaultText.location;

    document.getElementById("emailLink").href = fields.email.value.trim() ? `mailto:${fields.email.value}` : "#";
    document.getElementById("phoneLink").href = fields.phone.value.trim() ? `tel:${fields.phone.value}` : "#";

    document.getElementById("contactDetails").style.display = fields.showContact.checked ? "flex" : "none";

    card.style.setProperty("--card-accent", fields.accentColor.value);
    document.documentElement.style.setProperty("--primary", fields.accentColor.value);

    updateProfile(name);
    updateSocialLinks();
}

function saveToLocalStorage() {
    const data = {};
    Object.entries(fields).forEach(([key, field]) => {
        data[key] = field.type === "checkbox" ? field.checked : field.value;
    });

    data.profileImageData = profileImageData;
    data.selectedTemplate = selectedTemplate;
    localStorage.setItem("digitalBusinessCardData", JSON.stringify(data));
}

function loadSavedData() {
    try {
        const saved = JSON.parse(localStorage.getItem("digitalBusinessCardData"));
        if (!saved) return;

        Object.entries(fields).forEach(([key, field]) => {
            if (saved[key] !== undefined) {
                if (field.type === "checkbox") {
                    field.checked = saved[key];
                } else {
                    field.value = saved[key];
                }
            }
        });

        profileImageData = saved.profileImageData || "";
        selectedTemplate = saved.selectedTemplate || "modern";
        setTemplate(selectedTemplate, false); // Don't overwrite color picker with default on load
        updatePreview();
    } catch (error) {
        console.error("Error loading business card data from LocalStorage:", error);
        localStorage.removeItem("digitalBusinessCardData");
    }
}

function setTemplate(template, updateColorPicker = false) {
    selectedTemplate = template;
    card.className = `business-card template-${template}`;

    document.querySelectorAll(".template-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.template === template);
    });

    if (updateColorPicker && templateDefaults[template]) {
        fields.accentColor.value = templateDefaults[template];
    }
}

function showToast(message) {
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// Real-time input updates & validation
Object.entries(fields).forEach(([key, field]) => {
    field.addEventListener("input", () => {
        if (key === "fullName") validateName();
        if (key === "email") validateEmail();
        updatePreview();
    });
    field.addEventListener("change", () => {
        if (key === "fullName") validateName();
        if (key === "email") validateEmail();
        updatePreview();
    });
});

// Profile image upload
document.getElementById("profileImage").addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (optional safety cap, e.g. 2MB for storage performance)
    if (file.size > 2 * 1024 * 1024) {
        showToast("Image is too large. Please select an image under 2MB.");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = e => {
        profileImageData = e.target.result;
        updatePreview();
        showToast("Profile image uploaded successfully.");
    };
    reader.readAsDataURL(file);
});

// Template switching
document.querySelectorAll(".template-btn").forEach(button => {
    button.addEventListener("click", () => {
        const template = button.dataset.template;
        setTemplate(template, true);
        updatePreview();
        saveToLocalStorage(); // Instantly save template switch to LocalStorage
        showToast(`${button.textContent.trim()} template selected`);
    });
});

// Save button
document.getElementById("saveBtn").addEventListener("click", () => {
    if (!validateForm()) {
        showToast("Please correct the errors in the form.");
        return;
    }

    saveToLocalStorage();
    showToast("Details saved successfully to LocalStorage!");
});

// Reset button
document.getElementById("resetBtn").addEventListener("click", () => {
    document.getElementById("cardForm").reset();
    document.getElementById("profileImage").value = "";
    profileImageData = "";
    selectedTemplate = "modern";
    localStorage.removeItem("digitalBusinessCardData");
    setTemplate("modern", true);
    
    // Clear validation error displays
    document.getElementById("nameError").textContent = "";
    document.getElementById("emailError").textContent = "";
    fields.fullName.classList.remove("input-error");
    fields.email.classList.remove("input-error");

    updatePreview();
    showToast("Form and LocalStorage reset.");
});

// Download button
document.getElementById("downloadBtn").addEventListener("click", async () => {
    if (!validateForm()) {
        showToast("Please enter a valid name and email first.");
        return;
    }

    showToast("Generating PNG download...");

    try {
        // Temp adjustment to ensure high fidelity rendering
        const canvas = await html2canvas(card, {
            scale: 2,
            useCORS: true,
            backgroundColor: null,
            logging: false
        });

        const link = document.createElement("a");
        const formattedName = fields.fullName.value.trim().replace(/\s+/g, "-").toLowerCase();
        link.download = `${formattedName || "business"}-card.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        
        showToast("PNG downloaded successfully!");
    } catch (error) {
        console.error("html2canvas generation failed:", error);
        showToast("Could not download card image. Please try again.");
    }
});

// Print button
document.getElementById("printBtn").addEventListener("click", () => {
    if (!validateForm()) {
        showToast("Please enter a valid name and email first.");
        return;
    }

    showToast("Opening print view...");
    window.print();
});

// Initial Setup
loadSavedData();
if (!localStorage.getItem("digitalBusinessCardData")) {
    updatePreview();
}
