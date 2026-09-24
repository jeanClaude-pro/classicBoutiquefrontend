import{O as Fe,z as i,N as Ie,x as t,M as re,d as B,k as de,m as ze,H as J,F as Te,g as oe,q as Ee,p as Me,G as Ae}from"./index-ByhrFalG.js";import{b as De}from"./notify-6CY3UR_1.js";import{b as Ue,f as T,d as E,c as Oe,e as qe,m as Le}from"./salePricing-TZJH2azO.js";import{D as _e}from"./dollar-sign-DZQXlJ4Q.js";import{S as Be}from"./search-DMDKcIS5.js";import{C as Je}from"./calculator-_9qWe6Ov.js";const le=e=>`${new Intl.NumberFormat(de(),{maximumFractionDigits:0}).format(e)}FC`,se=e=>Ae(`saleReceipt.payments.${e}`,{defaultValue:e.toUpperCase()}),ne=(e,m)=>{const x=qe(e,m);return`${e.priceUSD.toFixed(2)}$${x===void 0?"":` / ${le(x)}`}`},Q=(e,m,x)=>{const p=Le(e,m,x);return`${e.toFixed(2)}$${p===void 0?"":` / ${le(p)}`}`},k=Te;function ae(e){return e==="cash"?"cash":e==="card"?"card":e==="mpesa"||e==="bank"?"transfer":"other"}async function ie(e){return(e.headers.get("content-type")||"").includes("application/json")?e.json():{__nonJson:!0,text:await e.text()}}class ce{static async printReceipt(m,x="sale"){try{const p=await fetch(`${k}/print/receipt`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({receiptData:m,type:x})});if(!p.ok)throw new Error("Failed to print receipt");return(await p.json()).success}catch(p){throw console.error("Print receipt error:",p),p}}static async printStub(m,x="sale"){try{const p=await fetch(`${k}/print/stub`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({receiptData:m,type:x})});if(!p.ok)throw new Error("Failed to print stub");return(await p.json()).success}catch(p){throw console.error("Print stub error:",p),p}}}function Ye(){const{t:e}=Fe(),[m,x]=i.useState([]),[p,C]=i.useState(!0),[R,G]=i.useState(!1),M=i.useRef(!1),[g,P]=i.useState([]),[s,me]=i.useState(null),[a,pe]=i.useState(null),[ue,H]=i.useState(!0),[w,F]=i.useState(""),[V,I]=i.useState(!1),ge=i.useRef(null),A=i.useRef(null),{user:z}=Ie(),[n,y]=i.useState({productId:"",quantity:"",unitPrice:"",priceInFC:"",customerName:"",customerPhone:"",customerEmail:"",paymentMethod:"cash",notes:"",currencyMode:"fc",priceSource:"USD"}),[W,K]=i.useState(null),[Y,b]=i.useState(null),Z=z?.role==="superadmin";i.useEffect(()=>{const r=o=>{A.current&&!A.current.contains(o.target)&&I(!1)};return document.addEventListener("mousedown",r),()=>{document.removeEventListener("mousedown",r)}},[]);const he=async()=>{try{H(!0);const r=await fetch(`${k}/exchange-rates/current`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(r.ok){const o=await r.json();pe(o)}else console.warn("Failed to load exchange rate")}catch(r){console.error("Error loading exchange rate:",r)}finally{H(!1)}};i.useEffect(()=>{let r=!1;async function o(){C(!0),b(null);try{await Promise.all([c(),he()])}catch(d){r||b(J(d).message)}finally{r||C(!1)}}async function c(){try{const d=await fetch(`${k}/products`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}}),l=await ie(d);if(!d.ok)throw oe(d.status,l);const f=Array.isArray(l?.products)?l.products:Array.isArray(l)&&!l.__nonJson?l:[];r||x(f)}catch(d){r||b(J(d).message)}}return o(),()=>{r=!0}},[]);const u=i.useMemo(()=>m.find(r=>r._id===n.productId),[m,n.productId]),D=i.useMemo(()=>w.trim()?m.filter(r=>r.name.toLowerCase().includes(w.toLowerCase())||r.sku&&r.sku.toLowerCase().includes(w.toLowerCase())):m,[m,w]),v=parseInt(n.quantity)||0,U=parseFloat(n.priceSource==="FC"?n.priceInFC:n.unitPrice)||0,O=i.useMemo(()=>{if(U<=0)return null;try{return Ue(U,n.priceSource,a?.rate)}catch{return null}},[U,n.priceSource,a?.rate]),S=O?.priceUSD||0,xe=v*S,j=g.reduce((r,o)=>r+o.total,0),q=g.length>0&&n.customerName.trim()!==""&&n.customerPhone.trim()!=="";function N(r){y(o=>({...o,[r.target.name]:r.target.value}))}const fe=r=>{y(o=>({...o,productId:r._id,unitPrice:r.price?r.price.toString():"",priceInFC:r.price&&a?Math.round(r.price*a.rate).toString():"",priceSource:"USD"})),F(r.name),I(!1)},be=r=>{F(r.target.value),I(!0),r.target.value||y(o=>({...o,productId:""}))},L=(r,o)=>{const c=m.find(l=>l._id===r);if(!c)return!1;const d=g.filter(l=>l.productId===r).reduce((l,f)=>l+f.quantity,0);return Oe(c.stock,d,o)},ve=()=>{y(r=>({...r,currencyMode:r.currencyMode==="usd"?"fc":"usd"}))},ye=r=>Z?e("pos.stockCount",{count:r.stock}):r.stock===0?e("pos.outOfStockShort"):r.stock<=5?e("pos.lowStockShort"):e("pos.inStockShort"),we=(r,o)=>{const c=r&&o>0&&L(r._id,o);if(Z){const d=g.filter(f=>f.productId===r._id).reduce((f,$)=>f+$.quantity,0),l=r.stock-d;return t.jsxs("p",{className:"text-sm text-gray-600 mb-4",children:[e("pos.availableStock")," ",t.jsx("strong",{children:r.stock}),d>0&&t.jsx("span",{className:"ml-2 text-blue-600",children:e("pos.alreadyInCart",{count:d})}),o>0&&t.jsxs("span",{className:`ml-4 ${c?"text-green-600":"text-red-600"}`,children:[e("reservation.remainingAfter")," ",l-o>=0?l-o:e("pos.notEnoughStock")]})]})}else return r.stock===0?t.jsx("p",{className:"text-sm text-red-600 mb-4",children:t.jsx("strong",{children:e("pos.outOfStock")})}):r.stock<=5?t.jsx("p",{className:"text-sm text-orange-600 mb-4",children:t.jsx("strong",{children:e("pos.lowStock")})}):o>0&&!c?t.jsx("p",{className:"text-sm text-red-600 mb-4",children:t.jsx("strong",{children:e("pos.quantityUnavailable")})}):o>0?t.jsx("p",{className:"text-sm text-green-600 mb-4",children:t.jsx("strong",{children:e("pos.stockSufficient")})}):t.jsx("p",{className:"text-sm text-green-600 mb-4",children:t.jsx("strong",{children:e("pos.inStock")})})};function je(){if(!u){b(e("pos.selectProduct"));return}if(v<=0){b(e("pos.quantityPositive"));return}if(!O){b(e("pos.pricePositive"));return}if(!L(u._id,v)){b(e("pos.insufficientStock"));return}b(null);const r=g.findIndex(o=>o.productId===u._id&&o.unitPrice===S);if(r>=0){const o=[...g];o[r]={...o[r],quantity:o[r].quantity+v,total:(o[r].quantity+v)*S},P(o)}else P([...g,{productId:u._id,name:u.name,quantity:v,unitPrice:S,total:xe,...O}]);y(o=>({...o,quantity:"",unitPrice:u.price?u.price.toString():"",priceInFC:u.price&&a?Math.round(u.price*a.rate).toString():"",priceSource:"USD"})),F("")}function Ne(r){const o=[...g];o.splice(r,1),P(o)}function X(){const r=localStorage.getItem("authToken")||localStorage.getItem("token")||"";return r?{Authorization:`Bearer ${r}`}:{}}const ke=()=>{const r=window.open("","_blank","width=320,height=600");r&&(r.document.write(`
<html>
  <head>
    <title>${e("reservationReceipt.title")}</title>
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
      .reservation-badge {
        background-color: #000;
        color: white;
        padding: 2mm;
        font-weight: bold;
        text-align: center;
        margin: 1mm 0;
        font-size: 14px;
        border-radius: 3px;
      }
      .items-section {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .item-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .item-name {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .item-details {
        text-align: right;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .total-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .total-row {
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
      .sales-person {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 2px;
      }
      .customer-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .customer-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
      }
      .reservation-info {
        background-color: #fffacd;
        border: 2px solid #ffd700;
        padding: 1mm;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 12px;
        border-radius: 3px;
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
      .notes {
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
        <div class="shop-name"><strong>${s.shopName}</strong></div>
        <div class="shop-details"><strong>${s.shopAddress}</strong></div>
        <div class="shop-details">${e("saleReceipt.tel")}: <strong>${s.shopNumber}</strong></div>
        <div class="shop-details"><strong>${s.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">${e("saleReceipt.date")}: <strong>${s.date}</strong></div>
        <div class="shop-details">${e("saleReceipt.receiptNo")}: <strong>${s.receiptNumber}</strong></div>
      </div>
      
      <div class="reservation-badge">
        <strong>${e("reservationReceipt.confirmed")}</strong>
      </div>
      
      <div class="reservation-info">
        <div><strong>${e("reservationReceipt.date")}:</strong> <strong>${s.reservationDate}</strong></div>
        <div><strong>${e("reservationReceipt.time")}:</strong> <strong>${s.reservationTime}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">${e("saleReceipt.customer")}: <strong>${s.customerName.toUpperCase()}</strong></div>
        <div class="customer-field">${e("saleReceipt.phone")}: <strong>${s.customerPhone}</strong></div>
        ${s.customerEmail?`<div class="customer-field">${e("reservationReceipt.email")}: <strong>${s.customerEmail}</strong></div>`:""}
      </div>
      
      ${s.notes?`
        <div class="notes">
          <strong>${e("reservationReceipt.notes")}:</strong> <strong>${s.notes}</strong>
        </div>
      `:""}
      
      <div class="receipt-title">${e("reservationReceipt.items")}</div>
      
      <div class="items-section">
      ${s.items.map(o=>`
        <div class="item-row">
          <div class="item-name"><strong>${o.name}</strong></div>
          <div class="item-details">
            <strong>${o.quantity} x ${ne(o,s.exchangeRate)}</strong>
          </div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>${e("saleReceipt.subtotal")}:</strong></div>
          <div><strong>${Q(s.total,s.items,s.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>${e("reservationReceipt.totalDeposit")}:</strong></div>
          <div><strong>${Q(s.total,s.items,s.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>${e("saleReceipt.payment")}:</strong></div>
          <div class="payment-method"><strong>${se(s.paymentMethod)}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        ${e("saleReceipt.agent")}: <strong>${s.salesPerson.toUpperCase()}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>${e("reservationReceipt.thanks")}</strong></div>
        <div class="warning"><strong>${e("reservationReceipt.present")}</strong></div>
        <div class="warning"><strong>${e("reservationReceipt.validity")}</strong></div>
        <div class="warning"><strong>${e("saleReceipt.noRefund")}</strong></div>
        <div class="thank-you"><strong>${e("reservationReceipt.seeYou")}</strong></div>
      </div>

      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
    </div>
    <script>
      window.onload = function() {
        try {
          window.print();
        } catch(e) {
          console.error('Print error:', e);
        }
        setTimeout(() => {
          window.close();
        }, 1000);
      };
    <\/script>
  </body>
</html>
`),r.document.close())},Se=()=>{const r=window.open("","_blank","width=320,height=600");r&&(r.document.write(`
<html>
  <head>
    <title>${e("reservationReceipt.stubTitle")}</title>
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
      .items-section {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .item-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .item-name {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .item-details {
        text-align: right;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .total-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .total-row {
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
      .sales-person {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 2px;
      }
      .customer-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .customer-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
      }
      .reservation-info {
        background-color: #fffacd;
        border: 2px solid #ffd700;
        padding: 1mm;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 12px;
        border-radius: 3px;
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
      .notes {
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
        <div class="shop-name"><strong>${s.shopName}</strong></div>
        <div class="shop-details"><strong>${s.shopAddress}</strong></div>
        <div class="shop-details">${e("saleReceipt.tel")}: <strong>${s.shopNumber}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">${e("saleReceipt.date")}: <strong>${s.date}</strong></div>
        <div class="shop-details">${e("saleReceipt.receiptNo")}: <strong>${s.receiptNumber}</strong></div>
      </div>
      
      <div class="stub-number">
        <strong>${e("reservationReceipt.stubNumber",{number:s.stubNumber})}</strong>
      </div>
      
      <div class="reservation-info">
        <div><strong>${e("reservationReceipt.date")}:</strong> <strong>${s.reservationDate}</strong></div>
        <div><strong>${e("reservationReceipt.time")}:</strong> <strong>${s.reservationTime}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">${e("saleReceipt.customer")}: <strong>${s.customerName.toUpperCase()}</strong></div>
        <div class="customer-field">${e("saleReceipt.phone")}: <strong>${s.customerPhone}</strong></div>
      </div>
      
      ${s.notes?`
        <div class="notes">
          <strong>${e("reservationReceipt.notes")}:</strong> <strong>${s.notes}</strong>
        </div>
      `:""}
      
      <div class="receipt-title">${e("reservationReceipt.items")}</div>
      
      <div class="items-section">
      ${s.items.map(o=>`
        <div class="item-row">
          <div class="item-name"><strong>${o.name}</strong></div>
          <div class="item-details">
            <strong>${o.quantity} x ${ne(o,s.exchangeRate)}</strong>
          </div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>${e("reservationReceipt.depositReceived")}:</strong></div>
          <div><strong>${Q(s.total,s.items,s.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>${e("saleReceipt.payment")}:</strong></div>
          <div class="payment-method"><strong>${se(s.paymentMethod)}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        ${e("saleReceipt.agent")}: <strong>${s.salesPerson.toUpperCase()}</strong>
      </div>
      
      <div class="stub-footer">
        <div class="thank-you"><strong>${e("reservationReceipt.stubFooter")}</strong></div>
        <div class="warning"><strong>${s.shopName}</strong></div>
        <div class="warning"><strong>${e("saleReceipt.keepStub")}</strong></div>
        <div class="warning">${e("saleReceipt.receiptNoShort")}: <strong>${s.receiptNumber}</strong></div>
        <div class="warning">${e("saleReceipt.dateShort")}: <strong>${s.date}</strong></div>
        <div class="warning">${e("reservationReceipt.customerShort")}: <strong>${s.customerName}</strong></div>
        <div class="warning">${e("reservationReceipt.telShort")}: <strong>${s.customerPhone}</strong></div>
      </div>
      
      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
    </div>
    <script>
      window.onload = function() {
        try {
          window.print();
        } catch(e) {
          console.error('Print error:', e);
        }
        setTimeout(() => {
          window.close();
        }, 1000);
      };
    <\/script>
  </body>
</html>
`),r.document.close())},ee=()=>{ke(),setTimeout(()=>{Se()},2e3)},$e=async r=>{try{return console.log("Attempting ESC/POS printing for reservation..."),await ce.printReceipt(r,"reservation"),await ce.printStub(r,"reservation"),console.log("ESC/POS printing successful"),!0}catch(o){return console.error("ESC/POS printing failed, falling back to browser printing:",o),ee(),!1}};i.useEffect(()=>{if(s){const r=setTimeout(async()=>{try{await $e(s)}catch(o){console.error("Printing failed:",o),ee()}},500);return()=>clearTimeout(r)}},[s]);const te=u&&v>0&&S>0&&L(u._id,v);async function Ce(r){if(r.preventDefault(),!(!q||R||M.current)){M.current=!0,G(!0),K(null),b(null);try{const o=new Date,c=o.toLocaleDateString("fr-FR",{timeZone:"Africa/Lubumbashi"}),d=Ee(o),l={customer:{name:n.customerName,phone:n.customerPhone,email:n.customerEmail||""},items:g.map(h=>({productId:h.productId,name:h.name,quantity:h.quantity,price:h.unitPrice,enteredPrice:h.enteredPrice,enteredCurrency:h.enteredCurrency,priceUSD:h.priceUSD,priceFC:h.priceFC,exchangeRate:h.exchangeRate})),subtotal:j,total:j,paymentMethod:ae(n.paymentMethod),salesPerson:z?.username||"unknown",reservationDate:c,reservationTime:d,notes:n.notes||"",type:"reservation",exchangeRate:g[0]?.exchangeRate??a?.rate},f=await fetch(`${k}/sales`,{method:"POST",headers:{"Content-Type":"application/json",...X()},body:JSON.stringify(l)}),$=await ie(f);if(!f.ok)throw oe(f.status,$);const Re=$._id,_=$.saleId;try{(await fetch(`${k}/reservations/track`,{method:"POST",headers:{"Content-Type":"application/json",...X()},body:JSON.stringify({saleReference:Re,saleId:_,customer:{name:n.customerName,phone:n.customerPhone,email:n.customerEmail},items:g,total:j,paymentMethod:ae(n.paymentMethod),salesPerson:z?.username||"unknown",reservationDate:c,reservationTime:d,notes:n.notes})})).ok||console.warn("Failed to create reservation tracking, but sale was created")}catch(h){console.warn("Error creating reservation tracking:",h)}const Pe={shopName:"ETS DOUBLE M CLASSIC BOUTIQUE",shopAddress:"780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",shopNumber:"+243 836 017 031",shopRegistration:"LSH/RCCM/22-A-01266",customerName:n.customerName,customerPhone:n.customerPhone,customerEmail:n.customerEmail,items:g,total:j,paymentMethod:n.paymentMethod,salesPerson:z?.username||e("reservation.seller"),date:Me(),receiptNumber:_,stubNumber:_,reservationDate:c,reservationTime:d,notes:n.notes};me(Pe),y({productId:"",quantity:"",unitPrice:"",priceInFC:"",customerName:"",customerPhone:"",customerEmail:"",paymentMethod:n.paymentMethod,notes:"",currencyMode:"fc",priceSource:"USD"}),P([]),F(""),K(e("reservation.donePrinting")),De(e("reservation.recorded"))}catch(o){b(J(o).message)}finally{M.current=!1,G(!1)}}}return t.jsx("div",{className:"flex-1 p-6 overflow-auto",children:t.jsxs("div",{className:"max-w-6xl mx-auto",children:[t.jsx("div",{className:"mb-6",children:t.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",children:[t.jsxs("div",{children:[t.jsx("h2",{className:"text-2xl font-bold text-gray-900",children:re.reservation.label}),t.jsx("p",{className:"text-gray-600 mt-1",children:re.reservation.description})]}),t.jsx("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4 min-w-[280px]",children:t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsx(_e,{className:"w-5 h-5 text-blue-600"}),t.jsx("span",{className:"font-semibold text-blue-900",children:e("pos.todayRate")})]}),ue?t.jsx(B,{className:"w-4 h-4 animate-spin text-blue-600"}):a?t.jsxs("div",{className:"text-right",children:[t.jsxs("div",{className:"font-bold text-blue-800 text-lg",children:["1 USD = ",new Intl.NumberFormat(de()).format(a.rate)," FC"]}),t.jsx("div",{className:"text-xs text-blue-600",children:e("pos.effectiveSince",{date:ze(a.effectiveFrom)})})]}):t.jsx("span",{className:"text-red-600 text-sm",children:e("pos.rateUnavailable")})]})})]})}),W&&t.jsx("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded",children:W}),Y&&t.jsx("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded",children:Y}),t.jsxs("div",{className:"bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200",children:[t.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:e("reservation.addItems")}),t.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4 mb-6",children:[t.jsxs("div",{className:"relative",ref:A,children:[t.jsx("label",{htmlFor:"reservation-articles",className:"block mb-2 font-medium text-gray-700",children:e("pos.items")}),t.jsxs("div",{className:"relative",children:[t.jsx(Be,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),t.jsx("input",{id:"reservation-articles",type:"text",value:w,onChange:be,onFocus:()=>I(!0),placeholder:e("pos.searchPlaceholder"),className:"w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",disabled:p||m.length===0})]}),V&&D.length>0&&t.jsx("div",{className:"absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto",children:D.map(r=>t.jsxs("div",{className:"px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0",onClick:()=>fe(r),children:[t.jsx("div",{className:"font-medium text-gray-900",children:r.name}),t.jsxs("div",{className:"text-sm text-gray-600 flex justify-between",children:[t.jsx("span",{children:r.sku&&e("pos.sku",{sku:r.sku})}),t.jsx("span",{className:r.stock===0?"text-red-600":r.stock<=5?"text-orange-600":"text-green-600",children:ye(r)})]})]},r._id))}),V&&w&&D.length===0&&t.jsx("div",{className:"absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500",children:e("pos.noItemFound")})]}),t.jsxs("div",{children:[t.jsx("label",{htmlFor:"reservation-quantity",className:"block mb-2 font-medium text-gray-700",children:e("pos.quantity")}),t.jsx("input",{id:"reservation-quantity",type:"number",name:"quantity",value:n.quantity,onChange:N,placeholder:e("pos.quantityPlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:1})]}),t.jsxs("div",{children:[t.jsxs("div",{className:"flex items-center justify-between mb-2",children:[t.jsx("label",{htmlFor:"reservation-unit-price",className:"block font-medium text-gray-700",children:e("pos.unitPrice")}),t.jsxs("button",{type:"button",onClick:ve,className:"flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors",children:[t.jsx(Je,{className:"w-3 h-3"}),n.currencyMode==="usd"?"USD → FC":"FC → USD"]})]}),n.currencyMode==="usd"?t.jsx("input",{id:"reservation-unit-price",type:"number",step:"0.01",name:"unitPrice",value:n.unitPrice,onChange:r=>{const o=r.target.value,c=Number.parseFloat(o);y({...n,unitPrice:o,priceInFC:a&&Number.isFinite(c)?Math.round(c*a.rate).toString():"",priceSource:"USD"})},placeholder:u?.price?e("pos.priceExample",{price:u.price}):e("pos.priceUsdPlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:.01}):t.jsx("input",{id:"reservation-unit-price",type:"number",name:"priceInFC",value:n.priceInFC,onChange:r=>{const o=r.target.value,c=Number.parseFloat(o);y({...n,priceInFC:o,unitPrice:a&&Number.isFinite(c)?(c/a.rate).toString():"",priceSource:"FC"})},placeholder:e("pos.priceFcPlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:1}),n.unitPrice&&n.currencyMode==="usd"&&a&&t.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",T(parseFloat(n.unitPrice)*a.rate)]}),n.priceInFC&&n.currencyMode==="fc"&&a&&t.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",E(parseFloat(n.priceInFC)/a.rate)]})]})]}),u&&we(u,v),t.jsxs("button",{type:"button",onClick:je,disabled:!te,className:`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${te?"bg-blue-600 hover:bg-blue-700 text-white shadow-sm":"bg-gray-400 cursor-not-allowed text-white"} transition-colors`,children:[t.jsx(B,{className:"w-4 h-4"}),e("pos.addToCart")]}),g.length>0&&t.jsxs("div",{className:"mt-6",children:[t.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:e("reservation.cartItems")}),t.jsx("div",{className:"overflow-hidden rounded-lg border border-gray-200",children:t.jsxs("table",{className:"w-full",children:[t.jsx("thead",{className:"bg-gray-50",children:t.jsxs("tr",{children:[t.jsx("th",{className:"px-4 py-3 text-left text-sm font-semibold text-gray-700",children:e("pos.columns.items")}),t.jsx("th",{className:"px-4 py-3 text-center text-sm font-semibold text-gray-700",children:e("pos.columns.pieces")}),t.jsx("th",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-700",children:e("pos.columns.unitPrice")}),t.jsx("th",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-700",children:e("pos.columns.total")}),t.jsx("th",{className:"px-4 py-3 text-center text-sm font-semibold text-gray-700",children:e("common.actions")})]})}),t.jsx("tbody",{className:"divide-y divide-gray-200",children:g.map((r,o)=>t.jsxs("tr",{className:"hover:bg-gray-50",children:[t.jsx("td",{className:"px-4 py-3 text-sm text-gray-900",children:r.name}),t.jsx("td",{className:"px-4 py-3 text-sm text-center text-gray-600",children:r.quantity}),t.jsxs("td",{className:"px-4 py-3 text-sm text-right text-gray-900",children:[E(r.unitPrice),a&&t.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",T(r.unitPrice*a.rate)]})]}),t.jsxs("td",{className:"px-4 py-3 text-sm text-right text-gray-900",children:[E(r.total),a&&t.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",T(r.total*a.rate)]})]}),t.jsx("td",{className:"px-4 py-3 text-center",children:t.jsx("button",{onClick:()=>Ne(o),className:"text-red-600 hover:text-red-800 text-sm font-medium","aria-label":e("pos.removeNamed",{name:r.name}),children:e("pos.remove")})})]},o))}),t.jsx("tfoot",{className:"bg-gray-50",children:t.jsxs("tr",{children:[t.jsx("td",{colSpan:3,className:"px-4 py-3 text-right text-sm font-semibold text-gray-900",children:e("pos.totalLabel")}),t.jsxs("td",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-900",children:[E(j),a&&t.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",T(j*a.rate)]})]}),t.jsx("td",{})]})})]})})]})]}),t.jsxs("div",{className:"bg-white shadow-lg rounded-xl p-6 border border-gray-200",children:[t.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:e("pos.customerInfo")}),t.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6 mb-6",children:[t.jsxs("div",{children:[t.jsx("label",{htmlFor:"reservation-customer-name",className:"block mb-2 font-medium text-gray-700",children:e("reservation.customerName")}),t.jsx("input",{id:"reservation-customer-name",type:"text",name:"customerName",value:n.customerName,onChange:N,placeholder:e("pos.customerNamePlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]}),t.jsxs("div",{children:[t.jsx("label",{htmlFor:"reservation-customer-phone",className:"block mb-2 font-medium text-gray-700",children:e("reservation.customerPhone")}),t.jsx("input",{id:"reservation-customer-phone",type:"tel",name:"customerPhone",value:n.customerPhone,onChange:N,placeholder:e("pos.customerPhonePlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]}),t.jsxs("div",{children:[t.jsx("label",{htmlFor:"reservation-customer-email",className:"block mb-2 font-medium text-gray-700",children:e("reservation.customerEmail")}),t.jsx("input",{id:"reservation-customer-email",type:"email",name:"customerEmail",value:n.customerEmail,onChange:N,placeholder:e("reservation.customerEmailPlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"})]}),t.jsxs("div",{children:[t.jsx("label",{htmlFor:"reservation-payment-method",className:"block mb-2 font-medium text-gray-700",children:e("pos.paymentMethod")}),t.jsxs("select",{id:"reservation-payment-method",name:"paymentMethod",value:n.paymentMethod,onChange:N,className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0,children:[t.jsx("option",{value:"cash",children:e("pos.payment.cash")}),t.jsx("option",{value:"mpesa",children:e("pos.payment.mpesa")}),t.jsx("option",{value:"bank",children:e("pos.payment.bank")}),t.jsx("option",{value:"card",children:e("pos.payment.card")}),t.jsx("option",{value:"other",children:e("pos.payment.other")})]})]})]}),t.jsxs("div",{className:"mb-6",children:[t.jsx("label",{htmlFor:"reservation-notes",className:"block mb-2 font-medium text-gray-700",children:e("reservation.notes")}),t.jsx("textarea",{id:"reservation-notes",name:"notes",value:n.notes,onChange:N,placeholder:e("reservation.notesPlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",rows:3})]}),t.jsx("button",{type:"submit",onClick:Ce,disabled:!q||R,className:`px-8 py-3 rounded-lg font-medium text-lg ${q&&!R?"bg-green-600 hover:bg-green-700 text-white shadow-sm":"bg-gray-400 cursor-not-allowed text-white"} transition-colors`,children:R?t.jsxs("span",{className:"flex items-center gap-2",children:[t.jsx(B,{className:"w-4 h-4 animate-spin"}),e("pos.saving")]}):e("reservation.confirm")})]}),t.jsx("div",{ref:ge,style:{display:"none"}})]})})}export{Ye as default};
