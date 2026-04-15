// ============================================================================
// MOTOR AVANZADO DEL JUEGO DE SELECCIÓN DE CANDIDATOS
// ============================================================================

// Pseudo-Random Number Generator (PRNG) Mulberry32 mejorado
class AdvancedPRNG {
    constructor(seed = null) {
        this.seed = seed !== null ? seed : Math.floor(Math.random() * 2147483647);
        this.state = this.seed;
    }

    random() {
        this.state |= 0;
        this.state = this.state + 0x6D2B79F5 | 0;
        let t = Math.imul(this.state ^ this.state >>> 15, 1 | this.state);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    randomFloat(min, max, decimals = 2) {
        const value = min + (max - min) * this.random();
        return parseFloat(value.toFixed(decimals));
    }
}

// Heap para mantener TopK/BottomK eficientemente
class MinHeap {
    constructor() {
        this.heap = [];
    }

    parent(i) { return Math.floor((i - 1) / 2); }
    left(i) { return 2 * i + 1; }
    right(i) { return 2 * i + 2; }

    swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    push(item) {
        this.heap.push(item);
        this.heapifyUp(this.heap.length - 1);
    }

    pop() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();

        const root = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.heapifyDown(0);
        return root;
    }

    peek() {
        return this.heap.length > 0 ? this.heap[0] : null;
    }

    size() {
        return this.heap.length;
    }

    heapifyUp(i) {
        while (i > 0) {
            const p = this.parent(i);
            if (this.heap[i].score_total >= this.heap[p].score_total) break;
            this.swap(i, p);
            i = p;
        }
    }

    heapifyDown(i) {
        while (this.left(i) < this.heap.length) {
            let minChild = this.left(i);
            if (this.right(i) < this.heap.length &&
                this.heap[this.right(i)].score_total < this.heap[minChild].score_total) {
                minChild = this.right(i);
            }

            if (this.heap[i].score_total <= this.heap[minChild].score_total) break;
            this.swap(i, minChild);
            i = minChild;
        }
    }
}

// Algoritmo online para estadísticas (Welford extendido)
class OnlineStats {
    constructor() {
        this.reset();
    }

    reset() {
        this.n = 0;
        this.mean_x = 0;
        this.mean_y = 0;
        this.mean_z = 0;
        this.M2_x = 0;
        this.M2_y = 0;
        this.M2_z = 0;
        this.cov_xy = 0;
        this.cov_xz = 0;
        this.cov_yz = 0;
        this.min_x = Infinity;
        this.max_x = -Infinity;
        this.min_y = Infinity;
        this.max_y = -Infinity;
        this.min_z = Infinity;
        this.max_z = -Infinity;
        this.values_x = [];  // Para percentiles en modo exacto
        this.values_y = [];
        this.values_z = [];
    }

    update(trabajo_duro, suerte, score_total, exactMode = false) {
        this.n++;

        // Actualizar min/max
        this.min_x = Math.min(this.min_x, trabajo_duro);
        this.max_x = Math.max(this.max_x, trabajo_duro);
        this.min_y = Math.min(this.min_y, suerte);
        this.max_y = Math.max(this.max_y, suerte);
        this.min_z = Math.min(this.min_z, score_total);
        this.max_z = Math.max(this.max_z, score_total);

        // Algoritmo de Welford para covarianza
        const delta_x = trabajo_duro - this.mean_x;
        const delta_y = suerte - this.mean_y;
        const delta_z = score_total - this.mean_z;

        this.mean_x += delta_x / this.n;
        this.mean_y += delta_y / this.n;
        this.mean_z += delta_z / this.n;

        const delta2_x = trabajo_duro - this.mean_x;
        const delta2_y = suerte - this.mean_y;
        const delta2_z = score_total - this.mean_z;

        this.M2_x += delta_x * delta2_x;
        this.M2_y += delta_y * delta2_y;
        this.M2_z += delta_z * delta2_z;

        this.cov_xy += delta_x * delta2_y;
        this.cov_xz += delta_x * delta2_z;
        this.cov_yz += delta_y * delta2_z;

        // Almacenar valores para percentiles exactos
        if (exactMode) {
            this.values_x.push(trabajo_duro);
            this.values_y.push(suerte);
            this.values_z.push(score_total);
        }
    }

    getStats() {
        if (this.n === 0) return null;

        const variance_x = this.n > 1 ? this.M2_x / (this.n - 1) : 0;
        const variance_y = this.n > 1 ? this.M2_y / (this.n - 1) : 0;
        const variance_z = this.n > 1 ? this.M2_z / (this.n - 1) : 0;

        const covariance_xy = this.n > 1 ? this.cov_xy / (this.n - 1) : 0;
        const covariance_xz = this.n > 1 ? this.cov_xz / (this.n - 1) : 0;
        const covariance_yz = this.n > 1 ? this.cov_yz / (this.n - 1) : 0;

        return {
            count: this.n,
            trabajo_duro: {
                mean: parseFloat(this.mean_x.toFixed(4)),
                variance: parseFloat(variance_x.toFixed(4)),
                std: parseFloat(Math.sqrt(variance_x).toFixed(4)),
                min: this.min_x,
                max: this.max_x,
                median: this.calculatePercentile(this.values_x, 50),
                percentiles: this.calculatePercentiles(this.values_x)
            },
            suerte: {
                mean: parseFloat(this.mean_y.toFixed(4)),
                variance: parseFloat(variance_y.toFixed(4)),
                std: parseFloat(Math.sqrt(variance_y).toFixed(4)),
                min: this.min_y,
                max: this.max_y,
                median: this.calculatePercentile(this.values_y, 50),
                percentiles: this.calculatePercentiles(this.values_y)
            },
            score_total: {
                mean: parseFloat(this.mean_z.toFixed(4)),
                variance: parseFloat(variance_z.toFixed(4)),
                std: parseFloat(Math.sqrt(variance_z).toFixed(4)),
                min: this.min_z,
                max: this.max_z,
                median: this.calculatePercentile(this.values_z, 50),
                percentiles: this.calculatePercentiles(this.values_z)
            },
            covariances: {
                trabajo_suerte: parseFloat(covariance_xy.toFixed(4)),
                trabajo_score: parseFloat(covariance_xz.toFixed(4)),
                suerte_score: parseFloat(covariance_yz.toFixed(4))
            }
        };
    }

    calculatePercentile(values, percentile) {
        if (!values || values.length === 0) return null;

        const sorted = [...values].sort((a, b) => a - b);
        const index = (percentile / 100) * (sorted.length - 1);

        if (Number.isInteger(index)) {
            return sorted[index];
        } else {
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index - lower;
            return sorted[lower] * (1 - weight) + sorted[upper] * weight;
        }
    }

    calculatePercentiles(values) {
        if (!values || values.length === 0) return null;

        const percentiles = [10, 25, 50, 75, 90, 99];
        const result = {};

        for (const p of percentiles) {
            result[`p${p}`] = parseFloat(this.calculatePercentile(values, p).toFixed(4));
        }

        return result;
    }
}

// Motor principal avanzado
class AdvancedCandidateGame {
    constructor() {
        this.MEMORY_LIMIT_EXACT = 200000; // Configurable
        this.candidatos = [];
        this.prng = null;
        this.ultimaSemilla = null;
        this.modeUsed = null;
        this.stats = new OnlineStats();
        this.topKHeap = null;
        this.bottomKHeap = null;
        this.n = 0;
    }

    // Estima memoria requerida para N candidatos
    estimateMemory(n) {
        // Cada candidato: ~240 bytes (6 números de 8 bytes + overhead de objeto JS)
        const candidateMemoryMB = (n * 240) / (1024 * 1024);

        // Arrays adicionales para percentiles: ~24 bytes por candidato * 3 variables
        const percentileMemoryMB = (n * 72) / (1024 * 1024);

        return {
            candidates_mb: parseFloat(candidateMemoryMB.toFixed(2)),
            percentiles_mb: parseFloat(percentileMemoryMB.toFixed(2)),
            total_mb: parseFloat((candidateMemoryMB + percentileMemoryMB).toFixed(2))
        };
    }

    // Selecciona modo de ejecución
    selectMode(n, mode = "auto") {
        if (mode === "exact") return "exact";
        if (mode === "stream") return "stream";

        // Modo auto: usar exact si N <= límite de memoria
        return n <= this.MEMORY_LIMIT_EXACT ? "exact" : "stream";
    }

    // Genera candidatos (modo principal)
    async generarCandidatos(n, options = {}) {
        const {
            seed = null,
            mode = "auto",
            topK = null,
            bottomK = null
        } = options;

        this.n = n;
        this.prng = new AdvancedPRNG(seed);
        this.ultimaSemilla = this.prng.seed;
        this.modeUsed = this.selectMode(n, mode);
        this.stats.reset();

        // Configurar heaps para TopK/BottomK si se especifican
        if (topK) {
            this.topKHeap = new MinHeap();
        }
        if (bottomK) {
            // Para bottomK usamos max-heap simulado con valores negativos
            this.bottomKHeap = new MinHeap();
        }

        const startTime = performance.now();

        if (this.modeUsed === "exact") {
            return await this.generateExactMode(n, topK, bottomK);
        } else {
            return await this.generateStreamMode(n, topK, bottomK);
        }
    }

    async generateExactMode(n, topK, bottomK) {
        this.candidatos = [];

        for (let i = 1; i <= n; i++) {
            const trabajo_duro = this.prng.randomFloat(0, 100, 2);
            const suerte = this.prng.randomFloat(0, 100, 2);
            const contrib_trabajo = parseFloat((trabajo_duro * 0.95).toFixed(2));
            const contrib_suerte = parseFloat((suerte * 0.05).toFixed(2));
            const score_total = parseFloat((contrib_trabajo + contrib_suerte).toFixed(2));

            const candidato = {
                id: i,
                trabajo_duro,
                suerte,
                contrib_trabajo,
                contrib_suerte,
                score_total
            };

            this.candidatos.push(candidato);
            this.stats.update(trabajo_duro, suerte, score_total, true);

            // Yield control periodically for large datasets
            if (i % 10000 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        // Ordenar por score_total descendente
        this.candidatos.sort((a, b) => b.score_total - a.score_total);

        return {
            mode: this.modeUsed,
            n: n,
            seed: this.ultimaSemilla,
            candidatos: this.candidatos,
            topK: topK ? this.candidatos.slice(0, topK) : null,
            bottomK: bottomK ? this.candidatos.slice(-bottomK) : null
        };
    }

    async generateStreamMode(n, topK, bottomK) {
        let processedCandidates = [];

        for (let i = 1; i <= n; i++) {
            const trabajo_duro = this.prng.randomFloat(0, 100, 2);
            const suerte = this.prng.randomFloat(0, 100, 2);
            const contrib_trabajo = parseFloat((trabajo_duro * 0.95).toFixed(2));
            const contrib_suerte = parseFloat((suerte * 0.05).toFixed(2));
            const score_total = parseFloat((contrib_trabajo + contrib_suerte).toFixed(2));

            const candidato = {
                id: i,
                trabajo_duro,
                suerte,
                contrib_trabajo,
                contrib_suerte,
                score_total
            };

            this.stats.update(trabajo_duro, suerte, score_total, false);

            // Mantener TopK heap
            if (topK && this.topKHeap) {
                if (this.topKHeap.size() < topK) {
                    this.topKHeap.push(candidato);
                } else if (candidato.score_total > this.topKHeap.peek().score_total) {
                    this.topKHeap.pop();
                    this.topKHeap.push(candidato);
                }
            }

            // Mantener BottomK heap (simulando max-heap con valores negativos)
            if (bottomK && this.bottomKHeap) {
                const negCandidate = { ...candidato, score_total: -candidato.score_total };
                if (this.bottomKHeap.size() < bottomK) {
                    this.bottomKHeap.push(negCandidate);
                } else if (-candidato.score_total > this.bottomKHeap.peek().score_total) {
                    this.bottomKHeap.pop();
                    this.bottomKHeap.push(negCandidate);
                }
            }

            // Yield control periodically
            if (i % 50000 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        return {
            mode: this.modeUsed,
            n: n,
            seed: this.ultimaSemilla,
            candidatos: null, // No almacenar todos en modo stream
            topK: this.extractTopK(),
            bottomK: this.extractBottomK()
        };
    }

    extractTopK() {
        if (!this.topKHeap) return null;

        const result = [];
        const temp = [];

        // Extraer todos los elementos
        while (this.topKHeap.size() > 0) {
            temp.push(this.topKHeap.pop());
        }

        // Ordenar por score descendente y devolver
        return temp.sort((a, b) => b.score_total - a.score_total);
    }

    extractBottomK() {
        if (!this.bottomKHeap) return null;

        const result = [];
        const temp = [];

        // Extraer todos los elementos y restaurar scores positivos
        while (this.bottomKHeap.size() > 0) {
            const candidate = this.bottomKHeap.pop();
            candidate.score_total = -candidate.score_total;
            temp.push(candidate);
        }

        // Ordenar por score ascendente
        return temp.sort((a, b) => a.score_total - b.score_total);
    }

    // Análisis de descomposición de varianza
    analyzeVarianceDecomposition() {
        const stats = this.stats.getStats();
        if (!stats) return null;

        const var_trabajo = stats.trabajo_duro.variance;
        const var_suerte = stats.suerte.variance;
        const cov_trabajo_suerte = stats.covariances.trabajo_suerte;

        // Var(score_total) = 0.95² * Var(trabajo) + 0.05² * Var(suerte) + 2*0.95*0.05*Cov(trabajo,suerte)
        const theoretical_var = (0.95 * 0.95 * var_trabajo) +
                               (0.05 * 0.05 * var_suerte) +
                               (2 * 0.95 * 0.05 * cov_trabajo_suerte);

        const observed_var = stats.score_total.variance;

        const contrib_trabajo = (0.95 * 0.95 * var_trabajo) / observed_var;
        const contrib_suerte = (0.05 * 0.05 * var_suerte) / observed_var;
        const contrib_covarianza = (2 * 0.95 * 0.05 * cov_trabajo_suerte) / observed_var;

        return {
            varianza_observada: parseFloat(observed_var.toFixed(6)),
            varianza_teorica: parseFloat(theoretical_var.toFixed(6)),
            diferencia: parseFloat(Math.abs(observed_var - theoretical_var).toFixed(6)),
            contribuciones: {
                trabajo_pct: parseFloat((contrib_trabajo * 100).toFixed(2)),
                suerte_pct: parseFloat((contrib_suerte * 100).toFixed(2)),
                covarianza_pct: parseFloat((contrib_covarianza * 100).toFixed(2))
            },
            componentes_absolutos: {
                trabajo: parseFloat((0.95 * 0.95 * var_trabajo).toFixed(6)),
                suerte: parseFloat((0.05 * 0.05 * var_suerte).toFixed(6)),
                covarianza: parseFloat((2 * 0.95 * 0.05 * cov_trabajo_suerte).toFixed(6))
            }
        };
    }

    // Análisis de sensibilidad: probabilidad de que suerte invierta orden
    analyzeSensitivity() {
        // P_flip(Δ) = P(s_b - s_a > 19 * Δ) = ((100 - 19·Δ)^2) / (2·100^2)
        const calculateFlipProbability = (delta) => {
            const threshold = 19 * delta;
            if (threshold >= 100) return 0;
            if (threshold <= 0) return 0.5;

            return Math.pow(100 - threshold, 2) / (2 * 100 * 100);
        };

        const deltas = [0.5, 1, 2, 3, 5, 10, 20];
        const probabilities = {};

        for (const delta of deltas) {
            probabilities[`delta_${delta}`] = {
                delta: delta,
                probability: parseFloat(calculateFlipProbability(delta).toFixed(6)),
                probability_pct: parseFloat((calculateFlipProbability(delta) * 100).toFixed(4))
            };
        }

        return probabilities;
    }

    // Genera reporte completo
    generateCompleteReport(resultados) {
        const stats = this.stats.getStats();
        const varianceAnalysis = this.analyzeVarianceDecomposition();
        const sensitivityAnalysis = this.analyzeSensitivity();
        const memoryEstimate = this.estimateMemory(this.n);

        const report = {
            metadata: {
                modo_ejecucion: this.modeUsed,
                total_candidatos: this.n,
                semilla_usada: this.ultimaSemilla,
                prng_usado: "Mulberry32",
                fecha_generacion: new Date().toISOString(),
                memoria_estimada: memoryEstimate
            },

            candidatos: resultados.candidatos ? {
                todos: resultados.candidatos,
                top_k: resultados.topK,
                bottom_k: resultados.bottomK
            } : {
                top_k: resultados.topK,
                bottom_k: resultados.bottomK,
                nota: "Modo streaming: candidatos individuales no almacenados"
            },

            estadisticas_globales: stats,

            estadisticas_topk: resultados.topK ? this.calculateSubsetStats(resultados.topK) : null,

            estadisticas_bottomk: resultados.bottomK ? this.calculateSubsetStats(resultados.bottomK) : null,

            descomposicion_varianza: varianceAnalysis,

            analisis_sensibilidad: {
                descripcion: "Probabilidad de que la suerte invierta el orden entre dos candidatos con diferencia Δ en trabajo_duro",
                formula: "P_flip(Δ) = ((100 - 19·Δ)²) / (2·100²) para Δ ∈ [0, 5.26]",
                probabilities: sensitivityAnalysis
            },

            recomendaciones_tecnicas: this.generateTechnicalRecommendations(),

            explicacion_interpretacion: this.generateExplanation(stats, varianceAnalysis, sensitivityAnalysis)
        };

        return report;
    }

    calculateSubsetStats(subset) {
        if (!subset || subset.length === 0) return null;

        const subsetStats = new OnlineStats();
        for (const candidato of subset) {
            subsetStats.update(candidato.trabajo_duro, candidato.suerte, candidato.score_total, true);
        }
        return subsetStats.getStats();
    }

    generateTechnicalRecommendations() {
        const memory = this.estimateMemory(this.n);
        const recommendations = [];

        recommendations.push(`Memoria estimada para N=${this.n}: ${memory.total_mb} MB`);

        if (this.n <= 100000) {
            recommendations.push("✅ Tamaño pequeño: modo exacto recomendado para máxima precisión");
        } else if (this.n <= 1000000) {
            recommendations.push("⚠️ Tamaño medio: considerar modo streaming para N > 200,000");
        } else {
            recommendations.push("🚨 Tamaño grande: usar obligatoriamente modo streaming");
        }

        if (memory.total_mb > 1000) {
            recommendations.push("🔶 Alto uso de memoria: monitorear consumo del sistema");
        }

        recommendations.push(`Modo utilizado: ${this.modeUsed}`);
        recommendations.push(`PRNG: Mulberry32 (${this.ultimaSemilla ? 'determinista' : 'no determinista'})`);

        return recommendations;
    }

    generateExplanation(stats, varianceAnalysis, sensitivityAnalysis) {
        const explanations = [];

        // Interpretación de varianza
        if (varianceAnalysis) {
            explanations.push(
                `**Descomposición de Varianza**: El trabajo duro explica ${varianceAnalysis.contribuciones.trabajo_pct}% ` +
                `de la variabilidad total, mientras que la suerte solo ${varianceAnalysis.contribuciones.suerte_pct}%. ` +
                `Esto confirma que el trabajo es el factor dominante.`
            );
        }

        // Interpretación de sensibilidad
        const delta1 = sensitivityAnalysis.delta_1;
        const delta5 = sensitivityAnalysis.delta_5;
        if (delta1 && delta5) {
            explanations.push(
                `**Análisis de Sensibilidad**: La probabilidad de que la suerte invierta el orden entre ` +
                `candidatos con 1 punto de diferencia en trabajo es ${delta1.probability_pct}%. ` +
                `Para 5 puntos de diferencia, cae a ${delta5.probability_pct}%. ` +
                `Esto significa que las "carreras cerradas" son donde la suerte puede ser decisiva.`
            );
        }

        // Interpretación estadística
        if (stats) {
            const cv_trabajo = (stats.trabajo_duro.std / stats.trabajo_duro.mean) * 100;
            const cv_suerte = (stats.suerte.std / stats.suerte.mean) * 100;
            explanations.push(
                `**Dispersión**: El coeficiente de variación del trabajo (${cv_trabajo.toFixed(1)}%) ` +
                `es similar al de la suerte (${cv_suerte.toFixed(1)}%), pero su peso 19x mayor ` +
                `en la fórmula final hace que domine el resultado.`
            );
        }

        return explanations;
    }
}

// Exportar para uso global
window.AdvancedCandidateGame = AdvancedCandidateGame;
window.advancedGameEngine = new AdvancedCandidateGame();