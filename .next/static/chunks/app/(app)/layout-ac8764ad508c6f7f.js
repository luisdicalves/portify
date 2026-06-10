(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[814],{57876:function(e,t,r){Promise.resolve().then(r.bind(r,24822))},24822:function(e,t,r){"use strict";r.d(t,{BottomNav:function(){return f}});var n=r(57437),a=r(16463),l=r(78030);/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let o=(0,l.Z)("Home",[["path",{d:"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"y5dka4"}],["polyline",{points:"9 22 9 12 15 12 15 22",key:"e2us08"}]]),c=(0,l.Z)("BarChart2",[["line",{x1:"18",x2:"18",y1:"20",y2:"10",key:"1xfpm4"}],["line",{x1:"12",x2:"12",y1:"20",y2:"4",key:"be30l9"}],["line",{x1:"6",x2:"6",y1:"20",y2:"14",key:"1r4le6"}]]),s=(0,l.Z)("Sparkles",[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",key:"4pj2yx"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}],["path",{d:"M4 17v2",key:"vumght"}],["path",{d:"M5 18H3",key:"zchphs"}]]);var i=r(21902);/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let u=(0,l.Z)("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]),h=[{href:"/dashboard",Icon:o,label:"In\xedcio"},{href:"/portfolio",Icon:c,label:"Portf\xf3lio"},{href:"/para-ti",Icon:s,label:"Para ti"},{href:"/plano",Icon:i.Z,label:"Plano"},{href:"/perfil",Icon:u,label:"Perfil"}];function f(){let e=(0,a.useRouter)(),t=(0,a.usePathname)();return(0,n.jsx)("nav",{className:"bg-white border-t border-stone-200 flex pb-safe",children:h.map(r=>{let{href:a,Icon:l,label:o}=r,c=t.startsWith(a);return(0,n.jsxs)("button",{onClick:()=>e.push(a),className:"flex-1 flex flex-col items-center gap-[3px] pt-2 pb-3",children:[(0,n.jsx)(l,{size:22,strokeWidth:1.75,color:c?"#1D9E75":"#B4B2A9"}),(0,n.jsx)("span",{className:"text-[10px] ".concat(c?"text-brand-400 font-medium":"text-stone-400"),children:o})]},a)})})}},78030:function(e,t,r){"use strict";r.d(t,{Z:function(){return s}});var n=r(2265);/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let a=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),l=function(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];return t.filter((e,t,r)=>!!e&&r.indexOf(e)===t).join(" ")};/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var o={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let c=(0,n.forwardRef)((e,t)=>{let{color:r="currentColor",size:a=24,strokeWidth:c=2,absoluteStrokeWidth:s,className:i="",children:u,iconNode:h,...f}=e;return(0,n.createElement)("svg",{ref:t,...o,width:a,height:a,stroke:r,strokeWidth:s?24*Number(c)/Number(a):c,className:l("lucide",i),...f},[...h.map(e=>{let[t,r]=e;return(0,n.createElement)(t,r)}),...Array.isArray(u)?u:[u]])}),s=(e,t)=>{let r=(0,n.forwardRef)((r,o)=>{let{className:s,...i}=r;return(0,n.createElement)(c,{ref:o,iconNode:t,className:l("lucide-".concat(a(e)),s),...i})});return r.displayName="".concat(e),r}},21902:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});/**
 * @license lucide-react v0.383.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,r(78030).Z)("Target",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]])},16463:function(e,t,r){"use strict";var n=r(71169);r.o(n,"usePathname")&&r.d(t,{usePathname:function(){return n.usePathname}}),r.o(n,"useRouter")&&r.d(t,{useRouter:function(){return n.useRouter}})}},function(e){e.O(0,[971,23,744],function(){return e(e.s=57876)}),_N_E=e.O()}]);