import{ac as X,Q as a,a9 as Z,J as t,M as S,f as z,p as M,t as ee,U as te,a1 as re,s as ne,j as oe,w as ie,a6 as ae}from"./index-DTYhUOS9.js";import{a as se,b as g,E as de,e as y}from"./entryOptions-baGAdqSx.js";import{n as w}from"./requestKey-BzYOVLlP.js";import{b as ce}from"./notify-B8Q6zQpC.js";import{f as le,d as me,a as pe}from"./salePricing-BptXUCyB.js";import{a as E,p as A}from"./saleReceipt-CvHFPnzH.js";import{D as U}from"./dollar-sign-MVafH8-_.js";import{C as ge}from"./calculator-OkmnYxpE.js";import{F as ue}from"./file-text-Bl595u1I.js";const I=re;function fe(e){return e==="cash"?"cash":e==="card"?"card":e==="mpesa"||e==="bank"?"transfer":"other"}async function he(e){return(e.headers.get("content-type")||"").includes("application/json")?e.json():{__nonJson:!0,text:await e.text()}}function ke(){const{t:e}=X(),[m,u]=a.useState(!1),f=a.useRef(!1),h=a.useRef(w()),[s,P]=a.useState(null),[i,T]=a.useState(null),[D,j]=a.useState(!0),O=a.useRef(null),{user:q}=Z(),[r,c]=a.useState({amount:"",amountInFC:"",source:"",category:"",paymentMethod:"cash",description:"",receivedFromName:"",receivedFromPhone:"",receivedFromEmail:"",currencyMode:"fc"}),[N,$]=a.useState(null),[F,k]=a.useState(null),L=se,_=de,b=n=>n.enteredCurrency==="FC"?`${n.enteredAmount.toLocaleString(M())} FC`:`$${n.enteredAmount.toFixed(2)}`,C=n=>e(`entryOptions.payment.${n.paymentMethod}`,{defaultValue:n.paymentMethod}).toUpperCase(),B=async()=>{try{j(!0);const n=await fetch(`${I}/exchange-rates/current`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(n.ok){const o=await n.json();T(o)}else console.warn("Failed to load exchange rate")}catch(n){console.error("Error loading exchange rate:",n)}finally{j(!1)}};a.useEffect(()=>{B()},[]),a.useEffect(()=>{if(r.currencyMode==="fc"&&r.amountInFC&&i){const o=(parseFloat(r.amountInFC)||0)/i.rate;c(d=>({...d,amount:o.toFixed(2)}))}},[r.amountInFC,r.currencyMode,i]),a.useEffect(()=>{if(r.currencyMode==="usd"&&r.amount&&i){const o=(parseFloat(r.amount)||0)*i.rate;c(d=>({...d,amountInFC:Math.round(o).toString()}))}},[r.amount,r.currencyMode,i]);const p=parseFloat(r.amount)>0&&r.source.trim()!==""&&r.category.trim()!==""&&r.receivedFromName.trim()!==""&&r.receivedFromPhone.trim()!=="";function l(n){c(o=>({...o,[n.target.name]:n.target.value}))}const J=()=>{c(n=>({...n,currencyMode:n.currencyMode==="usd"?"fc":"usd",amount:"",amountInFC:""}))};function K(){const n=localStorage.getItem("token")||"";return n?{Authorization:`Bearer ${n}`}:{}}const G=()=>{const n=window.open("","_blank","width=320,height=600");if(n&&s){const o=E(s);n.document.write(`
<html>
  <head>
    <title>${e("entryReceipt.title")}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body { 
        font-family: 'Courier New', Courier, monospace; 
        margin: 0; 
        padding: 0; 
        font-size: 13px;
        font-weight: bold;
        line-height: 1.1;
        width: 72mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        display: flex;
        justify-content: center;
      }
      .receipt-container { 
        width: 70mm;
        margin: 0 auto;
        padding: 0.5mm;
        border: none;
        text-align: center;
      }
      .header { 
        text-align: center; 
        margin-bottom: 1mm; 
        padding-bottom: 1mm;
        border-bottom: 2px double #000;
      }
      .shop-name {
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 0.5mm;
        text-transform: uppercase;
      }
      .shop-details {
        font-size: 11px;
        margin-bottom: 0.3mm;
        line-height: 1;
        font-weight: bold;
      }
      .receipt-info {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
      }
      .receipt-title {
        font-size: 13px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm;
        border-radius: 2px;
      }
      .entry-badge {
        background-color: #000;
        color: white;
        padding: 2mm;
        font-weight: bold;
        text-align: center;
        margin: 1mm 0;
        font-size: 14px;
        border-radius: 3px;
      }
      .details-section {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .detail-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .detail-label {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .detail-value {
        text-align: right;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .amount-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .amount-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.3mm;
        font-size: 13px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 13px;
        color: #000;
      }
      .footer { 
        text-align: center; 
        margin-top: 1mm; 
        font-size: 11px;
        font-weight: bold;
        padding: 1mm;
        background-color: #f8f8f8;
        border-top: 1px dashed #000;
      }
      .agent-info {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 2px;
      }
      .sender-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .sender-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
      }
      .separator {
        border-top: 1px dashed #000;
        margin: 1mm 0;
      }
      .cut-line {
        text-align: center;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 11px;
        color: #000;
        letter-spacing: 1px;
      }
      .thank-you {
        font-weight: bold;
        margin: 0.5mm 0;
        font-size: 12px;
      }
      .warning {
        font-size: 10px;
        color: #000;
        margin: 0.3mm 0;
        font-weight: bold;
      }
      .description {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f5f5f5;
        border-left: 3px solid #ccc;
        font-size: 11px;
        font-weight: bold;
        border-radius: 2px;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
        margin: 1mm 0;
      }
      @media print {
        @page {
          margin: 0 !important;
          size: 72mm auto !important;
        }
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 72mm !important;
          font-size: 13px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          overflow: hidden !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: flex !important;
          justify-content: center !important;
        }
        .receipt-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 0.5mm !important;
          width: 70mm !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
        }
        .cut-line {
          page-break-after: always !important;
          margin-bottom: 0 !important;
        }
        body::after,
        body::before {
          display: none !important;
          content: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="header">
        <div class="shop-name"><strong>${o.shopName}</strong></div>
        <div class="shop-details"><strong>${o.shopAddress}</strong></div>
        <div class="shop-details">${e("receipt.tel")}: <strong>${o.shopNumber}</strong></div>
        <div class="shop-details"><strong>${o.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">${e("receipt.date")}: <strong>${o.date}</strong></div>
        <div class="shop-details">${e("receipt.receiptNo")}: <strong>${o.receiptNumber}</strong></div>
      </div>
      
      <div class="entry-badge">
        <strong>${e("entryReceipt.confirmed")}</strong>
      </div>
      
      <div class="sender-info">
        <div class="sender-field">${e("receipt.receivedFrom")}: <strong>${o.receivedFrom.name.toUpperCase()}</strong></div>
        <div class="sender-field">${e("receipt.phone")}: <strong>${o.receivedFrom.phone}</strong></div>
        ${o.receivedFrom.email?`<div class="sender-field">${e("receipt.email")}: <strong>${o.receivedFrom.email}</strong></div>`:""}
      </div>
      
      ${o.description?`
        <div class="description">
          <strong>${e("receipt.description")}:</strong> <strong>${o.description}</strong>
        </div>
      `:""}
      
      <div class="receipt-title">${e("entryReceipt.details")}</div>
      
      <div class="details-section">
        <div class="detail-row">
          <div class="detail-label"><strong>${e("receipt.source")}:</strong></div>
          <div class="detail-value"><strong>${g(o.source)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${e("receipt.category")}:</strong></div>
          <div class="detail-value"><strong>${y(o.category)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${e("receipt.paymentMethod")}:</strong></div>
          <div class="detail-value"><strong>${C(s)}</strong></div>
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-row">
          <div><strong>${e("receipt.amountReceived")}:</strong></div>
          <div><strong>${b(s)}</strong></div>
        </div>
        ${o.enteredCurrency==="FC"?`<div class="amount-row">
                 <div><strong>${e("entryReceipt.usdEquivalent")}:</strong></div>
                 <div><strong>$${o.amountUSD.toFixed(2)}</strong></div>
               </div>`:""}
      </div>
      
      <div class="agent-info">
        ${e("receipt.recordedBy")}: <strong>${o.agent.toUpperCase()}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>${e("entryReceipt.success")}</strong></div>
        <div class="warning"><strong>${e("entryReceipt.keep")}</strong></div>
        <div class="warning"><strong>${e("entryReceipt.thanks")}</strong></div>
        <div class="thank-you"><strong>${e("entryReceipt.seeYou")}</strong></div>
      </div>

      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
    </div>
  </body>
</html>
`),n.document.close(),A(n)}},H=()=>{const n=window.open("","_blank","width=320,height=600");if(n&&s){const o=E(s);n.document.write(`
<html>
  <head>
    <title>${e("entryReceipt.stubTitle")}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body { 
        font-family: 'Courier New', Courier, monospace; 
        margin: 0; 
        padding: 0; 
        font-size: 13px;
        font-weight: bold;
        line-height: 1.1;
        width: 72mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        display: flex;
        justify-content: center;
      }
      .stub-container { 
        width: 70mm;
        margin: 0 auto;
        padding: 0.5mm;
        border: none;
        text-align: center;
      }
      .header { 
        text-align: center; 
        margin-bottom: 1mm; 
        padding-bottom: 1mm;
        border-bottom: 2px double #000;
      }
      .shop-name {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 0.5mm;
        text-transform: uppercase;
      }
      .shop-details {
        font-size: 11px;
        margin-bottom: 0.3mm;
        line-height: 1;
        font-weight: bold;
      }
      .receipt-info {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
      }
      .receipt-title {
        font-size: 13px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm;
        border-radius: 2px;
      }
      .stub-number {
        font-size: 13px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #333;
        color: white;
        padding: 1mm 2mm;
        border-radius: 3px;
      }
      .details-section {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .detail-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .detail-label {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .detail-value {
        text-align: right;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .amount-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .amount-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.3mm;
        font-size: 13px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 13px;
      }
      .stub-footer { 
        text-align: center; 
        margin-top: 1mm; 
        font-size: 11px;
        font-weight: bold;
        padding: 1mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 3px;
      }
      .agent-info {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 2px;
      }
      .sender-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .sender-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
      }
      .separator {
        border-top: 1px dashed #000;
        margin: 1mm 0;
      }
      .cut-line {
        text-align: center;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 11px;
        color: #000;
        letter-spacing: 1px;
      }
      .thank-you {
        font-weight: bold;
        margin: 0.5mm 0;
        font-size: 12px;
      }
      .warning {
        font-size: 10px;
        color: #000;
        margin: 0.3mm 0;
        font-weight: bold;
      }
      .description {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f5f5f5;
        border-left: 3px solid #ccc;
        font-size: 11px;
        font-weight: bold;
        border-radius: 2px;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
        margin: 1mm 0;
      }
      @media print {
        @page {
          margin: 0 !important;
          size: 72mm auto !important;
        }
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 72mm !important;
          font-size: 13px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          overflow: hidden !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: flex !important;
          justify-content: center !important;
        }
        .stub-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 0.5mm !important;
          width: 70mm !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
        }
        .cut-line {
          page-break-after: always !important;
          margin-bottom: 0 !important;
        }
        body::after,
        body::before {
          display: none !important;
          content: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="stub-container">
      <div class="header">
        <div class="shop-name"><strong>${o.shopName}</strong></div>
        <div class="shop-details"><strong>${o.shopAddress}</strong></div>
        <div class="shop-details">${e("receipt.tel")}: <strong>${o.shopNumber}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">${e("receipt.date")}: <strong>${o.date}</strong></div>
        <div class="shop-details">${e("receipt.receiptNo")}: <strong>${o.receiptNumber}</strong></div>
      </div>
      
      <div class="stub-number">
        <strong>${e("entryReceipt.stubNumber",{number:o.stubNumber})}</strong>
      </div>
      
      <div class="sender-info">
        <div class="sender-field">${e("receipt.receivedFrom")}: <strong>${o.receivedFrom.name.toUpperCase()}</strong></div>
        <div class="sender-field">${e("receipt.phone")}: <strong>${o.receivedFrom.phone}</strong></div>
      </div>
      
      ${o.description?`
        <div class="description">
          <strong>${e("receipt.description")}:</strong> <strong>${o.description}</strong>
        </div>
      `:""}
      
      <div class="receipt-title">${e("entryReceipt.stubDetails")}</div>
      
      <div class="details-section">
        <div class="detail-row">
          <div class="detail-label"><strong>${e("receipt.source")}:</strong></div>
          <div class="detail-value"><strong>${g(o.source)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${e("receipt.category")}:</strong></div>
          <div class="detail-value"><strong>${y(o.category)}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>${e("receipt.paymentMethod")}:</strong></div>
          <div class="detail-value"><strong>${C(s)}</strong></div>
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-row">
          <div><strong>${e("receipt.amountReceived")}:</strong></div>
          <div><strong>${b(s)}</strong></div>
        </div>
      </div>
      
      <div class="agent-info">
        ${e("receipt.recordedBy")}: <strong>${o.agent.toUpperCase()}</strong>
      </div>
      
      <div class="stub-footer">
        <div class="thank-you"><strong>${e("entryReceipt.stubFooter")}</strong></div>
        <div class="warning"><strong>${o.shopName}</strong></div>
        <div class="warning"><strong>${e("entryReceipt.keepStub")}</strong></div>
        <div class="warning">${e("entryReceipt.receiptNo")}: <strong>${o.receiptNumber}</strong></div>
        <div class="warning">${e("entryReceipt.date")}: <strong>${o.date}</strong></div>
        <div class="warning">${e("entryReceipt.source")}: <strong>${g(o.source)}</strong></div>
        <div class="warning">${e("entryReceipt.amount")}: <strong>${b(s)}</strong></div>
      </div>
      
      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
    </div>
  </body>
</html>
`),n.document.close(),A(n)}},Q=()=>{G(),setTimeout(()=>{H()},2e3)};a.useEffect(()=>{if(s){const n=setTimeout(()=>{Q()},500);return()=>clearTimeout(n)}},[s]);async function V(n){if(n.preventDefault(),!(!p||m||f.current)){f.current=!0,u(!0),$(null),k(null);try{const o=fe(r.paymentMethod),d=pe(parseFloat(r.currencyMode==="fc"?r.amountInFC:r.amount),r.currencyMode==="fc"?"FC":"USD",i?.rate),W={amount:d.amountUSD,...d,source:r.source,category:r.category,paymentMethod:o,description:r.description,receivedFrom:{name:r.receivedFromName,phone:r.receivedFromPhone,email:r.receivedFromEmail||""},requestKey:h.current},x=await ne(`${I}/entries`,{method:"POST",headers:{"Content-Type":"application/json",...K()},body:JSON.stringify(W)}),v=await he(x);if(!x.ok)throw oe(x.status,v);h.current=w();const R=v.entryId||v._id,Y={shopName:"ETS DOUBLE M CLASSIC BOUTIQUE",shopAddress:"780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",shopNumber:"+243 975 085 799",shopRegistration:"LSH/RCCM/22-A-01266",amount:d.amountUSD,...d,source:r.source,category:r.category,paymentMethod:r.paymentMethod,description:r.description,receivedFrom:{name:r.receivedFromName,phone:r.receivedFromPhone,email:r.receivedFromEmail},agent:q?.username||e("entry.agent"),date:ie(),receiptNumber:R,stubNumber:R,exchangeRate:i?.rate};P(Y),c({amount:"",amountInFC:"",source:"",category:"",paymentMethod:"cash",description:"",receivedFromName:"",receivedFromPhone:"",receivedFromEmail:"",currencyMode:"fc"}),$(e("entry.recordedPrinting")),ce(e("entry.recorded"))}catch(o){const d=ae(o);d.isNetwork||(h.current=w()),k(d.message)}finally{f.current=!1,u(!1)}}}return t.jsx("div",{className:"flex-1 p-6 overflow-auto",children:t.jsxs("div",{className:"max-w-4xl mx-auto",children:[t.jsx("div",{className:"mb-6",children:t.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",children:[t.jsxs("div",{children:[t.jsx("h2",{className:"text-2xl font-bold text-gray-900",children:S.entry.label}),t.jsx("p",{className:"text-gray-600 mt-1",children:S.entry.description})]}),t.jsx("div",{className:"bg-white border border-gray-200 rounded-lg px-4 py-3 min-w-[280px]",children:t.jsxs("div",{className:"flex items-center justify-between gap-4",children:[t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsx(U,{className:"w-5 h-5 text-primary","aria-hidden":"true"}),t.jsx("span",{className:"font-medium text-gray-700 whitespace-nowrap",children:e("entry.todayRate")})]}),D?t.jsx(z,{className:"w-4 h-4 animate-spin text-gray-500"}):i?t.jsxs("div",{className:"text-right",children:[t.jsxs("div",{className:"font-bold text-gray-900 text-lg tabular-nums whitespace-nowrap",children:["1 USD = ",new Intl.NumberFormat(M()).format(i.rate)," FC"]}),t.jsx("div",{className:"text-xs text-gray-500",children:e("entry.effectiveSince",{date:ee(i.effectiveFrom)})})]}):t.jsx("span",{className:"text-red-600 text-sm",children:e("entry.rateUnavailable")})]})})]})}),N&&t.jsx("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded",children:N}),F&&t.jsx("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded",children:F}),t.jsxs("form",{onSubmit:V,className:"space-y-6",children:[t.jsxs("div",{className:"bg-white rounded-xl p-6 border border-gray-200",children:[t.jsxs("h3",{className:"text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2",children:[t.jsx(U,{className:"w-5 h-5 text-green-600"}),e("entry.info")]}),t.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[t.jsxs("div",{children:[t.jsxs("div",{className:"flex items-center justify-between mb-2",children:[t.jsx("label",{htmlFor:"entry-amount",className:"block font-medium text-gray-700",children:e("entry.amount")}),t.jsxs("button",{type:"button",onClick:J,className:"flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors",children:[t.jsx(ge,{className:"w-3 h-3"}),r.currencyMode==="usd"?"USD → FC":"FC → USD"]})]}),r.currencyMode==="usd"?t.jsx("input",{id:"entry-amount",type:"number",step:"0.01",name:"amount",value:r.amount,onChange:n=>c({...r,amount:n.target.value}),placeholder:e("entry.amountUsdPlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:"0.01",required:!0}):t.jsx("input",{id:"entry-amount",type:"number",name:"amountInFC",value:r.amountInFC,onChange:n=>c({...r,amountInFC:n.target.value}),placeholder:e("entry.amountFcPlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:"1",required:!0}),r.amount&&r.currencyMode==="usd"&&i&&t.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",le(parseFloat(r.amount)*i.rate)]}),r.amountInFC&&r.currencyMode==="fc"&&i&&t.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",me(parseFloat(r.amountInFC)/i.rate)]})]}),t.jsxs("div",{children:[t.jsx("label",{htmlFor:"entry-source",className:"block mb-2 font-medium text-gray-700",children:e("entry.source")}),t.jsxs("select",{id:"entry-source",name:"source",value:r.source,onChange:l,className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0,children:[t.jsx("option",{value:"",children:e("entry.selectSource")}),L.map(n=>t.jsx("option",{value:n,children:g(n)},n))]})]}),t.jsxs("div",{children:[t.jsx("label",{htmlFor:"entry-category",className:"block mb-2 font-medium text-gray-700",children:e("entry.category")}),t.jsxs("select",{id:"entry-category",name:"category",value:r.category,onChange:l,className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0,children:[t.jsx("option",{value:"",children:e("entry.selectCategory")}),_.map(n=>t.jsx("option",{value:n,children:y(n)},n))]})]}),t.jsxs("div",{children:[t.jsx("label",{htmlFor:"entry-payment-method",className:"block mb-2 font-medium text-gray-700",children:e("entry.paymentMethod")}),t.jsxs("select",{id:"entry-payment-method",name:"paymentMethod",value:r.paymentMethod,onChange:l,className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0,children:[t.jsx("option",{value:"cash",children:e("entryOptions.payment.cash")}),t.jsx("option",{value:"mpesa",children:e("entryOptions.payment.mpesa")}),t.jsx("option",{value:"bank",children:e("entryOptions.payment.bank")}),t.jsx("option",{value:"card",children:e("entryOptions.payment.card")}),t.jsx("option",{value:"other",children:e("entryOptions.payment.other")})]})]})]}),t.jsxs("div",{className:"mt-4",children:[t.jsx("label",{htmlFor:"entry-description",className:"block mb-2 font-medium text-gray-700",children:e("entry.description")}),t.jsx("textarea",{id:"entry-description",name:"description",value:r.description,onChange:l,placeholder:e("entry.descriptionPlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",rows:3})]})]}),t.jsxs("div",{className:"bg-white rounded-xl p-6 border border-gray-200",children:[t.jsxs("h3",{className:"text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2",children:[t.jsx(te,{className:"w-5 h-5 text-blue-600"}),e("entry.sender")]}),t.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[t.jsxs("div",{children:[t.jsx("label",{htmlFor:"entry-received-from-name",className:"block mb-2 font-medium text-gray-700",children:e("entry.senderName")}),t.jsx("input",{id:"entry-received-from-name",type:"text",name:"receivedFromName",value:r.receivedFromName,onChange:l,placeholder:e("entry.senderNamePlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]}),t.jsxs("div",{children:[t.jsx("label",{htmlFor:"entry-received-from-phone",className:"block mb-2 font-medium text-gray-700",children:e("entry.senderPhone")}),t.jsx("input",{id:"entry-received-from-phone",type:"tel",name:"receivedFromPhone",value:r.receivedFromPhone,onChange:l,placeholder:e("entry.senderPhonePlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]}),t.jsxs("div",{className:"md:col-span-2",children:[t.jsx("label",{htmlFor:"entry-received-from-email",className:"block mb-2 font-medium text-gray-700",children:e("entry.senderEmail")}),t.jsx("input",{id:"entry-received-from-email",type:"email",name:"receivedFromEmail",value:r.receivedFromEmail,onChange:l,placeholder:e("entry.senderEmailPlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"})]})]})]}),t.jsxs("div",{className:"bg-white rounded-xl p-6 border border-gray-200",children:[t.jsx("button",{type:"submit",disabled:!p||m,className:`w-full px-8 py-4 rounded-lg font-medium text-lg flex items-center justify-center gap-2 ${p&&!m?"bg-green-600 hover:bg-green-700 text-white":"bg-gray-400 cursor-not-allowed text-white"} transition-colors`,children:m?t.jsxs("span",{className:"flex items-center gap-2",children:[t.jsx(z,{className:"w-5 h-5 animate-spin"}),e("entry.saving")]}):t.jsxs("span",{className:"flex items-center gap-2",children:[t.jsx(ue,{className:"w-5 h-5"}),e("entry.save")]})}),!p&&t.jsx("p",{className:"text-sm text-orange-600 mt-2 text-center",children:e("entry.requiredFields")})]})]}),t.jsx("div",{ref:O,style:{display:"none"}})]})})}export{ke as default};
