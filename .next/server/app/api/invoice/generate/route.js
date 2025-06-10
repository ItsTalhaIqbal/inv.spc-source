"use strict";(()=>{var e={};e.id=291,e.ids=[291],e.modules={11185:e=>{e.exports=require("mongoose")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78018:e=>{e.exports=require("puppeteer")},57147:e=>{e.exports=require("fs")},71017:e=>{e.exports=require("path")},60829:(e,t,a)=>{a.r(t),a.d(t,{headerHooks:()=>b,originalPathname:()=>f,requestAsyncStorage:()=>x,routeModule:()=>u,serverHooks:()=>h,staticGenerationAsyncStorage:()=>g,staticGenerationBailout:()=>y});var i={};a.r(i),a.d(i,{POST:()=>POST}),a(78976);var o=a(10884),s=a(16132),r=a(95798),n=a(60171),l=a(8590),p=a(57147),d=a.n(p),c=a(71017),m=a.n(c);async function generatePdfService(e){let t,i;try{let o,s;if(await (0,l.v)(),!e.details?.invoiceNumber)throw Error("Invoice number is missing");if("number"!=typeof e.details?.pdfTemplate)throw Error(`PDF template must be a number, received: ${e.details.pdfTemplate}`);let r=e.sender||{},p=e.receiver||{},c=e.details||{},formatNumberWithCommas=e=>e.toString().replace(/\B(?=(\d{3})+(?!\d))/g,","),u=(e.details?.items||[]).map((e,t)=>`
          <tr style="border: 1px solid #000;">
            <td style="padding: 12px 16px; width: 5%; border: 1px solid #000; color: #000; font-size: 14px;">${t+1}</td>
            <td style="padding: 12px 16px; width: 50%; border: 1px solid #000; color: #000; font-size: 14px;">${e.name||""}</td>
            <td style="padding: 12px 16px; width: 15%; border: 1px solid #000; color: #000; font-size: 14px;">${e.quantity||""}</td>
            <td style="padding: 12px 16px; width: 15%; border: 1px solid #000; color: #000; font-size: 14px;">${e.unitPrice?`${e.unitPrice} `:""}</td>
            <td style="padding: 12px 16px; width: 15%; text-align: right; border: 1px solid #000; color: #000; font-size: 14px;">${e.quantity&&e.unitPrice?`${e.quantity*e.unitPrice} `:""}</td>
          </tr>
        `).join(""),x=m().resolve(process.cwd(),"public/assets/img/image.jpg");try{let e=d().readFileSync(x);o=`data:image/jpeg;base64,${e.toString("base64")}`}catch(e){o=""}try{let e=await fetch(n.db);s=await e.text()}catch(e){s=""}let g=c.taxDetails||{amount:0,amountType:"amount"},h=c.discountDetails||{amount:0,amountType:"amount"},b=c.shippingDetails||{cost:0,costType:"amount"},y=g.amount&&g.amount>0,f=h.amount&&h.amount>0,v=b.cost&&b.cost>0,w=y?`
        <p class="text-base font-bold text-gray-800">Tax (${"amount"===g.amountType?"AED":"%"})</p>
        <p class="text-base text-gray-800">${formatNumberWithCommas(Number(g.amount))} ${"amount"===g.amountType?"AED":""}</p>
      `:"",$=f?`
        <p class="text-base font-bold text-gray-800">Discount (${"amount"===h.amountType?"AED":"%"})</p>
        <p class="text-base text-gray-800">${formatNumberWithCommas(Number(h.amount))} ${"amount"===h.amountType?"AED":""}</p>
      `:"",T=v?`
        <p class="text-base font-bold text-gray-800">Shipping (${"amount"===b.costType?"AED":"%"})</p>
        <p class="text-base text-gray-800">${formatNumberWithCommas(Number(b.cost))} ${"amount"===b.costType?"AED":""}</p>
      `:"",P=`
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            ${s}
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              height: 100vh;
              box-sizing: border-box;
              position: relative;
              min-height: 842px;
            }
            .text-right { text-align: right; }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-top: -10px;
            }
            .logo {
              margin: 0;
              padding: 0;
              line-height: 0;
            }
            .invoice-details {
              margin: 0;
              padding: 0;
              text-align: right;
              margin-top: 20px;
            }
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .invoice-table thead tr {
              background-color: #d3d3d3;
            }
            .invoice-table th {
              padding: 12px 16px;
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
              color: #000;
              text-align: left;
              border: 1px solid #000;
            }
            .invoice-table th:last-child {
              text-align: right;
            }
            .invoice-table td {
              padding: 12px 16px;
              color: #000;
              font-size: 14px;
            }
            .summary {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
            }
            .footer {
              position: absolute;
              bottom: 40px;
              width: calc(100% - 40px);
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            .footer-bar {
              background-color: #fb923c;
              color: black;
              padding: 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <img src="${o}" width="140" height="100" alt="SPC Source Logo" style="vertical-align: top;" />
            </div>
            <div class="invoice-details">
              <p class="text-base text-gray-800">${r.phone||""}</p>
              <p class="text-base text-gray-800">${r.address||""}</p>
              <h2 class="text-xl font-bold text-gray-800 mt-2">${c.invoiceNumber.includes("INV")?"INVOICE# ":"QUOATION# "} <span class="text-lg text-gray-600 font-thin">${c.invoiceNumber||""}</span> </h2>
              <p class="text-base text-gray-800">${new Date(c.invoiceDate||new Date).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"2-digit",weekday:"long"})}</p>
            </div>
          </div>

          <div class="mt-6">
            <h3 class="text-base font-bold text-gray-800">CUSTOMER INFO</h3>
            <h3 class="text-xl text-gray-800">${p.name||""}</h3>
            <h3 class="text-lg text-gray-800">${p.address||""}</h3>
          </div>

          <div class="mt-4">
            <h3 class="text-base font-bold text-gray-800">ITEMS</h3>
            <table class="invoice-table">
              <thead>
                <tr>
                  <th style="width: 5%;">Sr.</th>
                  <th style="width: 50%;">Product</th>
                  <th style="width: 15%;">Qty</th>
                  <th style="width: 15%;">Unit Price</th>
                  <th style="width: 15%;">Amount (AED)</th>
                </tr>
              </thead>
              <tbody>
                ${u}
              </tbody>
            </table>
          </div>

          <div class="summary">
            <p class="text-base text-gray-800">Received above items in good condition</p>
            <div class="text-right">
              ${w}
              ${$}
              ${T}
              <p class="text-base font-bold text-gray-800">Total ${formatNumberWithCommas(Number(c.totalAmount||0))} AED</p>
            </div>
          </div>

          <div class="footer">
            <div class="flex justify-between">
              <p class="text-base font-bold text-gray-800">Receiver's Sign _________________</p>
              <p class="text-base font-bold text-gray-800">for ${r.name||""}</p>
            </div>
            <div class="footer-bar">
              <div class="flex items-center">
                <span class="mr-2 text-base">📧</span>
                <span class="text-base">${r.email||""}</span>
              </div>
              <div class="flex items-center">
                <span class="mr-2 text-base">🌐</span>
                <span class="text-base">www.spcsource.com</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,_=await Promise.resolve().then(a.t.bind(a,78018,23)),S=0;for(;S<3;)try{if(!(t=await _.launch({args:["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage"],headless:!0})))throw Error("Failed to launch browser");break}catch(e){if(3==++S)throw Error("Failed to launch browser after 3 attempts");await new Promise(e=>setTimeout(e,1e3*S))}i=await t?.newPage(),await i?.setContent(P,{waitUntil:["networkidle0","load","domcontentloaded"],timeout:6e4}),await new Promise(e=>setTimeout(e,1e3)),await i?.screenshot({path:"debug-screenshot.png",fullPage:!0});let D=await i?.pdf({format:"a4",printBackground:!0,preferCSSPageSize:!0,margin:{top:"20px",right:"20px",bottom:"20px",left:"20px"}});return D}catch(e){throw e}finally{if(i&&await i.close(),t){let e=await t.pages();await Promise.all(e.map(e=>e.close())),await t.close()}}}async function POST(e){try{let t=await e.json();if("string"==typeof t.details.pdfTemplate&&(t.details.pdfTemplate=Number(t.details.pdfTemplate)),!t.details?.invoiceNumber)return new r.Z(JSON.stringify({error:"Invoice number is required"}),{status:400,headers:{"Content-Type":"application/json"}});if("number"!=typeof t.details?.pdfTemplate)return new r.Z(JSON.stringify({error:"PDF template must be a number"}),{status:400,headers:{"Content-Type":"application/json"}});let a=await generatePdfService(t);if(!a||0===a.length)return new r.Z(JSON.stringify({error:"Failed to generate PDF"}),{status:500,headers:{"Content-Type":"application/json"}});return new r.Z(new Blob([a],{type:"application/pdf"}),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename=invoice_${t.details.invoiceNumber}.pdf`,"Cache-Control":"no-cache"},status:200})}catch(e){return console.error("Error generating PDF:",e.message),new r.Z(JSON.stringify({error:"Failed to generate PDF",details:e.message}),{status:500,headers:{"Content-Type":"application/json"}})}}let u=new o.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/invoice/generate/route",pathname:"/api/invoice/generate",filename:"route",bundlePath:"app/api/invoice/generate/route"},resolvedPagePath:"C:\\Users\\Hammad\\Desktop\\checks\\Invoice_app\\app\\api\\invoice\\generate\\route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:x,staticGenerationAsyncStorage:g,serverHooks:h,headerHooks:b,staticGenerationBailout:y}=u,f="/api/invoice/generate/route"}};var t=require("../../../../webpack-runtime.js");t.C(e);var __webpack_exec__=e=>t(t.s=e),a=t.X(0,[4961,4933,171,8590],()=>__webpack_exec__(60829));module.exports=a})();