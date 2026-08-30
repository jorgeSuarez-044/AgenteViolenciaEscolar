(function () {
    function initApp() {
        // ============================================
        // 1. CONFIGURACIÓN INICIAL
        // ============================================

        // Initialize EmailJS
        const emailjsKey = (typeof CONFIG !== 'undefined' && CONFIG.EMAILJS_PUBLIC_KEY) ? CONFIG.EMAILJS_PUBLIC_KEY : '';
        if (emailjsKey && emailjsKey !== 'TU_PUBLIC_KEY_AQUI') {
            emailjs.init(emailjsKey);
        } else {
            console.warn('EmailJS: Configura EMAILJS_PUBLIC_KEY en config.js');
        }

        // Gemini API Key desde config.js
        const GEMINI_API_KEY = (typeof CONFIG !== 'undefined' && CONFIG.GEMINI_API_KEY) ? CONFIG.GEMINI_API_KEY : '';

        // ============================================
        // 2. SISTEMA DE SONIDOS Y VOZ (AUDIO GLOBAL)
        // ============================================
        let audioCtx = null;
        window.globalAudioEnabled = true; // Variable global para silenciar TODO

        function playSound(tipo) {
            if (!window.globalAudioEnabled) return;
            try {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                const freqs = { reportar: 523, hablar: 659, enviar: 784, continuar: 587, voz: 494, cerrar: 330, ley: 440, aceptar: 523, enviando: 740 };
                osc.frequency.value = freqs[tipo] || 440;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
                osc.start(audioCtx.currentTime);
                osc.stop(audioCtx.currentTime + 0.08);
            } catch (e) { }
        }

        function anunciarEnvioCorreo() {
            playSound('enviando');
            const texto = 'Estamos enviando el correo y generando el caso. Espere por favor.';
            try {
                if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(texto);
                    utterance.lang = 'es-CO';
                    utterance.rate = 0.95;
                    const voces = (speechSynthesis.getVoices() || []).filter(v => v.lang && v.lang.startsWith('es'));
                    if (voces.length) utterance.voice = voces[0];
                    window.speechSynthesis.speak(utterance);
                }
            } catch (e) { }
        }

        // ============================================
        // 3. FUNCIONES DE UTILIDAD
        // ============================================
        function escapeHtml(str) {
            return String(str ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function renderAnswersTableHTML(answersObj) {
            const a = answersObj || {};
            const tipoMap = {
                bullying: 'Bullying / Matoneo',
                ciberacoso: 'Ciberacoso / Ciberviolencia',
                violencia_fisica: 'Violencia física',
                violencia_verbal: 'Violencia verbal',
                violencia_psicologica: 'Violencia psicológica',
                exclusion: 'Exclusión / Ostracismo',
                violencia_sexual: 'Violencia sexual',
                amenazas: 'Amenazas',
                otro: 'Otro'
            };
            const frecuenciaMap = {
                una_vez: 'Una vez',
                pocas_veces: 'Pocas veces (2-3)',
                varias_semana: 'Varias veces a la semana',
                todos_dias: 'Todos los días',
                constante: 'Constantemente'
            };
            const rows = [
                ['Correo', a.email],
                ['Situación reportada', a.motivo_caso],
                ['Tipo de violencia', a.tipo_violencia ? (tipoMap[a.tipo_violencia] || a.tipo_violencia) : null],
                ['Institución educativa', a.institucion_educativa],
                ['Frecuencia', a.frecuencia ? (frecuenciaMap[a.frecuencia] || a.frecuencia) : null],
                ['Detalles adicionales', a.detalles]
            ];
            const body = rows
                .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
                .map(([k, v]) => {
                    const safeK = escapeHtml(k);
                    const safeV = escapeHtml(String(v)).replace(/\n/g, '<br>');
                    return `<tr><td style="border:1px solid #e5e7eb;padding:8px 10px;font-weight:600;background:#f8fafc;vertical-align:top;width:38%;">${safeK}</td><td style="border:1px solid #e5e7eb;padding:8px 10px;vertical-align:top;">${safeV}</td></tr>`;
                }).join('');
            return `<table style="border-collapse:collapse;width:100%;font-family:Arial,Helvetica,sans-serif;font-size:14px;"><tbody>${body}</tbody></table>`.trim();
        }

        function renderConsultaTableHTML(correo, consulta) {
            const rows = [['Correo', correo], ['Consulta', consulta]];
            const body = rows.filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
                .map(([k, v]) => {
                    const safeK = escapeHtml(k);
                    const safeV = escapeHtml(String(v)).replace(/\n/g, '<br>');
                    return `<tr><td style="border:1px solid #e5e7eb;padding:8px 10px;font-weight:600;background:#f8fafc;vertical-align:top;width:38%;">${safeK}</td><td style="border:1px solid #e5e7eb;padding:8px 10px;vertical-align:top;">${safeV}</td></tr>`;
                }).join('');
            return `<table style="border-collapse:collapse;width:100%;font-family:Arial,Helvetica,sans-serif;font-size:14px;"><tbody>${body}</tbody></table>`.trim();
        }

        // ============================================
        // 4. LEGAL CARDS FUNCTIONALITY
        // ============================================
        const legalCards = document.querySelectorAll('.legal-card');
        const legalContents = document.querySelectorAll('.legal-content');

        legalCards.forEach(card => {
            card.addEventListener('click', function () {
                playSound('ley');
                const tabId = this.getAttribute('data-tab');
                legalCards.forEach(c => c.classList.remove('active'));
                legalContents.forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });

        // ============================================
        // 4.5. MENU SOUNDS
        // ============================================
        const menuBotones = document.querySelectorAll('.sidebar nav a');
        menuBotones.forEach(btn => {
            btn.addEventListener('click', () => {
                playSound('continuar');
            });
        });

        // ============================================
        // 5. ACCESIBILIDAD Y ELEMENTOS DEL DOM
        // ============================================
        let currentFontSize = 100;
        const fontIncr = 10;

        function updateFontSize() {
            document.documentElement.style.fontSize = `${currentFontSize}%`;
        }

        const chatbotBox = document.getElementById('chatbotBox');
        const chatbotToggle = document.getElementById('chatbotToggle');
        const chatbotClose = document.getElementById('chatbotClose');
        const chatbotMessages = document.getElementById('chatbotMessages');
        const chatbotInput = document.getElementById('chatbotInput');
        const sendMessage = document.getElementById('sendMessage');
        const voiceToggle = document.getElementById('voiceToggle');
        const voiceInputBtn = document.getElementById('voiceInputBtn');
        const emojiBtn = document.getElementById('emojiBtn');
        const emojiPicker = document.getElementById('emojiPicker');

        const increaseFont = document.getElementById('increaseFont');
        const decreaseFont = document.getElementById('decreaseFont');
        const toggleContrast = document.getElementById('toggleContrast');
        const toggleGlobalAudio = document.getElementById('toggleGlobalAudio');
        const voiceRateInput = document.getElementById('voiceRate');
        const voiceRateVal = document.getElementById('voiceRateVal');
        window.voiceRate = 0.9;

        const accSphere = document.getElementById('accSphere');
        const accContainer = document.getElementById('accContainer');

        const chatbotFormContainer = document.getElementById('chatbotFormContainer');
        const chatbotForm = document.getElementById('chatbotForm');
        const formFieldContainer = document.getElementById('formFieldContainer');
        const chatbotInputArea = document.getElementById('chatbotInputArea');
        const emailNotification = document.getElementById('emailNotification');
        const emailStatus = document.getElementById('emailStatus');
        const closeEmailStatus = document.getElementById('closeEmailStatus');

        const siuceModal = document.getElementById('siuceModal');
        const closeSiuce = document.getElementById('closeSiuce');
        const openSiuceSidebar = document.getElementById('openSiuceSidebar');

        // ============================================
        // 6. FUNCIONES AUXILIARES
        // ============================================
        function extraerEmail(texto) {
            const match = texto.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            return match ? match[0].trim() : null;
        }

        function normalizarRespuesta(userMessage, questionKey) {
            const msg = userMessage.trim();
            if (questionKey === 'email') {
                const txt = msg.toLowerCase();
                const esNegativa = /^(no|no quiero|anonimo|anónimo|ninguno|prefiero no|\.|saltar|omitir)/.test(txt);
                if (esNegativa) return 'anonimo@anonimo.com';
                const emailExtraido = extraerEmail(msg);
                return emailExtraido || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg) ? msg : null);
            }
            return msg;
        }

        // ============================================
        // 7. PREGUNTAS DEL FORMULARIO
        // ============================================
        const questions = [
            {
                key: 'email', text: "Para abrir tu caso según la Ley 1620, me ayudaría tu correo para hacer seguimiento. Si prefieres reportar de forma anónima, escribe 'no' o 'anónimo'.", required: true, validate: (v) => {
                    const txt = v.toLowerCase().trim();
                    const esNegativa = /^(no|no quiero|anonimo|anónimo|ninguno|prefiero no|\.|saltar|omitir)/.test(txt);
                    return esNegativa || !!extraerEmail(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
                }
            },
            { key: 'motivo_caso', text: "¿Qué es lo que está ocurriendo? Escribe brevemente la situación que deseas reportar.", required: true },
            {
                key: 'tipo_violencia', text: "¿Qué tipo de violencia es?", formType: 'select', options: [
                    { value: 'bullying', label: 'Bullying / Matoneo' },
                    { value: 'ciberacoso', label: 'Ciberacoso / Ciberviolencia' },
                    { value: 'violencia_fisica', label: 'Violencia física' },
                    { value: 'violencia_verbal', label: 'Violencia verbal' },
                    { value: 'violencia_psicologica', label: 'Violencia psicológica' },
                    { value: 'exclusion', label: 'Exclusión / Ostracismo' },
                    { value: 'violencia_sexual', label: 'Violencia sexual' },
                    { value: 'amenazas', label: 'Amenazas' },
                    { value: 'otro', label: 'Otro' }
                ]
            },
            { key: 'institucion_educativa', text: "¿En qué institución educativa ocurre?", formType: 'input', placeholder: 'Nombre del colegio o institución' },
            {
                key: 'frecuencia', text: "¿Con qué frecuencia ocurre?", formType: 'select', options: [
                    { value: 'una_vez', label: 'Una vez' },
                    { value: 'pocas_veces', label: 'Pocas veces (2-3)' },
                    { value: 'varias_semana', label: 'Varias veces a la semana' },
                    { value: 'todos_dias', label: 'Todos los días' },
                    { value: 'constante', label: 'Constantemente' }
                ]
            },
            { key: 'personas_involucradas', text: "¿Recuerdas quiénes son las personas involucradas o sus cargos? (ej. Estudiantes, profes... o escribe 'no sé')", required: false, formType: 'input', placeholder: 'Nombres o roles...' },
            { key: 'detalles', text: "Descripción adicional del caso", formType: 'textarea', placeholder: 'Agrega detalles que consideres importantes (opcional)', required: false }
        ];

        let currentQuestionIndex = 0;
        let answers = {};
        let conversationStarted = false;
        let legalMode = false;
        let voiceEnabled = false;
        let radicadoActual = null;
        let envioEmailLock = false;

        // ============================================
        // 8. CONFIGURACIÓN SUPABASE
        // ============================================
        const CONFIG_SAFE = typeof CONFIG !== 'undefined' ? CONFIG : {};
        const SUPABASE_CONFIG = (CONFIG_SAFE.SUPABASE_URL && CONFIG_SAFE.SUPABASE_ANON_KEY) ? {
            url: CONFIG_SAFE.SUPABASE_URL,
            key: CONFIG_SAFE.SUPABASE_ANON_KEY
        } : null;
        const supabase = (function () {
            if (!SUPABASE_CONFIG?.url || !SUPABASE_CONFIG?.key) return null;
            try {
                const { createClient } = window.supabase || {};
                if (!createClient) {
                    console.warn('Supabase: asegúrate de cargar el script de Supabase');
                    return null;
                }
                return createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
            } catch (e) {
                console.error('Supabase init error:', e);
                return null;
            }
        })();

        // ============================================
        // 9. ENTIDADES GUBERNAMENTALES
        // ============================================
        const ENTIDADES_NOTIFICACION = (CONFIG_SAFE.ENTIDADES_NOTIFICACION && CONFIG_SAFE.ENTIDADES_NOTIFICACION.length) ? CONFIG_SAFE.ENTIDADES_NOTIFICACION : [
            { nombre: 'Alcaldía Duitama', email: 'contactenos@duitama-boyaca.gov.co', tipos_caso: ['todos'] },
            { nombre: 'Personería Duitama', email: 'personeria@duitama-boyaca.gov.co', tipos_caso: ['todos', 'ciberviolencia'] },
            { nombre: 'Comisaría de Familia', email: 'comisaria@duitama-boyaca.gov.co', tipos_caso: ['violencia_fisica', 'violencia_verbal', 'violencia_sexual', 'bullying'] },
            { nombre: 'Secretaría Educación Boyacá', email: 'convivencia@sedboyaca.gov.co', tipos_caso: ['todos'] },
            { nombre: 'ICBF', email: 'atencion@icbf.gov.co', tipos_caso: ['violencia_sexual', 'violencia_fisica', 'bullying', 'ciberviolencia'] }
        ];

        // ============================================
        // 10. DETECTOR DE TIPO DE CASO
        // ============================================
        const CIBERVIOLENCIA_KEYWORDS = [
            'ciber', 'ciberacoso', 'ciberbullying', 'cyberbullying', 'ciberviolencia',
            'internet', 'redes sociales', 'digital', 'online', 'virtual', 'web', 'app',
            'whatsapp', 'instagram', 'facebook', 'tiktok', 'twitter',
            'mensaje', 'chat', 'grabación', 'video', 'foto', 'captura',
            'paliza feliz', 'happy slapping', 'hostigamiento', 'suplantación',
            'grooming', 'sexting', 'doxxing', 'chantaje'
        ];

        function detectarTipoCaso(texto) {
            if (!texto || typeof texto !== 'string') return 'general';
            const normalizar = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const t = normalizar(texto);
            const esCiberviolencia = CIBERVIOLENCIA_KEYWORDS.some(kw => t.includes(normalizar(kw)));
            if (esCiberviolencia) return 'ciberviolencia';
            if (/\b(sexual|abuso|toqueteo|acoso sexual)\b/.test(t)) return 'violencia_sexual';
            if (/\b(física|fisica|golpe|golpes|pelea|agresión)\b/.test(t)) return 'violencia_fisica';
            if (/\b(bullying|matoneo|intimidación)\b/.test(t)) return 'bullying';
            if (/\b(verbal|insulto|amenaza|exclusión|psicológica)\b/.test(t)) return 'violencia_verbal';
            return 'general';
        }

        function filtrarEntidadesPorCaso(tipoCaso) {
            const filtradas = ENTIDADES_NOTIFICACION.filter(e => {
                const tipos = e.tipos_caso || ['todos'];
                return tipos.includes('todos') || tipos.includes(tipoCaso);
            });
            return filtradas.length > 0 ? filtradas : ENTIDADES_NOTIFICACION.filter(e => (e.tipos_caso || []).includes('todos'));
        }

        // ============================================
        // 11. LEGAL KNOWLEDGE BASE (FALLBACK)
        // ============================================
        const legalKnowledge = {
            derechos: {
                keywords: ['derechos', 'derecho', 'protección', 'garantías', 'ley'],
                response: "Según el Código de Infancia y Adolescencia (Ley 1098 de 2006), tienes derechos fundamentales que incluyen:\n\n• Derecho a la vida, integridad personal y salud\n• Derecho a la educación de calidad\n• Derecho a la protección contra toda forma de violencia\n• Derecho a participar en tu comunidad educativa\n\nEl Artículo 44 establece que las instituciones deben garantizar el respeto a tu dignidad e integridad."
            },
            comite: {
                keywords: ['comité', 'convivencia', 'a quién'],
                response: "El Comité Escolar de Convivencia es tu principal aliado. Según el Artículo 11 de la Ley 1620 de 2013, está conformado por:\n\n• Rector o director (quien lo preside)\n• Personero estudiantil\n• Docente con función de orientación\n• Presidente del consejo de padres\n• Presidente del consejo de estudiantes\n• Un docente por cada nivel educativo\n\nPuedes acudir a ellos de forma confidencial para reportar cualquier situación."
            },
            ruta: {
                keywords: ['ruta', 'atención', 'protocolo', 'procedimiento'],
                response: "La Ruta de Atención Integral (Decreto 1965 de 2013) tiene 4 componentes:\n\n1. **Promoción**: Fortalecimiento de competencias ciudadanas\n2. **Prevención**: Identificación de factores de riesgo\n3. **Atención**: Intervención inmediata con protección a la víctima\n4. **Seguimiento**: Monitoreo continuo del caso\n\nLas instituciones tienen máximo 3 días hábiles para atender tu reporte según el Artículo 28."
            },
            datos: {
                keywords: ['confidencial', 'anónimo', 'privacidad', 'datos'],
                response: "Tu información está protegida por la Ley 1581 de 2012 de Protección de Datos Personales. Principios clave:\n\n• **Confidencialidad**: Tu identidad no será revelada\n• **Finalidad**: Los datos solo se usan para ayudarte\n• **Seguridad**: Medidas técnicas para proteger tu información\n• **Transparencia**: Tienes derecho a saber cómo se usan tus datos\n\nNadie puede obligarte a revelar quién hizo el reporte."
            },
            delitos: {
                keywords: ['delito', 'pena', 'cárcel', 'denuncia', 'policía'],
                response: "Algunas conductas de violencia escolar constituyen delitos según el Código Penal (Ley 599 de 2000):\n\n• **Lesiones personales** (Art. 111): 1-4 años de prisión\n• **Injuria** (Art. 206): 6 meses-2 años de prisión\n• **Calumnia** (Art. 205): 1-4 años de prisión\n• **Acceso abusivo a sistemas** (Art. 269): 48-96 meses\n\nLa Policía de Infancia y Adolescencia debe intervenir en estos casos."
            },
            sexual: {
                keywords: ['sexual', 'abuso', 'acoso', 'toqueteo'],
                response: "La Ley 1146 de 2007 establece medidas específicas para violencia sexual:\n\n• Las instituciones deben tener protocolos de atención\n• Debes recibir atención psicológica inmediata\n• La información es estrictamente confidencial (Art. 10)\n• El Comité Escolar debe activar la ruta de atención\n\nTambién puedes llamar a la línea 141 para atención especializada."
            },
            cyberbullying: {
                keywords: ['internet', 'redes', 'ciber', 'online', 'digital', 'paliza feliz', 'hostigamiento', 'suplantación', 'grooming', 'sexting', 'doxxing'],
                response: "Tipos de ciberviolencia (Ley 1620, MinTIC):\n\n• **Paliza feliz**: Grabar agresiones y subirlas a redes\n• **Ciberpersecución**: Mensajes hostigadores y amenazantes\n• **Exclusión digital**: Bloqueos, no aceptar en grupos\n• **Desvelamiento**: Compartir información privada con amenaza\n• **Suplantación**: Crear perfiles falsos con tu identidad\n• **Denigración**: Difundir información falsa o despectiva\n• **Hostigamiento**: Mensajes ofensivos reiterados\n• **Grooming/Sexting**: Material íntimo no consentido\n\nCódigo Penal: Art. 269A (datos personales), Art. 269 (acceso abusivo). Conserva capturas y repórtalo."
            },
            entidades: {
                keywords: ['entidades', 'icbf', 'comisaría', 'personería', 'notificar', 'autoridades'],
                response: "Según la Ley 1620 de 2013, las entidades que deben ser notificadas son:\n\n• **ICBF** (Art. 24): Casos que superan la función del colegio\n• **Comisaría de Familia**: Cuando los padres no acuden a convocatorias del Comité\n• **Personería** (Art. 26): Cuando el Comité no da solución\n• **Secretaría de Educación**: Supervisión del Sistema de Convivencia\n\nAl reportar aquí, tu caso se notifica automáticamente a estas entidades en Duitama."
            },
            seguimiento: {
                keywords: ['seguimiento', 'radicado', 'código', 'estado', 'consulta'],
                response: "Cada caso recibe un **radicado único** (ej: DUIT-20250314-0001) para seguimiento. Según el Art. 28 Ley 1620, el reporte se envía al Sistema de Información Unificado. Puedes consultar el estado con tu radicado en la Personería o Comisaría de Familia de Duitama."
            }
        };

        function checkLegalKeywords(message) {
            if (!message || typeof message !== 'string') return null;
            const normalize = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const normMsg = normalize(message);
            let best = { score: 0, response: null };
            for (const [, data] of Object.entries(legalKnowledge)) {
                let score = 0;
                for (const keyword of data.keywords) {
                    if (normMsg.includes(normalize(keyword))) score += 1;
                }
                if (score > best.score) best = { score, response: data.response };
            }
            return best.score > 0 ? best.response : null;
        }

        // ============================================
        // 12. CLIENTE GROQ
        // ============================================
        class GroqClient {
            constructor(apiKey) {
                this.apiKey = apiKey;
                this.enabled = !!(apiKey && apiKey !== '');
                this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
                console.log(`Groq ${this.enabled ? 'ACTIVADO' : 'DESACTIVADO'}`);
            }

            async chat(message, options = {}) {
                if (!this.enabled) return null;

                try {
                    const systemPrompt = `Eres un asistente virtual súper amigable, empático y experto especializado en la Ley 1620 de 2013 (Sistema Nacional de Convivencia Escolar en Colombia) y el Decreto 1965 de 2013.
Tu objetivo principal es orientar, escuchar y ayudar a estudiantes, padres y docentes que puedan estar enfrentando situaciones de violencia escolar, bullying, matoneo o ciberacoso.
Debes actuar como un orientador de confianza.
Reglas clave:
1. Sé extremadamente cálido, empático y comprensivo frente a los problemas del usuario. Transmíteles que no están solos.
2. Usa un tono coloquial colombiano muy respetuoso y amigable (ej. "¡Hola! ¿Cómo estás?", "No te preocupes, estoy aquí para apoyarte", "¡Cuenta conmigo!").
3. Basado en la Ley 1620 de 2013, explícales sus derechos, cómo opera el Comité Escolar de Convivencia y cómo funciona la Ruta de Atención Integral (Promoción, Prevención, Atención y Seguimiento).
4. Explica siempre los pasos legales en términos sencillos y claros.
5. Invita gentilmente a la persona a reportar su caso, dándole la instrucción exacta: "Si deseas reportar el caso de manera oficial, simplemente escribe la palabra 'reportar' y te iré guiando".
6. Utiliza bastantes emojis (😊, 🛡️, 📚, ⚖️, 📌, ✨, 🤝, 💡) para hacer la conversación cercana, expresiva y agradable.`;

                    let messages = [];
                    if (options.esPrimerMensaje || options.conversationStarted === false) {
                        messages.push({
                            role: "system",
                            content: systemPrompt + "\n\nInstrucciones para este mensaje: Preséntate de forma amigable usando emojis (🛡️, 😊), indica que dominas la Ley 1620 y pregunta cómo le puedes colaborar hoy."
                        });
                    } else {
                        messages.push({
                            role: "system",
                            content: systemPrompt
                        });
                    }

                    messages.push({ role: "user", content: message });

                    const payload = {
                        model: "openai/gpt-oss-120b",
                        messages: messages,
                        temperature: 0.7,
                        max_tokens: 1024,
                        top_p: 1
                    };

                    const response = await fetch(this.baseUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.apiKey}`
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error("Groq API error details:", errorData);
                        return null;
                    }

                    const data = await response.json();
                    return data.choices[0]?.message?.content || null;

                } catch (error) {
                    console.error("Groq Chat error:", error);
                    return null;
                }
            }

            async classifyIntent(message) {
                if (!this.enabled) return 'otro';

                try {
                    const response = await fetch(this.baseUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.apiKey}`
                        },
                        body: JSON.stringify({
                            model: "openai/gpt-oss-120b",
                            messages: [
                                { role: "system", content: "Clasifica la intención EXACTAMENTE como uno de estos: \"reportar\", \"consultar_legal\", \"seguimiento\", \"otro\". Solo responde con una de esas palabras." },
                                { role: "user", content: message }
                            ],
                            temperature: 0.1,
                            max_tokens: 50,
                            top_p: 1
                        })
                    });

                    const data = await response.json();
                    const intent = data.choices?.[0]?.message?.content?.toLowerCase().trim().replace(/[^a-z_]/g, '');

                    const valid = ['reportar', 'consultar_legal', 'seguimiento'];
                    return valid.includes(intent) ? intent : 'otro';

                } catch (e) {
                    return 'otro';
                }
            }
        }

        const groqClient = new GroqClient("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");

        // ============================================
        // 13. DETECTOR DE INTENCIONES LOCAL (FALLBACK)
        // ============================================
        function detectarIntencionLocal(message) {
            if (!message || typeof message !== 'string') return 'otro';
            const msg = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const intents = {
                reportar: ['reportar', 'denunciar', 'caso', 'ayuda', 'problema', 'situacion', 'violencia', 'acoso', 'matoneo', 'bullying', 'abrir caso'],
                consultar_legal: ['derecho', 'ley', 'articulo', 'procedimiento', 'ruta', 'protocolo', 'comite', 'convivencia', 'garantia'],
                seguimiento: ['estado', 'seguimiento', 'radicado', 'consulta', 'mi caso']
            };
            for (const [intent, keywords] of Object.entries(intents)) {
                if (keywords.some(kw => msg.includes(kw))) return intent;
            }
            return 'otro';
        }

        // ============================================
        // 14. GENERADOR DE RESPUESTAS LOCAL (FALLBACK)
        // ============================================
        function generarRespuestaLocal(message, intent, context) {
            const msg = message.toLowerCase();
            switch (intent) {
                case 'reportar':
                    if (!context.legalMode) {
                        return "🛡️ Entiendo que quieres reportar una situación. Te ayudaré según la Ley 1620 de 2013.\n\n¿Me podrías compartir tu correo para hacerle seguimiento? (Si prefieres anonimato, escribe 'no' o 'anónimo'.)";
                    }
                    return null;
                case 'consultar_legal':
                    const legalResponse = checkLegalKeywords(message);
                    if (legalResponse) return legalResponse;
                    if (msg.includes('derecho')) {
                        return "📚 **Tus derechos según Ley 1098 de 2006:**\n\n• Derecho a la vida e integridad personal\n• Derecho a la educación de calidad\n• Derecho a la protección contra violencia\n\n¿Quieres saber más?";
                    }
                    return "📖 Te recomiendo consultar el manual de convivencia de tu institución. Si necesitas ayuda específica, escríbela.";
                case 'seguimiento':
                    return "🔍 Para consultar el estado de tu caso, necesito el radicado (DUIT-YYYYMMDD-XXXX) o tu correo electrónico.";
                default:
                    if (!context.conversationStarted) {
                        return "🤖 Hola, soy el Asistente Anti-Violencia Escolar. Puedo ayudarte con:\n\n📌 Reportar casos de violencia escolar\n📌 Información sobre tus derechos\n📌 Seguimiento de casos\n\n¿Cómo puedo ayudarte hoy?";
                    }
                    return null;
            }
        }

        // ============================================
        // 15. FUNCIONES DE VOZ
        // ============================================
        function hablarTexto(texto) {
            if (!window.globalAudioEnabled || !texto || !window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const textoLimpio = texto.replace(/<[^>]*>/g, '').replace(/\n/g, '. ').replace(/\*\*/g, '').trim();
            if (!textoLimpio) return;
            const utterance = new SpeechSynthesisUtterance(textoLimpio);
            utterance.lang = 'es-CO';
            utterance.rate = window.voiceRate || 0.9;
            const voces = speechSynthesis.getVoices().filter(v => v.lang.startsWith('es'));
            if (voces.length) utterance.voice = voces[0];
            window.speechSynthesis.speak(utterance);
        }

        function iniciarReconocimientoVoz() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                addMessage('Tu navegador no soporta reconocimiento de voz.');
                return;
            }
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-CO';
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.onresult = (e) => {
                chatbotInput.value = e.results[0][0].transcript;
                voiceInputBtn.classList.remove('recording');
                voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            };
            recognition.onerror = () => {
                voiceInputBtn.classList.remove('recording');
                voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            };
            recognition.onend = () => {
                voiceInputBtn.classList.remove('recording');
                voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            };
            voiceInputBtn.classList.add('recording');
            voiceInputBtn.innerHTML = '<i class="fas fa-stop"></i>';
            recognition.start();
        }

        // ============================================
        // 15.5 FUNCIONES DE SONIDO
        // ============================================
        let typingInterval = null;

        function checkOrResumeAudioCtx() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume().catch(e => console.warn(e));
            }
            return audioCtx;
        }

        function playPopSound() {
            if (!window.globalAudioEnabled) return;
            try {
                const ctx = checkOrResumeAudioCtx();
                if (!ctx) return;
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(450, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.1);

                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

                osc.connect(gainNode);
                gainNode.connect(ctx.destination);

                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.1);
            } catch (e) { console.warn("Audio error", e); }
        }

        function startTypingSound() {
            if (!window.globalAudioEnabled) return;
            try {
                const ctx = checkOrResumeAudioCtx();
                if (!ctx) return;
                if (typingInterval) clearInterval(typingInterval);

                typingInterval = setInterval(() => {
                    const osc = ctx.createOscillator();
                    const gainNode = ctx.createGain();

                    osc.type = 'square';
                    osc.frequency.setValueAtTime(150 + Math.random() * 50, ctx.currentTime);

                    gainNode.gain.setValueAtTime(0, ctx.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.005);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

                    osc.connect(gainNode);
                    gainNode.connect(ctx.destination);

                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.03);
                }, 130 + Math.random() * 80);
            } catch (e) { console.warn("Audio error", e); }
        }

        function stopTypingSound() {
            if (typingInterval) {
                clearInterval(typingInterval);
                typingInterval = null;
            }
        }

        // ============================================
        // 16. FUNCIONES DEL CHAT (CON NOTIFICACIONES 3D)
        // ============================================
        let unreadCount = 0;

        function updateChatNotification() {
            const badge = document.getElementById('chatbotBadge');
            if (!badge) return;
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.classList.remove('hidden');
                chatbotToggle.classList.add('notify-bounce');
            } else {
                badge.classList.add('hidden');
                chatbotToggle.classList.remove('notify-bounce');
            }
        }

        function addMessage(content, isUser = false) {
            const message = document.createElement('div');
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let escapedContent = isUser
                ? content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
                : content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

            if (isUser) {
                message.className = 'flex gap-3 justify-end animate-fade-in';
                message.innerHTML = `
                    <div class="bg-gradient-to-r from-primary to-purple-600 rounded-2xl rounded-tr-sm px-4 py-3 shadow-md max-w-[85%] border border-primary/20">
                        <p class="text-white text-sm font-normal">${escapedContent}</p>
                        <span class="text-[10px] text-white/75 mt-1 block text-right font-light">${time}</span>
                    </div>
                    <div class="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md text-white">
                        <i class="fas fa-user text-xs"></i>
                    </div>
                `;
            } else {
                message.className = 'flex gap-3 animate-fade-in';
                message.innerHTML = `
                    <div class="w-11 h-11 rounded-full bg-transparent border-2 border-primary/30 flex flex-shrink-0 shadow-md overflow-hidden p-0.5">
                        <img src="XuJuDXrePh.gif" alt="Bot" class="w-full h-full object-cover rounded-full" style="background: transparent;">
                    </div>
                    <div class="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-md border border-slate-100 max-w-[85%]">
                        <p class="message-text text-slate-700 text-sm leading-relaxed">${escapedContent}</p>
                        <span class="text-[10px] text-slate-400 mt-1 block font-light">${time}</span>
                    </div>
                `;
                if (window.globalAudioEnabled) hablarTexto(content);
                playPopSound(); // Reproducir sonido al recibir mensaje

                // Si el chatbot está cerrado, incrementar contador y activar animación de notificación
                if (chatbotBox.style.display === 'none' || getComputedStyle(chatbotBox).display === 'none') {
                    unreadCount++;
                    updateChatNotification();
                }
            }
            chatbotMessages.appendChild(message);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }

        function showTypingIndicator() {
            const typing = document.createElement('div');
            typing.className = 'flex gap-3 animate-fade-in';
            typing.id = 'typing-indicator';
            typing.style.transition = 'opacity 0.5s ease';
            typing.style.opacity = '1';
            typing.innerHTML = `
                <div class="w-14 h-14 rounded-full bg-transparent border border-primary/20 flex flex-shrink-0 shadow-md overflow-hidden animate-pulse" style="padding: 2px;">
                    <img src="YpGY.gif" alt="Thinking Bot" class="w-full h-full object-cover rounded-full" style="background: transparent;">
                </div>
                <div class="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-2">
                    <span class="text-gray-500 text-sm">La IA está pensando</span>
                    <span class="flex gap-1">
                        <span class="ai-thinking-dot w-2 h-2 rounded-full bg-primary/60"></span>
                        <span class="ai-thinking-dot w-2 h-2 rounded-full bg-primary/60"></span>
                        <span class="ai-thinking-dot w-2 h-2 rounded-full bg-primary/60"></span>
                        <span class="ai-thinking-dot w-2 h-2 rounded-full bg-primary/60"></span>
                    </span>
                </div>
            `;
            chatbotMessages.appendChild(typing);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
            startTypingSound(); // Iniciar sonido de tecleo
        }

        function removeTypingIndicator() {
            const typing = document.getElementById('typing-indicator');
            if (typing) {
                typing.style.opacity = '0';
                setTimeout(() => {
                    typing.remove();
                }, 500); // Esperar a que termine la animación de desvanecimiento
            }
            stopTypingSound(); // Detener sonido
        }

        function mostrarFormulario(question) {
            if (!question?.formType) return;
            chatbotInputArea.style.display = 'none';
            chatbotFormContainer.classList.remove('hidden');
            chatbotFormContainer.style.display = 'block';
            formFieldContainer.innerHTML = '';
            const label = document.createElement('label');
            label.className = 'block text-sm font-medium text-gray-700 mb-1';
            label.textContent = question.text;
            formFieldContainer.appendChild(label);
            let input;
            if (question.formType === 'select') {
                input = document.createElement('select');
                input.className = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none';
                input.required = true;
                const opt0 = document.createElement('option');
                opt0.value = '';
                opt0.textContent = 'Selecciona una opción...';
                input.appendChild(opt0);
                (question.options || []).forEach(opt => {
                    const o = document.createElement('option');
                    o.value = opt.value;
                    o.textContent = opt.label;
                    input.appendChild(o);
                });
            } else if (question.formType === 'textarea') {
                input = document.createElement('textarea');
                input.className = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none';
                input.rows = 3;
                input.placeholder = question.placeholder || '';
                input.required = question.required !== false;
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.className = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none';
                input.placeholder = question.placeholder || '';
                input.required = true;
            }
            input.name = question.key;
            input.id = 'formField_' + question.key;
            formFieldContainer.appendChild(input);
        }

        function ocultarFormulario() {
            chatbotFormContainer.classList.add('hidden');
            chatbotFormContainer.style.display = 'none';
            chatbotInputArea.style.display = 'flex';
        }

        function addLegalFAQ() {
            const faqContainer = document.createElement('div');
            faqContainer.className = 'flex gap-3 animate-fade-in';
            faqContainer.innerHTML = `
                <div class="w-14 h-14 rounded-full bg-transparent border border-primary/20 flex flex-shrink-0 shadow-md overflow-hidden" style="padding: 2px;">
                    <img src="XuJuDXrePh.gif" alt="Bot FAQ" class="w-full h-full object-cover rounded-full" style="background: transparent;">
                </div>
                <div class="bg-primary/5 rounded-2xl rounded-tl-md px-4 py-3 border border-primary/20 max-w-[85%]">
                    <h4 class="text-primary font-semibold text-sm mb-2"><i class="fas fa-question-circle mr-1"></i> Preguntas frecuentes:</h4>
                    <p class="text-gray-700 text-sm mb-2"><strong>¿Qué hago si el colegio no actúa?</strong><br>Escala a Secretaría de Educación o ICBF (Art. 17 Ley 1620).</p>
                    <p class="text-gray-700 text-sm mb-2"><strong>¿Puedo cambiar de colegio?</strong><br>Sí, Art. 20 Código de Infancia garantiza ambiente seguro.</p>
                    <p class="text-gray-700 text-sm"><strong>¿Qué pasa si me retalien?</strong><br>Art. 28 Decreto 1965: medidas de protección inmediata.</p>
                </div>
            `;
            chatbotMessages.appendChild(faqContainer);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }

        function sendEmailNotification() {
            emailNotification.style.display = 'flex';
            setTimeout(() => { emailNotification.style.display = 'none'; }, 5000);
        }

        function generarRadicado() {
            const now = new Date();
            const fecha = now.toISOString().slice(0, 10).replace(/-/g, '');
            const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
            return `DUIT-${fecha}-${seq}`;
        }

        async function guardarCasoEnSupabase(radicado, entidadesNotificadas = []) {
            if (!supabase) return { success: false, error: 'Supabase no configurado' };
            try {
                let usuarioId = null;
                const { data: existente } = await supabase.from('usuarios').select('id').eq('email', answers.email).maybeSingle();
                if (existente) {
                    usuarioId = existente.id;
                } else {
                    const { data: nuevo } = await supabase.from('usuarios').insert({ email: answers.email }).select('id').single();
                    usuarioId = nuevo?.id || null;
                }
                const entidadesJson = entidadesNotificadas.length ? entidadesNotificadas : ENTIDADES_NOTIFICACION.filter(e => (e.tipos_caso || []).includes('todos')).map(e => e.nombre);
                const { error } = await supabase.from('casos').insert({
                    radicado, email_usuario: answers.email, usuario_id: usuarioId,
                    motivo_caso: answers.motivo_caso || 'Sin especificar',
                    tipo_violencia: answers.tipo_violencia || null,
                    institucion_educativa: answers.institucion_educativa || null,
                    descripcion_detallada: answers.detalles || null,
                    frecuencia: answers.frecuencia || null,
                    personas_involucradas: answers.personas_involucradas || null,
                    estado: 'registrado', componente_ruta: 'atencion',
                    entidades_notificadas: entidadesJson
                });
                if (error) return { success: false, error };
                return { success: true };
            } catch (e) { return { success: false, error: e }; }
        }

        async function sendRealEmail() {
            if (envioEmailLock) return;
            envioEmailLock = true;
            anunciarEnvioCorreo();
            const radicado = radicadoActual || generarRadicado();
            if (!radicadoActual) radicadoActual = radicado;
            const reportDate = new Date().toLocaleString('es-CO');
            const emailDestino = CONFIG_SAFE.EMAIL_DESTINO_PRINCIPAL || 'jlsc4443@gmail.com';
            const baseParams = {
                from_name: 'Asistente Anti-Violencia Escolar - Duitama',
                from_email: answers.email || 'no-reply@duitama.gov.co',
                subject: `Reporte Violencia Escolar - Radicado ${radicado}`,
                report_code: radicado, report_date: reportDate,
                answers: renderAnswersTableHTML(answers),
                motivo_caso: answers.motivo_caso || 'No especificado',
                institucion: answers.institucion_educativa || 'No especificada',
                tipo_violencia: answers.tipo_violencia || 'No especificado',
                frecuencia: answers.frecuencia || 'No especificada',
                detalles: answers.detalles || 'Sin detalles adicionales'
            };
            const tipoCaso = detectarTipoCaso(answers.tipo_violencia || answers.motivo_caso || '');
            const entidadesANotificar = filtrarEntidadesPorCaso(tipoCaso);
            const destinoLower = String(emailDestino || '').toLowerCase();
            const entidadesPorEmail = new Map();
            for (const entidad of entidadesANotificar || []) {
                const emailEnt = String(entidad?.email || '').trim();
                if (!emailEnt) continue;
                const key = emailEnt.toLowerCase();
                if (key === destinoLower) continue;
                if (!entidadesPorEmail.has(key)) entidadesPorEmail.set(key, entidad);
            }
            const entidadesUnicas = Array.from(entidadesPorEmail.values());
            let dbResult = { success: true };
            const yaGuardado = radicadoActual && radicadoActual === radicado;
            if (!yaGuardado) {
                dbResult = await guardarCasoEnSupabase(radicado, entidadesANotificar.map(e => e.nombre));
            }
            const nombresEntidades = entidadesUnicas.map(e => e.nombre).join(', ');
            emailStatus.classList.remove('error', 'success');

            if (dbResult.success) {
                emailStatus.classList.add('success');
                emailStatus.querySelector('h3').textContent = '¡Reporte Enviado!';
                emailStatus.querySelector('p').textContent = `Tu caso ha sido guardado en la base de datos segura de la ruta integral. \n\nRadicado: ${radicado} \n\nGuarda tu radicado para seguimiento.`;
            } else {
                emailStatus.classList.add('error');
                emailStatus.querySelector('h3').textContent = 'Error al Guardar';
                emailStatus.querySelector('p').textContent = 'No se pudo guardar el reporte en la base de datos. Por favor intenta más tarde.';
            }

            emailStatus.classList.add('show');
            sendEmailNotification();
            envioEmailLock = false;
        }

        function iniciarSiEsCorreo(msg) {
            const email = extraerEmail(msg) || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.trim()) ? msg.trim() : null);
            if (email && !legalMode) {
                legalMode = true;
                currentQuestionIndex = 0;
                answers.email = email;
                currentQuestionIndex = 1;
                showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator();
                    addMessage(`Tu correo registrado es: **${email}**. ¿Es correcto? Si es correcto, escribe qué es lo que está ocurriendo.`);
                }, 800);
                return true;
            }
            return false;
        }

        // ============================================
        // 17. PROCESAR RESPUESTA DEL USUARIO CON GEMINI
        // ============================================
        async function processUserResponse(userMessage) {
            if (!userMessage || !userMessage.trim()) return;

            const lowerMsg = userMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            // Buscar radicado
            const radicadoMatch = userMessage.match(/DUIT[-\s]?(\d{8})[-\s]?(\d{4})/i);
            const radicadoNormalizado = radicadoMatch ? `DUIT-${radicadoMatch[1]}-${radicadoMatch[2]}` : null;
            const emailEnTexto = extraerEmail(userMessage);

            const quiereConsultar = (lowerMsg.includes('estado') || lowerMsg.includes('seguimiento') ||
                lowerMsg.includes('consultar') || lowerMsg.includes('radicado') || lowerMsg.includes('consulta'));

            if (quiereConsultar && (radicadoNormalizado || emailEnTexto)) {
                if (window.goToCarouselSlide) window.goToCarouselSlide(2);
                const section = document.getElementById('consultar-casos');
                section?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
                if (tipoBusquedaSelect && buscarCasosInput) {
                    tipoBusquedaSelect.value = radicadoNormalizado ? 'radicado' : 'correo';
                    buscarCasosInput.value = radicadoNormalizado || emailEnTexto;
                }
                addMessage(`Encontré tu dato de consulta: **${radicadoNormalizado || emailEnTexto}**. Te llevo al buscador.`, false);
                setTimeout(() => { try { btnBuscarCasos?.click?.(); } catch (e) { } }, 300);
                return;
            }

            if (iniciarSiEsCorreo(userMessage)) return;

            const quiereReportar = lowerMsg.includes('reportar') || lowerMsg.includes('denunciar') ||
                lowerMsg.includes('ayuda') || lowerMsg.includes('situacion') || lowerMsg.includes('caso') ||
                lowerMsg.includes('abrir caso') || lowerMsg === 'caso';

            if (quiereReportar && !legalMode) {
                legalMode = true;
                showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator();
                    addMessage("Entiendo. Voy a abrir un caso según la Ley 1620. ¿Me puedes compartir tu correo para darte seguimiento? Si prefieres que sea 100% anónimo, solo escribe 'no' o 'anónimo'.");
                }, 800);
                return;
            }

            const currentQ = questions[currentQuestionIndex];

            // ========== GROQ COMO PRINCIPAL (fuera de reporte) ==========
            if (!legalMode && currentQuestionIndex === 0) {
                showTypingIndicator();

                let intent = await groqClient.classifyIntent(userMessage);
                if (!intent || intent === 'otro') {
                    intent = detectarIntencionLocal(userMessage);
                }

                // Intentamos chatear con Groq
                const aiResponse = await groqClient.chat(userMessage, {
                    mode: intent, legalMode: legalMode, answers: answers, conversationStarted: conversationStarted
                });

                if (aiResponse) {
                    removeTypingIndicator();
                    addMessage(aiResponse, false);
                    if (!conversationStarted) conversationStarted = true;
                    if (intent === 'consultar_legal' && (lowerMsg.includes('violencia') || lowerMsg.includes('acoso'))) {
                        setTimeout(() => {
                            addMessage("¿Te gustaría reportar esta situación? Escribe 'reportar' y te ayudaré.", false);
                        }, 1500);
                    }
                    return;
                }

                // --- FALLBACK PRECONFIGURADO SI GROQ FALLA ---
                const legalResponse = checkLegalKeywords(userMessage);
                if (legalResponse) {
                    removeTypingIndicator();
                    addMessage(legalResponse);
                    setTimeout(() => {
                        addMessage("¿Hay algo más sobre lo que te gustaría consultar?");
                        setTimeout(() => { addLegalFAQ(); }, 1000);
                    }, 2000);
                    return;
                }

                const respuestaLocal = generarRespuestaLocal(userMessage, intent, {
                    legalMode: legalMode, conversationStarted: conversationStarted, answers: answers
                });

                removeTypingIndicator();
                if (respuestaLocal) {
                    addMessage(respuestaLocal, false);
                    if (!conversationStarted) conversationStarted = true;
                    return;
                }

                removeTypingIndicator();
                return; // Fin del pipeline si no es legalMode
            }

            // Si el usuario está llenando el formulario y hace una pregunta local preconfigurada
            if (legalMode) {
                const legalResponse = checkLegalKeywords(userMessage);
                if (legalResponse) {
                    if (currentQ?.key === 'email') {
                        const esEmail = !!extraerEmail(userMessage) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userMessage.trim());
                        if (!esEmail) {
                            showTypingIndicator();
                            setTimeout(() => {
                                removeTypingIndicator();
                                addMessage(legalResponse);
                                addMessage("Cuando quieras, seguimos con tu caso. Comparte tu correo o dime si prefieres omitirlo.");
                            }, 1200);
                            return;
                        }
                    }
                    if (currentQ?.key === 'motivo_caso') {
                        const tipo = detectarTipoCaso(userMessage);
                        if (tipo === 'general') {
                            showTypingIndicator();
                            setTimeout(() => {
                                removeTypingIndicator();
                                addMessage(legalResponse);
                                addMessage("Listo. Ahora sí: ¿qué está ocurriendo en tu situación?");
                            }, 1200);
                            return;
                        }
                    }
                }
            }

            // ========== FLUJO DE REPORTE EXISTENTE ==========
            const valorNormalizado = normalizarRespuesta(userMessage, currentQ?.key);

            if (currentQ && currentQ.validate && !currentQ.validate(userMessage.trim())) {
                showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator();
                    if (currentQ.key === 'email') {
                        addMessage("Por favor ingresa un formato de correo válido, o escribe 'no' si prefieres reportar de forma anónima.");
                    } else {
                        addMessage("Por favor ingresa una respuesta válida.");
                    }
                    addMessage(currentQ.text);
                }, 1500);
                return;
            }

            if (legalMode && currentQ?.key === 'motivo_caso') {
                const resp = userMessage.trim().toLowerCase();
                if (/^(sí|si|correcto|ok|okay|yes|vale|de acuerdo|claro)$/.test(resp)) {
                    showTypingIndicator();
                    setTimeout(() => {
                        removeTypingIndicator();
                        addMessage("¿Qué es lo que está ocurriendo? Escribe brevemente la situación que deseas reportar.");
                    }, 800);
                    return;
                }
                if (/^(no|incorrecto|mal|error|equivocado)$/.test(resp)) {
                    currentQuestionIndex = 0;
                    delete answers.email;
                    showTypingIndicator();
                    setTimeout(() => {
                        removeTypingIndicator();
                        addMessage("Entendido. Por favor escribe tu correo electrónico correcto.");
                    }, 800);
                    return;
                }
                const emailEnTexto2 = extraerEmail(userMessage);
                if (emailEnTexto2) {
                    answers.email = emailEnTexto2;
                    showTypingIndicator();
                    setTimeout(() => {
                        removeTypingIndicator();
                        addMessage(`Correo actualizado: **${emailEnTexto2}**. ¿Es correcto? Si es correcto, escribe qué está ocurriendo.`);
                    }, 800);
                    return;
                }
            }

            if (currentQuestionIndex < questions.length && currentQ) {
                answers[currentQ.key] = (valorNormalizado || userMessage.trim());
            }

            if (legalMode) {
                if (currentQ?.key === 'email' && answers.email) {
                    currentQuestionIndex++;
                    const emailMostrar = answers.email;
                    showTypingIndicator();
                    setTimeout(() => {
                        removeTypingIndicator();
                        addMessage(`Tu correo registrado es: **${emailMostrar}**. ¿Es correcto? Si es correcto, escribe qué es lo que está ocurriendo.`);
                    }, 800);
                    return;
                }

                if (currentQ?.key === 'motivo_caso' && answers.motivo_caso) {
                    radicadoActual = generarRadicado();
                    const toastEl = document.getElementById('toastEnviando');
                    if (toastEl) { toastEl.classList.remove('hidden'); toastEl.style.display = 'flex'; }
                    const tipoCaso = detectarTipoCaso(answers.motivo_caso);
                    const entidades = filtrarEntidadesPorCaso(tipoCaso).map(e => e.nombre);
                    guardarCasoEnSupabase(radicadoActual, entidades).then((result) => {
                        if (toastEl) { toastEl.classList.add('hidden'); toastEl.style.display = 'none'; }
                        if (result.success) {
                            addMessage(`He guardado tu caso con radicado: **${radicadoActual}**. Guarda este número para seguimiento.`);
                        } else {
                            addMessage(`Se creó tu radicado: **${radicadoActual}**. Hubo un problema guardando en la base de datos.`);
                        }
                    }).catch((err) => {
                        if (toastEl) { toastEl.classList.add('hidden'); toastEl.style.display = 'none'; }
                        addMessage(`Radicado: **${radicadoActual}**. Error al guardar. Revisa la consola.`);
                    });
                }

                currentQuestionIndex++;

                if (currentQuestionIndex < questions.length) {
                    const nextQ = questions[currentQuestionIndex];
                    if (nextQ?.formType) {
                        showTypingIndicator();
                        setTimeout(() => {
                            removeTypingIndicator();
                            addMessage(nextQ.text);
                            mostrarFormulario(nextQ);
                        }, currentQ?.key === 'motivo_caso' ? 2500 : 1200);
                    } else {
                        showTypingIndicator();
                        setTimeout(() => {
                            removeTypingIndicator();
                            addMessage(nextQ.text);
                        }, 1200);
                    }
                } else {
                    showTypingIndicator();
                    setTimeout(() => {
                        removeTypingIndicator();
                        addMessage("Voy a enviar tu reporte a las autoridades competentes. Esto puede tomar unos segundos...");
                        sendRealEmail();
                        setTimeout(() => {
                            addMessage("Según la Ley 1620, las instituciones tienen máximo 3 días hábiles para atender tu reporte.");
                            setTimeout(() => {
                                addMessage("¿Hay algo más en lo que pueda ayudarte hoy?");
                                currentQuestionIndex = 0;
                                answers = {};
                                legalMode = false;
                                radicadoActual = null;

                                // Iniciar tour del SIUCE después de un breve momento
                                setTimeout(() => {
                                    if (window.startSiuceTour) window.startSiuceTour();
                                }, 2000);
                            }, 2000);
                        }, 2000);
                    }, 1500);
                }
            } else {
                showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator();
                    addMessage("¿Quieres reportar una situación? Escribe 'reportar' o tu correo para comenzar.");
                }, 1500);
            }
        }

        // ============================================
        // 18. EVENTOS DEL CHATBOT CON ANIMACIÓN 3D
        // ============================================
        function openChatbotBox() {
            unreadCount = 0;
            updateChatNotification();
            chatbotBox.style.display = 'flex';
            chatbotBox.classList.add('flex', 'active-3d');
            chatbotToggle.style.display = 'none';
            setTimeout(() => { chatbotInput.focus(); }, 300);
            if (!conversationStarted) {
                setTimeout(() => {
                    addMessage("Soy experto en normativa colombiana. Puedo ayudarte con:\n\n• Tus derechos como estudiante\n• Procedimientos para reportar situaciones\n• Información legal sobre violencia escolar\n• Recursos de apoyo disponibles\n\n¿Cómo te sientes hoy o qué necesitas saber?");
                    conversationStarted = true;
                }, 1000);
            }
        }

        function closeChatbotBox() {
            chatbotBox.classList.remove('active-3d');
            chatbotBox.style.display = 'none';
            chatbotToggle.style.display = 'flex';
        }

        chatbotToggle.addEventListener('click', function () { playSound('hablar'); openChatbotBox(); });
        openChatbot.addEventListener('click', function () { playSound('hablar'); openChatbotBox(); });
        chatbotClose.addEventListener('click', function () { playSound('cerrar'); closeChatbotBox(); });

        function syncAudioUI() {
            const iconClass = window.globalAudioEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            const text = window.globalAudioEnabled ? "Silenciar Todo" : "Activar Sonido";

            if (voiceToggle) {
                voiceToggle.classList.toggle('active', window.globalAudioEnabled);
                voiceToggle.querySelector('i').className = iconClass;
                voiceToggle.title = window.globalAudioEnabled ? "Silenciar todo" : "Activar audio";
            }

            if (toggleGlobalAudio) {
                toggleGlobalAudio.innerHTML = `<i class="${iconClass}"></i> ${text}`;
            }

            if (!window.globalAudioEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
        }

        if (voiceToggle) {
            voiceToggle.addEventListener('click', function () {
                window.globalAudioEnabled = !window.globalAudioEnabled;
                syncAudioUI();
                playSound('voz');
            });
        }

        if (toggleGlobalAudio) {
            toggleGlobalAudio.addEventListener('click', function () {
                window.globalAudioEnabled = !window.globalAudioEnabled;
                syncAudioUI();
                playSound('voz');
            });
        }

        if (voiceRateInput) {
            voiceRateInput.addEventListener('input', (e) => {
                window.voiceRate = parseFloat(e.target.value);
                if (voiceRateVal) voiceRateVal.textContent = window.voiceRate.toFixed(1);
            });
        }

        // ACCESIBILIDAD Y EMOJIS
        if (increaseFont) {
            increaseFont.addEventListener('click', () => {
                if (currentFontSize < 150) {
                    currentFontSize += fontIncr;
                    updateFontSize();
                    playSound('continuar');
                }
            });
        }
        if (decreaseFont) {
            decreaseFont.addEventListener('click', () => {
                if (currentFontSize > 70) {
                    currentFontSize -= fontIncr;
                    updateFontSize();
                    playSound('continuar');
                }
            });
        }
        if (toggleContrast) {
            toggleContrast.addEventListener('click', () => {
                document.body.classList.toggle('high-contrast');
                playSound('aceptar');
            });
        }

        // Floating Sphere Toggle
        if (accSphere && accContainer) {
            accSphere.addEventListener('click', (e) => {
                e.stopPropagation();
                accContainer.classList.toggle('active');
                playSound('continuar');
            });

            document.addEventListener('click', () => {
                accContainer.classList.remove('active');
            });

            accContainer.querySelector('.accessibility-menu').addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        if (emojiBtn && emojiPicker) {
            emojiBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                emojiPicker.classList.toggle('hidden');
                emojiPicker.style.display = emojiPicker.classList.contains('hidden') ? 'none' : 'grid';
                playSound('continuar');
            });

            emojiPicker.addEventListener('click', (e) => {
                if (e.target.classList.contains('emoji-item')) {
                    chatbotInput.value += e.target.textContent;
                    emojiPicker.classList.add('hidden');
                    emojiPicker.style.display = 'none';
                    chatbotInput.focus();
                    playSound('hablar');
                }
            });

            document.addEventListener('click', () => {
                emojiPicker.classList.add('hidden');
                emojiPicker.style.display = 'none';
            });
        }

        voiceInputBtn.addEventListener('click', function () {
            playSound('voz');
            if (voiceInputBtn.classList.contains('recording')) return;
            iniciarReconocimientoVoz();
        });

        function sendUserMessage() {
            const message = chatbotInput.value.trim();
            if (message === '') return;
            addMessage(message, true);
            chatbotInput.value = '';
            chatbotInput.disabled = true;
            sendMessage.disabled = true;
            processUserResponse(message);
            setTimeout(() => {
                chatbotInput.disabled = false;
                sendMessage.disabled = false;
                chatbotInput.focus();
            }, 2000);
        }

        sendMessage.addEventListener('click', function () { playSound('enviar'); sendUserMessage(); });
        chatbotInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') { playSound('enviar'); sendUserMessage(); } });

        chatbotForm.addEventListener('submit', function (e) {
            e.preventDefault();
            playSound('continuar');
            if (currentQuestionIndex >= questions.length) return;
            const currentQ = questions[currentQuestionIndex];
            const input = formFieldContainer.querySelector('[name="' + currentQ.key + '"]');
            let valor = input?.value?.trim() || '';
            if (currentQ.required !== false && !valor) {
                addMessage("Por favor completa este campo antes de continuar.", false);
                return;
            }
            const valorGuardar = valor || (currentQ.key === 'detalles' ? 'Sin detalles adicionales' : '');
            answers[currentQ.key] = valorGuardar;
            const labelTexto = currentQ.formType === 'select' && currentQ.options && valor
                ? (currentQ.options.find(o => o.value === valor)?.label || valor)
                : (valor || valorGuardar);
            addMessage(labelTexto, true);
            ocultarFormulario();
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                const nextQ = questions[currentQuestionIndex];
                if (nextQ?.formType) {
                    setTimeout(() => {
                        addMessage(nextQ.text);
                        mostrarFormulario(nextQ);
                    }, 800);
                } else {
                    showTypingIndicator();
                    setTimeout(() => {
                        removeTypingIndicator();
                        addMessage(nextQ.text);
                    }, 800);
                }
            } else {
                if (supabase && radicadoActual) {
                    supabase.from('casos').update({
                        tipo_violencia: answers.tipo_violencia || 'No especificado',
                        institucion_educativa: answers.institucion_educativa || 'No especificada',
                        frecuencia: answers.frecuencia || 'No especificada',
                        descripcion_detallada: answers.detalles || 'Sin detalles adicionales'
                    }).eq('radicado', radicadoActual).then(() => { });
                }
                showTypingIndicator();
                setTimeout(() => {
                    removeTypingIndicator();
                    addMessage("Voy a enviar tu reporte a las autoridades competentes. Esto puede tomar unos segundos...");
                    sendRealEmail();
                    setTimeout(() => {
                        addMessage("Según la Ley 1620, las instituciones tienen máximo 3 días hábiles para atender tu reporte.");
                        setTimeout(() => {
                            addMessage("¿Hay algo más en lo que pueda ayudarte hoy?");
                            currentQuestionIndex = 0;
                            answers = {};
                            legalMode = false;
                            radicadoActual = null;

                            // Iniciar tour del SIUCE después de un breve momento
                            setTimeout(() => {
                                if (window.startSiuceTour) window.startSiuceTour();
                            }, 2000);
                        }, 2000);
                    }, 2000);
                }, 800);
            }
        });

        chatbotMessages.addEventListener('click', function (e) {
            const chip = e.target.closest('[data-msg]');
            if (chip && chip.dataset.msg) {
                playSound('reportar');
                chatbotInput.value = chip.dataset.msg;
                sendUserMessage();
            }
        });

        closeEmailStatus.addEventListener('click', function () {
            playSound('aceptar');
            emailStatus.classList.remove('show');
            emailStatus.classList.remove('success', 'error');
        });

        if (closeSiuce) {
            closeSiuce.addEventListener('click', () => {
                siuceModal.classList.add('hidden');
                siuceModal.classList.remove('flex');
                playSound('cerrar');
            });
        }

        if (siuceModal) {
            siuceModal.addEventListener('click', (e) => {
                if (e.target === siuceModal) {
                    siuceModal.classList.add('hidden');
                    siuceModal.classList.remove('flex');
                }
            });
        }

        if (openSiuceSidebar) {
            openSiuceSidebar.addEventListener('click', () => {
                siuceModal.classList.remove('hidden');
                siuceModal.classList.add('flex');
                playSound('continuar');
            });
        }
        // ============================================
        // 19. FORMULARIO DE CONTACTO
        // ============================================
        const contactForm = document.getElementById('contactForm');
        const contactStatus = document.getElementById('contactStatus');
        const contactSubmit = document.getElementById('contactSubmit');

        if (contactForm) {
            contactForm.addEventListener('submit', function (e) {
                e.preventDefault();
                playSound('enviar');
                const email = document.getElementById('contactEmail').value.trim();
                const message = document.getElementById('contactMessage').value.trim();
                if (!email || !message) {
                    contactStatus.textContent = 'Por favor completa todos los campos.';
                    contactStatus.style.color = 'var(--danger)';
                    contactStatus.style.display = 'block';
                    return;
                }
                contactSubmit.disabled = true;
                contactSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
                contactStatus.style.display = 'none';
                const emailDestino = CONFIG_SAFE.EMAIL_DESTINO_PRINCIPAL || 'jlsc4443@gmail.com';
                const templateParams = {
                    to_email: emailDestino, from_email: email, from_name: 'Consulta desde web',
                    subject: 'Consulta - Plataforma Anti-Violencia Escolar', message: message,
                    report_code: 'CONSULTA-' + Date.now(), report_date: new Date().toLocaleString('es-CO'),
                    answers: renderConsultaTableHTML(email, message)
                };
                const templateName = CONFIG_SAFE.EMAILJS_TEMPLATE_CONTACTO || CONFIG_SAFE.EMAILJS_TEMPLATE_REPORTE || 'template_reporte_violencia';
                const serviceId = CONFIG_SAFE.EMAILJS_SERVICE_ID || 'default_service';
                emailjs.send(serviceId, templateName, templateParams)
                    .then(function () {
                        contactStatus.textContent = '¡Consulta enviada! Te responderemos pronto.';
                        contactStatus.style.color = 'var(--success)';
                        contactStatus.style.display = 'block';
                        contactForm.reset();
                    })
                    .catch(function (err) {
                        contactStatus.textContent = 'Error al enviar. Intenta de nuevo.';
                        contactStatus.style.color = 'var(--danger)';
                        contactStatus.style.display = 'block';
                    })
                    .finally(function () {
                        contactSubmit.disabled = false;
                        contactSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar consulta';
                    });
            });
        }

        // ============================================
        // 20. CONSULTAR CASOS EN SUPABASE
        // ============================================
        const btnBuscarCasos = document.getElementById('btnBuscarCasos');
        const buscarCasosInput = document.getElementById('buscarCasos');
        const tipoBusquedaSelect = document.getElementById('tipoBusqueda');
        const tablaCasos = document.getElementById('tablaCasos');
        const tablaCasosBody = document.getElementById('tablaCasosBody');
        const casosMensaje = document.getElementById('casosMensaje');
        const paginacionCasos = document.getElementById('paginacionCasos');
        const paginacionInfo = document.getElementById('paginacionInfo');
        const paginaActualSpan = document.getElementById('paginaActual');
        const btnPagAnterior = document.getElementById('btnPagAnterior');
        const btnPagSiguiente = document.getElementById('btnPagSiguiente');
        const ITEMS_PER_PAGE = 5;
        let casosDataTotal = [];
        let paginaActualNum = 1;

        function renderTablaPagina() {
            const total = casosDataTotal.length;
            const totalPaginas = Math.ceil(total / ITEMS_PER_PAGE);
            const inicio = (paginaActualNum - 1) * ITEMS_PER_PAGE;
            const fin = Math.min(inicio + ITEMS_PER_PAGE, total);
            const datosPagina = casosDataTotal.slice(inicio, fin);
            tablaCasosBody.innerHTML = datosPagina.map(c => `
                <tr>
                    <td><strong>${c.radicado || '-'}</strong></td>
                    <td><span class="badge-estado ${claseBadgeEstado(c.estado)}">${formatearEstado(c.estado)}</span></td>
                    <td>${formatearTipo(c.tipo_violencia)}</td>
                    <td>${(c.institucion_educativa || '-').substring(0, 30)}</td>
                    <td>${formatearFecha(c.created_at)}</td>
                </tr>
            `).join('');
            paginacionInfo.textContent = `Mostrando ${inicio + 1}-${fin} de ${total} casos`;
            paginaActualSpan.textContent = `Página ${paginaActualNum} de ${totalPaginas}`;
            btnPagAnterior.disabled = paginaActualNum <= 1;
            btnPagSiguiente.disabled = paginaActualNum >= totalPaginas;
        }

        tipoBusquedaSelect?.addEventListener('change', function () {
            buscarCasosInput.placeholder = this.value === 'radicado' ? 'DUIT-20250314-0001' : 'ejemplo@correo.com';
            buscarCasosInput.value = '';
        });

        function formatearEstado(estado) {
            const map = { registrado: 'Registrado', en_atencion: 'En atención', escalado: 'Escalado', cerrado: 'Cerrado' };
            return map[estado] || estado || 'Registrado';
        }
        function claseBadgeEstado(estado) {
            const map = { registrado: 'badge-registrado', en_atencion: 'badge-en_atencion', escalado: 'badge-escalado', cerrado: 'badge-cerrado' };
            return map[estado] || 'badge-registrado';
        }
        function formatearTipo(tipo) {
            const map = { bullying: 'Bullying', ciberacoso: 'Ciberacoso', violencia_fisica: 'Violencia física', violencia_verbal: 'Violencia verbal', violencia_sexual: 'Violencia sexual', violencia_psicologica: 'Violencia psicológica', exclusion: 'Exclusión', amenazas: 'Amenazas', otro: 'Otro' };
            return map[tipo] || tipo || '-';
        }
        function formatearFecha(fecha) {
            if (!fecha) return '-';
            const d = new Date(fecha);
            return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
        }

        if (btnBuscarCasos && buscarCasosInput) {
            btnBuscarCasos.addEventListener('click', async function () {
                playSound('ley');
                const termino = buscarCasosInput.value.trim();
                if (!termino) {
                    casosMensaje.textContent = 'Ingresa el valor a buscar.';
                    casosMensaje.style.display = 'block';
                    tablaCasos.style.display = 'none';
                    return;
                }
                const tipoBusqueda = tipoBusquedaSelect?.value || 'correo';
                if (!supabase) {
                    casosMensaje.textContent = 'No se puede conectar a la base de datos.';
                    casosMensaje.style.display = 'block';
                    tablaCasos.style.display = 'none';
                    return;
                }
                btnBuscarCasos.disabled = true;
                btnBuscarCasos.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
                let query = supabase.from('casos').select('radicado, estado, tipo_violencia, institucion_educativa, created_at').order('created_at', { ascending: false });
                if (tipoBusqueda === 'radicado') {
                    query = query.eq('radicado', termino.toUpperCase());
                } else {
                    query = query.ilike('email_usuario', '%' + termino + '%');
                }
                const { data, error } = await query;
                btnBuscarCasos.disabled = false;
                btnBuscarCasos.innerHTML = '<i class="fas fa-search"></i> Buscar';
                if (error) {
                    casosMensaje.textContent = 'Error al buscar: ' + (error.message || 'Intenta de nuevo.');
                    casosMensaje.style.display = 'block';
                    tablaCasos.style.display = 'none';
                    return;
                }
                if (!data || data.length === 0) {
                    casosMensaje.textContent = tipoBusqueda === 'radicado' ? 'No se encontró ningún caso con ese radicado.' : 'No se encontraron casos con ese correo.';
                    casosMensaje.style.display = 'block';
                    tablaCasos.style.display = 'none';
                    paginacionCasos.style.display = 'none';
                    return;
                }
                casosDataTotal = data;
                paginaActualNum = 1;
                casosMensaje.style.display = 'none';
                tablaCasos.style.display = 'table';
                paginacionCasos.style.display = 'flex';
                renderTablaPagina();
            });
            btnPagAnterior?.addEventListener('click', function () {
                if (paginaActualNum > 1) { paginaActualNum--; renderTablaPagina(); playSound('ley'); }
            });
            btnPagSiguiente?.addEventListener('click', function () {
                if (paginaActualNum < Math.ceil(casosDataTotal.length / ITEMS_PER_PAGE)) { paginaActualNum++; renderTablaPagina(); playSound('ley'); }
            });
            buscarCasosInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') btnBuscarCasos.click(); });
        }

        // ============================================
        // 21. SMOOTH SCROLLING
        // ============================================
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({ top: targetElement.offsetTop - 80, behavior: 'smooth' });
                }
            });
        });

        // ============================================
        // 22. GUÍA DE USO
        // ============================================
        const btnGuiaBot = document.getElementById('btnGuiaBot');
        const btnGuiaBotHeader = document.getElementById('btnGuiaBotHeader');
        const guiaTexto = 'Guía rápida:\n\n1) Haz clic en "Hablar con el Asistente"\n2) Para abrir un caso, escribe "reportar"\n3) El bot te pedirá tus datos\n4) Recibirás un radicado para seguimiento\n\nPara consultar seguimiento: escribe tu radicado (DUIT-YYYYMMDD-XXXX)';

        function enviarGuiaAlChat() {
            playSound('ley');
            openChatbotBox();
            setTimeout(() => { addMessage(guiaTexto); }, 500);
        }
        if (btnGuiaBot) btnGuiaBot.addEventListener('click', enviarGuiaAlChat);
        if (btnGuiaBotHeader) btnGuiaBotHeader.addEventListener('click', enviarGuiaAlChat);

        // Auto-abrir el bot después de 3 segundos
        setTimeout(() => {
            if (!conversationStarted) {
                openChatbotBox();
            }
        }, 3000);
    }

    function startWhenReady() {
        if (document.getElementById('chatbotToggle')) {
            initApp();
            return;
        }
        document.addEventListener('app:content-ready', initApp, { once: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startWhenReady);
    } else {
        startWhenReady();
    }
})();