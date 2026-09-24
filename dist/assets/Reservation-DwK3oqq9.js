import{t as i,A as Ce,s as e,M as te,d as _,l as Re,y as V,x as Te,g as re,p as Pe,o as $e}from"./index-BalGFMsI.js";import{b as Ae}from"./notify-CfYsxrlT.js";import{b as Ie,f as A,d as I,c as Fe,e as ze,m as Me}from"./salePricing-B6CLvYLp.js";import{D as Oe}from"./dollar-sign-B3F3Phf8.js";import{S as Ue}from"./search-CjHoRDHU.js";import{C as De}from"./calculator-C1t_l5Sq.js";const ie=s=>`${new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(s)}FC`,oe=(s,f)=>{const h=ze(s,f);return`${s.priceUSD.toFixed(2)}$${h===void 0?"":` / ${ie(h)}`}`},B=(s,f,h)=>{const d=Me(s,f,h);return`${s.toFixed(2)}$${d===void 0?"":` / ${ie(d)}`}`},k=Te;function ne(s){return s==="cash"?"cash":s==="card"?"card":s==="mpesa"||s==="bank"?"transfer":"other"}async function se(s){return(s.headers.get("content-type")||"").includes("application/json")?s.json():{__nonJson:!0,text:await s.text()}}class ae{static async printReceipt(f,h="sale"){try{const d=await fetch(`${k}/print/receipt`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({receiptData:f,type:h})});if(!d.ok)throw new Error("Failed to print receipt");return(await d.json()).success}catch(d){throw console.error("Print receipt error:",d),d}}static async printStub(f,h="sale"){try{const d=await fetch(`${k}/print/stub`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({receiptData:f,type:h})});if(!d.ok)throw new Error("Failed to print stub");return(await d.json()).success}catch(d){throw console.error("Print stub error:",d),d}}}function Je(){const[s,f]=i.useState([]),[h,d]=i.useState(!0),[w,H]=i.useState(!1),F=i.useRef(!1),[p,R]=i.useState([]),[o,de]=i.useState(null),[a,ce]=i.useState(null),[le,J]=i.useState(!0),[N,T]=i.useState(""),[Q,P]=i.useState(!1),me=i.useRef(null),z=i.useRef(null),{user:$}=Ce(),[n,y]=i.useState({productId:"",quantity:"",unitPrice:"",priceInFC:"",customerName:"",customerPhone:"",customerEmail:"",paymentMethod:"cash",notes:"",currencyMode:"fc",priceSource:"USD"}),[G,W]=i.useState(null),[K,b]=i.useState(null),Z=$?.role==="superadmin";i.useEffect(()=>{const t=r=>{z.current&&!z.current.contains(r.target)&&P(!1)};return document.addEventListener("mousedown",t),()=>{document.removeEventListener("mousedown",t)}},[]);const ue=async()=>{try{J(!0);const t=await fetch(`${k}/exchange-rates/current`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(t.ok){const r=await t.json();ce(r)}else console.warn("Failed to load exchange rate")}catch(t){console.error("Error loading exchange rate:",t)}finally{J(!1)}};i.useEffect(()=>{let t=!1;async function r(){d(!0),b(null);try{await Promise.all([c(),ue()])}catch(l){t||b(V(l).message)}finally{t||d(!1)}}async function c(){try{const l=await fetch(`${k}/products`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}}),m=await se(l);if(!l.ok)throw re(l.status,m);const x=Array.isArray(m?.products)?m.products:Array.isArray(m)&&!m.__nonJson?m:[];t||f(x)}catch(l){t||b(V(l).message)}}return r(),()=>{t=!0}},[]);const u=i.useMemo(()=>s.find(t=>t._id===n.productId),[s,n.productId]),M=i.useMemo(()=>N.trim()?s.filter(t=>t.name.toLowerCase().includes(N.toLowerCase())||t.sku&&t.sku.toLowerCase().includes(N.toLowerCase())):s,[s,N]),v=parseInt(n.quantity)||0,O=parseFloat(n.priceSource==="FC"?n.priceInFC:n.unitPrice)||0,U=i.useMemo(()=>{if(O<=0)return null;try{return Ie(O,n.priceSource,a?.rate)}catch{return null}},[O,n.priceSource,a?.rate]),E=U?.priceUSD||0,pe=v*E,j=p.reduce((t,r)=>t+r.total,0),D=p.length>0&&n.customerName.trim()!==""&&n.customerPhone.trim()!=="";function S(t){y(r=>({...r,[t.target.name]:t.target.value}))}const ge=t=>{y(r=>({...r,productId:t._id,unitPrice:t.price?t.price.toString():"",priceInFC:t.price&&a?Math.round(t.price*a.rate).toString():"",priceSource:"USD"})),T(t.name),P(!1)},he=t=>{T(t.target.value),P(!0),t.target.value||y(r=>({...r,productId:""}))},L=(t,r)=>{const c=s.find(m=>m._id===t);if(!c)return!1;const l=p.filter(m=>m.productId===t).reduce((m,x)=>m+x.quantity,0);return Fe(c.stock,l,r)},xe=()=>{y(t=>({...t,currencyMode:t.currencyMode==="usd"?"fc":"usd"}))},fe=t=>Z?`(Stock: ${t.stock})`:t.stock===0?"(En rupture)":t.stock<=5?"(Stock faible)":"(En stock)",be=(t,r)=>{const c=t&&r>0&&L(t._id,r);if(Z){const l=p.filter(x=>x.productId===t._id).reduce((x,C)=>x+C.quantity,0),m=t.stock-l;return e.jsxs("p",{className:"text-sm text-gray-600 mb-4",children:["Stock disponible: ",e.jsx("strong",{children:t.stock}),l>0&&e.jsxs("span",{className:"ml-2 text-blue-600",children:["(Déjà dans panier: ",l,")"]}),r>0&&e.jsxs("span",{className:`ml-4 ${c?"text-green-600":"text-red-600"}`,children:["Stock restant après réservation:"," ",m-r>=0?m-r:"❌ pas assez de stock!"]})]})}else return t.stock===0?e.jsx("p",{className:"text-sm text-red-600 mb-4",children:e.jsx("strong",{children:"❌ En rupture de stock"})}):t.stock<=5?e.jsx("p",{className:"text-sm text-orange-600 mb-4",children:e.jsx("strong",{children:"⚠️ Stock faible"})}):r>0&&!c?e.jsx("p",{className:"text-sm text-red-600 mb-4",children:e.jsx("strong",{children:"❌ Quantité demandée non disponible"})}):r>0?e.jsx("p",{className:"text-sm text-green-600 mb-4",children:e.jsx("strong",{children:"✅ Stock suffisant"})}):e.jsx("p",{className:"text-sm text-green-600 mb-4",children:e.jsx("strong",{children:"✅ En stock"})})};function ve(){if(!u){b("Veuillez sélectionner un produit");return}if(v<=0){b("La quantité doit être supérieure à zéro");return}if(!U){b("Le prix unitaire doit être supérieur à zéro");return}if(!L(u._id,v)){b("Stock insuffisant pour ajouter cette quantité au panier");return}b(null);const t=p.findIndex(r=>r.productId===u._id&&r.unitPrice===E);if(t>=0){const r=[...p];r[t]={...r[t],quantity:r[t].quantity+v,total:(r[t].quantity+v)*E},R(r)}else R([...p,{productId:u._id,name:u.name,quantity:v,unitPrice:E,total:pe,...U}]);y(r=>({...r,quantity:"",unitPrice:u.price?u.price.toString():"",priceInFC:u.price&&a?Math.round(u.price*a.rate).toString():"",priceSource:"USD"})),T("")}function ye(t){const r=[...p];r.splice(t,1),R(r)}function X(){const t=localStorage.getItem("authToken")||localStorage.getItem("token")||"";return t?{Authorization:`Bearer ${t}`}:{}}const we=()=>{const t=window.open("","_blank","width=320,height=600");t&&(t.document.write(`
<html>
  <head>
    <title>Reçu de réservation</title>
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
        <div class="shop-name"><strong>${o.shopName}</strong></div>
        <div class="shop-details"><strong>${o.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${o.shopNumber}</strong></div>
        <div class="shop-details"><strong>${o.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${o.date}</strong></div>
        <div class="shop-details">RECU #: <strong>${o.receiptNumber}</strong></div>
      </div>
      
      <div class="reservation-badge">
        <strong>⭐ RÉSERVATION CONFIRMÉE ⭐</strong>
      </div>
      
      <div class="reservation-info">
        <div><strong>DATE RESERVATION:</strong> <strong>${o.reservationDate}</strong></div>
        <div><strong>HEURE RESERVATION:</strong> <strong>${o.reservationTime}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${o.customerName.toUpperCase()}</strong></div>
        <div class="customer-field">TELEPHONE: <strong>${o.customerPhone}</strong></div>
        ${o.customerEmail?`<div class="customer-field">EMAIL: <strong>${o.customerEmail}</strong></div>`:""}
      </div>
      
      ${o.notes?`
        <div class="notes">
          <strong>NOTES:</strong> <strong>${o.notes}</strong>
        </div>
      `:""}
      
      <div class="receipt-title">ARTICLES RÉSERVÉS</div>
      
      <div class="items-section">
      ${o.items.map(r=>`
        <div class="item-row">
          <div class="item-name"><strong>${r.name}</strong></div>
          <div class="item-details">
            <strong>${r.quantity} x ${oe(r,o.exchangeRate)}</strong>
          </div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>SOUS-TOTAL:</strong></div>
          <div><strong>${B(o.total,o.items,o.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>ACOMPTE TOTAL:</strong></div>
          <div><strong>${B(o.total,o.items,o.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${o.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${o.salesPerson.toUpperCase()}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>MERCI POUR VOTRE RÉSERVATION !</strong></div>
        <div class="warning"><strong>Presentez ce reçu pour retirer vos articles</strong></div>
        <div class="warning"><strong>Validité: 7 jours</strong></div>
        <div class="warning"><strong>Non remboursable</strong></div>
        <div class="thank-you"><strong>A BIENTOT !</strong></div>
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
`),t.document.close())},Ne=()=>{const t=window.open("","_blank","width=320,height=600");t&&(t.document.write(`
<html>
  <head>
    <title>Souche de réservation</title>
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
        <div class="shop-name"><strong>${o.shopName}</strong></div>
        <div class="shop-details"><strong>${o.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${o.shopNumber}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${o.date}</strong></div>
        <div class="shop-details">RECU #: <strong>${o.receiptNumber}</strong></div>
      </div>
      
      <div class="stub-number">
        <strong>SOUCHE RÉSERVATION N°${o.stubNumber}</strong>
      </div>
      
      <div class="reservation-info">
        <div><strong>DATE RESERVATION:</strong> <strong>${o.reservationDate}</strong></div>
        <div><strong>HEURE RESERVATION:</strong> <strong>${o.reservationTime}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${o.customerName.toUpperCase()}</strong></div>
        <div class="customer-field">TELEPHONE: <strong>${o.customerPhone}</strong></div>
      </div>
      
      ${o.notes?`
        <div class="notes">
          <strong>NOTES:</strong> <strong>${o.notes}</strong>
        </div>
      `:""}
      
      <div class="receipt-title">ARTICLES RÉSERVÉS</div>
      
      <div class="items-section">
      ${o.items.map(r=>`
        <div class="item-row">
          <div class="item-name"><strong>${r.name}</strong></div>
          <div class="item-details">
            <strong>${r.quantity} x ${oe(r,o.exchangeRate)}</strong>
          </div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>ACOMPTE PERÇU:</strong></div>
          <div><strong>${B(o.total,o.items,o.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${o.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${o.salesPerson.toUpperCase()}</strong>
      </div>
      
      <div class="stub-footer">
        <div class="thank-you"><strong>SOUCHE RÉSERVATION</strong></div>
        <div class="warning"><strong>${o.shopName}</strong></div>
        <div class="warning"><strong>Conserver cette souche</strong></div>
        <div class="warning">Recu #: <strong>${o.receiptNumber}</strong></div>
        <div class="warning">Date: <strong>${o.date}</strong></div>
        <div class="warning">Client: <strong>${o.customerName}</strong></div>
        <div class="warning">Tel: <strong>${o.customerPhone}</strong></div>
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
`),t.document.close())},Y=()=>{we(),setTimeout(()=>{Ne()},2e3)},je=async t=>{try{return console.log("Attempting ESC/POS printing for reservation..."),await ae.printReceipt(t,"reservation"),await ae.printStub(t,"reservation"),console.log("ESC/POS printing successful"),!0}catch(r){return console.error("ESC/POS printing failed, falling back to browser printing:",r),Y(),!1}};i.useEffect(()=>{if(o){const t=setTimeout(async()=>{try{await je(o)}catch(r){console.error("Printing failed:",r),Y()}},500);return()=>clearTimeout(t)}},[o]);const ee=u&&v>0&&E>0&&L(u._id,v);async function Se(t){if(t.preventDefault(),!(!D||w||F.current)){F.current=!0,H(!0),W(null),b(null);try{const r=new Date,c=r.toLocaleDateString("fr-FR",{timeZone:"Africa/Lubumbashi"}),l=Pe(r),m={customer:{name:n.customerName,phone:n.customerPhone,email:n.customerEmail||""},items:p.map(g=>({productId:g.productId,name:g.name,quantity:g.quantity,price:g.unitPrice,enteredPrice:g.enteredPrice,enteredCurrency:g.enteredCurrency,priceUSD:g.priceUSD,priceFC:g.priceFC,exchangeRate:g.exchangeRate})),subtotal:j,total:j,paymentMethod:ne(n.paymentMethod),salesPerson:$?.username||"unknown",reservationDate:c,reservationTime:l,notes:n.notes||"",type:"reservation",exchangeRate:p[0]?.exchangeRate??a?.rate},x=await fetch(`${k}/sales`,{method:"POST",headers:{"Content-Type":"application/json",...X()},body:JSON.stringify(m)}),C=await se(x);if(!x.ok)throw re(x.status,C);const ke=C._id,q=C.saleId;try{(await fetch(`${k}/reservations/track`,{method:"POST",headers:{"Content-Type":"application/json",...X()},body:JSON.stringify({saleReference:ke,saleId:q,customer:{name:n.customerName,phone:n.customerPhone,email:n.customerEmail},items:p,total:j,paymentMethod:ne(n.paymentMethod),salesPerson:$?.username||"unknown",reservationDate:c,reservationTime:l,notes:n.notes})})).ok||console.warn("Failed to create reservation tracking, but sale was created")}catch(g){console.warn("Error creating reservation tracking:",g)}const Ee={shopName:"ETS DOUBLE M CLASSIC BOUTIQUE",shopAddress:"780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",shopNumber:"+243 836 017 031",shopRegistration:"LSH/RCCM/22-A-01266",customerName:n.customerName,customerPhone:n.customerPhone,customerEmail:n.customerEmail,items:p,total:j,paymentMethod:n.paymentMethod,salesPerson:$?.username||"VENDEUR",date:$e(),receiptNumber:q,stubNumber:q,reservationDate:c,reservationTime:l,notes:n.notes};de(Ee),y({productId:"",quantity:"",unitPrice:"",priceInFC:"",customerName:"",customerPhone:"",customerEmail:"",paymentMethod:n.paymentMethod,notes:"",currencyMode:"fc",priceSource:"USD"}),R([]),T(""),W("✅ Réservation effectuée avec succès ! Impression du reçu et de la souche..."),Ae("Réservation enregistrée avec succès.")}catch(r){b(V(r).message)}finally{F.current=!1,H(!1)}}}return e.jsx("div",{className:"flex-1 p-6 overflow-auto",children:e.jsxs("div",{className:"max-w-6xl mx-auto",children:[e.jsx("div",{className:"mb-6",children:e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-gray-900",children:te.reservation.label}),e.jsx("p",{className:"text-gray-600 mt-1",children:te.reservation.description})]}),e.jsx("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4 min-w-[280px]",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Oe,{className:"w-5 h-5 text-blue-600"}),e.jsx("span",{className:"font-semibold text-blue-900",children:"Taux du jour:"})]}),le?e.jsx(_,{className:"w-4 h-4 animate-spin text-blue-600"}):a?e.jsxs("div",{className:"text-right",children:[e.jsxs("div",{className:"font-bold text-blue-800 text-lg",children:["1 USD = ",new Intl.NumberFormat("fr-FR").format(a.rate)," FC"]}),e.jsxs("div",{className:"text-xs text-blue-600",children:["Effectif depuis ",Re(a.effectiveFrom)]})]}):e.jsx("span",{className:"text-red-600 text-sm",children:"Taux non disponible"})]})})]})}),G&&e.jsx("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded",children:G}),K&&e.jsx("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded",children:K}),e.jsxs("div",{className:"bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200",children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:"Ajouter les articles à réserver"}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4 mb-6",children:[e.jsxs("div",{className:"relative",ref:z,children:[e.jsx("label",{htmlFor:"reservation-articles",className:"block mb-2 font-medium text-gray-700",children:"Articles"}),e.jsxs("div",{className:"relative",children:[e.jsx(Ue,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),e.jsx("input",{id:"reservation-articles",type:"text",value:N,onChange:he,onFocus:()=>P(!0),placeholder:"Rechercher un article...",className:"w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",disabled:h||s.length===0})]}),Q&&M.length>0&&e.jsx("div",{className:"absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto",children:M.map(t=>e.jsxs("div",{className:"px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0",onClick:()=>ge(t),children:[e.jsx("div",{className:"font-medium text-gray-900",children:t.name}),e.jsxs("div",{className:"text-sm text-gray-600 flex justify-between",children:[e.jsx("span",{children:t.sku&&`SKU: ${t.sku}`}),e.jsx("span",{className:t.stock===0?"text-red-600":t.stock<=5?"text-orange-600":"text-green-600",children:fe(t)})]})]},t._id))}),Q&&N&&M.length===0&&e.jsx("div",{className:"absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500",children:"Aucun article trouvé"})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-quantity",className:"block mb-2 font-medium text-gray-700",children:"Nombre de pièces"}),e.jsx("input",{id:"reservation-quantity",type:"number",name:"quantity",value:n.quantity,onChange:S,placeholder:"Entrer le nombre de pièces",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:1})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("label",{htmlFor:"reservation-unit-price",className:"block font-medium text-gray-700",children:"Prix unitaire"}),e.jsxs("button",{type:"button",onClick:xe,className:"flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors",children:[e.jsx(De,{className:"w-3 h-3"}),n.currencyMode==="usd"?"USD → FC":"FC → USD"]})]}),n.currencyMode==="usd"?e.jsx("input",{id:"reservation-unit-price",type:"number",step:"0.01",name:"unitPrice",value:n.unitPrice,onChange:t=>{const r=t.target.value,c=Number.parseFloat(r);y({...n,unitPrice:r,priceInFC:a&&Number.isFinite(c)?Math.round(c*a.rate).toString():"",priceSource:"USD"})},placeholder:u?.price?`ex: ${u.price}`:"Entrer le prix en USD",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:.01}):e.jsx("input",{id:"reservation-unit-price",type:"number",name:"priceInFC",value:n.priceInFC,onChange:t=>{const r=t.target.value,c=Number.parseFloat(r);y({...n,priceInFC:r,unitPrice:a&&Number.isFinite(c)?(c/a.rate).toString():"",priceSource:"FC"})},placeholder:"Entrer le prix en FC",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",min:1}),n.unitPrice&&n.currencyMode==="usd"&&a&&e.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",A(parseFloat(n.unitPrice)*a.rate)]}),n.priceInFC&&n.currencyMode==="fc"&&a&&e.jsxs("p",{className:"text-xs text-green-600 mt-1",children:["≈ ",I(parseFloat(n.priceInFC)/a.rate)]})]})]}),u&&be(u,v),e.jsxs("button",{type:"button",onClick:ve,disabled:!ee,className:`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${ee?"bg-blue-600 hover:bg-blue-700 text-white shadow-sm":"bg-gray-400 cursor-not-allowed text-white"} transition-colors`,children:[e.jsx(_,{className:"w-4 h-4"}),"Ajouter au panier"]}),p.length>0&&e.jsxs("div",{className:"mt-6",children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:"Articles du panier de réservation"}),e.jsx("div",{className:"overflow-hidden rounded-lg border border-gray-200",children:e.jsxs("table",{className:"w-full",children:[e.jsx("thead",{className:"bg-gray-50",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-4 py-3 text-left text-sm font-semibold text-gray-700",children:"Articles"}),e.jsx("th",{className:"px-4 py-3 text-center text-sm font-semibold text-gray-700",children:"Pièces"}),e.jsx("th",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-700",children:"Prix unitaire"}),e.jsx("th",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-700",children:"Total"}),e.jsx("th",{className:"px-4 py-3 text-center text-sm font-semibold text-gray-700",children:"Actions"})]})}),e.jsx("tbody",{className:"divide-y divide-gray-200",children:p.map((t,r)=>e.jsxs("tr",{className:"hover:bg-gray-50",children:[e.jsx("td",{className:"px-4 py-3 text-sm text-gray-900",children:t.name}),e.jsx("td",{className:"px-4 py-3 text-sm text-center text-gray-600",children:t.quantity}),e.jsxs("td",{className:"px-4 py-3 text-sm text-right text-gray-900",children:[I(t.unitPrice),a&&e.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",A(t.unitPrice*a.rate)]})]}),e.jsxs("td",{className:"px-4 py-3 text-sm text-right text-gray-900",children:[I(t.total),a&&e.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",A(t.total*a.rate)]})]}),e.jsx("td",{className:"px-4 py-3 text-center",children:e.jsx("button",{onClick:()=>ye(r),className:"text-red-600 hover:text-red-800 text-sm font-medium",children:"Enlever"})})]},r))}),e.jsx("tfoot",{className:"bg-gray-50",children:e.jsxs("tr",{children:[e.jsx("td",{colSpan:3,className:"px-4 py-3 text-right text-sm font-semibold text-gray-900",children:"Total:"}),e.jsxs("td",{className:"px-4 py-3 text-right text-sm font-semibold text-gray-900",children:[I(j),a&&e.jsxs("div",{className:"text-xs text-gray-500",children:["≈ ",A(j*a.rate)]})]}),e.jsx("td",{})]})})]})})]})]}),e.jsxs("div",{className:"bg-white shadow-lg rounded-xl p-6 border border-gray-200",children:[e.jsx("h3",{className:"text-lg font-semibold mb-4 text-gray-900",children:"Informations du client"}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6 mb-6",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-customer-name",className:"block mb-2 font-medium text-gray-700",children:"Nom du client *"}),e.jsx("input",{id:"reservation-customer-name",type:"text",name:"customerName",value:n.customerName,onChange:S,placeholder:"Entrer le nom du client",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-customer-phone",className:"block mb-2 font-medium text-gray-700",children:"Numéro de téléphone du client *"}),e.jsx("input",{id:"reservation-customer-phone",type:"tel",name:"customerPhone",value:n.customerPhone,onChange:S,placeholder:"Entrer le numéro de téléphone",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-customer-email",className:"block mb-2 font-medium text-gray-700",children:"Email du client (optionnel)"}),e.jsx("input",{id:"reservation-customer-email",type:"email",name:"customerEmail",value:n.customerEmail,onChange:S,placeholder:"Entrer l'email du client",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-payment-method",className:"block mb-2 font-medium text-gray-700",children:"Méthode de paiement"}),e.jsxs("select",{id:"reservation-payment-method",name:"paymentMethod",value:n.paymentMethod,onChange:S,className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0,children:[e.jsx("option",{value:"cash",children:"Espèces"}),e.jsx("option",{value:"mpesa",children:"M-Pesa ou Airtel Money (Transfert)"}),e.jsx("option",{value:"bank",children:"Transfert Bank"}),e.jsx("option",{value:"card",children:"Carte Visa"}),e.jsx("option",{value:"other",children:"Autres"})]})]})]}),e.jsxs("div",{className:"mb-6",children:[e.jsx("label",{htmlFor:"reservation-notes",className:"block mb-2 font-medium text-gray-700",children:"Notes (optionnel)"}),e.jsx("textarea",{id:"reservation-notes",name:"notes",value:n.notes,onChange:S,placeholder:"Notes supplémentaires pour la réservation",className:"w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",rows:3})]}),e.jsx("button",{type:"submit",onClick:Se,disabled:!D||w,className:`px-8 py-3 rounded-lg font-medium text-lg ${D&&!w?"bg-green-600 hover:bg-green-700 text-white shadow-sm":"bg-gray-400 cursor-not-allowed text-white"} transition-colors`,children:w?e.jsxs("span",{className:"flex items-center gap-2",children:[e.jsx(_,{className:"w-4 h-4 animate-spin"}),"En cours d'enregistrement..."]}):"Confirmer la Reservation"})]}),e.jsx("div",{ref:me,style:{display:"none"}})]})})}export{Je as default};
