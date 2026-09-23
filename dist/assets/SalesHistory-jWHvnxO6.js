import{n as vt,r as l,s as A,m as e,S as Nt,P as Ae,h as wt,E as St,U as kt,g as Ct}from"./index-3KF6_627.js";import{E as At}from"./jspdf.es.min-D-5jA7yp.js";import{m as F,k as $e,g as Te,d as $t,f as Tt,h as Pe,j as Ie,i as Ee,e as Pt,l as It}from"./salePricing-B6CLvYLp.js";import{F as Fe}from"./funnel-CkGdZOWh.js";import{S as Et}from"./search-BlWP8EzJ.js";import{F as q}from"./file-text-DSZ9XzxG.js";import{D as ne}from"./download-BUocU-VA.js";import{M as ie}from"./minus-Cm3yOXyv.js";import{C as Ft}from"./calendar-D5IK5oqx.js";import{C as Re}from"./chevron-down-BuZ906se.js";import{R as oe}from"./refresh-cw-DF8pUN70.js";import{H as le}from"./history-BOS1rnM_.js";import{S as de}from"./square-pen-D9bNiIB4.js";import{P as Me}from"./printer-BFb55Jk7.js";import{T as De}from"./trash-2-Be6iqPxm.js";import{P as Ue}from"./plus-vPk1TSIR.js";const B=()=>{const v=new Date,b=v.getFullYear(),$=String(v.getMonth()+1).padStart(2,"0"),V=String(v.getDate()).padStart(2,"0");return`${b}-${$}-${V}`},W=()=>{const v=new Date,b=v.getFullYear(),$=String(v.getMonth()+1).padStart(2,"0");return`${b}-${$}`},R=()=>new Date().getFullYear();function Kt(){const{token:v}=vt(),b=l.useCallback(()=>v||localStorage.getItem("token")||"",[v]),$=l.useRef(()=>{}),[V,Le]=l.useState([]),[N,ze]=l.useState([]),[P,Oe]=l.useState({shopName:"ETS DOUBLE M CLASSIC BOUTIQUE",shopAddress:"780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",shopNumber:"+243 836 017 031",shopRegistration:"LSH/RCCM/22-A-01266",receiptFooter:"Merci pour votre confiance ! À bientôt."}),[_,T]=l.useState(!0),[h,ce]=l.useState(""),[o,He]=l.useState(null),[qe,M]=l.useState(!1),[Be,me]=l.useState(!1),[g,xe]=l.useState(null),[d,m]=l.useState({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",isWalkIn:!1}),[ue,J]=l.useState(null),[D,c]=l.useState(null),[U,he]=l.useState(!1),[L,pe]=l.useState(null),[Y,Q]=l.useState(!1),G=!!L,[S,ge]=l.useState("today"),[n,K]=l.useState({from:"",to:"",date:B(),year:R().toString(),month:W().split("-")[1],type:"",status:"",customerPhone:"",category:""}),[f,be]=l.useState(!1),[fe,We]=l.useState([]),[x,Ve]=l.useState(null),[_e,Z]=l.useState(!1),[ye,Je]=l.useState(null),[y,Ye]=l.useState(null),[I,Qe]=l.useState(null),[z,Ge]=l.useState(!1),[O,Ke]=l.useState(!1),[je,X]=l.useState(1),[k,Ze]=l.useState(null),[ee,Xe]=l.useState(null);l.useEffect(()=>{et(),E(),te(),fetch(`${A}/exchange-rates/current`,{headers:{Authorization:`Bearer ${b()}`}}).then(s=>s.ok?s.json():null).then(s=>{s?.rate&&Xe(s.rate)}).catch(()=>{}),fetch(`${A}/settings/receipt`,{headers:{Authorization:`Bearer ${b()}`}}).then(s=>s.ok?s.json():null).then(s=>{s&&Oe({shopName:s.shopName||"ETS DOUBLE M CLASSIC BOUTIQUE",shopAddress:s.shopAddress||"",shopNumber:s.shopNumber||"",shopRegistration:s.shopRegistration||"",receiptFooter:s.receiptFooter||""})}).catch(()=>{});const t=()=>{$.current()};return window.addEventListener("salesUpdated",t),()=>{window.removeEventListener("salesUpdated",t)}},[]),l.useEffect(()=>{Object.keys(n).length>0&&E()},[n,je,h]),l.useEffect(()=>{X(1)},[n,h]);const et=async()=>{try{const t=localStorage.getItem("user");if(t){const a=JSON.parse(t);pe(a),Q(a.role==="superadmin");return}const s=await fetch(`${A}/users/me`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${b()}`}});if(s.ok){const a=await s.json();pe(a),Q(a.role==="superadmin"),localStorage.setItem("user",JSON.stringify(a))}}catch(t){console.error("Error fetching user data:",t),Q(!1)}},tt=t=>t.filter(s=>{const r=!["expense","depense"].includes(s.status?.toLowerCase()),i=s.saleId&&s.customer&&s.items;return r&&i}),st=()=>{const t=new URLSearchParams;switch(t.set("page",String(je)),t.set("limit","50"),t.set("type","sale"),S){case"custom":n.from&&t.append("from",n.from),n.to&&t.append("to",n.to);break;case"day":n.date&&t.append("date",n.date);break;case"month":n.year&&t.append("year",n.year),n.month&&t.append("month",n.month);break;case"year":n.year&&t.append("year",n.year);break}return n.status&&t.append("status",n.status),n.customerPhone&&t.append("customerPhone",n.customerPhone),Y&&n.category&&t.append("category",n.category),h.trim()&&t.append("search",h.trim()),t.toString()},E=async()=>{try{T(!0),c(null);const t=st(),s=`${A}/sales${t?`?${t}`:""}`;console.log("Fetching sales from:",s);const a=await fetch(s,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${b()}`}});if(a.ok){const r=await a.json();if(r.success&&r.data&&Array.isArray(r.data)){const i=r.data;console.log(`Fetched ${i.length} sales from API`),console.log("Timeframe metadata:",r.timeframe),console.log("Summary stats:",r.summary);const w=tt(i);console.log(`After filtering: ${w.length} valid sales`),Le(w),Ze(r.pagination||null),Je(r.timeframe),Ye(r.summary),Qe(r.filtersApplied),at(w)}else console.warn("Unexpected sales data structure:",r),c("Unexpected response format from server")}else{console.error("Sales fetch failed:",a.status);const r=await a.text();c(`Failed to load sales: ${a.status} ${r}`)}}catch(t){console.error("Error loading sales:",t),c("Failed to load sales. Please check your connection.")}finally{T(!1)}};$.current=E;const at=t=>{const a=t.filter(r=>r.editHistory&&r.editHistory.length>0||r.editedBy).sort((r,i)=>{const w=r.editedAt?new Date(r.editedAt).getTime():new Date(r.updatedAt).getTime();return(i.editedAt?new Date(i.editedAt).getTime():new Date(i.updatedAt).getTime())-w});We(a)},rt=t=>{ge(t);const s={...n};switch(t){case"today":s.date=B(),s.from="",s.to="",s.year=R().toString(),s.month=W().split("-")[1];break;case"day":s.date=B(),s.from="",s.to="";break;case"month":s.year=R().toString(),s.month=W().split("-")[1],s.date="",s.from="",s.to="";break;case"year":s.year=R().toString(),s.month="",s.date="",s.from="",s.to="";break;case"custom":if(!s.from){const a=new Date,r=new Date(a.getFullYear(),a.getMonth(),1);s.from=r.toISOString().split("T")[0]}s.to||(s.to=new Date().toISOString().split("T")[0]),s.date="",s.year="",s.month="";break}K(s)},j=(t,s)=>{K(a=>({...a,[t]:s}))},nt=()=>{K({from:"",to:"",date:B(),year:R().toString(),month:W().split("-")[1],type:"",status:"",customerPhone:"",category:""}),ge("today"),be(!1),ce("")},te=async()=>{try{he(!0);const t=await fetch(`${A}/products?limit=0`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${b()}`}});if(t.ok){const s=await t.json();let a=[];Array.isArray(s)?a=s:s&&Array.isArray(s.products)?a=s.products:s&&typeof s=="object"&&(a=[s]),console.log("Processed products:",a.length),ze(a)}else console.error("Products API Error:",t.status,t.statusText)}catch(t){console.error("Error loading products:",t)}finally{he(!1)}},se=f?fe.filter(t=>t.saleId.toLowerCase().includes(h.toLowerCase())||t.customer.name.toLowerCase().includes(h.toLowerCase())||t.customer.phone.includes(h)||t.salesPerson&&t.salesPerson.toLowerCase().includes(h.toLowerCase())):V.filter(t=>t.saleId.toLowerCase().includes(h.toLowerCase())||t.customer.name.toLowerCase().includes(h.toLowerCase())||t.customer.phone.includes(h)||t.salesPerson&&t.salesPerson.toLowerCase().includes(h.toLowerCase())),C=t=>Ct(t),u=$t,p=Tt,ve=(t,s)=>{const a=Pt(t,s);return`${It(t).toFixed(2)}$${a===void 0?"":` / ${p(a)}`}`},Ne=(t,s)=>{const a=Te(t,s);return`${$e(t).toFixed(2)}$${a===void 0?"":` / ${p(a)}`}`},H=(t,s,a)=>{const r=F(t,s,a);return`${t.toFixed(2)}$${r===void 0?"":` / ${p(r)}`}`},it=t=>Pe(t)==="FC"?p(Ie(t)):u(Ie(t)),ot=t=>Pe(t)==="FC"?p(Ee(t)):u(Ee(t)),lt=()=>{if(ye)return ye.description;switch(S){case"today":return"Today";case"day":return n.date?`Day: ${n.date}`:"Today";case"month":return n.year&&n.month?`Month: ${n.year}-${n.month.padStart(2,"0")}`:"This month";case"year":return n.year?`Year: ${n.year}`:"This year";case"custom":return n.from&&n.to?`Range: ${n.from} to ${n.to}`:n.from?`From: ${n.from}`:n.to?`Until: ${n.to}`:"Custom range";default:return"Today"}},dt=t=>{Ve(t),Z(!0)},ct=t=>{if(!t.editHistory||t.editHistory.length===0)return null;const s=t.editHistory[t.editHistory.length-1],a=s.changes;return e.jsxs("div",{className:"mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg",children:[e.jsxs("h4",{className:"font-medium text-yellow-800 mb-2 flex items-center gap-2",children:[e.jsx(le,{className:"w-4 h-4"}),"Dernière modification"]}),e.jsxs("div",{className:"space-y-2 text-sm",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-yellow-700",children:"Modifié par:"}),e.jsx("span",{className:"font-medium",children:s.editedBy||t.editedBy||"Unknown"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-yellow-700",children:"Date de modification:"}),e.jsx("span",{className:"font-medium",children:C(s.editedAt||t.editedAt||t.updatedAt)})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-yellow-700",children:"Raison:"}),e.jsx("span",{className:"font-medium text-right",children:s.reason})]}),a&&Object.keys(a).length>0&&e.jsxs("div",{className:"mt-3 pt-3 border-t border-yellow-200",children:[e.jsx("h5",{className:"font-medium text-yellow-800 mb-2",children:"Changements:"}),Object.entries(a).map(([r,i])=>e.jsxs("div",{className:"mb-2 last:mb-0",children:[e.jsxs("div",{className:"font-medium text-yellow-700 capitalize",children:[r.replace(/([A-Z])/g," $1").toLowerCase(),":"]}),e.jsxs("div",{className:"grid grid-cols-2 gap-2 text-xs",children:[e.jsxs("div",{className:"bg-red-50 p-2 rounded",children:[e.jsx("div",{className:"text-red-600 font-medium",children:"Avant:"}),e.jsx("div",{className:"truncate",children:JSON.stringify(i.from)})]}),e.jsxs("div",{className:"bg-green-50 p-2 rounded",children:[e.jsx("div",{className:"text-green-600 font-medium",children:"Après:"}),e.jsx("div",{className:"truncate",children:JSON.stringify(i.to)})]})]})]},r))]})]})]})},we=async t=>{const s=window.open("","_blank","width=320,height=600");s&&(s.document.write(`
<html>
  <head>
    <title>Sale Receipt - ESC/POS</title>
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
        <div class="shop-name"><strong>${P.shopName}</strong></div>
        <div class="shop-details"><strong>${P.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${P.shopNumber}</strong></div>
        <div class="shop-details"><strong>${P.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${C(t.createdAt)}</strong></div>
        <div class="shop-details">RECU #: <strong>${t.saleId}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${t.customer.name.toUpperCase()}</strong></div>
        ${t.customer.phone?`<div class="customer-field">TELEPHONE: <strong>${t.customer.phone}</strong></div>`:""}
        ${t.customer.email?`<div class="customer-field">EMAIL: <strong>${t.customer.email}</strong></div>`:""}
      </div>
      
      <div class="receipt-title">ARTICLES ACHETES</div>

      <div class="items-col-header">
        <span class="col-article">Article</span>
        <span class="col-qte">Qte</span>
      </div>

      <div class="items-section">
      ${t.items.map(a=>`
        <div class="item-row" style="flex-wrap:wrap">
          <div class="item-name"><strong>${a.name}</strong></div>
          <div class="item-quantity"><strong>${a.quantity}</strong></div>
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${a.quantity} x ${ve(a,t.exchangeRate)} = ${Ne(a,t.exchangeRate)}</strong></div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>SOUS-TOTAL:</strong></div>
          <div><strong>${H(t.subtotal,t.items,t.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>TOTAL:</strong></div>
          <div><strong>${H(t.total,t.items,t.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${t.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${(t.salesPerson||"Non spécifié").toUpperCase()}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>${P.receiptFooter||"MERCI POUR VOTRE ACHAT !"}</strong></div>
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
`),s.document.close())},Se=async t=>{const s=new At;s.setFontSize(20),s.text("ETS DOUBLE M CLASSIC BOUTIQUE",105,10,{align:"center"}),s.setFontSize(10),s.text("Vêtements & Chaussures",105,15,{align:"center"}),s.setFontSize(12),s.text("LSH/RCCM/22-A-01266",105,20,{align:"center"}),s.text("Tél: +243 836 017 031",105,25,{align:"center"}),s.text("780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",105,30,{align:"center"}),s.setFontSize(16),s.text("Reçu de vente",105,35,{align:"center"}),s.setFontSize(10),s.text(`Date: ${C(t.createdAt)}`,20,45),s.text(`Reçu #: ${t.saleId}`,20,52),s.text(`Payement: ${t.paymentMethod.toUpperCase()}`,20,59),s.text(`Statut: ${t.status.toUpperCase()}`,20,66),s.text(`Agent: ${t.salesPerson||"Non spécifié"}`,20,73),s.setFontSize(12),s.text("Information sur le client:",20,85),s.setFontSize(10),s.text(`Nom: ${t.customer.name}`,20,92),t.customer.phone&&s.text(`Phone: ${t.customer.phone}`,20,99),t.customer.email&&s.text(`Email: ${t.customer.email}`,20,106),s.setFontSize(12),s.text("Articles:",20,113),s.setFontSize(10);let a=120;t.items.forEach((r,i)=>{a>250&&(s.addPage(),a=20),s.text(`${i+1}. ${r.name}`,20,a),s.text(`Qté: ${r.quantity} x ${ve(r,t.exchangeRate)} = ${Ne(r,t.exchangeRate)}`,25,a+6),a+=15}),a+=7,s.text(`Sous-total: ${H(t.subtotal,t.items,t.exchangeRate)}`,20,a),s.text(`Total: ${H(t.total,t.items,t.exchangeRate)}`,20,a+5),s.setFontSize(10),s.text("Merci pour votre achat !",105,a+20,{align:"center"}),s.text("Les marchandises vendues ne sont ni reprises ni échangées.",105,a+30,{align:"center"}),s.text("À bientôt",105,a+40,{align:"center"}),s.save(`receipt-${t.saleId}.pdf`)},mt=t=>{He(t),M(!0),c(null)},ke=async t=>{if(t.status==="voided"||t.status==="corrected"){c("Cannot edit a voided or corrected sale");return}xe(t),m({customer:{...t.customer},items:t.items.map(s=>({...s})),paymentMethod:t.paymentMethod,reason:"",isWalkIn:!!t.isWalkIn}),me(!0),c(null),N.length===0&&await te()},ae=()=>{me(!1),xe(null),m({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",isWalkIn:!1}),c(null)},xt=()=>{m(t=>({...t,isWalkIn:!t.isWalkIn,customer:t.isWalkIn?t.customer:{name:"",phone:"",email:""}}))},re=(t,s)=>{if(s<1)return;const a=[...d.items],r=N.find(i=>i._id===a[t].productId);if(r&&s>r.stock+a[t].quantity){c(`Insufficient stock. Available: ${r.stock}`);return}a[t].quantity=s,a[t].total=s*a[t].price,m(i=>({...i,items:a})),c(null)},ut=(t,s)=>{if(s<0)return;const a=[...d.items],r=a[t].exchangeRate??g?.exchangeRate;a[t]={...a[t],price:s,total:s*a[t].quantity,enteredPrice:s,enteredCurrency:"USD",priceUSD:s,priceFC:r?Math.round(s*r):void 0,exchangeRate:r},m(i=>({...i,items:a}))},ht=t=>{const s=d.items.filter((a,r)=>r!==t);m(a=>({...a,items:s}))},pt=()=>{if(N.length===0){c("No products available. Please refresh products first.");return}const t=N[0],s={productId:t._id,name:t.name,quantity:1,price:t.price,total:t.price,enteredPrice:t.price,enteredCurrency:"USD",priceUSD:t.price,priceFC:g?.exchangeRate?Math.round(t.price*g.exchangeRate):void 0,exchangeRate:g?.exchangeRate,_id:`temp-${Date.now()}`};m(a=>({...a,items:[...a.items,s]}))},gt=(t,s)=>{const a=N.find(w=>w._id===s);if(!a){c("Selected product not found");return}const r=[...d.items],i=r[t].exchangeRate??g?.exchangeRate;r[t]={...r[t],productId:s,name:a.name,price:a.price,total:a.price*r[t].quantity,enteredPrice:a.price,enteredCurrency:"USD",priceUSD:a.price,priceFC:i?Math.round(a.price*i):void 0,exchangeRate:i},m(w=>({...w,items:r})),c(null)},Ce=()=>{const t=d.items.reduce((s,a)=>s+a.total,0);return{subtotal:t,total:t}},bt=async()=>{if(g){if(d.items.length===0){c("Sale must contain at least one item");return}if(!d.isWalkIn&&(!d.customer.name||!d.customer.phone)){c("Customer name and phone are required");return}if(!d.reason){c("Please provide a reason for editing this sale");return}try{T(!0);const{subtotal:t,total:s}=Ce(),a={customer:d.isWalkIn?{name:"Client de passage",phone:"",email:""}:d.customer,isWalkIn:d.isWalkIn,items:d.items.map(i=>({productId:i.productId,name:i.name,quantity:i.quantity,price:i.price,total:i.total,enteredPrice:i.enteredPrice,enteredCurrency:i.enteredCurrency,priceUSD:i.priceUSD,priceFC:i.priceFC,exchangeRate:i.exchangeRate})),subtotal:t,total:s,exchangeRate:g.exchangeRate,paymentMethod:d.paymentMethod,reason:d.reason,_id:g._id,saleId:g.saleId},r=await fetch(`${A}/sales/${g._id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${b()}`},body:JSON.stringify(a)});if(r.ok)await r.json(),J("✅ Sale updated successfully"),await E(),setTimeout(()=>{window.dispatchEvent(new Event("salesUpdated"))},1e3),ae();else{const i=await r.json();c(i.error||i.message||`Failed to update sale: ${r.status} ${r.statusText}`)}}catch(t){console.error("Error updating sale:",t),c("Failed to update sale. Please check your connection.")}finally{T(!1)}}},ft=async t=>{if(t.status==="voided"){c("Sale is already voided");return}if(window.confirm(`Are you sure you want to void sale ${t.saleId}? This action cannot be undone.`))try{T(!0);const s=await fetch(`${A}/sales/${t._id}/void`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${b()}`},body:JSON.stringify({reason:"Sale voided by admin"})});if(s.ok)J("✅ Sale voided successfully"),await E(),M(!1);else{const a=await s.json();c(a.error||"Failed to void sale")}}catch(s){c("Failed to void sale"),console.error("Error voiding sale:",s)}finally{T(!1)}},{subtotal:yt,total:jt}=Ce();return e.jsxs("div",{className:"space-y-6 p-6 flex-1 overflow-auto",children:[e.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-4 overflow-auto",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900",children:"Historique des ventes"}),e.jsx("p",{className:"text-gray-600",children:"Voir toutes les transactions et ventes passées"})]}),e.jsxs("div",{className:"flex gap-3",children:[e.jsxs("button",{onClick:()=>be(!f),className:`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${f?"bg-blue-500 text-white border-blue-500 shadow-sm":"bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`,children:[e.jsx(Fe,{className:"w-4 h-4"}),f?"Toutes les ventes":"Ventes modifiées",f&&e.jsx("span",{className:"bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full",children:fe.length})]}),e.jsxs("div",{className:"relative",children:[e.jsx(Et,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),e.jsx("input",{type:"text",placeholder:"Search sales...",className:"pl-10 w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",value:h,onChange:t=>ce(t.target.value)})]})]})]}),Y&&y&&e.jsxs("div",{className:"bg-blue-50 p-4 rounded-lg border border-blue-200",children:[e.jsxs("div",{className:"flex items-center justify-between mb-3",children:[e.jsxs("h3",{className:"text-lg font-semibold text-blue-900 flex items-center gap-2",children:[e.jsx(Nt,{className:"w-5 h-5"}),"Summary Statistics (Admin View)"]}),L&&e.jsxs("span",{className:"text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full",children:["Logged in as: ",L.name," (",L.role,")"]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-4",children:[e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Total Records"}),e.jsx("p",{className:"text-2xl font-bold text-gray-900",children:y.totalRecords})]}),e.jsx(q,{className:"w-8 h-8 text-blue-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Revenue"}),e.jsx("p",{className:"text-2xl font-bold text-green-600",children:p(y.revenue*(ee||0))}),e.jsxs("p",{className:"text-xs text-gray-500",children:["≈ ",u(y.revenue)]})]}),e.jsx(ne,{className:"w-8 h-8 text-green-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Expenses"}),e.jsx("p",{className:"text-2xl font-bold text-red-600",children:p(y.expenses*(ee||0))}),e.jsxs("p",{className:"text-xs text-gray-500",children:["≈ ",u(y.expenses)]})]}),e.jsx(ie,{className:"w-8 h-8 text-red-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Net"}),e.jsx("p",{className:"text-2xl font-bold text-blue-600",children:p(y.net*(ee||0))}),e.jsxs("p",{className:"text-xs text-gray-500",children:["≈ ",u(y.net)]})]}),e.jsx(Ae,{className:"w-8 h-8 text-blue-500"})]})})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 mt-4",children:[e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Total Sales"}),e.jsx("p",{className:"text-xl font-bold text-green-700",children:y.salesCount})]}),e.jsx(q,{className:"w-6 h-6 text-green-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Total Expenses"}),e.jsx("p",{className:"text-xl font-bold text-red-700",children:y.expensesCount})]}),e.jsx(ie,{className:"w-6 h-6 text-red-500"})]})})]})]}),e.jsxs("div",{className:"bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900 flex items-center gap-2",children:[e.jsx(Ft,{className:"w-4 h-4 sm:w-5 sm:h-5"}),f?"Ventes modifiées":"Toutes les ventes"," - ",lt()]}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsxs("button",{onClick:()=>Ge(!z),className:"px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2",children:[e.jsx(Fe,{className:"w-4 h-4"}),z?"Hide Filters":"Show Filters",e.jsx(Re,{className:`w-4 h-4 transition-transform ${z?"rotate-180":""}`})]}),e.jsxs("button",{onClick:nt,className:"px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2",children:[e.jsx(oe,{className:"w-4 h-4"}),"Clear Filters"]})]})]}),z&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:"Timeframe Type"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:["today","day","month","year","custom"].map(t=>e.jsxs("button",{onClick:()=>rt(t),className:`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${S===t?"bg-blue-500 text-white shadow-sm":"bg-gray-100 text-gray-700 hover:bg-gray-200"}`,children:[t==="today"&&"Today",t==="day"&&"Specific Day",t==="month"&&"Specific Month",t==="year"&&"Specific Year",t==="custom"&&"Custom Range"]},t))})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",children:[S==="day"&&e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Date"}),e.jsx("input",{type:"date",value:n.date,onChange:t=>j("date",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]}),S==="month"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Year"}),e.jsx("input",{type:"number",value:n.year,onChange:t=>j("year",t.target.value),min:"2000",max:"2100",className:"w-full p-2 border border-gray-300 rounded-lg"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Month"}),e.jsx("select",{value:n.month,onChange:t=>j("month",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:Array.from({length:12},(t,s)=>{const a=(s+1).toString().padStart(2,"0");return e.jsxs("option",{value:a,children:[wt(s)," (",a,")"]},a)})})]})]}),S==="year"&&e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Year"}),e.jsx("input",{type:"number",value:n.year,onChange:t=>j("year",t.target.value),min:"2000",max:"2100",className:"w-full p-2 border border-gray-300 rounded-lg"})]}),S==="custom"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"From Date"}),e.jsx("input",{type:"date",value:n.from,onChange:t=>j("from",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"To Date"}),e.jsx("input",{type:"date",value:n.to,onChange:t=>j("to",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]})]})]}),e.jsxs("div",{children:[e.jsxs("button",{onClick:()=>Ke(!O),className:"text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1",children:[O?"Hide Advanced Filters":"Show Advanced Filters",e.jsx(Re,{className:`w-4 h-4 transition-transform ${O?"rotate-180":""}`})]}),O&&e.jsxs("div",{className:"mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg",children:[Y&&e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Catégorie"}),e.jsxs("select",{value:n.category,onChange:t=>j("category",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"Tous"}),e.jsx("option",{value:"CLOTHES",children:"Vêtements"}),e.jsx("option",{value:"SHOES",children:"Chaussures"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Sale Type"}),e.jsxs("select",{value:n.type,onChange:t=>j("type",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"All Types"}),e.jsx("option",{value:"sale",children:"Sale"}),e.jsx("option",{value:"reservation",children:"Reservation"}),e.jsx("option",{value:"expense",children:"Expense"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Status"}),e.jsxs("select",{value:n.status,onChange:t=>j("status",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"All Status"}),e.jsx("option",{value:"completed",children:"Completed"}),e.jsx("option",{value:"pending",children:"Pending"}),e.jsx("option",{value:"expense",children:"Expense"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Customer Phone"}),e.jsx("input",{type:"text",value:n.customerPhone,onChange:t=>j("customerPhone",t.target.value),placeholder:"Filter by phone...",className:"w-full p-2 border border-gray-300 rounded-lg"})]})]})]})]}),I&&e.jsxs("div",{className:"mt-4 text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Applied filters:"}),e.jsxs("span",{className:"ml-2",children:["Status: ",I.status,", Type: ",I.type,I.customerPhone!=="none"&&`, Phone: ${I.customerPhone}`]})]})]}),ue&&e.jsxs("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200",children:[ue,e.jsx("button",{onClick:()=>J(null),className:"float-right text-green-700 hover:text-green-900",children:"×"})]}),D&&e.jsxs("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200",children:[D,e.jsx("button",{onClick:()=>c(null),className:"float-right text-red-700 hover:text-red-900",children:"×"})]}),e.jsxs("div",{className:"bg-white rounded-lg shadow",children:[e.jsx("div",{className:"px-6 py-4 border-b border-gray-200",children:e.jsxs("h2",{className:"text-lg font-semibold text-gray-900 flex items-center gap-2",children:[e.jsx(q,{className:"w-5 h-5"}),f?"Ventes modifiées":"Transactions de vente"," (",se.length,")"]})}),e.jsx("div",{className:"overflow-x-auto",children:_?e.jsxs("div",{className:"text-center py-12",children:[e.jsx("div",{className:"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"}),e.jsx("p",{className:"text-gray-500 mt-2",children:"Chargement des ventes..."})]}):se.length===0?e.jsxs("div",{className:"text-center py-12 text-gray-500",children:[e.jsx(q,{className:"w-12 h-12 mx-auto mb-4 opacity-50"}),e.jsx("p",{children:f?"Aucune vente modifiée trouvée":"Aucune vente trouvée"}),e.jsx("p",{className:"text-sm",children:"pour la période sélectionnée"})]}):e.jsx(e.Fragment,{children:e.jsxs("table",{className:"min-w-full divide-y divide-gray-200",children:[e.jsx("thead",{className:"bg-gray-50",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Identifiant de vente"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Client"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Agent"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Articles"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Total"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Payement"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Statut"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Date"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Modifié par"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]})}),e.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:se.map(t=>e.jsxs("tr",{className:"hover:bg-gray-50",children:[e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:t.saleId}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap",children:[e.jsxs("div",{className:"text-sm text-gray-900 flex items-center gap-2",children:[t.customer.name,t.isWalkIn&&e.jsx("span",{className:"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800",children:"Passage"})]}),e.jsx("div",{className:"text-sm text-gray-500",children:t.customer.phone})]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:t.salesPerson||"Non spécifié"}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:[t.items.length," Article(s)"]}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:[p(F(t.total,t.items,t.exchangeRate)??0),e.jsxs("div",{className:"text-xs font-normal text-gray-500",children:["≈ ",u(t.total)]})]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800",children:t.paymentMethod})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${t.status==="completed"?"bg-green-100 text-green-800":t.status==="voided"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`,children:t.status})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-500",children:C(t.createdAt)}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm",children:(()=>{const s=(t.editHistory&&t.editHistory.length>0?t.editHistory[t.editHistory.length-1].editedBy:null)||t.editedBy;return s?e.jsxs("span",{className:"inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium border border-yellow-200",children:["✏️ ",s]}):e.jsx("span",{className:"text-gray-300",children:"—"})})()}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium",children:e.jsxs("div",{className:"flex gap-2",children:[f?e.jsx("button",{onClick:()=>dt(t),className:"text-blue-600 hover:text-blue-900 p-1 rounded",title:"Voir les détails des modifications",children:e.jsx(le,{className:"w-4 h-4"})}):e.jsx("button",{onClick:()=>mt(t),className:"text-blue-600 hover:text-blue-900 p-1 rounded",title:"Voir les détails de",children:e.jsx(St,{className:"w-4 h-4"})}),!f&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:()=>ke(t),disabled:t.status==="voided"||t.status==="corrected",className:`p-1 rounded ${t.status==="voided"||t.status==="corrected"?"text-gray-400 cursor-not-allowed":"text-yellow-600 hover:text-yellow-900"}`,title:"Edit Sale",children:e.jsx(de,{className:"w-4 h-4"})}),G&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:()=>Se(t),className:"text-green-600 hover:text-green-900 p-1 rounded",title:"Download PDF Receipt",children:e.jsx(ne,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>we(t),className:"text-purple-600 hover:text-purple-900 p-1 rounded",title:"Print ESC/POS Receipt",children:e.jsx(Me,{className:"w-4 h-4"})})]}),e.jsx("button",{onClick:()=>ft(t),disabled:t.status==="voided",className:`p-1 rounded ${t.status==="voided"?"text-gray-400 cursor-not-allowed":"text-red-600 hover:text-red-900"}`,title:"Void Sale",children:e.jsx(De,{className:"w-4 h-4"})})]})]})})]},t._id))})]})})})]}),k&&k.totalPages>1&&e.jsxs("div",{className:"flex items-center justify-between rounded-lg border bg-white px-4 py-3",children:[e.jsxs("span",{className:"text-sm text-gray-600",children:["Page ",k.page," sur ",k.totalPages," · ",k.totalRecords," ventes"]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{type:"button",disabled:!k.hasPreviousPage,onClick:()=>X(t=>Math.max(1,t-1)),className:"rounded border px-3 py-1.5 text-sm disabled:opacity-40",children:"Précédent"}),e.jsx("button",{type:"button",disabled:!k.hasNextPage,onClick:()=>X(t=>t+1),className:"rounded border px-3 py-1.5 text-sm disabled:opacity-40",children:"Suivant"})]})]}),qe&&o&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:"Détails de la vente"}),e.jsx("button",{onClick:()=>M(!1),className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Identifiant de vente"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.saleId})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Date"}),e.jsx("p",{className:"text-sm text-gray-900",children:C(o.createdAt)})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:["Methode de Payment"," "]}),e.jsx("p",{className:"text-sm text-gray-900 capitalize",children:o.paymentMethod})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Statut"}),e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${o.status==="completed"?"bg-green-100 text-green-800":o.status==="voided"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`,children:o.status})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Agent"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.salesPerson||"Non spécifié"})]}),o.editedBy&&e.jsxs("div",{className:"col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Dernière modification"}),e.jsxs("p",{className:"text-sm text-gray-900",children:["By: ",o.editedBy," at"," ",o.editedAt?C(o.editedAt):"N/A"]})]})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(kt,{className:"w-4 h-4"}),"Information sur le client",o.isWalkIn&&e.jsx("span",{className:"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800",children:"Client de passage"})]}),e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Nom"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.customer.name})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Phone"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.customer.phone})]}),o.customer.email&&e.jsxs("div",{className:"col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Email"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.customer.email})]})]})})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(Ae,{className:"w-4 h-4"}),"Articles (",o.items.length,")"]}),e.jsx("div",{className:"space-y-3",children:o.items.map((t,s)=>e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{children:[e.jsx("h5",{className:"font-medium text-gray-900",children:t.name}),e.jsxs("p",{className:"text-sm text-gray-600",children:["Nombre de pieces: ",t.quantity," ×"," ",it(t)]})]}),e.jsx("div",{className:"text-right",children:e.jsxs("p",{className:"font-medium text-gray-900",children:[ot(t),t.enteredCurrency==="FC"?e.jsxs("span",{className:"block text-xs font-normal text-gray-500",children:["Reçu: ",u($e(t))]}):(()=>{const a=Te(t,o.exchangeRate);return a!==void 0?e.jsxs("span",{className:"block text-xs font-normal text-gray-500",children:["≈ ",p(a)]}):null})()]})})]})},s))})]}),o.editHistory&&o.editHistory.length>0&&ct(o),e.jsxs("div",{className:"border-t border-gray-200 pt-4",children:[e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Sous-total:"}),e.jsxs("span",{className:"text-sm text-gray-900 text-right",children:[e.jsx("span",{className:"block",children:p(F(o.subtotal,o.items,o.exchangeRate)??0)}),e.jsxs("span",{className:"block text-xs text-gray-500",children:["≈ ",u(o.subtotal)]})]})]}),e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:"Total:"}),e.jsxs("span",{className:"text-gray-900 text-right",children:[e.jsx("span",{className:"block",children:p(F(o.total,o.items,o.exchangeRate)??0)}),e.jsxs("span",{className:"block text-xs font-normal text-gray-500",children:["≈ ",u(o.total)]})]})]})]}),e.jsxs("div",{className:"flex gap-3 pt-4",children:[G&&e.jsxs("button",{onClick:()=>Se(o),className:"flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(ne,{className:"w-4 h-4"}),"Télécharger PDF"]}),G&&e.jsxs("button",{onClick:()=>we(o),className:"flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(Me,{className:"w-4 h-4"}),"Imprimer Reçu"]}),e.jsxs("button",{onClick:()=>ke(o),disabled:o.status==="voided"||o.status==="corrected",className:`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${o.status==="voided"||o.status==="corrected"?"border-gray-300 text-gray-400 cursor-not-allowed":"border-yellow-300 text-yellow-600 hover:bg-yellow-50"}`,children:[e.jsx(de,{className:"w-4 h-4"}),"Modifier la vente"]}),e.jsx("button",{onClick:()=>M(!1),className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Fermer"})]})]})]})}),_e&&x&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:["Détails des modifications - ",x.saleId]}),e.jsx("button",{onClick:()=>Z(!1),className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3 bg-blue-50 p-3 rounded-lg",children:"État actuel de la vente"}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 mb-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Client"}),e.jsxs("p",{className:"text-sm text-gray-900",children:[x.customer.name," (",x.customer.phone,")"]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Total actuel"}),e.jsxs("p",{className:"text-sm font-medium text-gray-900",children:[p(F(x.total,x.items,x.exchangeRate)??0),e.jsxs("span",{className:"block text-xs font-normal text-gray-500",children:["≈ ",u(x.total)]})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Méthode de paiement"}),e.jsx("p",{className:"text-sm text-gray-900 capitalize",children:x.paymentMethod})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Articles"}),e.jsxs("p",{className:"text-sm text-gray-900",children:[x.items.length," article(s)"]})]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Historique des modifications"}),e.jsx("div",{className:"space-y-4",children:x.editHistory&&x.editHistory.length>0?x.editHistory.map((t,s)=>e.jsxs("div",{className:"border border-gray-200 rounded-lg p-4 bg-gray-50",children:[e.jsxs("div",{className:"flex justify-between items-start mb-3",children:[e.jsxs("div",{children:[e.jsxs("h5",{className:"font-medium text-gray-900",children:["Modification #",x.editHistory.length-s]}),e.jsx("p",{className:"text-sm text-gray-600",children:C(t.editedAt)})]}),e.jsxs("div",{className:"text-right",children:[e.jsxs("p",{className:"text-sm font-medium text-gray-900",children:["Par: ",t.editedBy]}),e.jsxs("p",{className:"text-sm text-gray-600",children:["Raison: ",t.reason]})]})]}),t.changes&&Object.keys(t.changes).length>0&&e.jsxs("div",{className:"space-y-3",children:[e.jsx("h6",{className:"font-medium text-gray-700 text-sm",children:"Changements détaillés:"}),Object.entries(t.changes).map(([a,r])=>e.jsxs("div",{className:"border-l-4 border-blue-500 pl-3",children:[e.jsxs("div",{className:"font-medium text-gray-700 text-sm capitalize mb-2",children:[a.replace(/([A-Z])/g," $1").toLowerCase(),":"]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-3 text-sm",children:[e.jsxs("div",{className:"bg-red-50 p-3 rounded border border-red-200",children:[e.jsx("div",{className:"text-red-700 font-medium mb-1",children:"Avant:"}),e.jsx("div",{className:"text-red-600 break-words",children:typeof r.from=="object"?JSON.stringify(r.from,null,2):String(r.from||"N/A")})]}),e.jsxs("div",{className:"bg-green-50 p-3 rounded border border-green-200",children:[e.jsx("div",{className:"text-green-700 font-medium mb-1",children:"Après:"}),e.jsx("div",{className:"text-green-600 break-words",children:typeof r.to=="object"?JSON.stringify(r.to,null,2):String(r.to||"N/A")})]})]})]},a))]})]},t._id||s)):e.jsxs("div",{className:"text-center py-8 text-gray-500",children:[e.jsx(le,{className:"w-12 h-12 mx-auto mb-4 opacity-50"}),e.jsx("p",{children:"Aucun détail de modification disponible"})]})})]}),e.jsx("div",{className:"flex gap-3 pt-4 border-t border-gray-200",children:e.jsx("button",{onClick:()=>Z(!1),className:"flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Fermer"})})]})]})}),Be&&g&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:["Edit Sale - ",g.saleId]}),e.jsx("button",{onClick:ae,className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[D&&e.jsx("div",{className:"p-3 bg-red-100 text-red-700 rounded-lg",children:D}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Information sur le client"}),e.jsxs("label",{className:"flex items-center gap-2 mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer select-none w-fit",children:[e.jsx("input",{type:"checkbox",checked:d.isWalkIn,onChange:xt,className:"w-4 h-4"}),e.jsx("span",{className:"text-sm font-medium text-gray-700",children:"Client de passage (sans coordonnées)"})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Nom"}),e.jsx("input",{type:"text",value:d.customer.name,onChange:t=>m(s=>({...s,customer:{...s.customer,name:t.target.value}})),className:"w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400",disabled:d.isWalkIn,required:!d.isWalkIn})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Numéro de téléphone"}),e.jsx("input",{type:"tel",value:d.customer.phone,onChange:t=>m(s=>({...s,customer:{...s.customer,phone:t.target.value}})),className:"w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400",disabled:d.isWalkIn,required:!d.isWalkIn})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Email"}),e.jsx("input",{type:"email",value:d.customer.email,onChange:t=>m(s=>({...s,customer:{...s.customer,email:t.target.value}})),className:"w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400",disabled:d.isWalkIn})]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Methode de payement"}),e.jsxs("select",{value:d.paymentMethod,onChange:t=>m(s=>({...s,paymentMethod:t.target.value})),className:"w-full p-2 border rounded",children:[e.jsx("option",{value:"cash",children:"Cash"}),e.jsx("option",{value:"card",children:"Card"}),e.jsx("option",{value:"transfer",children:"Transfer"}),e.jsx("option",{value:"other",children:"Other"})]})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex justify-between items-center mb-3",children:[e.jsx("h4",{className:"text-md font-medium text-gray-900",children:"Articles"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("button",{onClick:te,disabled:U,className:"px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1",children:[e.jsx(oe,{className:`w-3 h-3 ${U?"animate-spin":""}`})," ","Refresh Products"]}),e.jsxs("button",{onClick:pt,disabled:N.length===0,className:"px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1",children:[e.jsx(Ue,{className:"w-3 h-3"})," Ajouter un article"]})]})]}),N.length===0&&!U&&e.jsx("div",{className:"p-3 bg-yellow-100 text-yellow-700 rounded-lg mb-4",children:e.jsx("p",{className:"text-sm",children:"Aucun article disponible. Veuillez vérifier si des articles existent dans votre base de données."})}),e.jsx("div",{className:"space-y-4",children:d.items.map((t,s)=>e.jsx("div",{className:"border rounded-lg p-4 bg-gray-50",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-12 gap-4 items-end",children:[e.jsxs("div",{className:"md:col-span-4",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Article"}),U?e.jsx("div",{className:"p-2 border rounded bg-gray-200 text-gray-600 text-sm",children:"Loading products..."}):N.length===0?e.jsx("input",{type:"text",value:t.name,onChange:a=>{const r=[...d.items];r[s].name=a.target.value,m(i=>({...i,items:r}))},placeholder:"Product name",className:"w-full p-2 border rounded"}):e.jsx("select",{value:t.productId,onChange:a=>gt(s,a.target.value),className:"w-full p-2 border rounded",children:N.map(a=>e.jsxs("option",{value:a._id,children:[a.name," -"," ",u(a.price)," (Stock:"," ",a.stock,")"]},a._id))})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Prix"}),e.jsx("input",{type:"number",min:"0",step:"0.01",value:t.price,onChange:a=>ut(s,parseFloat(a.target.value)||0),className:"w-full p-2 border rounded"})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsxs("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:["Nombre de pièces"," "]}),e.jsxs("div",{className:"flex items-center border rounded",children:[e.jsx("button",{type:"button",onClick:()=>re(s,t.quantity-1),className:"p-2 hover:bg-gray-200",disabled:t.quantity<=1,children:e.jsx(ie,{className:"w-3 h-3"})}),e.jsx("input",{type:"number",min:"1",value:t.quantity,onChange:a=>re(s,parseInt(a.target.value)||1),className:"w-full p-2 text-center border-0"}),e.jsx("button",{type:"button",onClick:()=>re(s,t.quantity+1),className:"p-2 hover:bg-gray-200",children:e.jsx(Ue,{className:"w-3 h-3"})})]})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Total"}),e.jsx("div",{className:"p-2 bg-white border rounded font-medium",children:u(t.total)})]}),e.jsx("div",{className:"md:col-span-2",children:e.jsxs("button",{type:"button",onClick:()=>ht(s),className:"w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-1",children:[e.jsx(De,{className:"w-3 h-3"})," Supprimer"]})})]})},t._id))})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4",children:[e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Sous-total:"}),e.jsx("span",{className:"text-sm text-gray-900",children:u(yt)})]}),e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:"Total:"}),e.jsx("span",{className:"text-gray-900",children:u(jt)})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Raison de modification"}),e.jsx("textarea",{value:d.reason,onChange:t=>m(s=>({...s,reason:t.target.value})),placeholder:"Veuillez indiquer une raison pour la modification de cette vente....",className:"w-full p-2 border rounded h-20",required:!0})]}),e.jsxs("div",{className:"flex gap-3 pt-4",children:[e.jsx("button",{onClick:bt,disabled:_||d.items.length===0,className:"flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2",children:_?e.jsxs(e.Fragment,{children:[e.jsx(oe,{className:"w-4 h-4 animate-spin"})," Updating..."]}):e.jsxs(e.Fragment,{children:[e.jsx(de,{className:"w-4 h-4"})," Mettre à jour la vente"]})}),e.jsx("button",{onClick:ae,className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Cancel"})]})]})]})})]})}export{Kt as default};
