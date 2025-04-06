document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const getElem = (id) => document.getElementById(id);
    const queryElem = (selector) => document.querySelector(selector);

    const logForm = getElem('log-form');
    const formHeader = queryElem('.input-section h2');
    const editingMatchIdInput = getElem('editing-match-id');
    const matchDateInput = getElem('match-date');
    const yourPartnerInput = getElem('your-partner');
    const opponent1Input = getElem('opponent1');
    const opponent2Input = getElem('opponent2');
    const yourScoreInput = getElem('your-score');
    const theirScoreInput = getElem('their-score');
    const btnQuickWin = getElem('btn-quick-win');
    const btnQuickLose = getElem('btn-quick-lose');
    const logMatchBtn = getElem('log-match-btn');
    const cancelEditBtn = getElem('cancel-edit-btn');
    const logStatusMsg = getElem('log-status-msg');
    const historyListDiv = getElem('history-list');
    const quickHistoryFiltersContainer = queryElem('.quick-history-filters');
    const historyLoaderDiv = getElem('history-loader');
    const showAllHistoryBtn = getElem('show-all-history-btn');
    const resetAllBtn = getElem('reset-all-btn');
    const statsDisplayDiv = getElem('stats-display');
    const statsOverallWLSpan = getElem('stats-overall-wl');
    const statsOverallPercentageSpan = getElem('stats-overall-percentage');
    const statsTotalMatchesSpan = getElem('stats-total-matches');
    const filterYourTeamSelect = getElem('filter-your-team');
    const filterOpponentTeamSelect = getElem('filter-opponent-team');
    const filterStatsBtn = getElem('filter-stats-btn');
    const detailedStatsResultsDiv = getElem('detailed-stats-results');
    const detailedStatLabelSpan = getElem('detailed-stat-label');
    const detailedStatsWLSpan = getElem('detailed-stats-wl');
    const detailedStatsPercentageSpan = getElem('detailed-stats-percentage');
    const detailedStatsTotalSpan = getElem('detailed-stats-total');
    const playerNamesDatalist = getElem('player-names');
    const overallPieChartCanvas = getElem('overall-pie-chart');
    const pieChartContainer = queryElem('.chart-container.pie-chart-container');
    const sessionBarChartCanvas = getElem('session-bar-chart');
    const barChartContainer = queryElem('.chart-container.bar-chart-container');
    const copyBuffer = getElem('copy-buffer');
    const mainNav = getElem('main-nav');
    const menuToggle = getElem('menu-toggle');
    const navLinksContainer = mainNav ? mainNav.querySelector('.nav-links') : null;
    const backToTopButton = getElem('back-to-top');
    const exportJsonBtn = getElem('export-json-btn');
    const importJsonTriggerBtn = getElem('import-json-trigger-btn');
    const importJsonInput = getElem('import-json-input');

    if (!logForm || !historyListDiv || !statsDisplayDiv || !editingMatchIdInput) { console.error("Essential elements missing."); return; }
    const MATCH_LOGS_KEY = 'badmintonMatchLogs';
    let matchLogs = [];
     try { matchLogs = JSON.parse(localStorage.getItem(MATCH_LOGS_KEY)) || []; if (!Array.isArray(matchLogs)) { matchLogs = []; localStorage.setItem(MATCH_LOGS_KEY, '[]'); } } catch (e) { console.error("Error loading logs:", e); matchLogs = []; }
    let overallPieChartInstance = null; let sessionBarChartInstance = null; let statusTimeout = null;
    const DEFAULT_HISTORY_LIMIT = 10; let currentHistoryFilter = 'all'; let isShowingAllHistory = false;

    // --- Functions ---
    const formatDate = (dateObj) => { const year = dateObj.getFullYear(); const month = String(dateObj.getMonth() + 1).padStart(2, '0'); const day = String(dateObj.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; };
    const getTodayDate = () => { return formatDate(new Date()); };
    const getCanonicalTeamName = (p1, p2) => { const player1 = p1.trim(); const player2 = p2 ? p2.trim() : ''; if (!player1) return 'Unknown Team'; if (!player2) return player1; return [player1, player2].sort().join(' / '); };
    const renderHistory = (logsToRender = [], showAll = false) => { if (!historyListDiv) return; historyListDiv.innerHTML = ''; const sortedLogs = [...logsToRender].sort((a, b) => b.date.localeCompare(a.date)); const logCount = sortedLogs.length; const displayLimit = (showAll || logCount <= DEFAULT_HISTORY_LIMIT) ? logCount : DEFAULT_HISTORY_LIMIT; const displayLogs = sortedLogs.slice(0, displayLimit); if (logCount === 0) { if (currentHistoryFilter !== 'all') { historyListDiv.innerHTML = `<p>No matches found for the selected period (${currentHistoryFilter}).</p>`; } else { historyListDiv.innerHTML = '<p>No matches logged yet.</p>'; } if (historyLoaderDiv) historyLoaderDiv.style.display = 'none'; return; } displayLogs.forEach(match => { const matchElement = document.createElement('div'); matchElement.classList.add('history-item'); const yourTeamDisplay = match.yourTeamName || `You${match.yourPartner ? ' & ' + match.yourPartner : ''}`; const opponentTeamDisplay = match.opponentTeamName || `${match.opponent1}${match.opponent2 ? ' & ' + match.opponent2 : ''}`; const score = `${match.yourScore} - ${match.theirScore}`; const resultClass = match.win ? 'result-win' : 'result-loss'; const resultText = match.win ? 'WIN' : 'LOSS'; matchElement.innerHTML = `<div class="history-details"> <span class="history-date">${match.date}</span> <span class="history-teams"><span class="team-you">${yourTeamDisplay}</span><span class="vs-separator"> vs </span><span class="team-opponent">${opponentTeamDisplay}</span></span> </div> <div class="history-score"> <span>Score: ${score}</span> <span class="history-result ${resultClass}">${resultText}</span> </div> <div class="history-actions"> <button class="btn-edit" title="Edit this match" data-match-id="${match.id}">✏️</button> <button class="btn-delete" title="Delete this match" data-match-id="${match.id}">×</button> </div>`; historyListDiv.appendChild(matchElement); }); if (historyLoaderDiv) { if (!showAll && logCount > DEFAULT_HISTORY_LIMIT) { historyLoaderDiv.style.display = 'block'; } else { historyLoaderDiv.style.display = 'none'; } } };
    const extractUniquePlayerNames = (logs) => { const names = new Set(); logs.forEach(match => { const partner = match.yourPartner?.trim(); const opp1 = match.opponent1?.trim(); const opp2 = match.opponent2?.trim(); if (partner) names.add(partner); if (opp1) names.add(opp1); if (opp2) names.add(opp2); }); return [...names].sort(); };
    const populateNameDatalist = (names) => { if (!playerNamesDatalist) return; playerNamesDatalist.innerHTML = ''; names.forEach(name => { const option = document.createElement('option'); option.value = name; playerNamesDatalist.appendChild(option); }); };
    const populateFilterDropdowns = (logs) => { if(!filterYourTeamSelect || !filterOpponentTeamSelect) return; const currentYourTeam = filterYourTeamSelect.value; const currentOpponentTeam = filterOpponentTeamSelect.value; filterYourTeamSelect.innerHTML = '<option value="ALL">All My Teams (Overall)</option>'; filterOpponentTeamSelect.innerHTML = '<option value="ALL">All Opponents</option>'; const yourTeamNames = new Set(); const opponentTeamNames = new Set(); logs.forEach(match => { if (match.yourTeamName) yourTeamNames.add(match.yourTeamName); if (match.opponentTeamName) opponentTeamNames.add(match.opponentTeamName); }); [...yourTeamNames].sort().forEach(name => { const option = document.createElement('option'); option.value = name; option.textContent = name; filterYourTeamSelect.appendChild(option); }); [...opponentTeamNames].sort().forEach(name => { const option = document.createElement('option'); option.value = name; option.textContent = name; filterOpponentTeamSelect.appendChild(option); }); if (filterYourTeamSelect.querySelector(`option[value="${CSS.escape(currentYourTeam)}"]`)) { filterYourTeamSelect.value = currentYourTeam; } if (filterOpponentTeamSelect.querySelector(`option[value="${CSS.escape(currentOpponentTeam)}"]`)) { filterOpponentTeamSelect.value = currentOpponentTeam; } };
    const calculateDetailedStats = (logs, sYT, sOT) => { const filteredLogs = logs.filter(m=>{if(!m.yourTeamName||!m.opponentTeamName)return false;const ytMatch=(sYT==='ALL'||m.yourTeamName===sYT);const otMatch=(sOT==='ALL'||m.opponentTeamName===sOT);return ytMatch&&otMatch;});const tM=filteredLogs.length;let w=0;filteredLogs.forEach(m=>{if(m.win){w++;}});const l=tM-w;const p=tM>0?Math.round((w/tM)*100):0;return{totalMatches:tM,wins:w,losses:l,percentage:p}; };
    const renderDetailedStats = () => { if(!filterYourTeamSelect || !filterOpponentTeamSelect) return; const sYT=filterYourTeamSelect.value;const sOT=filterOpponentTeamSelect.value;const dS=calculateDetailedStats(matchLogs, sYT, sOT);let dL='Filtered Record';if(sYT!=='ALL'&&sOT!=='ALL'){dL=`${sYT} vs ${sOT}:`;}else if(sYT!=='ALL'){dL=`${sYT} vs All:`;}else if(sOT!=='ALL'){dL=`Your Teams vs ${sOT}:`;}else{dL='Record (All vs All):';}if(detailedStatLabelSpan)detailedStatLabelSpan.textContent=dL;if(detailedStatsTotalSpan)detailedStatsTotalSpan.textContent=dS.totalMatches;if(detailedStatsWLSpan)detailedStatsWLSpan.innerHTML = `<span class="wl-wins">${dS.wins}W</span> - <span class="wl-losses">${dS.losses}L</span>`;if(detailedStatsPercentageSpan)detailedStatsPercentageSpan.textContent=dS.totalMatches>0?`${dS.percentage}%`:'--%'; };
    const renderOverallStats = () => { const oS=calculateDetailedStats(matchLogs,'ALL','ALL');if(statsTotalMatchesSpan)statsTotalMatchesSpan.textContent=oS.totalMatches;if(statsOverallWLSpan)statsOverallWLSpan.innerHTML = `<span class="wl-wins">${oS.wins}W</span> - <span class="wl-losses">${oS.losses}L</span>`;if(statsOverallPercentageSpan)statsOverallPercentageSpan.textContent=oS.totalMatches>0?`${oS.percentage}%`:'--%'; if (!overallPieChartCanvas || !pieChartContainer) return; if (overallPieChartInstance) { overallPieChartInstance.destroy(); overallPieChartInstance = null; } if (oS.totalMatches === 0) { pieChartContainer.classList.add('hidden'); return; } else { pieChartContainer.classList.remove('hidden'); } const ctx = overallPieChartCanvas.getContext('2d'); if (!ctx) { console.error("Failed context pie"); return; } const chartData = { labels: ['Wins', 'Losses'], datasets: [{ label: 'Overall Record', data: [oS.wins, oS.losses], backgroundColor: ['rgba(76, 175, 80, 0.7)', 'rgba(239, 83, 80, 0.7)'], borderColor: ['rgba(76, 175, 80, 1)', 'rgba(239, 83, 80, 1)'], borderWidth: 1, hoverOffset: 4 }] }; function calculatePercentage(value, total) { if (total === 0) return '0'; return Math.round((value / total) * 100); } const chartConfig = { type: 'pie', data: chartData, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top', labels: { font: { family: "'Poppins', sans-serif"} } }, title: { display: true, text: 'Overall Win/Loss Distribution', font: { family: "'Poppins', sans-serif", size: 14 }, padding: { top: 0, bottom: 10 } }, tooltip: { callbacks: { label: function(context) { let label = context.label || ''; if (label) { label += ': '; } let value = context.raw || 0; let percentage = calculatePercentage(value, oS.totalMatches); label += `${value} (${percentage}%)`; return label; } } } } } }; try { overallPieChartInstance = new Chart(ctx, chartConfig); } catch(e){ console.error("Error pie chart:", e); } };
    const saveLogs = () => { try { localStorage.setItem(MATCH_LOGS_KEY, JSON.stringify(matchLogs)); } catch (error) { console.error("Error saving logs:", error); alert("Could not save log."); } };
    const processDataForSessionChart = (logs, limit = 15) => { if (!logs || logs.length === 0) { return { labels: [], datasets: [] }; } const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date)); const sessions = new Map(); sortedLogs.forEach(log => { const date = log.date; if (!sessions.has(date)) { sessions.set(date, { wins: 0, losses: 0 }); } const sessionData = sessions.get(date); if (log.win) { sessionData.wins++; } else { sessionData.losses++; } }); const allDates = Array.from(sessions.keys()); const recentDates = allDates.slice(-limit); const winData = []; const lossData = []; const chartLabels = recentDates.map(date => { const dateObj = new Date(date + 'T00:00:00'); const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' }); return `${date} (${dayName})`; }); recentDates.forEach(date => { const sessionData = sessions.get(date); winData.push(sessionData.wins); lossData.push(sessionData.losses); }); return { labels: chartLabels, datasets: [ { label: 'Wins', data: winData, backgroundColor: 'rgba(76, 175, 80, 0.7)', borderColor: 'rgba(76, 175, 80, 1)', borderWidth: 1 }, { label: 'Losses', data: lossData, backgroundColor: 'rgba(239, 83, 80, 0.7)', borderColor: 'rgba(239, 83, 80, 1)', borderWidth: 1 } ] }; };
    const renderSessionBarChart = (chartData) => { if (!sessionBarChartCanvas || !barChartContainer) return; if (sessionBarChartInstance) { sessionBarChartInstance.destroy(); sessionBarChartInstance = null; } if (!chartData || chartData.labels.length === 0) { barChartContainer.classList.add('hidden'); return; } else { barChartContainer.classList.remove('hidden'); } const ctx = sessionBarChartCanvas.getContext('2d'); if (!ctx) { console.error("Failed context bar chart"); return; } const config = { type: 'bar', data: chartData, options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: false }, legend: { display: true, position: 'bottom', labels: { font: { family: "'Poppins', sans-serif"} } }, tooltip: { mode: 'index', intersect: false } }, scales: { x: { stacked: true, title: { display: true, text: 'Session Date' }, ticks: { autoSkip: true, maxTicksLimit: 15 } }, y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Matches Played' }, ticks: { stepSize: 1, precision: 0 } } } } }; try { sessionBarChartInstance = new Chart(ctx, config); } catch(e){ console.error("Error bar chart:", e); } };
    const showStatusMessage = (message, type = 'success') => { if (!logStatusMsg) return; logStatusMsg.textContent = message; logStatusMsg.className = `status-message ${type} visible`; if (statusTimeout) { clearTimeout(statusTimeout); } statusTimeout = setTimeout(() => { logStatusMsg.classList.remove('visible'); }, 3000); };
    const hideStatusMessage = () => { if (logStatusMsg) { logStatusMsg.classList.remove('visible'); if (statusTimeout) { clearTimeout(statusTimeout); statusTimeout = null; } } };
    const filterLogsByPreset = (preset) => { const todayObj = new Date(); const todayStr = formatDate(todayObj); let startFilterDateStr; switch (preset) { case 'today': startFilterDateStr = todayStr; break; case 'week': { const startDateWeek = new Date(todayObj); const dayOfWeek = startDateWeek.getDay(); const diff = startDateWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); startDateWeek.setDate(diff); startFilterDateStr = formatDate(startDateWeek); break; } case 'month': { const startDateMonth = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1); startFilterDateStr = formatDate(startDateMonth); break; } case 'all': default: return [...matchLogs]; } return matchLogs.filter(log => log.date >= startFilterDateStr && log.date <= todayStr); };
    const applyCurrentHistoryFilter = (showAll = isShowingAllHistory) => { isShowingAllHistory = showAll; const filteredLogs = filterLogsByPreset(currentHistoryFilter); renderHistory(filteredLogs, isShowingAllHistory); if (quickHistoryFiltersContainer) { quickHistoryFiltersContainer.querySelectorAll('.btn-quick-filter').forEach(btn => { btn.classList.toggle('active', btn.dataset.filter === currentHistoryFilter); }); } };
    const updateUI = () => { try { renderOverallStats(); populateFilterDropdowns(matchLogs); renderDetailedStats(); populateNameDatalist(extractUniquePlayerNames(matchLogs)); const sessionChartData = processDataForSessionChart(matchLogs, 15); renderSessionBarChart(sessionChartData); applyCurrentHistoryFilter(); } catch (e) { console.error("Error during UI Update:", e); } }
    const handleEditClick = (matchId) => { hideStatusMessage(); const matchToEdit = matchLogs.find(log => log.id === matchId); if (!matchToEdit) return; matchDateInput.value = matchToEdit.date; yourPartnerInput.value = matchToEdit.yourPartner; opponent1Input.value = matchToEdit.opponent1; opponent2Input.value = matchToEdit.opponent2; yourScoreInput.value = matchToEdit.yourScore; theirScoreInput.value = matchToEdit.theirScore; editingMatchIdInput.value = matchId; if(formHeader) formHeader.textContent = 'Edit Match'; logMatchBtn.textContent = 'Update Match'; if(cancelEditBtn) cancelEditBtn.style.display = 'inline-block'; logForm.scrollIntoView({ behavior: 'smooth' }); if(matchDateInput) matchDateInput.focus(); };
    const handleCancelEdit = () => { hideStatusMessage(); editingMatchIdInput.value = ''; if(logForm) logForm.reset(); if(matchDateInput) matchDateInput.value = getTodayDate(); if(formHeader) formHeader.textContent = 'Log New Match'; if(logMatchBtn) logMatchBtn.textContent = 'Log Match'; if(cancelEditBtn) cancelEditBtn.style.display = 'none'; };

    /** --- UPDATED: handleLogMatch with Score Validation --- */
    const handleLogMatch = (event) => {
         event.preventDefault();
         const editingId = editingMatchIdInput ? editingMatchIdInput.value : null;
         const date = matchDateInput.value;
         const yourPartner = yourPartnerInput.value.trim();
         const opponent1 = opponent1Input.value.trim();
         const opponent2 = opponent2Input.value.trim();
         const yourScore = parseInt(yourScoreInput.value);
         const theirScore = parseInt(theirScoreInput.value);

         // --- Basic Validation ---
         if (!date || !opponent1 || isNaN(yourScore) || isNaN(theirScore)) {
             alert("Please fill in Date, Opponent 1, and both scores correctly."); return;
         }
         if (yourScore < 0 || theirScore < 0 || yourScore > 30 || theirScore > 30) {
             alert("Scores must be between 0 and 30."); return;
         }

         // --- Badminton Score Logic Validation ---
         const winnerScore = Math.max(yourScore, theirScore);
         const loserScore = Math.min(yourScore, theirScore);

         if (winnerScore < 21 && winnerScore !== 0) { // Allow 0-x scores for walkovers maybe? Or add check?
            // This case should technically not happen if someone won, but catches scores like 15-10
            // Let's assume standard win rules apply
             alert(`Invalid score: Winning score must be at least 21 (unless opponent score is less than ${winnerScore-1} if deuce was played before). Please check scores.`);
             // This simple check might be too restrictive for edge cases, but covers basics.
             // return; // Let's allow unusual scores for now, just focus on clear violations.
         }

        if (winnerScore === loserScore) { alert("Scores cannot be the same."); return; }

        // Rule 1: If winning score is 21, losing score must be 19 or less.
        if (winnerScore === 21 && loserScore > 19) {
            alert("Invalid score: If a player scores 21, the opponent's score must be 19 or less."); return;
        }
        // Rule 2: If winning score is between 22 and 29, difference must be exactly 2.
        if (winnerScore > 21 && winnerScore < 30) {
            if (winnerScore - loserScore !== 2) {
                 alert(`Invalid score: Between 22 and 29 points, the winner must lead by exactly 2 points (e.g., 22-20, 29-27). Score entered: ${winnerScore}-${loserScore}.`); return;
            }
        }
        // Rule 3: If winning score is 30, losing score must be 29 or 28.
         if (winnerScore === 30 && loserScore < 28) {
             alert(`Invalid score: If a player scores 30, the opponent's score must be 28 or 29. Score entered: 30-${loserScore}.`); return;
         }
         // Rule 4: Cannot have 30-30 (handled by max=30 on input and winnerScore !== loserScore check)

         // --- Name Conflict Validation (only for new entries) ---
         if (!editingId) {
             if (yourPartner && (yourPartner === opponent1 || (opponent2 && yourPartner === opponent2))) { const ok = window.confirm(`Warning: Partner "${yourPartner}" also opponent?`); if (!ok) return; }
             if (opponent1 && opponent2 && opponent1 === opponent2) { const ok = window.confirm(`Warning: Opponents "${opponent1}" same?`); if (!ok) return; }
         }

         // --- If Validation Passed ---
         const win = yourScore > theirScore;
         const yourTeamName = getCanonicalTeamName("You", yourPartner);
         const opponentTeamName = getCanonicalTeamName(opponent1, opponent2);
         const matchData = { id: editingId || Date.now().toString(), date: date, yourPartner: yourPartner, opponent1: opponent1, opponent2: opponent2, yourScore: yourScore, theirScore: theirScore, win: win, yourTeamName: yourTeamName, opponentTeamName: opponentTeamName };
         let message = "Match logged successfully!";

         if (editingId) { // Update
             const indexToUpdate = matchLogs.findIndex(log => log.id === editingId);
             if (indexToUpdate > -1) { matchLogs[indexToUpdate] = matchData; message = "Match updated successfully!"; }
             else { alert("Error updating match."); handleCancelEdit(); return; }
         } else { // Add New
             matchLogs.unshift(matchData);
         }

         saveLogs();
         isShowingAllHistory = false; // Reset view on new/update log
         updateUI();

         if (editingId) { handleCancelEdit(); } // Reset form after update
         else { // Clear form after adding new
            if(yourPartnerInput) yourPartnerInput.value = '';
            if(opponent1Input) opponent1Input.value = '';
            if(opponent2Input) opponent2Input.value = '';
            if(yourScoreInput) yourScoreInput.value = '';
            if(theirScoreInput) theirScoreInput.value = '';
            if(opponent1Input) opponent1Input.focus();
        }
         showStatusMessage(message, 'success'); // Show success message
    };

    const handleResetAll = () => { const confirmed = window.confirm("Delete ALL match logs?"); if (confirmed) { matchLogs = []; localStorage.removeItem(MATCH_LOGS_KEY); isShowingAllHistory = false; updateUI(); alert("All logs deleted."); } };
    const handleHistoryClick = (event) => { const targetButton = event.target.closest('button'); if (!targetButton) return; const matchId = targetButton.dataset.matchId; if (!matchId) return; if (targetButton.classList.contains('btn-delete')) { const matchToDelete = matchLogs.find(log => log.id === matchId); const confirmMessage = matchToDelete ? `Delete match from ${matchToDelete.date}?` : "Delete this match log?"; const confirmed = window.confirm(confirmMessage); if (confirmed) { matchLogs = matchLogs.filter(log => log.id !== matchId); saveLogs(); isShowingAllHistory = false; updateUI(); } } else if (targetButton.classList.contains('btn-edit')) { handleEditClick(matchId); } };
    const handleApplyFilters = () => { if(renderDetailedStats) renderDetailedStats(); };
    const handleStep = (event) => { const button = event.target.closest('.stepper-btn'); if (!button) return; const targetInputId = button.dataset.target; const targetInput = document.getElementById(targetInputId); if (!targetInput) return; const step = parseFloat(button.dataset.step || targetInput.step || 1); const min = parseFloat(targetInput.min); const max = parseFloat(targetInput.max); let currentValue = parseFloat(targetInput.value) || 0; if (button.classList.contains('plus')) { if (!isNaN(max) && currentValue + step > max) { currentValue = max; } else { currentValue += step; } } else if (button.classList.contains('minus')) { if (!isNaN(min) && currentValue - step < min) { currentValue = min; } else { currentValue -= step; } } if (!isNaN(min)) currentValue = Math.max(min, currentValue); if (!isNaN(max)) currentValue = Math.min(max, currentValue); if (step < 1) { const precision = Math.max(step.toString().split('.')[1]?.length || 0, 0); targetInput.value = currentValue.toFixed(precision); } else { targetInput.value = currentValue; } };
    const handleQuickScore = (event) => { if (event.target.id === 'btn-quick-win') { if(yourScoreInput) yourScoreInput.value = 21; } else if (event.target.id === 'btn-quick-lose') { if(theirScoreInput) theirScoreInput.value = 21; } };
    const handleMenuToggle = () => { if (mainNav) { const isOpen = mainNav.classList.toggle('nav-open'); if(menuToggle) menuToggle.setAttribute('aria-expanded', isOpen); } };
    const handleScroll = () => { if (backToTopButton) { if (window.scrollY > 300) { backToTopButton.classList.add('visible'); } else { backToTopButton.classList.remove('visible'); } } };
    const scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const handleExportLogs = () => { if (matchLogs.length === 0) { alert("No logs to export."); return; } try { const jsonData = JSON.stringify(matchLogs, null, 2); const blob = new Blob([jsonData], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; const dateStamp = new Date().toISOString().slice(0, 10); link.download = `badminton_logs_${dateStamp}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); setTimeout(() => URL.revokeObjectURL(url), 100); } catch (error) { console.error("Error exporting logs:", error); alert("Failed to export logs."); } };
    const handleImportLogs = (event) => { const file = event.target.files[0]; if (!file) return; if (!file.type || (file.type !== 'application/json' && !file.name.endsWith('.json'))) { alert("Please select a valid JSON file (.json)."); if(importJsonInput) importJsonInput.value = null; return; } const reader = new FileReader(); reader.onload = (e) => { const fileContent = e.target.result; let importedLogs; const confirmed = window.confirm("Importing will REPLACE all current logs.\nAre you sure?"); if (!confirmed) { if(importJsonInput) importJsonInput.value = null; return; } try { importedLogs = JSON.parse(fileContent); if (!Array.isArray(importedLogs) || (importedLogs.length > 0 && typeof importedLogs[0].id === 'undefined')) { throw new Error("Invalid log file format."); } matchLogs = importedLogs; saveLogs(); isShowingAllHistory = false; updateUI(); alert(`Successfully imported ${importedLogs.length} match logs!`); } catch (error) { console.error("Error importing file:", error); alert(`Import failed. Ensure file is valid JSON.\nError: ${error.message}`); } finally { if(importJsonInput) importJsonInput.value = null; } }; reader.onerror = () => { console.error("Error reading file"); alert("Error reading selected file."); if(importJsonInput) importJsonInput.value = null; }; reader.readAsText(file); };
    const handleQuickFilterClick = (event) => { const button = event.target.closest('.btn-quick-filter'); if (!button) return; const filterType = button.dataset.filter; if (!filterType) return; currentHistoryFilter = filterType; isShowingAllHistory = false; applyCurrentHistoryFilter(isShowingAllHistory); };
    const handleShowAllHistory = () => { applyCurrentHistoryFilter(true); };

    // --- Initial Setup ---
    try {
        if (matchDateInput) matchDateInput.value = getTodayDate();
        document.querySelector('.btn-quick-filter[data-filter="all"]')?.classList.add('active');
        updateUI();
    } catch (initError) { console.error("Error during initial setup:", initError); alert("An error occurred during initialization."); }

    // --- Event Listeners ---
    // Add checks to ensure elements exist before adding listeners
    if (logForm) logForm.addEventListener('submit', handleLogMatch);
    if (resetAllBtn) resetAllBtn.addEventListener('click', handleResetAll);
    if (filterStatsBtn) filterStatsBtn.addEventListener('click', handleApplyFilters);
    if (historyListDiv) historyListDiv.addEventListener('click', handleHistoryClick);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', handleCancelEdit);
    if (btnQuickWin) btnQuickWin.addEventListener('click', handleQuickScore);
    if (btnQuickLose) btnQuickLose.addEventListener('click', handleQuickScore);
    if (logForm) logForm.addEventListener('click', handleStep);
    if (menuToggle) { menuToggle.addEventListener('click', handleMenuToggle); }
    if (navLinksContainer) { navLinksContainer.querySelectorAll('a').forEach(link => { link.addEventListener('click', () => { if (mainNav?.classList.contains('nav-open')) { mainNav.classList.remove('nav-open'); menuToggle?.setAttribute('aria-expanded', 'false'); } }); }); }
    window.addEventListener('scroll', handleScroll);
    if (backToTopButton) { backToTopButton.addEventListener('click', scrollToTop); }
    if (exportJsonBtn) { exportJsonBtn.addEventListener('click', handleExportLogs); }
    if (importJsonTriggerBtn) { importJsonTriggerBtn.addEventListener('click', () => importJsonInput?.click()); }
    if (importJsonInput) { importJsonInput.addEventListener('change', handleImportLogs); }
    if (quickHistoryFiltersContainer) { quickHistoryFiltersContainer.addEventListener('click', handleQuickFilterClick); }
    if (showAllHistoryBtn) { showAllHistoryBtn.addEventListener('click', handleShowAllHistory); }

}); // End DOMContentLoaded listener
