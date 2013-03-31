(function($) {
	var Roulette = function(options) {
		var defaultSettings = {
			maxPlayCount : null, // null or x >= 0
			speed : 10, // x > 0
			stopImageNumber : 0, // x >= 0
			rollCount : 3, // x >= 0
			stopCallback : function() {
			},
			startCallback : function() {
			},
			slowDownCallback : function() {
			}
		}
		var defaultProperty = {
			playCount : 0,
			$rouletteTarget : null,
			imageCount : null,
			$images : null,
			totalHeight : null,
			topPosition : 0,

			maxDistance : null,
			slowDownStartDistance : null,

			isRunUp : true,
			isSlowdown : false,
			isStop : false,

			distance : 0,
			runUpDistance : null,
			isIE : navigator.userAgent.toLowerCase().indexOf('msie') > -1 // TODO
		};
		var p = $.extend({}, defaultSettings, options, defaultProperty);

		var reset = function() {
			p.maxDistance = defaultProperty.maxDistance;
			p.slowDownStartDistance = defaultProperty.slowDownStartDistance;
			p.distance = defaultProperty.distance;
			p.isRunUp = defaultProperty.isRunUp;
			p.isSlowdown = defaultProperty.isSlowdown;
			p.isStop = defaultProperty.isStop;
			p.slowDownStartDistance = p.rollCount ? p.rollCount * p.totalHeight : null;
			p.topPosition = defaultProperty.topPosition;
		}

		var slowDownSetup = function() {
			p.slowDownCallback();
			p.isSlowdown = true;
			p.slowDownStartDistance = p.distance;
			p.maxDistance = p.distance + (2*p.totalHeight);
			p.maxDistance += p.imageHeight - p.topPosition % p.imageHeight;
			if (p.stopImageNumber != null) {
				p.maxDistance += (p.totalHeight - (p.maxDistance % p.totalHeight) + (p.stopImageNumber * p.imageHeight))
						% p.totalHeight;
			}
		}

		// ルーレットを回転させる(一回転させるのではなく、1フレーム進める)
		var roll = function() {
			if (!p.isSlowdown && p.slowDownStartDistance && p.distance >= p.slowDownStartDistance) {
				slowDownSetup();
			}

			var speed_ = p.speed;

			if (p.isRunUp) {
				if (p.distance <= p.runUpDistance) {
					var rate_ = ~~((p.distance / p.runUpDistance) * p.speed);
					speed_ = rate_ + 1;
				} else {
					p.isRunUp = false;
				}

			} else if (p.isSlowdown) {
				var rate_ = ~~(((p.maxDistance - p.distance) / (p.maxDistance - p.slowDownStartDistance)) * (p.speed));
				speed_ = rate_ + 1;
			}

			if (p.maxDistance && p.distance >= p.maxDistance) {
				p.isStop = true;
				reset();
				p.stopCallback(p.$rouletteTarget.find('img').eq(p.stopImageNumber));
				return;
			}
			p.distance += speed_;
			p.topPosition += speed_;
			if (p.topPosition >= p.totalHeight) {
				p.topPosition = p.topPosition - p.totalHeight;
			}
			// TODO
			if (p.isIE) {
				p.$rouletteTarget.css('top', '-' + p.topPosition + 'px');
			} else {
				p.$rouletteTarget.css('transform', 'translate3d(0px, -' + p.topPosition + 'px, 0px)');
			}
			setTimeout(roll, 1);
		}

		var init = function($roulette) {
			$roulette.css({ 'overflow' : 'hidden' });
			if (!p.$images) {
				p.$images = $roulette.find('img').remove();
				p.imageCount = p.$images.length;
				p.$images.eq(0).load(function(){
					p.imageHeight = $(this).height();
					$roulette.css({ 'height' : (p.imageHeight + 'px') });
					p.totalHeight = p.imageCount * p.imageHeight;
					p.slowDownStartDistance = p.rollCount ? p.rollCount * p.totalHeight : null;
					p.runUpDistance = 2 * p.imageHeight;
				});
			}
			$roulette.find('div').remove();
			p.$images.css({
				'display' : 'block'
			});
			p.$rouletteTarget = $('<div>').css({
				'position' : 'relative',
				'top' : '0'
			}).attr('class',"roulette-inner");
			$roulette.append(p.$rouletteTarget);
			p.$rouletteTarget.append(p.$images);
			p.$rouletteTarget.append(p.$images.eq(0).clone());
			$roulette.show();
		}

		var start = function() {
			p.playCount++;
			if (p.maxPlayCount && p.playCount > p.maxPlayCount) {
				return;
			}
			p.startCallback();
			roll();
		}

		var stop = function(option) {
			if (!p.isSlowdown) {
				if (option) {
					var stopImageNumber = Number(option.stopImageNumber);
					if (0 <= stopImageNumber && stopImageNumber <= (p.imageCount - 1)) {
						p.stopImageNumber = option.stopImageNumber;
					}
				}
				slowDownSetup();
			}
		}

		var ret = {
			start : start,
			stop : stop,
			init : init
		}
		return ret;
	}

	var pluginName = 'roulette';
	$.fn[pluginName] = function(method, options) {
		return this.each(function() {
			var self = $(this);
			var roulette = self.data('plugin_' + pluginName);

			if (roulette) {
				if (roulette[method]) {
					roulette[method](options);
				} else {
					console && console.error('Method ' + method + ' does not exist on jQuery.roulette');
				}
			} else {
				roulette = new Roulette(method);
				roulette.init(self, method);
				$(this).data('plugin_' + pluginName, roulette);
			}
		});
	}
})(jQuery);
