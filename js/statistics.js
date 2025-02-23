class StatisticsManager {
    constructor() {
        this.survivalChart = null;
        this.eliminationChart = null;
        this.chartData = {
            survivors: [456],  // Starting number of players
            eliminations: [0, 0, 0, 0, 0, 0]  // Initialize with 6 rounds
        };
        this.totalPlayers = 456;
    }

    initializeCharts() {
        const survivalCtx = document.getElementById('survival-chart-modal')?.getContext('2d');
        const eliminationCtx = document.getElementById('elimination-chart-modal')?.getContext('2d');

        if (survivalCtx) {
            this.survivalChart = new Chart(survivalCtx, {
                type: 'line',
                data: {
                    labels: ['Start', 'Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', 'Round 6'],
                    datasets: [{
                        label: 'Survivors',
                        data: this.chartData.survivors,
                        borderColor: '#00ff00',
                        backgroundColor: 'rgba(0, 255, 0, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#fff'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Survivors: ${context.parsed.y}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            min: 0,
                            max: 456,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#fff',
                                stepSize: 50
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#fff'
                            }
                        }
                    }
                }
            });
        }

        if (eliminationCtx) {
            this.eliminationChart = new Chart(eliminationCtx, {
                type: 'bar',
                data: {
                    labels: ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', 'Round 6'],
                    datasets: [{
                        label: 'Eliminations',
                        data: this.chartData.eliminations,
                        backgroundColor: 'rgba(255, 0, 0, 0.5)',
                        borderColor: '#ff0000',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#fff'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Eliminated: ${context.parsed.y}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            min: 0,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#fff',
                                stepSize: 50
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#fff'
                            }
                        }
                    }
                }
            });
        }
    }

    updateCharts(round, eliminated) {
        // Validate inputs
        if (round < 1 || round > 6) return;
        if (eliminated < 0) eliminated = 0;
        
        // Get current survivors before this round
        const currentSurvivors = this.chartData.survivors[this.chartData.survivors.length - 1];
        
        // Calculate new survivors after this round
        const newSurvivors = Math.max(0, currentSurvivors - eliminated);
        
        // Update survivors array
        this.chartData.survivors.push(newSurvivors);
        
        // Update eliminations for this round
        this.chartData.eliminations[round - 1] = eliminated;

        // Keep only the last 7 data points for survivors (Start + 6 rounds)
        if (this.chartData.survivors.length > 7) {
            this.chartData.survivors = this.chartData.survivors.slice(-7);
        }

        // Update the charts
        if (this.survivalChart) {
            this.survivalChart.data.datasets[0].data = this.chartData.survivors;
            this.survivalChart.update();
        }

        if (this.eliminationChart) {
            this.eliminationChart.data.datasets[0].data = this.chartData.eliminations;
            this.eliminationChart.update();
        }
    }

    getDetailedStats() {
        const stats = {
            totalParticipants: 456,
            currentSurvivors: this.chartData.survivors[this.chartData.survivors.length - 1],
            totalEliminated: 456 - this.chartData.survivors[this.chartData.survivors.length - 1],
            eliminationsByRound: {},
            roundAnalysis: [],
            predictedSurvivors: 0,
            gameProgress: 0
        };

        // Calculate eliminations by round and build round analysis
        this.chartData.eliminations.forEach((count, index) => {
            const previousSurvivors = index === 0 ? 456 : this.chartData.survivors[index];
            const currentSurvivors = this.chartData.survivors[index + 1];
            
            stats.eliminationsByRound[index + 1] = count;
            const survivalRate = ((currentSurvivors / previousSurvivors) * 100).toFixed(1);
            
            stats.roundAnalysis.push({
                round: index + 1,
                eliminated: count,
                survivors: currentSurvivors,
                survivalRate: survivalRate,
                difficulty: this.getRoundDifficulty(survivalRate)
            });
        });

        // Calculate average survival rate from completed rounds
        const completedRounds = stats.roundAnalysis.filter(r => r.eliminated > 0);
        stats.averageSurvivalRate = completedRounds.length > 0
            ? (completedRounds.reduce((sum, r) => sum + parseFloat(r.survivalRate), 0) / completedRounds.length).toFixed(1)
            : "100.0";

        // Predict next round survivors based on recent trend
        const lastTwoRounds = completedRounds.slice(-2);
        if (lastTwoRounds.length >= 2) {
            const trend = parseFloat(lastTwoRounds[1].survivalRate) - parseFloat(lastTwoRounds[0].survivalRate);
            const nextRoundRate = Math.max(0, Math.min(100, parseFloat(lastTwoRounds[1].survivalRate) + trend));
            stats.predictedSurvivors = Math.max(0, Math.round(stats.currentSurvivors * (nextRoundRate / 100)));
        } else {
            stats.predictedSurvivors = stats.currentSurvivors;
        }

        // Find most deadly round
        const deadliestRound = [...stats.roundAnalysis]
            .sort((a, b) => b.eliminated - a.eliminated)[0];
        
        if (deadliestRound && deadliestRound.eliminated > 0) {
            stats.mostDeadlyRound = {
                round: deadliestRound.round,
                count: deadliestRound.eliminated,
                survivalRate: deadliestRound.survivalRate
            };
        }

        // Calculate game progress (completed rounds / total rounds)
        stats.gameProgress = Math.min(100, ((completedRounds.length) / 6) * 100);

        return stats;
    }

    getRoundDifficulty(survivalRate) {
        if (survivalRate >= 90) return { level: 'Easy', color: '#4CAF50' };
        if (survivalRate >= 70) return { level: 'Moderate', color: '#FFC107' };
        if (survivalRate >= 50) return { level: 'Hard', color: '#FF9800' };
        if (survivalRate >= 30) return { level: 'Very Hard', color: '#F44336' };
        return { level: 'Extreme', color: '#9C27B0' };
    }

    updateDetailedStats() {
        const stats = this.getDetailedStats();
        const detailedStatsElement = document.getElementById('detailed-stats');
        if (!detailedStatsElement) return;

        let html = `
            <div class="stats-overview">
                <div class="stat-card">
                    <h4>Game Progress</h4>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${stats.gameProgress}%"></div>
                    </div>
                    <span>${stats.gameProgress.toFixed(1)}%</span>
                </div>
                <div class="stat-card">
                    <h4>Current Status</h4>
                    <p>Survivors: ${stats.currentSurvivors}</p>
                    <p>Eliminated: ${stats.totalEliminated}</p>
                    <p>Average Survival Rate: ${stats.averageSurvivalRate}%</p>
                </div>
                <div class="stat-card">
                    <h4>Predictions</h4>
                    <p>Predicted Next Round Survivors: ${stats.predictedSurvivors}</p>
                    <p>Predicted Elimination: ${stats.currentSurvivors - stats.predictedSurvivors}</p>
                </div>
            </div>
            <div class="round-analysis">
                <h3>Round-by-Round Analysis</h3>
                <div class="round-cards">
                    ${stats.roundAnalysis.map(round => `
                        <div class="round-card">
                            <h4>Round ${round.round}</h4>
                            <div class="round-stats">
                                <p>Survivors: ${round.survivors}</p>
                                <p>Eliminated: ${round.eliminated}</p>
                                <p>Survival Rate: ${round.survivalRate}%</p>
                                <div class="difficulty-badge" style="background-color: ${round.difficulty.color}">
                                    ${round.difficulty.level}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        if (stats.mostDeadlyRound) {
            html += `
                <div class="deadly-round-info">
                    <h3>Most Deadly Round</h3>
                    <p>Round ${stats.mostDeadlyRound.round}</p>
                    <p>Eliminations: ${stats.mostDeadlyRound.count}</p>
                    <p>Survival Rate: ${stats.mostDeadlyRound.survivalRate}%</p>
                </div>
            `;
        }

        detailedStatsElement.innerHTML = html;
    }
}

// Create global instance
const statisticsManager = new StatisticsManager();
