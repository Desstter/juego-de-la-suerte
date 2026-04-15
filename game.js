// Pseudo-Random Number Generator (PRNG) basado en Mulberry32
class PRNG {
    constructor(seed = null) {
        this.seed = seed !== null ? seed : Math.floor(Math.random() * 2147483647);
        this.state = this.seed;
    }

    // Genera un número entre 0 y 1
    random() {
        this.state |= 0;
        this.state = this.state + 0x6D2B79F5 | 0;
        let t = Math.imul(this.state ^ this.state >>> 15, 1 | this.state);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    // Genera un número decimal entre min y max con decimales específicos
    randomFloat(min, max, decimals = 2) {
        const value = min + (max - min) * this.random();
        return parseFloat(value.toFixed(decimals));
    }
}

// Motor principal del juego
class CandidateGame {
    constructor() {
        this.candidatos = [];
        this.prng = null;
        this.ultimaSemilla = null;
    }

    // Genera N candidatos con trabajo_duro y suerte aleatorios
    generarCandidatos(n, semilla = null) {
        this.prng = new PRNG(semilla);
        this.ultimaSemilla = this.prng.seed;
        this.candidatos = [];

        for (let i = 1; i <= n; i++) {
            const trabajo_duro = this.prng.randomFloat(0, 100, 2);
            const suerte = this.prng.randomFloat(0, 100, 2);

            const contrib_trabajo = parseFloat((trabajo_duro * 0.95).toFixed(2));
            const contrib_suerte = parseFloat((suerte * 0.05).toFixed(2));
            const score_total = parseFloat((contrib_trabajo + contrib_suerte).toFixed(2));

            this.candidatos.push({
                id: i,
                trabajo_duro,
                suerte,
                contrib_trabajo,
                contrib_suerte,
                score_total
            });
        }

        // Ordenar por score_total descendente
        this.candidatos.sort((a, b) => b.score_total - a.score_total);

        return this.candidatos;
    }

    // Obtiene los top K candidatos
    mostrarTop(k) {
        return this.candidatos.slice(0, Math.min(k, this.candidatos.length));
    }

    // Obtiene los bottom K candidatos
    mostrarBottom(k) {
        const start = Math.max(0, this.candidatos.length - k);
        return this.candidatos.slice(start);
    }

    // Exporta resultados en formato JSON
    exportarJSON(candidatos = null) {
        const datos = candidatos || this.candidatos;
        return {
            metadata: {
                total_candidatos: this.candidatos.length,
                candidatos_mostrados: datos.length,
                semilla_usada: this.ultimaSemilla,
                fecha_generacion: new Date().toISOString()
            },
            candidatos: datos,
            estadisticas: this.calcularEstadisticas()
        };
    }

    // Calcula estadísticas de los candidatos
    calcularEstadisticas() {
        if (this.candidatos.length === 0) return {};

        const trabajos = this.candidatos.map(c => c.trabajo_duro);
        const suertes = this.candidatos.map(c => c.suerte);
        const scores = this.candidatos.map(c => c.score_total);

        return {
            trabajo_duro: {
                promedio: parseFloat((trabajos.reduce((a, b) => a + b) / trabajos.length).toFixed(2)),
                minimo: Math.min(...trabajos),
                maximo: Math.max(...trabajos),
                desviacion: parseFloat(this.calcularDesviacion(trabajos).toFixed(2))
            },
            suerte: {
                promedio: parseFloat((suertes.reduce((a, b) => a + b) / suertes.length).toFixed(2)),
                minimo: Math.min(...suertes),
                maximo: Math.max(...suertes),
                desviacion: parseFloat(this.calcularDesviacion(suertes).toFixed(2))
            },
            score_total: {
                promedio: parseFloat((scores.reduce((a, b) => a + b) / scores.length).toFixed(2)),
                minimo: Math.min(...scores),
                maximo: Math.max(...scores),
                desviacion: parseFloat(this.calcularDesviacion(scores).toFixed(2))
            }
        };
    }

    // Calcula desviación estándar
    calcularDesviacion(valores) {
        const promedio = valores.reduce((a, b) => a + b) / valores.length;
        const varianza = valores.reduce((a, b) => a + Math.pow(b - promedio, 2), 0) / valores.length;
        return Math.sqrt(varianza);
    }
}

// Instancia global del juego
const juego = new CandidateGame();

// Funciones de interfaz
function mostrarTabla(candidatos) {
    const container = document.getElementById('tabla-resultados');

    if (candidatos.length === 0) {
        container.innerHTML = '<p class="no-data">No hay candidatos generados.</p>';
        return;
    }

    let html = `
        <table class="results-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Trabajo Duro</th>
                    <th>Suerte</th>
                    <th>Contrib. Trabajo<br>(×0.95)</th>
                    <th>Contrib. Suerte<br>(×0.05)</th>
                    <th>Score Total</th>
                </tr>
            </thead>
            <tbody>
    `;

    candidatos.forEach((candidato, index) => {
        const rowClass = index < 3 ? 'top-candidate' : (index >= candidatos.length - 3 ? 'bottom-candidate' : '');
        html += `
            <tr class="${rowClass}">
                <td>${candidato.id}</td>
                <td>${candidato.trabajo_duro}</td>
                <td>${candidato.suerte}</td>
                <td>${candidato.contrib_trabajo}</td>
                <td>${candidato.contrib_suerte}</td>
                <td class="score-total">${candidato.score_total}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

function mostrarJSON(candidatos) {
    const container = document.getElementById('json-resultados');
    const jsonData = juego.exportarJSON(candidatos);
    container.textContent = JSON.stringify(jsonData, null, 2);
}

function mostrarEstadisticas() {
    const container = document.getElementById('estadisticas');
    const stats = juego.calcularEstadisticas();

    if (Object.keys(stats).length === 0) {
        container.innerHTML = '<p class="no-data">No hay estadísticas disponibles.</p>';
        return;
    }

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <h4>💼 Trabajo Duro</h4>
                <p><strong>Promedio:</strong> ${stats.trabajo_duro.promedio}</p>
                <p><strong>Rango:</strong> ${stats.trabajo_duro.minimo} - ${stats.trabajo_duro.maximo}</p>
                <p><strong>Desviación:</strong> ${stats.trabajo_duro.desviacion}</p>
            </div>
            <div class="stat-card">
                <h4>🍀 Suerte</h4>
                <p><strong>Promedio:</strong> ${stats.suerte.promedio}</p>
                <p><strong>Rango:</strong> ${stats.suerte.minimo} - ${stats.suerte.maximo}</p>
                <p><strong>Desviación:</strong> ${stats.suerte.desviacion}</p>
            </div>
            <div class="stat-card">
                <h4>🎯 Score Total</h4>
                <p><strong>Promedio:</strong> ${stats.score_total.promedio}</p>
                <p><strong>Rango:</strong> ${stats.score_total.minimo} - ${stats.score_total.maximo}</p>
                <p><strong>Desviación:</strong> ${stats.score_total.desviacion}</p>
            </div>
        </div>
        <div class="seed-info">
            <p><strong>🌱 Semilla utilizada:</strong> ${juego.ultimaSemilla}</p>
        </div>
    `;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const btnIniciar = document.getElementById('iniciar');
    const btnMostrarTop = document.getElementById('mostrarTop');
    const btnMostrarBottom = document.getElementById('mostrarBottom');
    const btnRepetir = document.getElementById('repetir');
    const btnExplicacion = document.getElementById('explicacion');

    btnIniciar.addEventListener('click', function() {
        const n = parseInt(document.getElementById('candidatos').value);
        const semillaInput = document.getElementById('semilla').value;
        const semilla = semillaInput ? parseInt(semillaInput) : null;

        if (n < 1 || n > 1000) {
            alert('El número de candidatos debe estar entre 1 y 1000.');
            return;
        }

        const candidatos = juego.generarCandidatos(n, semilla);
        mostrarTabla(candidatos);
        mostrarJSON(candidatos);
        mostrarEstadisticas();
    });

    btnMostrarTop.addEventListener('click', function() {
        if (juego.candidatos.length === 0) {
            alert('Primero debe generar candidatos con "Iniciar Simulación".');
            return;
        }

        const k = parseInt(document.getElementById('topK').value);
        if (k < 1) {
            alert('K debe ser mayor a 0.');
            return;
        }

        const topK = juego.mostrarTop(k);
        mostrarTabla(topK);
        mostrarJSON(topK);
    });

    btnMostrarBottom.addEventListener('click', function() {
        if (juego.candidatos.length === 0) {
            alert('Primero debe generar candidatos con "Iniciar Simulación".');
            return;
        }

        const k = parseInt(document.getElementById('topK').value);
        if (k < 1) {
            alert('K debe ser mayor a 0.');
            return;
        }

        const bottomK = juego.mostrarBottom(k);
        mostrarTabla(bottomK);
        mostrarJSON(bottomK);
    });

    btnRepetir.addEventListener('click', function() {
        if (juego.candidatos.length === 0) {
            alert('Primero debe generar candidatos con "Iniciar Simulación".');
            return;
        }

        const n = juego.candidatos.length;
        const candidatos = juego.generarCandidatos(n);
        mostrarTabla(candidatos);
        mostrarJSON(candidatos);
        mostrarEstadisticas();
    });

    btnExplicacion.addEventListener('click', function() {
        const explicacion = document.getElementById('explicacion-matematica');
        explicacion.classList.toggle('hidden');

        if (explicacion.classList.contains('hidden')) {
            btnExplicacion.textContent = '📚 Explicación Matemática';
        } else {
            btnExplicacion.textContent = '🙈 Ocultar Explicación';
        }
    });
});