// ?????????????????????????
class UndergroundRadioGame {
    constructor() {
        this.gameState = null;
        this.init();
    }

    init() {
        this.loadGame();
        this.setupEventListeners();
        this.renderAll();
    }

    getDefaultState() {
        return {
            day: 1,
            status: {
                power: 100,
                noise: 0,
                rumor: 0,
                fatigue: 0,
                morale: 50
            },
            thresholds: {
                power: 20,
                noise: 70,
                rumor: 70,
                fatigue: 70,
                morale: 30
            },
            resources: {
                food: 20,
                battery: 10,
                parts: 5,
                medicine: 3
            },
            survivors: this.generateSurvivors(),
            equipment: JSON.parse(JSON.stringify(GameData.equipmentList)),
            districts: JSON.parse(JSON.stringify(GameData.districts)),
            schedule: {
                morning: null,
                afternoon: null,
                evening: null
            },
            selectedBroadcast: null,
            currentQuestion: null,
            answeredQuestions: [],
            rumors: [],
            settlementHistory: [],
            todayActions: {
                broadcastDone: false,
                qaDone: 0,
                repairDone: [],
                rumorSuppressDone: []
            },
            gameOver: false
        };
    }

    generateSurvivors() {
        const survivors = [];
        const count = 4 + Math.floor(Math.random() * 3);
        const shuffledNames = [...GameData.survivorNames].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < count; i++) {
            survivors.push({
                id: 'survivor_' + i,
                name: shuffledNames[i],
                skill: GameData.survivorSkills[Math.floor(Math.random() * GameData.survivorSkills.length)],
                fatigue: Math.floor(Math.random() * 20),
                health: 80 + Math.floor(Math.random() * 20),
                task: null
            });
        }
        return survivors;
    }

    generateRumor() {
        const rumorTemplates = [
            { title: '水源污染谣言', desc: '有人说自来水厂被污染了，不能喝水。', severity: 15 },
            { title: '怪物出没传闻', desc: '传言夜间有怪物在街道游荡。', severity: 20 },
            { title: '食物短缺恐慌', desc: '据说储备物资只够维持一周了。', severity: 18 },
            { title: '政府阴谋论', desc: '有人说这一切都是政府的阴谋。', severity: 12 },
            { title: '传染病扩散', desc: '听说新的传染病正在蔓延。', severity: 22 },
            { title: '救援队骗局', desc: '传言救援队根本不存在。', severity: 15 },
            { title: '核泄漏消息', desc: '据说远处的核电站发生了泄漏。', severity: 25 },
            { title: '暴动计划', desc: '有人在策划抢夺物资的暴动。', severity: 20 }
        ];
        
        const template = rumorTemplates[Math.floor(Math.random() * rumorTemplates.length)];
        return {
            id: 'rumor_' + Date.now() + '_' + Math.random(),
            ...template,
            dayStarted: this.gameState.day
        };
    }

    saveGame() {
        localStorage.setItem('undergroundRadioSave', JSON.stringify(this.gameState));
        this.showEvent('游戏已保存', '你的游戏进度已保存到本地存储。', []);
    }

    loadGame() {
        const saved = localStorage.getItem('undergroundRadioSave');
        if (saved) {
            try {
                this.gameState = JSON.parse(saved);
                this.showEvent('读取存档', '成功读取游戏存档！', []);
            } catch (e) {
                this.gameState = this.getDefaultState();
            }
        } else {
            this.gameState = this.getDefaultState();
            this.generateDailyRumors();
        }
    }

    resetGame() {
        if (confirm('确定要重新开始吗？所有进度将会丢失。')) {
            localStorage.removeItem('undergroundRadioSave');
            this.gameState = this.getDefaultState();
            this.generateDailyRumors();
            this.renderAll();
            this.showEvent('新游戏开始', '欢迎来到地下广播站！你的任务是维持广播运营，安抚民心，管理物资和幸存者。', []);
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        document.getElementById('endDayBtn').addEventListener('click', () => this.endDay());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveGame());
        document.getElementById('loadBtn').addEventListener('click', () => { this.loadGame(); this.renderAll(); });
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());

        document.getElementById('doBroadcastBtn').addEventListener('click', () => this.doBroadcast());
        document.getElementById('doRepairBtn').addEventListener('click', () => this.doRepair());
        document.getElementById('suppressRumorBtn').addEventListener('click', () => this.suppressRumor());

        ['power', 'noise', 'rumor', 'fatigue', 'morale'].forEach(stat => {
            const slider = document.getElementById(stat + 'ThresholdSlider');
            const valSpan = document.getElementById(stat + 'ThresholdVal');
            slider.addEventListener('input', (e) => {
                this.gameState.thresholds[stat] = parseInt(e.target.value);
                valSpan.textContent = e.target.value;
                this.renderStatus();
            });
        });

        document.getElementById('modalCloseBtn').addEventListener('click', () => this.closeModal());
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');

        if (tabName === 'qa' && !this.gameState.currentQuestion) {
            this.generateQuestion();
        }
    }

    renderAll() {
        this.renderStatus();
        this.renderResources();
        this.renderSurvivors();
        this.renderDistrictTrust();
        this.renderSchedule();
        this.renderBroadcasts();
        this.renderEquipment();
        this.renderRumors();
        this.renderSettlements();
        this.renderThresholds();
    }

    renderStatus() {
        const { status, thresholds } = this.gameState;
        
        ['power', 'noise', 'rumor', 'fatigue', 'morale'].forEach(stat => {
            const value = Math.max(0, Math.min(100, status[stat]));
            const fill = document.getElementById(stat + 'Fill');
            const val = document.getElementById(stat + 'Value');
            const thresholdDisplay = document.getElementById(stat + 'Threshold');
            
            fill.style.width = value + '%';
            val.textContent = Math.round(value);
            
            const isWarning = (stat === 'power' || stat === 'morale') 
                ? value <= thresholds[stat] 
                : value >= thresholds[stat];
            
            fill.classList.toggle('warning', isWarning);
            thresholdDisplay.textContent = thresholds[stat];
            
            const slider = document.getElementById(stat + 'ThresholdSlider');
            const valSpan = document.getElementById(stat + 'ThresholdVal');
            if (slider) slider.value = thresholds[stat];
            if (valSpan) valSpan.textContent = thresholds[stat];
        });

        document.getElementById('dayCount').textContent = this.gameState.day;
    }

    renderThresholds() {
        Object.keys(this.gameState.thresholds).forEach(stat => {
            document.getElementById(stat + 'Threshold').textContent = this.gameState.thresholds[stat];
        });
    }

    renderResources() {
        const { resources } = this.gameState;
        document.getElementById('foodCount').textContent = resources.food;
        document.getElementById('batteryCount').textContent = resources.battery;
        document.getElementById('partsCount').textContent = resources.parts;
        document.getElementById('medicineCount').textContent = resources.medicine;
    }

    renderSurvivors() {
        const container = document.getElementById('survivorList');
        const repairSelect = document.getElementById('repairSurvivor');
        
        container.innerHTML = '';
        repairSelect.innerHTML = '';

        this.gameState.survivors.forEach(survivor => {
            const card = document.createElement('div');
            card.className = 'survivor-card';
            if (survivor.fatigue >= 70) card.classList.add('exhausted');
            else if (survivor.fatigue >= 40) card.classList.add('tired');

            card.innerHTML = `
                <div class="survivor-name">${survivor.name} <small style="color:#888">[${survivor.skill}]</small></div>
                <div class="survivor-stats">
                    <span>❤️ ${survivor.health}%</span>
                    <span>😴 ${survivor.fatigue}%</span>
                </div>
                ${survivor.task ? `<div class="survivor-task">${survivor.task}</div>` : ''}
            `;
            container.appendChild(card);

            if (!survivor.task) {
                const option = document.createElement('option');
                option.value = survivor.id;
                option.textContent = `${survivor.name} (${survivor.skill})`;
                repairSelect.appendChild(option);
            }
        });
    }

    renderDistrictTrust() {
        const container = document.getElementById('districtTrust');
        container.innerHTML = '';

        this.gameState.districts.forEach(district => {
            const item = document.createElement('div');
            item.className = 'district-item';
            item.innerHTML = `
                <div class="district-name">
                    <span>${district.name}</span>
                    <span style="color:#3498db">${district.trust}%</span>
                </div>
                <div class="district-bar">
                    <div class="district-bar-fill" style="width:${district.trust}%"></div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    renderSchedule() {
        ['morning', 'afternoon', 'evening'].forEach(slot => {
            const optionsContainer = document.getElementById(slot + 'Options');
            const slotDisplay = document.getElementById('slot' + slot.charAt(0).toUpperCase() + slot.slice(1));
            const audienceInfo = document.getElementById(slot + 'AudienceInfo');
            
            optionsContainer.innerHTML = '';

            if (audienceInfo) {
                this.renderSlotAudienceInfo(audienceInfo, slot);
            }
            
            GameData.programTypes.forEach(program => {
                const btn = document.createElement('button');
                btn.className = 'program-btn';
                if (this.gameState.schedule[slot] === program.id) {
                    btn.classList.add('selected');
                }
                
                const effectsText = Object.entries(program.effects)
                    .map(([k, v]) => `${this.getStatName(k)} ${v > 0 ? '+' : ''}${v}`)
                    .join(', ');

                const reachInfo = this.getProgramReachInfo(program.id, slot);
                const audienceBreakdown = this.getProgramAudienceBreakdown(program.id, slot);
                
                const ratingHtml = reachInfo ? `
                    <div class="program-rating ${reachInfo.overallRating.class}">
                        ${reachInfo.overallRating.icon} ${reachInfo.overallRating.text}
                        <span class="reach-score">预计触达: ${reachInfo.totalEffectiveReach}%</span>
                    </div>
                ` : '';

                const audienceHtml = audienceBreakdown && audienceBreakdown.length > 0 ? `
                    <div class="program-audience">
                        <span class="program-audience-label">👥 触达人群:</span>
                        ${audienceBreakdown.map(a => `
                            <span class="audience-mini-tag" title="${a.name} 相对触达 ${a.percentage}%">
                                ${a.icon} ${a.percentage}%
                            </span>
                        `).join('')}
                    </div>
                ` : '';

                const themesHtml = program.themes && program.themes.length > 0 ? `
                    <div class="program-themes">
                        ${program.themes.map(t => `<span class="theme-tag">${this.getThemeName(t)}</span>`).join('')}
                    </div>
                ` : '';
                
                btn.innerHTML = `
                    <div>${program.name}</div>
                    ${themesHtml}
                    ${audienceHtml}
                    <div class="program-effects">${effectsText} | ⚡${program.power}</div>
                    ${ratingHtml}
                `;
                
                btn.addEventListener('click', () => this.selectProgram(slot, program.id));
                optionsContainer.appendChild(btn);
            });

            const current = this.gameState.schedule[slot];
            if (current) {
                const program = GameData.programTypes.find(p => p.id === current);
                const reachInfo = this.getProgramReachInfo(current, slot);
                const audienceBreakdown = this.getProgramAudienceBreakdown(current, slot);
                if (program && reachInfo) {
                    const audienceText = audienceBreakdown && audienceBreakdown.length > 0
                        ? audienceBreakdown.slice(0, 2).map(a => `${a.icon}`).join('')
                        : '';
                    slotDisplay.innerHTML = `
                        ${program.name} ${audienceText}
                        <span class="slot-rating ${reachInfo.overallRating.class}">
                            ${reachInfo.overallRating.icon} 触达${reachInfo.totalEffectiveReach}%
                        </span>
                    `;
                } else {
                    slotDisplay.textContent = program ? program.name : '未安排';
                }
            } else {
                slotDisplay.textContent = '未安排';
            }
        });
    }

    getSlotDistrictAudience(slot, districtType) {
        if (!districtType) return [];
        const schedule = GameData.audienceSchedule[slot];
        if (!schedule) return [];

        const audiences = [];
        districtType.primaryAudience.forEach(audId => {
            const rate = schedule[audId] || 0;
            if (rate > 0.3) {
                audiences.push({
                    id: audId,
                    ...GameData.audienceGroups[audId],
                    rate: rate,
                    isPrimary: true
                });
            }
        });

        districtType.primaryAudience.forEach(audId => {
            const rate = schedule[audId] || 0;
            if (rate <= 0.3 && rate > 0) {
                audiences.push({
                    id: audId,
                    ...GameData.audienceGroups[audId],
                    rate: rate,
                    isPrimary: true
                });
            }
        });

        Object.keys(GameData.audienceGroups).forEach(audId => {
            if (!districtType.primaryAudience.includes(audId)) {
                const rate = schedule[audId] || 0;
                if (rate > 0.5) {
                    audiences.push({
                        id: audId,
                        ...GameData.audienceGroups[audId],
                        rate: rate,
                        isPrimary: false
                    });
                }
            }
        });

        audiences.sort((a, b) => b.rate - a.rate);
        return audiences.slice(0, 4);
    }

    getProgramAudienceBreakdown(programId, slot) {
        const program = GameData.programTypes.find(p => p.id === programId);
        if (!program) return [];

        const allAudienceWeights = {};

        this.gameState.districts.forEach(district => {
            const districtType = this.getDistrictType(district.id);
            const reach = this.getAudienceReach(slot, districtType);
            const themeMatch = this.getThemeMatch(program.themes, districtType);

            reach.audiences.forEach(aud => {
                if (!allAudienceWeights[aud.id]) {
                    allAudienceWeights[aud.id] = {
                        id: aud.id,
                        ...GameData.audienceGroups[aud.id],
                        totalWeight: 0
                    };
                }
                const effectiveWeight = aud.weight * themeMatch.multiplier * (district.trust / 100);
                allAudienceWeights[aud.id].totalWeight += effectiveWeight;
            });
        });

        const result = Object.values(allAudienceWeights)
            .sort((a, b) => b.totalWeight - a.totalWeight)
            .slice(0, 4);

        const maxWeight = result.length > 0 ? result[0].totalWeight : 1;
        return result.map(a => ({
            ...a,
            percentage: maxWeight > 0 ? Math.round((a.totalWeight / maxWeight) * 100) : 0
        }));
    }

    renderSlotAudienceInfo(container, slot) {
        const slotInfo = GameData.timeSlots[slot];
        const allAudienceData = [];

        Object.keys(GameData.audienceGroups).forEach(audId => {
            const rate = GameData.audienceSchedule[slot][audId] || 0;
            allAudienceData.push({
                id: audId,
                ...GameData.audienceGroups[audId],
                rate: rate
            });
        });
        allAudienceData.sort((a, b) => b.rate - a.rate);

        const districtSummary = [];
        this.gameState.districts.forEach(district => {
            const districtType = this.getDistrictType(district.id);
            if (districtType) {
                const reach = this.getAudienceReach(slot, districtType);
                const slotAudiences = this.getSlotDistrictAudience(slot, districtType);
                districtSummary.push({
                    district: district,
                    districtType: districtType,
                    reach: reach,
                    slotAudiences: slotAudiences
                });
            }
        });

        container.innerHTML = `
            <div class="audience-info-panel">
                <div class="audience-info-section">
                    <div class="audience-info-title">📊 ${slotInfo.name} 听众活跃度</div>
                    <div class="audience-rate-list">
                        ${allAudienceData.map(a => `
                            <div class="audience-rate-item" title="收听率 ${Math.round(a.rate * 100)}%">
                                <span class="audience-icon">${a.icon}</span>
                                <span class="audience-name">${a.name.replace(/^[^\s]+\s/, '')}</span>
                                <div class="audience-rate-bar">
                                    <div class="audience-rate-fill" style="width:${a.rate * 100}%"></div>
                                </div>
                                <span class="audience-rate-value">${Math.round(a.rate * 100)}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="audience-info-section">
                    <div class="audience-info-title">🏙️ 各城区收听情况 & 关注主题</div>
                    <div class="district-reach-list">
                        ${districtSummary.map(d => {
                            const preferredThemesHtml = d.districtType.preferredThemes && d.districtType.preferredThemes.length > 0
                                ? `<div class="district-themes">
                                     <span class="district-themes-label">👍 关注:</span>
                                     ${d.districtType.preferredThemes.map(t => `<span class="theme-tag theme-preferred">${this.getThemeName(t)}</span>`).join('')}
                                   </div>` : '';
                            const dislikedThemesHtml = d.districtType.dislikedThemes && d.districtType.dislikedThemes.length > 0
                                ? `<div class="district-themes">
                                     <span class="district-themes-label">👎 排斥:</span>
                                     ${d.districtType.dislikedThemes.map(t => `<span class="theme-tag theme-disliked">${this.getThemeName(t)}</span>`).join('')}
                                   </div>` : '';
                            const audienceHtml = d.slotAudiences && d.slotAudiences.length > 0
                                ? `<div class="district-audiences">
                                     <span class="district-audiences-label">👥 听众:</span>
                                     ${d.slotAudiences.map(a => `
                                        <span class="audience-mini-tag" title="${a.name} 收听率 ${Math.round(a.rate * 100)}%">
                                            ${a.icon} ${Math.round(a.rate * 100)}%
                                        </span>
                                     `).join('')}
                                   </div>` : '';
                            return `
                            <div class="district-reach-item district-reach-item-expanded">
                                <div class="district-reach-header">
                                    <span class="district-type-icon">${d.districtType.icon}</span>
                                    <span class="district-reach-name">${d.district.name}</span>
                                    <span class="district-type-label">${d.districtType.name}</span>
                                    <div class="district-reach-bar">
                                        <div class="district-reach-fill" style="width:${d.reach.total}%"></div>
                                    </div>
                                    <span class="district-reach-value">${d.reach.total}%</span>
                                </div>
                                <div class="district-details">
                                    ${audienceHtml}
                                    ${preferredThemesHtml}
                                    ${dislikedThemesHtml}
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderBroadcasts() {
        const container = document.getElementById('broadcastList');
        container.innerHTML = '';

        GameData.broadcastMessages.forEach(msg => {
            const item = document.createElement('div');
            item.className = 'broadcast-item';
            if (this.gameState.selectedBroadcast === msg.id) {
                item.classList.add('selected');
            }

            const themesHtml = msg.themes && msg.themes.length > 0 ? `
                <div class="broadcast-item-themes">
                    ${msg.themes.map(t => `<span class="theme-tag">${this.getThemeName(t)}</span>`).join('')}
                </div>
            ` : '';
            
            item.innerHTML = `
                <div class="broadcast-title">${msg.title}</div>
                <div class="broadcast-desc">${msg.content}</div>
                ${themesHtml}
            `;
            
            item.addEventListener('click', () => this.selectBroadcast(msg.id));
            container.appendChild(item);
        });

        const analysisContainer = document.getElementById('broadcastReachAnalysis');
        if (analysisContainer) {
            if (this.gameState.todayActions.broadcastDone) {
                analysisContainer.innerHTML = '<div class="empty-analysis">✅ 今日播报已完成，明日可继续播报</div>';
            } else if (this.gameState.selectedBroadcast) {
                this.renderBroadcastReachAnalysis(this.gameState.selectedBroadcast);
            } else {
                analysisContainer.innerHTML = '<div class="empty-analysis">📊 选择消息后可查看各时段传播效果分析</div>';
            }
        }

        document.getElementById('doBroadcastBtn').disabled = 
            !this.gameState.selectedBroadcast || this.gameState.todayActions.broadcastDone;
    }

    renderEquipment() {
        const container = document.getElementById('equipmentList');
        const select = document.getElementById('repairEquipment');
        
        container.innerHTML = '';
        select.innerHTML = '';

        this.gameState.equipment.forEach(eq => {
            const item = document.createElement('div');
            item.className = 'equipment-item';
            
            let conditionClass = 'condition-good';
            if (eq.condition <= 30) conditionClass = 'condition-bad';
            else if (eq.condition <= 60) conditionClass = 'condition-warn';

            let barColor = '#2ecc71';
            if (eq.condition <= 30) barColor = '#e74c3c';
            else if (eq.condition <= 60) barColor = '#f39c12';

            item.innerHTML = `
                <div class="equipment-header">
                    <span class="equipment-name">${eq.name}</span>
                    <span class="equipment-condition ${conditionClass}">${eq.condition}%</span>
                </div>
                <div class="equipment-bar">
                    <div class="equipment-bar-fill" style="width:${eq.condition}%; background:${barColor}"></div>
                </div>
                <div style="font-size:11px; color:#888; margin-top:5px">
                    影响: ${eq.effect} | 维修: 🔧${eq.repairCost}零件 | 修复: +${25}%
                </div>
            `;
            container.appendChild(item);

            if (eq.condition < 100 && !this.gameState.todayActions.repairDone.includes(eq.id)) {
                const option = document.createElement('option');
                option.value = eq.id;
                option.textContent = `${eq.name} (${eq.condition}%)`;
                select.appendChild(option);
            }
        });
    }

    renderRumors() {
        const container = document.getElementById('rumorList');
        const select = document.getElementById('rumorToSuppress');
        
        container.innerHTML = '';
        select.innerHTML = '';

        if (this.gameState.rumors.length === 0) {
            container.innerHTML = '<p style="color:#888; text-align:center; padding:20px">暂无活跃谣言</p>';
            return;
        }

        this.gameState.rumors.forEach(rumor => {
            const item = document.createElement('div');
            item.className = 'rumor-item';
            item.innerHTML = `
                <div class="rumor-title">${rumor.title}</div>
                <div class="rumor-desc">${rumor.desc}</div>
                <div class="rumor-severity">
                    <span>严重程度</span>
                    <div class="rumor-severity-bar">
                        <div class="rumor-severity-fill" style="width:${rumor.severity}%"></div>
                    </div>
                    <span>${rumor.severity}%</span>
                </div>
            `;
            container.appendChild(item);

            if (!this.gameState.todayActions.rumorSuppressDone.includes(rumor.id)) {
                const option = document.createElement('option');
                option.value = rumor.id;
                option.textContent = `${rumor.title} (${rumor.severity}%)`;
                select.appendChild(option);
            }
        });

        document.getElementById('suppressRumorBtn').disabled = select.options.length === 0;
    }

    renderSettlements() {
        const container = document.getElementById('settlementList');
        container.innerHTML = '';

        if (this.gameState.settlementHistory.length === 0) {
            container.innerHTML = '<p style="color:#888; text-align:center; padding:40px">暂无结算记录</p>';
            return;
        }

        this.gameState.settlementHistory.slice().reverse().forEach(settlement => {
            const item = document.createElement('div');
            item.className = 'settlement-item';
            
            let statsHtml = '';
            Object.entries(settlement.effects).forEach(([stat, value]) => {
                if (value !== 0) {
                    const className = value > 0 ? 'positive' : 'negative';
                    const sign = value > 0 ? '+' : '';
                    statsHtml += `<div class="settlement-stat ${className}"><span>${this.getStatName(stat)}</span><span>${sign}${value}</span></div>`;
                }
            });

            item.innerHTML = `
                <div class="settlement-header">
                    <span>第 ${settlement.day} 天结算</span>
                    <span style="font-size:12px; color:#888">${settlement.summary}</span>
                </div>
                <div class="settlement-stats">${statsHtml}</div>
            `;
            container.appendChild(item);
        });
    }

    renderQuestion() {
        const question = this.gameState.currentQuestion;
        const questionText = document.getElementById('questionText');
        const optionsContainer = document.getElementById('answerOptions');
        const historyContainer = document.getElementById('historyList');

        if (!question) {
            questionText.textContent = '今日问答次数已用完，请明日再来。';
            optionsContainer.innerHTML = '';
        } else {
            questionText.textContent = question.question;
            optionsContainer.innerHTML = '';

            question.options.forEach((option, index) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = option.text;
                btn.addEventListener('click', () => this.answerQuestion(index));
                optionsContainer.appendChild(btn);
            });
        }

        historyContainer.innerHTML = '';
        this.gameState.answeredQuestions.slice().reverse().forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item ' + (item.correct ? 'correct' : 'wrong');
            div.innerHTML = `<strong>${item.question}</strong><br><small>${item.correct ? '✓ 回答正确' : '✗ 回答错误'}: ${item.answer}</small>`;
            historyContainer.appendChild(div);
        });
    }

    getDistrictType(districtId) {
        const district = this.gameState.districts.find(d => d.id === districtId);
        if (!district) return null;
        return GameData.districtTypes[district.type];
    }

    getAudienceReach(slot, districtType) {
        if (!districtType) return { total: 0, audiences: [] };
        const schedule = GameData.audienceSchedule[slot];
        if (!schedule) return { total: 0, audiences: [] };

        const audiences = [];
        let totalWeight = 0;

        districtType.primaryAudience.forEach(audId => {
            const rate = schedule[audId] || 0;
            const weight = rate * 1.5;
            totalWeight += weight;
            audiences.push({
                id: audId,
                ...GameData.audienceGroups[audId],
                rate: rate,
                isPrimary: true,
                weight: weight
            });
        });

        Object.keys(GameData.audienceGroups).forEach(audId => {
            if (!districtType.primaryAudience.includes(audId)) {
                const rate = schedule[audId] || 0;
                const weight = rate * 0.5;
                totalWeight += weight;
                if (rate > 0.3) {
                    audiences.push({
                        id: audId,
                        ...GameData.audienceGroups[audId],
                        rate: rate,
                        isPrimary: false,
                        weight: weight
                    });
                }
            }
        });

        audiences.sort((a, b) => b.weight - a.weight);

        return {
            total: Math.min(100, Math.round(totalWeight * 20)),
            audiences: audiences
        };
    }

    getThemeMatch(themes, districtType) {
        if (!districtType || !themes || themes.length === 0) {
            return { level: 'neutral', multiplier: 1.0, desc: '无主题偏好' };
        }

        let preferredCount = 0;
        let dislikedCount = 0;

        themes.forEach(theme => {
            if (districtType.preferredThemes.includes(theme)) preferredCount++;
            if (districtType.dislikedThemes.includes(theme)) dislikedCount++;
        });

        if (preferredCount > dislikedCount) {
            return {
                level: 'preferred',
                multiplier: GameData.themePreferenceMultiplier.preferred,
                desc: '符合受众偏好，效果提升 50%'
            };
        } else if (dislikedCount > preferredCount) {
            return {
                level: 'disliked',
                multiplier: GameData.themePreferenceMultiplier.disliked,
                desc: '不符合受众偏好，效果降低 50%'
            };
        }
        return {
            level: 'neutral',
            multiplier: GameData.themePreferenceMultiplier.neutral,
            desc: '主题匹配度一般'
        };
    }

    getProgramReachInfo(programId, slot) {
        const program = GameData.programTypes.find(p => p.id === programId);
        if (!program) return null;

        const districtResults = [];
        let totalEffectiveReach = 0;
        let avgMultiplier = 0;

        this.gameState.districts.forEach(district => {
            const districtType = this.getDistrictType(district.id);
            const reach = this.getAudienceReach(slot, districtType);
            const themeMatch = this.getThemeMatch(program.themes, districtType);
            const effectiveReach = Math.round(reach.total * themeMatch.multiplier);

            districtResults.push({
                district: district,
                districtType: districtType,
                reach: reach,
                themeMatch: themeMatch,
                effectiveReach: effectiveReach,
                trustWeight: district.trust / 100
            });

            totalEffectiveReach += effectiveReach * (district.trust / 100);
            avgMultiplier += themeMatch.multiplier;
        });

        avgMultiplier = avgMultiplier / this.gameState.districts.length;
        totalEffectiveReach = Math.min(100, Math.round(totalEffectiveReach / this.gameState.districts.length));

        return {
            program: program,
            slot: slot,
            districtResults: districtResults,
            totalEffectiveReach: totalEffectiveReach,
            avgMultiplier: avgMultiplier,
            overallRating: this.getOverallRating(avgMultiplier, totalEffectiveReach)
        };
    }

    getBroadcastReachInfo(broadcastId) {
        const broadcast = GameData.broadcastMessages.find(m => m.id === broadcastId);
        if (!broadcast) return null;

        const districtResults = [];
        let totalEffectiveReach = 0;
        let avgMultiplier = 0;

        ['morning', 'afternoon', 'evening'].forEach(slot => {
            this.gameState.districts.forEach(district => {
                const districtType = this.getDistrictType(district.id);
                const reach = this.getAudienceReach(slot, districtType);
                const themeMatch = this.getThemeMatch(broadcast.themes, districtType);
                const effectiveReach = Math.round(reach.total * themeMatch.multiplier);

                districtResults.push({
                    slot: slot,
                    district: district,
                    districtType: districtType,
                    reach: reach,
                    themeMatch: themeMatch,
                    effectiveReach: effectiveReach
                });

                totalEffectiveReach += effectiveReach * (district.trust / 100);
                avgMultiplier += themeMatch.multiplier;
            });
        });

        avgMultiplier = avgMultiplier / (this.gameState.districts.length * 3);
        totalEffectiveReach = Math.min(100, Math.round(totalEffectiveReach / (3 * this.gameState.districts.length)));

        return {
            broadcast: broadcast,
            districtResults: districtResults,
            totalEffectiveReach: totalEffectiveReach,
            avgMultiplier: avgMultiplier,
            overallRating: this.getOverallRating(avgMultiplier, totalEffectiveReach)
        };
    }

    getOverallRating(multiplier, reach) {
        const score = multiplier * 100 + reach / 5;
        if (score >= 180) return { text: '极佳', class: 'rating-excellent', icon: '⭐⭐⭐' };
        if (score >= 140) return { text: '良好', class: 'rating-good', icon: '⭐⭐' };
        if (score >= 100) return { text: '一般', class: 'rating-normal', icon: '⭐' };
        if (score >= 60) return { text: '较差', class: 'rating-poor', icon: '📉' };
        return { text: '很差', class: 'rating-bad', icon: '❌' };
    }

    getStatName(stat) {
        const names = {
            power: '⚡电量',
            noise: '🔊噪声',
            rumor: '🗣️谣言',
            fatigue: '😴疲劳',
            morale: '❤️民心',
            trust: '🤝信任',
            food: '🍞食物',
            battery: '🔋电池',
            parts: '🔧零件'
        };
        return names[stat] || stat;
    }

    getThemeName(themeId) {
        return GameData.programThemes[themeId] || themeId;
    }

    selectProgram(slot, programId) {
        this.gameState.schedule[slot] = programId;
        this.renderSchedule();
    }

    getBroadcastSlotAnalysis(broadcastId) {
        const broadcast = GameData.broadcastMessages.find(m => m.id === broadcastId);
        if (!broadcast) return null;

        const slotResults = [];

        ['morning', 'afternoon', 'evening'].forEach(slot => {
            const districtBreakdown = [];
            let slotEffectiveReach = 0;
            let slotAvgMultiplier = 0;
            let preferredDistricts = [];
            let dislikedDistricts = [];

            this.gameState.districts.forEach(district => {
                const districtType = this.getDistrictType(district.id);
                const reach = this.getAudienceReach(slot, districtType);
                const themeMatch = this.getThemeMatch(broadcast.themes, districtType);
                const effectiveReach = Math.round(reach.total * themeMatch.multiplier);

                districtBreakdown.push({
                    district: district,
                    districtType: districtType,
                    reach: reach,
                    themeMatch: themeMatch,
                    effectiveReach: effectiveReach,
                    trustWeight: district.trust / 100
                });

                slotEffectiveReach += effectiveReach * (district.trust / 100);
                slotAvgMultiplier += themeMatch.multiplier;

                if (themeMatch.level === 'preferred') preferredDistricts.push(district.name);
                if (themeMatch.level === 'disliked') dislikedDistricts.push(district.name);
            });

            slotAvgMultiplier = slotAvgMultiplier / this.gameState.districts.length;
            slotEffectiveReach = Math.min(100, Math.round(slotEffectiveReach / this.gameState.districts.length));

            slotResults.push({
                slot: slot,
                slotInfo: GameData.timeSlots[slot],
                districtBreakdown: districtBreakdown,
                effectiveReach: slotEffectiveReach,
                avgMultiplier: slotAvgMultiplier,
                rating: this.getOverallRating(slotAvgMultiplier, slotEffectiveReach),
                preferredDistricts: preferredDistricts,
                dislikedDistricts: dislikedDistricts
            });
        });

        slotResults.sort((a, b) => b.effectiveReach - a.effectiveReach);

        return {
            broadcast: broadcast,
            slotResults: slotResults,
            bestSlot: slotResults[0],
            worstSlot: slotResults[slotResults.length - 1],
            avgReach: Math.min(100, Math.round(slotResults.reduce((s, r) => s + r.effectiveReach, 0) / 3))
        };
    }

    renderBroadcastReachAnalysis(broadcastId) {
        const container = document.getElementById('broadcastReachAnalysis');
        if (!broadcastId) {
            container.innerHTML = '<div class="empty-analysis">📊 选择消息后可查看各时段传播效果分析</div>';
            return;
        }

        const analysis = this.getBroadcastSlotAnalysis(broadcastId);
        if (!analysis) {
            container.innerHTML = '';
            return;
        }

        const { broadcast, slotResults, bestSlot, worstSlot, avgReach } = analysis;
        const bestIsMuchBetter = bestSlot.effectiveReach - worstSlot.effectiveReach >= 20;

        let summaryHtml = `
            <div class="reach-analysis-summary">
                <span class="avg-reach-badge">📊 平均触达 ${avgReach}%</span>
                <span class="best-slot-badge">✨ 最佳时段: ${bestSlot.slotInfo.name} (${bestSlot.effectiveReach}%)</span>
        `;
        if (bestIsMuchBetter) {
            summaryHtml += `<span class="warn-slot-badge">⚠️ 时段差异显著: 最佳比最差高 ${bestSlot.effectiveReach - worstSlot.effectiveReach}%</span>`;
        }
        summaryHtml += `</div>`;

        const slotCardsHtml = slotResults.map(result => {
            let cardClass = '';
            if (result.slot === bestSlot.slot) cardClass = 'best';
            else if (result.slot === worstSlot.slot && bestIsMuchBetter) cardClass = 'poor';

            const reachColorClass = result.rating.class;
            const multiplierPercent = Math.round(result.avgMultiplier * 100);

            const districtListHtml = result.districtBreakdown.map(db => {
                const matchClass = db.themeMatch.level;
                const reachLevel = db.effectiveReach >= 60 ? 'good' : db.effectiveReach >= 30 ? 'neutral' : 'bad';
                return `
                    <div class="district-match-item ${reachLevel}">
                        <span>${db.districtType ? db.districtType.icon : ''} ${db.district.name}</span>
                        <span>收听${db.reach.total}% × 主题${Math.round(db.themeMatch.multiplier * 100)}% = <strong>${db.effectiveReach}%</strong></span>
                    </div>
                `;
            }).join('');

            const tagHtml = result.slot === bestSlot.slot ? '<span class="best-slot-badge" style="font-size:10px; padding:2px 6px">推荐</span>' :
                            (result.slot === worstSlot.slot && bestIsMuchBetter ? '<span class="warn-slot-badge" style="font-size:10px; padding:2px 6px">避免</span>' : '');

            return `
                <div class="slot-analysis-card ${cardClass}" data-slot="${result.slot}">
                    <div class="slot-analysis-header">
                        <span>${result.slotInfo.name}</span>
                        ${tagHtml}
                    </div>
                    <div class="slot-analysis-score ${reachColorClass}">
                        ${result.rating.icon} ${result.effectiveReach}%
                    </div>
                    <div class="slot-analysis-detail">
                        主题匹配度: <strong class="${result.avgMultiplier >= 1.3 ? 'positive' : result.avgMultiplier <= 0.7 ? 'negative' : ''}">${multiplierPercent}%</strong>
                        ${result.preferredDistricts.length > 0 ? `<br>👍 ${result.preferredDistricts.join('、')}` : ''}
                        ${result.dislikedDistricts.length > 0 ? `<br>👎 ${result.dislikedDistricts.join('、')}` : ''}
                    </div>
                    <div class="district-match-list">
                        ${districtListHtml}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="reach-analysis-title">📊 时段传播效果分析</div>
            ${summaryHtml}
            <div class="slot-analysis-grid">
                ${slotCardsHtml}
            </div>
            <div style="margin-top:12px; padding:10px; background:rgba(0,0,0,0.2); border-radius:6px;">
                <div style="font-size:12px; color:#aaa; margin-bottom:6px">
                    📌 <strong>说明：</strong>同一消息在不同时段的传播效果差异巨大。医院周边偏好<strong style="color:#2ecc71">医疗/安抚/新闻</strong>，避难所偏好<strong style="color:#2ecc71">安抚/新闻/娱乐</strong>，工业区偏好<strong style="color:#2ecc71">预警/新闻/天气</strong>。
                </div>
                <div style="font-size:11px; color:#888">
                    错误时段播出重要消息会导致传播效果下降，尤其是紧急预警、医疗援助等关键信息，请务必选择合适时段。
                </div>
            </div>
            <div style="margin-top:10px;">
                <label style="font-size:12px; color:#ccc; display:block; margin-bottom:5px">🔘 选择播报时段 (影响实际效果)：</label>
                <select id="broadcastSlotSelect" style="width:100%; padding:8px 12px; background:rgba(255,255,255,0.05); border:1px solid #666; border-radius:6px; color:#fff; font-size:13px">
                    ${slotResults.map((r, i) => `
                        <option value="${r.slot}" ${i === 0 ? 'selected' : ''}>
                            ${r.slotInfo.name} - 预计触达 ${r.effectiveReach}% ${r.slot === bestSlot.slot ? '(推荐)' : r.slot === worstSlot.slot && bestIsMuchBetter ? '(不推荐)' : ''}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    selectBroadcast(broadcastId) {
        this.gameState.selectedBroadcast = broadcastId;
        
        const msg = GameData.broadcastMessages.find(m => m.id === broadcastId);
        const preview = document.getElementById('broadcastPreview');
        
        const effectsText = Object.entries(msg.effects)
            .map(([k, v]) => `${this.getStatName(k)} ${v > 0 ? '+' : ''}${v}`)
            .join(' | ');

        const themesHtml = msg.themes && msg.themes.length > 0 ? `
            <div style="margin:8px 0">
                ${msg.themes.map(t => `<span class="theme-tag">${this.getThemeName(t)}</span>`).join(' ')}
            </div>
        ` : '';
        
        preview.innerHTML = `
            <h4 style="color:#e94560; margin-bottom:10px">${msg.title}</h4>
            <p>${msg.content}</p>
            ${themesHtml}
            <p style="color:#888; font-size:12px; margin-top:10px">基础效果: ${effectsText} | 耗电: ⚡${msg.power}</p>
            <p style="color:#f39c12; font-size:11px; margin-top:5px">💡 实际效果会根据所选时段的听众触达率和主题匹配度动态调整</p>
        `;

        this.renderBroadcastReachAnalysis(broadcastId);
        this.renderBroadcasts();
    }

    doBroadcast() {
        const msg = GameData.broadcastMessages.find(m => m.id === this.gameState.selectedBroadcast);
        if (!msg || this.gameState.todayActions.broadcastDone) return;

        if (this.gameState.status.power < msg.power) {
            this.showEvent('电力不足', '电量不足，无法进行播报！', [{ text: '⚡电量不足', type: 'negative' }]);
            return;
        }

        const slotSelect = document.getElementById('broadcastSlotSelect');
        const selectedSlot = slotSelect ? slotSelect.value : 'evening';

        const analysis = this.getBroadcastSlotAnalysis(msg.id);
        const slotResult = analysis ? analysis.slotResults.find(r => r.slot === selectedSlot) : null;
        const effectiveness = slotResult ? (slotResult.effectiveReach / 100) : 0.6;

        const actualEffects = {};
        Object.entries(msg.effects).forEach(([k, v]) => {
            if (k === 'trust') {
                actualEffects[k] = Math.round(v * effectiveness);
            } else {
                actualEffects[k] = Math.round(v * effectiveness * 10) / 10;
            }
        });

        this.applyEffects(actualEffects);
        this.gameState.status.power -= msg.power;
        this.gameState.todayActions.broadcastDone = true;

        const effectTags = Object.entries(actualEffects)
            .filter(([_, v]) => v !== 0)
            .map(([k, v]) => ({
                text: `${this.getStatName(k)} ${v > 0 ? '+' : ''}${v}`,
                type: v > 0 ? 'positive' : 'negative'
            }));

        const slotName = GameData.timeSlots[selectedSlot].name;
        const effectivenessPercent = Math.round(effectiveness * 100);
        const effectivenessTag = effectivenessPercent >= 70 ? { text: `🎯 时段契合度 ${effectivenessPercent}% (${slotName})`, type: 'positive' } :
                                 effectivenessPercent >= 40 ? { text: `🎯 时段契合度 ${effectivenessPercent}% (${slotName})`, type: '' } :
                                 { text: `⚠️ 时段契合度仅 ${effectivenessPercent}% (${slotName})，传播效果受限`, type: 'negative' };

        effectTags.unshift(effectivenessTag);

        const slotInfo = slotResult ? `\n\n📊 传播详情：\n• 播出时段: ${slotName}\n• 综合触达: ${slotResult.effectiveReach}%\n• 主题匹配: ${Math.round(slotResult.avgMultiplier * 100)}%` : '';

        this.showEvent('播报完成', `已播报：${msg.title}${slotInfo}`, effectTags);
        
        document.getElementById('broadcastReachAnalysis').innerHTML = '<div class="empty-analysis">✅ 今日播报已完成，明日可继续播报</div>';
        this.renderAll();
    }

    generateQuestion() {
        if (this.gameState.todayActions.qaDone >= 3) {
            this.gameState.currentQuestion = null;
        } else {
            const available = GameData.questionBank.filter(q => 
                !this.gameState.answeredQuestions.some(a => a.question === q.question)
            );
            
            if (available.length > 0) {
                this.gameState.currentQuestion = available[Math.floor(Math.random() * available.length)];
            } else {
                this.gameState.currentQuestion = GameData.questionBank[Math.floor(Math.random() * GameData.questionBank.length)];
            }
        }
        this.renderQuestion();
    }

    answerQuestion(optionIndex) {
        const question = this.gameState.currentQuestion;
        if (!question) return;

        const option = question.options[optionIndex];
        this.applyEffects(option.effects);
        this.gameState.todayActions.qaDone++;

        this.gameState.answeredQuestions.push({
            question: question.question,
            answer: option.text,
            correct: option.correct,
            day: this.gameState.day
        });

        const effectTags = Object.entries(option.effects)
            .filter(([_, v]) => v !== 0)
            .map(([k, v]) => ({
                text: `${this.getStatName(k)} ${v > 0 ? '+' : ''}${v}`,
                type: v > 0 ? 'positive' : 'negative'
            }));

        const title = option.correct ? '回答正确！' : '回答不佳...';
        this.showEvent(title, option.text, effectTags);

        this.generateQuestion();
        this.renderStatus();
    }

    doRepair() {
        const eqId = document.getElementById('repairEquipment').value;
        const survivorId = document.getElementById('repairSurvivor').value;
        
        if (!eqId || !survivorId) return;

        const equipment = this.gameState.equipment.find(e => e.id === eqId);
        const survivor = this.gameState.survivors.find(s => s.id === survivorId);
        
        if (!equipment || !survivor) return;

        if (this.gameState.resources.parts < equipment.repairCost) {
            this.showEvent('零件不足', '没有足够的零件进行维修！', [{ text: '🔧零件不足', type: 'negative' }]);
            return;
        }

        this.gameState.resources.parts -= equipment.repairCost;
        
        const repairBonus = survivor.skill === '维修' ? 15 : 0;
        const repairAmount = 25 + repairBonus;
        equipment.condition = Math.min(100, equipment.condition + repairAmount);
        
        survivor.fatigue += 20;
        survivor.task = `维修 ${equipment.name}`;
        
        this.gameState.todayActions.repairDone.push(eqId);

        this.showEvent('维修完成', `${survivor.name} 完成了 ${equipment.name} 的维修工作！`, [
            { text: `🔧 ${equipment.name} +${repairAmount}%`, type: 'positive' },
            { text: `😴 ${survivor.name} 疲劳 +20`, type: 'negative' }
        ]);

        this.renderAll();
    }

    suppressRumor() {
        const rumorId = document.getElementById('rumorToSuppress').value;
        if (!rumorId) return;

        const rumor = this.gameState.rumors.find(r => r.id === rumorId);
        if (!rumor) return;

        if (this.gameState.status.power < 8) {
            this.showEvent('电力不足', '电量不足，无法发布澄清广播！', [{ text: '⚡电量不足', type: 'negative' }]);
            return;
        }

        this.gameState.status.power -= 8;
        rumor.severity -= 40;
        this.gameState.status.rumor -= 15;
        this.gameState.status.fatigue += 10;
        this.gameState.todayActions.rumorSuppressDone.push(rumorId);

        let effectTags = [
            { text: `🗣️ 谣言 -40%`, type: 'positive' },
            { text: `😴 疲劳 +10`, type: 'negative' }
        ];

        if (rumor.severity <= 0) {
            this.gameState.rumors = this.gameState.rumors.filter(r => r.id !== rumorId);
            this.gameState.status.morale += 10;
            effectTags.push({ text: '✅ 谣言已平息', type: 'positive' });
            effectTags.push({ text: '❤️ 民心 +10', type: 'positive' });
        }

        this.showEvent('发布澄清', `针对"${rumor.title}"发布了官方澄清消息。`, effectTags);
        this.renderAll();
    }

    applyEffects(effects) {
        Object.entries(effects).forEach(([key, value]) => {
            if (key === 'trust') {
                this.gameState.districts.forEach(d => {
                    d.trust = Math.max(0, Math.min(100, d.trust + value));
                });
            } else if (this.gameState.status[key] !== undefined) {
                this.gameState.status[key] = Math.max(0, Math.min(100, this.gameState.status[key] + value));
            } else if (this.gameState.resources[key] !== undefined) {
                this.gameState.resources[key] = Math.max(0, this.gameState.resources[key] + value);
            }
        });
    }

    generateDailyRumors() {
        if (Math.random() < 0.6) {
            this.gameState.rumors.push(this.generateRumor());
        }
        if (this.gameState.day > 3 && Math.random() < 0.4) {
            this.gameState.rumors.push(this.generateRumor());
        }
    }

    endDay() {
        const dayEffects = {
            power: 0,
            noise: 0,
            rumor: 0,
            fatigue: 0,
            morale: 0,
            food: 0,
            trust: 0
        };

        const districtTrustDelta = {};
        this.gameState.districts.forEach(d => {
            districtTrustDelta[d.id] = 0;
        });

        const scheduleReport = [];
        let totalPowerUsed = 0;

        ['morning', 'afternoon', 'evening'].forEach(slot => {
            const programId = this.gameState.schedule[slot];
            if (programId) {
                const program = GameData.programTypes.find(p => p.id === programId);
                if (program) {
                    totalPowerUsed += program.power;

                    const reachInfo = this.getProgramReachInfo(programId, slot);
                    const globalMultiplier = reachInfo ? (reachInfo.totalEffectiveReach / 100) : 0.5;

                    const slotReport = {
                        slot: slot,
                        program: program.name,
                        globalMultiplier: Math.round(globalMultiplier * 100),
                        districtEffects: []
                    };

                    this.gameState.districts.forEach(district => {
                        const districtType = this.getDistrictType(district.id);
                        const reach = this.getAudienceReach(slot, districtType);
                        const themeMatch = this.getThemeMatch(program.themes, districtType);
                        const districtMultiplier = (reach.total / 100) * themeMatch.multiplier;
                        const trustWeight = district.trust / 100;
                        const effectiveMultiplier = districtMultiplier * (0.5 + trustWeight * 0.5);

                        Object.entries(program.effects).forEach(([k, v]) => {
                            if (k === 'trust') {
                                districtTrustDelta[district.id] += v * effectiveMultiplier;
                            } else if (dayEffects[k] !== undefined) {
                                const weightedValue = v * effectiveMultiplier * (district.trust / 500);
                                dayEffects[k] += weightedValue;
                            }
                        });

                        slotReport.districtEffects.push({
                            district: district.name,
                            districtType: districtType ? districtType.name : '',
                            reach: reach.total,
                            themeMatch: themeMatch.level,
                            multiplier: Math.round(effectiveMultiplier * 100)
                        });
                    });

                    Object.entries(program.effects).forEach(([k, v]) => {
                        if (k !== 'trust' && dayEffects[k] !== undefined) {
                            const baseValue = dayEffects[k];
                            const globalBoost = v * globalMultiplier * 0.3;
                            dayEffects[k] = baseValue + globalBoost;
                        }
                    });

                    scheduleReport.push(slotReport);
                }
            }
        });

        Object.entries(districtTrustDelta).forEach(([districtId, delta]) => {
            const district = this.gameState.districts.find(d => d.id === districtId);
            if (district) {
                district.trust = Math.max(0, Math.min(100, district.trust + Math.round(delta)));
            }
        });

        ['power', 'noise', 'rumor', 'fatigue', 'morale', 'food'].forEach(k => {
            if (dayEffects[k] !== undefined) {
                dayEffects[k] = Math.round(dayEffects[k] * 10) / 10;
            }
        });

        this.gameState.lastScheduleReport = scheduleReport;

        dayEffects.power -= totalPowerUsed;

        const survivorCount = this.gameState.survivors.length;
        dayEffects.food -= survivorCount;
        this.gameState.resources.food += dayEffects.food;

        this.gameState.survivors.forEach(s => {
            if (s.fatigue > 0) {
                s.fatigue = Math.max(0, s.fatigue - 30);
            }
            if (s.task) {
                s.task = null;
            }
        });

        this.gameState.rumors.forEach(rumor => {
            rumor.severity += 10;
            dayEffects.rumor += 5;
        });

        this.gameState.rumors = this.gameState.rumors.filter(r => r.severity <= 100);
        this.gameState.rumors.forEach(r => {
            if (r.severity >= 80) {
                dayEffects.morale -= 8;
            }
        });

        if (this.gameState.status.power <= this.gameState.thresholds.power) {
            dayEffects.morale -= 10;
        }
        if (this.gameState.status.noise >= this.gameState.thresholds.noise) {
            dayEffects.morale -= 5;
            dayEffects.fatigue += 10;
        }
        if (this.gameState.status.rumor >= this.gameState.thresholds.rumor) {
            dayEffects.morale -= 15;
        }
        if (this.gameState.status.fatigue >= this.gameState.thresholds.fatigue) {
            dayEffects.morale -= 5;
        }
        if (this.gameState.status.morale <= this.gameState.thresholds.morale) {
            this.gameState.districts.forEach(d => {
                d.trust = Math.max(0, d.trust - 5);
            });
        }

        if (this.gameState.resources.food < 0) {
            dayEffects.morale -= 20;
            this.gameState.resources.food = 0;
            this.gameState.survivors.forEach(s => {
                s.health -= 10;
            });
        }

        Object.entries(dayEffects).forEach(([k, v]) => {
            if (k !== 'food' && this.gameState.status[k] !== undefined) {
                this.gameState.status[k] = Math.max(0, Math.min(100, this.gameState.status[k] + v));
            }
        });

        let summary = '正常';
        if (this.gameState.status.morale <= 20) summary = '危急';
        else if (this.gameState.status.morale <= 40) summary = '堪忧';
        else if (this.gameState.status.morale >= 80) summary = '良好';

        this.gameState.settlementHistory.push({
            day: this.gameState.day,
            effects: dayEffects,
            summary: summary
        });

        this.showSettlementModal(dayEffects, summary);

        this.gameState.day++;
        this.gameState.schedule = { morning: null, afternoon: null, evening: null };
        this.gameState.selectedBroadcast = null;
        this.gameState.currentQuestion = null;
        this.gameState.todayActions = {
            broadcastDone: false,
            qaDone: 0,
            repairDone: [],
            rumorSuppressDone: []
        };

        this.generateDailyRumors();

        this.gameState.equipment.forEach(eq => {
            eq.condition = Math.max(0, eq.condition - 3);
        });

        if (Math.random() < 0.3) {
            this.gameState.resources.parts += Math.floor(Math.random() * 3) + 1;
        }
        if (Math.random() < 0.3) {
            this.gameState.resources.battery += Math.floor(Math.random() * 2) + 1;
        }
        if (Math.random() < 0.2) {
            this.gameState.resources.food += Math.floor(Math.random() * 5) + 2;
        }

        if (this.gameState.status.morale <= 0) {
            this.gameOver('民心崩溃', '广播站失去了所有听众的信任，人们不再相信你了...');
            return;
        }
        if (this.gameState.status.power <= 0 && this.gameState.resources.battery <= 0) {
            this.gameOver('电力耗尽', '所有电力来源都已耗尽，广播站陷入了黑暗...');
            return;
        }

        this.renderAll();
    }

    showSettlementModal(effects, summary) {
        let effectsHtml = '';
        Object.entries(effects).forEach(([stat, value]) => {
            if (value !== 0) {
                const className = value > 0 ? 'positive' : 'negative';
                const sign = value > 0 ? '+' : '';
                effectsHtml += `<span class="effect-tag ${className}">${this.getStatName(stat)} ${sign}${value}</span>`;
            }
        });

        let scheduleReportHtml = '';
        if (this.gameState.lastScheduleReport && this.gameState.lastScheduleReport.length > 0) {
            scheduleReportHtml = '<div style="margin-top:20px; text-align:left"><h4 style="color:#3498db; margin-bottom:10px">📻 节目传播效果报告</h4>';
            this.gameState.lastScheduleReport.forEach(report => {
                const slotName = GameData.timeSlots[report.slot].name;
                const multiplierClass = report.globalMultiplier >= 70 ? 'positive' : report.globalMultiplier >= 40 ? '' : 'negative';
                scheduleReportHtml += `
                    <div style="background:rgba(0,0,0,0.3); border-radius:6px; padding:10px; margin-bottom:8px">
                        <div style="display:flex; justify-content:space-between; margin-bottom:6px">
                            <strong>${slotName}：${report.program}</strong>
                            <span class="effect-tag ${multiplierClass}">综合触达 ${report.globalMultiplier}%</span>
                        </div>
                        <div style="font-size:11px; color:#aaa; display:grid; grid-template-columns:repeat(auto-fit, minmax(140px,1fr)); gap:4px">
                            ${report.districtEffects.map(de => {
                                const matchClass = de.themeMatch === 'preferred' ? 'color:#2ecc71' : de.themeMatch === 'disliked' ? 'color:#e74c3c' : 'color:#f39c12';
                                const multClass = de.multiplier >= 60 ? 'color:#2ecc71' : de.multiplier >= 30 ? 'color:#f39c12' : 'color:#e74c3c';
                                return `<div>📌 ${de.district} (${de.districtType})：收听率${de.reach}%，<span style="${matchClass}">主题${de.themeMatch === 'preferred' ? '匹配' : de.themeMatch === 'disliked' ? '冲突' : '一般'}</span>，<span style="${multClass}">效果${de.multiplier}%</span></div>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            });
            scheduleReportHtml += '</div>';
        }

        document.getElementById('modalTitle').textContent = `第 ${this.gameState.day} 天结算 - ${summary}`;
        document.getElementById('modalText').innerHTML = '今日运营已结束，以下是今日总结：' + scheduleReportHtml;
        document.getElementById('modalEffects').innerHTML = effectsHtml;
        document.getElementById('eventModal').classList.add('active');
    }

    showEvent(title, text, effects) {
        let effectsHtml = '';
        effects.forEach(e => {
            effectsHtml += `<span class="effect-tag ${e.type}">${e.text}</span>`;
        });

        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalText').textContent = text;
        document.getElementById('modalEffects').innerHTML = effectsHtml;
        document.getElementById('eventModal').classList.add('active');
    }

    closeModal() {
        document.getElementById('eventModal').classList.remove('active');
    }

    gameOver(title, message) {
        this.gameState.gameOver = true;
        this.showEvent(`游戏结束 - ${title}`, message + `\n你坚持了 ${this.gameState.day} 天。`, []);
        document.getElementById('endDayBtn').disabled = true;
    }
}
