// Tour Guiado Interactivo y Hablado para Asistente Anti-Violencia Escolar

class TourGuide {
    constructor() {
        this.steps = [];
        this.currentStep = 0;
        this.isActive = false;
        this.synth = window.speechSynthesis;
        this.currentUtterance = null;
        this.overlay = null;
        this.tooltip = null;
        this.highlightedElement = null;
        this.originalStyles = new Map();
        
        // Configuración de voz
        this.voiceConfig = {
            rate: 0.9,
            pitch: 1,
            lang: 'es-CO'
        };
        
        this.init();
    }
    
    init() {
        this.createOverlay();
        this.createTooltip();
        this.loadSteps();
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'tour-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9998;
            display: none;
            backdrop-filter: blur(4px);
            transition: all 0.3s ease;
        `;
        document.body.appendChild(this.overlay);
    }
    
    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'tour-tooltip';
        this.tooltip.style.cssText = `
            position: fixed;
            background: linear-gradient(135deg, #0ea5e9, #8b5cf6);
            color: white;
            border-radius: 20px;
            padding: 20px 24px;
            max-width: 350px;
            z-index: 10000;
            display: none;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            font-family: system-ui, -apple-system, sans-serif;
            animation: tourFadeIn 0.4s ease-out;
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes tourFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes tourPulse {
                0%, 100% {
                    box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7);
                }
                50% {
                    box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.3), 0 0 0 8px rgba(139, 92, 246, 0.2);
                }
            }
            
            .tour-highlight {
                position: relative;
                z-index: 9999 !important;
                animation: tourPulse 1.5s ease-in-out infinite;
                border-radius: 12px;
            }
            
            .tour-highlight::before {
                content: '';
                position: absolute;
                top: -4px;
                left: -4px;
                right: -4px;
                bottom: -4px;
                background: linear-gradient(135deg, #0ea5e9, #8b5cf6);
                border-radius: 16px;
                opacity: 0.5;
                z-index: -1;
                animation: tourPulse 1.5s ease-in-out infinite;
            }
            
            .tour-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255,255,255,0.5);
                border-radius: 3px;
                transition: width 0.3s ease;
            }
        `;
        document.head.appendChild(styleSheet);
        
        document.body.appendChild(this.tooltip);
    }
    
    loadSteps() {
        this.steps = [
            {
                element: '#openChatbot',
                title: 'Asistente Virtual',
                description: '¡Haz clic aquí para hablar con el asistente IA! Podrás reportar casos de violencia escolar de forma confidencial y recibir orientación legal basada en la normativa colombiana.',
                icon: 'fas fa-robot',
                action: () => this.showChatbot()
            },
            {
                element: '#btnGuiaBot',
                title: 'Guía de uso del bot',
                description: 'Si olvidas cómo usar el asistente, este botón te enviará una guía completa al chat. También puedes escribir "ayuda" en cualquier momento.',
                icon: 'fas fa-book-open'
            },
            {
                element: '#chatbotToggle',
                title: 'Chat flotante',
                description: 'El asistente siempre está aquí. Haz clic en este ícono para abrir o cerrar el chat cuando lo necesites. ¡Está disponible 24/7!',
                icon: 'fas fa-comment-dots',
                position: 'left'
            },
            {
                element: '#voiceToggle',
                title: '🎤 Entrada de voz',
                description: '¿Prefieres hablar? Usa este botón para activar el reconocimiento de voz. El asistente entenderá lo que digas y te responderá.',
                icon: 'fas fa-microphone',
                waitFor: () => this.ensureChatOpen()
            },
            {
                element: '#legal',
                title: 'Marco Legal Colombiano',
                description: 'Aquí encontrarás toda la normativa vigente: Ley 1620 de 2013, Código de Infancia, protección de datos y más. Haz clic en cualquier tarjeta para ver los detalles.',
                icon: 'fas fa-gavel'
            },
            {
                element: '#consultar-casos',
                title: 'Consultar casos',
                description: '¿Ya reportaste un caso? Aquí puedes hacer seguimiento usando tu correo electrónico o número de radicado (ej: DUIT-20250115-0001).',
                icon: 'fas fa-search'
            },
            {
                element: '#contact',
                title: 'Contacto',
                description: '¿Tienes preguntas adicionales? Envíanos un mensaje directo y te responderemos a la brevedad.',
                icon: 'fas fa-envelope'
            }
        ];
    }
    
    ensureChatOpen() {
        const chatbotBox = document.getElementById('chatbotBox');
        const chatbotToggle = document.getElementById('chatbotToggle');
        
        if (chatbotBox && chatbotBox.style.display === 'none') {
            chatbotToggle.click();
            return true;
        }
        return false;
    }
    
    showChatbot() {
        const chatbotToggle = document.getElementById('chatbotToggle');
        const chatbotBox = document.getElementById('chatbotBox');
        
        if (chatbotBox && chatbotBox.style.display === 'none') {
            chatbotToggle.click();
        }
    }
    
    speak(text, onEnd = null) {
        if (this.currentUtterance) {
            this.synth.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.voiceConfig.lang;
        utterance.rate = this.voiceConfig.rate;
        utterance.pitch = this.voiceConfig.pitch;
        
        // Intentar usar voz en español
        const voices = this.synth.getVoices();
        const spanishVoice = voices.find(voice => voice.lang.includes('es-') || voice.lang.includes('ES'));
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }
        
        if (onEnd) {
            utterance.onend = onEnd;
        }
        
        this.currentUtterance = utterance;
        this.synth.speak(utterance);
    }
    
    stopSpeaking() {
        if (this.currentUtterance) {
            this.synth.cancel();
            this.currentUtterance = null;
        }
    }
    
    highlightElement(element) {
        if (this.highlightedElement) {
            this.removeHighlight();
        }
        
        if (!element) return;
        
        this.highlightedElement = element;
        const originalPosition = window.getComputedStyle(element).position;
        const originalZIndex = window.getComputedStyle(element).zIndex;
        
        this.originalStyles.set(element, {
            position: originalPosition,
            zIndex: originalZIndex
        });
        
        if (originalPosition === 'static') {
            element.style.position = 'relative';
        }
        element.style.zIndex = '9999';
        element.classList.add('tour-highlight');
        
        // Scroll al elemento
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    removeHighlight() {
        if (this.highlightedElement) {
            this.highlightedElement.classList.remove('tour-highlight');
            const styles = this.originalStyles.get(this.highlightedElement);
            if (styles) {
                this.highlightedElement.style.position = styles.position;
                this.highlightedElement.style.zIndex = styles.zIndex;
            }
            this.highlightedElement = null;
        }
    }
    
    showStep() {
        if (this.currentStep >= this.steps.length) {
            this.endTour();
            return;
        }
        
        const step = this.steps[this.currentStep];
        const element = document.querySelector(step.element);
        
        if (!element) {
            console.warn(`Elemento no encontrado: ${step.element}`);
            this.nextStep();
            return;
        }
        
        // Ejecutar acción previa si existe
        if (step.action) {
            step.action();
        }
        
        // Esperar si hay condición
        if (step.waitFor) {
            setTimeout(() => {
                this.showStep();
            }, 800);
            return;
        }
        
        this.highlightElement(element);
        
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        let top, left;
        const position = step.position || 'bottom';
        
        if (position === 'top') {
            top = rect.top - 120;
            left = rect.left + (rect.width / 2) - 175;
        } else if (position === 'left') {
            top = rect.top + (rect.height / 2) - 80;
            left = rect.left - 380;
        } else {
            top = rect.bottom + 20;
            left = rect.left + (rect.width / 2) - 175;
        }
        
        // Asegurar que el tooltip esté dentro de la pantalla
        top = Math.max(20, Math.min(top, viewportHeight - 250));
        left = Math.max(20, Math.min(left, viewportWidth - 370));
        
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
        
        const progress = ((this.currentStep + 1) / this.steps.length) * 100;
        
        this.tooltip.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <i class="${step.icon}" style="font-size: 28px;"></i>
                <h3 style="font-size: 1.3rem; margin: 0; font-weight: 700;">${step.title}</h3>
            </div>
            <p style="margin: 0 0 16px 0; line-height: 1.5; font-size: 0.95rem;">${step.description}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                <div style="display: flex; gap: 8px;">
                    <button id="tour-prev" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 16px; border-radius: 40px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
                        <i class="fas fa-arrow-left"></i> Anterior
                    </button>
                    <button id="tour-next" style="background: white; border: none; color: #0ea5e9; padding: 8px 20px; border-radius: 40px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                        ${this.currentStep === this.steps.length - 1 ? '✨ Finalizar' : 'Siguiente <i class="fas fa-arrow-right"></i>'}
                    </button>
                </div>
                <span style="font-size: 0.8rem; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px;">
                    ${this.currentStep + 1} / ${this.steps.length}
                </span>
            </div>
            <div class="tour-progress" style="width: ${progress}%;"></div>
        `;
        
        this.tooltip.style.display = 'block';
        this.overlay.style.display = 'block';
        
        // Animación de entrada
        this.tooltip.style.animation = 'none';
        this.tooltip.offsetHeight;
        this.tooltip.style.animation = 'tourFadeIn 0.4s ease-out';
        
        // Hablar la descripción
        this.speak(`${step.title}. ${step.description}`);
        
        // Eventos de los botones
        const nextBtn = document.getElementById('tour-next');
        const prevBtn = document.getElementById('tour-prev');
        
        if (nextBtn) {
            nextBtn.onclick = () => this.nextStep();
        }
        if (prevBtn) {
            prevBtn.onclick = () => this.prevStep();
        }
    }
    
    nextStep() {
        this.stopSpeaking();
        this.currentStep++;
        this.showStep();
    }
    
    prevStep() {
        this.stopSpeaking();
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep();
        }
    }
    
    startTour() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentStep = 0;
        this.showStep();
        
        // Agregar evento de tecla ESC para salir
        this.escHandler = (e) => {
            if (e.key === 'Escape') {
                this.endTour();
            }
        };
        document.addEventListener('keydown', this.escHandler);
    }

    startSiuceTour() {
        if (this.isActive) return;
        
        this.stopSpeaking();
        this.isActive = true;
        this.currentStep = 0;
        
        // Pasos específicos para el tour del SIUCE
        const originalSteps = this.steps;
        this.steps = [
            {
                element: '#openSiuceSidebar',
                title: 'Reporte al SIUCE (Gobierno)',
                description: 'Si consideras que tu caso debe ser conocido directamente por el Ministerio de Educación, puedes usar este botón para reportarlo al SIUCE. **Recuerda:** Úsalo solo si es estrictamente necesario y asegúrate de que tu reporte tenga fundamentos reales. Evitemos reportes sin sustento.',
                icon: 'fas fa-shield-halved',
                position: 'left'
            }
        ];

        this.showStep();

        // Al finalizar este tour específico, restaurar los pasos originales
        const originalEndTour = this.endTour.bind(this);
        this.endTour = () => {
            originalEndTour();
            this.steps = originalSteps;
            this.endTour = originalEndTour;
        };

        // Agregar evento de tecla ESC para salir
        this.escHandler = (e) => {
            if (e.key === 'Escape') {
                this.endTour();
            }
        };
        document.addEventListener('keydown', this.escHandler);
    }
    
    endTour() {
        this.stopSpeaking();
        this.isActive = false;
        this.tooltip.style.display = 'none';
        this.overlay.style.display = 'none';
        this.removeHighlight();
        
        document.removeEventListener('keydown', this.escHandler);
        
        // Mostrar mensaje de despedida
        const farewell = document.createElement('div');
        farewell.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 30px;
            background: linear-gradient(135deg, #10b981, #0ea5e9);
            color: white;
            padding: 16px 24px;
            border-radius: 16px;
            z-index: 10001;
            animation: tourFadeIn 0.4s ease-out;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            font-weight: 500;
        `;
        farewell.innerHTML = '<i class="fas fa-check-circle" style="margin-right: 8px;"></i> ¡Tour completado! Ya sabes cómo usar el asistente. ¡Estamos aquí para ayudarte! 🤝';
        document.body.appendChild(farewell);
        
        this.speak('¡Tour completado! Ya sabes cómo usar todas las funciones del asistente. Recuerda que estamos aquí para ayudarte con cualquier situación de violencia escolar.');
        
        setTimeout(() => {
            farewell.style.opacity = '0';
            farewell.style.transition = 'opacity 0.3s';
            setTimeout(() => farewell.remove(), 300);
        }, 5000);
    }
}

// Inicializar el tour cuando el documento esté listo
let tourInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    tourInstance = new TourGuide();
    
    // Botones para iniciar el tour
    const btnGuiaBot = document.getElementById('btnGuiaBot');
    const btnGuiaBotHeader = document.getElementById('btnGuiaBotHeader');
    
    const startTour = () => {
        if (tourInstance) {
            tourInstance.startTour();
        }
    };
    
    if (btnGuiaBot) {
        btnGuiaBot.addEventListener('click', startTour);
    }
    
    if (btnGuiaBotHeader) {
        btnGuiaBotHeader.addEventListener('click', startTour);
    }
    
    // También se puede iniciar desde el chat con el comando "ayuda" o "tour"
    // Esto se integrará con el chatbot principal
    
    console.log('🎯 Tour Guiado listo - Haz clic en "Guía de uso del bot" para iniciar');
});

// Exportar para usar desde el chatbot
window.TourGuide = TourGuide;
window.startTourGuide = () => {
    if (tourInstance) {
        tourInstance.startTour();
    }
};
window.startSiuceTour = () => {
    if (tourInstance) {
        tourInstance.startSiuceTour();
    }
};