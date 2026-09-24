import{O as We,z as d,G as ue,N as Le,x as t,M as ae,d as B,k as ge,m as _e,H as Q,F as Be,g as ie,p as Qe}from"./index-ByhrFalG.js";import{b as Je}from"./notify-6CY3UR_1.js";import{b as J,f as C,d as N,c as Ge,e as He,l as he,g as Ve,m as Ke}from"./salePricing-TZJH2azO.js";import{D as Xe}from"./dollar-sign-DZQXlJ4Q.js";import{S as Ye}from"./search-DMDKcIS5.js";import{C as Ze}from"./calculator-_9qWe6Ov.js";const H=r=>`${new Intl.NumberFormat(ge(),{maximumFractionDigits:0}).format(r)}FC`,ce=r=>ue(`saleReceipt.payments.${r}`,{defaultValue:r.toUpperCase()}),le=(r,m)=>{const h=He(r,m);return`${he(r).toFixed(2)}$${h===void 0?"":` / ${H(h)}`}`},de=(r,m)=>{const h=Ve(r,m);return`${(he(r)*r.quantity).toFixed(2)}$${h===void 0?"":` / ${H(h)}`}`},G=(r,m,h)=>{const u=Ke(r,m,h);return`${r.toFixed(2)}$${u===void 0?"":` / ${H(u)}`}`},$=Be;function et(r){return r==="cash"?"cash":r==="card"?"card":r==="mpesa"||r==="bank"?"transfer":"other"}async function me(r){return(r.headers.get("content-type")||"").includes("application/json")?r.json():{__nonJson:!0,text:await r.text()}}class pe{static async printReceipt(m,h="sale"){try{const u=await fetch(`${$}/print/receipt`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({receiptData:m,type:h})});if(!u.ok)throw new Error("Failed to print receipt");return(await u.json()).success}catch(u){throw console.error("Print receipt error:",u),u}}static async printStub(m,h="sale"){try{const u=await fetch(`${$}/print/stub`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({receiptData:m,type:h})});if(!u.ok)throw new Error("Failed to print stub");return(await u.json()).success}catch(u){throw console.error("Print stub error:",u),u}}}function it(){const{t:r}=We(),[m,h]=d.useState([]),[u,F]=d.useState(!0),[U,V]=d.useState(!1),q=d.useRef(!1),xe=d.useRef(0),[g,P]=d.useState([]),[o,fe]=d.useState(null),[l,be]=d.useState(null),[ye,K]=d.useState(!0),[k,z]=d.useState(""),[X,A]=d.useState(!1),[I,we]=d.useState({shopName:"ETS DOUBLE M CLASSIC BOUTIQUE",shopAddress:"780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",shopNumber:"+243 836 017 031",shopRegistration:"LSH/RCCM/22-A-01266",receiptFooter:ue("pos.defaultFooter")}),ve=d.useRef(null),T=d.useRef(null),{user:S}=Le(),je=S?.role==="superadmin"||S?.role==="manager"||(S?.actionPermissions??[]).includes("edit_receipts"),[a,y]=d.useState({productId:"",quantity:"",unitPrice:"",priceInFC:"",customerName:"",customerPhone:"",isWalkIn:!1,paymentMethod:"cash",currencyMode:"fc",priceSource:"USD"}),[Y,Z]=d.useState(null),[ee,f]=d.useState(null),te=S?.role==="superadmin";d.useEffect(()=>{const e=n=>{T.current&&!T.current.contains(n.target)&&A(!1)};return document.addEventListener("mousedown",e),()=>{document.removeEventListener("mousedown",e)}},[]);const Ne=async()=>{try{const e=await fetch(`${$}/settings/receipt`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(e.ok){const n=await e.json();we({shopName:n.shopName||"ETS DOUBLE M CLASSIC BOUTIQUE",shopAddress:n.shopAddress||"",shopNumber:n.shopNumber||"",shopRegistration:n.shopRegistration||"",receiptFooter:n.receiptFooter||""})}}catch(e){console.warn("Could not load shop settings, using defaults:",e)}},ke=async()=>{try{K(!0);const e=await fetch(`${$}/exchange-rates/current`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(e.ok){const n=await e.json();be(n)}else console.warn("Failed to load exchange rate")}catch(e){console.error("Error loading exchange rate:",e)}finally{K(!1)}};d.useEffect(()=>{let e=!1;async function n(){F(!0),f(null);try{await Promise.all([c(),ke(),Ne()])}catch(s){e||f(Q(s).message)}finally{e||F(!1)}}async function c(){try{const s=await fetch(`${$}/products`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}}),i=await me(s);if(!s.ok)throw ie(s.status,i);const x=Array.isArray(i?.products)?i.products:Array.isArray(i)&&!i.__nonJson?i:[];e||h(x)}catch(s){e||f(Q(s).message)}}return n(),()=>{e=!0}},[]);const p=d.useMemo(()=>m.find(e=>e._id===a.productId),[m,a.productId]),E=d.useMemo(()=>k.trim()?m.filter(e=>e.name.toLowerCase().includes(k.toLowerCase())||e.sku&&e.sku.toLowerCase().includes(k.toLowerCase())):m,[m,k]),w=parseInt(a.quantity)||0,O=parseFloat(a.priceSource==="FC"?a.priceInFC:a.unitPrice)||0,v=d.useMemo(()=>{if(O<=0)return null;try{return J(O,a.priceSource,l?.rate)}catch{return null}},[O,l?.rate,a.priceSource]),M=g.reduce((e,n)=>e+n.total,0),W=g.reduce((e,n)=>e+n.quantity,0),re=W+w,ne=W>=5,j=je||re>=5,R=g.reduce((e,n)=>(e[n.enteredCurrency]+=n.enteredPrice*n.quantity,e),{USD:0,FC:0}),L=g.length>0&&(a.isWalkIn||a.customerName.trim()!==""&&a.customerPhone.trim()!=="");function D(e){y(n=>({...n,[e.target.name]:e.target.value}))}function Se(){y(e=>({...e,isWalkIn:!e.isWalkIn,customerName:"",customerPhone:""}))}const Ce=e=>{y(n=>({...n,productId:e._id,unitPrice:e.price?e.price.toString():"",priceInFC:e.price&&l?Math.round(e.price*l.rate).toString():"",priceSource:"USD"})),z(e.name),A(!1)},$e=e=>{z(e.target.value),A(!0),e.target.value||y(n=>({...n,productId:""}))},_=(e,n)=>{const c=m.find(i=>i._id===e);if(!c)return!1;const s=g.filter(i=>i.productId===e).reduce((i,x)=>i+x.quantity,0);return Ge(c.stock,s,n)},Pe=()=>{y(e=>({...e,currencyMode:e.currencyMode==="usd"?"fc":"usd"}))},Ie=e=>{const n=parseFloat(e);y(c=>({...c,unitPrice:e,priceInFC:l&&Number.isFinite(n)?Math.round(n*l.rate).toString():"",priceSource:"USD"}))},Re=e=>{const n=parseFloat(e);y(c=>({...c,priceInFC:e,unitPrice:l&&Number.isFinite(n)?(n/l.rate).toString():"",priceSource:"FC"}))};d.useEffect(()=>{l&&y(e=>e.priceSource==="USD"&&e.unitPrice&&!e.priceInFC?{...e,priceInFC:Math.round(parseFloat(e.unitPrice)*l.rate).toString()}:e.priceSource==="FC"&&e.priceInFC&&!e.unitPrice?{...e,unitPrice:(parseFloat(e.priceInFC)/l.rate).toString()}:e)},[l]);const Fe=e=>te?r("pos.stockCount",{count:e.stock}):e.stock===0?r("pos.outOfStockShort"):e.stock<=5?r("pos.lowStockShort"):r("pos.inStockShort"),Ue=(e,n)=>{const c=e&&n>0&&_(e._id,n);if(te){const s=g.filter(x=>x.productId===e._id).reduce((x,b)=>x+b.quantity,0),i=e.stock-s;return t.jsxs("p",{className:"text-sm text-gray-600 mb-4",children:[r("pos.availableStock")," ",t.jsx("strong",{children:e.stock}),s>0&&t.jsx("span",{className:"ml-2 text-blue-600",children:r("pos.alreadyInCart",{count:s})}),n>0&&t.jsxs("span",{className:`ml-4 ${c?"text-green-600":"text-red-600"}`,children:[r("pos.remainingAfterSale")," ",i-n>=0?i-n:r("pos.notEnoughStock")]})]})}else return e.stock===0?t.jsx("p",{className:"text-sm text-red-600 mb-4",children:t.jsx("strong",{children:r("pos.outOfStock")})}):e.stock<=5?t.jsx("p",{className:"text-sm text-orange-600 mb-4",children:t.jsx("strong",{children:r("pos.lowStock")})}):n>0&&!c?t.jsx("p",{className:"text-sm text-red-600 mb-4",children:t.jsx("strong",{children:r("pos.quantityUnavailable")})}):n>0?t.jsx("p",{className:"text-sm text-green-600 mb-4",children:t.jsx("strong",{children:r("pos.stockSufficient")})}):t.jsx("p",{className:"text-sm text-green-600 mb-4",children:t.jsx("strong",{children:r("pos.inStock")})})};function ze(){if(!p){f(r("pos.selectProduct"));return}if(w<=0){f(r("pos.quantityPositive"));return}if(!v){f(r("pos.pricePositive"));return}if(Math.round(v.priceUSD*100)<Math.round((p.price??0)*100)&&re<5){f(r("pos.discountQuantityRequired"));return}if(!_(p._id,w)){f(r("pos.insufficientStock"));return}f(null);const n=v.priceUSD,c=g.findIndex(s=>s.productId===p._id&&s.enteredCurrency===v.enteredCurrency&&s.enteredPrice===v.enteredPrice&&s.exchangeRate===v.exchangeRate);if(c>=0){const s=[...g];s[c]={...s[c],quantity:s[c].quantity+w,total:(s[c].quantity+w)*s[c].unitPrice},P(s)}else P([...g,{lineId:`cart-${++xe.current}`,productId:p._id,name:p.name,quantity:w,unitPrice:n,total:w*n,referenceUnitPrice:p.price??n,...v}]);y(s=>({...s,quantity:"",unitPrice:p.price?p.price.toString():"",priceInFC:p.price&&l?Math.round(p.price*l.rate).toString():"",priceSource:"USD"})),z("")}function Ae(e){const n=g.filter(s=>s.lineId!==e),c=n.reduce((s,i)=>s+i.quantity,0);P(c>=5?n:n.map(s=>{if(Math.round(s.priceUSD*100)>=Math.round(s.referenceUnitPrice*100))return s;const i=J(s.enteredCurrency==="FC"?Math.round(s.referenceUnitPrice*(s.exchangeRate??l?.rate??0)):s.referenceUnitPrice,s.enteredCurrency,s.exchangeRate??l?.rate);return{...s,...i,unitPrice:i.priceUSD,total:i.priceUSD*s.quantity}}))}function Me(e,n){const c=Number(n);!Number.isFinite(c)||c<=0||P(s=>s.map(i=>{if(i.lineId!==e)return i;try{const x=J(c,i.enteredCurrency,i.exchangeRate??l?.rate);return{...i,...x,unitPrice:x.priceUSD,total:x.priceUSD*i.quantity}}catch{return i}}))}function De(){const e=localStorage.getItem("authToken")||localStorage.getItem("token")||"";return e?{Authorization:`Bearer ${e}`}:{}}const qe=()=>{const e=window.open("","_blank","width=320,height=600");e&&(e.document.write(`
<html>
  <head>
    <title>${r("saleReceipt.title")}</title>
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
        font-size: 12px;
        font-weight: bold;
        line-height: 1.2;
        width: 80mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .receipt-container {
        width: 78mm;
        margin: 0 auto;
        padding: 1mm 2mm;
        border: none;
        text-align: center;
        position: relative;
      }
      .logo-watermark {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: url('${window.location.origin}/newlogo.png');
        background-repeat: no-repeat;
        background-position: center;
        background-size: 65%;
        opacity: 0.18;
        pointer-events: none;
        z-index: 0;
      }
      .content-wrapper {
        position: relative;
        z-index: 1;
      }
      .header {
        text-align: center;
        margin-bottom: 2mm;
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
        font-size: 10px;
        margin-bottom: 0.3mm;
        line-height: 1.2;
        font-weight: bold;
      }
      .receipt-info {
        margin: 2mm 0;
        padding: 1mm 2mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
        text-align: left;
      }
      .receipt-title {
        font-size: 11px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm 2mm;
        border-radius: 2px;
        text-align: center;
      }
      .items-section {
        margin: 0;
        padding: 0;
        background-color: #fafafa;
        border: none;
        border-top: none;
      }
      .items-col-header {
        display: flex;
        justify-content: space-between;
        background-color: #e0e0e0;
        padding: 1mm 2mm;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 10px;
        margin: 0;
        border-bottom: 1px solid #999;
      }
      .col-article {
        flex: 2;
        text-align: left;
      }
      .col-qte {
        width: 10mm;
        text-align: center;
      }
      .col-pu {
        width: 18mm;
        text-align: right;
      }
      .col-pt {
        width: 18mm;
        text-align: right;
      }
      .item-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0.5mm 2mm;
        border-bottom: 1px dotted #ddd;
        font-size: 10px;
      }
      .item-name {
        flex: 2;
        text-align: left;
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 1mm;
      }
      .item-quantity {
        width: 10mm;
        text-align: center;
        font-weight: bold;
      }
      .item-unit-price {
        width: 18mm;
        text-align: right;
        font-weight: bold;
      }
      .item-line-total {
        width: 18mm;
        text-align: right;
        font-weight: bold;
      }
      .total-section { 
        font-weight: bold; 
        margin-top: 2mm;
        padding: 1mm 2mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        font-size: 11px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 11px;
        color: #000;
      }
      .footer { 
        text-align: center; 
        margin-top: 2mm; 
        font-size: 10px;
        font-weight: bold;
        padding: 1mm 2mm;
        background-color: #f8f8f8;
        border-top: 1px dashed #000;
      }
      .sales-person {
        margin-top: 2mm;
        text-align: center;
        font-weight: bold;
        font-size: 10px;
        padding: 1mm 2mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 2px;
      }
      .customer-info {
        margin: 2mm 0;
        padding: 1mm 2mm;
        font-weight: bold;
        text-align: left;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-size: 10px;
      }
      .customer-field {
        margin-bottom: 0.3mm;
        font-size: 10px;
      }
      .separator {
        border-top: 1px dashed #000;
        margin: 1mm 0;
      }
      .cut-line {
        text-align: center;
        margin: 2mm 0 0 0;
        font-weight: bold;
        font-size: 10px;
        color: #000;
        letter-spacing: 1px;
      }
      .thank-you {
        font-weight: bold;
        margin: 0.5mm 0;
        font-size: 10px;
      }
      .warning {
        font-size: 9px;
        color: #000;
        margin: 0.3mm 0;
        font-weight: bold;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
        margin: 1mm 0;
      }
      @media print {
        @page {
          margin: 0 !important;
          size: 80mm auto !important;
        }
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 80mm !important;
          font-size: 12px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .receipt-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 1mm 2mm !important;
          width: 78mm !important;
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
      <div class="logo-watermark"></div>
      <div class="content-wrapper">
      <div class="header">
        <div class="shop-name"><strong>${o.shopName}</strong></div>
        <div class="shop-details"><strong>${o.shopAddress}</strong></div>
        <div class="shop-details">${r("saleReceipt.tel")}: <strong>${o.shopNumber}</strong></div>
        <div class="shop-details"><strong>${o.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">${r("saleReceipt.date")}: <strong>${o.date}</strong></div>
        <div class="shop-details">${r("saleReceipt.receiptNo")}: <strong>${o.receiptNumber}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">${r("saleReceipt.customer")}: <strong>${o.customerName.toUpperCase()}</strong></div>
        ${o.customerPhone?`<div class="customer-field">${r("saleReceipt.phone")}: <strong>${o.customerPhone}</strong></div>`:""}
      </div>

      <div class="receipt-title">${r("saleReceipt.itemsBought")}</div>
      
      <div class="items-col-header">
        <span class="col-article">${r("saleReceipt.item")}</span>
        <span class="col-qte">${r("saleReceipt.qty")}</span>
      </div>
      
      <div class="items-section">
      ${o.items.map(n=>`
        <div class="item-row" style="flex-wrap:wrap">
          <div class="item-name"><strong>${n.name}</strong></div>
          <div class="item-quantity"><strong>${n.quantity}</strong></div>
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${n.quantity} x ${le(n,o.exchangeRate)} = ${de(n,o.exchangeRate)}</strong></div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>${r("saleReceipt.subtotal")}:</strong></div>
          <div><strong>${G(o.total,o.items,o.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>${r("saleReceipt.total")}:</strong></div>
          <div><strong>${G(o.total,o.items,o.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>${r("saleReceipt.payment")}:</strong></div>
          <div class="payment-method"><strong>${ce(o.paymentMethod)}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        ${r("saleReceipt.agent")}: <strong>${o.salesPerson.toUpperCase()}</strong>
      </div>

      <div class="footer">
        <div class="thank-you"><strong>${o.receiptFooter||r("saleReceipt.thanks")}</strong></div>
        <div class="warning"><strong>${r("saleReceipt.noExchange")}</strong></div>
        <div class="warning"><strong>${r("saleReceipt.noRefund")}</strong></div>
      </div>

      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
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
`),e.document.close())},Te=()=>{const e=window.open("","_blank","width=320,height=600");e&&(e.document.write(`
<html>
  <head>
    <title>${r("saleReceipt.stubTitle")}</title>
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
        font-size: 12px;
        font-weight: bold;
        line-height: 1.2;
        width: 80mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .stub-container {
        width: 78mm;
        margin: 0 auto;
        padding: 1mm 2mm;
        border: none;
        text-align: center;
        position: relative;
      }
      .logo-watermark {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: url('${window.location.origin}/newlogo.png');
        background-repeat: no-repeat;
        background-position: center;
        background-size: 65%;
        opacity: 0.18;
        pointer-events: none;
        z-index: 0;
      }
      .content-wrapper {
        position: relative;
        z-index: 1;
      }
      .header {
        text-align: center;
        margin-bottom: 2mm;
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
        font-size: 10px;
        margin-bottom: 0.3mm;
        line-height: 1.2;
        font-weight: bold;
      }
      .receipt-info {
        margin: 2mm 0;
        padding: 1mm 2mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
        text-align: left;
      }
      .receipt-title {
        font-size: 11px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm 2mm;
        border-radius: 2px;
        text-align: center;
      }
      .stub-number {
        font-size: 11px;
        font-weight: bold;
        margin: 2mm 0;
        text-transform: uppercase;
        background-color: #333;
        color: white;
        padding: 1mm 2mm;
        border-radius: 3px;
      }
      .items-section {
        margin: 0;
        padding: 0;
        background-color: #fafafa;
        border: none;
        border-top: none;
      }
      .items-col-header {
        display: flex;
        justify-content: space-between;
        background-color: #e0e0e0;
        padding: 1mm 2mm;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 10px;
        margin: 0;
        border-bottom: 1px solid #999;
      }
      .col-article {
        flex: 2;
        text-align: left;
      }
      .col-qte {
        width: 10mm;
        text-align: center;
      }
      .col-pu {
        width: 18mm;
        text-align: right;
      }
      .col-pt {
        width: 18mm;
        text-align: right;
      }
      .item-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0.5mm 2mm;
        border-bottom: 1px dotted #ddd;
        font-size: 10px;
      }
      .item-name {
        flex: 2;
        text-align: left;
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 1mm;
      }
      .item-quantity {
        width: 10mm;
        text-align: center;
        font-weight: bold;
      }
      .item-unit-price {
        width: 18mm;
        text-align: right;
        font-weight: bold;
      }
      .item-line-total {
        width: 18mm;
        text-align: right;
        font-weight: bold;
      }
      .total-section { 
        font-weight: bold; 
        margin-top: 2mm;
        padding: 1mm 2mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        font-size: 11px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 11px;
      }
      .stub-footer { 
        text-align: center; 
        margin-top: 2mm; 
        font-size: 10px;
        font-weight: bold;
        padding: 1mm 2mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 3px;
      }
      .sales-person {
        margin-top: 2mm;
        text-align: center;
        font-weight: bold;
        font-size: 10px;
        padding: 1mm 2mm;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 2px;
      }
      .customer-info {
        margin: 2mm 0;
        padding: 1mm 2mm;
        font-weight: bold;
        text-align: left;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-size: 10px;
      }
      .customer-field {
        margin-bottom: 0.3mm;
        font-size: 10px;
      }
      .separator {
        border-top: 1px dashed #000;
        margin: 1mm 0;
      }
      .cut-line {
        text-align: center;
        margin: 2mm 0 0 0;
        font-weight: bold;
        font-size: 10px;
        color: #000;
        letter-spacing: 1px;
      }
      .thank-you {
        font-weight: bold;
        margin: 0.5mm 0;
        font-size: 10px;
      }
      .warning {
        font-size: 9px;
        color: #000;
        margin: 0.3mm 0;
        font-weight: bold;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
        margin: 1mm 0;
      }
      @media print {
        @page {
          margin: 0 !important;
          size: 80mm auto !important;
        }
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 80mm !important;
          font-size: 12px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .stub-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 1mm 2mm !important;
          width: 78mm !important;
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
      <div class="logo-watermark"></div>
      <div class="content-wrapper">
      <div class="header">
        <div class="shop-name"><strong>${o.shopName}</strong></div>
        <div class="shop-details"><strong>${o.shopAddress}</strong></div>
        <div class="shop-details">${r("saleReceipt.tel")}: <strong>${o.shopNumber}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">${r("saleReceipt.date")}: <strong>${o.date}</strong></div>
        <div class="shop-details">${r("saleReceipt.receiptNo")}: <strong>${o.receiptNumber}</strong></div>
      </div>
      
      <div class="stub-number">
        ${r("saleReceipt.stubNo")}<strong>${o.stubNumber}</strong>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">${r("saleReceipt.customer")}: <strong>${o.customerName.toUpperCase()}</strong></div>
        ${o.customerPhone?`<div class="customer-field">${r("saleReceipt.phone")}: <strong>${o.customerPhone}</strong></div>`:""}
      </div>

      <div class="receipt-title">${r("saleReceipt.itemsSold")}</div>
      
      <div class="items-col-header">
        <span class="col-article">${r("saleReceipt.item")}</span>
        <span class="col-qte">${r("saleReceipt.qty")}</span>
      </div>
      
      <div class="items-section">
      ${o.items.map(n=>`
        <div class="item-row" style="flex-wrap:wrap">
          <div class="item-name"><strong>${n.name}</strong></div>
          <div class="item-quantity"><strong>${n.quantity}</strong></div>
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${n.quantity} x ${le(n,o.exchangeRate)} = ${de(n,o.exchangeRate)}</strong></div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>${r("saleReceipt.saleTotal")}:</strong></div>
          <div><strong>${G(o.total,o.items,o.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>${r("saleReceipt.payment")}:</strong></div>
          <div class="payment-method"><strong>${ce(o.paymentMethod)}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        ${r("saleReceipt.agent")}: <strong>${o.salesPerson.toUpperCase()}</strong>
      </div>

      <div class="stub-footer">
        <div class="thank-you"><strong>${r("saleReceipt.stubFooter")}</strong></div>
        <div class="warning"><strong>${o.shopName}</strong></div>
        <div class="warning"><strong>${r("saleReceipt.keepStub")}</strong></div>
        <div class="warning">${r("saleReceipt.receiptNoShort")}: <strong>${o.receiptNumber}</strong></div>
        <div class="warning">${r("saleReceipt.dateShort")}: <strong>${o.date}</strong></div>
      </div>

      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
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
`),e.document.close())},se=()=>{qe(),setTimeout(()=>{Te()},2e3)},Ee=async e=>{try{return console.log("Attempting ESC/POS printing..."),await pe.printReceipt(e,"sale"),await pe.printStub(e,"sale"),console.log("ESC/POS printing successful"),!0}catch(n){return console.error("ESC/POS printing failed, falling back to browser printing:",n),se(),!1}};d.useEffect(()=>{if(o){const e=setTimeout(async()=>{try{await Ee(o)}catch(n){console.error("Printing failed:",n),se()}},500);return()=>clearTimeout(e)}},[o]);async function Oe(e){if(e.preventDefault(),!(!L||U||q.current)){q.current=!0,V(!0),Z(null),f(null);try{const n={customer:a.isWalkIn?void 0:{name:a.customerName,phone:a.customerPhone,email:""},isWalkIn:a.isWalkIn,items:g.map(b=>({productId:b.productId,name:b.name,quantity:b.quantity,price:b.unitPrice,enteredPrice:b.enteredPrice,enteredCurrency:b.enteredCurrency,priceUSD:b.priceUSD,priceFC:b.priceFC,exchangeRate:b.exchangeRate})),subtotal:M,total:M,paymentMethod:et(a.paymentMethod),salesPerson:S?.username||"unknown",exchangeRate:g[0]?.exchangeRate??l?.rate},c=await fetch(`${$}/sales`,{method:"POST",headers:{"Content-Type":"application/json",...De()},body:JSON.stringify(n)}),s=await me(c);if(!c.ok)throw ie(c.status,s);const i=s.saleId||s._id,x={shopName:I.shopName,shopAddress:I.shopAddress,shopNumber:I.shopNumber,shopRegistration:I.shopRegistration,receiptFooter:I.receiptFooter,customerName:a.isWalkIn?r("pos.walkIn"):a.customerName,customerPhone:a.isWalkIn?"":a.customerPhone,items:Array.isArray(s.items)?s.items:g,total:Number(s.total??M),exchangeRate:s.exchangeRate??n.exchangeRate,paymentMethod:a.paymentMethod,salesPerson:S?.username||r("pos.agent"),date:Qe(),receiptNumber:i,stubNumber:i};fe(x),y({productId:"",quantity:"",unitPrice:"",priceInFC:"",customerName:"",customerPhone:"",isWalkIn:!1,paymentMethod:a.paymentMethod,currencyMode:"fc",priceSource:"USD"}),P([]),z(""),Z(r("pos.saleDonePrinting")),Je(r("pos.saleRecorded"))}catch(n){f(Q(n).message)}finally{q.current=!1,V(!1)}}}const oe=p&&w>0&&v!==null&&_(p._id,w);return t.jsx("div",{className:"pos-page flex-1 p-6 overflow-auto",children:t.jsxs("div",{className:"pos-shell max-w-7xl mx-auto",children:[t.jsx("div",{className:"mb-6",children:t.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",children:[t.jsxs("div",{children:[t.jsx("h2",{className:"text-2xl font-bold text-gray-900",children:ae.pos.label}),t.jsx("p",{className:"text-gray-600 mt-1",children:ae.pos.description})]}),t.jsx("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4 w-full min-w-0 sm:w-auto sm:min-w-[280px]",children:t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsx(Xe,{className:"w-5 h-5 text-blue-600"}),t.jsx("span",{className:"font-semibold text-blue-900",children:r("pos.todayRate")})]}),ye?t.jsx(B,{className:"w-4 h-4 animate-spin text-blue-600"}):l?t.jsxs("div",{className:"text-right",children:[t.jsxs("div",{className:"font-bold text-blue-800 text-lg",children:["1 USD = ",new Intl.NumberFormat(ge()).format(l.rate)," FC"]}),t.jsx("div",{className:"text-xs text-blue-600",children:r("pos.effectiveSince",{date:_e(l.effectiveFrom)})})]}):t.jsx("span",{className:"text-red-600 text-sm",children:r("pos.rateUnavailable")})]})})]})}),Y&&t.jsx("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded",children:Y}),ee&&t.jsx("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded",children:ee}),t.jsxs("div",{className:"pos-workspace",children:[t.jsxs("div",{className:"pos-catalog-panel bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200",children:[t.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:r("pos.addItems")}),t.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4 mb-6",children:[t.jsxs("div",{className:"relative",ref:T,children:[t.jsx("label",{htmlFor:"new-sale-articles",className:"block mb-2 font-medium text-gray-700",children:r("pos.items")}),t.jsxs("div",{className:"relative",children:[t.jsx(Ye,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),t.jsx("input",{id:"new-sale-articles",type:"text",value:k,onChange:$e,onFocus:()=>A(!0),placeholder:r("pos.searchPlaceholder"),className:"w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",disabled:u||m.length===0})]}),X&&E.length>0&&t.jsx("div",{className:"absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto",children:E.map(e=>t.jsxs("div",{className:"px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0",onClick:()=>Ce(e),children:[t.jsx("div",{className:"font-medium text-gray-900",children:e.name}),t.jsxs("div",{className:"text-sm text-gray-600 flex justify-between",children:[t.jsx("span",{children:e.sku&&r("pos.sku",{sku:e.sku})}),t.jsx("span",{className:e.stock===0?"text-red-600":e.stock<=5?"text-orange-600":"text-green-600",children:Fe(e)})]})]},e._id))}),X&&k&&E.length===0&&t.jsx("div",{className:"absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500",children:r("pos.noItemFound")})]}),t.jsxs("div",{children:[t.jsx("label",{htmlFor:"new-sale-quantity",className:"block mb-2 font-medium text-gray-700",children:r("pos.quantity")}),t.jsx("input",{id:"new-sale-quantity",type:"number",name:"quantity",value:a.quantity,onChange:D,placeholder:r("pos.quantityPlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:1})]}),t.jsxs("div",{children:[t.jsxs("div",{className:"flex items-center justify-between mb-2",children:[t.jsx("label",{htmlFor:"new-sale-unit-price",className:"block font-medium text-gray-700",children:r("pos.unitPrice")}),t.jsxs("button",{type:"button",onClick:Pe,className:"flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors",children:[t.jsx(Ze,{className:"w-3 h-3"}),a.currencyMode==="usd"?"USD → FC":"FC → USD"]})]}),!j&&t.jsx("p",{className:"text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-2",children:r("pos.discountLocked")}),a.currencyMode==="usd"?t.jsx("input",{id:"new-sale-unit-price",type:"number",step:"0.01",name:"unitPrice",value:a.unitPrice,onChange:e=>j&&Ie(e.target.value),readOnly:!j,placeholder:p?.price?r("pos.priceExample",{price:p.price}):r("pos.priceUsdPlaceholder"),className:`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${j?"border-gray-300":"bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500"}`,min:.01}):t.jsx("input",{id:"new-sale-unit-price",type:"number",name:"priceInFC",value:a.priceInFC,onChange:e=>j&&Re(e.target.value),readOnly:!j,placeholder:r("pos.priceFcPlaceholder"),className:`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${j?"border-gray-300":"bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500"}`,min:1}),a.unitPrice&&a.currencyMode==="usd"&&l&&t.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",C(parseFloat(a.unitPrice)*l.rate)]}),a.priceInFC&&a.currencyMode==="fc"&&l&&t.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",N(parseFloat(a.priceInFC)/l.rate)]})]})]}),p&&Ue(p,w),t.jsxs("button",{type:"button",onClick:ze,disabled:!oe,className:`w-full sm:w-auto px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${oe?"bg-blue-600 hover:bg-blue-700 text-white shadow-sm":"bg-gray-400 cursor-not-allowed text-white"} transition-colors`,children:[t.jsx(B,{className:"w-4 h-4"}),r("pos.addToCart")]}),g.length>0&&t.jsxs("div",{className:"mt-6",children:[t.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:r("pos.cartItems")}),t.jsx("p",{className:"mb-3 text-sm text-gray-600",children:ne?r("pos.discountAvailable"):r("pos.discountProgress",{count:W})}),t.jsx("div",{className:"overflow-hidden rounded-lg border border-gray-200",children:t.jsxs("table",{className:"w-full",children:[t.jsx("thead",{className:"bg-gray-50",children:t.jsxs("tr",{children:[t.jsx("th",{className:"px-4 py-3 text-left text-sm font-semibold text-gray-700",children:r("pos.columns.items")}),t.jsx("th",{className:"px-4 py-3 text-center text-sm font-semibold text-gray-700",children:r("pos.columns.pieces")}),t.jsx("th",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-700",children:r("pos.columns.unitPrice")}),t.jsx("th",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-700",children:r("pos.columns.total")}),t.jsx("th",{className:"px-4 py-3 text-center text-sm font-semibold text-gray-700",children:r("common.actions")})]})}),t.jsx("tbody",{className:"divide-y divide-gray-200",children:g.map(e=>t.jsxs("tr",{className:"hover:bg-gray-50",children:[t.jsx("td",{className:"px-4 py-3 text-sm text-gray-900",children:e.name}),t.jsx("td",{className:"px-4 py-3 text-sm text-center text-gray-600",children:e.quantity}),t.jsxs("td",{className:"px-4 py-3 text-sm text-right text-gray-900",children:[ne?t.jsxs("label",{className:"block",children:[t.jsx("span",{className:"sr-only",children:r("pos.editUnitPriceNamed",{name:e.name})}),t.jsxs("div",{className:"flex items-center justify-end gap-1",children:[t.jsx("input",{type:"number",min:e.enteredCurrency==="FC"?1:.01,step:e.enteredCurrency==="FC"?1:.01,value:e.enteredPrice,onChange:n=>Me(e.lineId,n.target.value),className:"w-28 rounded-md border border-gray-300 px-2 py-1 text-right"}),t.jsx("span",{children:e.enteredCurrency})]})]}):e.enteredCurrency==="FC"?C(e.enteredPrice):N(e.enteredPrice),e.enteredCurrency==="FC"?t.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",N(e.priceUSD)]}):e.priceFC!==void 0?t.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",C(e.priceFC)]}):null]}),t.jsxs("td",{className:"px-4 py-3 text-sm text-right text-gray-900",children:[e.enteredCurrency==="FC"?C(e.enteredPrice*e.quantity):N(e.enteredPrice*e.quantity),e.enteredCurrency==="FC"?t.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",N(e.total)]}):e.priceFC!==void 0?t.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",C(e.priceFC*e.quantity)]}):null]}),t.jsx("td",{className:"px-4 py-3 text-center",children:t.jsx("button",{onClick:()=>Ae(e.lineId),className:"text-red-600 hover:text-red-800 text-sm font-medium","aria-label":r("pos.removeNamed",{name:e.name}),children:r("pos.remove")})})]},e.lineId))}),t.jsx("tfoot",{className:"bg-gray-50",children:t.jsxs("tr",{children:[t.jsx("td",{colSpan:3,className:"px-4 py-3 text-right text-sm font-semibold text-gray-900",children:r("pos.totalLabel")}),t.jsxs("td",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-900",children:[R.USD>0&&t.jsx("div",{children:N(R.USD)}),R.FC>0&&t.jsx("div",{children:C(R.FC)}),R.FC>0&&t.jsx("div",{className:"text-xs text-gray-500",children:r("pos.totalReceived",{amount:N(M)})})]}),t.jsx("td",{})]})})]})})]})]}),t.jsxs("div",{className:"pos-checkout-panel bg-white shadow-lg rounded-xl p-6 border border-gray-200",children:[t.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:r("pos.customerInfo")}),t.jsxs("label",{className:"flex items-center gap-2 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer select-none",children:[t.jsx("input",{type:"checkbox",checked:a.isWalkIn,onChange:Se,className:"w-4 h-4"}),t.jsx("span",{className:"text-sm font-medium text-gray-700",children:r("pos.walkInOption")})]}),t.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6 mb-6",children:[t.jsxs("div",{children:[t.jsxs("label",{htmlFor:"new-sale-customer-name",className:"block mb-2 font-medium text-gray-700",children:[r("pos.customerName")," ",!a.isWalkIn&&"*"]}),t.jsx("input",{id:"new-sale-customer-name",type:"text",name:"customerName",value:a.customerName,onChange:D,placeholder:a.isWalkIn?r("pos.walkIn"):r("pos.customerNamePlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400",disabled:a.isWalkIn,required:!a.isWalkIn})]}),t.jsxs("div",{children:[t.jsxs("label",{htmlFor:"new-sale-customer-phone",className:"block mb-2 font-medium text-gray-700",children:[r("pos.customerPhone")," ",!a.isWalkIn&&"*"]}),t.jsx("input",{id:"new-sale-customer-phone",type:"tel",name:"customerPhone",value:a.customerPhone,onChange:D,placeholder:a.isWalkIn?"—":r("pos.customerPhonePlaceholder"),className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400",disabled:a.isWalkIn})]}),t.jsxs("div",{children:[t.jsx("label",{htmlFor:"new-sale-payment-method",className:"block mb-2 font-medium text-gray-700",children:r("pos.paymentMethod")}),t.jsxs("select",{id:"new-sale-payment-method",name:"paymentMethod",value:a.paymentMethod,onChange:D,className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0,children:[t.jsx("option",{value:"cash",children:r("pos.payment.cash")}),t.jsx("option",{value:"mpesa",children:r("pos.payment.mpesa")}),t.jsx("option",{value:"bank",children:r("pos.payment.bank")}),t.jsx("option",{value:"card",children:r("pos.payment.card")}),t.jsx("option",{value:"other",children:r("pos.payment.other")})]})]})]}),t.jsx("button",{type:"submit",onClick:Oe,disabled:!L||U,className:`w-full sm:w-auto px-8 py-3 rounded-lg font-medium text-base sm:text-lg ${L&&!U?"bg-green-600 hover:bg-green-700 text-white shadow-sm":"bg-gray-400 cursor-not-allowed text-white"} transition-colors`,children:U?t.jsxs("span",{className:"flex items-center gap-2",children:[t.jsx(B,{className:"w-4 h-4 animate-spin"}),r("pos.saving")]}):r("pos.save")})]})]}),t.jsx("div",{ref:ve,style:{display:"none"}})]})})}export{it as default};
