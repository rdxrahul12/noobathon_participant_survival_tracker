// Participant data management
class ParticipantManager {
    constructor() {
        this.participants = [];
        this.currentRound = 0;
        this.roundDetails = [
            { name: 'Red Light, Green Light', difficulty: 'High', timeLimit: '5 minutes' },
            { name: 'Sugar Honeycomb', difficulty: 'Medium', timeLimit: '10 minutes' },
            { name: 'Tug of War', difficulty: 'High', timeLimit: '3 minutes' },
            { name: 'Marbles', difficulty: 'Medium', timeLimit: '30 minutes' },
            { name: 'Glass Bridge', difficulty: 'Extreme', timeLimit: '16 minutes' },
            { name: 'Squid Game', difficulty: 'Extreme', timeLimit: 'Until Victory' }
        ];
        
        // Initialize with diverse backstories
        this.backstories = [
            'A former investment banker who lost everything in a market crash. Now ₩400M in debt, they see the game as their last chance at redemption.',
            'A talented chef whose restaurant failed during the pandemic. With a family to support and mounting bills, desperation led them to the game.',
            'A single parent working three jobs to pay for their child\'s medical treatment. The prize money could change everything.',
            'A promising athlete whose career ended after an injury. Buried in medical debt, they joined the game seeking a second chance.',
            'A retired teacher who lost their pension to a scam. Now homeless, they have nothing left to lose.',
            'A young computer programmer trapped in a cycle of gambling debt. The game offers an escape, if they can survive.',
            'A skilled factory worker laid off after 15 years. With an elderly parent to care for, the stakes couldn\'t be higher.',
            'An aspiring artist who sacrificed everything for their dream. Now facing eviction, they see no other way out.',
            'A former pro gamer whose streaming career collapsed. Deep in debt to loan sharks, time is running out.',
            'A small business owner whose shop was destroyed in a fire. Insurance refused to pay, leaving them desperate.',
            'An immigrant worker sending money home to their family. When their work visa expired, the game became their only option.',
            'A medical student who dropped out due to mounting tuition debt. The game could help them finish their degree.',
            'A former musician whose record label betrayed them. Now blacklisted from the industry, they need a fresh start.',
            'A taxi driver working 16-hour shifts to support their elderly parents. The game promises financial freedom.',
            'A divorced parent fighting for custody of their children. The prize money could help win the legal battle.'
        ];
        
        // Initialize profile pictures array
        this.profilePictures = [];
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                this.profilePictures.push(`faces/face_${i}_${j}.png`);
            }
        }
        // Shuffle profile pictures
        this.shuffleArray(this.profilePictures);
        this.initializeParticipants();
    }

    initializeParticipants() {
        for (let i = 1; i <= 456; i++) {
            const backstoryIndex = (i - 1) % this.backstories.length;
            const profilePicIndex = (i - 1) % this.profilePictures.length;
            this.participants.push({
                number: i,
                status: 'alive',
                roundsSurvived: 0,
                survivalProbability: 100,
                eliminatedIn: null,
                backstory: this.backstories[backstoryIndex],
                profilePic: this.profilePictures[profilePicIndex]
            });
        }
    }

    // Fisher-Yates shuffle algorithm
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    searchParticipant(number) {
        return this.participants.find(p => p.number === parseInt(number));
    }

    filterParticipants(status) {
        if (status === 'all') return this.participants;
        return this.participants.filter(p => p.status === status);
    }

    eliminateParticipant(number, round) {
        const participant = this.searchParticipant(number);
        if (participant && participant.status === 'alive') {
            participant.status = 'eliminated';
            participant.eliminatedIn = round;
            participant.survivalProbability = 0;
            return true;
        }
        return false;
    }

    updateRoundProgress(round) {
        this.currentRound = round;
        this.participants.forEach(p => {
            if (p.status === 'alive') {
                p.roundsSurvived = round;
                p.survivalProbability = Math.round((1 - (round * 0.15)) * 100);
            }
        });
    }

    getAliveCount() {
        return this.participants.filter(p => p.status === 'alive').length;
    }

    getEliminationRate() {
        return Math.round(((456 - this.getAliveCount()) / 456) * 100);
    }

    calculatePrizePerPlayer() {
        const aliveCount = this.getAliveCount();
        if (aliveCount === 0) return 0;
        return Math.floor((456 - aliveCount) * 100000000 / aliveCount);
    }

    getCurrentRoundDetails() {
        if (this.currentRound > 0 && this.currentRound <= this.roundDetails.length) {
            return this.roundDetails[this.currentRound - 1];
        }
        return null;
    }
}

// Create global instance
const participantManager = new ParticipantManager();
