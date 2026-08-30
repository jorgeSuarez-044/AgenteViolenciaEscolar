document.addEventListener("DOMContentLoaded", async () => {
    if (!window.supabase || !CONFIG.SUPABASE_URL) return;

    const sbClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

    try {
        const { data: casos, error } = await sbClient.from('casos').select('tipo_violencia, created_at');
        
        if (error) throw error;
        
        if (!casos || casos.length === 0) {
            document.getElementById('statsContainer').innerHTML = "<p style='text-align:center;'>No hay suficientes casos reportados para generar estadísticas.</p>";
            return;
        }

        // Count occurrences of each 'tipo_violencia'
        const LabelsViolencia = {
            'bullying': 'Bullying',
            'ciberacoso': 'Ciberacoso',
            'violencia_fisica': 'Violencia Física',
            'violencia_verbal': 'Violencia Verbal',
            'violencia_psicologica': 'Psicológica',
            'exclusion': 'Exclusión',
            'violencia_sexual': 'Violencia Sexual',
            'amenazas': 'Amenazas',
            'otro': 'Otro'
        };

        const counts = {};
        // Initialize all known types with 0 so they always show in the legend
        Object.keys(LabelsViolencia).forEach(k => counts[k] = 0);

        casos.forEach(c => {
            let t = c.tipo_violencia;
            if (!LabelsViolencia[t]) t = 'otro';
            counts[t] = (counts[t] || 0) + 1;
        });

        // Sort keys by highest count first, but always included
        const sortedKeys = Object.keys(counts).sort((a,b) => counts[b] - counts[a]);
        const labels = sortedKeys.map(k => LabelsViolencia[k]);
        const values = sortedKeys.map(k => counts[k]);

        // Fixed Palette of colors mapped to specific labels
        const colorMap = {
            'Bullying': '#ef4444',
            'Ciberacoso': '#3b82f6',
            'Violencia Física': '#10b981',
            'Violencia Verbal': '#f59e0b', 
            'Psicológica': '#8b5cf6',
            'Exclusión': '#ec4899',
            'Violencia Sexual': '#14b8a6',
            'Amenazas': '#f97316',
            'Otro': '#64748b'
        };
        
        // Dynamically assign fixed colors to the sorted labels
        const assignedColors = labels.map(label => colorMap[label] || '#94a3b8');

        // Rendering Bar Chart
        const ctxBar = document.getElementById('chartViolenciaBar').getContext('2d');
        new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cantidad de Reportes',
                    data: values,
                    backgroundColor: assignedColors,
                    borderColor: 'white',
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { display: false } // Bar legend only shows dataset name, we hide it
                }
            }
        });

        // Rendering Doughnut Chart
        const ctxDoughnut = document.getElementById('chartViolenciaPie').getContext('2d');
        new Chart(ctxDoughnut, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: assignedColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            font: { size: 12 },
                            padding: 15
                        }
                    }
                }
            }
        });

    } catch(err) {
        console.error("Error al obtener estadísticas:", err);
    }
});
