// ===== HexSapper Game Logic =====

class HexSapper {
    constructor() {
        // Game configuration
        this.rows = 10;
        this.cols = 10;
        this.minePercentage = 0.18; // 18% mines
        
        // Game state
        this.grid = [];
        this.mines = [];
        this.openedCount = 0;
        this.flaggedCount = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.selectedHex = null;
        this.currentTool = 'shovel';
        
        // Tools unlock thresholds
        this.dogUnlock = 10;
        this.radarUnlock = 50;
        
        // DOM elements
        this.boardEl = document.getElementById('game-board');
        this.openedCountEl = document.getElementById('opened-count');
        this.minesCountEl = document.getElementById('mines-count');
        this.toolsMenuEl = document.getElementById('tools-menu');
        this.closeToolsBtnEl = document.getElementById('close-tools-btn');
        this.messageOverlayEl = document.getElementById('message-overlay');
        this.messageTitleEl = document.getElementById('message-title');
        this.messageTextEl = document.getElementById('message-text');
        this.playAgainBtnEl = document.getElementById('play-again-btn');
        this.toolIndicatorEl = document.getElementById('tool-indicator');
        this.currentToolIconEl = document.getElementById('current-tool-icon');
        this.currentToolNameEl = document.getElementById('current-tool-name');
        this.dogToolEl = document.getElementById('dog-tool');
        this.radarToolEl = document.getElementById('radar-tool');
        this.radarOverlayEl = document.getElementById('radar-overlay');
        
        // Hex neighbors offsets for hexagonal grid (odd-r offset coordinates)
        this.hexOffsets = [
            { dr: 0, dc: -1 },  // West
            { dr: 0, dc: 1 },   // East
            { dr: -1, dc: 0 },  // Northwest (for odd rows)
            { dr: -1, dc: 1 },  // Northeast (for odd rows)
            { dr: 1, dc: -1 },  // Southwest (for odd rows)
            { dr: 1, dc: 0 },   // Southeast (for odd rows)
        ];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.newGame();
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(() => console.log('Service Worker registered'))
                .catch(err => console.error('SW registration failed:', err));
        }
    }
    
    bindEvents() {
        // New game button
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        this.playAgainBtnEl.addEventListener('click', () => {
            this.messageOverlayEl.classList.remove('active');
            this.newGame();
        });
        
        // Close tools button
        this.closeToolsBtnEl.addEventListener('click', () => this.hideToolsMenu());
        
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                if (tool && !e.currentTarget.disabled) {
                    this.selectTool(tool);
                }
            });
        });
        
        // Touch support for tools menu
        this.boardEl.addEventListener('click', (e) => {
            if (!e.target.closest('.hex-cell') && this.toolsMenuEl.classList.contains('active')) {
                this.hideToolsMenu();
            }
        });
    }
    
    newGame() {
        this.gameOver = false;
        this.gameWon = false;
        this.openedCount = 0;
        this.flaggedCount = 0;
        this.selectedHex = null;
        this.currentTool = 'shovel';
        this.grid = [];
        this.mines = [];
        
        this.updateStats();
        this.updateToolIndicator();
        this.hideToolsMenu();
        this.messageOverlayEl.classList.remove('active');
        this.radarOverlayEl.classList.remove('active');
        
        // Create grid
        this.createGrid();
        this.renderBoard();
    }
    
    createGrid() {
        const totalCells = this.rows * this.cols;
        const mineCount = Math.floor(totalCells * this.minePercentage);
        
        // Initialize empty grid
        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = {
                    row: r,
                    col: c,
                    isMine: false,
                    isOpen: false,
                    isFlagged: false,
                    isQuestioned: false,
                    neighborMines: 0,
                    isLifted: false
                };
            }
        }
        
        // Place mines randomly
        let placed = 0;
        while (placed < mineCount) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            
            if (!this.grid[r][c].isMine) {
                this.grid[r][c].isMine = true;
                this.mines.push({ r, c });
                placed++;
            }
        }
        
        // Calculate neighbor mines for each cell
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.grid[r][c].isMine) {
                    this.grid[r][c].neighborMines = this.countNeighborMines(r, c);
                }
            }
        }
    }
    
    getNeighborOffsets(row) {
        // Adjust offsets based on row parity for odd-r offset coordinates
        if (row % 2 === 0) {
            // Even row
            return [
                { dr: 0, dc: -1 },  // West
                { dr: 0, dc: 1 },   // East
                { dr: -1, dc: -1 }, // Northwest
                { dr: -1, dc: 0 },  // Northeast
                { dr: 1, dc: -1 },  // Southwest
                { dr: 1, dc: 0 },   // Southeast
            ];
        } else {
            // Odd row
            return [
                { dr: 0, dc: -1 },  // West
                { dr: 0, dc: 1 },   // East
                { dr: -1, dc: 0 },  // Northwest
                { dr: -1, dc: 1 },  // Northeast
                { dr: 1, dc: 0 },   // Southwest
                { dr: 1, dc: 1 },   // Southeast
            ];
        }
    }
    
    getNeighbors(row, col) {
        const neighbors = [];
        const offsets = this.getNeighborOffsets(row);
        
        for (const offset of offsets) {
            const nr = row + offset.dr;
            const nc = col + offset.dc;
            
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                neighbors.push({ r: nr, c: nc });
            }
        }
        
        return neighbors;
    }
    
    getNeighborsInRadius(row, col, radius) {
        const cells = [];
        
        for (let r = Math.max(0, row - radius); r <= Math.min(this.rows - 1, row + radius); r++) {
            for (let c = Math.max(0, col - radius); c <= Math.min(this.cols - 1, col + radius); c++) {
                if (r === row && c === col) continue;
                
                // Calculate hex distance
                const distance = this.hexDistance(row, col, r, c);
                if (distance <= radius) {
                    cells.push({ r, c });
                }
            }
        }
        
        return cells;
    }
    
    hexDistance(r1, c1, r2, c2) {
        // Convert to cube coordinates for distance calculation
        const q1 = c1 - (r1 - (r1 & 1)) / 2;
        const r1_cube = r1;
        const s1 = -q1 - r1_cube;
        
        const q2 = c2 - (r2 - (r2 & 1)) / 2;
        const r2_cube = r2;
        const s2 = -q2 - r2_cube;
        
        return (Math.abs(q1 - q2) + Math.abs(r1_cube - r2_cube) + Math.abs(s1 - s2)) / 2;
    }
    
    countNeighborMines(row, col) {
        const neighbors = this.getNeighbors(row, col);
        return neighbors.reduce((count, { r, c }) => {
            return count + (this.grid[r][c].isMine ? 1 : 0);
        }, 0);
    }
    
    renderBoard() {
        this.boardEl.innerHTML = '';
        
        for (let r = 0; r < this.rows; r++) {
            const rowEl = document.createElement('div');
            rowEl.className = 'hex-row';
            
            for (let c = 0; c < this.cols; c++) {
                const hexEl = document.createElement('div');
                hexEl.className = 'hex-cell';
                hexEl.dataset.row = r;
                hexEl.dataset.col = c;
                
                hexEl.addEventListener('click', (e) => this.handleHexClick(r, c, e));
                
                rowEl.appendChild(hexEl);
            }
            
            this.boardEl.appendChild(rowEl);
        }
    }
    
    handleHexClick(row, col, event) {
        if (this.gameOver || this.gameWon) return;
        
        const cell = this.grid[row][col];
        if (cell.isOpen) return;
        
        // If tools menu is open and we have a selected hex, apply the tool
        if (this.selectedHex && this.toolsMenuEl.classList.contains('active')) {
            this.applyTool(this.selectedHex.r, this.selectedHex.c);
            this.hideToolsMenu();
            this.selectedHex = null;
            return;
        }
        
        // Select this hex and show tools menu
        this.selectedHex = { r: row, c: col };
        this.showToolsMenu();
        
        // Add lifted animation
        const hexEl = this.getHexElement(row, col);
        hexEl.classList.add('lifted');
        cell.isLifted = true;
        
        setTimeout(() => {
            hexEl.classList.remove('lifted');
            cell.isLifted = false;
        }, 300);
    }
    
    showToolsMenu() {
        this.toolsMenuEl.classList.add('active');
    }
    
    hideToolsMenu() {
        this.toolsMenuEl.classList.remove('active');
    }
    
    selectTool(tool) {
        this.currentTool = tool;
        this.updateToolIndicator();
        
        // Update active state on buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        
        // Apply tool immediately if a hex is selected
        if (this.selectedHex) {
            this.applyTool(this.selectedHex.r, this.selectedHex.c);
            this.hideToolsMenu();
            this.selectedHex = null;
        }
    }
    
    applyTool(row, col) {
        switch (this.currentTool) {
            case 'shovel':
                this.openHex(row, col);
                break;
            case 'flag':
                this.toggleFlag(row, col);
                break;
            case 'question':
                this.toggleQuestion(row, col);
                break;
            case 'dog':
                this.useDog(row, col);
                break;
            case 'radar':
                this.useRadar(row, col);
                break;
        }
    }
    
    updateToolIndicator() {
        const tools = {
            shovel: { icon: '🪖', name: 'Shovel' },
            flag: { icon: '🚩', name: 'Flag' },
            question: { icon: '❓', name: 'Doubt' },
            dog: { icon: '🐕', name: 'Dog' },
            radar: { icon: '📡', name: 'Radar' }
        };
        
        const tool = tools[this.currentTool];
        this.currentToolIconEl.textContent = tool.icon;
        this.currentToolNameEl.textContent = tool.name;
    }
    
    openHex(row, col) {
        const cell = this.grid[row][col];
        
        if (cell.isOpen || cell.isFlagged) return;
        
        // Remove question mark if present
        if (cell.isQuestioned) {
            cell.isQuestioned = false;
            this.updateHexElement(row, col);
        }
        
        // Check for mine
        if (cell.isMine) {
            this.gameOverLoss(row, col);
            return;
        }
        
        // Open the cell
        cell.isOpen = true;
        this.openedCount++;
        this.updateStats();
        this.updateToolAvailability();
        
        // Update visual
        this.updateHexElement(row, col);
        
        // Flood fill if no neighboring mines
        if (cell.neighborMines === 0) {
            this.floodFill(row, col);
        }
        
        // Check for win
        this.checkWin();
    }
    
    floodFill(startRow, startCol) {
        const queue = [{ r: startRow, c: startCol }];
        const visited = new Set();
        visited.add(`${startRow},${startCol}`);
        
        while (queue.length > 0) {
            const { r, c } = queue.shift();
            const neighbors = this.getNeighbors(r, c);
            
            for (const { r: nr, c: nc } of neighbors) {
                const neighbor = this.grid[nr][nc];
                const key = `${nr},${nc}`;
                
                if (!neighbor.isOpen && !neighbor.isMine && !neighbor.isFlagged && !visited.has(key)) {
                    visited.add(key);
                    neighbor.isOpen = true;
                    this.openedCount++;
                    this.updateHexElement(nr, nc);
                    
                    if (neighbor.neighborMines === 0) {
                        queue.push({ r: nr, c: nc });
                    }
                }
            }
        }
        
        this.updateStats();
        this.updateToolAvailability();
    }
    
    toggleFlag(row, col) {
        const cell = this.grid[row][col];
        
        if (cell.isOpen) return;
        
        // Remove question mark if present
        if (cell.isQuestioned) {
            cell.isQuestioned = false;
        }
        
        cell.isFlagged = !cell.isFlagged;
        this.flaggedCount += cell.isFlagged ? 1 : -1;
        this.updateStats();
        this.updateHexElement(row, col);
    }
    
    toggleQuestion(row, col) {
        const cell = this.grid[row][col];
        
        if (cell.isOpen || cell.isFlagged) return;
        
        cell.isQuestioned = !cell.isQuestioned;
        this.updateHexElement(row, col);
    }
    
    useDog(row, col) {
        // Find nearest mine
        let nearestMine = null;
        let minDistance = Infinity;
        
        for (const mine of this.mines) {
            const cell = this.grid[mine.r][mine.c];
            if (!cell.isOpen && !cell.isFlagged) {
                const distance = this.hexDistance(row, col, mine.r, mine.c);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestMine = mine;
                }
            }
        }
        
        if (nearestMine) {
            // Highlight the path to the mine
            this.highlightPathToMine(row, col, nearestMine);
        }
    }
    
    highlightPathToMine(fromRow, fromCol, toMine) {
        // Simple visual feedback - highlight the direction
        const hexEl = this.getHexElement(fromRow, fromCol);
        hexEl.style.animation = 'none';
        hexEl.offsetHeight; // Trigger reflow
        hexEl.style.animation = 'radarPulse 0.5s ease-in-out 3';
        
        setTimeout(() => {
            hexEl.style.animation = '';
        }, 1500);
    }
    
    useRadar(row, col) {
        // Highlight all mines in radius 2
        const cellsInRadius = this.getNeighborsInRadius(row, col, 2);
        
        this.radarOverlayEl.classList.add('active');
        
        cellsInRadius.forEach(({ r, c }) => {
            const cell = this.grid[r][c];
            const hexEl = this.getHexElement(r, c);
            
            if (cell.isMine && !cell.isOpen) {
                hexEl.classList.add('radar-highlight');
            }
        });
        
        setTimeout(() => {
            this.radarOverlayEl.classList.remove('active');
            cellsInRadius.forEach(({ r, c }) => {
                const hexEl = this.getHexElement(r, c);
                hexEl.classList.remove('radar-highlight');
            });
        }, 3000);
    }
    
    updateToolAvailability() {
        // Unlock dog tool after 10 opened hexes
        this.dogToolEl.disabled = this.openedCount < this.dogUnlock;
        
        // Unlock radar tool after 50 opened hexes
        this.radarToolEl.disabled = this.openedCount < this.radarUnlock;
    }
    
    updateHexElement(row, col) {
        const hexEl = this.getHexElement(row, col);
        const cell = this.grid[row][col];
        
        hexEl.className = 'hex-cell';
        hexEl.innerHTML = '';
        
        if (cell.isOpen) {
            hexEl.classList.add('open');
            if (cell.neighborMines > 0) {
                const numberEl = document.createElement('span');
                numberEl.className = 'hex-number';
                numberEl.dataset.value = cell.neighborMines;
                numberEl.textContent = cell.neighborMines;
                hexEl.appendChild(numberEl);
            }
        } else if (cell.isFlagged) {
            hexEl.classList.add('flagged');
        } else if (cell.isQuestioned) {
            hexEl.classList.add('questioned');
        }
    }
    
    getHexElement(row, col) {
        return this.boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }
    
    updateStats() {
        this.openedCountEl.textContent = this.openedCount;
        const totalMines = Math.floor(this.rows * this.cols * this.minePercentage);
        this.minesCountEl.textContent = totalMines - this.flaggedCount;
    }
    
    checkWin() {
        const totalCells = this.rows * this.cols;
        const totalMines = this.mines.length;
        const nonMineCells = totalCells - totalMines;
        
        if (this.openedCount === nonMineCells) {
            this.gameWon = true;
            this.showWinMessage();
        }
    }
    
    gameOverLoss(hitRow, hitCol) {
        this.gameOver = true;
        
        // Reveal all mines
        this.mines.forEach(({ r, c }) => {
            const cell = this.grid[r][c];
            const hexEl = this.getHexElement(r, c);
            
            if (!cell.isOpen) {
                cell.isOpen = true;
                hexEl.classList.add('mine-revealed');
            }
        });
        
        // Mark the hit mine
        const hitHexEl = this.getHexElement(hitRow, hitCol);
        hitHexEl.classList.add('exploded');
        
        // Mark incorrectly flagged cells
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                const hexEl = this.getHexElement(r, c);
                
                if (cell.isFlagged && !cell.isMine) {
                    hexEl.style.filter = 'brightness(0.5)';
                }
            }
        }
        
        setTimeout(() => {
            this.showLoseMessage();
        }, 1000);
    }
    
    showWinMessage() {
        this.messageTitleEl.textContent = '🎉 Victory!';
        this.messageTextEl.textContent = `You cleared the field in ${this.openedCount} moves!`;
        this.messageContentEl = this.messageOverlayEl.querySelector('.message-content');
        this.messageContentEl.className = 'message-content win';
        this.messageOverlayEl.classList.add('active');
    }
    
    showLoseMessage() {
        this.messageTitleEl.textContent = '💥 Game Over';
        this.messageTextEl.textContent = 'Better luck next time!';
        this.messageContentEl = this.messageOverlayEl.querySelector('.message-content');
        this.messageContentEl.className = 'message-content lose';
        this.messageOverlayEl.classList.add('active');
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new HexSapper();
});
