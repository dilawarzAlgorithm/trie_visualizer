# 🌳 Interactive Trie (Prefix Tree) Visualizer

## What is this?

An interactive, browser-based educational tool designed to visualize the internal mechanics of a Trie (Prefix Tree) data structure. This visualizer allows users to insert words, search for exact matches, and perform prefix-based autocomplete searches in real-time. It demonstrates the $O(L)$ time complexity of Trie operations, where $L$ is the length of the word.

## Why build this?

Understanding how a Trie allocates memory (arrays of pointers) and traverses nodes character-by-character can be difficult through text alone. This project exists to provide a tangible, step-by-step visual representation of algorithmic traversal, making it easier for students and developers to grasp advanced Data Structures and Algorithms (DSA).

## Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Visualization:** SVG Canvas for dynamic edge rendering, DOM manipulation for node states.
- **Zero Dependencies:** Built entirely without external frameworks (no React, no external charting libraries).

## Features

- **Dynamic Insertion & Search:** Watch the algorithm allocate new nodes or traverse existing ones character by character.
- **Autocomplete (Prefix Search):** Utilizes Depth-First Search (DFS) to find all valid words branching from a given prefix.
- **Detailed Memory View:** Toggle between a standard graph view and a detailed "Array View" to see exactly how the 26-pointer arrays and boolean flags are structured in memory.
- **Execution Log:** A real-time terminal output explaining the algorithm's decision-making process at each step.

## Getting Started

Because this project is built with Vanilla Web Technologies, no build step or package manager is required.

1. Clone the repository:
   ```bash
   git clone [https://github.com/dilawarzAlgorithm/trie_visualizer.git](https://github.com/dilawarzAlgorithm/trie_visualizer.git)
   ```
