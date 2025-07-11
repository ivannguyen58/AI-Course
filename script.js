class MemoryGame {
    constructor() {
        this.gameBoard = document.getElementById('game-board');
        this.gridSizeSelect = document.getElementById('grid-size');
        this.playersSelect = document.getElementById('players');
        this.startButton = document.getElementById('start-game');
        this.movesCount = document.getElementById('moves-count');
        this.timeCount = document.getElementById('time-count');
        this.currentPlayerDisplay = document.getElementById('current-player');
        this.player1Score = document.getElementById('player1-score');
        this.player2Score = document.getElementById('player2-score');
        this.player2Section = document.getElementById('player2-section');
        this.gameMessage = document.getElementById('game-message');
        this.winModal = document.getElementById('win-modal');
        this.winMessage = document.getElementById('win-message');
        this.playAgainButton = document.getElementById('play-again');
        
        this.gridSize = 4;
        this.numPlayers = 1;
        this.currentPlayer = 1;
        this.moves = 0;
        this.startTime = null;
        this.gameTimer = null;
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.scores = [0, 0];
        this.gameActive = false;
        this.pokemonList = [];
        
        this.init();
    }
    
    init() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.playAgainButton.addEventListener('click', () => this.resetGame());
        this.playersSelect.addEventListener('change', () => this.updatePlayerDisplay());
        this.loadPokemonData();
    }
    
    async loadPokemonData() {
        try {
            const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=50');
            const data = await response.json();
            this.pokemonList = data.results;
        } catch (error) {
            console.error('Error loading Pokemon data:', error);
            this.pokemonList = this.generateFallbackData();
        }
    }
    
    generateFallbackData() {
        const fallbackPokemon = [
            { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
            { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' },
            { name: 'squirtle', url: 'https://pokeapi.co/api/v2/pokemon/7/' },
            { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
            { name: 'jigglypuff', url: 'https://pokeapi.co/api/v2/pokemon/39/' },
            { name: 'meowth', url: 'https://pokeapi.co/api/v2/pokemon/52/' },
            { name: 'psyduck', url: 'https://pokeapi.co/api/v2/pokemon/54/' },
            { name: 'eevee', url: 'https://pokeapi.co/api/v2/pokemon/133/' }
        ];
        return fallbackPokemon;
    }
    
    updatePlayerDisplay() {
        this.numPlayers = parseInt(this.playersSelect.value);
        if (this.numPlayers === 2) {
            this.player2Section.style.display = 'block';
        } else {
            this.player2Section.style.display = 'none';
        }
    }
    
    async startGame() {
        this.gridSize = parseInt(this.gridSizeSelect.value);
        this.numPlayers = parseInt(this.playersSelect.value);
        
        if (this.pokemonList.length === 0) {
            this.gameMessage.textContent = 'Loading Pokemon data...';
            await this.loadPokemonData();
        }
        
        this.resetGameState();
        this.createGameBoard();
        this.startTimer();
        this.gameActive = true;
        this.gameMessage.textContent = 'Game started! Find matching pairs!';
    }
    
    resetGameState() {
        this.currentPlayer = 1;
        this.moves = 0;
        this.matchedPairs = 0;
        this.scores = [0, 0];
        this.flippedCards = [];
        this.cards = [];
        this.startTime = Date.now();
        this.gameActive = false;
        
        this.updateDisplay();
        this.updatePlayerDisplay();
    }
    
    createGameBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.className = `game-board grid-${this.gridSize}`;
        
        const totalCards = this.gridSize * this.gridSize;
        const pairs = totalCards / 2;
        
        const selectedPokemon = this.pokemonList.slice(0, pairs);
        const cardData = [...selectedPokemon, ...selectedPokemon];
        
        this.shuffleArray(cardData);
        
        cardData.forEach((pokemon, index) => {
            const card = this.createCard(pokemon, index);
            this.gameBoard.appendChild(card);
        });
    }
    
    createCard(pokemon, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.pokemon = pokemon.name;
        card.dataset.index = index;
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        
        const pokemonId = this.extractPokemonId(pokemon.url);
        const pokemonImg = document.createElement('img');
        pokemonImg.className = 'pokemon-image';
        pokemonImg.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
        pokemonImg.alt = pokemon.name;
        pokemonImg.onerror = () => {
            pokemonImg.style.display = 'none';
            cardFront.textContent = pokemon.name.charAt(0).toUpperCase();
        };
        
        cardFront.appendChild(pokemonImg);
        card.appendChild(cardBack);
        card.appendChild(cardFront);
        
        card.addEventListener('click', () => this.flipCard(card));
        
        return card;
    }
    
    extractPokemonId(url) {
        const parts = url.split('/');
        return parts[parts.length - 2];
    }
    
    flipCard(card) {
        if (!this.gameActive || card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }
        
        if (this.flippedCards.length >= 2) {
            return;
        }
        
        card.classList.add('flipped');
        this.flippedCards.push(card);
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateDisplay();
            setTimeout(() => this.checkMatch(), 1000);
        }
    }
    
    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const pokemon1 = card1.dataset.pokemon;
        const pokemon2 = card2.dataset.pokemon;
        
        if (pokemon1 === pokemon2) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.matchedPairs++;
            this.scores[this.currentPlayer - 1]++;
            this.updateDisplay();
            
            if (this.matchedPairs === (this.gridSize * this.gridSize) / 2) {
                this.endGame();
            } else {
                this.gameMessage.textContent = 'Great match!';
                setTimeout(() => {
                    this.gameMessage.textContent = '';
                }, 1500);
            }
        } else {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            
            if (this.numPlayers === 2) {
                this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                this.updateDisplay();
            }
        }
        
        this.flippedCards = [];
    }
    
    updateDisplay() {
        this.movesCount.textContent = this.moves;
        this.currentPlayerDisplay.textContent = `Player ${this.currentPlayer}`;
        this.player1Score.textContent = this.scores[0];
        this.player2Score.textContent = this.scores[1];
    }
    
    startTimer() {
        this.gameTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            this.timeCount.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    endGame() {
        this.gameActive = false;
        clearInterval(this.gameTimer);
        
        let winnerMessage;
        if (this.numPlayers === 1) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            winnerMessage = `You completed the game in ${this.moves} moves and ${minutes}:${seconds.toString().padStart(2, '0')}!`;
        } else {
            if (this.scores[0] > this.scores[1]) {
                winnerMessage = `Player 1 wins with ${this.scores[0]} pairs!`;
            } else if (this.scores[1] > this.scores[0]) {
                winnerMessage = `Player 2 wins with ${this.scores[1]} pairs!`;
            } else {
                winnerMessage = `It's a tie! Both players found ${this.scores[0]} pairs!`;
            }
        }
        
        this.winMessage.textContent = winnerMessage;
        this.winModal.style.display = 'block';
    }
    
    resetGame() {
        this.winModal.style.display = 'none';
        clearInterval(this.gameTimer);
        this.gameMessage.textContent = '';
        this.gameBoard.innerHTML = '';
        this.timeCount.textContent = '0:00';
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
});