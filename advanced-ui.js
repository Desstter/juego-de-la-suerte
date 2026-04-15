// ============================================================================
// INTERFAZ AVANZADA PARA EL MOTOR DE CANDIDATOS
// ============================================================================

// Variables globales
let currentReport = null;
let currentResults = null;

// Formateo de números
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return 'N/A';
    return typeof num === 'number' ? num.toFixed(decimals) : num;
}

// Mostrar tabla de candidatos
function mostrarTablaAvanzada(candidatos, title = "Candidatos") {
    const container = document.getElementById('tabla-resultados');

    if (!candidatos || candidatos.length === 0) {
        container.innerHTML = '<p class="no-data">No hay candidatos disponibles.</p>';
        return;
    }

    let html = `
        <h4>${title} (${candidatos.length} candidatos)</h4>
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
        const rowClass = index < 3 ? 'top-candidate' :
                        (index >= candidatos.length - 3 ? 'bottom-candidate' : '');
        html += `
            <tr class="${rowClass}">
                <td>${candidato.id}</td>
                <td>${formatNumber(candidato.trabajo_duro)}</td>
                <td>${formatNumber(candidato.suerte)}</td>
                <td>${formatNumber(candidato.contrib_trabajo)}</td>
                <td>${formatNumber(candidato.contrib_suerte)}</td>
                <td class="score-total">${formatNumber(candidato.score_total)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// Mostrar estadísticas globales
function mostrarEstadisticasGlobales(stats) {
    const container = document.getElementById('estadisticas-globales');

    if (!stats) {
        container.innerHTML = '<p class="no-data">No hay estadísticas disponibles.</p>';
        return;
    }

    container.innerHTML = `
        <div class="stats-overview">
            <div class="stat-summary">
                <h4>📊 Resumen General (N = ${formatNumber(stats.count, 0)})</h4>
                <div class="summary-grid">
                    <div class="summary-item">
                        <span class="label">Modo:</span>
                        <span class="value">${currentReport?.metadata?.modo_ejecucion || 'N/A'}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Memoria:</span>
                        <span class="value">${currentReport?.metadata?.memoria_estimada?.total_mb || 'N/A'} MB</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Semilla:</span>
                        <span class="value">${currentReport?.metadata?.semilla_usada || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="detailed-stats">
            <div class="stat-table-container">
                <table class="stats-table">
                    <thead>
                        <tr>
                            <th>Variable</th>
                            <th>Media</th>
                            <th>Mediana</th>
                            <th>Std</th>
                            <th>Min</th>
                            <th>Max</th>
                            <th>P10</th>
                            <th>P25</th>
                            <th>P75</th>
                            <th>P90</th>
                            <th>P99</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="variable-name">💼 Trabajo Duro</td>
                            <td>${formatNumber(stats.trabajo_duro.mean)}</td>
                            <td>${formatNumber(stats.trabajo_duro.median)}</td>
                            <td>${formatNumber(stats.trabajo_duro.std)}</td>
                            <td>${formatNumber(stats.trabajo_duro.min)}</td>
                            <td>${formatNumber(stats.trabajo_duro.max)}</td>
                            <td>${formatNumber(stats.trabajo_duro.percentiles?.p10)}</td>
                            <td>${formatNumber(stats.trabajo_duro.percentiles?.p25)}</td>
                            <td>${formatNumber(stats.trabajo_duro.percentiles?.p75)}</td>
                            <td>${formatNumber(stats.trabajo_duro.percentiles?.p90)}</td>
                            <td>${formatNumber(stats.trabajo_duro.percentiles?.p99)}</td>
                        </tr>
                        <tr>
                            <td class="variable-name">🍀 Suerte</td>
                            <td>${formatNumber(stats.suerte.mean)}</td>
                            <td>${formatNumber(stats.suerte.median)}</td>
                            <td>${formatNumber(stats.suerte.std)}</td>
                            <td>${formatNumber(stats.suerte.min)}</td>
                            <td>${formatNumber(stats.suerte.max)}</td>
                            <td>${formatNumber(stats.suerte.percentiles?.p10)}</td>
                            <td>${formatNumber(stats.suerte.percentiles?.p25)}</td>
                            <td>${formatNumber(stats.suerte.percentiles?.p75)}</td>
                            <td>${formatNumber(stats.suerte.percentiles?.p90)}</td>
                            <td>${formatNumber(stats.suerte.percentiles?.p99)}</td>
                        </tr>
                        <tr class="highlighted-row">
                            <td class="variable-name">🎯 Score Total</td>
                            <td>${formatNumber(stats.score_total.mean)}</td>
                            <td>${formatNumber(stats.score_total.median)}</td>
                            <td>${formatNumber(stats.score_total.std)}</td>
                            <td>${formatNumber(stats.score_total.min)}</td>
                            <td>${formatNumber(stats.score_total.max)}</td>
                            <td>${formatNumber(stats.score_total.percentiles?.p10)}</td>
                            <td>${formatNumber(stats.score_total.percentiles?.p25)}</td>
                            <td>${formatNumber(stats.score_total.percentiles?.p75)}</td>
                            <td>${formatNumber(stats.score_total.percentiles?.p90)}</td>
                            <td>${formatNumber(stats.score_total.percentiles?.p99)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="covariance-info">
            <h4>🔗 Covarianzas</h4>
            <div class="covariance-grid">
                <div class="cov-item">
                    <span class="cov-label">Trabajo-Suerte:</span>
                    <span class="cov-value">${formatNumber(stats.covariances?.trabajo_suerte, 6)}</span>
                </div>
                <div class="cov-item">
                    <span class="cov-label">Trabajo-Score:</span>
                    <span class="cov-value">${formatNumber(stats.covariances?.trabajo_score, 6)}</span>
                </div>
                <div class="cov-item">
                    <span class="cov-label">Suerte-Score:</span>
                    <span class="cov-value">${formatNumber(stats.covariances?.suerte_score, 6)}</span>
                </div>
            </div>
        </div>
    `;
}

// Mostrar descomposición de varianza
function mostrarDescomposicionVarianza(varianceAnalysis) {
    const container = document.getElementById('descomposicion-varianza');

    if (!varianceAnalysis) {
        container.innerHTML = '<p class="no-data">Análisis de varianza no disponible.</p>';
        return;
    }

    container.innerHTML = `
        <div class="variance-breakdown">
            <div class="formula-section">
                <h4>📐 Fórmula Teórica</h4>
                <div class="formula-display">
                    <code>Var(score_total) = 0.95² × Var(trabajo) + 0.05² × Var(suerte) + 2 × 0.95 × 0.05 × Cov(trabajo,suerte)</code>
                </div>
            </div>

            <div class="variance-comparison">
                <div class="variance-item">
                    <h5>Varianza Observada</h5>
                    <span class="variance-value">${formatNumber(varianceAnalysis.varianza_observada, 6)}</span>
                </div>
                <div class="variance-item">
                    <h5>Varianza Teórica</h5>
                    <span class="variance-value">${formatNumber(varianceAnalysis.varianza_teorica, 6)}</span>
                </div>
                <div class="variance-item">
                    <h5>Diferencia Absoluta</h5>
                    <span class="variance-value">${formatNumber(varianceAnalysis.diferencia, 6)}</span>
                </div>
            </div>

            <div class="contribution-analysis">
                <h4>📊 Contribuciones a la Varianza</h4>
                <div class="contribution-bars">
                    <div class="contribution-item">
                        <div class="contrib-label">
                            <span class="contrib-name">💼 Trabajo Duro</span>
                            <span class="contrib-percent">${formatNumber(varianceAnalysis.contribuciones.trabajo_pct, 1)}%</span>
                        </div>
                        <div class="contrib-bar">
                            <div class="contrib-fill trabajo" style="width: ${varianceAnalysis.contribuciones.trabajo_pct}%"></div>
                        </div>
                        <div class="contrib-absolute">${formatNumber(varianceAnalysis.componentes_absolutos.trabajo, 6)}</div>
                    </div>

                    <div class="contribution-item">
                        <div class="contrib-label">
                            <span class="contrib-name">🍀 Suerte</span>
                            <span class="contrib-percent">${formatNumber(varianceAnalysis.contribuciones.suerte_pct, 1)}%</span>
                        </div>
                        <div class="contrib-bar">
                            <div class="contrib-fill suerte" style="width: ${Math.max(varianceAnalysis.contribuciones.suerte_pct, 2)}%"></div>
                        </div>
                        <div class="contrib-absolute">${formatNumber(varianceAnalysis.componentes_absolutos.suerte, 6)}</div>
                    </div>

                    <div class="contribution-item">
                        <div class="contrib-label">
                            <span class="contrib-name">🔗 Covarianza</span>
                            <span class="contrib-percent">${formatNumber(varianceAnalysis.contribuciones.covarianza_pct, 1)}%</span>
                        </div>
                        <div class="contrib-bar">
                            <div class="contrib-fill covarianza" style="width: ${Math.max(Math.abs(varianceAnalysis.contribuciones.covarianza_pct), 2)}%"></div>
                        </div>
                        <div class="contrib-absolute">${formatNumber(varianceAnalysis.componentes_absolutos.covarianza, 6)}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Mostrar análisis de sensibilidad
function mostrarAnalisisSensibilidad(sensitivityAnalysis) {
    const container = document.getElementById('analisis-sensibilidad');

    if (!sensitivityAnalysis) {
        container.innerHTML = '<p class="no-data">Análisis de sensibilidad no disponible.</p>';
        return;
    }

    container.innerHTML = `
        <div class="sensitivity-analysis">
            <div class="sensitivity-explanation">
                <h4>🎲 ¿Qué tan importante es la suerte?</h4>
                <p>${sensitivityAnalysis.descripcion}</p>
                <div class="formula-display">
                    <code>${sensitivityAnalysis.formula}</code>
                </div>
            </div>

            <div class="probability-table">
                <table class="sensitivity-table">
                    <thead>
                        <tr>
                            <th>Diferencia en Trabajo (Δ)</th>
                            <th>Probabilidad de Inversión</th>
                            <th>Porcentaje</th>
                            <th>Interpretación</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.values(sensitivityAnalysis.probabilities).map(prob => `
                            <tr>
                                <td>${prob.delta}</td>
                                <td>${formatNumber(prob.probability, 6)}</td>
                                <td class="percentage">${formatNumber(prob.probability_pct, 4)}%</td>
                                <td class="interpretation">${getInterpretation(prob.probability_pct)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="sensitivity-insights">
                <h4>🔍 Insights Clave</h4>
                <ul class="insights-list">
                    <li>🎯 <strong>Carreras cerradas:</strong> Con diferencias de 0.5-1 puntos en trabajo, la suerte puede ser decisiva (${formatNumber(sensitivityAnalysis.probabilities.delta_1?.probability_pct, 2)}% probabilidad).</li>
                    <li>⚖️ <strong>Competencia media:</strong> Con 3-5 puntos de diferencia, la suerte rara vez invierte el orden (${formatNumber(sensitivityAnalysis.probabilities.delta_5?.probability_pct, 2)}% probabilidad).</li>
                    <li>🏔️ <strong>Diferencias grandes:</strong> Con >10 puntos, el trabajo duro prácticamente garantiza la victoria.</li>
                    <li>📈 <strong>Implicación:</strong> El 95% peso del trabajo asegura meritocracia, pero permite sorpresas en competencias muy cerradas.</li>
                </ul>
            </div>
        </div>
    `;
}

// Obtener interpretación de probabilidad
function getInterpretation(percentage) {
    if (percentage > 20) return "🔥 Muy probable";
    if (percentage > 10) return "⚡ Probable";
    if (percentage > 5) return "🎯 Posible";
    if (percentage > 1) return "🤏 Poco probable";
    if (percentage > 0.1) return "❄️ Muy poco probable";
    return "🏔️ Prácticamente imposible";
}

// Mostrar reporte completo
function mostrarReporteCompleto() {
    const container = document.getElementById('json-resultados');
    if (currentReport) {
        container.textContent = JSON.stringify(currentReport, null, 2);
    } else {
        container.textContent = 'No hay reporte disponible. Ejecute primero una simulación.';
    }
}

// Función principal de simulación
async function ejecutarSimulacionAvanzada() {
    const n = parseInt(document.getElementById('candidatos').value);
    const semillaInput = document.getElementById('semilla').value;
    const semilla = semillaInput ? parseInt(semillaInput) : null;
    const modo = document.getElementById('modo').value;
    const topK = parseInt(document.getElementById('topK').value);

    if (n < 1) {
        alert('El número de candidatos debe ser mayor a 0.');
        return;
    }

    // Mostrar indicador de carga
    showLoadingIndicator(true);

    try {
        // Configurar opciones
        const options = {
            seed: semilla,
            mode: modo,
            topK: topK,
            bottomK: topK
        };

        // Ejecutar simulación
        currentResults = await window.advancedGameEngine.generarCandidatos(n, options);
        currentReport = window.advancedGameEngine.generateCompleteReport(currentResults);

        // Actualizar interfaz
        updateInterface();

    } catch (error) {
        console.error('Error en simulación:', error);
        alert('Error durante la simulación: ' + error.message);
    } finally {
        showLoadingIndicator(false);
    }
}

// Actualizar toda la interfaz
function updateInterface() {
    if (!currentReport || !currentResults) return;

    // Mostrar candidatos (TopK si está en modo streaming, todos si modo exacto)
    const candidatosParaMostrar = currentResults.candidatos || currentResults.topK || [];
    mostrarTablaAvanzada(candidatosParaMostrar,
        currentResults.candidatos ? "Todos los Candidatos" : `Top ${currentResults.topK?.length || 0} Candidatos`);

    // Mostrar estadísticas avanzadas
    mostrarEstadisticasGlobales(currentReport.estadisticas_globales);
    mostrarDescomposicionVarianza(currentReport.descomposicion_varianza);
    mostrarAnalisisSensibilidad(currentReport.analisis_sensibilidad);

    // Mostrar reporte JSON
    mostrarReporteCompleto();

    // Mostrar recomendaciones técnicas
    mostrarRecomendacionesTecnicas(currentReport.recomendaciones_tecnicas, currentReport.explicacion_interpretacion);
}

// Mostrar recomendaciones técnicas
function mostrarRecomendacionesTecnicas(recomendaciones, explicaciones) {
    // Actualizar estadísticas con recomendaciones
    const container = document.getElementById('estadisticas');
    if (container) {
        container.innerHTML = `
            <div class="technical-recommendations">
                <h3>🛠️ Recomendaciones Técnicas</h3>
                <ul class="recommendations-list">
                    ${recomendaciones.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>

            <div class="explanations">
                <h3>💡 Interpretación de Resultados</h3>
                <div class="explanations-content">
                    ${explicaciones.map(exp => `<p>${exp}</p>`).join('')}
                </div>
            </div>
        `;
    }
}

// Indicador de carga
function showLoadingIndicator(show) {
    const existingIndicator = document.getElementById('loading-indicator');

    if (show && !existingIndicator) {
        const indicator = document.createElement('div');
        indicator.id = 'loading-indicator';
        indicator.innerHTML = `
            <div class="loading-overlay">
                <div class="loading-content">
                    <div class="spinner"></div>
                    <p>Procesando candidatos...</p>
                    <p class="loading-detail">Esto puede tomar unos momentos para N grandes</p>
                </div>
            </div>
        `;
        document.body.appendChild(indicator);
    } else if (!show && existingIndicator) {
        existingIndicator.remove();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Botón principal de simulación
    document.getElementById('iniciar').addEventListener('click', ejecutarSimulacionAvanzada);

    // Mostrar Top K
    document.getElementById('mostrarTop').addEventListener('click', function() {
        if (!currentResults || !currentResults.topK) {
            alert('Primero debe ejecutar una simulación.');
            return;
        }
        mostrarTablaAvanzada(currentResults.topK, `Top ${currentResults.topK.length} Candidatos`);
    });

    // Mostrar Bottom K
    document.getElementById('mostrarBottom').addEventListener('click', function() {
        if (!currentResults || !currentResults.bottomK) {
            alert('Primero debe ejecutar una simulación.');
            return;
        }
        mostrarTablaAvanzada(currentResults.bottomK, `Bottom ${currentResults.bottomK.length} Candidatos`);
    });

    // Repetir simulación
    document.getElementById('repetir').addEventListener('click', function() {
        if (!currentResults) {
            alert('Primero debe ejecutar una simulación.');
            return;
        }
        ejecutarSimulacionAvanzada();
    });

    // Mostrar reporte completo
    document.getElementById('reporteCompleto').addEventListener('click', function() {
        if (!currentReport) {
            alert('Primero debe ejecutar una simulación.');
            return;
        }
        mostrarReporteCompleto();

        // Scroll to JSON section
        document.getElementById('json-resultados').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });

    // Toggle explicación matemática
    document.getElementById('explicacion').addEventListener('click', function() {
        const explicacion = document.getElementById('explicacion-matematica');
        if (explicacion) {
            explicacion.classList.toggle('hidden');

            if (explicacion.classList.contains('hidden')) {
                this.textContent = '📚 Explicación Matemática';
            } else {
                this.textContent = '🙈 Ocultar Explicación';
            }
        }
    });

    // Auto-ajustar límite de N basado en modo seleccionado
    document.getElementById('modo').addEventListener('change', function() {
        const candidatosInput = document.getElementById('candidatos');
        const modo = this.value;

        if (modo === 'exact') {
            candidatosInput.max = 200000;
        } else {
            candidatosInput.max = 10000000;
        }
    });
});