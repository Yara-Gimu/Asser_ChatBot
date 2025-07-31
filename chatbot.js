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
        addBotMessage(getTranslation('welcome_message'), false);
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
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        messageDiv.appendChild(typingIndicator);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        setTimeout(() => {
            messageDiv.removeChild(typingIndicator);
            messageDiv.innerHTML = text.replace(/\n/g, '<br>');
            chatMessages.scrollTop = chatMessages.scrollHeight;

            chatHistory.push({
                sender: 'bot',
                message: text,
                timestamp: new Date().toISOString()
            });
        }, 1500 + (Math.random() * 1000));
    } else {
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
    
    // إنشاء وإضافة قسم الصوت
    const audioSection = createAudioSection(landmark.id);
    chatMessages.appendChild(audioSection);
    
    // إنشاء وإضافة قسم الذاكرة
    const memorySection = createMemoryWallSection(landmark.id);
    chatMessages.appendChild(memorySection);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
        addBotMessage(getTranslation('recommendation_prompt'));
    }, 1000);

    setTimeout(() => {
        awaitingRecommendationResponse = true;
    }, 1100);
}

function createAudioSection(landmarkId) {
    const section = document.createElement('div');
    section.className = 'audio-section';
    
    const landmark = window.landmarksData.landmarks.find(l => l.id === landmarkId);
    const landmarkName = landmark ? landmark.name[currentLanguage] || landmark.name.ar : '';
    
    const title = document.createElement('h3');
    title.id = 'audio-title';
    title.textContent = `🎧 ${getTranslation('audio_story_title')}: ${landmarkName}`;
    
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = `assets/audio/${landmarkId}.mp3`;
    
    const subtitle = document.createElement('p');
    subtitle.className = 'story-subtitle';
    
    const subtitles = {
        'rijal-almaa': {
            ar: 'في هذا الموقع عاش أهل رجال ألمع قصصاً من البطولة والفن...',
            en: 'In this location, the people of Rijal Almaa lived stories of heroism and art...'
        },
        'al-soudah': {
            ar: 'جبال السودة تخبئ بين ضبابها حكايات الرعاة والمسافرين...',
            en: 'The Soudah mountains hide in their mist tales of shepherds and wanderers...'
        }
    };
    
    subtitle.textContent = subtitles[landmarkId]?.[currentLanguage] || '';
    
    section.appendChild(title);
    section.appendChild(audio);
    section.appendChild(subtitle);
    
    return section;
}

function createMemoryWallSection(landmarkId) {
    const section = document.createElement('div');
    section.className = 'memory-wall-section';
    section.dataset.landmarkId = landmarkId;
    
    const title = document.createElement('h3');
    title.id = 'memory-wall-title';
    title.textContent = getTranslation('memory_wall_title');
    
    const gallery = document.createElement('div');
    gallery.className = 'gallery-grid';
    gallery.id = 'photoGallery';
    
    const uploadSection = document.createElement('div');
    uploadSection.className = 'upload-section';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'photoUpload';
    fileInput.accept = 'image/*';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'visitorName';
    nameInput.placeholder = getTranslation('name_placeholder');
    
    const uploadBtn = document.createElement('button');
    uploadBtn.textContent = getTranslation('share_moment');
    uploadBtn.onclick = uploadPhoto;
    
    uploadSection.appendChild(fileInput);
    uploadSection.appendChild(nameInput);
    uploadSection.appendChild(uploadBtn);
    
    section.appendChild(title);
    section.appendChild(gallery);
    section.appendChild(uploadSection);
    
    loadSavedPhotos(landmarkId, gallery);
    
    return section;
}

function loadSavedPhotos(landmarkId, gallery) {
    const stored = JSON.parse(localStorage.getItem(`photos-${landmarkId}`)) || [];
    
    stored.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        
        const img = document.createElement('img');
        img.src = typeof item === 'string' ? item : item.src;
        img.style.width = '100px';
        img.style.height = '100px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        
        const caption = document.createElement('span');
        caption.textContent = item.name || getTranslation('anonymous_visitor');
        caption.style.marginTop = '6px';
        caption.style.fontSize = '0.9rem';
        caption.style.color = '#555';
        
        wrapper.appendChild(img);
        wrapper.appendChild(caption);
        gallery.appendChild(wrapper);
    });
}

function uploadPhoto() {
    const input = document.getElementById('photoUpload');
    const nameInput = document.getElementById('visitorName');
    const wall = document.querySelector('.memory-wall-section');
    
    if (!wall || !input.files.length) {
        alert(getTranslation('select_photo_first'));
        return;
    }

    const landmarkId = wall.dataset.landmarkId;
    const gallery = document.getElementById('photoGallery');
    const visitorName = nameInput.value.trim() || getTranslation('anonymous_visitor');

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const src = e.target.result;

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';

        const img = document.createElement('img');
        img.src = src;
        img.style.width = '100px';
        img.style.height = '100px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';

        const caption = document.createElement('span');
        caption.textContent = visitorName;
        caption.style.marginTop = '6px';
        caption.style.fontSize = '0.9rem';
        caption.style.color = '#555';

        wrapper.appendChild(img);
        wrapper.appendChild(caption);
        gallery.appendChild(wrapper);

        const stored = JSON.parse(localStorage.getItem(`photos-${landmarkId}`)) || [];
        stored.push({ src, name: visitorName });
        localStorage.setItem(`photos-${landmarkId}`, JSON.stringify(stored));
    };

    reader.readAsDataURL(file);
    input.value = '';
    nameInput.value = '';
}

function updateLandmarkStats(landmarkId) {
    const landmark = window.landmarksData.landmarks.find(l => l.id === landmarkId);
    if (landmark) {
        landmark.visits = (landmark.visits || 0) + 1;
        landmark.interactions = (landmark.interactions || 0) + 1;
        window.landmarksData.stats.totalVisits = (window.landmarksData.stats.totalVisits || 0) + 1;
        window.landmarksData.stats.languages[currentLanguage] = (window.landmarksData.stats.languages[currentLanguage] || 0) + 1;
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
            const mapUrl = landmark.location?.google_maps_url || getTranslation('map_not_available');
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
            'ar': 'أهلاً بك في رِواي<br>كل معلم في عسير يحمل قصة...<br> رِواي بانتظارك ليحكيها.',
            'en': 'Welcome to Rawi<br>Every landmark in Asir holds a story...<br> Rawi awaits to tell it.',
            'fr': 'Bienvenue chez Rawi<br>Chaque site d\'Asir a une histoire...<br> Rawi attend pour la raconter.',
            'es': 'Bienvenido a Rawi<br>Cada lugar en Asir tiene una historia...<br> Rawi espera para contarla.'
              },
        'language_set': {
            'ar': `تم تعيين اللغة إلى ${params.language}`,
            'en': `Language set to ${params.language}`,
            'fr': `Langue définie sur ${params.language}`,
            'es': `Idioma establecido en ${params.language}`
        },
        'landmark_prompt': {
            'ar': 'من فضلك أدخل رقم المعلم الذي بجوارك، مثلاً: 001',
            'en': 'Please enter the number of the landmark next to you, e.g., 001',
            'fr': 'Veuillez entrer le numéro du site à côté de vous, par ex. : 001',
            'es': 'Por favor ingrese el número del sitio junto a usted, p. ej.: 001'
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
        },
        'audio_story_title': {
            'ar': 'استمع إلى قصة معلم',
            'en': 'Listen to the Landmark Story',
            'fr': 'Écoutez l\'histoire du site',
            'es': 'Escucha la historia del sitio'
        },
        'memory_wall_title': {
            'ar': '📸 لحظات الزوار (شاركنا صورتك وشاهد لحظات الآخرين)',
            'en': '📸 Visitor Moments (Share your photo and see others)',
            'fr': '📸 Moments des visiteurs (partagez votre photo)',
            'es': '📸 Momentos de los visitantes (comparte tu photo)'
        },
        'name_placeholder': {
            'ar': 'اكتب اسمك هنا (اختياري)',
            'en': 'Enter your name (optional)',
            'fr': 'Entrez votre nom (facultatif)',
            'es': 'Ingresa tu nombre (opcional)'
        },
        'share_moment': {
            'ar': 'شارك لحظتك',
            'en': 'Share your moment',
            'fr': 'Partagez votre moment',
            'es': 'Comparte tu momento'
        },
        'anonymous_visitor': {
            'ar': 'زائر مجهول',
            'en': 'Anonymous visitor',
            'fr': 'Visiteur anonyme',
            'es': 'Visitante anónimo'
        },
        'select_photo_first': {
            'ar': 'الرجاء اختيار صورة أولاً.',
            'en': 'Please select a photo first.',
            'fr': 'Veuillez d\'abord sélectionner une photo.',
            'es': 'Por favor selecciona una foto primero.'
        },
        'map_not_available': {
            'ar': '🔗 الرابط غير متوفر',
            'en': '🔗 Link not available',
            'fr': '🔗 Lien non disponible',
            'es': '🔗 Enlace no disponible'
        }
    };

    return translations[key][currentLanguage] || translations[key]['ar'] || key;
}
