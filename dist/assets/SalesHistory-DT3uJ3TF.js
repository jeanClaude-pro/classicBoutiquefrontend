import{N as Et,z as l,F as I,h as Ue,H as Re,x as e,M as De,S as Mt,c as Le,d as le,o as Ut,E as Rt,U as Dt,n as Lt,l as E,A as zt}from"./index-ByhrFalG.js";import{s as de,b as qt,p as ce}from"./labels-BYV0VG2_.js";import{E as Ot}from"./jspdf.es.min-Dw8DVyS2.js";import{b as Ht}from"./notify-6CY3UR_1.js";import{u as Bt,v as Wt}from"./useConfirmAction-Dfqw_vpq.js";import{m as M,k as ze,g as qe,j as me,d as _t,f as Vt,h as Oe,i as He,b as Be,e as Jt,l as Qt}from"./salePricing-TZJH2azO.js";import{F as We}from"./funnel-Dq_NKdIc.js";import{S as Yt}from"./search-DMDKcIS5.js";import{F as _}from"./file-text-Bmy8kCOy.js";import{D as xe}from"./download-B5nW8m5F.js";import{M as ue}from"./minus-D_SieZBv.js";import{C as Gt}from"./calendar-BeCDayOi.js";import{C as _e}from"./chevron-down-BEWLCKP6.js";import{H as he}from"./history-CGAbIp4b.js";import{S as pe}from"./square-pen-Cn1UF3ih.js";import{P as Ve}from"./printer-Cu0v-sDx.js";import{T as Je}from"./trash-2-CKnDkHWn.js";import{P as Qe}from"./plus-PHtOi2c-.js";const Kt=m=>m!==null&&typeof m=="object"&&("from"in m||"to"in m)?{from:m.from,to:m.to}:{from:void 0,to:m},Ye=m=>Object.entries(m||{}).map(([j,k])=>[j,Kt(k)]),V=()=>{const m=new Date,j=m.getFullYear(),k=String(m.getMonth()+1).padStart(2,"0"),Q=String(m.getDate()).padStart(2,"0");return`${j}-${k}-${Q}`},J=()=>{const m=new Date,j=m.getFullYear(),k=String(m.getMonth()+1).padStart(2,"0");return`${j}-${k}`},U=()=>new Date().getFullYear();function gs(){const{token:m}=Et(),j=l.useCallback(()=>m||localStorage.getItem("token")||"",[m]),k=l.useRef(()=>{}),[Q,Ge]=l.useState([]),[C,Ke]=l.useState([]),[T,Ze]=l.useState({shopName:"ETS DOUBLE M CLASSIC BOUTIQUE",shopAddress:"780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",shopNumber:"+243 836 017 031",shopRegistration:"LSH/RCCM/22-A-01266",receiptFooter:"Merci pour votre confiance ! À bientôt."}),[Y,R]=l.useState(!0),[b,ge]=l.useState(""),[o,Xe]=l.useState(null),[et,D]=l.useState(!1),[tt,fe]=l.useState(!1),[u,be]=l.useState(null),[d,p]=l.useState({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",isWalkIn:!1}),[ye,je]=l.useState(null),[L,x]=l.useState(null),[z,ve]=l.useState(!1),[st,Ne]=l.useState(null),[q,G]=l.useState(!1),K=!!st,Z=Bt(),[A,we]=l.useState("today"),[n,X]=l.useState({from:"",to:"",date:V(),year:U().toString(),month:J().split("-")[1],type:"",status:"",customerPhone:"",category:""}),[N,Se]=l.useState(!1),[Ce,at]=l.useState([]),[g,rt]=l.useState(null),[nt,ee]=l.useState(!1),[ke,it]=l.useState(null),[v,ot]=l.useState(null),[w,lt]=l.useState(null),[O,dt]=l.useState(!1),[H,ct]=l.useState(!1),[Ae,te]=l.useState(1),[$,mt]=l.useState(null);l.useEffect(()=>{xt(),P(),se(),fetch(`${I}/settings/receipt`,{headers:{Authorization:`Bearer ${j()}`}}).then(s=>s.ok?s.json():null).then(s=>{s&&Ze({shopName:s.shopName||"ETS DOUBLE M CLASSIC BOUTIQUE",shopAddress:s.shopAddress||"",shopNumber:s.shopNumber||"",shopRegistration:s.shopRegistration||"",receiptFooter:s.receiptFooter||""})}).catch(()=>{});const t=()=>{k.current()};return window.addEventListener("salesUpdated",t),()=>{window.removeEventListener("salesUpdated",t)}},[]),l.useEffect(()=>{Object.keys(n).length>0&&P()},[n,Ae,b]),l.useEffect(()=>{te(1)},[n,b]);const xt=async()=>{try{const t=localStorage.getItem("user");if(t){const a=JSON.parse(t);Ne(a),G(a.role==="superadmin");return}const s=await fetch(`${I}/users/me`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${j()}`}});if(s.ok){const a=await s.json();Ne(a),G(a.role==="superadmin"),localStorage.setItem("user",JSON.stringify(a))}}catch(t){console.error("Error fetching user data:",t),G(!1)}},ut=t=>t.filter(s=>{const r=!["expense","depense"].includes(s.status?.toLowerCase()),i=!!s.saleId&&Array.isArray(s.items);return r&&i}).map(s=>s.customer?s:{...s,customer:{name:"Client non renseigné",phone:"",email:""}}),ht=()=>{const t=new URLSearchParams;switch(t.set("page",String(Ae)),t.set("limit","50"),t.set("type","sale"),A){case"custom":n.from&&t.append("from",n.from),n.to&&t.append("to",n.to);break;case"day":n.date&&t.append("date",n.date);break;case"month":n.year&&t.append("year",n.year),n.month&&t.append("month",n.month);break;case"year":n.year&&t.append("year",n.year);break}return n.status&&t.append("status",n.status),n.customerPhone&&t.append("customerPhone",n.customerPhone),q&&n.category&&t.append("category",n.category),b.trim()&&t.append("search",b.trim()),t.toString()},P=async()=>{try{R(!0),x(null);const t=ht(),s=`${I}/sales${t?`?${t}`:""}`;console.log("Fetching sales from:",s);const a=await fetch(s,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${j()}`}});if(a.ok){const r=await a.json();if(r.success&&r.data&&Array.isArray(r.data)){const i=r.data;console.log(`Fetched ${i.length} sales from API`),console.log("Timeframe metadata:",r.timeframe),console.log("Summary stats:",r.summary);const c=ut(i);console.log(`After filtering: ${c.length} valid sales`),Ge(c),mt(r.pagination||null),it(r.timeframe),ot(r.summary),lt(r.filtersApplied),pt(c)}else console.warn("Unexpected sales data structure:",r),x("Réponse inattendue du serveur. Actualisez la page.")}else x(`Impossible de charger les ventes. ${(await Ue(a)).message}`)}catch(t){x(`Impossible de charger les ventes. ${Re(t).message}`)}finally{R(!1)}};k.current=P;const pt=t=>{const a=t.filter(r=>r.editHistory&&r.editHistory.length>0||r.editedBy).sort((r,i)=>{const c=r.editedAt?new Date(r.editedAt).getTime():new Date(r.updatedAt).getTime();return(i.editedAt?new Date(i.editedAt).getTime():new Date(i.updatedAt).getTime())-c});at(a)},gt=t=>{we(t);const s={...n};switch(t){case"today":s.date=V(),s.from="",s.to="",s.year=U().toString(),s.month=J().split("-")[1];break;case"day":s.date=V(),s.from="",s.to="";break;case"month":s.year=U().toString(),s.month=J().split("-")[1],s.date="",s.from="",s.to="";break;case"year":s.year=U().toString(),s.month="",s.date="",s.from="",s.to="";break;case"custom":if(!s.from){const a=new Date,r=new Date(a.getFullYear(),a.getMonth(),1);s.from=r.toISOString().split("T")[0]}s.to||(s.to=new Date().toISOString().split("T")[0]),s.date="",s.year="",s.month="";break}X(s)},S=(t,s)=>{X(a=>({...a,[t]:s}))},ft=()=>{X({from:"",to:"",date:V(),year:U().toString(),month:J().split("-")[1],type:"",status:"",customerPhone:"",category:""}),we("today"),Se(!1),ge("")},se=async()=>{try{ve(!0);const t=await fetch(`${I}/products?limit=0`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${j()}`}});if(t.ok){const s=await t.json();let a=[];Array.isArray(s)?a=s:s&&Array.isArray(s.products)?a=s.products:s&&typeof s=="object"&&(a=[s]),console.log("Processed products:",a.length),Ke(a)}else console.error("Products API Error:",t.status,t.statusText)}catch(t){console.error("Error loading products:",t)}finally{ve(!1)}},ae=N?Ce.filter(t=>t.saleId.toLowerCase().includes(b.toLowerCase())||t.customer.name.toLowerCase().includes(b.toLowerCase())||t.customer.phone.includes(b)||t.salesPerson&&t.salesPerson.toLowerCase().includes(b.toLowerCase())):Q.filter(t=>t.saleId.toLowerCase().includes(b.toLowerCase())||t.customer.name.toLowerCase().includes(b.toLowerCase())||t.customer.phone.includes(b)||t.salesPerson&&t.salesPerson.toLowerCase().includes(b.toLowerCase())),F=t=>Lt(t),f=_t,y=Vt,$e=(t,s)=>{const a=Jt(t,s);return`${Qt(t).toFixed(2)}$${a===void 0?"":` / ${y(a)}`}`},Pe=(t,s)=>{const a=qe(t,s);return`${ze(t).toFixed(2)}$${a===void 0?"":` / ${y(a)}`}`},B=(t,s,a)=>{const r=M(t,s,a);return`${t.toFixed(2)}$${r===void 0?"":` / ${y(r)}`}`},bt=t=>Oe(t)==="FC"?y(me(t)):f(me(t)),yt=t=>Oe(t)==="FC"?y(He(t)):f(He(t)),jt=()=>{if(ke)return E(ke.description);switch(A){case"day":return n.date?E(`Day: ${n.date}`):"Aujourd'hui";case"month":return n.year&&n.month?E(`Month: ${n.year}-${n.month.padStart(2,"0")}`):"Ce mois-ci";case"year":return n.year?E(`Year: ${n.year}`):"Cette année";case"custom":return E(`Custom range: ${n.from||"Beginning"} to ${n.to||"Now"}`);default:return"Aujourd'hui"}},vt=t=>{rt(t),ee(!0)},Nt=t=>{if(!t.editHistory||t.editHistory.length===0)return null;const s=t.editHistory[t.editHistory.length-1],a=s.changes;return e.jsxs("div",{className:"mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg",children:[e.jsxs("h4",{className:"font-medium text-yellow-800 mb-2 flex items-center gap-2",children:[e.jsx(he,{className:"w-4 h-4"}),"Dernière modification"]}),e.jsxs("div",{className:"space-y-2 text-sm",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-yellow-700",children:"Modifié par:"}),e.jsx("span",{className:"font-medium",children:s.editedBy||t.editedBy||"Non renseigné"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-yellow-700",children:"Date de modification:"}),e.jsx("span",{className:"font-medium",children:F(s.editedAt||t.editedAt||t.updatedAt)})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-yellow-700",children:"Raison:"}),e.jsx("span",{className:"font-medium text-right",children:s.reason})]}),a&&Object.keys(a).length>0&&e.jsxs("div",{className:"mt-3 pt-3 border-t border-yellow-200",children:[e.jsx("h5",{className:"font-medium text-yellow-800 mb-2",children:"Changements:"}),Ye(a).map(([r,i])=>e.jsxs("div",{className:"mb-2 last:mb-0",children:[e.jsxs("div",{className:"font-medium text-yellow-700 capitalize",children:[r.replace(/([A-Z])/g," $1").toLowerCase(),":"]}),e.jsxs("div",{className:"grid grid-cols-2 gap-2 text-xs",children:[e.jsxs("div",{className:"bg-red-50 p-2 rounded",children:[e.jsx("div",{className:"text-red-600 font-medium",children:"Avant:"}),e.jsx("div",{className:"truncate",children:JSON.stringify(i.from)})]}),e.jsxs("div",{className:"bg-green-50 p-2 rounded",children:[e.jsx("div",{className:"text-green-600 font-medium",children:"Après:"}),e.jsx("div",{className:"truncate",children:JSON.stringify(i.to)})]})]})]},r))]})]})]})},Fe=async t=>{const s=window.open("","_blank","width=320,height=600");s&&(s.document.write(`
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
        <div class="shop-name"><strong>${T.shopName}</strong></div>
        <div class="shop-details"><strong>${T.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${T.shopNumber}</strong></div>
        <div class="shop-details"><strong>${T.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${F(t.createdAt)}</strong></div>
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
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${a.quantity} x ${$e(a,t.exchangeRate)} = ${Pe(a,t.exchangeRate)}</strong></div>
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
        <div class="thank-you"><strong>${T.receiptFooter||"MERCI POUR VOTRE ACHAT !"}</strong></div>
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
`),s.document.close())},Ie=async t=>{const s=new Ot;s.setFontSize(20),s.text("ETS DOUBLE M CLASSIC BOUTIQUE",105,10,{align:"center"}),s.setFontSize(10),s.text("Vêtements & Chaussures",105,15,{align:"center"}),s.setFontSize(12),s.text("LSH/RCCM/22-A-01266",105,20,{align:"center"}),s.text("Tél: +243 836 017 031",105,25,{align:"center"}),s.text("780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi",105,30,{align:"center"}),s.setFontSize(16),s.text("Reçu de vente",105,35,{align:"center"}),s.setFontSize(10),s.text(`Date: ${F(t.createdAt)}`,20,45),s.text(`Reçu #: ${t.saleId}`,20,52),s.text(`Payement: ${t.paymentMethod.toUpperCase()}`,20,59),s.text(`Statut: ${t.status.toUpperCase()}`,20,66),s.text(`Agent: ${t.salesPerson||"Non spécifié"}`,20,73),s.setFontSize(12),s.text("Information sur le client:",20,85),s.setFontSize(10),s.text(`Nom: ${t.customer.name}`,20,92),t.customer.phone&&s.text(`Phone: ${t.customer.phone}`,20,99),t.customer.email&&s.text(`Email: ${t.customer.email}`,20,106),s.setFontSize(12),s.text("Articles:",20,113),s.setFontSize(10);let a=120;t.items.forEach((r,i)=>{a>250&&(s.addPage(),a=20),s.text(`${i+1}. ${r.name}`,20,a),s.text(`Qté: ${r.quantity} x ${$e(r,t.exchangeRate)} = ${Pe(r,t.exchangeRate)}`,25,a+6),a+=15}),a+=7,s.text(`Sous-total: ${B(t.subtotal,t.items,t.exchangeRate)}`,20,a),s.text(`Total: ${B(t.total,t.items,t.exchangeRate)}`,20,a+5),s.setFontSize(10),s.text("Merci pour votre achat !",105,a+20,{align:"center"}),s.text("Les marchandises vendues ne sont ni reprises ni échangées.",105,a+30,{align:"center"}),s.text("À bientôt",105,a+40,{align:"center"}),s.save(`receipt-${t.saleId}.pdf`)},wt=t=>{Xe(t),D(!0),x(null)},Te=async t=>{if(t.status==="voided"||t.status==="corrected"){x("Une vente annulée ou corrigée ne peut plus être modifiée.");return}be(t),p({customer:{...t.customer},items:t.items.map(s=>({...s})),paymentMethod:t.paymentMethod,reason:"",isWalkIn:!!t.isWalkIn}),fe(!0),x(null),C.length===0&&await se()},re=()=>{fe(!1),be(null),p({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",isWalkIn:!1}),x(null)},St=()=>{p(t=>({...t,isWalkIn:!t.isWalkIn,customer:t.isWalkIn?t.customer:{name:"",phone:"",email:""}}))},ne=(t,s)=>{if(s<1)return;const a=[...d.items],r=C.find(c=>c._id===a[t].productId);if(r&&s>r.stock+a[t].quantity){x(`Stock insuffisant (disponible : ${r.stock}).`);return}if(a[t].quantity=s,a[t].total=s*a[t].price,a.reduce((c,h)=>c+h.quantity,0)<5)for(let c=0;c<a.length;c+=1){const h=a[c];if(!h.discountApplied||h.referenceUnitSellingPrice===void 0)continue;const W=h.enteredCurrency??"USD",ie=h.exchangeRate??u?.exchangeRate,Me=W==="FC"?h.referenceUnitSellingPriceFC??(ie?Math.round(h.referenceUnitSellingPrice*ie):0):h.referenceUnitSellingPrice;if(Me<=0)continue;const oe=Be(Me,W,ie);a[c]={...h,...oe,price:oe.priceUSD,total:oe.priceUSD*h.quantity,discountApplied:!1,discountPerUnit:0}}p(c=>({...c,items:a})),x(null)},Ct=(t,s)=>{if(s<0)return;const a=[...d.items],r=a[t].exchangeRate??u?.exchangeRate,i=a[t].enteredCurrency??"USD",c=Be(s,i,r),h=a[t].referenceUnitSellingPrice;a[t]={...a[t],...c,price:c.priceUSD,total:c.priceUSD*a[t].quantity,discountApplied:h!==void 0?Math.round(c.priceUSD*100)<Math.round(h*100):a[t].discountApplied},p(W=>({...W,items:a}))},kt=t=>{const s=d.items.filter((a,r)=>r!==t);p(a=>({...a,items:s}))},At=()=>{if(C.length===0){x("Aucun article disponible. Actualisez la liste des articles.");return}const t=C[0],s={productId:t._id,name:t.name,quantity:1,price:t.price,total:t.price,enteredPrice:t.price,enteredCurrency:"USD",priceUSD:t.price,priceFC:u?.exchangeRate?Math.round(t.price*u.exchangeRate):void 0,exchangeRate:u?.exchangeRate,referenceUnitSellingPrice:t.price,referenceUnitSellingPriceFC:u?.exchangeRate?Math.round(t.price*u.exchangeRate):void 0,discountApplied:!1,discountPerUnit:0,_id:`temp-${Date.now()}-${Math.random().toString(36).slice(2,8)}`};p(a=>({...a,items:[...a.items,s]}))},$t=(t,s)=>{const a=C.find(c=>c._id===s);if(!a){x("Article introuvable. Actualisez la liste des articles.");return}const r=[...d.items],i=r[t].exchangeRate??u?.exchangeRate;r[t]={...r[t],productId:s,name:a.name,price:a.price,total:a.price*r[t].quantity,enteredPrice:a.price,enteredCurrency:"USD",priceUSD:a.price,priceFC:i?Math.round(a.price*i):void 0,exchangeRate:i,referenceUnitSellingPrice:a.price,referenceUnitSellingPriceFC:i?Math.round(a.price*i):void 0,discountApplied:!1,discountPerUnit:0},p(c=>({...c,items:r})),x(null)},Ee=()=>{const t=d.items.reduce((s,a)=>s+a.total,0);return{subtotal:t,total:t}},Pt=t=>{t.status!=="voided"&&Z.request({...Wt(t),reason:{label:"Motif de l'annulation",placeholder:"Ex. : client remboursé, erreur de saisie…"},action:s=>zt(`${I}/sales/${t._id}/void`,{method:"PATCH",body:{reason:s||"Vente annulée"}}),onSuccess:async()=>{D(!1),await P(),window.dispatchEvent(new Event("salesUpdated"))},onError:async s=>{(s.isConflict||s.status===404)&&await P()}})},Ft=async()=>{if(u){if(d.items.length===0){x("La vente doit contenir au moins un article.");return}if(!d.isWalkIn&&(!d.customer.name||!d.customer.phone)){x("Le nom et le téléphone du client sont obligatoires.");return}if(!d.reason){x("Indiquez le motif de la correction.");return}try{R(!0);const{subtotal:t,total:s}=Ee(),a={customer:d.isWalkIn?{name:"Client de passage",phone:"",email:""}:d.customer,isWalkIn:d.isWalkIn,items:d.items.map(i=>({_id:i._id,productId:i.productId,name:i.name,quantity:i.quantity,price:i.price,total:i.total,enteredPrice:i.enteredPrice,enteredCurrency:i.enteredCurrency,priceUSD:i.priceUSD,priceFC:i.priceFC,exchangeRate:i.exchangeRate})),subtotal:t,total:s,exchangeRate:u.exchangeRate,paymentMethod:d.paymentMethod,reason:d.reason,_id:u._id,saleId:u.saleId},r=await fetch(`${I}/sales/${u._id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${j()}`},body:JSON.stringify(a)});if(r.ok)await r.json(),je("✅ Modification enregistrée avec succès."),Ht("Modification enregistrée avec succès."),await P(),setTimeout(()=>{window.dispatchEvent(new Event("salesUpdated"))},1e3),re();else{const i=await Ue(r);x(i.message),i.isConflict&&await P()}}catch(t){x(Re(t).message)}finally{R(!1)}}},{subtotal:It,total:Tt}=Ee();return e.jsxs("div",{className:"space-y-6 p-6 flex-1 overflow-auto",children:[e.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-4 overflow-auto",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900",children:De.sales.label}),e.jsx("p",{className:"text-gray-600",children:De.sales.description})]}),e.jsxs("div",{className:"flex gap-3",children:[e.jsxs("button",{onClick:()=>Se(!N),className:`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${N?"bg-blue-500 text-white border-blue-500 shadow-sm":"bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`,children:[e.jsx(We,{className:"w-4 h-4"}),N?"Toutes les ventes":"Ventes modifiées",N&&e.jsx("span",{className:"bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full",children:Ce.length})]}),e.jsxs("div",{className:"relative",children:[e.jsx(Yt,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),e.jsx("input",{type:"text",placeholder:"Rechercher une vente…","aria-label":"Rechercher une vente",className:"pl-10 w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",value:b,onChange:t=>ge(t.target.value)})]})]})]}),q&&v&&e.jsxs("div",{className:"bg-blue-50 p-4 rounded-lg border border-blue-200",children:[e.jsx("div",{className:"flex items-center justify-between mb-3",children:e.jsxs("h3",{className:"text-lg font-semibold text-blue-900 flex items-center gap-2",children:[e.jsx(Mt,{className:"w-5 h-5"}),"Synthèse de la période"]})}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-4",children:[e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Enregistrements"}),e.jsx("p",{className:"text-2xl font-bold text-gray-900",children:v.totalRecords})]}),e.jsx(_,{className:"w-8 h-8 text-blue-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Chiffre d'affaires"}),e.jsx("p",{className:"text-2xl font-bold text-green-600",children:v.revenueFC!==void 0?y(v.revenueFC):"—"}),e.jsx("p",{className:"text-xs text-gray-500",children:f(v.revenue)})]}),e.jsx(xe,{className:"w-8 h-8 text-green-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Sorties historiques"}),e.jsx("p",{className:"text-[11px] text-gray-500",children:"Anciennes sorties enregistrées avec les ventes"}),e.jsx("p",{className:"text-2xl font-bold text-red-600",children:"—"}),e.jsx("p",{className:"text-xs text-gray-500",children:f(v.expenses)})]}),e.jsx(ue,{className:"w-8 h-8 text-red-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Chiffre d'affaires − sorties historiques"}),e.jsx("p",{className:"text-2xl font-bold text-blue-600",children:v.netFC!==void 0?y(v.netFC):"—"}),e.jsx("p",{className:"text-xs text-gray-500",children:f(v.net)})]}),e.jsx(Le,{className:"w-8 h-8 text-blue-500"})]})})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 mt-4",children:[e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Nombre de ventes"}),e.jsx("p",{className:"text-xl font-bold text-green-700",children:v.salesCount})]}),e.jsx(_,{className:"w-6 h-6 text-green-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Nombre de sorties historiques"}),e.jsx("p",{className:"text-xl font-bold text-red-700",children:v.expensesCount})]}),e.jsx(ue,{className:"w-6 h-6 text-red-500"})]})})]})]}),e.jsxs("div",{className:"bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900 flex items-center gap-2",children:[e.jsx(Gt,{className:"w-4 h-4 sm:w-5 sm:h-5"}),N?"Ventes modifiées":"Toutes les ventes"," - ",jt()]}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsxs("button",{onClick:()=>dt(!O),className:"px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2",children:[e.jsx(We,{className:"w-4 h-4"}),O?"Masquer les filtres":"Afficher les filtres",e.jsx(_e,{className:`w-4 h-4 transition-transform ${O?"rotate-180":""}`})]}),e.jsxs("button",{onClick:ft,className:"px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2",children:[e.jsx(le,{className:"w-4 h-4"}),"Réinitialiser les filtres"]})]})]}),O&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("span",{id:"sales-history-timeframe-type",className:"block text-sm font-medium text-gray-700 mb-2",children:"Période"}),e.jsx("div",{role:"group","aria-labelledby":"sales-history-timeframe-type",className:"flex flex-wrap gap-2",children:["today","day","month","year","custom"].map(t=>e.jsxs("button",{onClick:()=>gt(t),className:`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${A===t?"bg-blue-500 text-white shadow-sm":"bg-gray-100 text-gray-700 hover:bg-gray-200"}`,children:[t==="today"&&"Aujourd'hui",t==="day"&&"Un jour",t==="month"&&"Un mois",t==="year"&&"Une année",t==="custom"&&"Intervalle"]},t))})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",children:[A==="day"&&e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-date",className:"block text-sm font-medium text-gray-700 mb-1",children:"Date"}),e.jsx("input",{id:"sales-history-date",type:"date",value:n.date,onChange:t=>S("date",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]}),A==="month"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-month-year",className:"block text-sm font-medium text-gray-700 mb-1",children:"Année"}),e.jsx("input",{id:"sales-history-month-year",type:"number",value:n.year,onChange:t=>S("year",t.target.value),min:"2000",max:"2100",className:"w-full p-2 border border-gray-300 rounded-lg"})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-month",className:"block text-sm font-medium text-gray-700 mb-1",children:"Mois"}),e.jsx("select",{id:"sales-history-month",value:n.month,onChange:t=>S("month",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:Array.from({length:12},(t,s)=>{const a=(s+1).toString().padStart(2,"0");return e.jsxs("option",{value:a,children:[Ut(s)," (",a,")"]},a)})})]})]}),A==="year"&&e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-year",className:"block text-sm font-medium text-gray-700 mb-1",children:"Année"}),e.jsx("input",{id:"sales-history-year",type:"number",value:n.year,onChange:t=>S("year",t.target.value),min:"2000",max:"2100",className:"w-full p-2 border border-gray-300 rounded-lg"})]}),A==="custom"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-from-date",className:"block text-sm font-medium text-gray-700 mb-1",children:"Du"}),e.jsx("input",{id:"sales-history-from-date",type:"date",value:n.from,onChange:t=>S("from",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-to-date",className:"block text-sm font-medium text-gray-700 mb-1",children:"Au"}),e.jsx("input",{id:"sales-history-to-date",type:"date",value:n.to,onChange:t=>S("to",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]})]})]}),e.jsxs("div",{children:[e.jsxs("button",{onClick:()=>ct(!H),className:"text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1",children:[H?"Masquer les filtres avancés":"Filtres avancés",e.jsx(_e,{className:`w-4 h-4 transition-transform ${H?"rotate-180":""}`})]}),H&&e.jsxs("div",{className:"mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg",children:[q&&e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-categorie",className:"block text-sm font-medium text-gray-700 mb-1",children:"Catégorie"}),e.jsxs("select",{id:"sales-history-categorie",value:n.category,onChange:t=>S("category",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"Tous"}),e.jsx("option",{value:"CLOTHES",children:"Vêtements"}),e.jsx("option",{value:"SHOES",children:"Chaussures"})]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-sale-type",className:"block text-sm font-medium text-gray-700 mb-1",children:"Type d'opération"}),e.jsxs("select",{id:"sales-history-sale-type",value:n.type,onChange:t=>S("type",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"Tous les types"}),e.jsx("option",{value:"sale",children:"Vente"}),e.jsx("option",{value:"reservation",children:"Réservation"}),e.jsx("option",{value:"expense",children:"Sortie historique"})]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-status",className:"block text-sm font-medium text-gray-700 mb-1",children:"Statut"}),e.jsxs("select",{id:"sales-history-status",value:n.status,onChange:t=>S("status",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"Tous les statuts"}),e.jsx("option",{value:"completed",children:"Terminée"}),e.jsx("option",{value:"pending",children:"En attente"}),e.jsx("option",{value:"voided",children:"Annulée"})]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-history-customer-phone",className:"block text-sm font-medium text-gray-700 mb-1",children:"Téléphone du client"}),e.jsx("input",{id:"sales-history-customer-phone",type:"text",value:n.customerPhone,onChange:t=>S("customerPhone",t.target.value),placeholder:"Filtrer par téléphone…",className:"w-full p-2 border border-gray-300 rounded-lg"})]})]})]})]}),w&&e.jsxs("div",{className:"mt-4 text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Filtres appliqués :"}),e.jsxs("span",{className:"ml-2",children:["Statut : ",w.status&&w.status!=="all"?de(w.status):"tous",", Type : ",w.type&&w.type!=="all"?qt(w.type):"tous",w.customerPhone&&w.customerPhone!=="none"&&`, Téléphone : ${w.customerPhone}`]})]})]}),ye&&e.jsxs("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200",children:[ye,e.jsx("button",{onClick:()=>je(null),className:"float-right text-green-700 hover:text-green-900",children:"×"})]}),L&&e.jsxs("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200",children:[L,e.jsx("button",{onClick:()=>x(null),className:"float-right text-red-700 hover:text-red-900",children:"×"})]}),e.jsxs("div",{className:"bg-white rounded-lg shadow",children:[e.jsx("div",{className:"px-6 py-4 border-b border-gray-200",children:e.jsxs("h2",{className:"text-lg font-semibold text-gray-900 flex items-center gap-2",children:[e.jsx(_,{className:"w-5 h-5"}),N?"Ventes modifiées":"Transactions de vente"," (",ae.length,")"]})}),e.jsx("div",{className:"overflow-x-auto",children:Y?e.jsxs("div",{className:"text-center py-12",children:[e.jsx("div",{className:"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"}),e.jsx("p",{className:"text-gray-500 mt-2",children:"Chargement des ventes..."})]}):ae.length===0?e.jsxs("div",{className:"text-center py-12 text-gray-500",children:[e.jsx(_,{className:"w-12 h-12 mx-auto mb-4 opacity-50"}),e.jsx("p",{children:N?"Aucune vente modifiée trouvée":"Aucune vente trouvée"}),e.jsx("p",{className:"text-sm",children:"pour la période sélectionnée"})]}):e.jsx(e.Fragment,{children:e.jsxs("table",{className:"min-w-full divide-y divide-gray-200",children:[e.jsx("thead",{className:"bg-gray-50",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Identifiant de vente"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Client"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Agent"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Articles"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Total"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Payement"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Statut"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Date"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Modifié par"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]})}),e.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:ae.map(t=>e.jsxs("tr",{className:"hover:bg-gray-50",children:[e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:t.saleId}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap",children:[e.jsxs("div",{className:"text-sm text-gray-900 flex items-center gap-2",children:[t.customer.name,t.isWalkIn&&e.jsx("span",{className:"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800",children:"Passage"})]}),e.jsx("div",{className:"text-sm text-gray-500",children:t.customer.phone})]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:t.salesPerson||"Non spécifié"}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:[t.items.length," Article(s)"]}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:[y(M(t.total,t.items,t.exchangeRate)??0),e.jsxs("div",{className:"text-xs font-normal text-gray-500",children:["≈ ",f(t.total)]})]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800",children:ce(t.paymentMethod)})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${t.status==="completed"?"bg-green-100 text-green-800":t.status==="voided"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`,children:de(t.status)})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-500",children:F(t.createdAt)}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm",children:(()=>{const s=(t.editHistory&&t.editHistory.length>0?t.editHistory[t.editHistory.length-1].editedBy:null)||t.editedBy;return s?e.jsxs("span",{className:"inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium border border-yellow-200",children:["✏️ ",s]}):e.jsx("span",{className:"text-gray-300",children:"—"})})()}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium",children:e.jsxs("div",{className:"flex gap-2",children:[N?e.jsx("button",{onClick:()=>vt(t),className:"text-blue-600 hover:text-blue-900 p-1 rounded",title:"Voir les détails des modifications",children:e.jsx(he,{className:"w-4 h-4"})}):e.jsx("button",{onClick:()=>wt(t),className:"text-blue-600 hover:text-blue-900 p-1 rounded",title:"Voir les détails",children:e.jsx(Rt,{className:"w-4 h-4"})}),!N&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:()=>Te(t),disabled:t.status==="voided"||t.status==="corrected",className:`p-1 rounded ${t.status==="voided"||t.status==="corrected"?"text-gray-400 cursor-not-allowed":"text-yellow-600 hover:text-yellow-900"}`,title:"Corriger la vente",children:e.jsx(pe,{className:"w-4 h-4"})}),K&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:()=>Ie(t),className:"text-green-600 hover:text-green-900 p-1 rounded",title:"Télécharger le reçu (PDF)",children:e.jsx(xe,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>Fe(t),className:"text-purple-600 hover:text-purple-900 p-1 rounded",title:"Réimprimer le reçu",children:e.jsx(Ve,{className:"w-4 h-4"})})]}),q&&e.jsx("button",{onClick:()=>Pt(t),disabled:t.status==="voided"||Z.busy,className:`p-1 rounded ${t.status==="voided"?"text-gray-400 cursor-not-allowed":"text-red-600 hover:text-red-900"}`,title:"Annuler la vente","aria-label":`Annuler la vente ${t.saleId}`,children:e.jsx(Je,{className:"w-4 h-4"})})]})]})})]},t._id))})]})})})]}),$&&$.totalPages>1&&e.jsxs("div",{className:"flex items-center justify-between rounded-lg border bg-white px-4 py-3",children:[e.jsxs("span",{className:"text-sm text-gray-600",children:["Page ",$.page," sur ",$.totalPages," · ",$.totalRecords," ventes"]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{type:"button",disabled:!$.hasPreviousPage,onClick:()=>te(t=>Math.max(1,t-1)),className:"rounded border px-3 py-1.5 text-sm disabled:opacity-40",children:"Précédent"}),e.jsx("button",{type:"button",disabled:!$.hasNextPage,onClick:()=>te(t=>t+1),className:"rounded border px-3 py-1.5 text-sm disabled:opacity-40",children:"Suivant"})]})]}),et&&o&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:"Détails de la vente"}),e.jsx("button",{onClick:()=>D(!1),className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Identifiant de vente"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.saleId})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Date"}),e.jsx("p",{className:"text-sm text-gray-900",children:F(o.createdAt)})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Méthode de paiement"}),e.jsx("p",{className:"text-sm text-gray-900",children:ce(o.paymentMethod)})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Statut"}),e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${o.status==="completed"?"bg-green-100 text-green-800":o.status==="voided"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`,children:de(o.status)})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Agent"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.salesPerson||"Non spécifié"})]}),o.editedBy&&e.jsxs("div",{className:"col-span-2",children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Dernière modification"}),e.jsxs("p",{className:"text-sm text-gray-900",children:["Par ",o.editedBy,o.editedAt?`, le ${F(o.editedAt)}`:""]})]})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(Dt,{className:"w-4 h-4"}),"Information sur le client",o.isWalkIn&&e.jsx("span",{className:"inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800",children:"Client de passage"})]}),e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Nom"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.customer.name})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Phone"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.customer.phone})]}),o.customer.email&&e.jsxs("div",{className:"col-span-2",children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Email"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.customer.email})]})]})})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(Le,{className:"w-4 h-4"}),"Articles (",o.items.length,")"]}),e.jsx("div",{className:"space-y-3",children:o.items.map((t,s)=>e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{children:[e.jsx("h5",{className:"font-medium text-gray-900",children:t.name}),e.jsxs("p",{className:"text-sm text-gray-600",children:["Nombre de pieces: ",t.quantity," ×"," ",bt(t)]})]}),e.jsx("div",{className:"text-right",children:e.jsxs("p",{className:"font-medium text-gray-900",children:[yt(t),t.enteredCurrency==="FC"?e.jsxs("span",{className:"block text-xs font-normal text-gray-500",children:["Reçu: ",f(ze(t))]}):(()=>{const a=qe(t,o.exchangeRate);return a!==void 0?e.jsxs("span",{className:"block text-xs font-normal text-gray-500",children:["≈ ",y(a)]}):null})()]})})]})},s))})]}),o.editHistory&&o.editHistory.length>0&&Nt(o),e.jsxs("div",{className:"border-t border-gray-200 pt-4",children:[e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Sous-total:"}),e.jsxs("span",{className:"text-sm text-gray-900 text-right",children:[e.jsx("span",{className:"block",children:y(M(o.subtotal,o.items,o.exchangeRate)??0)}),e.jsxs("span",{className:"block text-xs text-gray-500",children:["≈ ",f(o.subtotal)]})]})]}),e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:"Total:"}),e.jsxs("span",{className:"text-gray-900 text-right",children:[e.jsx("span",{className:"block",children:y(M(o.total,o.items,o.exchangeRate)??0)}),e.jsxs("span",{className:"block text-xs font-normal text-gray-500",children:["≈ ",f(o.total)]})]})]})]}),e.jsxs("div",{className:"flex flex-wrap gap-3 pt-4",children:[K&&e.jsxs("button",{onClick:()=>Ie(o),className:"flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(xe,{className:"w-4 h-4"}),"Télécharger PDF"]}),K&&e.jsxs("button",{onClick:()=>Fe(o),className:"flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(Ve,{className:"w-4 h-4"}),"Imprimer Reçu"]}),e.jsxs("button",{onClick:()=>Te(o),disabled:o.status==="voided"||o.status==="corrected",className:`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${o.status==="voided"||o.status==="corrected"?"border-gray-300 text-gray-400 cursor-not-allowed":"border-yellow-300 text-yellow-600 hover:bg-yellow-50"}`,children:[e.jsx(pe,{className:"w-4 h-4"}),"Modifier la vente"]}),e.jsx("button",{onClick:()=>D(!1),className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Fermer"})]})]})]})}),nt&&g&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:["Détails des modifications - ",g.saleId]}),e.jsx("button",{onClick:()=>ee(!1),className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3 bg-blue-50 p-3 rounded-lg",children:"État actuel de la vente"}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 mb-4",children:[e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Client"}),e.jsxs("p",{className:"text-sm text-gray-900",children:[g.customer.name," (",g.customer.phone,")"]})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Total actuel"}),e.jsxs("p",{className:"text-sm font-medium text-gray-900",children:[y(M(g.total,g.items,g.exchangeRate)??0),e.jsxs("span",{className:"block text-xs font-normal text-gray-500",children:["≈ ",f(g.total)]})]})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Méthode de paiement"}),e.jsx("p",{className:"text-sm text-gray-900",children:ce(g.paymentMethod)})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Articles"}),e.jsxs("p",{className:"text-sm text-gray-900",children:[g.items.length," article(s)"]})]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Historique des modifications"}),e.jsx("div",{className:"space-y-4",children:g.editHistory&&g.editHistory.length>0?g.editHistory.map((t,s)=>e.jsxs("div",{className:"border border-gray-200 rounded-lg p-4 bg-gray-50",children:[e.jsxs("div",{className:"flex justify-between items-start mb-3",children:[e.jsxs("div",{children:[e.jsxs("h5",{className:"font-medium text-gray-900",children:["Modification #",g.editHistory.length-s]}),e.jsx("p",{className:"text-sm text-gray-600",children:F(t.editedAt)})]}),e.jsxs("div",{className:"text-right",children:[e.jsxs("p",{className:"text-sm font-medium text-gray-900",children:["Par: ",t.editedBy]}),e.jsxs("p",{className:"text-sm text-gray-600",children:["Raison: ",t.reason]})]})]}),t.changes&&Object.keys(t.changes).length>0&&e.jsxs("div",{className:"space-y-3",children:[e.jsx("h6",{className:"font-medium text-gray-700 text-sm",children:"Changements détaillés:"}),Ye(t.changes).map(([a,r])=>e.jsxs("div",{className:"border-l-4 border-blue-500 pl-3",children:[e.jsxs("div",{className:"font-medium text-gray-700 text-sm capitalize mb-2",children:[a.replace(/([A-Z])/g," $1").toLowerCase(),":"]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-3 text-sm",children:[e.jsxs("div",{className:"bg-red-50 p-3 rounded border border-red-200",children:[e.jsx("div",{className:"text-red-700 font-medium mb-1",children:"Avant:"}),e.jsx("div",{className:"text-red-600 break-words",children:typeof r.from=="object"?JSON.stringify(r.from,null,2):String(r.from||"N/A")})]}),e.jsxs("div",{className:"bg-green-50 p-3 rounded border border-green-200",children:[e.jsx("div",{className:"text-green-700 font-medium mb-1",children:"Après:"}),e.jsx("div",{className:"text-green-600 break-words",children:typeof r.to=="object"?JSON.stringify(r.to,null,2):String(r.to||"N/A")})]})]})]},a))]})]},t._id||s)):e.jsxs("div",{className:"text-center py-8 text-gray-500",children:[e.jsx(he,{className:"w-12 h-12 mx-auto mb-4 opacity-50"}),e.jsx("p",{children:"Aucun détail de modification disponible"})]})})]}),e.jsx("div",{className:"flex flex-wrap gap-3 pt-4 border-t border-gray-200",children:e.jsx("button",{onClick:()=>ee(!1),className:"flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Fermer"})})]})]})}),tt&&u&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:["Corriger la vente ",u.saleId]}),e.jsx("button",{onClick:re,className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[L&&e.jsx("div",{className:"p-3 bg-red-100 text-red-700 rounded-lg",children:L}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Information sur le client"}),e.jsxs("label",{className:"flex items-center gap-2 mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer select-none w-fit",children:[e.jsx("input",{type:"checkbox",checked:d.isWalkIn,onChange:St,className:"w-4 h-4"}),e.jsx("span",{className:"text-sm font-medium text-gray-700",children:"Client de passage (sans coordonnées)"})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-edit-nom",className:"block text-sm font-medium text-gray-700 mb-1",children:"Nom"}),e.jsx("input",{id:"sales-edit-nom",type:"text",value:d.customer.name,onChange:t=>p(s=>({...s,customer:{...s.customer,name:t.target.value}})),className:"w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400",disabled:d.isWalkIn,required:!d.isWalkIn})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-edit-telephone",className:"block text-sm font-medium text-gray-700 mb-1",children:"Numéro de téléphone"}),e.jsx("input",{id:"sales-edit-telephone",type:"tel",value:d.customer.phone,onChange:t=>p(s=>({...s,customer:{...s.customer,phone:t.target.value}})),className:"w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400",disabled:d.isWalkIn,required:!d.isWalkIn})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sales-edit-email",className:"block text-sm font-medium text-gray-700 mb-1",children:"Email"}),e.jsx("input",{id:"sales-edit-email",type:"email",value:d.customer.email,onChange:t=>p(s=>({...s,customer:{...s.customer,email:t.target.value}})),className:"w-full p-2 border rounded disabled:bg-gray-100 disabled:text-gray-400",disabled:d.isWalkIn})]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Methode de payement"}),e.jsxs("select",{value:d.paymentMethod,onChange:t=>p(s=>({...s,paymentMethod:t.target.value})),className:"w-full p-2 border rounded",children:[e.jsx("option",{value:"cash",children:"Espèces"}),e.jsx("option",{value:"card",children:"Carte"}),e.jsx("option",{value:"transfer",children:"Virement"}),e.jsx("option",{value:"other",children:"Autre"})]})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex justify-between items-center mb-3",children:[e.jsx("h4",{className:"text-md font-medium text-gray-900",children:"Articles"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("button",{onClick:se,disabled:z,className:"px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1",children:[e.jsx(le,{className:`w-3 h-3 ${z?"animate-spin":""}`})," ","Actualiser les articles"]}),e.jsxs("button",{onClick:At,disabled:C.length===0,className:"px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1",children:[e.jsx(Qe,{className:"w-3 h-3"})," Ajouter un article"]})]})]}),C.length===0&&!z&&e.jsx("div",{className:"p-3 bg-yellow-100 text-yellow-700 rounded-lg mb-4",children:e.jsx("p",{className:"text-sm",children:"Aucun article disponible. Veuillez vérifier si des articles existent dans votre base de données."})}),e.jsx("div",{className:"space-y-4",children:d.items.map((t,s)=>e.jsx("div",{className:"border rounded-lg p-4 bg-gray-50",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-12 gap-4 items-end",children:[e.jsxs("div",{className:"md:col-span-4",children:[e.jsx("label",{htmlFor:`sales-edit-item-${s}-article`,className:"block text-sm font-medium text-gray-700 mb-1",children:"Article"}),z?e.jsx("div",{className:"p-2 border rounded bg-gray-200 text-gray-600 text-sm",children:"Chargement des articles…"}):C.length===0?e.jsx("input",{id:`sales-edit-item-${s}-article`,type:"text",value:t.name,onChange:a=>{const r=[...d.items];r[s].name=a.target.value,p(i=>({...i,items:r}))},placeholder:"Nom de l'article",className:"w-full p-2 border rounded"}):e.jsx("select",{id:`sales-edit-item-${s}-article`,value:t.productId,onChange:a=>$t(s,a.target.value),className:"w-full p-2 border rounded",children:C.map(a=>e.jsxs("option",{value:a._id,children:[a.name," -"," ",f(a.price)," (Stock:"," ",a.stock,")"]},a._id))})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsxs("label",{htmlFor:`sales-edit-item-${s}-price`,className:"block text-sm font-medium text-gray-700 mb-1",children:["Prix unitaire (",t.enteredCurrency??"USD",")"]}),e.jsx("input",{id:`sales-edit-item-${s}-price`,type:"number",min:"0",step:"0.01",value:me(t),onChange:a=>Ct(s,parseFloat(a.target.value)||0),className:"w-full p-2 border rounded"})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsxs("label",{htmlFor:`sales-edit-item-${s}-quantity`,className:"block text-sm font-medium text-gray-700 mb-1",children:["Nombre de pièces"," "]}),e.jsxs("div",{className:"flex items-center border rounded",children:[e.jsx("button",{type:"button",onClick:()=>ne(s,t.quantity-1),className:"p-2 hover:bg-gray-200",disabled:t.quantity<=1,children:e.jsx(ue,{className:"w-3 h-3"})}),e.jsx("input",{id:`sales-edit-item-${s}-quantity`,type:"number",min:"1",value:t.quantity,onChange:a=>ne(s,parseInt(a.target.value)||1),className:"w-full p-2 text-center border-0"}),e.jsx("button",{type:"button",onClick:()=>ne(s,t.quantity+1),className:"p-2 hover:bg-gray-200",children:e.jsx(Qe,{className:"w-3 h-3"})})]})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Total"}),e.jsx("div",{className:"p-2 bg-white border rounded font-medium",children:f(t.total)})]}),e.jsx("div",{className:"md:col-span-2",children:e.jsxs("button",{type:"button",onClick:()=>kt(s),className:"w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-1",children:[e.jsx(Je,{className:"w-3 h-3"})," Supprimer"]})})]})},t._id))})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4",children:[e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Sous-total:"}),e.jsx("span",{className:"text-sm text-gray-900",children:f(It)})]}),e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:"Total:"}),e.jsx("span",{className:"text-gray-900",children:f(Tt)})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Raison de modification"}),e.jsx("textarea",{value:d.reason,onChange:t=>p(s=>({...s,reason:t.target.value})),placeholder:"Veuillez indiquer une raison pour la modification de cette vente....",className:"w-full p-2 border rounded h-20",required:!0})]}),e.jsxs("div",{className:"flex flex-wrap gap-3 pt-4",children:[e.jsx("button",{onClick:Ft,disabled:Y||d.items.length===0,className:"flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2",children:Y?e.jsxs(e.Fragment,{children:[e.jsx(le,{className:"w-4 h-4 animate-spin"})," Enregistrement…"]}):e.jsxs(e.Fragment,{children:[e.jsx(pe,{className:"w-4 h-4"})," Mettre à jour la vente"]})}),e.jsx("button",{onClick:re,className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Annuler"})]})]})]})}),Z.dialog]})}export{gs as default};
