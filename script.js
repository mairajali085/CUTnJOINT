/**
 * CUT N JOINT SOLUTION - Main JavaScript File
 * Vanilla JavaScript (No frameworks or libraries)
 * Clean, modular and beginner-friendly
 */

document.addEventListener("DOMContentLoaded", function () {
  // =========================================================================
  // 1. MOBILE MENU
  // =========================================================================
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");
  const navLinks = document.querySelectorAll(".nav-link");

  if (hamburger && navMenu) {
    // Toggle mobile menu on hamburger click
    hamburger.addEventListener("click", function () {
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");
      const isExpanded = hamburger.classList.contains("active");
      hamburger.setAttribute("aria-expanded", isExpanded);
    });

    // Close menu when any navigation link is clicked
    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // =========================================================================
  // 2. SMOOTH NAVIGATION & ACTIVE SECTION HIGHLIGHT (SCROLLSPY)
  // =========================================================================
  const sections = document.querySelectorAll("section[id]");

  function highlightActiveNav() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    sections.forEach(function (section) {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      const sectionId = section.getAttribute("id");
      const correspondingLink = document.querySelector(
        '.nav-link[href*="' + sectionId + '"]'
      );

      if (correspondingLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          correspondingLink.classList.add("active");
        } else {
          correspondingLink.classList.remove("active");
        }
      }
    });
  }

  window.addEventListener("scroll", highlightActiveNav);

  // =========================================================================
  // 3. PROJECT FILTERING
  // =========================================================================
  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      // 1. Remove 'active' class from all buttons
      filterButtons.forEach(function (button) {
        button.classList.remove("active");
      });

      // 2. Add 'active' class to clicked button
      this.classList.add("active");

      // 3. Get filter value (e.g. 'all', 'renovation', 'interior', etc.)
      const filterValue = this.getAttribute("data-filter");

      // 4. Show/hide matching project cards
      projectCards.forEach(function (card) {
        const cardCategory = card.getAttribute("data-category");

        if (filterValue === "all" || cardCategory.includes(filterValue)) {
          card.style.display = "flex";
          // Add a subtle fade-in effect
          card.style.opacity = "0";
          setTimeout(function () {
            card.style.opacity = "1";
          }, 50);
        } else {
          card.style.display = "none";
        }
      });
    });
  });

  // =========================================================================
  // 4. GALLERY LIGHTBOX
  // =========================================================================
  const galleryItems = document.querySelectorAll(".gallery-item");
  const lightbox = document.getElementById("lightboxModal");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxClose = document.getElementById("lightboxClose");

  if (lightbox && lightboxImg && lightboxClose) {
    // Open lightbox when a gallery item is clicked
    galleryItems.forEach(function (item) {
      item.addEventListener("click", function () {
        const img = item.querySelector("img");
        const title = item.getAttribute("data-title") || img.alt || "Project Image";

        lightboxImg.src = img.src;
        lightboxImg.alt = title;
        if (lightboxCaption) {
          lightboxCaption.textContent = title;
        }

        lightbox.classList.add("active");
        document.body.style.overflow = "hidden"; // Prevent background scroll
      });
    });

    // Helper for chat or other modules to open image in lightbox
    window.openLightboxWithImage = function (src, title, specs) {
      if (!lightbox || !lightboxImg) return;
      lightboxImg.src = src;
      lightboxImg.alt = title || "Design Image";
      if (lightboxCaption) {
        if (specs) {
          lightboxCaption.innerHTML = `<strong style="display:block;font-size:1.1rem;color:#ffffff;margin-bottom:4px;">${title}</strong><span style="font-size:0.85rem;color:#cbd5e1;">${specs}</span>`;
        } else {
          lightboxCaption.textContent = title;
        }
      }
      lightbox.classList.add("active");
      document.body.style.overflow = "hidden";
    };

    // Close lightbox on close button click
    lightboxClose.addEventListener("click", closeLightbox);

    // Close lightbox when clicking outside the image
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    // Close lightbox on Escape key
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && lightbox.classList.contains("active")) {
        closeLightbox();
      }
    });

    function closeLightbox() {
      lightbox.classList.remove("active");
      document.body.style.overflow = ""; // Restore scrolling
    }
  }

  // =========================================================================
  // 5. BEFORE & AFTER IMAGE COMPARISON SLIDER
  // =========================================================================
  const sliderInput = document.getElementById("beforeAfterRange");
  const overlayImage = document.getElementById("comparisonOverlay");
  const sliderHandle = document.getElementById("comparisonHandle");

  if (sliderInput && overlayImage && sliderHandle) {
    function updateComparisonSlider() {
      const sliderValue = sliderInput.value;
      overlayImage.style.width = sliderValue + "%";
      sliderHandle.style.left = sliderValue + "%";
    }

    sliderInput.addEventListener("input", updateComparisonSlider);
    sliderInput.addEventListener("change", updateComparisonSlider);

    // Set initial position (50%)
    updateComparisonSlider();
  }

  // =========================================================================
  // 6. CONTACT FORM VALIDATION
  // =========================================================================
  const quoteForm = document.getElementById("quoteForm");
  const formSuccessBanner = document.getElementById("formSuccessBanner");
  const resetFormBtn = document.getElementById("resetFormBtn");

  if (quoteForm) {
    quoteForm.addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent standard page reload

      let isValid = true;

      // Inputs to validate
      const nameInput = document.getElementById("clientName");
      const phoneInput = document.getElementById("clientPhone");
      const emailInput = document.getElementById("clientEmail");
      const serviceSelect = document.getElementById("clientService");
      const messageInput = document.getElementById("clientMessage");

      // Validate Name
      if (!nameInput.value.trim()) {
        showError(nameInput, "Please enter your full name");
        isValid = false;
      } else {
        clearError(nameInput);
      }

      // Validate Phone (at least 7 digits)
      const phoneRegex = /^[\d\s+\-()]{7,}$/;
      if (!phoneInput.value.trim() || !phoneRegex.test(phoneInput.value.trim())) {
        showError(phoneInput, "Please enter a valid phone number");
        isValid = false;
      } else {
        clearError(phoneInput);
      }

      // Validate Email (if provided or standard email pattern)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailInput.value.trim() && !emailRegex.test(emailInput.value.trim())) {
        showError(emailInput, "Please enter a valid email address");
        isValid = false;
      } else {
        clearError(emailInput);
      }

      // Validate Service Selection
      if (!serviceSelect.value) {
        showError(serviceSelect, "Please choose a service");
        isValid = false;
      } else {
        clearError(serviceSelect);
      }

      // Validate Message (at least 8 characters)
      if (!messageInput.value.trim() || messageInput.value.trim().length < 8) {
        showError(messageInput, "Please briefly describe your project (minimum 8 characters)");
        isValid = false;
      } else {
        clearError(messageInput);
      }

      // If form is completely valid
      if (isValid) {
        // Collect lead details
        const locationInput = document.getElementById("clientLocation");
        const leadPayload = {
          name: nameInput.value.trim(),
          phone: phoneInput.value.trim(),
          email: emailInput.value.trim() || undefined,
          service: serviceSelect.value,
          location: locationInput && locationInput.value.trim() ? locationInput.value.trim() : "Karachi, Pakistan",
          message: messageInput.value.trim(),
          source: "Website Form"
        };

        // Send to backend JSON and Excel database
        fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(leadPayload)
        })
        .then(function (res) { return res.json(); })
        .then(function () {
          if (typeof fetchAndRenderLeads === "function") {
            fetchAndRenderLeads();
          }
        })
        .catch(function (err) {
          console.warn("Could not save lead to backend:", err);
        });

        // Hide form inputs and show success message
        quoteForm.style.display = "none";
        if (formSuccessBanner) {
          formSuccessBanner.classList.add("visible");
        }
      }
    });

    // Helper functions for error display
    function showError(inputElement, message) {
      inputElement.classList.add("error");
      const errorDiv = document.getElementById(inputElement.id + "Error");
      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add("visible");
      }
    }

    function clearError(inputElement) {
      inputElement.classList.remove("error");
      const errorDiv = document.getElementById(inputElement.id + "Error");
      if (errorDiv) {
        errorDiv.textContent = "";
        errorDiv.classList.remove("visible");
      }
    }

    // Reset button to submit another quotation
    if (resetFormBtn) {
      resetFormBtn.addEventListener("click", function () {
        quoteForm.reset();
        quoteForm.style.display = "block";
        if (formSuccessBanner) {
          formSuccessBanner.classList.remove("visible");
        }
      });
    }
  }

  // =========================================================================
  // 7. WHATSAPP BUTTON TRIGGER
  // =========================================================================
  const whatsappButtons = document.querySelectorAll(".js-whatsapp-trigger");
  const businessWhatsAppNumber = "923459268990"; // Karachi, Pakistan number: 0345-9268990
  const defaultWhatsAppMessage =
    "Assalam-o-Alaikum, I am interested in your office renovation / iron & steel fabrication services in Karachi. I would like to discuss my project.";

  whatsappButtons.forEach(function (button) {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const encodedMessage = encodeURIComponent(defaultWhatsAppMessage);
      const whatsappUrl =
        "https://wa.me/" + businessWhatsAppNumber + "?text=" + encodedMessage;
      window.open(whatsappUrl, "_blank");
    });
  });

  // =========================================================================
  // 8. IMAGE LOAD RELIABILITY & ERROR FALLBACK
  // =========================================================================
  const fallbackOfficeImg =
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80";
  const fallbackSteelImg =
    "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80";

  // =========================================================================
  // 9. GEMINI AI CUSTOMER CHATBOT
  // =========================================================================
  const chatbotWidget = document.getElementById("chatbotWidget");
  const chatbotLauncher = document.getElementById("chatbotLauncher");
  const chatbotWindow = document.getElementById("chatbotWindow");
  const chatbotCloseBtn = document.getElementById("chatbotCloseBtn");
  const chatbotResetBtn = document.getElementById("chatbotResetBtn");
  const chatbotMessages = document.getElementById("chatbotMessages");
  const chatbotForm = document.getElementById("chatbotForm");
  const chatbotInput = document.getElementById("chatbotInput");
  const chatbotSendBtn = document.getElementById("chatbotSendBtn");
  const chatbotChips = document.getElementById("chatbotChips");
  const chatQuickLeadBtn = document.getElementById("chatQuickLeadBtn");

  // Keep chat history in memory for Gemini context
  let chatHistory = [];

  // Toggle Chatbot Window
  if (chatbotLauncher && chatbotWidget) {
    chatbotLauncher.addEventListener("click", function () {
      const isOpen = chatbotWidget.classList.toggle("is-open");
      chatbotLauncher.setAttribute("aria-expanded", isOpen ? "true" : "false");
      if (chatbotWindow) {
        chatbotWindow.setAttribute("aria-hidden", isOpen ? "false" : "true");
      }
      if (isOpen && chatbotInput) {
        setTimeout(function () {
          chatbotInput.focus();
        }, 300);
      }
    });
  }

  // Close Chatbot Window
  if (chatbotCloseBtn && chatbotWidget) {
    chatbotCloseBtn.addEventListener("click", function () {
      chatbotWidget.classList.remove("is-open");
      if (chatbotLauncher) chatbotLauncher.setAttribute("aria-expanded", "false");
      if (chatbotWindow) chatbotWindow.setAttribute("aria-hidden", "true");
    });
  }

  // Reset Chat Conversation
  if (chatbotResetBtn && chatbotMessages) {
    chatbotResetBtn.addEventListener("click", function () {
      chatHistory = [];
      chatbotMessages.innerHTML = `
        <div class="chat-msg bot-msg">
          <div class="msg-bubble">
            <p><strong>Assalam-o-Alaikum!</strong> Conversation restarted. 🇵🇰</p>
            <p>Main aapki Office Renovation ya Steel Fabrication (Gates, Grills, Railings) ke hawaale se kya madad kar sakta hoon?</p>
          </div>
          <span class="msg-time">Just now</span>
        </div>
      `;
    });
  }

  // Quick Chips Click
  if (chatbotChips) {
    chatbotChips.addEventListener("click", function (e) {
      const chip = e.target.closest(".chip-btn");
      if (!chip) return;
      const msg = chip.getAttribute("data-msg") || chip.textContent.trim();
      if (chatbotInput) {
        chatbotInput.value = msg;
        if (chatbotForm) {
          chatbotForm.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      }
    });
  }

  // Helper to format text with bold, bullet points and line breaks safely
  function formatBotText(rawText) {
    if (!rawText) return "";
    // Sanitize basic html tags
    let clean = rawText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Convert markdown bold **text** to <strong>
    clean = clean.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Split lines and format
    const lines = clean.split("\n");
    let html = "";
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        if (inList) {
          html += "</ul>";
          inList = false;
        }
        continue;
      }

      if (line.startsWith("* ") || line.startsWith("- ")) {
        if (!inList) {
          html += "<ul>";
          inList = true;
        }
        html += "<li>" + line.substring(2) + "</li>";
      } else {
        if (inList) {
          html += "</ul>";
          inList = false;
        }
        html += "<p>" + line + "</p>";
      }
    }

    if (inList) {
      html += "</ul>";
    }

    return html || "<p>" + clean + "</p>";
  }

  // Helper to render Design Cards and Google Chrome Visual Search
  function renderDesignsHtml(designData) {
    if (!designData || !Array.isArray(designData.designs) || designData.designs.length === 0) {
      return "";
    }

    const categoryTitle = designData.categoryTitle || "Recommended Designs";
    const chromeSearchLink =
      designData.chromeSearchLink ||
      `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(categoryTitle)}`;

    let cardsHtml = "";
    designData.designs.forEach(function (item) {
      const safeTitle = (item.title || "").replace(/"/g, "&quot;");
      const safeSpecs = (item.specs || "").replace(/"/g, "&quot;");
      const safeDesc = (item.description || "").replace(/"/g, "&quot;");
      const chromeUrl =
        item.chromeSearchUrl ||
        `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(item.title)}`;

      cardsHtml += `
        <div class="chat-design-card">
          <div class="chat-design-img-wrap js-design-img-preview" data-src="${item.imageUrl}" data-title="${safeTitle}" data-specs="${safeSpecs}">
            <img src="${item.imageUrl}" alt="${safeTitle}" loading="lazy" />
            <div class="chat-design-zoom-hint">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
              <span>Tap to Expand</span>
            </div>
          </div>
          <div class="chat-design-details">
            <h5 class="chat-design-title">${item.title}</h5>
            <div class="chat-design-spec-badge">${item.specs}</div>
            <p class="chat-design-desc">${item.description}</p>
            <div class="chat-design-btn-row">
              <a href="${chromeUrl}" target="_blank" rel="noopener noreferrer" class="btn-chrome-link" title="Open similar design search in Google Chrome">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>
                <span>View on Chrome</span>
              </a>
              <button type="button" class="btn-select-design js-select-design-btn" data-title="${safeTitle}">
                Select Design
              </button>
            </div>
          </div>
        </div>
      `;
    });

    return `
      <div class="chat-designs-block">
        <div class="chat-designs-title-bar">
          <div class="chat-designs-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>Verified Designs &amp; Specifications</span>
          </div>
          <span class="chat-designs-cat">${categoryTitle}</span>
        </div>

        <div class="chat-designs-cards">
          ${cardsHtml}
        </div>

        <div class="chat-chrome-full-wrap">
          <a href="${chromeSearchLink}" target="_blank" rel="noopener noreferrer" class="chat-chrome-cta-btn" title="Open Google Chrome Image Search for 100+ more live designs">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span>Search 100+ More Designs on Google Chrome</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      </div>
    `;
  }

  // Append Message to UI
  function appendChatMessage(role, text, designData) {
    if (!chatbotMessages) return;
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-msg " + (role === "user" ? "user-msg" : "bot-msg");

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (role === "user") {
      const safeText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      msgDiv.innerHTML = `
        <div class="msg-bubble">
          <p>${safeText}</p>
        </div>
        <span class="msg-time">${timeStr}</span>
      `;
    } else {
      const designsHtml = designData && designData.designs && designData.designs.length > 0
        ? renderDesignsHtml(designData)
        : "";

      msgDiv.innerHTML = `
        <div class="msg-bubble">
          ${formatBotText(text)}
          ${designsHtml}
        </div>
        <span class="msg-time">${timeStr}</span>
      `;

      // Attach event listeners for image zoom
      const previewTriggers = msgDiv.querySelectorAll(".js-design-img-preview");
      previewTriggers.forEach(function (trigger) {
        trigger.addEventListener("click", function () {
          const src = trigger.getAttribute("data-src");
          const title = trigger.getAttribute("data-title");
          const specs = trigger.getAttribute("data-specs");
          if (typeof window.openLightboxWithImage === "function") {
            window.openLightboxWithImage(src, title, specs);
          }
        });
      });

      // Attach event listeners for "Select Design" button
      const selectBtns = msgDiv.querySelectorAll(".js-select-design-btn");
      selectBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          const title = btn.getAttribute("data-title") || "Selected Design";
          if (chatbotInput && chatbotForm) {
            chatbotInput.value = `Mujhe yeh design (${title}) pasand aya hai. Iska estimated cost aur Karachi me free measurement visit schedule karein.`;
            chatbotForm.dispatchEvent(new Event("submit", { cancelable: true }));
          }
        });
      });
    }

    chatbotMessages.appendChild(msgDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  // Typing Indicator helper
  function showTypingIndicator() {
    if (!chatbotMessages) return null;
    const typingDiv = document.createElement("div");
    typingDiv.className = "chat-msg bot-msg typing-msg";
    typingDiv.id = "chatTypingIndicator";
    typingDiv.innerHTML = `
      <div class="msg-bubble">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    chatbotMessages.appendChild(typingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return typingDiv;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById("chatTypingIndicator");
    if (indicator) {
      indicator.remove();
    }
  }

  // Handle Chatbot Form Submit
  if (chatbotForm && chatbotInput) {
    chatbotForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const userMessage = chatbotInput.value.trim();
      if (!userMessage) return;

      // Append user message to UI
      appendChatMessage("user", userMessage);
      chatbotInput.value = "";

      // Show typing indicator
      showTypingIndicator();
      if (chatbotSendBtn) chatbotSendBtn.disabled = true;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            history: chatHistory
          })
        });

        const data = await response.json();
        removeTypingIndicator();

        const botReply = data.reply || "Shukriya! Aap mazeed details ke liye 0345-9268990 par call ya WhatsApp kar sakte hain.";
        appendChatMessage("bot", botReply, data);

        // Update history
        chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
        chatHistory.push({ role: "model", parts: [{ text: botReply }] });

        // Keep last 10 messages
        if (chatHistory.length > 10) {
          chatHistory = chatHistory.slice(-10);
        }
      } catch (err) {
        removeTypingIndicator();
        appendChatMessage(
          "bot",
          "Main filhal offline hoon lekin aap hamari team se direct rabta kar sakte hain:\n* Phone/WhatsApp: **0345-9268990**\n* Email: **mairajali085@gmail.com**\n* Address: **Area A, House No. 59, Korangi No. 6, Karachi**"
        );
      } finally {
        if (chatbotSendBtn) chatbotSendBtn.disabled = false;
        if (chatbotInput) chatbotInput.focus();
      }
    });
  }

  // Quick Lead Callback inside Chat
  if (chatQuickLeadBtn) {
    chatQuickLeadBtn.addEventListener("click", function () {
      const clientName = prompt("Aapka Naam kya hai? (Enter your Name):");
      if (!clientName || !clientName.trim()) return;

      const clientPhone = prompt("Aapka Contact Number kya hai? (Phone / WhatsApp):");
      if (!clientPhone || !clientPhone.trim()) return;

      const clientNeed = prompt("Kis cheez ka kaam karwana hai? (Office Renovation, Steel Gate, Railing, etc.):", "Office Renovation / Steel Fabrication");

      // Save lead directly to database
      fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientName.trim(),
          phone: clientPhone.trim(),
          service: clientNeed || "General Inquiry",
          location: "Karachi, Pakistan",
          message: "Requested quick call back via AI Customer Chatbot",
          source: "AI Chatbot"
        })
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        appendChatMessage(
          "bot",
          `Shukriya **${clientName.trim()}** sahab! 🎉\n\nAapki inquiry **#${data.lead ? data.lead.id : ""}** register ho gayi hai aur database me save ho chuki hai.\n\nHamari technical team **0345-9268990** se aapko Karachi office ki janib se foran call/WhatsApp karegi.`
        );
        if (typeof fetchAndRenderLeads === "function") {
          fetchAndRenderLeads();
        }
      })
      .catch(function () {
        appendChatMessage(
          "bot",
          `Shukriya **${clientName.trim()}**! Aap please direct **0345-9268990** par WhatsApp kar dein taake hum foran rabta kar sakein.`
        );
      });
    });
  }

  // =========================================================================
  // 10. PUBLIC CLIENT RATINGS & REVIEWS ENGINE (DATABASE INTEGRATION)
  // =========================================================================
  const avgRatingScore = document.getElementById("avgRatingScore");
  const avgStarsDisplay = document.getElementById("avgStarsDisplay");
  const totalReviewsCount = document.getElementById("totalReviewsCount");
  const reviewsGrid = document.getElementById("reviewsGrid");
  const reviewsEmptyState = document.getElementById("reviewsEmptyState");

  // Client Review Submission Elements
  const reviewModal = document.getElementById("reviewModal");
  const openReviewModalBtn = document.getElementById("openReviewModalBtn");
  const reviewModalClose = document.getElementById("reviewModalClose");
  const submitReviewForm = document.getElementById("submitReviewForm");
  const starRatingSelector = document.getElementById("starRatingSelector");
  const ratingFeedbackLabel = document.getElementById("ratingFeedbackLabel");
  const reviewRatingInput = document.getElementById("reviewRatingInput");
  const reviewSuccessBanner = document.getElementById("reviewSuccessBanner");

  let currentSelectedRating = 5;

  // Star Rating feedback helper
  const ratingFeedbackTexts = {
    1: "1.0 / 5.0 - Poor Experience",
    2: "2.0 / 5.0 - Fair / Needs Improvement",
    3: "3.0 / 5.0 - Good Work",
    4: "4.0 / 5.0 - Very Good Craftsmanship",
    5: "5.0 / 5.0 - Outstanding Work & Top Quality!"
  };

  // Helper to generate star string
  function getStarSymbols(rating) {
    const r = Math.round(Number(rating) || 5);
    return "★".repeat(Math.max(1, Math.min(5, r))) + "☆".repeat(Math.max(0, 5 - r));
  }

  // Fetch and Render Public Reviews
  window.fetchAndRenderPublicReviews = async function () {
    try {
      const response = await fetch("/api/reviews");
      const data = await response.json();
      if (!data.success) return;

      const reviews = data.reviews || [];
      const stats = data.stats || { average: 5, total: 0 };

      // Update Rating summary banner
      if (avgRatingScore) avgRatingScore.textContent = stats.average.toFixed(1);
      if (avgStarsDisplay) avgStarsDisplay.textContent = getStarSymbols(stats.average);
      if (totalReviewsCount) totalReviewsCount.textContent = stats.total;

      // Render Reviews Grid
      if (!reviewsGrid) return;
      reviewsGrid.innerHTML = "";

      if (reviews.length === 0) {
        if (reviewsEmptyState) reviewsEmptyState.style.display = "block";
        return;
      }

      if (reviewsEmptyState) reviewsEmptyState.style.display = "none";

      reviews.forEach(function (rev) {
        // Initials for avatar
        const initials = (rev.name || "CL")
          .split(" ")
          .map(function (n) { return n[0]; })
          .slice(0, 2)
          .join("")
          .toUpperCase() || "CL";

        const card = document.createElement("div");
        card.className = "testimonial-card";
        card.innerHTML = `
          <div class="testimonial-stars" style="color: #f59e0b; font-size: 1.15rem; margin-bottom: 0.75rem;">
            ${getStarSymbols(rev.rating)}
            <span style="font-size: 0.78rem; font-weight: 700; color: #16a34a; background: #dcfce7; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">✓ Verified Client</span>
          </div>
          <p class="testimonial-quote">
            "${escapeHtml(rev.comment || "")}"
          </p>
          <div class="testimonial-author">
            <div class="testimonial-avatar" style="background: #1e293b; color: #f59e0b; font-weight: 700;">${escapeHtml(initials)}</div>
            <div>
              <h4 class="testimonial-name">${escapeHtml(rev.name || "Client")}</h4>
              <span class="testimonial-business">${escapeHtml(rev.locationOrCompany || "Karachi")} • <strong style="color: #d97706;">${escapeHtml(rev.service || "Renovation")}</strong></span>
              ${rev.timestamp ? `<div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">${escapeHtml(rev.timestamp)}</div>` : ""}
            </div>
          </div>
        `;
        reviewsGrid.appendChild(card);
      });
    } catch (err) {
      console.error("Failed to load customer reviews:", err);
    }
  };

  // Setup Review Star Selector
  if (starRatingSelector) {
    const starBtns = starRatingSelector.querySelectorAll(".star-btn");
    starBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const rating = parseInt(btn.getAttribute("data-rating"), 10) || 5;
        currentSelectedRating = rating;
        if (reviewRatingInput) reviewRatingInput.value = rating;
        if (ratingFeedbackLabel) ratingFeedbackLabel.textContent = ratingFeedbackTexts[rating] || `${rating}.0 / 5.0`;

        // Update active stars styling
        starBtns.forEach(function (b) {
          const r = parseInt(b.getAttribute("data-rating"), 10);
          if (r <= rating) {
            b.classList.add("active");
          } else {
            b.classList.remove("active");
          }
        });
      });
    });
  }

  // Open Review Submission Modal
  if (openReviewModalBtn && reviewModal) {
    openReviewModalBtn.addEventListener("click", function () {
      reviewModal.classList.add("active");
      if (reviewSuccessBanner) reviewSuccessBanner.style.display = "none";
      if (submitReviewForm) {
        submitReviewForm.style.display = "block";
        submitReviewForm.reset();
        currentSelectedRating = 5;
        if (reviewRatingInput) reviewRatingInput.value = 5;
        if (ratingFeedbackLabel) ratingFeedbackLabel.textContent = ratingFeedbackTexts[5];
        if (starRatingSelector) {
          starRatingSelector.querySelectorAll(".star-btn").forEach(function (b) { b.classList.add("active"); });
        }
      }
    });
  }

  // Close Review Modal
  if (reviewModalClose && reviewModal) {
    reviewModalClose.addEventListener("click", function () {
      reviewModal.classList.remove("active");
    });
  }

  if (reviewModal) {
    reviewModal.addEventListener("click", function (e) {
      if (e.target === reviewModal) {
        reviewModal.classList.remove("active");
      }
    });
  }

  // Handle Review Submission
  if (submitReviewForm) {
    submitReviewForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const submitBtn = document.getElementById("submitReviewBtn");
      const name = (document.getElementById("reviewNameInput")?.value || "").trim();
      const location = (document.getElementById("reviewLocationInput")?.value || "").trim();
      const service = document.getElementById("reviewServiceInput")?.value || "Office Renovation";
      const comment = (document.getElementById("reviewCommentInput")?.value || "").trim();
      const rating = parseInt(reviewRatingInput?.value || "5", 10);

      if (!name || !location || !comment) {
        alert("Please fill in all required fields.");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "Saving to Database...";
      }

      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name,
            locationOrCompany: location,
            service: service,
            rating: rating,
            comment: comment
          })
        });

        const data = await res.json();
        if (data.success) {
          if (submitReviewForm) submitReviewForm.style.display = "none";
          if (reviewSuccessBanner) reviewSuccessBanner.style.display = "block";

          // Refresh public reviews & admin reviews
          window.fetchAndRenderPublicReviews();
          if (typeof window.fetchAndRenderAdminReviews === "function") {
            window.fetchAndRenderAdminReviews();
          }

          setTimeout(function () {
            if (reviewModal) reviewModal.classList.remove("active");
          }, 2400);
        } else {
          alert("Error submitting review. Please try again.");
        }
      } catch (err) {
        console.error("Submit review error:", err);
        alert("Could not submit review at this moment. Please check connection.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `Submit Verified Rating <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        }
      }
    });
  }

  // Initial load of customer reviews
  window.fetchAndRenderPublicReviews();

  // =========================================================================
  // 11. ADMIN PANEL, LEADS & DATABASE PORTAL (WITH EXCEL SHEET HOUSING)
  // =========================================================================
  const adminModal = document.getElementById("adminModal") || document.getElementById("leadsModal");
  const adminModalClose = document.getElementById("adminModalClose") || document.getElementById("leadsModalClose");
  const openAdminBtns = document.querySelectorAll(".js-open-admin-btn, #headerAdminBtn, #navAdminLink, #footerAdminLink, #headerLeadsBtn, #navLeadsSheetLink");

  const adminAuthView = document.getElementById("adminAuthView");
  const adminDashboardView = document.getElementById("adminDashboardView");
  const adminLoginForm = document.getElementById("adminLoginForm");
  const adminPinInput = document.getElementById("adminPinInput");
  const adminLoginError = document.getElementById("adminLoginError");
  const adminLoginSubmitBtn = document.getElementById("adminLoginSubmitBtn");
  const adminAuthCancelBtn = document.getElementById("adminAuthCancelBtn");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");

  // Tabs Elements
  const adminTabLeadsBtn = document.getElementById("adminTabLeadsBtn");
  const adminTabReviewsBtn = document.getElementById("adminTabReviewsBtn");
  const adminTabLeadsContent = document.getElementById("adminTabLeadsContent");
  const adminTabReviewsContent = document.getElementById("adminTabReviewsContent");
  const leadsTabActions = document.getElementById("leadsTabActions");
  const reviewsTabActions = document.getElementById("reviewsTabActions");
  const adminBadgeLeadsCount = document.getElementById("adminBadgeLeadsCount");
  const adminBadgeReviewsCount = document.getElementById("adminBadgeReviewsCount");

  // Leads Table & Elements
  const leadsTableBody = document.getElementById("leadsTableBody");
  const leadsEmptyState = document.getElementById("leadsEmptyState");
  const leadsSearchInput = document.getElementById("leadsSearchInput");
  const refreshLeadsBtn = document.getElementById("refreshLeadsBtn");
  const statTotalLeads = document.getElementById("statTotalLeads");
  const statNewLeads = document.getElementById("statNewLeads");
  const statRenovationLeads = document.getElementById("statRenovationLeads");
  const statSteelLeads = document.getElementById("statSteelLeads");

  // Reviews Database Table & Elements in Admin
  const adminReviewsTableBody = document.getElementById("adminReviewsTableBody");
  const adminReviewsEmptyState = document.getElementById("adminReviewsEmptyState");
  const reviewsSearchInput = document.getElementById("reviewsSearchInput");
  const refreshReviewsBtn = document.getElementById("refreshReviewsBtn");
  const adminStatAvgRating = document.getElementById("adminStatAvgRating");
  const adminStatTotalReviews = document.getElementById("adminStatTotalReviews");
  const adminStatApprovedReviews = document.getElementById("adminStatApprovedReviews");
  const adminStatFiveStars = document.getElementById("adminStatFiveStars");

  let allLeadsData = [];
  let allReviewsData = [];

  // Authentication State Checker
  function isAdminLoggedIn() {
    return sessionStorage.getItem("apex_admin_auth") === "true";
  }

  function setAdminLoggedIn(token) {
    sessionStorage.setItem("apex_admin_auth", "true");
    if (token) sessionStorage.setItem("apex_admin_token", token);
  }

  function setAdminLoggedOut() {
    sessionStorage.removeItem("apex_admin_auth");
    sessionStorage.removeItem("apex_admin_token");
  }

  function updateAdminView() {
    if (isAdminLoggedIn()) {
      if (adminAuthView) adminAuthView.style.display = "none";
      if (adminDashboardView) adminDashboardView.style.display = "flex";
      window.fetchAndRenderLeads();
      window.fetchAndRenderAdminReviews();
    } else {
      if (adminAuthView) adminAuthView.style.display = "flex";
      if (adminDashboardView) adminDashboardView.style.display = "none";
      if (adminPinInput) {
        adminPinInput.value = "";
        setTimeout(function () { adminPinInput.focus(); }, 150);
      }
      if (adminLoginError) adminLoginError.style.display = "none";
    }
  }

  // Open Admin Modal
  openAdminBtns.forEach(function (btn) {
    if (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (adminModal) {
          adminModal.classList.add("is-active");
          updateAdminView();
        }
      });
    }
  });

  // Close Admin Modal
  if (adminModalClose && adminModal) {
    adminModalClose.addEventListener("click", function () {
      adminModal.classList.remove("is-active");
    });
  }

  if (adminAuthCancelBtn && adminModal) {
    adminAuthCancelBtn.addEventListener("click", function () {
      adminModal.classList.remove("is-active");
    });
  }

  if (adminModal) {
    adminModal.addEventListener("click", function (e) {
      if (e.target === adminModal) {
        adminModal.classList.remove("is-active");
      }
    });
  }

  // Admin PIN Login Form Submit
  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const pin = (adminPinInput?.value || "").trim();
      if (!pin) return;

      if (adminLoginSubmitBtn) {
        adminLoginSubmitBtn.disabled = true;
        adminLoginSubmitBtn.innerHTML = "Verifying PIN...";
      }
      if (adminLoginError) adminLoginError.style.display = "none";

      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: pin })
        });
        const data = await res.json();

        if (data.success) {
          setAdminLoggedIn(data.token);
          updateAdminView();
        } else {
          if (adminLoginError) {
            adminLoginError.textContent = data.message || "Invalid security PIN. Default owner PIN is 1234.";
            adminLoginError.style.display = "block";
          }
          if (adminPinInput) adminPinInput.select();
        }
      } catch (err) {
        if (adminLoginError) {
          adminLoginError.textContent = "Server communication error. Please try again.";
          adminLoginError.style.display = "block";
        }
      } finally {
        if (adminLoginSubmitBtn) {
          adminLoginSubmitBtn.disabled = false;
          adminLoginSubmitBtn.innerHTML = `Unlock Admin Panel <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
        }
      }
    });
  }

  // Admin Logout / Lock Button
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", function () {
      setAdminLoggedOut();
      updateAdminView();
    });
  }

  // Tabs Switching
  if (adminTabLeadsBtn && adminTabReviewsBtn) {
    adminTabLeadsBtn.addEventListener("click", function () {
      adminTabLeadsBtn.classList.add("active");
      adminTabReviewsBtn.classList.remove("active");
      if (adminTabLeadsContent) adminTabLeadsContent.style.display = "block";
      if (adminTabReviewsContent) adminTabReviewsContent.style.display = "none";
      if (leadsTabActions) leadsTabActions.style.display = "flex";
      if (reviewsTabActions) reviewsTabActions.style.display = "none";
    });

    adminTabReviewsBtn.addEventListener("click", function () {
      adminTabReviewsBtn.classList.add("active");
      adminTabLeadsBtn.classList.remove("active");
      if (adminTabReviewsContent) adminTabReviewsContent.style.display = "block";
      if (adminTabLeadsContent) adminTabLeadsContent.style.display = "none";
      if (reviewsTabActions) reviewsTabActions.style.display = "flex";
      if (leadsTabActions) leadsTabActions.style.display = "none";
      window.fetchAndRenderAdminReviews();
    });
  }

  // -------------------------------------------------------------
  // TAB 1: LEADS DATA & EXCEL LOGIC
  // -------------------------------------------------------------
  window.fetchAndRenderLeads = async function () {
    try {
      const response = await fetch("/api/leads");
      const data = await response.json();
      allLeadsData = data.leads || [];
      renderLeadsTable(allLeadsData);
      updateLeadsStats(allLeadsData);
      if (adminBadgeLeadsCount) adminBadgeLeadsCount.textContent = allLeadsData.length;
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    }
  };

  function updateLeadsStats(leads) {
    if (!statTotalLeads) return;
    statTotalLeads.textContent = leads.length;

    const newCount = leads.filter(function (l) {
      return (l.status || "New").toLowerCase() === "new";
    }).length;
    if (statNewLeads) statNewLeads.textContent = newCount;

    const renoCount = leads.filter(function (l) {
      const s = (l.service || "").toLowerCase();
      return s.includes("renovation") || s.includes("interior") || s.includes("ceiling") || s.includes("partition");
    }).length;
    if (statRenovationLeads) statRenovationLeads.textContent = renoCount;

    const steelCount = leads.filter(function (l) {
      const s = (l.service || "").toLowerCase();
      return s.includes("steel") || s.includes("iron") || s.includes("gate") || s.includes("railing") || s.includes("grill") || s.includes("fabrication");
    }).length;
    if (statSteelLeads) statSteelLeads.textContent = steelCount;
  }

  function renderLeadsTable(leadsToRender) {
    if (!leadsTableBody) return;
    leadsTableBody.innerHTML = "";

    if (!leadsToRender || leadsToRender.length === 0) {
      if (leadsEmptyState) leadsEmptyState.style.display = "block";
      return;
    }

    if (leadsEmptyState) leadsEmptyState.style.display = "none";

    leadsToRender.forEach(function (lead) {
      const tr = document.createElement("tr");

      let formattedDate = lead.createdAt || "";
      try {
        const d = new Date(lead.createdAt);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString("en-PK", {
            day: "numeric",
            month: "short",
            year: "numeric"
          });
        }
      } catch (_) {}

      tr.innerHTML = `
        <td><span class="lead-id-badge">#${lead.id}</span></td>
        <td><span style="white-space: nowrap; font-size: 0.82rem; color: #64748b;">${formattedDate}</span></td>
        <td><strong>${escapeHtml(lead.name || "N/A")}</strong>${lead.email ? `<br><small style="color: #64748b;">${escapeHtml(lead.email)}</small>` : ""}</td>
        <td><a href="tel:${escapeHtml(lead.phone || "")}" class="lead-phone-link">${escapeHtml(lead.phone || "N/A")}</a></td>
        <td><span style="font-weight: 600; color: #334155;">${escapeHtml(lead.service || "General")}</span></td>
        <td><small style="color: #475569;">${escapeHtml(lead.location || "Karachi")}</small></td>
        <td style="max-width: 200px;"><div style="max-height: 48px; overflow: hidden; text-overflow: ellipsis; font-size: 0.82rem;" title="${escapeHtml(lead.message || "")}">${escapeHtml(lead.message || "-")}</div></td>
        <td><span style="font-size: 0.75rem; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${escapeHtml(lead.source || "Website")}</span></td>
        <td>
          <select class="status-select" data-id="${lead.id}" style="font-size: 0.78rem; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; background: #fff; font-weight: 600;">
            <option value="New" ${lead.status === "New" ? "selected" : ""}>New</option>
            <option value="Contacted" ${lead.status === "Contacted" ? "selected" : ""}>Contacted</option>
            <option value="In Progress" ${lead.status === "In Progress" ? "selected" : ""}>In Progress</option>
            <option value="Completed" ${lead.status === "Completed" ? "selected" : ""}>Completed</option>
          </select>
        </td>
        <td>
          <button type="button" class="btn-delete-lead" data-id="${lead.id}" title="Delete inquiry">Delete</button>
        </td>
      `;

      leadsTableBody.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  if (refreshLeadsBtn) {
    refreshLeadsBtn.addEventListener("click", function () {
      window.fetchAndRenderLeads();
    });
  }

  if (leadsSearchInput) {
    leadsSearchInput.addEventListener("input", function (e) {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        renderLeadsTable(allLeadsData);
        return;
      }
      const filtered = allLeadsData.filter(function (lead) {
        return (
          (lead.name || "").toLowerCase().includes(q) ||
          (lead.phone || "").toLowerCase().includes(q) ||
          (lead.service || "").toLowerCase().includes(q) ||
          (lead.location || "").toLowerCase().includes(q) ||
          (lead.message || "").toLowerCase().includes(q)
        );
      });
      renderLeadsTable(filtered);
    });
  }

  if (leadsTableBody) {
    leadsTableBody.addEventListener("change", async function (e) {
      if (e.target.classList.contains("status-select")) {
        const leadId = e.target.getAttribute("data-id");
        const newStatus = e.target.value;
        try {
          await fetch("/api/leads/" + leadId, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
          });
          const found = allLeadsData.find(function (l) { return String(l.id) === String(leadId); });
          if (found) found.status = newStatus;
          updateLeadsStats(allLeadsData);
        } catch (err) {
          console.error("Failed to update status:", err);
        }
      }
    });

    leadsTableBody.addEventListener("click", async function (e) {
      if (e.target.classList.contains("btn-delete-lead")) {
        const leadId = e.target.getAttribute("data-id");
        if (confirm(`Are you sure you want to delete inquiry #${leadId}?`)) {
          try {
            await fetch("/api/leads/" + leadId, { method: "DELETE" });
            allLeadsData = allLeadsData.filter(function (l) { return String(l.id) !== String(leadId); });
            renderLeadsTable(allLeadsData);
            updateLeadsStats(allLeadsData);
            if (adminBadgeLeadsCount) adminBadgeLeadsCount.textContent = allLeadsData.length;
          } catch (err) {
            console.error("Failed to delete lead:", err);
          }
        }
      }
    });
  }

  // -------------------------------------------------------------
  // TAB 2: RATINGS & REVIEWS DATABASE ADMIN LOGIC
  // -------------------------------------------------------------
  window.fetchAndRenderAdminReviews = async function () {
    try {
      const response = await fetch("/api/reviews?all=true");
      const data = await response.json();
      allReviewsData = data.reviews || [];
      renderAdminReviewsTable(allReviewsData);
      updateAdminReviewsStats(data.stats, allReviewsData);
      if (adminBadgeReviewsCount) adminBadgeReviewsCount.textContent = allReviewsData.length;
    } catch (err) {
      console.error("Failed to fetch admin reviews:", err);
    }
  };

  function updateAdminReviewsStats(stats, reviews) {
    if (adminStatAvgRating && stats) {
      adminStatAvgRating.textContent = Number(stats.average || 5).toFixed(1);
    }
    if (adminStatTotalReviews) adminStatTotalReviews.textContent = reviews.length;

    const approvedCount = reviews.filter(function (r) {
      return (r.status || "approved").toLowerCase() === "approved";
    }).length;
    if (adminStatApprovedReviews) adminStatApprovedReviews.textContent = approvedCount;

    const fiveStarCount = reviews.filter(function (r) {
      return Number(r.rating) === 5;
    }).length;
    if (adminStatFiveStars) adminStatFiveStars.textContent = fiveStarCount;
  }

  function renderAdminReviewsTable(reviewsToRender) {
    if (!adminReviewsTableBody) return;
    adminReviewsTableBody.innerHTML = "";

    if (!reviewsToRender || reviewsToRender.length === 0) {
      if (adminReviewsEmptyState) adminReviewsEmptyState.style.display = "block";
      return;
    }

    if (adminReviewsEmptyState) adminReviewsEmptyState.style.display = "none";

    reviewsToRender.forEach(function (rev) {
      const tr = document.createElement("tr");
      const isApproved = (rev.status || "approved").toLowerCase() === "approved";

      tr.innerHTML = `
        <td><span class="lead-id-badge">${escapeHtml(rev.id)}</span></td>
        <td><span style="white-space: nowrap; font-size: 0.82rem; color: #64748b;">${escapeHtml(rev.timestamp || "")}</span></td>
        <td><strong>${escapeHtml(rev.name || "Client")}</strong></td>
        <td><span style="font-size: 0.82rem; color: #475569;">${escapeHtml(rev.locationOrCompany || "-")}</span></td>
        <td><span style="font-weight: 600; color: #334155; font-size: 0.82rem;">${escapeHtml(rev.service || "Renovation")}</span></td>
        <td><span style="color: #f59e0b; font-weight: 700; white-space: nowrap;">${"★".repeat(rev.rating)} (${rev.rating})</span></td>
        <td style="max-width: 250px;"><div style="max-height: 48px; overflow: hidden; text-overflow: ellipsis; font-size: 0.82rem;" title="${escapeHtml(rev.comment || "")}">${escapeHtml(rev.comment || "-")}</div></td>
        <td>
          <span class="status-badge ${isApproved ? "approved" : "hidden"}">
            ${isApproved ? "Approved" : "Hidden"}
          </span>
        </td>
        <td>
          <div class="admin-actions-cell">
            <button type="button" class="btn-toggle-review" data-id="${rev.id}" data-status="${isApproved ? "hidden" : "approved"}" title="${isApproved ? "Hide this review from website" : "Approve and show on website"}">
              ${isApproved ? "Hide" : "Approve"}
            </button>
            <button type="button" class="btn-delete-lead" data-id="${rev.id}" data-type="review" title="Delete review">Delete</button>
          </div>
        </td>
      `;

      adminReviewsTableBody.appendChild(tr);
    });
  }

  if (refreshReviewsBtn) {
    refreshReviewsBtn.addEventListener("click", function () {
      window.fetchAndRenderAdminReviews();
    });
  }

  if (reviewsSearchInput) {
    reviewsSearchInput.addEventListener("input", function (e) {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        renderAdminReviewsTable(allReviewsData);
        return;
      }
      const filtered = allReviewsData.filter(function (rev) {
        return (
          (rev.name || "").toLowerCase().includes(q) ||
          (rev.service || "").toLowerCase().includes(q) ||
          (rev.locationOrCompany || "").toLowerCase().includes(q) ||
          (rev.comment || "").toLowerCase().includes(q) ||
          (rev.id || "").toLowerCase().includes(q)
        );
      });
      renderAdminReviewsTable(filtered);
    });
  }

  if (adminReviewsTableBody) {
    adminReviewsTableBody.addEventListener("click", async function (e) {
      // Toggle review visibility
      if (e.target.classList.contains("btn-toggle-review")) {
        const revId = e.target.getAttribute("data-id");
        const newStatus = e.target.getAttribute("data-status");
        try {
          await fetch("/api/reviews/" + revId, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
          });
          // Update in local array
          const found = allReviewsData.find(function (r) { return r.id === revId; });
          if (found) found.status = newStatus;
          renderAdminReviewsTable(allReviewsData);
          window.fetchAndRenderPublicReviews();
        } catch (err) {
          console.error("Failed to toggle review status:", err);
        }
      }

      // Delete review
      if (e.target.classList.contains("btn-delete-lead") && e.target.getAttribute("data-type") === "review") {
        const revId = e.target.getAttribute("data-id");
        if (confirm(`Are you sure you want to delete customer review #${revId}?`)) {
          try {
            await fetch("/api/reviews/" + revId, { method: "DELETE" });
            allReviewsData = allReviewsData.filter(function (r) { return r.id !== revId; });
            renderAdminReviewsTable(allReviewsData);
            window.fetchAndRenderPublicReviews();
            if (adminBadgeReviewsCount) adminBadgeReviewsCount.textContent = allReviewsData.length;
          } catch (err) {
            console.error("Failed to delete review:", err);
          }
        }
      }
    });
  }

  // Pre-load background counters
  window.fetchAndRenderLeads();
});
