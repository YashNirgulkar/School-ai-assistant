const roles = {
  student: { label: "Student", icon: "S", detail: "Rahul Sharma · Class 9-A", id: "stu-rahul", persona: "Your friendly academic companion", prompts: ["What is my attendance?", "Show my recent attendance", "Talk to Teacher"] },
  parent: { label: "Parent", icon: "P", detail: "Priya Sharma · Rahul's parent", id: "par-priya", persona: "Your caring parent support assistant", prompts: ["How much attendance does my child have?", "Show recent attendance", "Talk to Teacher"] },
  teacher: { label: "Teacher", icon: "T", detail: "Meera Iyer · Mathematics", id: "tch-meera", persona: "Your professional teaching assistant", prompts: ["Mark Rahul absent today", "Mark Rahul present today", "Show class attendance"] },
  principal: { label: "Principal", icon: "D", detail: "Dr. Arvind Rao · School leadership", id: "prn-arvind", persona: "Your professional management assistant", prompts: ["What is the overall attendance?", "Contact School Management"] }
};

const state = { role: "parent", sessionId: null, language: "en", listening: false };
const elements = {
  roles: document.querySelector("#role-list"),
  conversation: document.querySelector("#conversation"),
  suggestions: document.querySelector("#suggestions"),
  form: document.querySelector("#composer"),
  input: document.querySelector("#message"),
  language: document.querySelector("#language"),
  title: document.querySelector("#chat-title"),
  persona: document.querySelector("#persona"),
  sessionRole: document.querySelector("#session-role"),
  avatarMessage: document.querySelector("#avatar-message"),
  avatar: document.querySelector("#avatar-stage"),
  mic: document.querySelector("#mic"),
  voiceStatus: document.querySelector("#voice-status"),
  voiceState: document.querySelector("#voice-state"),
  newSession: document.querySelector("#new-session"),
  template: document.querySelector("#message-template")
};

function timeNow() {
  return new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date());
}

function renderRoles() {
  elements.roles.innerHTML = "";
  Object.entries(roles).forEach(function(entry) {
    const key = entry[0];
    const role = entry[1];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "role-option" + (key === state.role ? " active" : "");
    button.innerHTML = '<span class="role-icon">' + role.icon + '</span><span class="role-copy"><strong>' + role.label + '</strong><small>' + role.detail + '</small></span>';
    button.addEventListener("click", function() { chooseRole(key); });
    elements.roles.appendChild(button);
  });
}

function setSuggestions(items) {
  elements.suggestions.innerHTML = "";
  (items || []).slice(0, 3).forEach(function(text) {
    const button = document.createElement("button");
    button.className = "suggestion";
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", function() {
      if (/yes, submit/i.test(text)) sendMessage("Yes");
      else if (/not now/i.test(text)) sendMessage("Not now");
      else sendMessage(text);
    });
    elements.suggestions.appendChild(button);
  });
}

function addMessage(text, author, data) {
  const node = elements.template.content.firstElementChild.cloneNode(true);
  node.classList.toggle("user", author === "user");
  node.querySelector(".message-avatar").setAttribute("aria-hidden", "true");
  node.querySelector(".message-bubble").textContent = text;
  node.querySelector("time").textContent = author === "user" ? "You · " + timeNow() : "Maya · " + timeNow();
  if (data && author !== "user") node.querySelector("div:last-child").appendChild(makeInfoCard(data));
  elements.conversation.appendChild(node);
  elements.conversation.scrollTop = elements.conversation.scrollHeight;
}

function makeInfoCard(data) {
  const card = document.createElement("div");
  card.className = "info-card" + (data.type === "school-analytics" ? " analytics" : "");
  if (data.type === "attendance") {
    card.innerHTML = '<div class="metric">' + data.value + '%</div><p><strong>' + data.student + '</strong><br>Attendance updated securely from the mock ERP.</p>';
  } else if (data.type === "school-analytics") {
    card.innerHTML = '<div class="metric">' + data.schoolAttendance + '%</div><p><strong>School attendance today</strong><br>' + data.studentsPresent + ' of ' + data.studentsTotal + ' students present · ' + data.trend + '</p>';
  } else if (data.type === "escalation") {
    card.innerHTML = '<div class="metric">✓</div><p><strong>Request ' + data.request.status + '</strong><br>' + data.request.id + ' · Mock service confirmation received</p>';
  } else if (data.type === "attendance-update") {
    card.innerHTML = '<div class="metric">✓</div><p><strong>Class register updated</strong><br>Status recorded as ' + data.status + ' through the authorised teacher tool.</p>';
  } else if (data.type === "recent-attendance") {
    card.innerHTML = '<div class="metric">4</div><p><strong>Recent attendance entries</strong><br>' + data.records.map(function(item) { return item.date + ": " + item.status; }).join(" · ") + '</p>';
  } else {
    return document.createElement("span");
  }
  return card;
}

async function request(path, body) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Something went wrong.");
  return payload;
}

async function createSession() {
  const role = roles[state.role];
  const result = await request("/api/session", { role: state.role, identityId: role.id, language: state.language });
  state.sessionId = result.sessionId;
  elements.title.textContent = "A secure space for " + role.label.toLowerCase() + " support";
  elements.persona.textContent = role.persona;
  elements.sessionRole.textContent = role.label;
  elements.avatarMessage.textContent = "Hi " + result.profile.name.split(" ")[0] + ". I am ready to help, with your school permissions kept in view.";
  addMessage(greetingFor(role), "maya");
  setSuggestions(role.prompts);
}

function greetingFor(role) {
  const greetings = {
    en: "Hello! I am Maya, " + role.persona.toLowerCase() + ". I can help with the school services your account is authorised to use.",
    hi: "नमस्ते! मैं Maya हूँ, आपकी स्कूल सहायक। मैं आपकी स्कूल भूमिका के अनुसार सुरक्षित मदद कर सकती हूँ।",
    ta: "வணக்கம்! நான் Maya, உங்கள் பள்ளி உதவியாளர். உங்கள் அனுமதிகளுக்கு ஏற்ப நான் உதவுகிறேன்.",
    te: "నమస్కారం! నేను Maya, మీ పాఠశాల సహాయకురాలిని. మీ అనుమతులకు అనుగుణంగా సహాయం చేస్తాను.",
    mr: "नमस्कार! मी Maya आहे, तुमची शाळेची सहाय्यक. तुमच्या भूमिकेनुसार सुरक्षित मदत करेन.",
    bn: "নমস্কার! আমি Maya, আপনার স্কুল সহায়ক। আপনার ভূমিকা অনুযায়ী নিরাপদে সাহায্য করব।",
    gu: "નમસ્તે! હું Maya છું, તમારી શાળા સહાયક. તમારી ભૂમિકા પ્રમાણે સુરક્ષિત મદદ કરીશ.",
    pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ Maya ਹਾਂ, ਤੁਹਾਡੀ ਸਕੂਲ ਸਹਾਇਕ। ਮੈਂ ਤੁਹਾਡੀ ਭੂਮਿਕਾ ਅਨੁਸਾਰ ਸੁਰੱਖਿਅਤ ਮਦਦ ਕਰਾਂਗੀ।",
    kn: "ನಮಸ್ಕಾರ! ನಾನು Maya, ನಿಮ್ಮ ಶಾಲಾ ಸಹಾಯಕಿ. ನಿಮ್ಮ ಪಾತ್ರಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಸುರಕ್ಷಿತವಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.",
    ml: "നമസ്കാരം! ഞാൻ Maya, നിങ്ങളുടെ സ്കൂൾ സഹായി. നിങ്ങളുടെ റോളിന് അനുസരിച്ച് സുരക്ഷിതമായി സഹായിക്കാം.",
    ur: "السلام علیکم! میں Maya ہوں، آپ کی اسکول اسسٹنٹ۔ میں آپ کے کردار کے مطابق محفوظ مدد کر سکتی ہوں۔"
  };
  return greetings[state.language] || greetings.en;
}

async function chooseRole(role) {
  if (role === state.role && state.sessionId) return;
  state.role = role;
  state.sessionId = null;
  renderRoles();
  elements.conversation.innerHTML = "";
  setSuggestions([]);
  try {
    await createSession();
  } catch (error) {
    addMessage(error.message, "maya");
  }
}

async function sendMessage(message) {
  const clean = String(message || "").trim();
  if (!clean || !state.sessionId) return;
  addMessage(clean, "user");
  elements.input.value = "";
  elements.input.style.height = "";
  setSuggestions([]);
  elements.avatar.setAttribute("data-expression", "calm");
  elements.avatarMessage.textContent = "Maya is checking the right school service for you...";
  try {
    const result = await request("/api/chat", { sessionId: state.sessionId, message: clean });
    elements.avatar.setAttribute("data-expression", result.expression || "warm");
    elements.avatarMessage.textContent = result.reply;
    addMessage(result.reply, "maya", result.data);
    setSuggestions(result.chips && result.chips.length ? result.chips : roles[state.role].prompts);
    speak(result.reply);
  } catch (error) {
    elements.avatar.setAttribute("data-expression", "concerned");
    addMessage(error.message, "maya");
  }
}

function configureVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    elements.voiceStatus.textContent = "Voice input is not supported in this browser. You can still chat with Maya.";
    elements.mic.disabled = true;
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onstart = function() {
    state.listening = true;
    elements.mic.classList.add("recording");
    elements.voiceState.textContent = "LISTENING";
    elements.voiceStatus.textContent = "Listening... speak naturally.";
  };
  recognition.onend = function() {
    state.listening = false;
    elements.mic.classList.remove("recording");
    elements.voiceState.textContent = "VOICE READY";
    elements.voiceStatus.textContent = "Voice input is ready when supported by your browser.";
  };
  recognition.onerror = function() {
    elements.voiceStatus.textContent = "I could not hear that clearly. Please try again or type your message.";
  };
  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    elements.input.value = transcript;
    sendMessage(transcript);
  };
  elements.mic.addEventListener("click", function() {
    if (!state.listening) recognition.start();
  });
}

function speak(text) {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.02;
  utterance.pitch = 1.08;
  const languages = { en: "en-IN", hi: "hi-IN", ta: "ta-IN", te: "te-IN", mr: "mr-IN", bn: "bn-IN", gu: "gu-IN", pa: "pa-IN", kn: "kn-IN", ml: "ml-IN", ur: "ur-IN" };
  utterance.lang = languages[state.language] || "en-IN";
  utterance.onstart = function() { elements.avatar.classList.add("speaking"); };
  utterance.onend = function() { elements.avatar.classList.remove("speaking"); };
  utterance.onerror = function() { elements.avatar.classList.remove("speaking"); };
  window.speechSynthesis.speak(utterance);
}

elements.form.addEventListener("submit", function(event) {
  event.preventDefault();
  sendMessage(elements.input.value);
});
elements.input.addEventListener("input", function() {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 100) + "px";
});
elements.language.addEventListener("change", function() {
  state.language = this.value;
  state.sessionId = null;
  elements.conversation.innerHTML = "";
  createSession();
});
elements.newSession.addEventListener("click", function() {
  document.querySelector(".control-panel").scrollIntoView({ behavior: "smooth", block: "start" });
});

renderRoles();
createSession();
configureVoice();
