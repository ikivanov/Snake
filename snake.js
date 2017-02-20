(function() {
	const UPDATE_INTERVAL_PER_LEVEL = { 1: 600, 2: 550, 3: 500, 4: 450, 5: 400, 6: 350, 7: 300, 8: 250, 9: 200 },
			SCORES_TO_LEVEL_UP = { 2: 5, 3: 11, 4: 18, 5: 26, 6: 35, 7: 45, 8: 56, 9: 68 },
			FPS_LABEL_POSITION = { x: 400, y: 25 },
			LEVEL_TEXT_POSITION = { x: 400, y: 75 },
			SCORE_TEXT_POSITION = { x: 400, y: 100 },
			GAME_OVER_TEXT_POSTION = { x: 140, y: 200 },
			PAUSE_TEXT_POSITION = { x: 150, y: 200 },
			SPLITTER_POSITION = { x: 383, y: 0 },
			SNAKE_INITIAL_LENGTH = 5,
			SNAKE_INITIAL_ROW = 3,
			SNAKE_INITIAL_COL = 5,
			SNAKE_BLOCK_LENGTH = 25,
			SNAKE_BLOCK_OFFSET = 4,
			HORIZONTAL_BLOCKS = 15,
			VERTICAL_BLOCKS = 16,
			MAX_LEVEL = 9;

	function Snake(config) {
		let that = this;

		that.canvas = config.canvas;
		that.context = that.canvas.getContext("2d");

		that.fpsLabel = new SnakeNamespace.FPSLabel({
			context: that.context,
			position: FPS_LABEL_POSITION
		});

		that._init();

		document.addEventListener("keydown", that._onKeyDown.bind(that));
	}

	Snake.prototype = {
		render: function() {
			let that = this;

			if (that.isGameOver) {
				that._renderGameOver();
				return;
			}

			if (that.isPaused) {
				that._renderPaused();
				return;
			}

			setTimeout(function() {
				requestAnimationFrame(that.render.bind(that));

				that._invalidate();
			}, that.levelUpdateInterval);
		},

		start: function() {
			let that = this;

			if (that.isGameOver) {
				that._init();
			}

			that.isGameOver = that.isPaused = false;

			that.render();
		},

		pause: function() {
			this.isPaused = true;
		},

		_init: function() {
			let that = this;

			that.directionVector = { x: -1, y: 0 };

			that.snakeBlocks = [];
			for (let i = 0; i < SNAKE_INITIAL_LENGTH; i++) {
				let snakeBlock = {
								x: SNAKE_BLOCK_OFFSET + (SNAKE_INITIAL_COL + i) * SNAKE_BLOCK_LENGTH,
								y: SNAKE_BLOCK_OFFSET + (SNAKE_INITIAL_ROW * SNAKE_BLOCK_LENGTH)
							};

				that.snakeBlocks.push(snakeBlock);
			}

			that.snakeHead = that.snakeBlocks[0];

			that.food = that._generateFood();

			that.level = 1;
			that.levelUpdateInterval = UPDATE_INTERVAL_PER_LEVEL[that.level];
			that.scores = 0;
			that.keyboard = { keyPressed: "" };
		},

		_invalidate: function(keyCode) {
			let that = this;

			that._update(keyCode);

			that.context.clearRect(0, 0, that.canvas.width, that.canvas.height);

			that._render();
		},

		_update: function(keyCode) {
			let that = this,
				head = that.snakeBlocks[0];

			that.fpsLabel.update();

			if (keyCode && keyCode === "ArrowLeft") {
				if (that.directionVector.x === 1) {
					return;
				}

				that.directionVector = { x: -1, y: 0 };
			}

			if (keyCode && keyCode === "ArrowRight") {
				if (that.directionVector.x === -1) {
					return;
				}

				that.directionVector = { x: 1, y: 0 };
			}

			if (keyCode && keyCode === "ArrowUp") {
				if (that.directionVector.y === 1) {
					return;
				}

				that.directionVector = { x: 0, y: -1 };
			}

			if (keyCode && keyCode === "ArrowDown") {
				if (that.directionVector.y === -1) {
					return;
				}

				that.directionVector = { x: 0, y: 1 };
			}

			let newHead = {
				x: head.x + (that.directionVector.x * SNAKE_BLOCK_LENGTH),
				y: head.y + (that.directionVector.y * SNAKE_BLOCK_LENGTH)
			};

			if (that._hasCollision(newHead)) {
				that.isGameOver = true;
				return;
			}

			if (that._hasFoodCollision(newHead)) {
				that.snakeBlocks.unshift(that.food);
				that._updateStatistics();
				that.food = that._generateFood();
			} else {
				that.snakeBlocks.pop();
				that.snakeBlocks.unshift(newHead);
			}
		},

		_hasCollision: function(head) {
			let that = this;

			if (head.x < SNAKE_BLOCK_OFFSET ||
				head.x >= SNAKE_BLOCK_OFFSET + (SNAKE_BLOCK_LENGTH * HORIZONTAL_BLOCKS)) {
				return true;
			}

			if (head.y < SNAKE_BLOCK_OFFSET ||
				head.y >= SNAKE_BLOCK_OFFSET + (SNAKE_BLOCK_LENGTH * VERTICAL_BLOCKS)) {
				return true;
			}

			//has self collision with body
			for (let i = 0; i < that.snakeBlocks.length - 1; i++) {
				let snakeBlock = that.snakeBlocks[i];

				if (head.x === snakeBlock.x && head.y === snakeBlock.y) {
					return true;
				}
			}

			return false;
		},

		_hasFoodCollision: function(head) {
			let that = this;

			if (head.x === that.food.x && head.y === that.food.y) {
				return true;
			}

			return false;
		},

		_render: function() {
			let that = this,
				ctx = that.context;

			that._renderBackground();

			that.fpsLabel.render();

			that._renderSnake();

			that._renderFood();

			that._renderStatisticsPanel();
		},

		_renderBackground: function() {
			let that = this,
				ctx = that.context;


			ctx.fillStyle = "black";
			ctx.fillRect(0, 0, that.canvas.width, that.canvas.height);

			ctx.lineWidth = 5;
			ctx.strokeStyle = "brown";
			ctx.strokeRect(0, 0, that.canvas.width, that.canvas.height);

			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.moveTo(SPLITTER_POSITION.x, SPLITTER_POSITION.y);
			ctx.lineTo(SPLITTER_POSITION.x, that.canvas.height);
			ctx.stroke();
		},

		_renderSnake: function() {
			let that = this,
				ctx = that.context;

			ctx.lineWidth = 2;
			ctx.strokeStyle = "white";
			ctx.fillStyle = "red";

			for (let i = 0; i < that.snakeBlocks.length; i++) {
				let snakeBlock = that.snakeBlocks[i];

				ctx.strokeRect(snakeBlock.x, snakeBlock.y, SNAKE_BLOCK_LENGTH, SNAKE_BLOCK_LENGTH);
				ctx.fillRect(snakeBlock.x, snakeBlock.y, SNAKE_BLOCK_LENGTH, SNAKE_BLOCK_LENGTH);
			}
		},

		_renderFood: function() {
			let that = this,
				ctx = that.context;

			ctx.lineWidth = 2;
			ctx.strokeStyle = "white";
			ctx.fillStyle = "yellow";

			ctx.strokeRect(that.food.x, that.food.y, SNAKE_BLOCK_LENGTH, SNAKE_BLOCK_LENGTH);
			ctx.fillRect(that.food.x, that.food.y, SNAKE_BLOCK_LENGTH, SNAKE_BLOCK_LENGTH);
		},

		_renderStatisticsPanel: function() {
			let that = this,
				ctx = that.context;

			ctx.font = "14px Arial";
			ctx.fillStyle = "white";
			ctx.textAlign = "left";

			ctx.fillText("Level: " + that.level, LEVEL_TEXT_POSITION.x, LEVEL_TEXT_POSITION.y);
			ctx.fillText("Scores: " + that.scores, SCORE_TEXT_POSITION.x, SCORE_TEXT_POSITION.y)
		},

		_updateStatistics: function() {
			let that = this;

			that.scores++;

			if (that.level < MAX_LEVEL) {
				if (that.scores >= SCORES_TO_LEVEL_UP[that.level + 1]) {
					that.level++;
					that.levelUpdateInterval = UPDATE_INTERVAL_PER_LEVEL[that.level];
				}
			}
		},

		_getScores: function(lines) {
			return SCORES_FACTOR_PER_LINES_COMPLETED[lines];
		},

		_isGameOver: function(tetrimino) {
			let that = this;

			return false;
		},

		gameOver: function() {
			let that = this;

			if (that.isPaused) {
				return;
			}

			that.isGameOver = true;
		},

		_renderGameOver: function() {
			let that = this,
				ctx = that.context;

			ctx.font = "20px Arial";
			ctx.fillStyle = "white";
			ctx.textAlign = "left";

			ctx.fillText("Game Over!", GAME_OVER_TEXT_POSTION.x, GAME_OVER_TEXT_POSTION.y);
		},

		_renderPaused: function() {
			let that = this,
				ctx = that.context;

			ctx.font = "20px Arial";
			ctx.fillStyle = "white";
			ctx.textAlign = "left";

			ctx.fillText("Paused", PAUSE_TEXT_POSITION.x, PAUSE_TEXT_POSITION.y);
		},

		_onKeyDown: function(e) {
			let that = this,
				code = e.code;

			if (code === "KeyS") {
				that.start();
			}

			if (code === "KeyP") {
				that.pause();
			}

			if (that.isGameOver || that.isPaused) {
				return;
			}

			if (code !== "ArrowLeft" && code !== "ArrowRight" && code !== "ArrowUp" && code !== "ArrowDown") {
				return;
			}

			that._invalidate(code);
		},

		_generateFood: function() {
			let that = this,
				positionOccupied = false;

			do {
				positionOccupied = false;

				let row = Math.floor(that._randomRange(0, HORIZONTAL_BLOCKS - 1)),
					col = Math.floor(that._randomRange(0, VERTICAL_BLOCKS - 1));

				if (that.food &&
						row === (that.food.x - SNAKE_BLOCK_OFFSET) / SNAKE_BLOCK_LENGTH &&
						col === (that.food.y - SNAKE_BLOCK_OFFSET) / SNAKE_BLOCK_LENGTH) {
					positionOccupied = true;
				}

				for (let i = 0; i < that.snakeBlocks.length; i++) {
					let snakeBlock = that.snakeBlocks[i],
						snakeBlockRow = (snakeBlock.x - SNAKE_BLOCK_OFFSET) / SNAKE_BLOCK_LENGTH,
						snakeBlockCol = (snakeBlock.y - SNAKE_BLOCK_OFFSET) / SNAKE_BLOCK_LENGTH;

					if (row === snakeBlockRow && col === snakeBlockCol) {
						positionOccupied = true;
						break;
					}
				}

				if (!positionOccupied) {
					return {
						x: SNAKE_BLOCK_OFFSET + row * SNAKE_BLOCK_LENGTH,
						y: SNAKE_BLOCK_OFFSET + col * SNAKE_BLOCK_LENGTH
					};
				}
			}
			while (positionOccupied)
		},

		_randomRange: function(min, max)
		{
			return ((Math.random()*(max - min)) + min);
		}
	};

	window.SnakeNamespace = window.SnakeNamespace || {};
	SnakeNamespace.Snake = Snake;
})();