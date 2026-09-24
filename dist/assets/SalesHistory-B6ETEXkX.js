import{A as Tt,t as l,x as I,h as Ie,y as Fe,s as e,M as Ee,S as It,c as Pe,d as ne,n as Ft,E as Et,U as Pt,m as Mt,k as E,u as Rt}from"./index-BalGFMsI.js";import{s as ie,a as Ut,p as oe,P as Me}from"./labels-CLkR1D3V.js";import{E as Dt}from"./jspdf.es.min-BLHfMhLf.js";import{b as Lt}from"./notify-CfYsxrlT.js";import{u as zt,v as qt}from"./useConfirmAction-jH2uII0Y.js";import{m as P,k as Re,g as Ue,d as Ot,f as Bt,h as De,j as Le,i as ze,e as Ht,l as Wt}from"./salePricing-B6CLvYLp.js";import{F as qe}from"./funnel-BhX9yFFb.js";import{S as Vt}from"./search-CjHoRDHU.js";import{F as H}from"./file-text-DbJRDj5T.js";import{D as le}from"./download-BtWjkN8y.js";import{M as de}from"./minus-B8aa3y76.js";import{C as _t}from"./calendar-BWvZlzqW.js";import{C as Oe}from"./chevron-down-D_Nao-02.js";import{H as ce}from"./history-kdMwWz3k.js";import{S as me}from"./square-pen-CejW2XqV.js";import{T as Be}from"./trash-2-Ddnxl_49.js";import{P as He}from"./plus-Cr8rTDFU.js";const Jt=c=>c!==null&&typeof c=="object"&&("from"in c||"to"in c)?{from:c.from,to:c.to}:{from:void 0,to:c},We=c=>Object.entries(c||{}).map(([f,k])=>[f,Jt(k)]),W=()=>{const c=new Date,f=c.getFullYear(),k=String(c.getMonth()+1).padStart(2,"0"),_=String(c.getDate()).padStart(2,"0");return`${f}-${k}-${_}`},V=()=>{const c=new Date,f=c.getFullYear(),k=String(c.getMonth()+1).padStart(2,"0");return`${f}-${k}`},M=()=>new Date().getFullYear();function xs(){const{token:c}=Tt(),f=l.useCallback(()=>c||localStorage.getItem("token")||"",[c]),k=l.useRef(()=>{}),[_,Ve]=l.useState([]),[w,_e]=l.useState([]),[F,Je]=l.useState({shopName:"ETS DOUBLE M CLASSIC BOUTIQUE",shopAddress:"780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",shopNumber:"+243 836 017 031",shopRegistration:"LSH/RCCM/22-A-01266",receiptFooter:"Merci pour votre confiance ! À bientôt."}),[J,R]=l.useState(!0),[p,xe]=l.useState(""),[o,Qe]=l.useState(null),[Ye,U]=l.useState(!1),[Ge,he]=l.useState(!1),[b,ue]=l.useState(null),[d,x]=l.useState({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",isWalkIn:!1}),[pe,ge]=l.useState(null),[D,m]=l.useState(null),[L,fe]=l.useState(!1),[Ke,be]=l.useState(null),[z,Q]=l.useState(!1),Y=!!Ke,G=zt(),[C,ye]=l.useState("today"),[n,K]=l.useState({from:"",to:"",date:W(),year:M().toString(),month:V().split("-")[1],type:"",status:"",customerPhone:"",category:""}),[y,je]=l.useState(!1),[ve,Ze]=l.useState([]),[h,Xe]=l.useState(null),[et,Z]=l.useState(!1),[Ne,tt]=l.useState(null),[j,st]=l.useState(null),[v,at]=l.useState(null),[q,rt]=l.useState(!1),[O,nt]=l.useState(!1),[we,X]=l.useState(1),[A,it]=l.useState(null),[ee,ot]=l.useState(null);l.useEffect(()=>{lt(),$(),te(),fetch(`${I}/exchange-rates/current`,{headers:{Authorization:`Bearer ${f()}`}}).then(s=>s.ok?s.json():null).then(s=>{s?.rate&&ot(s.rate)}).catch(()=>{}),fetch(`${I}/settings/receipt`,{headers:{Authorization:`Bearer ${f()}`}}).then(s=>s.ok?s.json():null).then(s=>{s&&Je({shopName:s.shopName||"ETS DOUBLE M CLASSIC BOUTIQUE",shopAddress:s.shopAddress||"",shopNumber:s.shopNumber||"",shopRegistration:s.shopRegistration||"",receiptFooter:s.receiptFooter||""})}).catch(()=>{});const t=()=>{k.current()};return window.addEventListener("salesUpdated",t),()=>{window.removeEventListener("salesUpdated",t)}},[]),l.useEffect(()=>{Object.keys(n).length>0&&$()},[n,we,p]),l.useEffect(()=>{X(1)},[n,p]);const lt=async()=>{try{const t=localStorage.getItem("user");if(t){const a=JSON.parse(t);be(a),Q(a.role==="superadmin");return}const s=await fetch(`${I}/users/me`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${f()}`}});if(s.ok){const a=await s.json();be(a),Q(a.role==="superadmin"),localStorage.setItem("user",JSON.stringify(a))}}catch(t){console.error("Error fetching user data:",t),Q(!1)}},dt=t=>t.filter(s=>{const r=!["expense","depense"].includes(s.status?.toLowerCase()),i=!!s.saleId&&Array.isArray(s.items);return r&&i}).map(s=>s.customer?s:{...s,customer:{name:"Client non renseigné",phone:"",email:""}}),ct=()=>{const t=new URLSearchParams;switch(t.set("page",String(we)),t.set("limit","50"),t.set("type","sale"),C){case"custom":n.from&&t.append("from",n.from),n.to&&t.append("to",n.to);break;case"day":n.date&&t.append("date",n.date);break;case"month":n.year&&t.append("year",n.year),n.month&&t.append("month",n.month);break;case"year":n.year&&t.append("year",n.year);break}return n.status&&t.append("status",n.status),n.customerPhone&&t.append("customerPhone",n.customerPhone),z&&n.category&&t.append("category",n.category),p.trim()&&t.append("search",p.trim()),t.toString()},$=async()=>{try{R(!0),m(null);const t=ct(),s=`${I}/sales${t?`?${t}`:""}`;console.log("Fetching sales from:",s);const a=await fetch(s,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${f()}`}});if(a.ok){const r=await a.json();if(r.success&&r.data&&Array.isArray(r.data)){const i=r.data;console.log(`Fetched ${i.length} sales from API`),console.log("Timeframe metadata:",r.timeframe),console.log("Summary stats:",r.summary);const S=dt(i);console.log(`After filtering: ${S.length} valid sales`),Ve(S),it(r.pagination||null),tt(r.timeframe),st(r.summary),at(r.filtersApplied),mt(S)}else console.warn("Unexpected sales data structure:",r),m("Réponse inattendue du serveur. Actualisez la page.")}else m(`Impossible de charger les ventes. ${(await Ie(a)).message}`)}catch(t){m(`Impossible de charger les ventes. ${Fe(t).message}`)}finally{R(!1)}};k.current=$;const mt=t=>{const a=t.filter(r=>r.editHistory&&r.editHistory.length>0||r.editedBy).sort((r,i)=>{const S=r.editedAt?new Date(r.editedAt).getTime():new Date(r.updatedAt).getTime();return(i.editedAt?new Date(i.editedAt).getTime():new Date(i.updatedAt).getTime())-S});Ze(a)},xt=t=>{ye(t);const s={...n};switch(t){case"today":s.date=W(),s.from="",s.to="",s.year=M().toString(),s.month=V().split("-")[1];break;case"day":s.date=W(),s.from="",s.to="";break;case"month":s.year=M().toString(),s.month=V().split("-")[1],s.date="",s.from="",s.to="";break;case"year":s.year=M().toString(),s.month="",s.date="",s.from="",s.to="";break;case"custom":if(!s.from){const a=new Date,r=new Date(a.getFullYear(),a.getMonth(),1);s.from=r.toISOString().split("T")[0]}s.to||(s.to=new Date().toISOString().split("T")[0]),s.date="",s.year="",s.month="";break}K(s)},N=(t,s)=>{K(a=>({...a,[t]:s}))},ht=()=>{K({from:"",to:"",date:W(),year:M().toString(),month:V().split("-")[1],type:"",status:"",customerPhone:"",category:""}),ye("today"),je(!1),xe("")},te=async()=>{try{fe(!0);const t=await fetch(`${I}/products?limit=0`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${f()}`}});if(t.ok){const s=await t.json();let a=[];Array.isArray(s)?a=s:s&&Array.isArray(s.products)?a=s.products:s&&typeof s=="object"&&(a=[s]),console.log("Processed products:",a.length),_e(a)}else console.error("Products API Error:",t.status,t.statusText)}catch(t){console.error("Error loading products:",t)}finally{fe(!1)}},se=y?ve.filter(t=>t.saleId.toLowerCase().includes(p.toLowerCase())||t.customer.name.toLowerCase().includes(p.toLowerCase())||t.customer.phone.includes(p)||t.salesPerson&&t.salesPerson.toLowerCase().includes(p.toLowerCase())):_.filter(t=>t.saleId.toLowerCase().includes(p.toLowerCase())||t.customer.name.toLowerCase().includes(p.toLowerCase())||t.customer.phone.includes(p)||t.salesPerson&&t.salesPerson.toLowerCase().includes(p.toLowerCase())),T=t=>Mt(t),u=Ot,g=Bt,Se=(t,s)=>{const a=Ht(t,s);return`${Wt(t).toFixed(2)}$${a===void 0?"":` / ${g(a)}`}`},ke=(t,s)=>{const a=Ue(t,s);return`${Re(t).toFixed(2)}$${a===void 0?"":` / ${g(a)}`}`},B=(t,s,a)=>{const r=P(t,s,a);return`${t.toFixed(2)}$${r===void 0?"":` / ${g(r)}`}`},ut=t=>De(t)==="FC"?g(Le(t)):u(Le(t)),pt=t=>De(t)==="FC"?g(ze(t)):u(ze(t)),gt=()=>{if(Ne)return E(Ne.description);switch(C){case"day":return n.date?E(`Day: ${n.date}`):"Aujourd'hui";case"month":return n.year&&n.month?E(`Month: ${n.year}-${n.month.padStart(2,"0")}`):"Ce mois-ci";case"year":return n.year?E(`Year: ${n.year}`):"Cette année";case"custom":return E(`Custom range: ${n.from||"Beginning"} to ${n.to||"Now"}`);default:return"Aujourd'hui"}},ft=t=>{Xe(t),Z(!0)},bt=t=>{if(!t.editHistory||t.editHistory.length===0)return null;const s=t.editHistory[t.editHistory.length-1],a=s.changes;return e.jsxs("div",{className:"mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg",children:[e.jsxs("h4",{className:"font-medium text-yellow-800 mb-2 flex items-center gap-2",children:[e.jsx(ce,{className:"w-4 h-4"}),"Dernière modification"]}),e.jsxs("div",{className:"space-y-2 text-sm",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-yellow-700",children:"Modifié par:"}),e.jsx("span",{className:"font-medium",children:s.editedBy||t.editedBy||"Non renseigné"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-yellow-700",children:"Date de modification:"}),e.jsx("span",{className:"font-medium",children:T(s.editedAt||t.editedAt||t.updatedAt)})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-yellow-700",children:"Raison:"}),e.jsx("span",{className:"font-medium text-right",children:s.reason})]}),a&&Object.keys(a).length>0&&e.jsxs("div",{className:"mt-3 pt-3 border-t border-yellow-200",children:[e.jsx("h5",{className:"font-medium text-yellow-800 mb-2",children:"Changements:"}),We(a).map(([r,i])=>e.jsxs("div",{className:"mb-2 last:mb-0",children:[e.jsxs("div",{className:"font-medium text-yellow-700 capitalize",children:[r.replace(/([A-Z])/g," $1").toLowerCase(),":"]}),e.jsxs("div",{className:"grid grid-cols-2 gap-2 text-xs",children:[e.jsxs("div",{className:"bg-red-50 p-2 rounded",children:[e.jsx("div",{className:"text-red-600 font-medium",children:"Avant:"}),e.jsx("div",{className:"truncate",children:JSON.stringify(i.from)})]}),e.jsxs("div",{className:"bg-green-50 p-2 rounded",children:[e.jsx("div",{className:"text-green-600 font-medium",children:"Après:"}),e.jsx("div",{className:"truncate",children:JSON.stringify(i.to)})]})]})]},r))]})]})]})},Ce=async t=>{const s=window.open("","_blank","width=320,height=600");s&&(s.document.write(`
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
        <div class="shop-name"><strong>${F.shopName}</strong></div>
        <div class="shop-details"><strong>${F.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${F.shopNumber}</strong></div>
        <div class="shop-details"><strong>${F.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${T(t.createdAt)}</strong></div>
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
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${a.quantity} x ${Se(a,t.exchangeRate)} = ${ke(a,t.exchangeRate)}</strong></div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>SOUS-TOTAL:</strong></div>
          <div><strong>${B(t.subtotal,t.items,t.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>TOTAL:</strong></div>
          <div><strong>${B(t.total,t.items,t.exchangeRate)}</strong></div>
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
        <div class="thank-you"><strong>${F.receiptFooter||"MERCI POUR VOTRE ACHAT !"}</strong></div>
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
`),s.document.close())},Ae=async t=>{const s=new Dt;s.setFontSize(20),s.text("ETS DOUBLE M CLASSIC BOUTIQUE",105,10,{align:"center"}),s.setFontSize(10),s.text("Vêtements & Chaussures",105,15,{align:"center"}),s.setFontSize(12),s.text("LSH/RCCM/22-A-01266",105,20,{align:"center"}),s.text("Tél: +243 836 017 031",105,25,{align:"center"}),s.text("780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",105,30,{align:"center"}),s.setFontSize(16),s.text("Reçu de vente",105,35,{align:"center"}),s.setFontSize(10),s.text(`Date: ${T(t.createdAt)}`,20,45),s.text(`Reçu #: ${t.saleId}`,20,52),s.text(`Payement: ${t.paymentMethod.toUpperCase()}`,20,59),s.text(`Statut: ${t.status.toUpperCase()}`,20,66),s.text(`Agent: ${t.salesPerson||"Non spécifié"}`,20,73),s.setFontSize(12),s.text("Information sur le client:",20,85),s.setFontSize(10),s.text(`Nom: ${t.customer.name}`,20,92),t.customer.phone&&s.text(`Phone: ${t.customer.phone}`,20,99),t.customer.email&&s.text(`Email: ${t.customer.email}`,20,106),s.setFontSize(12),s.text("Articles:",20,113),s.setFontSize(10);let a=120;t.items.forEach((r,i)=>{a>250&&(s.addPage(),a=20),s.text(`${i+1}. ${r.name}`,20,a),s.text(`Qté: ${r.quantity} x ${Se(r,t.exchangeRate)} = ${ke(r,t.exchangeRate)}`,25,a+6),a+=15}),a+=7,s.text(`Sous-total: ${B(t.subtotal,t.items,t.exchangeRate)}`,20,a),s.text(`Total: ${B(t.total,t.items,t.exchangeRate)}`,20,a+5),s.setFontSize(10),s.text("Merci pour votre achat !",105,a+20,{align:"center"}),s.text("Les marchandises vendues ne sont ni reprises ni échangées.",105,a+30,{align:"center"}),s.text("À bientôt",105,a+40,{align:"center"}),s.save(`receipt-${t.saleId}.pdf`)},yt=t=>{Qe(t),U(!0),m(null)},$e=async t=>{if(t.status==="voided"||t.status==="corrected"){m("Une vente annulée ou corrigée ne peut plus être modifiée.");return}ue(t),x({customer:{...t.customer},items:t.items.map(s=>({...s})),paymentMethod:t.paymentMethod,reason:"",isWalkIn:!!t.isWalkIn}),he(!0),m(null),w.length===0&&await te()},ae=()=>{he(!1),ue(null),x({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",isWalkIn:!1}),m(null)},jt=()=>{x(t=>({...t,isWalkIn:!t.isWalkIn,customer:t.isWalkIn?t.customer:{name:"",phone:"",email:""}}))},re=(t,s)=>{if(s<1)return;const a=[...d.items],r=w.find(i=>i._id===a[t].productId);if(r&&s>r.stock+a[t].quantity){m(`Stock insuffisant (disponible : ${r.stock}).`);return}a[t].quantity=s,a[t].total=s*a[t].price,x(i=>({...i,items:a})),m(null)},vt=(t,s)=>{if(s<0)return;const a=[...d.items],r=a[t].exchangeRate??b?.exchangeRate;a[t]={...a[t],price:s,total:s*a[t].quantity,enteredPrice:s,enteredCurrency:"USD",priceUSD:s,priceFC:r?Math.round(s*r):void 0,exchangeRate:r},x(i=>({...i,items:a}))},Nt=t=>{const s=d.items.filter((a,r)=>r!==t);x(a=>({...a,items:s}))},wt=()=>{if(w.length===0){m("Aucun article disponible. Actualisez la liste des articles.");return}const t=w[0],s={productId:t._id,name:t.name,quantity:1,price:t.price,total:t.price,enteredPrice:t.price,enteredCurrency:"USD",priceUSD:t.price,priceFC:b?.exchangeRate?Math.round(t.price*b.exchangeRate):void 0,exchangeRate:b?.exchangeRate,_id:`temp-${Date.now()}`};x(a=>({...a,items:[...a.items,s]}))},St=(t,s)=>{const a=w.find(S=>S._id===s);if(!a){m("Article introuvable. Actualisez la liste des articles.");return}const r=[...d.items],i=r[t].exchangeRate??b?.exchangeRate;r[t]={...r[t],productId:s,name:a.name,price:a.price,total:a.price*r[t].quantity,enteredPrice:a.price,enteredCurrency:"USD",priceUSD:a.price,priceFC:i?Math.round(a.price*i):void 0,exchangeRate:i},x(S=>({...S,items:r})),m(null)},Te=()=>{const t=d.items.reduce((s,a)=>s+a.total,0);return{subtotal:t,total:t}},kt=t=>{t.status!=="voided"&&G.request({...qt(t),reason:{label:"Motif de l'annulation",placeholder:"Ex. : client remboursé, erreur de saisie…"},action:s=>Rt(`${I}/sales/${t._id}/void`,{method:"PATCH",body:{reason:s||"Vente annulée"}}),onSuccess:async()=>{U(!1),await $(),window.dispatchEvent(new Event("salesUpdated"))},onError:async s=>{(s.isConflict||s.status===404)&&await $()}})},Ct=async()=>{if(b){if(d.items.length===0){m("La vente doit contenir au moins un article.");return}if(!d.isWalkIn&&(!d.customer.name||!d.customer.phone)){m("Le nom et le téléphone du client sont obligatoires.");return}if(!d.reason){m("Indiquez le motif de la correction.");return}try{R(!0);const{subtotal:t,total:s}=Te(),a={customer:d.isWalkIn?{name:"Client de passage",phone:"",email:""}:d.customer,isWalkIn:d.isWalkIn,items:d.items.map(i=>({productId:i.productId,name:i.name,quantity:i.quantity,price:i.price,total:i.total,enteredPrice:i.enteredPrice,enteredCurrency:i.enteredCurrency,priceUSD:i.priceUSD,priceFC:i.priceFC,exchangeRate:i.exchangeRate})),subtotal:t,total:s,exchangeRate:b.exchangeRate,paymentMethod:d.paymentMethod,reason:d.reason,_id:b._id,saleId:b.saleId},r=await fetch(`${I}/sales/${b._id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${f()}`},body:JSON.stringify(a)});if(r.ok)await r.json(),ge("✅ Modification enregistrée avec succès."),Lt("Modification enregistrée avec succès."),await $(),setTimeout(()=>{window.dispatchEvent(new Event("salesUpdated"))},1e3),ae();else{const i=await Ie(r);m(i.message),i.isConflict&&await $()}}catch(t){m(Fe(t).message)}finally{R(!1)}}},{subtotal:At,total:$t}=Te();return e.jsxs("div",{className:"space-y-6 p-6 flex-1 overflow-auto",children:[e.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-4 overflow-auto",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900",children:Ee.sales.label}),e.jsx("p",{className:"text-gray-600",children:Ee.sales.description})]}),e.jsxs("div",{className:"flex gap-3",children:[e.jsxs("button",{onClick:()=>je(!y),className:`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${y?"bg-blue-500 text-white border-blue-500 shadow-sm":"bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`,children:[e.jsx(qe,{className:"w-4 h-4"}),y?"Toutes les ventes":"Ventes modifiées",y&&e.jsx("span",{className:"bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full",children:ve.length})]}),e.jsxs("div",{className:"relative",children:[e.jsx(Vt,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),e.jsx("input",{type:"text",placeholder:"Rechercher une vente…","aria-label":"Rechercher une vente",className:"pl-10 w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",value:p,onChange:t=>xe(t.target.value)})]})]})]}),z&&j&&e.jsxs("div",{className:"bg-blue-50 p-4 rounded-lg border border-blue-200",children:[e.jsx("div",{className:"flex items-center justify-between mb-3",children:e.jsxs("h3",{className:"text-lg font-semibold text-blue-900 flex items-center gap-2",children:[e.jsx(It,{className:"w-5 h-5"}),"Synthèse de la période"]})}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-4",children:[e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Enregistrements"}),e.jsx("p",{className:"text-2xl font-bold text-gray-900",children:j.totalRecords})]}),e.jsx(H,{className:"w-8 h-8 text-blue-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Chiffre d'affaires"}),e.jsx("p",{className:"text-2xl font-bold text-green-600",children:g(j.revenue*(ee||0))}),e.jsxs("p",{className:"text-xs text-gray-500",children:["≈ ",u(j.revenue)]})]}),e.jsx(le,{className:"w-8 h-8 text-green-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Sorties historiques"}),e.jsx("p",{className:"text-[11px] text-gray-500",children:"Anciennes sorties enregistrées avec les ventes"}),e.jsx("p",{className:"text-2xl font-bold text-red-600",children:g(j.expenses*(ee||0))}),e.jsxs("p",{className:"text-xs text-gray-500",children:["≈ ",u(j.expenses)]})]}),e.jsx(de,{className:"w-8 h-8 text-red-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Chiffre d'affaires − sorties historiques"}),e.jsx("p",{className:"text-2xl font-bold text-blue-600",children:g(j.net*(ee||0))}),e.jsxs("p",{className:"text-xs text-gray-500",children:["≈ ",u(j.net)]})]}),e.jsx(Pe,{className:"w-8 h-8 text-blue-500"})]})})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 mt-4",children:[e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Nombre de ventes"}),e.jsx("p",{className:"text-xl font-bold text-green-700",children:j.salesCount})]}),e.jsx(H,{className:"w-6 h-6 text-green-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Nombre de sorties historiques"}),e.jsx("p",{className:"text-xl font-bold text-red-700",children:j.expensesCount})]}),e.jsx(de,{className:"w-6 h-6 text-red-500"})]})})]})]}),e.jsxs("div",{className:"bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900 flex items-center gap-2",children:[e.jsx(_t,{className:"w-4 h-4 sm:w-5 sm:h-5"}),y?"Ventes modifiées":"Toutes les ventes"," - ",gt()]}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsxs("button",{onClick:()=>rt(!q),className:"px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2",children:[e.jsx(qe,{className:"w-4 h-4"}),q?"Masquer les filtres":"Afficher les filtres",e.jsx(Oe,{className:`w-4 h-4 transition-transform ${q?"rotate-180":""}`})]}),e.jsxs("button",{onClick:ht,className:"px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2",children:[e.jsx(ne,{className:"w-4 h-4"}),"Réinitialiser les filtres"]})]})]}),q&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("span",{id:"sales-history-timeframe-type",className:"block text-sm font-medium text-gray-700 mb-2",children:"Période"}),e.jsx("div",{role:"group","aria-labelledby":"sales-history-timeframe-type",className:"flex flex-wrap gap-2",children:["today","day","month","year","custom"].map(t=>e.jsxs("button",{onClick:()=>xt(t),className:`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${C===t?"bg-blue-500 text-white shadow-sm":"bg-gray-100 text-gray-700 hover:bg-gray-200"}`,children:[t==="today"&&"Aujourd'hui",t==="day"&&"Un jour",t==="month"&&"Un mois",t==="year"&&"Une année",t==="custom"&&"Intervalle"]},t))})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",children:[C==="day"&&e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-date",className:"block text-sm font-medium text-gray-700 mb-1",children:"Date"}),e.jsx("input",{id:"sales-history-date",type:"date",value:n.date,onChange:t=>N("date",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]}),C==="month"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-month-year",className:"block text-sm font-medium text-gray-700 mb-1",children:"Année"}),e.jsx("input",{id:"sales-history-month-year",type:"number",value:n.year,onChange:t=>N("year",t.target.value),min:"2000",max:"2100",className:"w-full p-2 border border-gray-300 rounded-lg"})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-month",className:"block text-sm font-medium text-gray-700 mb-1",children:"Mois"}),e.jsx("select",{id:"sales-history-month",value:n.month,onChange:t=>N("month",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:Array.from({length:12},(t,s)=>{const a=(s+1).toString().padStart(2,"0");return e.jsxs("option",{value:a,children:[Ft(s)," (",a,")"]},a)})})]})]}),C==="year"&&e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-year",className:"block text-sm font-medium text-gray-700 mb-1",children:"Année"}),e.jsx("input",{id:"sales-history-year",type:"number",value:n.year,onChange:t=>N("year",t.target.value),min:"2000",max:"2100",className:"w-full p-2 border border-gray-300 rounded-lg"})]}),C==="custom"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-from-date",className:"block text-sm font-medium text-gray-700 mb-1",children:"Du"}),e.jsx("input",{id:"sales-history-from-date",type:"date",value:n.from,onChange:t=>N("from",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-to-date",className:"block text-sm font-medium text-gray-700 mb-1",children:"Au"}),e.jsx("input",{id:"sales-history-to-date",type:"date",value:n.to,onChange:t=>N("to",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]})]})]}),e.jsxs("div",{children:[e.jsxs("button",{onClick:()=>nt(!O),className:"text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1",children:[O?"Masquer les filtres avancés":"Filtres avancés",e.jsx(Oe,{className:`w-4 h-4 transition-transform ${O?"rotate-180":""}`})]}),O&&e.jsxs("div",{className:"mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg",children:[z&&e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-categorie",className:"block text-sm font-medium text-gray-700 mb-1",children:"Catégorie"}),e.jsxs("select",{id:"sales-history-categorie",value:n.category,onChange:t=>N("category",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"Tous"}),e.jsx("option",{value:"CLOTHES",children:"Vêtements"}),e.jsx("option",{value:"SHOES",children:"Chaussures"})]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-sale-type",className:"block text-sm font-medium text-gray-700 mb-1",children:"Type d'opération"}),e.jsxs("select",{id:"sales-history-sale-type",value:n.type,onChange:t=>N("type",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"Tous les types"}),e.jsx("option",{value:"sale",children:"Vente"}),e.jsx("option",{value:"reservation",children:"Réservation"}),e.jsx("option",{value:"expense",children:"Sortie historique"})]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-status",className:"block text-sm font-medium text-gray-700 mb-1",children:"Statut"}),e.jsxs("select",{id:"sales-history-status",value:n.status,onChange:t=>N("status",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"Tous les statuts"}),e.jsx("option",{value:"completed",children:"Terminée"}),e.jsx("option",{value:"pending",children:"En attente"}),e.jsx("option",{value:"voided",children:"Annulée"})]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-customer-phone",className:"block text-sm font-medium text-gray-700 mb-1",children:"Téléphone du client"}),e.jsx("input",{id:"sales-history-customer-phone",type:"text",value:n.customerPhone,onChange:t=>N("customerPhone",t.target.value),placeholder:"Filtrer par téléphone…",className:"w-full p-2 border border-gray-300 rounded-lg"})]})]})]})]}),v&&e.jsxs("div",{className:"mt-4 text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Filtres appliqués :"}),e.jsxs("span",{className:"ml-2",children:["Statut : ",v.status&&v.status!=="all"?ie(v.status):"tous",", Type : ",v.type&&v.type!=="all"?Ut(v.type):"tous",v.customerPhone&&v.customerPhone!=="none"&&`, Téléphone : ${v.customerPhone}`]})]})]}),pe&&e.jsxs("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200",children:[pe,e.jsx("button",{onClick:()=>ge(null),className:"float-right text-green-700 hover:text-green-900",children:"×"})]}),D&&e.jsxs("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200",children:[D,e.jsx("button",{onClick:()=>m(null),className:"float-right text-red-700 hover:text-red-900",children:"×"})]}),e.jsxs("div",{className:"bg-white rounded-lg shadow",children:[e.jsx("div",{className:"px-6 py-4 border-b border-gray-200",children:e.jsxs("h2",{className:"text-lg font-semibold text-gray-900 flex items-center gap-2",children:[e.jsx(H,{className:"w-5 h-5"}),y?"Ventes modifiées":"Transactions de vente"," (",se.length,")"]})}),e.jsx("div",{className:"overflow-x-auto",children:J?e.jsxs("div",{className:"text-center py-12",children:[e.jsx("div",{className:"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"}),e.jsx("p",{className:"text-gray-500 mt-2",children:"Chargement des ventes..."})]}):se.length===0?e.jsxs("div",{className:"text-center py-12 text-gray-500",children:[e.jsx(H,{className:"w-12 h-12 mx-auto mb-4 opacity-50"}),e.jsx("p",{children:y?"Aucune vente modifiée trouvée":"Aucune vente trouvée"}),e.jsx("p",{className:"text-sm",children:"pour la période sélectionnée"})]}):e.jsx(e.Fragment,{children:e.jsxs("table",{className:"min-w-full divide-y divide-gray-200",children:[e.jsx("thead",{className:"bg-gray-50",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Identifiant de vente"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Client"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Agent"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Articles"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Total"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Payement"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Statut"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Date"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Modifié par"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]})}),e.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:se.map(t=>e.jsxs("tr",{className:"hover:bg-gray-50",children:[e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:t.saleId}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap",children:[e.jsxs("div",{className:"text-sm text-gray-900 flex items-center gap-2",children:[t.customer.name,t.isWalkIn&&e.jsx("span",{className:"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800",children:"Passage"})]}),e.jsx("div",{className:"text-sm text-gray-500",children:t.customer.phone})]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:t.salesPerson||"Non spécifié"}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:[t.items.length," Article(s)"]}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:[g(P(t.total,t.items,t.exchangeRate)??0),e.jsxs("div",{className:"text-xs font-normal text-gray-500",children:["≈ ",u(t.total)]})]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800",children:oe(t.paymentMethod)})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${t.status==="completed"?"bg-green-100 text-green-800":t.status==="voided"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`,children:ie(t.status)})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-500",children:T(t.createdAt)}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm",children:(()=>{const s=(t.editHistory&&t.editHistory.length>0?t.editHistory[t.editHistory.length-1].editedBy:null)||t.editedBy;return s?e.jsxs("span",{className:"inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium border border-yellow-200",children:["✏️ ",s]}):e.jsx("span",{className:"text-gray-300",children:"—"})})()}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium",children:e.jsxs("div",{className:"flex gap-2",children:[y?e.jsx("button",{onClick:()=>ft(t),className:"text-blue-600 hover:text-blue-900 p-1 rounded",title:"Voir les détails des modifications",children:e.jsx(ce,{className:"w-4 h-4"})}):e.jsx("button",{onClick:()=>yt(t),className:"text-blue-600 hover:text-blue-900 p-1 rounded",title:"Voir les détails",children:e.jsx(Et,{className:"w-4 h-4"})}),!y&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:()=>$e(t),disabled:t.status==="voided"||t.status==="corrected",className:`p-1 rounded ${t.status==="voided"||t.status==="corrected"?"text-gray-400 cursor-not-allowed":"text-yellow-600 hover:text-yellow-900"}`,title:"Corriger la vente",children:e.jsx(me,{className:"w-4 h-4"})}),Y&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:()=>Ae(t),className:"text-green-600 hover:text-green-900 p-1 rounded",title:"Télécharger le reçu (PDF)",children:e.jsx(le,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>Ce(t),className:"text-purple-600 hover:text-purple-900 p-1 rounded",title:"Réimprimer le reçu",children:e.jsx(Me,{className:"w-4 h-4"})})]}),z&&e.jsx("button",{onClick:()=>kt(t),disabled:t.status==="voided"||G.busy,className:`p-1 rounded ${t.status==="voided"?"text-gray-400 cursor-not-allowed":"text-red-600 hover:text-red-900"}`,title:"Annuler la vente","aria-label":`Annuler la vente ${t.saleId}`,children:e.jsx(Be,{className:"w-4 h-4"})})]})]})})]},t._id))})]})})})]}),A&&A.totalPages>1&&e.jsxs("div",{className:"flex items-center justify-between rounded-lg border bg-white px-4 py-3",children:[e.jsxs("span",{className:"text-sm text-gray-600",children:["Page ",A.page," sur ",A.totalPages," · ",A.totalRecords," ventes"]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{type:"button",disabled:!A.hasPreviousPage,onClick:()=>X(t=>Math.max(1,t-1)),className:"rounded border px-3 py-1.5 text-sm disabled:opacity-40",children:"Précédent"}),e.jsx("button",{type:"button",disabled:!A.hasNextPage,onClick:()=>X(t=>t+1),className:"rounded border px-3 py-1.5 text-sm disabled:opacity-40",children:"Suivant"})]})]}),Ye&&o&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:"Détails de la vente"}),e.jsx("button",{onClick:()=>U(!1),className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Identifiant de vente"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.saleId})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Date"}),e.jsx("p",{className:"text-sm text-gray-900",children:T(o.createdAt)})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Méthode de paiement"}),e.jsx("p",{className:"text-sm text-gray-900",children:oe(o.paymentMethod)})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Statut"}),e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${o.status==="completed"?"bg-green-100 text-green-800":o.status==="voided"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`,children:ie(o.status)})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Agent"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.salesPerson||"Non spécifié"})]}),o.editedBy&&e.jsxs("div",{className:"col-span-2",children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Dernière modification"}),e.jsxs("p",{className:"text-sm text-gray-900",children:["Par ",o.editedBy,o.editedAt?`, le ${T(o.editedAt)}`:""]})]})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(Pt,{className:"w-4 h-4"}),"Information sur le client",o.isWalkIn&&e.jsx("span",{className:"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800",children:"Client de passage"})]}),e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Nom"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.customer.name})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Phone"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.customer.phone})]}),o.customer.email&&e.jsxs("div",{className:"col-span-2",children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Email"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.customer.email})]})]})})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(Pe,{className:"w-4 h-4"}),"Articles (",o.items.length,")"]}),e.jsx("div",{className:"space-y-3",children:o.items.map((t,s)=>e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{children:[e.jsx("h5",{className:"font-medium text-gray-900",children:t.name}),e.jsxs("p",{className:"text-sm text-gray-600",children:["Nombre de pieces: ",t.quantity," ×"," ",ut(t)]})]}),e.jsx("div",{className:"text-right",children:e.jsxs("p",{className:"font-medium text-gray-900",children:[pt(t),t.enteredCurrency==="FC"?e.jsxs("span",{className:"block text-xs font-normal text-gray-500",children:["Reçu: ",u(Re(t))]}):(()=>{const a=Ue(t,o.exchangeRate);return a!==void 0?e.jsxs("span",{className:"block text-xs font-normal text-gray-500",children:["≈ ",g(a)]}):null})()]})})]})},s))})]}),o.editHistory&&o.editHistory.length>0&&bt(o),e.jsxs("div",{className:"border-t border-gray-200 pt-4",children:[e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Sous-total:"}),e.jsxs("span",{className:"text-sm text-gray-900 text-right",children:[e.jsx("span",{className:"block",children:g(P(o.subtotal,o.items,o.exchangeRate)??0)}),e.jsxs("span",{className:"block text-xs text-gray-500",children:["≈ ",u(o.subtotal)]})]})]}),e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:"Total:"}),e.jsxs("span",{className:"text-gray-900 text-right",children:[e.jsx("span",{className:"block",children:g(P(o.total,o.items,o.exchangeRate)??0)}),e.jsxs("span",{className:"block text-xs font-normal text-gray-500",children:["≈ ",u(o.total)]})]})]})]}),e.jsxs("div",{className:"flex flex-wrap gap-3 pt-4",children:[Y&&e.jsxs("button",{onClick:()=>Ae(o),className:"flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(le,{className:"w-4 h-4"}),"Télécharger PDF"]}),Y&&e.jsxs("button",{onClick:()=>Ce(o),className:"flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(Me,{className:"w-4 h-4"}),"Imprimer Reçu"]}),e.jsxs("button",{onClick:()=>$e(o),disabled:o.status==="voided"||o.status==="corrected",className:`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${o.status==="voided"||o.status==="corrected"?"border-gray-300 text-gray-400 cursor-not-allowed":"border-yellow-300 text-yellow-600 hover:bg-yellow-50"}`,children:[e.jsx(me,{className:"w-4 h-4"}),"Modifier la vente"]}),e.jsx("button",{onClick:()=>U(!1),className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Fermer"})]})]})]})}),et&&h&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:["Détails des modifications - ",h.saleId]}),e.jsx("button",{onClick:()=>Z(!1),className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3 bg-blue-50 p-3 rounded-lg",children:"État actuel de la vente"}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 mb-4",children:[e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Client"}),e.jsxs("p",{className:"text-sm text-gray-900",children:[h.customer.name," (",h.customer.phone,")"]})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Total actuel"}),e.jsxs("p",{className:"text-sm font-medium text-gray-900",children:[g(P(h.total,h.items,h.exchangeRate)??0),e.jsxs("span",{className:"block text-xs font-normal text-gray-500",children:["≈ ",u(h.total)]})]})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Méthode de paiement"}),e.jsx("p",{className:"text-sm text-gray-900",children:oe(h.paymentMethod)})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Articles"}),e.jsxs("p",{className:"text-sm text-gray-900",children:[h.items.length," article(s)"]})]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Historique des modifications"}),e.jsx("div",{className:"space-y-4",children:h.editHistory&&h.editHistory.length>0?h.editHistory.map((t,s)=>e.jsxs("div",{className:"border border-gray-200 rounded-lg p-4 bg-gray-50",children:[e.jsxs("div",{className:"flex justify-between items-start mb-3",children:[e.jsxs("div",{children:[e.jsxs("h5",{className:"font-medium text-gray-900",children:["Modification #",h.editHistory.length-s]}),e.jsx("p",{className:"text-sm text-gray-600",children:T(t.editedAt)})]}),e.jsxs("div",{className:"text-right",children:[e.jsxs("p",{className:"text-sm font-medium text-gray-900",children:["Par: ",t.editedBy]}),e.jsxs("p",{className:"text-sm text-gray-600",children:["Raison: ",t.reason]})]})]}),t.changes&&Object.keys(t.changes).length>0&&e.jsxs("div",{className:"space-y-3",children:[e.jsx("h6",{className:"font-medium text-gray-700 text-sm",children:"Changements détaillés:"}),We(t.changes).map(([a,r])=>e.jsxs("div",{className:"border-l-4 border-blue-500 pl-3",children:[e.jsxs("div",{className:"font-medium text-gray-700 text-sm capitalize mb-2",children:[a.replace(/([A-Z])/g," $1").toLowerCase(),":"]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-3 text-sm",children:[e.jsxs("div",{className:"bg-red-50 p-3 rounded border border-red-200",children:[e.jsx("div",{className:"text-red-700 font-medium mb-1",children:"Avant:"}),e.jsx("div",{className:"text-red-600 break-words",children:typeof r.from=="object"?JSON.stringify(r.from,null,2):String(r.from||"N/A")})]}),e.jsxs("div",{className:"bg-green-50 p-3 rounded border border-green-200",children:[e.jsx("div",{className:"text-green-700 font-medium mb-1",children:"Après:"}),e.jsx("div",{className:"text-green-600 break-words",children:typeof r.to=="object"?JSON.stringify(r.to,null,2):String(r.to||"N/A")})]})]})]},a))]})]},t._id||s)):e.jsxs("div",{className:"text-center py-8 text-gray-500",children:[e.jsx(ce,{className:"w-12 h-12 mx-auto mb-4 opacity-50"}),e.jsx("p",{children:"Aucun détail de modification disponible"})]})})]}),e.jsx("div",{className:"flex flex-wrap gap-3 pt-4 border-t border-gray-200",children:e.jsx("button",{onClick:()=>Z(!1),className:"flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Fermer"})})]})]})}),Ge&&b&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:["Corriger la vente ",b.saleId]}),e.jsx("button",{onClick:ae,className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[D&&e.jsx("div",{className:"p-3 bg-red-100 text-red-700 rounded-lg",children:D}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Information sur le client"}),e.jsxs("label",{className:"flex items-center gap-2 mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer select-none w-fit",children:[e.jsx("input",{type:"checkbox",checked:d.isWalkIn,onChange:jt,className:"w-4 h-4"}),e.jsx("span",{className:"text-sm font-medium text-gray-700",children:"Client de passage (sans coordonnées)"})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-edit-nom",className:"block text-sm font-medium text-gray-700 mb-1",children:"Nom"}),e.jsx("input",{id:"sales-edit-nom",type:"text",value:d.customer.name,onChange:t=>x(s=>({...s,customer:{...s.customer,name:t.target.value}})),className:"w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400",disabled:d.isWalkIn,required:!d.isWalkIn})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-edit-telephone",className:"block text-sm font-medium text-gray-700 mb-1",children:"Numéro de téléphone"}),e.jsx("input",{id:"sales-edit-telephone",type:"tel",value:d.customer.phone,onChange:t=>x(s=>({...s,customer:{...s.customer,phone:t.target.value}})),className:"w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400",disabled:d.isWalkIn,required:!d.isWalkIn})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-edit-email",className:"block text-sm font-medium text-gray-700 mb-1",children:"Email"}),e.jsx("input",{id:"sales-edit-email",type:"email",value:d.customer.email,onChange:t=>x(s=>({...s,customer:{...s.customer,email:t.target.value}})),className:"w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400",disabled:d.isWalkIn})]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Methode de payement"}),e.jsxs("select",{value:d.paymentMethod,onChange:t=>x(s=>({...s,paymentMethod:t.target.value})),className:"w-full p-2 border rounded",children:[e.jsx("option",{value:"cash",children:"Espèces"}),e.jsx("option",{value:"card",children:"Carte"}),e.jsx("option",{value:"transfer",children:"Virement"}),e.jsx("option",{value:"other",children:"Autre"})]})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex justify-between items-center mb-3",children:[e.jsx("h4",{className:"text-md font-medium text-gray-900",children:"Articles"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("button",{onClick:te,disabled:L,className:"px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1",children:[e.jsx(ne,{className:`w-3 h-3 ${L?"animate-spin":""}`})," ","Actualiser les articles"]}),e.jsxs("button",{onClick:wt,disabled:w.length===0,className:"px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1",children:[e.jsx(He,{className:"w-3 h-3"})," Ajouter un article"]})]})]}),w.length===0&&!L&&e.jsx("div",{className:"p-3 bg-yellow-100 text-yellow-700 rounded-lg mb-4",children:e.jsx("p",{className:"text-sm",children:"Aucun article disponible. Veuillez vérifier si des articles existent dans votre base de données."})}),e.jsx("div",{className:"space-y-4",children:d.items.map((t,s)=>e.jsx("div",{className:"border rounded-lg p-4 bg-gray-50",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-12 gap-4 items-end",children:[e.jsxs("div",{className:"md:col-span-4",children:[e.jsx("label",{htmlFor:`sales-edit-item-${s}-article`,className:"block text-sm font-medium text-gray-700 mb-1",children:"Article"}),L?e.jsx("div",{className:"p-2 border rounded bg-gray-200 text-gray-600 text-sm",children:"Chargement des articles…"}):w.length===0?e.jsx("input",{id:`sales-edit-item-${s}-article`,type:"text",value:t.name,onChange:a=>{const r=[...d.items];r[s].name=a.target.value,x(i=>({...i,items:r}))},placeholder:"Nom de l'article",className:"w-full p-2 border rounded"}):e.jsx("select",{id:`sales-edit-item-${s}-article`,value:t.productId,onChange:a=>St(s,a.target.value),className:"w-full p-2 border rounded",children:w.map(a=>e.jsxs("option",{value:a._id,children:[a.name," -"," ",u(a.price)," (Stock:"," ",a.stock,")"]},a._id))})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{htmlFor:`sales-edit-item-${s}-price`,className:"block text-sm font-medium text-gray-700 mb-1",children:"Prix"}),e.jsx("input",{id:`sales-edit-item-${s}-price`,type:"number",min:"0",step:"0.01",value:t.price,onChange:a=>vt(s,parseFloat(a.target.value)||0),className:"w-full p-2 border rounded"})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsxs("label",{htmlFor:`sales-edit-item-${s}-quantity`,className:"block text-sm font-medium text-gray-700 mb-1",children:["Nombre de pièces"," "]}),e.jsxs("div",{className:"flex items-center border rounded",children:[e.jsx("button",{type:"button",onClick:()=>re(s,t.quantity-1),className:"p-2 hover:bg-gray-200",disabled:t.quantity<=1,children:e.jsx(de,{className:"w-3 h-3"})}),e.jsx("input",{id:`sales-edit-item-${s}-quantity`,type:"number",min:"1",value:t.quantity,onChange:a=>re(s,parseInt(a.target.value)||1),className:"w-full p-2 text-center border-0"}),e.jsx("button",{type:"button",onClick:()=>re(s,t.quantity+1),className:"p-2 hover:bg-gray-200",children:e.jsx(He,{className:"w-3 h-3"})})]})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Total"}),e.jsx("div",{className:"p-2 bg-white border rounded font-medium",children:u(t.total)})]}),e.jsx("div",{className:"md:col-span-2",children:e.jsxs("button",{type:"button",onClick:()=>Nt(s),className:"w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-1",children:[e.jsx(Be,{className:"w-3 h-3"})," Supprimer"]})})]})},t._id))})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4",children:[e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Sous-total:"}),e.jsx("span",{className:"text-sm text-gray-900",children:u(At)})]}),e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:"Total:"}),e.jsx("span",{className:"text-gray-900",children:u($t)})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Raison de modification"}),e.jsx("textarea",{value:d.reason,onChange:t=>x(s=>({...s,reason:t.target.value})),placeholder:"Veuillez indiquer une raison pour la modification de cette vente....",className:"w-full p-2 border rounded h-20",required:!0})]}),e.jsxs("div",{className:"flex flex-wrap gap-3 pt-4",children:[e.jsx("button",{onClick:Ct,disabled:J||d.items.length===0,className:"flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2",children:J?e.jsxs(e.Fragment,{children:[e.jsx(ne,{className:"w-4 h-4 animate-spin"})," Enregistrement…"]}):e.jsxs(e.Fragment,{children:[e.jsx(me,{className:"w-4 h-4"})," Mettre à jour la vente"]})}),e.jsx("button",{onClick:ae,className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Annuler"})]})]})]})}),G.dialog]})}export{xs as default};
