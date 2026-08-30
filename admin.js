document.addEventListener("DOMContentLoaded", () => {
    if (!window.supabase || !CONFIG.SUPABASE_URL) {
        alert("Supabase no está configurado en config.js");
        return;
    }

    const sbClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    
    // UI Elements
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('loginError');
    const casosTbody = document.getElementById('casosTbody');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const btnGestionCasos = document.getElementById('btnGestionCasos');
    const submenuCasos = document.getElementById('submenuCasos');
    const chevronCasos = document.getElementById('chevronCasos');
    const btnToggleMenu = document.getElementById('btnToggleMenu');
    const sidebar = document.getElementById('sidebar');
    const currentViewTitle = document.getElementById('currentViewTitle');
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    
    // Modal Elements
    const modal = document.getElementById('modalDetalles');
    const modalBody = document.getElementById('modalBody');
    const modalRadicado = document.getElementById('modalRadicado');
    const btnCerrarModal = document.getElementById('btnCerrarModal');
    const closeModal = document.getElementById('closeModal');
    const btnMarcarCerrado = document.getElementById('btnMarcarCerrado');

    let adminSession = null;
    let todosLosCasos = [];
    let vistaActual = 'activos'; // 'activos' o 'cerrados'
    let casoEnFocoId = null;

    let audioCtx = null;
    function playMenuSound(freq = 600) {
        if (window.globalAudioEnabled === false) return;
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.08);
        } catch (e) {}
    }
    // Login Logic
    btnLogin.addEventListener('click', async () => {
        const u = usernameInput.value.trim();
        const p = passwordInput.value.trim();
        
        if (!u || !p) {
            mostrarErrorLogin();
            return;
        }

        btnLogin.textContent = "Verificando...";
        btnLogin.disabled = true;

        try {
            // Nota: En un app puramente frontend validamos contra la tabla custom administradores
            const { data, error } = await sbClient
                .from('administradores')
                .select('*')
                .eq('usuario', u)
                .eq('password_hash', p)
                .maybeSingle();

            if (error || !data) {
                mostrarErrorLogin();
            } else {
                iniciarSesion(data);
            }
        } catch (e) {
            console.error(e);
            mostrarErrorLogin();
        } finally {
            btnLogin.textContent = "Iniciar Sesión";
            btnLogin.disabled = false;
        }
    });

    function mostrarErrorLogin() {
        loginError.classList.remove('hidden');
        setTimeout(() => loginError.classList.add('hidden'), 3000);
    }

    function iniciarSesion(adminUser) {
        adminSession = adminUser;
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        cargarCasos();
    }

    btnLogout.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    // User Profile Dropdown logic
    if (userMenuBtn && userMenuDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            playMenuSound(700);
            e.stopPropagation();
            userMenuDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userMenuDropdown.contains(e.target)) {
                userMenuDropdown.classList.add('hidden');
            }
        });
    }

    // Sidebar Interactions
    if (btnGestionCasos) {
        btnGestionCasos.addEventListener('click', () => {
            playMenuSound(500);
            submenuCasos.classList.toggle('hidden');
            chevronCasos.style.transform = submenuCasos.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        });
    }

    if (btnToggleMenu) {
        btnToggleMenu.addEventListener('click', () => {
            playMenuSound(600);
            sidebar.classList.toggle('hidden');
            sidebar.classList.toggle('absolute');
            sidebar.classList.toggle('h-full');
        });
    }

    // Cargar casos
    async function cargarCasos() {
        casosTbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500">Cargando datos...</td></tr>`;
        
        try {
            const { data, error } = await sbClient
                .from('casos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            todosLosCasos = data || [];
            renderizarTabla();
        } catch(e) {
            console.error(e);
            casosTbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-500">Error al cargar reportes.</td></tr>`;
        }
    }

    // Renderizar
    function renderizarTabla() {
        // Filtrar según la pestaña activa (activos = registrado/atencion/etc. cerrados = cerrado)
        const casosFiltrados = todosLosCasos.filter(c => {
            const isClosed = c.estado === 'cerrado';
            if (vistaActual === 'cerrados') return isClosed;
            return !isClosed;
        });

        if (casosFiltrados.length === 0) {
            casosTbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500">No hay casos en este estado.</td></tr>`;
            return;
        }

        casosTbody.innerHTML = casosFiltrados.map(c => {
            const fecha = new Date(c.created_at).toLocaleDateString();
            const badgeClass = c.estado === 'cerrado' ? 'bg-gray-100 text-gray-800' 
                             : c.estado === 'registrado' ? 'bg-red-100 text-red-800' 
                             : 'bg-yellow-100 text-yellow-800';

            return `
            <tr class="border-b hover:bg-gray-50 transition">
                <td class="p-4 font-mono text-sm font-semibold">${c.radicado}</td>
                <td class="p-4 text-sm text-gray-600">${fecha}</td>
                <td class="p-4 text-sm capitalize">${(c.tipo_violencia || 'No Especificado').replace('_', ' ')}</td>
                <td class="p-4 text-sm">${c.institucion_educativa || 'N/A'}</td>
                <td class="p-4 text-sm truncate max-w-[150px]">${c.personas_involucradas || 'N/A'}</td>
                <td class="p-4"><span class="px-2 py-1 rounded text-xs font-bold uppercase ${badgeClass}">${c.estado}</span></td>
                <td class="p-4">
                    <button onclick="verDetalles('${c.id}')" class="text-blue-800 hover:text-blue-900 font-semibold text-sm underline">Revisar</button>
                </td>
            </tr>
            `;
        }).join('');
    }

    // Pestañas / Menu lateral
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            playMenuSound(550);
            const targetBtn = e.target.closest('button');
            if(!targetBtn) return;

            tabBtns.forEach(b => {
                b.classList.remove('bg-blue-500/20', 'text-blue-400', 'border-blue-400');
                b.classList.add('text-slate-400', 'hover:bg-slate-800/60', 'border-transparent');
            });
            targetBtn.classList.remove('text-slate-400', 'hover:bg-slate-800/60', 'border-transparent');
            targetBtn.classList.add('bg-blue-500/20', 'text-blue-400', 'border-blue-400');
            
            vistaActual = targetBtn.dataset.target;
            if(currentViewTitle) currentViewTitle.textContent = targetBtn.textContent.trim();
            
            // Cerrar menú en mobile
            if (sidebar && sidebar.classList.contains('absolute')) {
                sidebar.classList.add('hidden');
                sidebar.classList.remove('absolute', 'h-full');
            }
            
            renderizarTabla();
        });
    });

    // Ver detalles
    window.verDetalles = (id) => {
        const caso = todosLosCasos.find(c => c.id === id);
        if (!caso) return;
        
        casoEnFocoId = caso.id;
        modalRadicado.textContent = "Caso: " + caso.radicado;

        if (caso.estado === 'cerrado') {
            btnMarcarCerrado.classList.add('hidden');
        } else {
            btnMarcarCerrado.classList.remove('hidden');
        }

        const notify = caso.entidades_notificadas || [];
        const fDate = new Date(caso.created_at).toLocaleString();

        modalBody.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div><span class="block text-xs uppercase text-gray-500 font-bold">Fecha / Hora</span><p class="text-sm font-semibold">${fDate}</p></div>
                <div><span class="block text-xs uppercase text-gray-500 font-bold">Estado</span><p class="text-sm uppercase font-bold text-blue-800">${caso.estado}</p></div>
                
                <div><span class="block text-xs uppercase text-gray-500 font-bold">Tipo Violencia</span><p class="text-sm">${(caso.tipo_violencia || '-').replace('_', ' ')}</p></div>
                <div><span class="block text-xs uppercase text-gray-500 font-bold">Institución</span><p class="text-sm">${caso.institucion_educativa || '-'}</p></div>
                
                <div><span class="block text-xs uppercase text-gray-500 font-bold">Correo de Contacto</span><p class="text-sm">${caso.email_usuario}</p></div>
                <div><span class="block text-xs uppercase text-gray-500 font-bold">Frecuencia</span><p class="text-sm">${(caso.frecuencia || '-').replace('_', ' ')}</p></div>
            </div>
            
            <div class="mt-4"><span class="block text-xs uppercase text-gray-500 font-bold">Entidades Vinculadas</span>
                <p class="text-sm bg-gray-100 p-2 rounded mt-1">${typeof notify === 'string' ? notify : notify.join(', ') || 'Sin notificaciones'}</p>
            </div>
            
            <div class="mt-4"><span class="block text-xs uppercase text-gray-500 font-bold">Motivo del Reporte</span>
                <p class="text-sm border p-3 rounded mt-1 bg-blue-50/50">${caso.motivo_caso}</p>
            </div>
            
            <div class="mt-4"><span class="block text-xs uppercase text-gray-500 font-bold">Personas Involucradas</span>
                <p class="text-sm border p-3 rounded mt-1 bg-yellow-50/50">${caso.personas_involucradas || 'No se registraron'}</p>
            </div>

            <div class="mt-4"><span class="block text-xs uppercase text-gray-500 font-bold">Descripción Adicional</span>
                <p class="text-sm border p-3 rounded mt-1">${caso.descripcion_detallada || 'Sin detalles'}</p>
            </div>
        `;

        modal.classList.remove('hidden');
    };

    // Cerrar caso
    btnMarcarCerrado.addEventListener('click', async () => {
        if (!casoEnFocoId) return;
        if (!confirm("¿Está seguro de cerrar este caso?")) return;

        try {
            const { error } = await sbClient.from('casos')
                .update({ estado: 'cerrado', cerrado_at: new Date().toISOString() })
                .eq('id', casoEnFocoId);

            if (error) throw error;
            
            // Refrescar localmente
            const c = todosLosCasos.find(x => x.id === casoEnFocoId);
            if(c) c.estado = 'cerrado';
            renderizarTabla();
            modal.classList.add('hidden');
            
        } catch(e) {
            console.error(e);
            alert("Error cerrando caso.");
        }
    });

    // Close Modal Events
    btnCerrarModal.addEventListener('click', () => modal.classList.add('hidden'));
    closeModal.addEventListener('click', () => modal.classList.add('hidden'));
});
