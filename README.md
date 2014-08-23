at-splitter
===========

This AngularJS base UI Splitter control gives you a clean and convinent way to add a &lt;splitter&gt; control on a webpage. Easily add resizable areas and slides to your `float;` base UI panels. Splitter can be position horizontally or vertically, with maximum and minimum slidability option.

* [Demo 1](http://amant.github.io/at-splitter/demo-1/index.html)
* [Demo 2](http://amant.github.io/at-splitter/demo-2/index.html)

To use:
---------
&lt;splitter&gt; as element or classname

    <div id="container">
      <div class="panel-left"></div>
      <splitter orientation="vertical"></splitter>
      <div class="panel-right"></div>
      <div class="clear"></div>
    </div>

Attributes:
* min: %|px - Define minimum slidable value as pixel or percentage
* max: %|px - Define maximum slidable value as pixel or percentage
* orientation: horizontal|vertical - Define wheather splitter would be in horizontal or vertical position
* extraspace: #id of element, separated by `;` for multiple elements - Define elements which effect splitter but are outside of float; element's container. Since this splitter is designed for float base layouts, and coordinates of entire screen come into play. Most of time splitter's width/height selection would be effected by element's which are out of current float container. Adding id of those element will help splitter to add that extra width/height.
