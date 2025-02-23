document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the dashboard page
    if (!document.querySelector('.dashboard-container')) {
        return; // Exit if not on dashboard page
    }

    // DOM Elements
    const participantsGrid = document.getElementById('participants-grid');
    const searchInput = document.getElementById('search-participant');
    const searchButton = document.getElementById('search-btn');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const viewButtons = document.querySelectorAll('.view-btn');
    const modal = document.getElementById('profile-modal');
    const closeModal = document.querySelector('.close-modal');
    const playersAlive = document.getElementById('players-alive');
    const currentRound = document.getElementById('current-round');
    const prizePool = document.getElementById('prize-pool');
    const eliminationRate = document.getElementById('elimination-rate');
    const prizePerPlayer = document.getElementById('prize-per-player');
    const roundDetails = document.getElementById('round-details');
    const eliminateInput = document.getElementById('eliminate-participant');
    const eliminateButton = document.getElementById('eliminate-btn');

    // Statistics Modal Elements
    const statsButton = document.getElementById('view-stats-button');
    const statsModal = document.getElementById('stats-modal');
    const closeStatsModal = document.getElementById('close-stats-modal');

    // Game State
    let currentFilter = 'all';
    let currentView = 'grid';
    let isSimulationRunning = false;
    let currentRoundIndex = 0;

    const rounds = [
        { round: 1, eliminationRate: 0.45 },
        { round: 2, eliminationRate: 0.3 },
        { round: 3, eliminationRate: 0.25 },
        { round: 4, eliminationRate: 0.2 },
        { round: 5, eliminationRate: 0.15 },
        { round: 6, eliminationRate: 0.1 }
    ];

    // Simulate random eliminations
    function simulateGame() {
        if (isSimulationRunning) return;
        isSimulationRunning = true;
        
        const gameInterval = setInterval(() => {
            if (currentRoundIndex >= rounds.length) {
                clearInterval(gameInterval);
                isSimulationRunning = false;
                return;
            }

            const { round, eliminationRate } = rounds[currentRoundIndex];
            let eliminatedCount = 0;
            
            // Count current alive participants
            const aliveParticipants = participantManager.participants.filter(p => p.status === 'alive');
            const targetEliminations = Math.floor(aliveParticipants.length * eliminationRate);
            
            // Randomly eliminate participants until we reach the target
            const shuffledParticipants = [...aliveParticipants].sort(() => Math.random() - 0.5);
            for (let i = 0; i < targetEliminations && i < shuffledParticipants.length; i++) {
                if (participantManager.eliminateParticipant(shuffledParticipants[i].number, round)) {
                    eliminatedCount++;
                    playSound('eliminate');
                }
            }

            participantManager.updateRoundProgress(round);
            statisticsManager.updateCharts(round, eliminatedCount);
            
            // Update all displays
            renderParticipants(currentFilter);
            updateGameStats();
            updateRoundInfo();
            announceNewRound(round);
            statisticsManager.updateDetailedStats();

            currentRoundIndex++;
        }, 5000); // Update every 5 seconds
    }

    // Event Listeners
    searchButton.addEventListener('click', () => {
        const searchValue = searchInput.value.trim();
        if (searchValue === '') {
            renderParticipants(currentFilter);
        } else {
            const participant = participantManager.searchParticipant(searchValue);
            if (participant) {
                renderParticipants('all', [participant]);
            } else {
                participantsGrid.innerHTML = '<p class="no-results">No participant found</p>';
            }
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click(); // Trigger the search button click
        }
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.status;
            renderParticipants(currentFilter);
        });
    });

    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderParticipants(currentFilter);
        });
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    statsButton.addEventListener('click', () => {
        statsModal.style.display = 'block';
        // Initialize or update charts when modal is opened
        statisticsManager.initializeCharts();
        statisticsManager.updateDetailedStats();
    });

    closeStatsModal.addEventListener('click', () => {
        statsModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === statsModal) {
            statsModal.style.display = 'none';
        }
    });

    // Search functionality
    const errorSound = new Audio('sounds/error.mp3');
    const successSound = new Audio('sounds/success.mp3');

    function handleSearch() {
        const participantId = parseInt(searchInput.value);
        
        // Validate input
        if (!participantId || participantId < 1 || participantId > 456) {
            searchInput.classList.add('error');
            errorSound.play();
            setTimeout(() => searchInput.classList.remove('error'), 500);
            return;
        }

        // Find participant
        const participant = participantManager.participants.find(p => p.number === participantId);
        if (participant) {
            successSound.play();
            showParticipantProfile(participant);
            searchInput.value = ''; // Clear the input after successful search
            searchInput.blur(); // Remove focus from input
        } else {
            searchInput.classList.add('error');
            errorSound.play();
            setTimeout(() => searchInput.classList.remove('error'), 500);
        }
    }

    // Event listeners for search
    searchButton.addEventListener('click', handleSearch);

    // Add focus animation to search input
    searchInput.addEventListener('focus', () => {
        searchInput.classList.add('focused');
    });

    searchInput.addEventListener('blur', () => {
        searchInput.classList.remove('focused');
    });

    // Add sound effects
    const playSound = (type) => {
        const sounds = {
            eliminate: 'assets/sounds/eliminate.mp3',
            select: 'assets/sounds/select.mp3',
            round: 'assets/sounds/round.mp3',
            click: 'assets/sounds/click.mp3',
            error: 'assets/sounds/error.mp3'
        };
        
        const audio = new Audio(sounds[type]);
        audio.volume = 0.3;
        audio.play().catch(() => {});
    };

    // Add hover effects for participant cards
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('.participant-card')) {
            playSound('select');
        }
    });

    // Add confetti effect for survivors
    function showConfetti() {
        const colors = ['#ff0087', '#ffffff', '#1ae983'];
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: colors
        });
    }

    // Add round transition effect
    function announceNewRound(round) {
        const announcement = document.createElement('div');
        announcement.className = 'round-announcement';
        announcement.innerHTML = `
            <h2>Round ${round}</h2>
            <h3>${participantManager.roundDetails[round - 1].name}</h3>
        `;
        document.body.appendChild(announcement);
        playSound('round');
        
        setTimeout(() => {
            announcement.remove();
        }, 3000);
    }

    // Show popup message function
    function showPopupMessage(message, type = 'success') {
        // Remove existing popup if any
        const existingPopup = document.querySelector('.popup-message');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Create new popup
        const popup = document.createElement('div');
        popup.className = `popup-message ${type}`;
        popup.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        // Add to document
        document.body.appendChild(popup);

        // Remove after 3 seconds
        setTimeout(() => {
            popup.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => popup.remove(), 300);
        }, 3000);
    }

    // Manual elimination functionality
    eliminateButton.addEventListener('click', () => {
        const participantId = eliminateInput.value.trim();
        
        if (!participantId) {
            showPopupMessage('Please enter a participant ID', 'error');
            return;
        }

        const participant = participantManager.participants.find(p => p.number === parseInt(participantId));
        
        if (!participant) {
            showPopupMessage('Participant not found', 'error');
            return;
        }

        if (participant.status === 'eliminated') {
            showPopupMessage('Participant is already eliminated', 'error');
            return;
        }

        // Eliminate the participant
        if (participantManager.eliminateParticipant(participant.number, currentRoundIndex + 1)) {
            showPopupMessage(`Participant ${participantId} has been eliminated`);
            playSound('eliminate');
            renderParticipants(currentFilter);
            updateGameStats();
        }

        // Clear the input
        eliminateInput.value = '';
    });

    // Add Enter key support for elimination
    eliminateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            eliminateButton.click();
        }
    });

    // Functions
    function renderParticipants(status = 'all', participantsToShow = null) {
        const participants = participantsToShow || participantManager.filterParticipants(status);
        participantsGrid.innerHTML = '';
        participantsGrid.className = `participants-${currentView}`;

        participants.forEach(participant => {
            const card = createParticipantCard(participant);
            card.addEventListener('click', handleCardClick);
            participantsGrid.appendChild(card);
        });
    }

    function createParticipantCard(participant) {
        const card = document.createElement('div');
        card.className = `participant-card ${participant.status}`;
        card.style.setProperty('--card-index', participant.id % 20); // Add animation delay based on ID
        card.setAttribute('data-participant-number', participant.number);

        // Add profile picture
        const profilePic = document.createElement('img');
        profilePic.src = participant.profilePic;
        profilePic.className = `profile-pic ${participant.status}`;
        profilePic.alt = `Participant ${participant.number}`;
        card.appendChild(profilePic);

        const content = document.createElement('div');
        content.className = 'card-content';

        if (currentView === 'grid') {
            content.innerHTML = `
                <div class="card-header">
                    <h3>#${participant.number}</h3>
                    <span class="status-indicator ${participant.status}"></span>
                </div>
                <div class="card-body">
                    <p>Status: ${participant.status.toUpperCase()}</p>
                    <p>Rounds: ${participant.roundsSurvived}</p>
                    <p>Survival: ${participant.survivalProbability}%</p>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="list-item">
                    <span class="player-number">#${participant.number}</span>
                    <span class="player-status ${participant.status}">${participant.status.toUpperCase()}</span>
                    <span class="player-rounds">Round ${participant.roundsSurvived}</span>
                    <span class="player-survival">${participant.survivalProbability}%</span>
                </div>
            `;
        }

        card.appendChild(content);

        const expandedDetails = document.createElement('div');
        expandedDetails.className = 'expanded-details';

        const expandedContent = document.createElement('div');
        expandedContent.className = 'expanded-content';
        expandedContent.innerHTML = `
            <p><span class="detail-label">Current Status:</span> ${participant.status.toUpperCase()}</p>
            <p><span class="detail-label">Rounds Passed:</span> ${participant.roundsSurvived}</p>
            <div class="backstory-section ${participant.status}">
                <div class="backstory-title">Player Background</div>
                <div class="backstory-content">${participant.backstory}</div>
            </div>
        `;
        expandedDetails.appendChild(expandedContent);

        const closeButton = document.createElement('button');
        closeButton.className = 'card-close';
        closeButton.textContent = '×';
        expandedDetails.appendChild(closeButton);

        card.appendChild(expandedDetails);

        return card;
    }

    // Create overlay element
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    document.body.appendChild(modalOverlay);

    // Handle card click
    function handleCardClick(event) {
        const card = event.currentTarget;
        const closeButton = card.querySelector('.card-close');
        
        // Don't expand if clicking the close button
        if (event.target === closeButton) {
            event.stopPropagation();
            card.classList.remove('expanded');
            modalOverlay.classList.remove('active');
            return;
        }

        // Remove expanded class from any other cards
        document.querySelectorAll('.participant-card.expanded').forEach(expandedCard => {
            if (expandedCard !== card) {
                expandedCard.classList.remove('expanded');
            }
        });

        // Toggle expansion
        card.classList.toggle('expanded');
        modalOverlay.classList.toggle('active');

        // Add click handler for overlay
        modalOverlay.onclick = () => {
            card.classList.remove('expanded');
            modalOverlay.classList.remove('active');
        };
    }

    function showParticipantProfile(participant) {
        console.log(`Showing profile for participant ${participant.number}`);
    }

    function updateGameStats() {
        const alive = participantManager.getAliveCount();
        const eliminated = 456 - alive;
        const survivalRate = ((alive / 456) * 100).toFixed(1);
        const prizePerPlayerValue = participantManager.calculatePrizePerPlayer();

        // Update top nav stats
        playersAlive.textContent = `Survivors: ${alive}`;
        currentRound.textContent = `Round: ${participantManager.currentRound}`;
        prizePool.textContent = `₩${(eliminated * 100000000 / 1000000000).toFixed(1)}B`;
        eliminationRate.textContent = `${participantManager.getEliminationRate()}%`;
        prizePerPlayer.textContent = `₩${(prizePerPlayerValue / 1000000).toFixed(1)}M`;

        // Update sidebar stats with animation
        updateStatWithAnimation('sidebar-survivors', alive);
        updateStatWithAnimation('sidebar-eliminated', eliminated);
        updateStatWithAnimation('sidebar-survival-rate', `${survivalRate}%`);
        updateStatWithAnimation('sidebar-prize', `₩${(prizePerPlayerValue / 1000000).toFixed(1)}M`);
    }

    function updateStatWithAnimation(elementId, value) {
        const element = document.getElementById(elementId);
        if (element && element.textContent !== value.toString()) {
            element.textContent = value;
            element.classList.add('updated');
            setTimeout(() => element.classList.remove('updated'), 500);
        }
    }

    function updateRoundInfo() {
        const currentRoundDetails = participantManager.getCurrentRoundDetails();
        if (currentRoundDetails) {
            roundDetails.innerHTML = `
                <div class="round-info-item">
                    <h4>${currentRoundDetails.name}</h4>
                    <p><i class="fas fa-exclamation-triangle"></i> Difficulty: ${currentRoundDetails.difficulty}</p>
                    <p><i class="fas fa-clock"></i> Time Limit: ${currentRoundDetails.timeLimit}</p>
                </div>
            `;
        }
    }

    // Sidebar Toggle Functionality
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const closeSidebar = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');

    function toggleSidebar() {
        sidebar.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    }

    function closeSidebarMenu() {
        sidebar.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    if (closeSidebar) {
        closeSidebar.addEventListener('click', closeSidebarMenu);
    }

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('active')) {
            const isClickInside = sidebar.contains(e.target) || sidebarToggle.contains(e.target);
            if (!isClickInside) {
                closeSidebarMenu();
            }
        }
    });

    // Close sidebar on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            closeSidebarMenu();
        }
    });

    // Initialize the dashboard
    renderParticipants();
    updateGameStats();
    updateRoundInfo();
    simulateGame();
});
