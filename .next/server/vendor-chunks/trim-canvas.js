/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/trim-canvas";
exports.ids = ["vendor-chunks/trim-canvas"];
exports.modules = {

/***/ "(ssr)/./node_modules/trim-canvas/build/index.js":
/*!*************************************************!*\
  !*** ./node_modules/trim-canvas/build/index.js ***!
  \*************************************************/
/***/ (function(module) {

eval("!function(e,t){ true?module.exports=t():0}(this,function(){return function(e){function t(n){if(r[n])return r[n].exports;var o=r[n]={exports:{},id:n,loaded:!1};return e[n].call(o.exports,o,o.exports,t),o.loaded=!0,o.exports}var r={};return t.m=e,t.c=r,t.p=\"\",t(0)}([function(e,t){\"use strict\";function r(e){var t=e.getContext(\"2d\"),r=e.width,n=e.height,o=t.getImageData(0,0,r,n).data,f=a(!0,r,n,o),i=a(!1,r,n,o),c=u(!0,r,n,o),d=u(!1,r,n,o),p=d-c+1,l=i-f+1,s=t.getImageData(c,f,p,l);return e.width=p,e.height=l,t.clearRect(0,0,p,l),t.putImageData(s,0,0),e}function n(e,t,r,n){return{red:n[4*(r*t+e)],green:n[4*(r*t+e)+1],blue:n[4*(r*t+e)+2],alpha:n[4*(r*t+e)+3]}}function o(e,t,r,o){return n(e,t,r,o).alpha}function a(e,t,r,n){for(var a=e?1:-1,u=e?0:r-1,f=u;e?f<r:f>-1;f+=a)for(var i=0;i<t;i++)if(o(i,f,t,n))return f;return null}function u(e,t,r,n){for(var a=e?1:-1,u=e?0:t-1,f=u;e?f<t:f>-1;f+=a)for(var i=0;i<r;i++)if(o(f,i,t,n))return f;return null}Object.defineProperty(t,\"__esModule\",{value:!0}),t.default=r}])});//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvdHJpbS1jYW52YXMvYnVpbGQvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQUEsZUFBZSxLQUFpRCxvQkFBb0IsQ0FBbUgsQ0FBQyxpQkFBaUIsbUJBQW1CLGNBQWMsNEJBQTRCLFlBQVksVUFBVSxpQkFBaUIsZ0VBQWdFLFNBQVMsK0JBQStCLGdCQUFnQixhQUFhLGNBQWMsK0tBQStLLHlFQUF5RSxvQkFBb0IsT0FBTyxnRkFBZ0Ysb0JBQW9CLHdCQUF3QixvQkFBb0IsK0JBQStCLFdBQVcsaUJBQWlCLElBQUksMkJBQTJCLFlBQVksb0JBQW9CLCtCQUErQixXQUFXLGlCQUFpQixJQUFJLDJCQUEyQixZQUFZLHNDQUFzQyxTQUFTLGNBQWMsR0FBRyIsInNvdXJjZXMiOlsid2VicGFjazovL2ludm9pZnkvLi9ub2RlX21vZHVsZXMvdHJpbS1jYW52YXMvYnVpbGQvaW5kZXguanM/MmEwNCJdLCJzb3VyY2VzQ29udGVudCI6WyIhZnVuY3Rpb24oZSx0KXtcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cyYmXCJvYmplY3RcIj09dHlwZW9mIG1vZHVsZT9tb2R1bGUuZXhwb3J0cz10KCk6XCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kP2RlZmluZShbXSx0KTpcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cz9leHBvcnRzLnRyaW1DYW52YXM9dCgpOmUudHJpbUNhbnZhcz10KCl9KHRoaXMsZnVuY3Rpb24oKXtyZXR1cm4gZnVuY3Rpb24oZSl7ZnVuY3Rpb24gdChuKXtpZihyW25dKXJldHVybiByW25dLmV4cG9ydHM7dmFyIG89cltuXT17ZXhwb3J0czp7fSxpZDpuLGxvYWRlZDohMX07cmV0dXJuIGVbbl0uY2FsbChvLmV4cG9ydHMsbyxvLmV4cG9ydHMsdCksby5sb2FkZWQ9ITAsby5leHBvcnRzfXZhciByPXt9O3JldHVybiB0Lm09ZSx0LmM9cix0LnA9XCJcIix0KDApfShbZnVuY3Rpb24oZSx0KXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKGUpe3ZhciB0PWUuZ2V0Q29udGV4dChcIjJkXCIpLHI9ZS53aWR0aCxuPWUuaGVpZ2h0LG89dC5nZXRJbWFnZURhdGEoMCwwLHIsbikuZGF0YSxmPWEoITAscixuLG8pLGk9YSghMSxyLG4sbyksYz11KCEwLHIsbixvKSxkPXUoITEscixuLG8pLHA9ZC1jKzEsbD1pLWYrMSxzPXQuZ2V0SW1hZ2VEYXRhKGMsZixwLGwpO3JldHVybiBlLndpZHRoPXAsZS5oZWlnaHQ9bCx0LmNsZWFyUmVjdCgwLDAscCxsKSx0LnB1dEltYWdlRGF0YShzLDAsMCksZX1mdW5jdGlvbiBuKGUsdCxyLG4pe3JldHVybntyZWQ6bls0KihyKnQrZSldLGdyZWVuOm5bNCoocip0K2UpKzFdLGJsdWU6bls0KihyKnQrZSkrMl0sYWxwaGE6bls0KihyKnQrZSkrM119fWZ1bmN0aW9uIG8oZSx0LHIsbyl7cmV0dXJuIG4oZSx0LHIsbykuYWxwaGF9ZnVuY3Rpb24gYShlLHQscixuKXtmb3IodmFyIGE9ZT8xOi0xLHU9ZT8wOnItMSxmPXU7ZT9mPHI6Zj4tMTtmKz1hKWZvcih2YXIgaT0wO2k8dDtpKyspaWYobyhpLGYsdCxuKSlyZXR1cm4gZjtyZXR1cm4gbnVsbH1mdW5jdGlvbiB1KGUsdCxyLG4pe2Zvcih2YXIgYT1lPzE6LTEsdT1lPzA6dC0xLGY9dTtlP2Y8dDpmPi0xO2YrPWEpZm9yKHZhciBpPTA7aTxyO2krKylpZihvKGYsaSx0LG4pKXJldHVybiBmO3JldHVybiBudWxsfU9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0LFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pLHQuZGVmYXVsdD1yfV0pfSk7Il0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/trim-canvas/build/index.js\n");

/***/ })

};
;