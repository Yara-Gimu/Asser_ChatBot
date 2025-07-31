// OpenRouter AI Integration
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"; // مثال
const AI_MODEL = 'z-ai/glm-4.5-air:free';

const SYSTEM_PROMPT = {
    'ar': `أنت مساعد سياحي ذكي متخصص في منطقة عسير السعودية. قدم معلومات دقيقة وواضحة عن المعالم السياحية والتراثية في المنطقة. كن مهذباً ومفيداً، وأجب بلغة المستخدم. ركز على المعلومات السياحية والثقافية.

إذا لم تكن لديك معلومات كافية من السياق، استند إلى المعرفة العامة أو استعن بالمصادر التالية كمراجع:
- https://www.visitsaudi.com/ar/see-do/destinations/asir
- https://ar.wikipedia.org/wiki/عسير_(منطقة)
- https://welcomesaudi.com/ar/city/abha`
};

async function callOpenRouterAI(userMessage, context = '') {
    const headers = {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
    };

    const body = {
        model: AI_MODEL,
        messages: [
            {
                role: 'system',
                content: SYSTEM_PROMPT[currentLanguage] || SYSTEM_PROMPT['ar']
            },
            {
                role: 'user',
                content: `${context}\n\nUser question: ${userMessage}`
            }
        ],
        temperature: 0.7,
        max_tokens: 1000
    };

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('❌ Error calling OpenRouter API:', error);
        throw error;
    }
}