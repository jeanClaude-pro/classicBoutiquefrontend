import{t as d,x as Ie,s as e,M as ie,d as z,E as De,U as le,c as Pe,l as Me,m as Fe,p as Ue,u as q,o as Le}from"./index-BalGFMsI.js";import{a as ze}from"./notify-CfYsxrlT.js";import{u as qe,c as Oe,r as Ve,b as _e}from"./useConfirmAction-jH2uII0Y.js";import{P as de,p as Be}from"./labels-CLkR1D3V.js";import{d as g}from"./salePricing-B6CLvYLp.js";import{S as He}from"./search-CjHoRDHU.js";import{C as ce}from"./calendar-BWvZlzqW.js";import{S as O}from"./square-pen-CejW2XqV.js";import{T as V}from"./trash-2-Ddnxl_49.js";import{C as me}from"./circle-check-big-hSrAZTak.js";import{C as ue}from"./circle-x-CprW5tMU.js";import{P as Ge,M as Je}from"./phone-D3FQRjLu.js";import{P as xe}from"./plus-Cr8rTDFU.js";import{M as Qe}from"./minus-B8aa3y76.js";const y=Ie;function dt(){const[N,v]=d.useState([]),[u,pe]=d.useState([]),[h,R]=d.useState(!0),[x,ge]=d.useState(""),[o,he]=d.useState(null),[fe,f]=d.useState(!1),w=qe(),[_,B]=d.useState(null),[T,l]=d.useState(null),[p,be]=d.useState("all"),[C,ve]=d.useState(""),[H,A]=d.useState(1),[b,je]=d.useState(null),[k,ye]=d.useState(null),[Ne,G]=d.useState(!1),[j,J]=d.useState(null),[i,c]=d.useState({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",notes:"",reservationDate:"",reservationTime:""}),[E,Q]=d.useState(!1);d.useEffect(()=>{$();const t=localStorage.getItem("user");let s="";try{s=t&&JSON.parse(t)?.role||""}catch{s=""}console.log("🔑 User Role:",s),ve(s)},[]),d.useEffect(()=>{const t=window.setTimeout(()=>S(),250);return()=>window.clearTimeout(t)},[H,x,p]),d.useEffect(()=>{A(1)},[x,p]);const S=async()=>{try{R(!0),l(null),console.log("🔍 Fetching reservations from API...");const t=new URLSearchParams({page:String(H),limit:"50"});x.trim()&&t.set("search",x.trim()),p!=="all"&&t.set("status",p);const s=await fetch(`${y}/sales/reservations/all?${t}`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(s.ok){const a=await s.json();console.log("📦 Reservations API Response:",a),a?.success&&Array.isArray(a.data)?(console.log(`✅ Found ${a.length} reservations`),v(a.data),je(a.pagination||null),ye(a.summary||null)):(console.warn("❌ Invalid data format from API"),l("Format de données invalide reçu de l'API"),v([]))}else console.error("❌ Reservations endpoint failed, status:",s.status),l("Impossible de charger les réservations"),v([])}catch(t){console.error("❌ Error loading reservations:",t),l("Échec du chargement des réservations"),v([])}finally{R(!1)}},$=async()=>{try{Q(!0);const t=await fetch(`${y}/products?limit=0`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(t.ok){const s=await t.json();let a=[];Array.isArray(s)?a=s:s&&Array.isArray(s.products)?a=s.products:s&&typeof s=="object"&&(a=[s]),pe(a)}else console.error("Products API Error:",t.status,t.statusText)}catch(t){console.error("Error loading products:",t)}finally{Q(!1)}},I=N.filter(t=>{const s=t.saleId.toLowerCase().includes(x.toLowerCase())||t.customer.name.toLowerCase().includes(x.toLowerCase())||t.customer.phone.includes(x)||t.customer.email&&t.customer.email.toLowerCase().includes(x.toLowerCase()),a=p==="all"||p==="pending"&&t.status==="pending"||p==="completed"&&t.status==="completed";return s&&a}),W=N.filter(t=>t.status==="pending"),K=N.filter(t=>t.status==="completed"),D=t=>{const s=Me(t);return s==="—"?"Date invalide":s},X=t=>{const s=Fe(t);return s==="—"?"Date invalide":s},Y=t=>{if(t.reservationDate){const s=String(t.reservationDate).trim(),a=/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)?s:D(s);return t.reservationTime?`${a} ${t.reservationTime}`:a}return D(t.createdAt)},Z=t=>{if(t.reservationTime)return t.reservationTime;if(t.createdAt)try{const s=new Date(t.createdAt);if(!isNaN(s.getTime()))return Ue(s)}catch{}return"Heure non spécifiée"},we=t=>{he(t),f(!0),l(null)},P=async t=>{(t.isConflict||t.status===404||t.status===400)&&await S()},ee=t=>{w.request({...Oe(t),action:()=>q(`${y}/sales/${t._id}/complete`,{method:"PATCH",body:{}}),onSuccess:()=>$e(t),onError:P})},te=t=>{w.request({...Ve(t),action:()=>q(`${y}/sales/${t._id}/pending`,{method:"PATCH",body:{}}),onSuccess:()=>{v(s=>s.map(a=>a._id===t._id?{...a,status:"pending",completedBy:void 0,completedAt:void 0}:a)),f(!1)},onError:P})},se=t=>{const s=_e({...t,type:"reservation"});if(s.blockedReason){ze(s.blockedReason);return}w.request({...s,action:()=>q(`${y}/sales/${t._id}`,{method:"DELETE"}),onSuccess:async()=>{f(!1),await S()},onError:P})},M=C==="superadmin"||C==="manager",ae=C==="superadmin",re=C==="superadmin",ne=async t=>{if(t.status==="cancelled"){l("Impossible de modifier une réservation annulée");return}if(t.status==="completed"&&C!=="superadmin"){l("Seul l'administrateur peut modifier une réservation complétée");return}J(t),c({customer:{...t.customer},items:t.items.map(s=>({...s})),paymentMethod:t.paymentMethod,reason:"",notes:t.notes||"",reservationDate:t.reservationDate||"",reservationTime:t.reservationTime||""}),G(!0),l(null),u.length===0&&await $()},F=()=>{G(!1),J(null),c({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",notes:"",reservationDate:"",reservationTime:""}),l(null)},U=(t,s)=>{if(s<1)return;const a=[...i.items],n=u.find(r=>r._id===a[t].productId);if(n&&s>n.stock+a[t].quantity){l(`Stock insuffisant. Disponible: ${n.stock}`);return}a[t].quantity=s,a[t].total=s*a[t].price,c(r=>({...r,items:a})),l(null)},Ce=(t,s)=>{if(s<0)return;const a=[...i.items];a[t].price=s,a[t].enteredPrice=s,a[t].enteredCurrency="USD",a[t].priceUSD=s,a[t].priceFC=void 0,a[t].exchangeRate=void 0,a[t].total=s*a[t].quantity,c(n=>({...n,items:a}))},ke=t=>{const s=i.items.filter((a,n)=>n!==t);c(a=>({...a,items:s}))},Se=()=>{if(u.length===0){l("Aucun produit disponible. Veuillez actualiser les produits d'abord.");return}const t=u[0],s={productId:t._id,name:t.name,quantity:1,price:t.price,total:t.price,_id:`temp-${Date.now()}`,enteredPrice:t.price,enteredCurrency:"USD",priceUSD:t.price};c(a=>({...a,items:[...a.items,s]}))},Re=(t,s)=>{const a=u.find(r=>r._id===s);if(!a){l("Produit sélectionné non trouvé");return}const n=[...i.items];n[t].productId=s,n[t].name=a.name,n[t].price=a.price,n[t].enteredPrice=a.price,n[t].enteredCurrency="USD",n[t].priceUSD=a.price,n[t].priceFC=void 0,n[t].exchangeRate=void 0,n[t].total=a.price*n[t].quantity,c(r=>({...r,items:n})),l(null)},oe=()=>{const t=i.items.reduce((s,a)=>s+a.total,0);return{subtotal:t,total:t}},Te=async()=>{if(j){if(i.items.length===0){l("La réservation doit contenir au moins un article");return}if(!i.customer.name||!i.customer.phone){l("Le nom et le téléphone du client sont requis");return}if(!i.reason){l("Veuillez fournir une raison pour la modification de cette réservation");return}try{R(!0);const{subtotal:t,total:s}=oe(),a={customer:i.customer,items:i.items.map(r=>({productId:r.productId,name:r.name,quantity:r.quantity,price:r.price,total:r.total,enteredPrice:r.enteredPrice,enteredCurrency:r.enteredCurrency,priceUSD:r.priceUSD,priceFC:r.priceFC,exchangeRate:r.exchangeRate})),subtotal:t,total:s,paymentMethod:i.paymentMethod,reason:i.reason,notes:i.notes,reservationDate:i.reservationDate,reservationTime:i.reservationTime,_id:j._id,saleId:j.saleId};console.log("Sending reservation update data:",a);const n=await fetch(`${y}/sales/${j._id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify(a)});if(console.log("Update response status:",n.status),n.ok){const r=await n.json();console.log("Updated reservation:",r),B("✅ Réservation mise à jour avec succès"),await S(),F(),f(!1)}else{const r=await n.json();console.error("Update error:",r),l(r.error||`Échec de la mise à jour de la réservation: ${n.status} ${n.statusText}`)}}catch(t){console.error("Error updating reservation:",t),l("Échec de la mise à jour de la réservation. Veuillez vérifier votre connexion.")}finally{R(!1)}}},{subtotal:Ee,total:Ae}=oe(),L=t=>{const s=window.open("","_blank","width=320,height=600");if(s){const a=localStorage.getItem("username")||"VENDEUR",n=Le(),r=t.status==="completed";s.document.write(`
<html>
  <head>
    <title>Reçu Réservation</title>
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
      .status-badge {
        padding: 2mm;
        font-weight: bold;
        text-align: center;
        margin: 1mm 0;
        font-size: 14px;
        border-radius: 3px;
        ${r?"background-color: #28a745; color: white;":"background-color: #ffc107; color: #000;"}
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
      .status-info {
        padding: 1mm;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 12px;
        border-radius: 3px;
        ${r?"background-color: #d4edda; border: 2px solid #28a745;":"background-color: #fff3cd; border: 2px solid #ffc107;"}
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
        }
        .receipt-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 0.5mm !important;
          width: 70mm !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="header">
        <div class="shop-name"><strong>ETS DOUBLE M CLASSIC BOUTIQUE</strong></div>
        <div class="shop-details"><strong>780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi</strong></div>
        <div class="shop-details">TEL: <strong>+243 836 017 031</strong></div>
        <div class="shop-details"><strong>LSH/RCCM/22-A-01266</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="status-badge">
        <strong>${r?"✅ RÉSERVATION RÉCUPÉRÉE ✅":"⏳ RÉSERVATION EN ATTENTE ⏳"}</strong>
      </div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${n}</strong></div>
        <div class="shop-details">RESERVATION #: <strong>${t.saleId}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${t.customer.name.toUpperCase()}</strong></div>
        <div class="customer-field">TELEPHONE: <strong>${t.customer.phone}</strong></div>
        ${t.customer.email?`
          <div class="customer-field">EMAIL: <strong>${t.customer.email}</strong></div>
        `:""}
      </div>
      
      ${t.notes?`
        <div class="notes">
          <strong>NOTES:</strong> <strong>${t.notes}</strong>
        </div>
      `:""}
      
      <div class="receipt-title">ARTICLES RÉSERVÉS</div>
      
      <div class="items-section">
      ${t.items.map(m=>`
        <div class="item-row">
          <div class="item-name"><strong>${m.name}</strong></div>
          <div class="item-details">
            <strong>${m.quantity}Pcs × ${m.enteredCurrency==="FC"&&m.enteredPrice!==void 0?`${m.enteredPrice.toLocaleString("fr-FR")} FC`:`$${(m.enteredPrice??m.price).toFixed(2)}`}</strong>
          </div>
        </div>
        <div class="item-row">
          <div class="item-name"><strong>Sous-total</strong></div>
          <div class="item-details">
            <strong>${m.enteredCurrency==="FC"&&m.enteredPrice!==void 0?`${(m.enteredPrice*m.quantity).toLocaleString("fr-FR")} FC<br/>Équiv. USD: $${((m.priceUSD??m.price)*m.quantity).toFixed(2)}`:`$${m.total.toFixed(2)}`}</strong>
          </div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>MONTANT TOTAL:</strong></div>
          <div><strong>$${t.total.toFixed(2)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>ACOMPTE PERÇU:</strong></div>
          <div><strong>$${t.total.toFixed(2)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>MÉTHODE PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${t.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="status-info">
        <div><strong>${r?"RÉSERVATION COMPLÉTÉE AVEC SUCCÈS":"RÉSERVATION EN ATTENTE DE RETRAIT"}</strong></div>
        <div><strong>${r?"Tous les articles ont été remis au client":"Présentez ce reçu pour retirer vos articles"}</strong></div>
        <div><strong>${r?`Date retrait: ${n}`:`Date réservation: ${Y(t)}`}</strong></div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${a.toUpperCase()}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>${r?"RETRAIT EFFECTUÉ AVEC SUCCÈS !":"MERCI POUR VOTRE RÉSERVATION !"}</strong></div>
        ${r?"":`
          <div class="warning"><strong>Validité: 7 jours</strong></div>
          <div class="warning"><strong>Non remboursable</strong></div>
        `}
        <div class="warning"><strong>À BIENTÔT !</strong></div>
      </div>

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
`),s.document.close()}},$e=t=>{const s=localStorage.getItem("username")||"Admin",a=new Date().toISOString();v(n=>n.map(r=>r._id===t._id?{...r,status:"completed",completedBy:s,completedAt:a}:r)),f(!1),setTimeout(()=>L({...t,status:"completed"}),500)};return e.jsxs("div",{className:"space-y-6 p-6 flex-1 overflow-auto",children:[e.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-4",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900",children:ie.reservationhistory.label}),e.jsx("p",{className:"text-gray-600",children:ie.reservationhistory.description})]}),e.jsxs("div",{className:"flex gap-3 items-center",children:[e.jsx("div",{className:"bg-blue-50 px-4 py-2 rounded-lg border border-blue-200",children:e.jsxs("div",{className:"text-sm text-blue-600 font-medium",children:["En attente: ",e.jsx("span",{className:"font-bold",children:k?.pending??W.length})]})}),e.jsx("div",{className:"bg-green-50 px-4 py-2 rounded-lg border border-green-200",children:e.jsxs("div",{className:"text-sm text-green-600 font-medium",children:["Complétées: ",e.jsx("span",{className:"font-bold",children:K.length})]})})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-4",children:[e.jsxs("div",{className:"bg-white p-4 rounded-lg shadow border",children:[e.jsx("div",{className:"text-2xl font-bold text-blue-600",children:k?.totalReservations??N.length}),e.jsx("div",{className:"text-sm text-gray-600",children:"Total Réservations"})]}),e.jsxs("div",{className:"bg-white p-4 rounded-lg shadow border",children:[e.jsx("div",{className:"text-2xl font-bold text-orange-600",children:k?.pending??W.length}),e.jsx("div",{className:"text-sm text-gray-600",children:"En Attente"})]}),e.jsxs("div",{className:"bg-white p-4 rounded-lg shadow border",children:[e.jsx("div",{className:"text-2xl font-bold text-green-600",children:k?.completed??K.length}),e.jsx("div",{className:"text-sm text-gray-600",children:"Complétées"})]}),e.jsxs("div",{className:"bg-white p-4 rounded-lg shadow border",children:[e.jsx("div",{className:"text-2xl font-bold text-purple-600",children:k?.itemQuantity??N.reduce((t,s)=>t+s.items.reduce((a,n)=>a+n.quantity,0),0)}),e.jsx("div",{className:"text-sm text-gray-600",children:"Articles Réservés"})]})]}),_&&e.jsxs("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200",children:[_,e.jsx("button",{onClick:()=>B(null),className:"float-right text-green-700 hover:text-green-900",children:"×"})]}),T&&e.jsxs("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200",children:[T,e.jsx("button",{onClick:()=>l(null),className:"float-right text-red-700 hover:text-red-900",children:"×"})]}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow",children:e.jsxs("div",{className:"flex flex-wrap gap-4 items-center",children:[e.jsxs("div",{className:"relative flex-1 min-w-0 w-full sm:min-w-[300px]",children:[e.jsx(He,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),e.jsx("input",{type:"text",placeholder:"Rechercher par ID, client, téléphone...",className:"pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",value:x,onChange:t=>ge(t.target.value)})]}),e.jsxs("select",{value:p,onChange:t=>be(t.target.value),className:"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[e.jsx("option",{value:"all",children:"Toutes les réservations"}),e.jsx("option",{value:"pending",children:"En attente seulement"}),e.jsx("option",{value:"completed",children:"Complétées seulement"})]}),e.jsx("div",{className:"flex gap-2",children:e.jsxs("button",{onClick:S,disabled:h,className:"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50",children:[e.jsx(z,{className:"w-4 h-4"}),h?"Chargement...":"Actualiser"]})})]})}),e.jsxs("div",{className:"bg-white rounded-lg shadow",children:[e.jsx("div",{className:"px-6 py-4 border-b border-gray-200",children:e.jsxs("h2",{className:"text-lg font-semibold text-gray-900 flex items-center gap-2",children:[e.jsx(ce,{className:"w-5 h-5"}),"Liste des Réservations (",I.length,")"]})}),e.jsx("div",{className:"overflow-x-auto",children:h?e.jsxs("div",{className:"text-center py-12",children:[e.jsx("div",{className:"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"}),e.jsx("p",{className:"text-gray-500 mt-2",children:"Chargement des réservations..."})]}):I.length===0?e.jsxs("div",{className:"text-center py-12 text-gray-500",children:[e.jsx(ce,{className:"w-12 h-12 mx-auto mb-4 opacity-50"}),e.jsx("p",{children:"Aucune réservation trouvée"}),e.jsx("p",{className:"text-sm",children:"Aucune réservation ne correspond à vos critères de recherche"})]}):e.jsxs("table",{className:"min-w-full divide-y divide-gray-200",children:[e.jsx("thead",{className:"bg-gray-50",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"ID Réservation"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Client"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Date Réservation"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Articles"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Montant"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Statut"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]})}),e.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:I.map(t=>e.jsxs("tr",{className:"hover:bg-gray-50",children:[e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:t.saleId}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap",children:[e.jsx("div",{className:"text-sm text-gray-900 font-medium",children:t.customer.name}),e.jsx("div",{className:"text-sm text-gray-500",children:t.customer.phone})]}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:[e.jsx("div",{children:Y(t)}),e.jsx("div",{className:"text-gray-500 text-xs",children:Z(t)})]}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:[t.items.length," article(s)"]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:g(t.total)}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.status==="completed"?"bg-green-100 text-green-800":"bg-orange-100 text-orange-800"}`,children:t.status==="completed"?"Complétée":"En Attente"})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium",children:e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{onClick:()=>we(t),className:"text-blue-600 hover:text-blue-900 p-1 rounded",title:"Voir les détails",children:e.jsx(De,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>L(t),className:"text-purple-600 hover:text-purple-900 p-1 rounded",title:"Imprimer le reçu",children:e.jsx(de,{className:"w-4 h-4"})}),M&&e.jsx("button",{onClick:()=>ne(t),disabled:t.status==="cancelled",className:`p-1 rounded ${t.status==="cancelled"?"text-gray-400 cursor-not-allowed":"text-yellow-600 hover:text-yellow-900"}`,title:"Modifier la réservation",children:e.jsx(O,{className:"w-4 h-4"})}),ae&&t.status!=="completed"&&e.jsx("button",{onClick:()=>se(t),className:"text-red-600 hover:text-red-900 p-1 rounded",title:"Supprimer la réservation",children:e.jsx(V,{className:"w-4 h-4"})}),M&&e.jsx(e.Fragment,{children:t.status==="pending"?e.jsx("button",{onClick:()=>ee(t),disabled:h||w.busy,className:"text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50",title:"Terminer la réservation",children:e.jsx(me,{className:"w-4 h-4"})}):t.status==="completed"&&re&&e.jsx("button",{onClick:()=>te(t),disabled:h,className:"text-orange-600 hover:text-orange-900 p-1 rounded disabled:opacity-50",title:"Remettre en attente",children:e.jsx(ue,{className:"w-4 h-4"})})})]})})]},t._id))})]})})]}),b&&b.totalPages>1&&e.jsxs("div",{className:"flex items-center justify-between rounded-lg border bg-white px-4 py-3",children:[e.jsxs("span",{className:"text-sm text-gray-600",children:["Page ",b.page," sur ",b.totalPages," · ",b.totalRecords," résultats"]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{type:"button",disabled:!b.hasPreviousPage,onClick:()=>A(t=>Math.max(1,t-1)),className:"rounded border px-3 py-1.5 text-sm disabled:opacity-40",children:"Précédent"}),e.jsx("button",{type:"button",disabled:!b.hasNextPage,onClick:()=>A(t=>t+1),className:"rounded border px-3 py-1.5 text-sm disabled:opacity-40",children:"Suivant"})]})]}),w.dialog,fe&&o&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:["Détails de la Réservation - ",o.saleId]}),e.jsx("button",{onClick:()=>f(!1),className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"ID Réservation"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.saleId})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Date de Création"}),e.jsx("p",{className:"text-sm text-gray-900",children:X(o.createdAt)})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Date de Réservation"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.reservationDate?`${D(o.reservationDate)} à ${o.reservationTime||Z(o)}`:"Non spécifiée"})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Méthode de paiement"}),e.jsx("p",{className:"text-sm text-gray-900",children:Be(o.paymentMethod)})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Statut"}),e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${o.status==="completed"?"bg-green-100 text-green-800":"bg-orange-100 text-orange-800"}`,children:o.status==="completed"?"Complétée":"En Attente"})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Vendeur"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.salesPerson||"Non spécifié"})]}),o.completedAt&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Complétée le"}),e.jsx("p",{className:"text-sm text-gray-900",children:X(o.completedAt)})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Complétée par"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.completedBy||"Inconnu"})]})]})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(le,{className:"w-4 h-4"}),"Informations du Client"]}),e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(le,{className:"w-4 h-4 text-gray-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-gray-700",children:"Nom"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.customer.name})]})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(Ge,{className:"w-4 h-4 text-gray-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-gray-700",children:"Téléphone"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.customer.phone})]})]}),o.customer.email&&e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(Je,{className:"w-4 h-4 text-gray-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-gray-700",children:"Email"}),e.jsx("p",{className:"text-sm text-gray-900",children:o.customer.email})]})]})]})})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(Pe,{className:"w-4 h-4"}),"Articles Réservés (",o.items.length,")"]}),e.jsx("div",{className:"space-y-3",children:o.items.map((t,s)=>e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{children:[e.jsx("h5",{className:"font-medium text-gray-900",children:t.name}),e.jsxs("p",{className:"text-sm text-gray-600",children:["Quantité: ",t.quantity," × ",g(t.price)]})]}),e.jsx("div",{className:"text-right",children:e.jsx("p",{className:"font-medium text-gray-900",children:g(t.total)})})]})},s))})]}),o.notes&&e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Notes"}),e.jsx("div",{className:"bg-yellow-50 rounded-lg p-4 border border-yellow-200",children:e.jsx("p",{className:"text-sm text-gray-700",children:o.notes})})]}),e.jsx("div",{className:"border-t border-gray-200 pt-4",children:e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:"Montant Total:"}),e.jsx("span",{className:"text-gray-900",children:g(o.total)})]})}),e.jsxs("div",{className:"flex flex-wrap gap-3 pt-4",children:[e.jsxs("button",{onClick:()=>L(o),className:"px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(de,{className:"w-4 h-4"}),"Imprimer le Reçu"]}),M&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{onClick:()=>ne(o),disabled:o.status==="cancelled",className:`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${o.status==="cancelled"?"border-gray-300 text-gray-400 cursor-not-allowed":"border-yellow-300 text-yellow-600 hover:bg-yellow-50"}`,children:[e.jsx(O,{className:"w-4 h-4"}),"Modifier la Réservation"]}),o.status==="pending"?e.jsxs("button",{onClick:()=>ee(o),className:"flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(me,{className:"w-4 h-4"}),"Terminer la réservation"]}):o.status==="completed"&&re&&e.jsxs("button",{onClick:()=>te(o),className:"flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(ue,{className:"w-4 h-4"}),"Remettre en Attente"]})]}),ae&&o.status!=="completed"&&e.jsxs("button",{onClick:()=>se(o),className:"px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(V,{className:"w-4 h-4"}),"Supprimer"]}),e.jsx("button",{onClick:()=>f(!1),className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Fermer"})]})]})]})}),Ne&&j&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900",children:["Modifier la Réservation - ",j.saleId]}),e.jsx("button",{onClick:F,className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[T&&e.jsx("div",{className:"p-3 bg-red-100 text-red-700 rounded-lg",children:T}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Informations du Client"}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-edit-nom",className:"block text-sm font-medium text-gray-700 mb-1",children:"Nom"}),e.jsx("input",{id:"reservation-edit-nom",type:"text",value:i.customer.name,onChange:t=>c(s=>({...s,customer:{...s.customer,name:t.target.value}})),className:"w-full p-2 border rounded",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-edit-telephone",className:"block text-sm font-medium text-gray-700 mb-1",children:"Téléphone"}),e.jsx("input",{id:"reservation-edit-telephone",type:"tel",value:i.customer.phone,onChange:t=>c(s=>({...s,customer:{...s.customer,phone:t.target.value}})),className:"w-full p-2 border rounded",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-edit-email",className:"block text-sm font-medium text-gray-700 mb-1",children:"Email"}),e.jsx("input",{id:"reservation-edit-email",type:"email",value:i.customer.email,onChange:t=>c(s=>({...s,customer:{...s.customer,email:t.target.value}})),className:"w-full p-2 border rounded"})]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-edit-date-de-reservation",className:"block text-sm font-medium text-gray-700 mb-1",children:"Date de Réservation"}),e.jsx("input",{id:"reservation-edit-date-de-reservation",type:"date",value:i.reservationDate,onChange:t=>c(s=>({...s,reservationDate:t.target.value})),className:"w-full p-2 border rounded"})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-edit-heure-de-reservation",className:"block text-sm font-medium text-gray-700 mb-1",children:"Heure de Réservation"}),e.jsx("input",{id:"reservation-edit-heure-de-reservation",type:"time",value:i.reservationTime,onChange:t=>c(s=>({...s,reservationTime:t.target.value})),className:"w-full p-2 border rounded"})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-edit-methode-de-paiement",className:"block text-sm font-medium text-gray-700 mb-1",children:"Méthode de Paiement"}),e.jsxs("select",{id:"reservation-edit-methode-de-paiement",value:i.paymentMethod,onChange:t=>c(s=>({...s,paymentMethod:t.target.value})),className:"w-full p-2 border rounded",children:[e.jsx("option",{value:"cash",children:"Espèces"}),e.jsx("option",{value:"card",children:"Carte"}),e.jsx("option",{value:"transfer",children:"Virement"}),e.jsx("option",{value:"other",children:"Autre"})]})]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-edit-notes",className:"block text-sm font-medium text-gray-700 mb-1",children:"Notes"}),e.jsx("textarea",{id:"reservation-edit-notes",value:i.notes,onChange:t=>c(s=>({...s,notes:t.target.value})),placeholder:"Notes supplémentaires...",className:"w-full p-2 border rounded h-20"})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex justify-between items-center mb-3",children:[e.jsx("h4",{className:"text-md font-medium text-gray-900",children:"Articles"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("button",{onClick:$,disabled:E,className:"px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1",children:[e.jsx(z,{className:`w-3 h-3 ${E?"animate-spin":""}`})," ","Actualiser Produits"]}),e.jsxs("button",{onClick:Se,disabled:u.length===0,className:"px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1",children:[e.jsx(xe,{className:"w-3 h-3"})," Ajouter un article"]})]})]}),u.length===0&&!E&&e.jsx("div",{className:"p-3 bg-yellow-100 text-yellow-700 rounded-lg mb-4",children:e.jsx("p",{className:"text-sm",children:"Aucun article disponible. Veuillez vérifier si des articles existent dans votre base de données."})}),e.jsx("div",{className:"space-y-4",children:i.items.map((t,s)=>e.jsx("div",{className:"border rounded-lg p-4 bg-gray-50",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-12 gap-4 items-end",children:[e.jsxs("div",{className:"md:col-span-4",children:[e.jsx("label",{htmlFor:`reservation-edit-item-${s}-article`,className:"block text-sm font-medium text-gray-700 mb-1",children:"Article"}),E?e.jsx("div",{className:"p-2 border rounded bg-gray-200 text-gray-600 text-sm",children:"Chargement des produits..."}):u.length===0?e.jsx("input",{id:`reservation-edit-item-${s}-article`,type:"text",value:t.name,onChange:a=>{const n=[...i.items];n[s].name=a.target.value,c(r=>({...r,items:n}))},placeholder:"Nom du produit",className:"w-full p-2 border rounded"}):e.jsx("select",{id:`reservation-edit-item-${s}-article`,value:t.productId,onChange:a=>Re(s,a.target.value),className:"w-full p-2 border rounded",children:u.map(a=>e.jsxs("option",{value:a._id,children:[a.name," -"," ",g(a.price)," (Stock:"," ",a.stock,")"]},a._id))})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{htmlFor:`reservation-edit-item-${s}-price`,className:"block text-sm font-medium text-gray-700 mb-1",children:"Prix"}),e.jsx("input",{id:`reservation-edit-item-${s}-price`,type:"number",min:"0",step:"0.01",value:t.price,onChange:a=>Ce(s,parseFloat(a.target.value)||0),className:"w-full p-2 border rounded"})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{htmlFor:`reservation-edit-item-${s}-quantity`,className:"block text-sm font-medium text-gray-700 mb-1",children:"Quantité"}),e.jsxs("div",{className:"flex items-center border rounded",children:[e.jsx("button",{type:"button",onClick:()=>U(s,t.quantity-1),className:"p-2 hover:bg-gray-200",disabled:t.quantity<=1,children:e.jsx(Qe,{className:"w-3 h-3"})}),e.jsx("input",{id:`reservation-edit-item-${s}-quantity`,type:"number",min:"1",value:t.quantity,onChange:a=>U(s,parseInt(a.target.value)||1),className:"w-full p-2 text-center border-0"}),e.jsx("button",{type:"button",onClick:()=>U(s,t.quantity+1),className:"p-2 hover:bg-gray-200",children:e.jsx(xe,{className:"w-3 h-3"})})]})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Total"}),e.jsx("div",{className:"p-2 bg-white border rounded font-medium",children:g(t.total)})]}),e.jsx("div",{className:"md:col-span-2",children:e.jsxs("button",{type:"button",onClick:()=>ke(s),className:"w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-1",children:[e.jsx(V,{className:"w-3 h-3"})," Supprimer"]})})]})},t._id))})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4",children:[e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Sous-total:"}),e.jsx("span",{className:"text-sm text-gray-900",children:g(Ee)})]}),e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:"Total:"}),e.jsx("span",{className:"text-gray-900",children:g(Ae)})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Raison de la modification"}),e.jsx("textarea",{value:i.reason,onChange:t=>c(s=>({...s,reason:t.target.value})),placeholder:"Veuillez indiquer une raison pour la modification de cette réservation...",className:"w-full p-2 border rounded h-20",required:!0})]}),e.jsxs("div",{className:"flex flex-wrap gap-3 pt-4",children:[e.jsx("button",{onClick:Te,disabled:h||i.items.length===0,className:"flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2",children:h?e.jsxs(e.Fragment,{children:[e.jsx(z,{className:"w-4 h-4 animate-spin"})," Mise à jour..."]}):e.jsxs(e.Fragment,{children:[e.jsx(O,{className:"w-4 h-4"})," Mettre à jour la réservation"]})}),e.jsx("button",{onClick:F,className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Annuler"})]})]})]})})]})}export{dt as default};
