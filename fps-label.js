(function() {
	function FPSLabel(config) {
		var that = this;

		that.context = config.context;
		that.position = config.position;

		that.oldTime = new Date();
		that.framesCounter = 0;
		that.fps = 0;
	}

	FPSLabel.prototype = {
		update: function() {
			var that = this,
				ctx = that.context,
				now = new Date(),
				diff = now.getTime() - that.oldTime.getTime();

			if (diff < 1000) {
				that.framesCounter++;
			} else {
				that.fps = that.framesCounter;
				that.framesCounter = 0;
				that.oldTime = new Date();
			}
		},

		render: function() {
			var that = this,
				ctx = that.context;

			ctx.font = "14px Arial";
			ctx.fillStyle = "white";
			ctx.textAlign = "left";
			ctx.fillText("fps: " + that.fps, that.position.x, that.position.y);
		}
	};

	window.SnakeNamespace = window.SnakeNamespace || {};
	SnakeNamespace.FPSLabel = FPSLabel;
})();