let currentLanguage = 'ar';
let currentLandmarkId = null;
let chatHistory = [];
let awaitingRecommendationResponse = false;

const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const modeBtn = document.getElementById('modeBtn');

document.addEventListener('DOMContentLoaded', function () {
    loadLandmarksData();

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') sendMessage();
    });

    modeBtn.addEventListener('click', toggleDarkMode);

    setTimeout(() => {
        addBotMessage(getTranslation('welcome_message'));
        setTimeout(showLanguageOptions, 1000);
    }, 500);
});

function loadLandmarksData() {
    fetch('landmarks.json')
        .then(response => response.json())
        .then(data => {
            window.landmarksData = data;
        })
        .catch(error => {
            console.error('Error loading landmarks data:', error);
            addBotMessage(getTranslation('data_error'));
        });
}

function sendMessage() {
    const message = userInput.value.trim();
    if (message === '') return;

    addUserMessage(message);
    userInput.value = '';
    processUserMessage(message);
}

function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'user-message');
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    chatHistory.push({
        sender: 'user',
        message: text,
        timestamp: new Date().toISOString()
    });
}

function addBotMessage(text, showTyping = true) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bot-message');

    if (showTyping) {
        // إضافة مؤشر الكتابة أولاً
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        messageDiv.appendChild(typingIndicator);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // بعد تأخير محاكاة للكتابة، نعرض الرسالة الفعلية
        setTimeout(() => {
            messageDiv.removeChild(typingIndicator);
            messageDiv.innerHTML = text.replace(/\n/g, '<br>');
            chatMessages.scrollTop = chatMessages.scrollHeight;

            chatHistory.push({
                sender: 'bot',
                message: text,
                timestamp: new Date().toISOString()
            });
        }, 1500 + (Math.random() * 1000)); // تأخير عشوائي بين 1.5 إلى 2.5 ثانية
    } else {
        // إذا لم نرد عرض مؤشر الكتابة (مثل الرسائل الفورية)
        messageDiv.innerHTML = text.replace(/\n/g, '<br>');
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        chatHistory.push({
            sender: 'bot',
            message: text,
            timestamp: new Date().toISOString()
        });
    }
}


function showLanguageOptions() {
    const languages = [
        { code: 'ar', label: 'العربية' },
        { code: 'en', label: 'English' },
        { code: 'fr', label: 'Français' },
        { code: 'es', label: 'Español' }
    ];

    const container = document.createElement('div');
    container.classList.add('language-buttons');

    languages.forEach(lang => {
        const btn = document.createElement('button');
        btn.textContent = lang.label;
        btn.onclick = () => selectLanguage(lang.code);
        container.appendChild(btn);
    });

    chatMessages.appendChild(container);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function selectLanguage(code) {
    currentLanguage = code;
addBotMessage(getTranslation('language_set', { language: getLanguageLabel(code) }), false);
    userInput.placeholder = getTranslation('landmark_prompt');
    userInput.disabled = false;
    sendBtn.disabled = false;

    setTimeout(() => {
        addBotMessage(getTranslation('landmark_prompt'));
    }, 1000);
}

function getLanguageLabel(code) {
    return {
        ar: 'العربية',
        en: 'English',
        fr: 'Français',
        es: 'Español'
    }[code] || code;
}

function processUserMessage(message) {
    const normalized = message.toLowerCase().trim();

    if (awaitingRecommendationResponse) {
        const yesWords = ['نعم', 'yes', 'oui', 'sí'];
        const noWords = ['لا', 'no', 'non'];

        if (yesWords.includes(normalized)) {
            showRecommendations();
            awaitingRecommendationResponse = false;
            return;
        } else if (noWords.includes(normalized)) {
            addBotMessage(getTranslation('no_recommendations'));
            awaitingRecommendationResponse = false;
            return;
        } else {
            awaitingRecommendationResponse = false;
            generateAIResponse(message);
            return;
        }
    }

    const landmarkInfo = findLandmarkInfo(message);
    if (landmarkInfo) {
        currentLandmarkId = landmarkInfo.id;
        displayLandmarkInfo(landmarkInfo);
        return;
    }

    generateAIResponse(message);
}

function findLandmarkInfo(message) {
    if (!window.landmarksData || !window.landmarksData.landmarks) return null;

    const byId = window.landmarksData.landmarks.find(landmark =>
        landmark.id === message.trim()
    );
    if (byId) return byId;

    return window.landmarksData.landmarks.find(landmark =>
        Object.values(landmark.name).some(name =>
            name.toLowerCase().includes(message.toLowerCase())
        )
    );
}

function displayLandmarkInfo(landmark) {
    updateLandmarkStats(landmark.id);

    addBotMessage(`${getTranslation('landmark_info')}: ${landmark.name[currentLanguage]}`);
    addBotMessage(landmark.description[currentLanguage]);

    setTimeout(() => {
        addBotMessage(getTranslation('recommendation_prompt'));
    }, 1000);

    setTimeout(() => {
        awaitingRecommendationResponse = true;
    }, 1100);
}

function updateLandmarkStats(landmarkId) {
    const landmark = window.landmarksData.landmarks.find(l => l.id === landmarkId);
    if (landmark) {
        landmark.visits++;
        landmark.interactions++;
        window.landmarksData.stats.totalVisits++;
        window.landmarksData.stats.languages[currentLanguage]++;
    }
}

function showRecommendations() {
    if (!currentLandmarkId || !window.landmarksData) return;

    const current = window.landmarksData.landmarks.find(l => l.id === currentLandmarkId);
    if (!current || !current.recommendations) return;

    const recommendations = current.recommendations.slice(0, 3);
    let msg = getTranslation('recommendations') + ':\n\n';

    recommendations.forEach(id => {
        const landmark = window.landmarksData.landmarks.find(l => l.id === id);
        if (landmark) {
            const name = landmark.name[currentLanguage] || landmark.name.ar;
            const mapUrl = landmark.location?.google_maps_url || '🔗 الرابط غير متوفر';
            msg += `• ${name}\n🔗 ${mapUrl}\n\n`;
        }
    });

    addBotMessage(msg.trim());
}



function generateAIResponse(message) {
    if (message.toLowerCase().includes(getTranslation('recommendation_keyword').toLowerCase())) {
        showRecommendations();
        return;
    }

    const context = currentLandmarkId ?
        `المستخدم يسأل عن معلم في منطقة عسير. المعلم الحالي: ${window.landmarksData.landmarks.find(l => l.id === currentLandmarkId).name[currentLanguage]}` :
        'المستخدم يسأل عن السياحة في منطقة عسير بالمملكة العربية السعودية.';

    callOpenRouterAI(message, context)
        .then(response => addBotMessage(response))
        .catch(error => {
            console.error('AI Error:', error);
            addBotMessage(getTranslation('ai_error'));
        });
}

function toggleDarkMode() {
    document.body.classList.toggle('day-mode');
    document.body.classList.toggle('night-mode');

    modeBtn.textContent = document.body.classList.contains('night-mode')
        ? getTranslation('day_mode')
        : getTranslation('night_mode');
}

function getTranslation(key, params = {}) {
    const translations = {
        'welcome_message': {
            'ar': 'مرحباً بكم في الدليل السياحي الذكي لمنطقة عسير!',
            'en': 'Welcome to the Asir region smart tour guide!',
            'fr': 'Bienvenue dans le guide touristique intelligent de la région d\'Asir!',
            'es': '¡Bienvenido al guía turístico inteligente de la región de Asir!'
        },
        'language_set': {
            'ar': `تم تعيين اللغة إلى ${params.language}`,
            'en': `Language set to ${params.language}`,
            'fr': `Langue définie sur ${params.language}`,
            'es': `Idioma establecido en ${params.language}`
        },
        'landmark_prompt': {
            'ar': 'من فضلك أدخل رقم المعلم أو اسمه...',
            'en': 'Please enter the landmark number or name...',
            'fr': 'Veuillez entrer le numéro ou le nom du site...',
            'es': 'Por favor ingrese el número o el nombre del sitio...'
        },
        'landmark_info': {
            'ar': 'معلومات عن المعلم',
            'en': 'Information about the landmark',
            'fr': 'Informations sur le site',
            'es': 'Información sobre el sitio'
        },
        'recommendation_prompt': {
            'ar': 'هل ترغب في الحصول على توصيات لزيارة معالم أخرى قريبة؟',
            'en': 'Would you like recommendations for other nearby landmarks?',
            'fr': 'Souhaitez-vous des recommandations pour d\'autres sites proches?',
            'es': '¿Desea recomendaciones para otros lugares cercanos?'
        },
        'recommendations': {
            'ar': 'نقترح لك زيارة هذه المعالم:',
            'en': 'We recommend these sites:',
            'fr': 'Nous recommandons ces sites:',
            'es': 'Recomendamos estos sitios:'
        },
        'recommendation_keyword': {
            'ar': 'توصيات',
            'en': 'recommendations',
            'fr': 'recommandations',
            'es': 'recomendaciones'
        },
        'no_recommendations': {
            'ar': 'حسنًا، إذا أردت توصيات لاحقًا فقط أخبرني.',
            'en': 'Alright, if you want recommendations later, just let me know.',
            'fr': 'Très bien, si vous voulez des recommandations plus tard, dites-le-moi.',
            'es': 'Está bien, si deseas recomendaciones más adelante, solo dímelo.'
        },
        'ai_error': {
            'ar': 'عذراً، حدث خطأ في توليد الرد.',
            'en': 'Sorry, there was an error generating the response.',
            'fr': 'Désolé, une erreur s\'est produite lors de la génération.',
            'es': 'Lo sentimos, ocurrió un error al generar la respuesta.'
        },
        'day_mode': {
            'ar': 'الوضع النهاري',
            'en': 'Day Mode',
            'fr': 'Mode Jour',
            'es': 'Modo Día'
        },
        'night_mode': {
            'ar': 'الوضع الليلي',
            'en': 'Night Mode',
            'fr': 'Mode Nuit',
            'es': 'Modo Noche'
        },
        'data_error': {
            'ar': 'خطأ في تحميل البيانات.',
            'en': 'Error loading data.',
            'fr': 'Erreur de chargement des données.',
            'es': 'Error al cargar los datos.'
        }
    };

    return translations[key][currentLanguage] || translations[key]['en'] || key;
}
