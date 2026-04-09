class VisualTrieNode {
    constructor(char = '') {
        this.char = char;
        this.children = {};
        this.isEndOfWord = false;
        
        // Visual metadata
        this.id = 'node_' + Math.random().toString(36).substr(2, 9);
        this.x = 0;
        this.y = 0;
        this.width = 0;
    }
}

class TrieVisualizer {
    constructor() {
        this.root = new VisualTrieNode('*');
        this.animationSpeed = 700;
        this.viewMode = 'simple'; // 'simple' or 'detailed'
        
        // Cache DOM elements
        this.elements = {
            logMessages: document.getElementById('logMessages'),
            svgCanvas: document.getElementById('svg-canvas'),
            nodesContainer: document.getElementById('nodes-container'),
            visArea: document.getElementById('visArea'),
            treeContainer: document.getElementById('treeContainer'),
            blocker: document.getElementById('blocker'),
            inputs: {
                insert: document.getElementById('insertInput'),
                search: document.getElementById('searchInput'),
                autocomplete: document.getElementById('autocompleteInput')
            },
            results: {
                panel: document.getElementById('autocompleteResults'),
                list: document.getElementById('resultsList')
            },
            speedSlider: document.getElementById('speedSlider'),
            speedLabel: document.getElementById('speedLabel'),
            viewToggleBtn: document.getElementById('viewToggleBtn')
        };

        this.bindEvents();
        this.updateSpeed();
        this.renderTree();
    }

    bindEvents() {
        // Inputs
        this.elements.inputs.insert.addEventListener('keydown', (e) => { if(e.key === 'Enter') this.handleInsert(); });
        this.elements.inputs.search.addEventListener('keydown', (e) => { if(e.key === 'Enter') this.handleSearch(); });
        this.elements.inputs.autocomplete.addEventListener('keydown', (e) => { if(e.key === 'Enter') this.handleAutocomplete(); });

        // Buttons
        document.getElementById('insertBtn').addEventListener('click', () => this.handleInsert());
        document.getElementById('searchBtn').addEventListener('click', () => this.handleSearch());
        document.getElementById('autocompleteBtn').addEventListener('click', () => this.handleAutocomplete());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearTrie());
        document.getElementById('ex1Btn').addEventListener('click', () => this.loadExampleSet('pets'));
        document.getElementById('ex2Btn').addEventListener('click', () => this.loadExampleSet('dev'));
        document.getElementById('closeResultsBtn').addEventListener('click', () => this.closeResults());
        
        this.elements.viewToggleBtn.addEventListener('click', () => this.toggleViewMode());
        this.elements.speedSlider.addEventListener('input', () => this.updateSpeed());

        // Window Resize
        window.addEventListener('resize', () => {
            if (this.elements.blocker.style.display === 'none' || !this.elements.blocker.style.display) {
                this.renderTree();
            }
        });
    }

    // --- State Management ---
    
    updateSpeed() {
        const val = this.elements.speedSlider.value;
        this.animationSpeed = 1500 - ((val - 1) * 150);
        
        if (val < 4) this.elements.speedLabel.innerText = "Slow";
        else if (val > 7) this.elements.speedLabel.innerText = "Fast";
        else this.elements.speedLabel.innerText = "Normal";
    }

    toggleViewMode() {
        this.viewMode = this.viewMode === 'simple' ? 'detailed' : 'simple';
        
        if (this.viewMode === 'detailed') {
            this.elements.viewToggleBtn.innerHTML = '<i class="fa-solid fa-circle"></i> Simple View';
            this.addLog('Switched to Detailed Memory View.', 'warning');
        } else {
            this.elements.viewToggleBtn.innerHTML = '<i class="fa-solid fa-table-cells"></i> Detailed View';
            this.addLog('Switched to Simple Node View.', 'success');
        }
        this.renderTree();
    }

    setBlocker(state) {
        this.elements.blocker.style.display = state ? 'block' : 'none';
        const btns = ['insertBtn', 'searchBtn', 'autocompleteBtn', 'viewToggleBtn', 'ex1Btn', 'ex2Btn', 'clearBtn'];
        btns.forEach(id => {
            const btn = document.getElementById(id);
            if(btn) btn.disabled = state;
        });
    }

    addLog(message, type = '') {
        const span = document.createElement('span');
        span.innerHTML = message;
        if (type) span.className = type;
        this.elements.logMessages.appendChild(span);
        this.elements.logMessages.scrollTop = this.elements.logMessages.scrollHeight;
    }

    closeResults() {
        this.elements.results.panel.style.display = 'none';
    }

    clearVisualStates() {
        document.querySelectorAll('.active, .found, .not-found').forEach(n => {
            n.classList.remove('active', 'found', 'not-found');
        });
        document.querySelectorAll('line').forEach(l => {
            l.classList.remove('active-edge');
        });
        document.querySelectorAll('.active-slot').forEach(s => {
            s.classList.remove('active-slot');
        });
    }

    // --- Layout & Rendering ---

    getSpacing() {
        return this.viewMode === 'detailed' ? { h: 360, v: 180 } : { h: 60, v: 80 };
    }

    calculateLayout() {
        const spacing = this.getSpacing();

        const calculateWidth = (node) => {
            const keys = Object.keys(node.children);
            if (keys.length === 0) {
                node.width = spacing.h;
                return node.width;
            }
            let totalWidth = 0;
            keys.forEach(key => { totalWidth += calculateWidth(node.children[key]); });
            node.width = Math.max(totalWidth, spacing.h);
            return node.width;
        }
        calculateWidth(this.root);
        
        const startX = Math.max(this.elements.visArea.clientWidth / 2, this.root.width / 2 + 50);
        
        const assignCoordinates = (node, depth, currentX) => {
            const topPadding = this.viewMode === 'detailed' ? 80 : 50; 
            node.y = depth * spacing.v + topPadding;
            node.x = currentX;
            
            const keys = Object.keys(node.children);
            if (keys.length > 0) {
                let childStartX = currentX - (node.width / 2);
                keys.forEach(key => {
                    const child = node.children[key];
                    const childX = childStartX + (child.width / 2);
                    assignCoordinates(child, depth + 1, childX);
                    childStartX += child.width;
                });
            }
        }
        assignCoordinates(this.root, 0, startX);
        
        let maxDepth = 0;
        const findDepth = (node, currentDepth) => {
            maxDepth = Math.max(maxDepth, currentDepth);
            Object.values(node.children).forEach(c => findDepth(c, currentDepth + 1));
        }
        findDepth(this.root, 0);
        
        this.elements.treeContainer.style.minHeight = `${(maxDepth + 1) * spacing.v + 150}px`;
        this.elements.treeContainer.style.minWidth = `${Math.max(this.elements.visArea.clientWidth, this.root.width + 100)}px`;
    }

    renderTree() {
        this.calculateLayout();
        this.elements.svgCanvas.innerHTML = '';
        
        const draw = (node, parent, charFromParent) => {
            if (parent !== null) {
                let x1, y1, x2, y2;
                if (this.viewMode === 'simple') {
                    x1 = parent.x; y1 = parent.y;
                    x2 = node.x; y2 = node.y;
                } else {
                    const charIndex = charFromParent.charCodeAt(0) - 65;
                    x1 = parent.x - 150 + (charIndex * 12);
                    y1 = parent.y + 16; 
                    x2 = node.x;
                    y2 = node.y - 50; 
                }

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                line.setAttribute('id', `edge_${node.id}`);
                this.elements.svgCanvas.appendChild(line);
            }
            
            let div = document.getElementById(node.id);
            if (!div) {
                div = document.createElement('div');
                div.id = node.id;
                this.elements.nodesContainer.appendChild(div);
            }
            
            div.style.left = `${node.x}px`;
            div.style.top = `${node.y}px`;
            div.className = this.viewMode === 'simple' ? 'trie-node' : 'trie-node-detailed';
            if (node === this.root) div.classList.add('root');
            
            if (this.viewMode === 'simple') {
                div.innerHTML = node.char;
                let prefix = this.getPrefixForNode(node);
                div.setAttribute('data-tooltip', prefix === '*' ? 'Root' : `Prefix: ${prefix}`);
            } else {
                let headerTxt = node === this.root ? 'Root Node (arr[26])' : `Node ('${node.char}')`;
                let html = `<div class="node-header">${headerTxt}</div>`;
                html += `<div class="node-array-container"><div class="node-array">`;
                
                for(let i=0; i<26; i++) {
                    let ch = String.fromCharCode(65 + i);
                    let hasChild = !!node.children[ch];
                    html += `<div class="array-slot ${hasChild ? 'filled' : ''}" data-char="${ch}">${ch}</div>`;
                }
                html += `</div></div>`;
                html += `<div class="node-flag ${node.isEndOfWord ? 'true' : 'false'}">flag: ${node.isEndOfWord}</div>`;
                
                div.innerHTML = html;
                div.removeAttribute('data-tooltip');
            }
            
            if (node.isEndOfWord) div.classList.add('end-word');
            else div.classList.remove('end-word');

            Object.keys(node.children).forEach(key => draw(node.children[key], node, key));
        }
        
        draw(this.root, null, null);
    }

    getPrefixForNode(targetNode) {
        let path = "";
        let found = false;
        const traverse = (node, currentPath) => {
            if (node === targetNode) { path = currentPath; found = true; return; }
            for (let key in node.children) {
                if (!found) traverse(node.children[key], currentPath + key);
            }
        }
        traverse(this.root, "");
        return path || "*";
    }

    // --- Highlight Helpers ---

    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    
    highlightNode(node, stateClass) {
        const div = document.getElementById(node.id);
        if (div) div.classList.add(stateClass);
    }
    
    unhighlightNode(node, stateClass) {
        const div = document.getElementById(node.id);
        if (div) div.classList.remove(stateClass);
    }

    highlightEdge(childNode) {
        const line = document.getElementById(`edge_${childNode.id}`);
        if (line) line.classList.add('active-edge');
    }

    toggleSlotHighlight(node, char, state) {
        if (this.viewMode !== 'detailed') return;
        const div = document.getElementById(node.id);
        if (div) {
            const slot = div.querySelector(`.array-slot[data-char="${char}"]`);
            if (slot) {
                if (state) slot.classList.add('active-slot');
                else slot.classList.remove('active-slot');
            }
        }
    }

    // --- Core Algorithms ---

    async insert(word) {
        word = word.toUpperCase();
        if (!word) return;

        this.setBlocker(true);
        this.clearVisualStates();
        this.addLog(`--- Starting Insertion: "${word}" ---`, 'warning');
        
        let current = this.root;
        this.highlightNode(current, 'active');
        await this.sleep(this.animationSpeed);
        
        for (let i = 0; i < word.length; i++) {
            let char = word[i];
            
            this.addLog(`Checking array slot for '${char}'...`);
            this.toggleSlotHighlight(current, char, true);
            await this.sleep(this.animationSpeed * 0.8);
            
            if (!current.children[char]) {
                this.addLog(`Pointer is NULL. Allocating new Node for '${char}'.`);
                current.children[char] = new VisualTrieNode(char);
                this.renderTree(); 
                this.highlightNode(current, 'active');
                this.toggleSlotHighlight(current, char, true);
                await this.sleep(this.animationSpeed);
            } else {
                this.addLog(`Pointer exists for '${char}'. Traversing down.`);
            }
            
            let nextNode = current.children[char];
            
            this.unhighlightNode(current, 'active');
            this.toggleSlotHighlight(current, char, false);
            this.highlightEdge(nextNode);
            
            current = nextNode;
            this.highlightNode(current, 'active');
            await this.sleep(this.animationSpeed);
        }
        
        if (!current.isEndOfWord) {
            current.isEndOfWord = true;
            this.addLog(`Word complete. Setting flag = true.`, 'success');
            this.renderTree(); 
            this.highlightNode(current, 'end-word'); 
        } else {
            this.addLog(`Word already exists. Flag is already true.`, 'warning');
        }
        
        await this.sleep(this.animationSpeed * 1.5);
        this.clearVisualStates();
        this.setBlocker(false);
        this.elements.inputs.insert.value = '';
        this.elements.inputs.insert.focus();
    }

    async search(word) {
        word = word.toUpperCase();
        if (!word) return;

        this.setBlocker(true);
        this.clearVisualStates();
        this.addLog(`--- Starting Search: "${word}" ---`, 'warning');
        
        let current = this.root;
        this.highlightNode(current, 'active');
        await this.sleep(this.animationSpeed);
        
        for (let i = 0; i < word.length; i++) {
            let char = word[i];
            
            this.addLog(`Checking array slot for '${char}'...`);
            this.toggleSlotHighlight(current, char, true);
            await this.sleep(this.animationSpeed * 0.8);
            
            if (!current.children[char]) {
                this.addLog(`Pointer for '${char}' is NULL! Traversal broken.`, 'danger');
                this.toggleSlotHighlight(current, char, false);
                this.unhighlightNode(current, 'active');
                this.highlightNode(current, 'not-found');
                await this.sleep(this.animationSpeed * 1.5);
                this.addLog(`Result: "${word}" NOT found in Trie.`, 'danger');
                this.clearVisualStates();
                this.setBlocker(false);
                return;
            }
            
            let nextNode = current.children[char];
            
            this.unhighlightNode(current, 'active');
            this.toggleSlotHighlight(current, char, false);
            this.highlightEdge(nextNode);
            
            current = nextNode;
            this.highlightNode(current, 'active');
            await this.sleep(this.animationSpeed);
        }
        
        this.addLog(`Traversal complete. Checking node flag...`);
        await this.sleep(this.animationSpeed * 0.5);

        if (current.isEndOfWord) {
            this.highlightNode(current, 'found');
            this.addLog(`Flag is TRUE! "${word}" FOUND!`, 'success');
        } else {
            this.highlightNode(current, 'not-found');
            this.addLog(`Flag is FALSE. "${word}" is just a prefix.`, 'danger');
        }
        
        await this.sleep(this.animationSpeed * 2);
        this.clearVisualStates();
        this.setBlocker(false);
    }

    async autocomplete(prefix) {
        prefix = prefix.toUpperCase();
        if (!prefix) return;

        this.closeResults();
        this.setBlocker(true);
        this.clearVisualStates();
        this.addLog(`--- Starting Prefix Search: "${prefix}" ---`, 'warning');
        
        let current = this.root;
        this.highlightNode(current, 'active');
        await this.sleep(this.animationSpeed);
        
        for (let i = 0; i < prefix.length; i++) {
            let char = prefix[i];
            
            this.addLog(`Checking array slot for '${char}'...`);
            this.toggleSlotHighlight(current, char, true);
            await this.sleep(this.animationSpeed * 0.8);
            
            if (!current.children[char]) {
                this.addLog(`Pointer for '${char}' is NULL. Prefix not found.`, 'danger');
                this.toggleSlotHighlight(current, char, false);
                this.unhighlightNode(current, 'active');
                this.highlightNode(current, 'not-found');
                await this.sleep(this.animationSpeed * 1.5);
                this.clearVisualStates();
                this.setBlocker(false);
                return;
            }
            
            let nextNode = current.children[char];
            
            this.unhighlightNode(current, 'active');
            this.toggleSlotHighlight(current, char, false);
            this.highlightEdge(nextNode);
            
            current = nextNode;
            this.highlightNode(current, 'active');
            await this.sleep(this.animationSpeed);
        }
        
        this.addLog(`Prefix "${prefix}" found! Gathering all matching words...`, 'success');
        
        let foundWords = [];
        this.elements.results.list.innerHTML = '';
        this.elements.results.panel.style.display = 'block';
        
        const dfs = async (node, currentStr) => {
            this.highlightNode(node, 'active');
            if (node.isEndOfWord) {
                foundWords.push(currentStr);
                this.elements.results.list.innerHTML = foundWords.map(w => `<li>${w}</li>`).join('');
                this.highlightNode(node, 'found');
                this.addLog(`Found word: "${currentStr}"`, 'success');
                await this.sleep(this.animationSpeed * 0.5);
            }
            
            let keys = Object.keys(node.children).sort();
            for (let char of keys) {
                this.toggleSlotHighlight(node, char, true);
                await this.sleep(this.animationSpeed * 0.3);
                
                let childNode = node.children[char];
                this.highlightEdge(childNode);
                await this.sleep(this.animationSpeed * 0.3);
                
                await dfs(childNode, currentStr + char);
                
                this.toggleSlotHighlight(node, char, false);
                this.unhighlightNode(childNode, 'active');
                this.unhighlightNode(childNode, 'found');
            }
            this.unhighlightNode(node, 'active');
        }
        
        await dfs(current, prefix);
        
        if (foundWords.length > 0) {
            this.addLog(`Autocomplete complete. ${foundWords.length} words found.`, 'success');
        } else {
            this.elements.results.panel.style.display = 'none';
            this.addLog(`No complete words found with this prefix.`, 'warning');
        }
        
        await this.sleep(this.animationSpeed * 2);
        this.clearVisualStates();
        this.setBlocker(false);
    }

    // --- Handlers ---
    
    handleInsert() {
        const word = this.elements.inputs.insert.value.trim();
        if (word.length > 0 && /^[a-zA-Z]+$/.test(word)) this.insert(word);
        else if (word.length > 0) alert("Please enter only alphabetic characters.");
    }

    handleSearch() {
        const word = this.elements.inputs.search.value.trim();
        if (word.length > 0 && /^[a-zA-Z]+$/.test(word)) this.search(word);
    }

    handleAutocomplete() {
        const prefix = this.elements.inputs.autocomplete.value.trim();
        if (prefix.length > 0 && /^[a-zA-Z]+$/.test(prefix)) this.autocomplete(prefix);
    }

    clearTrie() {
        this.root = new VisualTrieNode('*');
        this.elements.logMessages.innerHTML = '';
        this.addLog('Trie memory cleared.', 'danger');
        this.elements.nodesContainer.innerHTML = '';
        this.elements.svgCanvas.innerHTML = '';
        this.closeResults();
        this.renderTree();
    }

    async loadExampleSet(setType) {
        this.clearTrie();
        let words = setType === 'pets' ? ['CAT', 'CAR', 'CART', 'DOG'] : ['API', 'APP', 'APPLE', 'BUG'];
        const tempSpeed = this.animationSpeed;
        this.animationSpeed = 100;
        for (let word of words) await this.insert(word);
        this.animationSpeed = tempSpeed;
        this.addLog(`Loaded example set.`, 'success');
    }
}

// Initialize Application
window.onload = () => {
    const app = new TrieVisualizer();
};