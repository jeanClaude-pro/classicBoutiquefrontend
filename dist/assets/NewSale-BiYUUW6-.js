import{t as i,A as Fe,s as t,M as te,d as W,l as Ee,y as _,x as $e,g as re,o as Ae}from"./index-BalGFMsI.js";import{b as Te}from"./notify-CfYsxrlT.js";import{b as ze,f as P,d as N,c as Re,e as Ue,g as Me,m as De}from"./salePricing-B6CLvYLp.js";import{D as qe}from"./dollar-sign-B3F3Phf8.js";import{S as Oe}from"./search-CjHoRDHU.js";import{C as Le}from"./calculator-C1t_l5Sq.js";const Q=s=>`${new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(s)}FC`,ne=(s,h)=>{const u=Ue(s,h);return`${s.priceUSD.toFixed(2)}$${u===void 0?"":` / ${Q(u)}`}`},oe=(s,h)=>{const u=Me(s,h);return`${(s.priceUSD*s.quantity).toFixed(2)}$${u===void 0?"":` / ${Q(u)}`}`},B=(s,h,u)=>{const l=De(s,h,u);return`${s.toFixed(2)}$${l===void 0?"":` / ${Q(l)}`}`},I=$e;function We(s){return s==="cash"?"cash":s==="card"?"card":s==="mpesa"||s==="bank"?"transfer":"other"}async function se(s){return(s.headers.get("content-type")||"").includes("application/json")?s.json():{__nonJson:!0,text:await s.text()}}class ae{static async printReceipt(h,u="sale"){try{const l=await fetch(`${I}/print/receipt`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({receiptData:h,type:u})});if(!l.ok)throw new Error("Failed to print receipt");return(await l.json()).success}catch(l){throw console.error("Print receipt error:",l),l}}static async printStub(h,u="sale"){try{const l=await fetch(`${I}/print/stub`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({receiptData:h,type:u})});if(!l.ok)throw new Error("Failed to print stub");return(await l.json()).success}catch(l){throw console.error("Print stub error:",l),l}}}function Ge(){const[s,h]=i.useState([]),[u,l]=i.useState(!0),[k,V]=i.useState(!1),U=i.useRef(!1),[g,$]=i.useState([]),[n,ie]=i.useState(null),[c,ce]=i.useState(null),[de,H]=i.useState(!0),[S,A]=i.useState(""),[J,T]=i.useState(!1),[F,le]=i.useState({shopName:"ETS DOUBLE M CLASSIC BOUTIQUE",shopAddress:"780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",shopNumber:"+243 836 017 031",shopRegistration:"LSH/RCCM/22-A-01266",receiptFooter:"Merci pour Achat! À bientôt."}),me=i.useRef(null),M=i.useRef(null),{user:C}=Fe(),v=C?.role==="superadmin"||C?.role==="manager"||(C?.actionPermissions??[]).includes("edit_receipts"),[o,f]=i.useState({productId:"",quantity:"",unitPrice:"",priceInFC:"",customerName:"",customerPhone:"",isWalkIn:!1,paymentMethod:"cash",currencyMode:"fc",priceSource:"USD"}),[G,K]=i.useState(null),[X,b]=i.useState(null),Y=C?.role==="superadmin";i.useEffect(()=>{const e=r=>{M.current&&!M.current.contains(r.target)&&T(!1)};return document.addEventListener("mousedown",e),()=>{document.removeEventListener("mousedown",e)}},[]);const pe=async()=>{try{const e=await fetch(`${I}/settings/receipt`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(e.ok){const r=await e.json();le({shopName:r.shopName||"ETS DOUBLE M CLASSIC BOUTIQUE",shopAddress:r.shopAddress||"",shopNumber:r.shopNumber||"",shopRegistration:r.shopRegistration||"",receiptFooter:r.receiptFooter||""})}}catch(e){console.warn("Could not load shop settings, using defaults:",e)}},ue=async()=>{try{H(!0);const e=await fetch(`${I}/exchange-rates/current`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(e.ok){const r=await e.json();ce(r)}else console.warn("Failed to load exchange rate")}catch(e){console.error("Error loading exchange rate:",e)}finally{H(!1)}};i.useEffect(()=>{let e=!1;async function r(){l(!0),b(null);try{await Promise.all([a(),ue(),pe()])}catch(m){e||b(_(m).message)}finally{e||l(!1)}}async function a(){try{const m=await fetch(`${I}/products`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}}),d=await se(m);if(!m.ok)throw re(m.status,d);const y=Array.isArray(d?.products)?d.products:Array.isArray(d)&&!d.__nonJson?d:[];e||h(y)}catch(m){e||b(_(m).message)}}return r(),()=>{e=!0}},[]);const p=i.useMemo(()=>s.find(e=>e._id===o.productId),[s,o.productId]),D=i.useMemo(()=>S.trim()?s.filter(e=>e.name.toLowerCase().includes(S.toLowerCase())||e.sku&&e.sku.toLowerCase().includes(S.toLowerCase())):s,[s,S]),w=parseInt(o.quantity)||0,q=parseFloat(o.priceSource==="FC"?o.priceInFC:o.unitPrice)||0,j=i.useMemo(()=>{if(q<=0)return null;try{return ze(q,o.priceSource,c?.rate)}catch{return null}},[q,c?.rate,o.priceSource]),z=g.reduce((e,r)=>e+r.total,0),E=g.reduce((e,r)=>(e[r.enteredCurrency]+=r.enteredPrice*r.quantity,e),{USD:0,FC:0}),O=g.length>0&&(o.isWalkIn||o.customerName.trim()!==""&&o.customerPhone.trim()!=="");function R(e){f(r=>({...r,[e.target.name]:e.target.value}))}function ge(){f(e=>({...e,isWalkIn:!e.isWalkIn,customerName:"",customerPhone:""}))}const he=e=>{f(r=>({...r,productId:e._id,unitPrice:e.price?e.price.toString():"",priceInFC:e.price&&c?Math.round(e.price*c.rate).toString():"",priceSource:"USD"})),A(e.name),T(!1)},xe=e=>{A(e.target.value),T(!0),e.target.value||f(r=>({...r,productId:""}))},L=(e,r)=>{const a=s.find(d=>d._id===e);if(!a)return!1;const m=g.filter(d=>d.productId===e).reduce((d,y)=>d+y.quantity,0);return Re(a.stock,m,r)},fe=()=>{f(e=>({...e,currencyMode:e.currencyMode==="usd"?"fc":"usd"}))},be=e=>{const r=parseFloat(e);f(a=>({...a,unitPrice:e,priceInFC:c&&Number.isFinite(r)?Math.round(r*c.rate).toString():"",priceSource:"USD"}))},we=e=>{const r=parseFloat(e);f(a=>({...a,priceInFC:e,unitPrice:c&&Number.isFinite(r)?(r/c.rate).toString():"",priceSource:"FC"}))};i.useEffect(()=>{c&&f(e=>e.priceSource==="USD"&&e.unitPrice&&!e.priceInFC?{...e,priceInFC:Math.round(parseFloat(e.unitPrice)*c.rate).toString()}:e.priceSource==="FC"&&e.priceInFC&&!e.unitPrice?{...e,unitPrice:(parseFloat(e.priceInFC)/c.rate).toString()}:e)},[c]);const ye=e=>Y?`(Stock: ${e.stock})`:e.stock===0?"(En rupture)":e.stock<=5?"(Stock faible)":"(En stock)",ve=(e,r)=>{const a=e&&r>0&&L(e._id,r);if(Y){const m=g.filter(y=>y.productId===e._id).reduce((y,x)=>y+x.quantity,0),d=e.stock-m;return t.jsxs("p",{className:"text-sm text-gray-600 mb-4",children:["Stock disponible: ",t.jsx("strong",{children:e.stock}),m>0&&t.jsxs("span",{className:"ml-2 text-blue-600",children:["(Déjà dans panier: ",m,")"]}),r>0&&t.jsxs("span",{className:`ml-4 ${a?"text-green-600":"text-red-600"}`,children:["Stock restant après vente:"," ",d-r>=0?d-r:"❌ pas assez de stock!"]})]})}else return e.stock===0?t.jsx("p",{className:"text-sm text-red-600 mb-4",children:t.jsx("strong",{children:"❌ En rupture de stock"})}):e.stock<=5?t.jsx("p",{className:"text-sm text-orange-600 mb-4",children:t.jsx("strong",{children:"⚠️ Stock faible"})}):r>0&&!a?t.jsx("p",{className:"text-sm text-red-600 mb-4",children:t.jsx("strong",{children:"❌ Quantité demandée non disponible"})}):r>0?t.jsx("p",{className:"text-sm text-green-600 mb-4",children:t.jsx("strong",{children:"✅ Stock suffisant"})}):t.jsx("p",{className:"text-sm text-green-600 mb-4",children:t.jsx("strong",{children:"✅ En stock"})})};function je(){if(!p){b("Veuillez sélectionner un produit");return}if(w<=0){b("La quantité doit être supérieure à zéro");return}if(!j){b("Le prix unitaire doit être supérieur à zéro");return}if(!L(p._id,w)){b("Stock insuffisant pour ajouter cette quantité au panier");return}b(null);const e=j.priceUSD,r=g.findIndex(a=>a.productId===p._id&&a.enteredCurrency===j.enteredCurrency&&a.enteredPrice===j.enteredPrice&&a.exchangeRate===j.exchangeRate);if(r>=0){const a=[...g];a[r]={...a[r],quantity:a[r].quantity+w,total:(a[r].quantity+w)*a[r].unitPrice},$(a)}else $([...g,{productId:p._id,name:p.name,quantity:w,unitPrice:e,total:w*e,...j}]);f(a=>({...a,quantity:"",unitPrice:p.price?p.price.toString():"",priceInFC:p.price&&c?Math.round(p.price*c.rate).toString():"",priceSource:"USD"})),A("")}function Ne(e){const r=[...g];r.splice(e,1),$(r)}function ke(){const e=localStorage.getItem("authToken")||localStorage.getItem("token")||"";return e?{Authorization:`Bearer ${e}`}:{}}const Se=()=>{const e=window.open("","_blank","width=320,height=600");e&&(e.document.write(`
<html>
  <head>
    <title>Reçu de vente</title>
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
        <div class="shop-name"><strong>${n.shopName}</strong></div>
        <div class="shop-details"><strong>${n.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${n.shopNumber}</strong></div>
        <div class="shop-details"><strong>${n.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${n.date}</strong></div>
        <div class="shop-details">RECU #: <strong>${n.receiptNumber}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${n.customerName.toUpperCase()}</strong></div>
        ${n.customerPhone?`<div class="customer-field">TELEPHONE: <strong>${n.customerPhone}</strong></div>`:""}
      </div>

      <div class="receipt-title">ARTICLES ACHETES</div>
      
      <div class="items-col-header">
        <span class="col-article">Article</span>
        <span class="col-qte">Qte</span>
      </div>
      
      <div class="items-section">
      ${n.items.map(r=>`
        <div class="item-row" style="flex-wrap:wrap">
          <div class="item-name"><strong>${r.name}</strong></div>
          <div class="item-quantity"><strong>${r.quantity}</strong></div>
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${r.quantity} x ${ne(r,n.exchangeRate)} = ${oe(r,n.exchangeRate)}</strong></div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>SOUS-TOTAL:</strong></div>
          <div><strong>${B(n.total,n.items,n.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>TOTAL:</strong></div>
          <div><strong>${B(n.total,n.items,n.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${n.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${n.salesPerson.toUpperCase()}</strong>
      </div>

      <div class="footer">
        <div class="thank-you"><strong>${n.receiptFooter||"MERCI POUR VOTRE ACHAT !"}</strong></div>
        <div class="warning"><strong>Article non echangeable</strong></div>
        <div class="warning"><strong>Non remboursable</strong></div>
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
`),e.document.close())},Ce=()=>{const e=window.open("","_blank","width=320,height=600");e&&(e.document.write(`
<html>
  <head>
    <title>Souche de vente</title>
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
        <div class="shop-name"><strong>${n.shopName}</strong></div>
        <div class="shop-details"><strong>${n.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${n.shopNumber}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${n.date}</strong></div>
        <div class="shop-details">RECU #: <strong>${n.receiptNumber}</strong></div>
      </div>
      
      <div class="stub-number">
        SOUCHE N°<strong>${n.stubNumber}</strong>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${n.customerName.toUpperCase()}</strong></div>
        ${n.customerPhone?`<div class="customer-field">TELEPHONE: <strong>${n.customerPhone}</strong></div>`:""}
      </div>

      <div class="receipt-title">ARTICLES VENDUS</div>
      
      <div class="items-col-header">
        <span class="col-article">Article</span>
        <span class="col-qte">Qte</span>
      </div>
      
      <div class="items-section">
      ${n.items.map(r=>`
        <div class="item-row" style="flex-wrap:wrap">
          <div class="item-name"><strong>${r.name}</strong></div>
          <div class="item-quantity"><strong>${r.quantity}</strong></div>
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${r.quantity} x ${ne(r,n.exchangeRate)} = ${oe(r,n.exchangeRate)}</strong></div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>TOTAL VENTE:</strong></div>
          <div><strong>${B(n.total,n.items,n.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${n.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${n.salesPerson.toUpperCase()}</strong>
      </div>

      <div class="stub-footer">
        <div class="thank-you"><strong>SOUCHE DE CAISSE</strong></div>
        <div class="warning"><strong>${n.shopName}</strong></div>
        <div class="warning"><strong>Conserver cette souche</strong></div>
        <div class="warning">Recu #: <strong>${n.receiptNumber}</strong></div>
        <div class="warning">Date: <strong>${n.date}</strong></div>
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
`),e.document.close())},Z=()=>{Se(),setTimeout(()=>{Ce()},2e3)},Pe=async e=>{try{return console.log("Attempting ESC/POS printing..."),await ae.printReceipt(e,"sale"),await ae.printStub(e,"sale"),console.log("ESC/POS printing successful"),!0}catch(r){return console.error("ESC/POS printing failed, falling back to browser printing:",r),Z(),!1}};i.useEffect(()=>{if(n){const e=setTimeout(async()=>{try{await Pe(n)}catch(r){console.error("Printing failed:",r),Z()}},500);return()=>clearTimeout(e)}},[n]);async function Ie(e){if(e.preventDefault(),!(!O||k||U.current)){U.current=!0,V(!0),K(null),b(null);try{const r={customer:o.isWalkIn?void 0:{name:o.customerName,phone:o.customerPhone,email:""},isWalkIn:o.isWalkIn,items:g.map(x=>({productId:x.productId,name:x.name,quantity:x.quantity,price:x.unitPrice,enteredPrice:x.enteredPrice,enteredCurrency:x.enteredCurrency,priceUSD:x.priceUSD,priceFC:x.priceFC,exchangeRate:x.exchangeRate})),subtotal:z,total:z,paymentMethod:We(o.paymentMethod),salesPerson:C?.username||"unknown",exchangeRate:g[0]?.exchangeRate??c?.rate},a=await fetch(`${I}/sales`,{method:"POST",headers:{"Content-Type":"application/json",...ke()},body:JSON.stringify(r)}),m=await se(a);if(!a.ok)throw re(a.status,m);const d=m.saleId||m._id,y={shopName:F.shopName,shopAddress:F.shopAddress,shopNumber:F.shopNumber,shopRegistration:F.shopRegistration,receiptFooter:F.receiptFooter,customerName:o.isWalkIn?"Client de passage":o.customerName,customerPhone:o.isWalkIn?"":o.customerPhone,items:g,total:z,paymentMethod:o.paymentMethod,salesPerson:C?.username||"Agent",date:Ae(),receiptNumber:d,stubNumber:d};ie(y),f({productId:"",quantity:"",unitPrice:"",priceInFC:"",customerName:"",customerPhone:"",isWalkIn:!1,paymentMethod:o.paymentMethod,currencyMode:"fc",priceSource:"USD"}),$([]),A(""),K("✅ Vente effectuée avec succès ! Impression du reçu et de la souche..."),Te("Vente enregistrée avec succès.")}catch(r){b(_(r).message)}finally{U.current=!1,V(!1)}}}const ee=p&&w>0&&j!==null&&L(p._id,w);return t.jsx("div",{className:"pos-page flex-1 p-6 overflow-auto",children:t.jsxs("div",{className:"pos-shell max-w-7xl mx-auto",children:[t.jsx("div",{className:"mb-6",children:t.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",children:[t.jsxs("div",{children:[t.jsx("h2",{className:"text-2xl font-bold text-gray-900",children:te.pos.label}),t.jsx("p",{className:"text-gray-600 mt-1",children:te.pos.description})]}),t.jsx("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4 w-full min-w-0 sm:w-auto sm:min-w-[280px]",children:t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsx(qe,{className:"w-5 h-5 text-blue-600"}),t.jsx("span",{className:"font-semibold text-blue-900",children:"Taux du jour:"})]}),de?t.jsx(W,{className:"w-4 h-4 animate-spin text-blue-600"}):c?t.jsxs("div",{className:"text-right",children:[t.jsxs("div",{className:"font-bold text-blue-800 text-lg",children:["1 USD = ",new Intl.NumberFormat("fr-FR").format(c.rate)," FC"]}),t.jsxs("div",{className:"text-xs text-blue-600",children:["Effectif depuis ",Ee(c.effectiveFrom)]})]}):t.jsx("span",{className:"text-red-600 text-sm",children:"Taux non disponible"})]})})]})}),G&&t.jsx("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded",children:G}),X&&t.jsx("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded",children:X}),t.jsxs("div",{className:"pos-workspace",children:[t.jsxs("div",{className:"pos-catalog-panel bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200",children:[t.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:"Ajouter les articles"}),t.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4 mb-6",children:[t.jsxs("div",{className:"relative",ref:M,children:[t.jsx("label",{htmlFor:"new-sale-articles",className:"block mb-2 font-medium text-gray-700",children:"Articles"}),t.jsxs("div",{className:"relative",children:[t.jsx(Oe,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),t.jsx("input",{id:"new-sale-articles",type:"text",value:S,onChange:xe,onFocus:()=>T(!0),placeholder:"Rechercher un article...",className:"w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",disabled:u||s.length===0})]}),J&&D.length>0&&t.jsx("div",{className:"absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto",children:D.map(e=>t.jsxs("div",{className:"px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0",onClick:()=>he(e),children:[t.jsx("div",{className:"font-medium text-gray-900",children:e.name}),t.jsxs("div",{className:"text-sm text-gray-600 flex justify-between",children:[t.jsx("span",{children:e.sku&&`SKU: ${e.sku}`}),t.jsx("span",{className:e.stock===0?"text-red-600":e.stock<=5?"text-orange-600":"text-green-600",children:ye(e)})]})]},e._id))}),J&&S&&D.length===0&&t.jsx("div",{className:"absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500",children:"Aucun article trouvé"})]}),t.jsxs("div",{children:[t.jsx("label",{htmlFor:"new-sale-quantity",className:"block mb-2 font-medium text-gray-700",children:"Nombre de pièces"}),t.jsx("input",{id:"new-sale-quantity",type:"number",name:"quantity",value:o.quantity,onChange:R,placeholder:"Entrer le nombre de pièces",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:1})]}),t.jsxs("div",{children:[t.jsxs("div",{className:"flex items-center justify-between mb-2",children:[t.jsx("label",{htmlFor:"new-sale-unit-price",className:"block font-medium text-gray-700",children:"Prix unitaire"}),t.jsxs("button",{type:"button",onClick:fe,className:"flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors",children:[t.jsx(Le,{className:"w-3 h-3"}),o.currencyMode==="usd"?"USD → FC":"FC → USD"]})]}),!v&&t.jsx("p",{className:"text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-2",children:"Prix verrouillé — permission requise pour modifier les prix."}),o.currencyMode==="usd"?t.jsx("input",{id:"new-sale-unit-price",type:"number",step:"0.01",name:"unitPrice",value:o.unitPrice,onChange:e=>v&&be(e.target.value),readOnly:!v,placeholder:p?.price?`ex: ${p.price}`:"Entrer le prix en USD",className:`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${v?"border-gray-300":"bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500"}`,min:.01}):t.jsx("input",{id:"new-sale-unit-price",type:"number",name:"priceInFC",value:o.priceInFC,onChange:e=>v&&we(e.target.value),readOnly:!v,placeholder:"Entrer le prix en FC",className:`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${v?"border-gray-300":"bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500"}`,min:1}),o.unitPrice&&o.currencyMode==="usd"&&c&&t.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",P(parseFloat(o.unitPrice)*c.rate)]}),o.priceInFC&&o.currencyMode==="fc"&&c&&t.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",N(parseFloat(o.priceInFC)/c.rate)]})]})]}),p&&ve(p,w),t.jsxs("button",{type:"button",onClick:je,disabled:!ee,className:`w-full sm:w-auto px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${ee?"bg-blue-600 hover:bg-blue-700 text-white shadow-sm":"bg-gray-400 cursor-not-allowed text-white"} transition-colors`,children:[t.jsx(W,{className:"w-4 h-4"}),"Ajouter au panier"]}),g.length>0&&t.jsxs("div",{className:"mt-6",children:[t.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:"Articles du panier"}),t.jsx("div",{className:"overflow-hidden rounded-lg border border-gray-200",children:t.jsxs("table",{className:"w-full",children:[t.jsx("thead",{className:"bg-gray-50",children:t.jsxs("tr",{children:[t.jsx("th",{className:"px-4 py-3 text-left text-sm font-semibold text-gray-700",children:"Articles"}),t.jsx("th",{className:"px-4 py-3 text-center text-sm font-semibold text-gray-700",children:"Pièces"}),t.jsx("th",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-700",children:"Prix unitaire"}),t.jsx("th",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-700",children:"Total"}),t.jsx("th",{className:"px-4 py-3 text-center text-sm font-semibold text-gray-700",children:"Actions"})]})}),t.jsx("tbody",{className:"divide-y divide-gray-200",children:g.map((e,r)=>t.jsxs("tr",{className:"hover:bg-gray-50",children:[t.jsx("td",{className:"px-4 py-3 text-sm text-gray-900",children:e.name}),t.jsx("td",{className:"px-4 py-3 text-sm text-center text-gray-600",children:e.quantity}),t.jsxs("td",{className:"px-4 py-3 text-sm text-right text-gray-900",children:[e.enteredCurrency==="FC"?P(e.enteredPrice):N(e.enteredPrice),e.enteredCurrency==="FC"?t.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",N(e.priceUSD)]}):e.priceFC!==void 0?t.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",P(e.priceFC)]}):null]}),t.jsxs("td",{className:"px-4 py-3 text-sm text-right text-gray-900",children:[e.enteredCurrency==="FC"?P(e.enteredPrice*e.quantity):N(e.enteredPrice*e.quantity),e.enteredCurrency==="FC"?t.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",N(e.total)]}):e.priceFC!==void 0?t.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",P(e.priceFC*e.quantity)]}):null]}),t.jsx("td",{className:"px-4 py-3 text-center",children:t.jsx("button",{onClick:()=>Ne(r),className:"text-red-600 hover:text-red-800 text-sm font-medium",children:"Enlever"})})]},r))}),t.jsx("tfoot",{className:"bg-gray-50",children:t.jsxs("tr",{children:[t.jsx("td",{colSpan:3,className:"px-4 py-3 text-right text-sm font-semibold text-gray-900",children:"Total:"}),t.jsxs("td",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-900",children:[E.USD>0&&t.jsx("div",{children:N(E.USD)}),E.FC>0&&t.jsx("div",{children:P(E.FC)}),E.FC>0&&t.jsxs("div",{className:"text-xs text-gray-500",children:["Total reçu ≈ ",N(z)]})]}),t.jsx("td",{})]})})]})})]})]}),t.jsxs("div",{className:"pos-checkout-panel bg-white shadow-lg rounded-xl p-6 border border-gray-200",children:[t.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:"Informations du client"}),t.jsxs("label",{className:"flex items-center gap-2 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer select-none",children:[t.jsx("input",{type:"checkbox",checked:o.isWalkIn,onChange:ge,className:"w-4 h-4"}),t.jsx("span",{className:"text-sm font-medium text-gray-700",children:"Client de passage (vente sans coordonnées client)"})]}),t.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6 mb-6",children:[t.jsxs("div",{children:[t.jsxs("label",{htmlFor:"new-sale-customer-name",className:"block mb-2 font-medium text-gray-700",children:["Nom du client ",!o.isWalkIn&&"*"]}),t.jsx("input",{id:"new-sale-customer-name",type:"text",name:"customerName",value:o.customerName,onChange:R,placeholder:o.isWalkIn?"Client de passage":"Entrer le nom du client",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400",disabled:o.isWalkIn,required:!o.isWalkIn})]}),t.jsxs("div",{children:[t.jsxs("label",{htmlFor:"new-sale-customer-phone",className:"block mb-2 font-medium text-gray-700",children:["Numéro de téléphone du client ",!o.isWalkIn&&"*"]}),t.jsx("input",{id:"new-sale-customer-phone",type:"tel",name:"customerPhone",value:o.customerPhone,onChange:R,placeholder:o.isWalkIn?"—":"Entrer le numéro de téléphone",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400",disabled:o.isWalkIn})]}),t.jsxs("div",{children:[t.jsx("label",{htmlFor:"new-sale-payment-method",className:"block mb-2 font-medium text-gray-700",children:"Méthode de paiement"}),t.jsxs("select",{id:"new-sale-payment-method",name:"paymentMethod",value:o.paymentMethod,onChange:R,className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0,children:[t.jsx("option",{value:"cash",children:"Espèces"}),t.jsx("option",{value:"mpesa",children:"M-Pesa ou Airtel Money (Transfert)"}),t.jsx("option",{value:"bank",children:"Transfert Bank"}),t.jsx("option",{value:"card",children:"Carte Visa"}),t.jsx("option",{value:"other",children:"Autres"})]})]})]}),t.jsx("button",{type:"submit",onClick:Ie,disabled:!O||k,className:`w-full sm:w-auto px-8 py-3 rounded-lg font-medium text-base sm:text-lg ${O&&!k?"bg-green-600 hover:bg-green-700 text-white shadow-sm":"bg-gray-400 cursor-not-allowed text-white"} transition-colors`,children:k?t.jsxs("span",{className:"flex items-center gap-2",children:[t.jsx(W,{className:"w-4 h-4 animate-spin"}),"En cours d'enregistrement..."]}):"Enregistrer la vente"})]})]}),t.jsx("div",{ref:me,style:{display:"none"}})]})})}export{Ge as default};
