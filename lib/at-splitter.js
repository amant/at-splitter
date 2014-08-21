// polyfills
// requestAnimationFrame
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

 // splitter module
(function(win) {
    'use strict';
    angular.module('at-splitter', [])
        .directive('splitter', ['$timeout', function($timeout) {
        function linkFn(scope, el, attrs) {
            var pEl = el.parent(),
                opts = {
                    'mouseMoveDelta': 10,
                    'debug': true,
                    'min': '0%',                   // %|px
                    'max': '100%',                 // %|px
                    'orientation': 'hotizontal',   // horizontal|vertical
                    'panel-after': null,           // id of previousNode()
                    'panel-before': null,          // id of nextNode()
                    'icon': null,                  // left|right|up|down
                    'orgNode': {
                        'pEl': null,
                        'before': null,
                        'after': null
                    },
                    'extraspace': null,
                    'namespace': 'at-splitter'
                };

            // initialize options and variables
            construct();

            // initialize options
            setupPanel();

            // set splitter within it's container
            setupSplitter();

            // add listeners for splitter
            setupListeners();


            // result of splitbar, manipulate dom
            function draw(size) {
                var diff = parentContainerDiff();
                if (opts['panel-before'].prev().length > 0 && diff > 0) {
                    size -= diff;
                }

                // nodes which effect splitter but are outside of container element
                if (opts['extraspace']) {
                    var extraspace = 0;
                    opts['extraspace'].forEach(function(el) {
                        extraspace += $(el)[0].getBoundingClientRect()[opts.size];
                    });

                    opts['debug'] && console.log('extraspace', extraspace);
                    size -= extraspace;
                }

                opts.panelAfterSize = opts.containerSize - size;
                opts.panelBeforeSize = size;

                drawSplitter();

                el.trigger(opts['namespace'] + '-neighbour-resized');

                // enable new animation frame
                opts.aniFmReq = null;
            }

            // capture mouse coordinate
            function splitterResize(evt) {
                if (opts.aniFmReq) {
                    win.cancelAnimationFrame(opts.aniFmReq);
                }

                var coord = isVertical() ? evt.clientX : evt.clientY;
                coord -= opts['mouseMoveDelta'];

                opts['debug'] && console.log('mouse coord', coord, opts['resizeMax'], opts['resizeMin']);

                if (coord <= opts['resizeMax'] && coord >= opts['resizeMin']) {
                    opts.aniFmReq = win.requestAnimationFrame(function() { draw(coord); });
                }
            }

            function parentContainerDiff() {
                return pEl[0].getBoundingClientRect()[opts.size] - opts.containerSize;
            }

            // set min, max value for splitbar
            function setMinMaxResize() {
                opts['resizeMax'] = opts.max.substr(-1) === '%' ? ((win.parseInt(opts['max']) / 100) * opts.containerSize) : win.parseInt(opts['max']);
                opts['resizeMin'] = opts.min.substr(-1) === '%' ? ((win.parseInt(opts['min']) / 100) * opts.containerSize) : win.parseInt(opts['min']);

                var diff = parentContainerDiff();
                if (opts['panel-before'].prev().length > 0 && diff > 0) {
                    opts.resizeMax += diff;
                    opts.resizeMin += diff;
                }
            }

            // set splitbar node's parent node size
            function setContainerSize(size) {
                opts.containerSize = size;
                setMinMaxResize();
            }

            // On window resize event after adjusting size of left and right nodes of splitter,
            // container size increases too. Not sure why? This code to check that extra increment.
            function adjustPanelAfterWindowResize() {
                var panelBeforeSize = opts['panel-before'][0].getBoundingClientRect()[opts.size],
                    panelAfterSize = opts['panel-after'][0].getBoundingClientRect()[opts.size],
                    newContainer = (panelBeforeSize + panelAfterSize);

                // adjustment needed if new container size is greater than one in memory
                if (newContainer > opts.containerSize) {
                    opts.panelAfterSize += newContainer - opts.containerSize;
                    opts['panel-after'].css(opts.size, opts.panelAfterSize + 'px');

                    opts.debug && console.log('container re-adjustment, new next node', opts.panelAfterSize);
                    setContainerSize(newContainer);
                }
            }

            function isVertical() {
                return opts.orientation === 'vertical';
            }

            function isHorizontal() {
                opts.orientation === 'horizontal';
            }

            // initialize variable and options
            function construct() {
                // merge attribute value to options
                opts = angular.extend(opts, (function() {
                    var options = {};
                    for (var k in attrs.$attr) {
                        options[k] = attrs[k];
                    }
                    return options;
                }()));

                // effect height or width of panels, depending on the orientation of splitter
                opts['size'] = (isVertical() ? 'width' : 'height');

                // set nodes
                opts['panel-before'] = $(opts['panel-before'] || el.prev());
                opts['panel-after'] = $(opts['panel-after'] || el.next());

                // save original style attribute for these nodes, which splitter will change
                (pEl.attr(opts['namespace']) !== opts['namespace']) && (opts['orgNode']['pEl'] = pEl.attr('style'));
                (opts['panel-before'].attr(opts['namespace']) !== opts['namespace']) && (opts['orgNode']['before'] = opts['panel-before'].attr('style'));
                (opts['panel-before'].attr(opts['namespace']) !== opts['namespace']) && (opts['orgNode']['after']= opts['panel-after'].attr('style'));
                
                console.log(opts.orgNode.pEl);

                // additonal panel height/width influencer which are outside ot current container's scope
                if (opts['extraspace']) {
                    opts['extraspace'] = opts['extraspace'].split(';');
                }
            }

            // setup after/before panels, calculate container and parent container
            function setupPanel() {
                // calculate client rect
                opts['panel-before']['clientRect'] = opts['panel-before'][0].getBoundingClientRect();
                opts['panel-after']['clientRect'] = opts['panel-after'][0].getBoundingClientRect();
                pEl['clientRect'] = pEl[0].getBoundingClientRect();

                // calculate width/height value of prev, and next sibling node
                opts.panelBeforeSize = opts['panel-before']['clientRect'][opts.size];
                opts.panelAfterSize = opts['panel-after']['clientRect'][opts.size];

                opts.elSize = el[0].getBoundingClientRect()[opts.size];

                // total width or height for splitter's container node
                setContainerSize(opts.panelBeforeSize + opts.panelAfterSize);

                // parent element
                pEl.css(opts.size, pEl['clientRect'][opts.size])
                    .attr(opts['namespace'], opts['namespace']);
            }

            // adjust the initial position of splitter within it's container
            function setupSplitter() {
                // adjust splitter within next sibling node's width|height
                opts.panelAfterSize = opts.containerSize - opts.panelBeforeSize - opts.elSize;

                drawSplitter();

                // On window resize event after adjusting size of left and right nodes of splitter,
                // container size increases too. Not sure why? This code to check that extra increment.
                adjustPanelAfterWindowResize();
            }

            function drawSplitter() {
                opts['panel-before'].css(opts.size, opts.panelBeforeSize + 'px')
                    .attr(opts['namespace'], opts['namespace']);
                opts['panel-after'].css(opts.size, opts.panelAfterSize + 'px')
                    .attr(opts['namespace'], opts['namespace']);

                 // calculate client rect
                opts['panel-before']['clientRect'] = opts['panel-before'][0].getBoundingClientRect();
                opts['panel-after']['clientRect'] = opts['panel-after'][0].getBoundingClientRect();

                // set css for splitter and before/after panel
                if (isVertical()) {
                    el.css({
                        'left': opts['panel-before']['clientRect']['right'] + 'px',
                        'height': (Math.max(opts['panel-before']['clientRect']['height'], opts['panel-after']['clientRect']['height'])
                                        || win.parseInt(pEl.css('height'))) + 'px'
                    });
                } else {
                    el.css({
                        'top': opts['panel-before']['clientRect']['bottom'] + 'px',
                        'width': (Math.max(opts['panel-before']['clientRect']['width'], opts['panel-after']['clientRect']['width'])
                                        || win.parseInt(pEl.css('width'))) + 'px'
                    });
                }
            }

            // setup all the event handlers
            function setupListeners() {
                // handle mouse down and mouse move
                el.on('mousedown touchstart', handleMouseDown);

                // handle mouse up
                pEl.on('mouseup touchend', handleMouseUp);

                // handle window resize
                $(win).resize(handleWindowResize);

                $('body').on(opts['namespace'] + '-neighbour-resized', function(e) {
                    if (e.target !== el[0]) {
                        handleNeighbourSplitter();
                    }
                });

                // destory, cleanup listeners
                scope.$on('$destroy', function() {
                    el.off('mousedown touchstart', handleMouseDown);
                    pEl.off('mouseup touchend', handleMouseUp);
                    $(win).off('resize', handleWindowResize);
                });
            }

            function handleMouseDown(e) {
                e.preventDefault();
                e.stopPropagation();

                el.addClass(opts['namespace'] + '-active');

                var cursor = opts.orientation === 'vertical' ? 'col-resize' : 'row-resize';
                pEl.css('cursor', cursor)
                    .on('mousemove touchmove', splitterResize);

                return false;
            }

            function handleMouseUp(e) {
                el.removeClass(opts['namespace'] + '-active');

                pEl.off('mousemove touchmove', splitterResize)
                    .css('cursor', 'auto');
            }

            function handleWindowResize(e) {
                // reset elements, let browser do layout calculate
                if (isVertical()) {
                    pEl.css('width', '');
                    el.css({'left': '', 'height': ''});
                } else {
                    pEl.css('height', '');
                    el.css({'top': '', 'width': ''});
                }

                opts['panel-before'].css(opts.size, '');
                opts['panel-after'].css(opts.size, '');

                // reset to original style values
                opts.orgNode.pEl && pEl.attr('style', opts.orgNode.pEl);
                opts.orgNode.before && opts['panel-before'].attr('style', opts.orgNode.before);
                opts.orgNode.after && opts['panel-after'].attr('style', opts.orgNode.after);
                el.css('display', 'none');
                
                setTimeout(function() {
                    setupPanel();
                    setupSplitter();
                    el.css('display', 'block');
                }, 4);
            }

            function handleNeighbourSplitter() {
                // calculate before and after panel size in terms of percentage before resize
                var oldBeforeSize = Math.ceil((opts.panelBeforeSize * 100) / opts.containerSize);

                // calculate new container
                opts['panel-before']['clientRect'] = opts['panel-before'][0].getBoundingClientRect();
                opts['panel-after']['clientRect'] = opts['panel-after'][0].getBoundingClientRect();
                opts.panelBeforeSize = opts['panel-before']['clientRect'][opts.size];
                opts.panelAfterSize = opts['panel-after']['clientRect'][opts.size];
                setContainerSize(opts.panelBeforeSize + opts.panelAfterSize);

                // convert back percentage to exact pixel value;
                opts.panelBeforeSize = Math.ceil((oldBeforeSize / 100) * opts.containerSize);
                opts.panelAfterSize = opts.containerSize - opts.panelBeforeSize;

                if ( isVertical() ) {
                    el.css('height', win.parseInt(pEl.css('height')) + 'px');
                } else {
                    el.css('width', win.parseInt(pEl.css('width')) + 'px');
                }

                // splitter bar should not move panels to lower row of display block
                if (opts['debug'] && (opts['panel-before'][0].getBoundingClientRect()['left'] > opts['panel-after'][0].getBoundingClientRect()['right'])) {
                    console.log('error splitter bar spill the panels to other display block');
                }
            }
        }

        return {
            restrict: 'EA',
            replace: true,
            scope: {
                orientation: '@orientation'
            },
            template: '<div class="at-splitter-{{orientation}}"><div class="at-splitter-icon">&nbsp;</div></div>',
            link: function(scope, el, attrs) {
                // delay until DOM is ready for manipulation
                $timeout(function() {
                    linkFn(scope, el, attrs);
                }, 0);
            }
        }
    }]);
}(window));
