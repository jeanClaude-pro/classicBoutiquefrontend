import{j as ct,t as r,x as v,k as mt,h as V,y as Y,s as e,M as Me,d as G,n as xt,E as ut,X as J,U as ht,p as Te,m as Q,u as q,S as pt}from"./index-BalGFMsI.js";import{e as Re,p as X,P as $e}from"./labels-CLkR1D3V.js";import{d as x,f as gt}from"./salePricing-B6CLvYLp.js";import{a as Fe,b as ft}from"./notify-CfYsxrlT.js";import{u as bt,j as yt,k as jt,h as vt,g as Nt,i as wt}from"./useConfirmAction-jH2uII0Y.js";import{S as Ct}from"./search-CjHoRDHU.js";import{C as St}from"./calendar-BWvZlzqW.js";import{F as kt}from"./funnel-BhX9yFFb.js";import{C as Pe}from"./chevron-down-D_Nao-02.js";import{F as L}from"./file-text-DbJRDj5T.js";import{H as K}from"./history-kdMwWz3k.js";import{C as W}from"./circle-check-big-hSrAZTak.js";import{C as Z}from"./circle-x-CprW5tMU.js";import{S as De}from"./square-pen-CejW2XqV.js";import{T as Ie}from"./trash-2-Ddnxl_49.js";import{C as qe}from"./circle-alert-CkPLLTyp.js";import{S as Et}from"./save-Ql6qN5_Q.js";const At=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]],Le=ct("rotate-ccw",At),A=()=>{const h=new Date,w=h.getFullYear(),C=String(h.getMonth()+1).padStart(2,"0"),R=String(h.getDate()).padStart(2,"0");return`${w}-${C}-${R}`},U=()=>{const h=new Date,w=h.getFullYear(),C=String(h.getMonth()+1).padStart(2,"0");return`${w}-${C}`},M=()=>new Date().getFullYear();function Yt(){const[h,w]=r.useState([]),[C,R]=r.useState(!0),[p,ee]=r.useState(""),[a,_]=r.useState(null),[Ue,S]=r.useState(!1),[_e,te]=r.useState(!1),[ze,se]=r.useState(!1),[u,ae]=r.useState(null),[re,Be]=r.useState(null),[ie,g]=r.useState(null),[ne,z]=r.useState(null),[l,j]=r.useState({reason:"",recipientName:"",recipientPhone:"",amount:"",paymentMethod:"cash",notes:"",updateReason:""}),k=bt(),[le,oe]=r.useState([]),[Oe,de]=r.useState(!1),[f,B]=r.useState("today"),[i,$]=r.useState({from:"",to:"",date:A(),year:M().toString(),month:U().split("-")[1],status:"",paymentMethod:"",recordedBy:"",search:""}),[ce,He]=r.useState(!0),[o,Ve]=r.useState(null),[m,Ye]=r.useState(null),[me,Ge]=r.useState("Aujourd'hui"),[xe,T]=r.useState(null),[F,Je]=r.useState(!1),[P,ue]=r.useState(!1),[he,O]=r.useState(1),[E,Qe]=r.useState(null),[d,Xe]=r.useState({isAdmin:!1,canValidate:!1,canEditAll:!1,canDeleteAll:!1,userId:"",userName:""}),Ke=()=>{const t=new URLSearchParams;switch(t.set("page",String(he)),t.set("limit","50"),f){case"custom":i.from&&t.append("from",i.from),i.to&&t.append("to",i.to);break;case"day":i.date&&t.append("date",i.date);break;case"month":i.year&&t.append("year",i.year),i.month&&t.append("month",i.month);break;case"year":i.year&&t.append("year",i.year);break}return i.status&&t.append("status",i.status),i.paymentMethod&&t.append("paymentMethod",i.paymentMethod),i.recordedBy&&t.append("recordedBy",i.recordedBy),p.trim()&&t.append("search",p.trim()),t.toString()};r.useEffect(()=>{We(),N()},[]),r.useEffect(()=>{Object.keys(i).length>0&&N()},[i,he,p]),r.useEffect(()=>{O(1)},[i,p]),r.useEffect(()=>{if(!ce&&f==="day"){const t=A();st(t)}},[f,ce]),r.useEffect(()=>{!d.isAdmin&&f!=="day"&&(B("day"),$(t=>({...t,date:A(),from:"",to:"",year:"",month:""})))},[f,d.isAdmin]),r.useEffect(()=>{h.length>0&&He(!1)},[h]);const We=async()=>{try{const t=await fetch(`${v}/expenses/permissions/me`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(t.ok){const s=await t.json();Xe(s)}}catch(t){console.error("Error fetching user permissions:",t)}},N=async()=>{try{R(!0),g(null);const t=Ke(),s=`${v}/expenses${t?`?${t}`:""}`;console.log("Fetching expenses from:",s);const n=await fetch(s,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(n.ok){const c=await n.json();if(c.success&&c.data&&Array.isArray(c.data)){const y=c.data;console.log(`Fetched ${y.length} expenses from API`),console.log("Timeframe metadata:",c.timeframe),console.log("Summary stats:",c.summary);const lt=y.sort((ot,dt)=>new Date(dt.createdAt).getTime()-new Date(ot.createdAt).getTime());w(lt),Qe(c.pagination||null),Ge(mt(c.timeframe.description)),Ve(c.summary),Ye(c.filtersApplied)}else console.warn("Unexpected expenses data structure:",c),g("Réponse inattendue du serveur. Actualisez la page.")}else g(`Impossible de charger les décaissements. ${(await V(n)).message}`)}catch(t){g(`Impossible de charger les décaissements. ${Y(t).message}`)}finally{R(!1)}},pe=()=>Array.from({length:10},(t,s)=>M()-s),Ze=()=>d.isAdmin?me:"Aujourd'hui",et=t=>{if(!d.isAdmin&&t!=="day")return;B(t);const s={...i};switch(t){case"today":s.date=A(),s.from="",s.to="",s.year=M().toString(),s.month=U().split("-")[1];break;case"day":s.date=A(),s.from="",s.to="";break;case"month":s.year=M().toString(),s.month=U().split("-")[1],s.date="",s.from="",s.to="";break;case"year":s.year=M().toString(),s.month="",s.date="",s.from="",s.to="";break;case"custom":if(!s.from){const n=new Date,c=new Date(n.getFullYear(),n.getMonth(),1);s.from=c.toISOString().split("T")[0]}s.to||(s.to=new Date().toISOString().split("T")[0]),s.date="",s.year="",s.month="";break}$(s)},b=(t,s)=>{$(n=>({...n,[t]:s}))},tt=()=>{$({from:"",to:"",date:A(),year:M().toString(),month:U().split("-")[1],status:"",paymentMethod:"",recordedBy:"",search:""}),B("today"),ee(""),ue(!1)},st=t=>{b("date",t)},ge=t=>Q(t),at=t=>t.enteredCurrency==="FC"?`${gt(t.enteredAmount??t.amountFC??0)} (Équiv. ${x(t.amountUSD??t.amount)})`:x(t.enteredAmount??t.amount),D=h.filter(t=>t.expenseId.toLowerCase().includes(p.toLowerCase())||t.reason.toLowerCase().includes(p.toLowerCase())||t.recipientName.toLowerCase().includes(p.toLowerCase())||t.recipientPhone.includes(p)||t.recordedBy.toLowerCase().includes(p.toLowerCase())),rt=t=>{_(t),S(!0),g(null)},I=async t=>{(t.isConflict||t.code==="INSUFFICIENT_PURCHASE_FUNDS"||t.status===404)&&await N()},fe=t=>{const s=jt(t);if(s.blockedReason){Fe(s.blockedReason);return}k.request({...s,action:()=>q(`${v}/expenses/${t._id}/validate`,{method:"PATCH",body:{}}),onSuccess:async()=>{S(!1),await N()},onError:I})},be=t=>{k.request({...vt(t),reason:{label:"Motif du rejet",required:!0,placeholder:"Ex. : doublon, montant erroné…"},action:s=>q(`${v}/expenses/${t._id}/reject`,{method:"PATCH",body:{reason:s}}),onSuccess:async()=>{S(!1),await N()},onError:I})},ye=t=>{const s=Nt(t);if(s.blockedReason){Fe(s.blockedReason);return}const n=t.status!=="pending"&&d.isAdmin?`${v}/expenses/${t._id}/admin`:`${v}/expenses/${t._id}`;k.request({...s,action:()=>q(n,{method:"DELETE"}),onSuccess:()=>{w(c=>c.filter(y=>y._id!==t._id)),a?._id===t._id&&(_(null),S(!1))},onError:I})},je=t=>d.isAdmin&&t.status==="validated"&&(t.expenseType==="COMPANY_EXPENSE"||t.expenseType==="GOODS_PURCHASE")&&t.transactionKind!=="REVERSAL"&&!t.reversedBy,ve=t=>{k.request({...wt(t),reason:{label:"Motif de la contre-passation",required:!0,placeholder:"Ex. : achat annulé par le fournisseur"},action:s=>q(`${v}/expenses/${t._id}/reverse`,{method:"POST",body:{reason:s}}),onSuccess:async()=>{S(!1),await N()},onError:I})},Ne=t=>{ae(t),j({reason:t.reason,recipientName:t.recipientName,recipientPhone:t.recipientPhone,amount:String(t.amount??""),paymentMethod:t.paymentMethod,notes:t.notes||"",updateReason:""}),te(!0),g(null)},H=()=>{T(null),te(!1),ae(null),j({reason:"",recipientName:"",recipientPhone:"",amount:"",paymentMethod:"cash",notes:"",updateReason:""}),g(null)},we=()=>{se(!1),oe([])},Ce=async t=>{try{de(!0);const s=await fetch(`${v}/expenses/${t}/history`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(s.ok){const n=await s.json();oe(n.history||[]),se(!0)}else g(`Impossible de charger l'historique de ce décaissement. ${(await V(s)).message}`)}catch(s){g(`Impossible de charger l'historique de ce décaissement. ${Y(s).message}`)}finally{de(!1)}},it=async()=>{if(u){z(`editing-${u._id}`),T(null);try{if(u.status!=="pending"&&d.isAdmin&&!l.updateReason.trim()){T("Indiquez la raison de la modification : ce décaissement a déjà été traité."),z(null);return}const s=await fetch(`${v}/expenses/${u._id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify({reason:l.reason,recipientName:l.recipientName,recipientPhone:l.recipientPhone,amount:parseFloat(l.amount),paymentMethod:l.paymentMethod,notes:l.notes,updateReason:l.updateReason})});if(s.ok){const n=await s.json();ft("Modification enregistrée avec succès."),H(),w(c=>c.map(y=>y._id===u._id?{...y,...n}:y)),a&&a._id===u._id&&_({...a,...n})}else{const n=await V(s);T(n.message),(n.isConflict||n.status===404)&&N()}}catch(t){T(Y(t).message)}finally{z(null)}}},Se=t=>{const s=window.open("","_blank","width=320,height=600");if(s){const n=t.enteredCurrency==="FC"?`${(t.enteredAmount??t.amountFC??0).toLocaleString("fr-FR")} FC (Équiv. $${(t.amountUSD??t.amount).toFixed(2)})`:new Intl.NumberFormat("fr-FR",{style:"currency",currency:"USD"}).format(t.enteredAmount??t.amount),c=Q(t.createdAt),y=t.validatedAt?Q(t.validatedAt):c;s.document.write(`
<html>
  <head>
    <title>Reçu de décaissement</title>
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
      .expense-details {
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
      .validation-info {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #e8f5e8;
        border: 1px solid #4caf50;
        border-radius: 2px;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
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
        <div class="shop-name"><strong>ETS DOUBLE M CLASSIC BOUTIQUE</strong></div>
        <div class="shop-details"><strong>780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi</strong></div>
        <div class="shop-details">TEL: <strong>+243 836 017 031</strong></div>
        <div class="shop-details"><strong>LSH/RCCM/22-A-01266</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${c}</strong></div>
        <div class="shop-details">RECU #: <strong>${t.expenseId}</strong></div>
      </div>
      
      <div class="receipt-title">REÇU DE DÉCAISSEMENT</div>
      
      <div class="expense-details">
        <div class="detail-row">
          <div class="detail-label"><strong>RAISON:</strong></div>
          <div class="detail-value"><strong>${t.reason.toUpperCase()}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>BÉNÉFICIAIRE:</strong></div>
          <div class="detail-value"><strong>${t.recipientName.toUpperCase()}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>TÉLÉPHONE:</strong></div>
          <div class="detail-value"><strong>${t.recipientPhone}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>MONTANT:</strong></div>
          <div class="detail-value"><strong>${n}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label"><strong>PAIEMENT:</strong></div>
          <div class="detail-value"><strong>${t.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>MONTANT TOTAL:</strong></div>
          <div><strong>${n}</strong></div>
        </div>
      </div>
      
      <div class="validation-info">
        Validé par: <strong>${t.validatedBy||"ADMIN"}</strong><br>
        Le: <strong>${y}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>SOUCHE DE DÉCAISSEMENT</strong></div>
        <div class="warning"><strong>Conserver cette souche</strong></div>
        <div class="warning">Reçu #: <strong>${t.expenseId}</strong></div>
        <div class="warning">Date: <strong>${c}</strong></div>
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
`),s.document.close()}},ke=t=>["REPAYMENT","repayment"].includes(t.expenseType||"")||t.status==="validated"&&["COMPANY_EXPENSE","GOODS_PURCHASE"].includes(t.expenseType||"")?!1:!!(d.isAdmin||d.canEditAll||t.status==="pending"&&t.recordedBy===d.userId),Ee=t=>t.status==="validated"?!1:!!(d.isAdmin||d.canDeleteAll||t.status==="pending"&&t.recordedBy===d.userId),Ae=t=>t?t.status!=="pending"&&(d.isAdmin||d.canEditAll):!1,nt=()=>{const t=(()=>{try{const s=localStorage.getItem("user");return s?JSON.parse(s).role==="superadmin":!1}catch{return!1}})();return!o||!d.isAdmin||!t?null:e.jsxs("div",{className:"bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6",children:[e.jsx("div",{className:"flex items-center justify-between mb-4",children:e.jsxs("h3",{className:"text-lg font-semibold text-blue-900 flex items-center gap-2",children:[e.jsx(pt,{className:"w-5 h-5"}),"Synthèse des décaissements"]})}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-4",children:[e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Total des décaissements"}),e.jsx("p",{className:"text-2xl font-bold text-blue-600",children:o.totalRecords}),e.jsx("p",{className:"text-sm text-gray-500",children:x(o.totalAmount)})]}),e.jsx(L,{className:"w-8 h-8 text-blue-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Validés"}),e.jsx("p",{className:"text-2xl font-bold text-green-600",children:o.validated.count}),e.jsx("p",{className:"text-sm text-green-600",children:x(o.validated.amount)})]}),e.jsx(W,{className:"w-8 h-8 text-green-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"En Attente"}),e.jsx("p",{className:"text-2xl font-bold text-yellow-600",children:o.pending.count}),e.jsx("p",{className:"text-sm text-yellow-600",children:x(o.pending.amount)})]}),e.jsx(qe,{className:"w-8 h-8 text-yellow-500"})]})}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow border border-gray-200",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600",children:"Rejetés"}),e.jsx("p",{className:"text-2xl font-bold text-red-600",children:o.rejected?.count||0}),e.jsx("p",{className:"text-sm text-red-600",children:x(o.rejected?.amount||0)})]}),e.jsx(Z,{className:"w-8 h-8 text-red-500"})]})})]}),e.jsx("div",{className:"mt-4 pt-4 border-t border-blue-200",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{className:"bg-white p-3 rounded-lg border border-gray-200",children:[e.jsx("div",{className:"text-sm font-medium text-gray-700 mb-2",children:"Répartition par statut"}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Validés :"}),e.jsxs("div",{className:"text-right",children:[e.jsx("span",{className:"font-semibold text-green-600",children:o.validated.count}),e.jsx("div",{className:"text-xs text-gray-500",children:x(o.validated.amount)})]})]}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"En attente :"}),e.jsxs("div",{className:"text-right",children:[e.jsx("span",{className:"font-semibold text-yellow-600",children:o.pending.count}),e.jsx("div",{className:"text-xs text-gray-500",children:x(o.pending.amount)})]})]}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Rejetés :"}),e.jsxs("div",{className:"text-right",children:[e.jsx("span",{className:"font-semibold text-red-600",children:o.rejected?.count||0}),e.jsx("div",{className:"text-xs text-gray-500",children:x(o.rejected?.amount||0)})]})]})]})]}),e.jsxs("div",{className:"bg-white p-3 rounded-lg border border-gray-200",children:[e.jsx("div",{className:"text-sm font-medium text-gray-700 mb-2",children:"Montants totaux"}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Total général:"}),e.jsx("span",{className:"font-bold text-blue-600",children:x(o.totalAmount)})]}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Montant moyen:"}),e.jsx("span",{className:"font-medium text-gray-900",children:o.totalRecords>0?x(o.totalAmount/o.totalRecords):x(0)})]}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Taux de validation:"}),e.jsx("span",{className:"font-medium text-green-600",children:o.totalRecords>0?`${(o.validated.count/o.totalRecords*100).toFixed(1)}%`:"0%"})]})]})]}),e.jsxs("div",{className:"bg-white p-3 rounded-lg border border-gray-200",children:[e.jsx("div",{className:"text-sm font-medium text-gray-700 mb-2",children:"Informations temporelles"}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Période:"}),e.jsx("span",{className:"text-sm font-medium text-gray-900",children:me})]}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Dernière mise à jour:"}),e.jsx("span",{className:"text-sm text-gray-900",children:Te(new Date)})]}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Données filtrées:"}),e.jsxs("span",{className:"text-sm text-gray-900",children:[D.length," / ",h.length]})]})]})]})]})})]})};return e.jsxs("div",{className:"space-y-6 p-4 sm:p-6 pb-28 md:pb-8 flex-1 overflow-auto",children:[e.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-4 overflow-auto",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900",children:Me.historicsortie.label}),e.jsx("p",{className:"text-gray-600",children:Me.historicsortie.description})]}),e.jsxs("div",{className:"flex gap-3",children:[e.jsxs("button",{onClick:N,disabled:C,className:"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2",children:[e.jsx(G,{className:`w-4 h-4 ${C?"animate-spin":""}`}),"Actualiser"]}),e.jsxs("div",{className:"relative",children:[e.jsx(Ct,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),e.jsx("input",{type:"text",placeholder:"Rechercher un décaissement…","aria-label":"Rechercher un décaissement",className:"pl-10 w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",value:p,onChange:t=>ee(t.target.value)})]})]})]}),e.jsx(nt,{}),e.jsxs("div",{className:"bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4",children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-900 flex items-center gap-2",children:[e.jsx(St,{className:"w-4 h-4 sm:w-5 sm:h-5"}),"Filtre par période (",Ze(),")"]}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsxs("button",{onClick:()=>Je(!F),className:"px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2",children:[e.jsx(kt,{className:"w-4 h-4"}),F?"Masquer les filtres":"Afficher les filtres",e.jsx(Pe,{className:`w-4 h-4 transition-transform ${F?"rotate-180":""}`})]}),e.jsxs("button",{onClick:tt,className:"px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2",children:[e.jsx(G,{className:"w-4 h-4"}),"Réinitialiser les filtres"]})]})]}),F&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("span",{id:"sortie-history-timeframe-type",className:"block text-sm font-medium text-gray-700 mb-2",children:"Type de période"}),e.jsx("div",{role:"group","aria-labelledby":"sortie-history-timeframe-type",className:"flex flex-wrap gap-2",children:["today","day","month","year","custom"].map(t=>e.jsxs("button",{onClick:()=>et(t),disabled:!d.isAdmin&&t!=="day",className:`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${f===t?"bg-blue-500 text-white shadow-sm":"bg-gray-100 text-gray-700 hover:bg-gray-200"} ${!d.isAdmin&&t!=="day"?"opacity-50 cursor-not-allowed":""}`,children:[t==="today"&&"Aujourd'hui",t==="day"&&"Jour spécifique",t==="month"&&"Mois spécifique",t==="year"&&"Année spécifique",t==="custom"&&"Plage personnalisée"]},t))})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",children:[f==="day"&&e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-history-date",className:"block text-sm font-medium text-gray-700 mb-1",children:"Date"}),e.jsx("input",{id:"sortie-history-date",type:"date",value:i.date,onChange:t=>b("date",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",disabled:!d.isAdmin})]}),f==="month"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-history-mois-annee",className:"block text-sm font-medium text-gray-700 mb-1",children:"Année"}),e.jsx("select",{id:"sortie-history-mois-annee",value:i.year,onChange:t=>b("year",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:pe().map(t=>e.jsx("option",{value:t,children:t},t))})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-history-mois",className:"block text-sm font-medium text-gray-700 mb-1",children:"Mois"}),e.jsx("select",{id:"sortie-history-mois",value:i.month,onChange:t=>b("month",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:Array.from({length:12},(t,s)=>{const n=(s+1).toString().padStart(2,"0");return e.jsxs("option",{value:n,children:[xt(s)," (",n,")"]},n)})})]})]}),f==="year"&&e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-history-annee",className:"block text-sm font-medium text-gray-700 mb-1",children:"Année"}),e.jsx("select",{id:"sortie-history-annee",value:i.year,onChange:t=>b("year",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:pe().map(t=>e.jsx("option",{value:t,children:t},t))})]}),f==="custom"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-history-date-de-debut",className:"block text-sm font-medium text-gray-700 mb-1",children:"Date de début"}),e.jsx("input",{id:"sortie-history-date-de-debut",type:"date",value:i.from,onChange:t=>b("from",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-history-date-de-fin",className:"block text-sm font-medium text-gray-700 mb-1",children:"Date de fin"}),e.jsx("input",{id:"sortie-history-date-de-fin",type:"date",value:i.to,onChange:t=>b("to",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg"})]})]})]}),e.jsxs("div",{children:[e.jsxs("button",{onClick:()=>ue(!P),className:"text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1",children:[P?"Masquer les filtres avancés":"Filtres avancés",e.jsx(Pe,{className:`w-4 h-4 transition-transform ${P?"rotate-180":""}`})]}),P&&e.jsxs("div",{className:"mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-history-statut",className:"block text-sm font-medium text-gray-700 mb-1",children:"Statut"}),e.jsxs("select",{id:"sortie-history-statut",value:i.status,onChange:t=>b("status",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"Tous les statuts"}),e.jsx("option",{value:"pending",children:"En attente"}),e.jsx("option",{value:"validated",children:"Validés"}),e.jsx("option",{value:"rejected",children:"Rejetés"}),e.jsx("option",{value:"all",children:"Tous"})]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-history-methode-de-paiement",className:"block text-sm font-medium text-gray-700 mb-1",children:"Méthode de paiement"}),e.jsxs("select",{id:"sortie-history-methode-de-paiement",value:i.paymentMethod,onChange:t=>b("paymentMethod",t.target.value),className:"w-full p-2 border border-gray-300 rounded-lg",children:[e.jsx("option",{value:"",children:"Toutes"}),e.jsx("option",{value:"cash",children:"Espèces"}),e.jsx("option",{value:"card",children:"Carte"}),e.jsx("option",{value:"bank",children:"Banque"}),e.jsx("option",{value:"mpesa",children:"M-Pesa"}),e.jsx("option",{value:"other",children:"Autre"})]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-history-enregistre-par",className:"block text-sm font-medium text-gray-700 mb-1",children:"Enregistré par"}),e.jsx("input",{id:"sortie-history-enregistre-par",type:"text",value:i.recordedBy,onChange:t=>b("recordedBy",t.target.value),placeholder:"Filtrer par enregistreur...",className:"w-full p-2 border border-gray-300 rounded-lg"})]})]})]})]}),m&&e.jsxs("div",{className:"mt-4 text-sm text-gray-600",children:[e.jsx("span",{className:"font-medium",children:"Filtres appliqués :"}),e.jsxs("span",{className:"ml-2",children:["Statut : ",m.status&&!["all","none"].includes(m.status)?Re(m.status):"tous",", Paiement : ",m.paymentMethod&&!["all","none"].includes(m.paymentMethod)?X(m.paymentMethod):"tous",m.recordedBy&&m.recordedBy!=="none"&&`, Enregistré par : ${m.recordedBy}`,m.search&&m.search!=="none"&&`, Recherche : ${m.search}`]})]})]}),re&&e.jsxs("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200",children:[re,e.jsx("button",{onClick:()=>Be(null),className:"float-right text-green-700 hover:text-green-900",children:"×"})]}),ie&&e.jsxs("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200",children:[ie,e.jsx("button",{onClick:()=>g(null),className:"float-right text-red-700 hover:text-red-900",children:"×"})]}),e.jsxs("div",{className:"bg-white rounded-lg shadow",children:[e.jsx("div",{className:"px-6 py-4 border-b border-gray-200",children:e.jsxs("h2",{className:"text-lg font-semibold text-gray-900 flex items-center gap-2",children:[e.jsx(L,{className:"w-5 h-5"}),d.isAdmin?"Décaissements de la période":"Décaissements du jour"," (",D.length,")"]})}),e.jsx("div",{className:"overflow-x-auto",children:C?e.jsxs("div",{className:"text-center py-12",children:[e.jsx("div",{className:"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"}),e.jsx("p",{className:"text-gray-500 mt-2",children:"Chargement des décaissements…"})]}):D.length===0?e.jsxs("div",{className:"text-center py-12 text-gray-500",children:[e.jsx(L,{className:"w-12 h-12 mx-auto mb-4 opacity-50"}),e.jsx("p",{children:"Aucun décaissement trouvé"}),e.jsx("p",{className:"text-sm",children:"pour la période sélectionnée"})]}):e.jsxs("table",{className:"min-w-full divide-y divide-gray-200",children:[e.jsx("thead",{className:"bg-gray-50",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Référence"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Motif et type"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Bénéficiaire"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Montant"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Paiement"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Statut"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Date"}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]})}),e.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:D.map(t=>e.jsxs("tr",{className:"hover:bg-gray-50",children:[e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:t.expenseId}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:[t.reason,e.jsxs("div",{className:"mt-1 flex flex-wrap gap-1",children:[e.jsxs("span",{className:`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${["REPAYMENT","repayment"].includes(t.expenseType||"")?"bg-orange-100 text-orange-800":t.expenseType==="COMPANY_EXPENSE"?"bg-red-100 text-red-800":t.expenseType==="GOODS_PURCHASE"?"bg-blue-100 text-blue-800":"bg-gray-100 text-gray-700"}`,children:[yt(t.expenseType),["REPAYMENT","repayment"].includes(t.expenseType||"")?` · ${t.creditorSnapshot?.name||"Créancier"}`:t.category?` · ${t.category==="SHOES"?"Chaussures":"Vêtements"}`:""]}),t.transactionKind==="REVERSAL"&&e.jsx("span",{className:"inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800",children:"Contre-passation"}),t.reversedBy&&e.jsx("span",{className:"inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200",children:"Contre-passé"})]})]}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap",children:[e.jsx("div",{className:"text-sm text-gray-900",children:t.recipientName}),e.jsx("div",{className:"text-sm text-gray-500",children:t.recipientPhone})]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:at(t)}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800",children:X(t.paymentMethod)})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${t.status==="validated"?"bg-green-100 text-green-800":t.status==="rejected"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`,children:t.status==="validated"?"Validé":t.status==="rejected"?"Rejeté":"En attente"})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-500",children:ge(t.createdAt)}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium",children:e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{onClick:()=>rt(t),className:"text-blue-600 hover:text-blue-900 p-1 rounded",title:"Voir les détails",children:e.jsx(ut,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>Ce(t._id),className:"text-gray-600 hover:text-gray-900 p-1 rounded",title:"Voir l'historique",children:e.jsx(K,{className:"w-4 h-4"})}),d.canValidate&&t.status!=="validated"&&t.status!=="rejected"&&e.jsxs(e.Fragment,{children:[e.jsx("button",{onClick:()=>fe(t),disabled:k.busy,className:"text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50",title:"Valider le décaissement","aria-label":`Valider ${t.expenseId}`,children:e.jsx(W,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>be(t),disabled:k.busy,className:"text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50",title:"Rejeter le décaissement","aria-label":`Rejeter ${t.expenseId}`,children:e.jsx(Z,{className:"w-4 h-4"})})]}),ke(t)&&e.jsx("button",{onClick:()=>Ne(t),className:"text-yellow-600 hover:text-yellow-900 p-1 rounded",title:"Modifier le décaissement",children:e.jsx(De,{className:"w-4 h-4"})}),Ee(t)&&e.jsx("button",{onClick:()=>ye(t),className:"text-red-600 hover:text-red-900 p-1 rounded",title:"Supprimer le décaissement","aria-label":`Supprimer ${t.expenseId}`,children:e.jsx(Ie,{className:"w-4 h-4"})}),je(t)&&e.jsx("button",{onClick:()=>ve(t),className:"text-amber-600 hover:text-amber-800 p-1 rounded",title:"Contre-passer l'opération","aria-label":`Contre-passer ${t.expenseId}`,children:e.jsx(Le,{className:"w-4 h-4"})}),t.status==="validated"&&e.jsx("button",{onClick:()=>Se(t),className:"text-purple-600 hover:text-purple-900 p-1 rounded",title:"Imprimer le reçu",children:e.jsx($e,{className:"w-4 h-4"})})]})})]},t._id))})]})})]}),E&&E.totalPages>1&&e.jsxs("div",{className:"flex items-center justify-between rounded-lg border bg-white px-4 py-3",children:[e.jsxs("span",{className:"text-sm text-gray-600",children:["Page ",E.page," sur ",E.totalPages," · ",E.totalRecords," décaissements"]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{disabled:!E.hasPreviousPage,onClick:()=>O(t=>Math.max(1,t-1)),className:"rounded border px-3 py-1.5 disabled:opacity-40",children:"Précédent"}),e.jsx("button",{disabled:!E.hasNextPage,onClick:()=>O(t=>t+1),className:"rounded border px-3 py-1.5 disabled:opacity-40",children:"Suivant"})]})]}),Ue&&a&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:"Détails du décaissement"}),e.jsx("button",{onClick:()=>S(!1),className:"text-gray-400 hover:text-gray-600",children:e.jsx(J,{className:"w-6 h-6"})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Référence"}),e.jsx("p",{className:"text-sm text-gray-900",children:a.expenseId})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Date"}),e.jsx("p",{className:"text-sm text-gray-900",children:ge(a.createdAt)})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Méthode de paiement"}),e.jsx("p",{className:"text-sm text-gray-900",children:X(a.paymentMethod)})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Statut"}),e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${a.status==="validated"?"bg-green-100 text-green-800":a.status==="rejected"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`,children:a.status==="validated"?"Validé":a.status==="rejected"?"Rejeté":"En attente"})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Enregistré par"}),e.jsx("p",{className:"text-sm text-gray-900",children:a.recordedBy})]})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(L,{className:"w-4 h-4"}),"Motif et montant"]}),e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Raison"}),e.jsx("p",{className:"text-sm text-gray-900",children:a.reason})]}),e.jsx("div",{className:"grid grid-cols-2 gap-4",children:e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Montant"}),e.jsx("p",{className:"text-lg font-semibold text-gray-900",children:x(a.amount)})]})})]})})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(ht,{className:"w-4 h-4"}),"Information du Bénéficiaire"]}),e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Nom"}),e.jsx("p",{className:"text-sm text-gray-900",children:a.recipientName})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Téléphone"}),e.jsx("p",{className:"text-sm text-gray-900",children:a.recipientPhone})]})]})})]}),a.notes&&e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:"Notes supplémentaires"}),e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsx("p",{className:"text-sm text-gray-900 whitespace-pre-line",children:a.notes})})]}),e.jsxs("div",{className:"flex flex-wrap gap-3 pt-4",children:[e.jsxs("button",{onClick:()=>Ce(a._id),className:"flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(K,{className:"w-4 h-4"}),"Historique"]}),a.status==="validated"&&e.jsxs("button",{onClick:()=>Se(a),className:"flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx($e,{className:"w-4 h-4"}),"Imprimer Reçu"]}),d.canValidate&&a.status!=="validated"&&a.status!=="rejected"&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{onClick:()=>fe(a),className:"flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(W,{className:"w-4 h-4"}),"Valider"]}),e.jsxs("button",{onClick:()=>be(a),className:"flex-1 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2",children:[e.jsx(Z,{className:"w-4 h-4"}),"Rejeter"]})]}),je(a)&&e.jsxs("button",{onClick:()=>ve(a),className:"flex-1 bg-amber-50 text-amber-800 border border-amber-200 px-4 py-2 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-2",children:[e.jsx(Le,{className:"w-4 h-4"}),"Contre-passer"]}),ke(a)&&e.jsxs("button",{onClick:()=>Ne(a),className:"flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(De,{className:"w-4 h-4"}),"Modifier"]}),Ee(a)&&e.jsxs("button",{onClick:()=>ye(a),className:"flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(Ie,{className:"w-4 h-4"}),"Supprimer"]}),e.jsx("button",{onClick:()=>S(!1),className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Fermer"})]})]})]})}),k.dialog,_e&&u&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:"Modifier le décaissement"}),e.jsx("button",{onClick:H,className:"text-gray-400 hover:text-gray-600",children:e.jsx(J,{className:"w-6 h-6"})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[Ae(u)&&e.jsxs("div",{className:"bg-yellow-50 border border-yellow-200 rounded-lg p-4",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(qe,{className:"w-5 h-5 text-yellow-600"}),e.jsxs("span",{className:"text-sm font-medium text-yellow-800",children:["Modification d'un décaissement ",Re(u.status).toLowerCase()]})]}),e.jsx("p",{className:"text-sm text-yellow-700 mt-2",children:"Ce décaissement a déjà été traité. Indiquez la raison de cette modification."})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-edit-raison",className:"block text-sm font-medium text-gray-700 mb-1",children:"Motif du décaissement *"}),e.jsx("input",{id:"sortie-edit-raison",type:"text",value:l.reason,onChange:t=>j({...l,reason:t.target.value}),className:"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-edit-beneficiaire-nom",className:"block text-sm font-medium text-gray-700 mb-1",children:"Nom du bénéficiaire *"}),e.jsx("input",{id:"sortie-edit-beneficiaire-nom",type:"text",value:l.recipientName,onChange:t=>j({...l,recipientName:t.target.value}),className:"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-edit-beneficiaire-telephone",className:"block text-sm font-medium text-gray-700 mb-1",children:"Téléphone du bénéficiaire *"}),e.jsx("input",{id:"sortie-edit-beneficiaire-telephone",type:"tel",value:l.recipientPhone,onChange:t=>j({...l,recipientPhone:t.target.value}),className:"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-edit-montant",className:"block text-sm font-medium text-gray-700 mb-1",children:"Montant (USD) *"}),e.jsx("input",{id:"sortie-edit-montant",type:"number",step:"0.01",min:"0",value:l.amount,onChange:t=>j({...l,amount:t.target.value}),className:"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-edit-methode-de-paiement",className:"block text-sm font-medium text-gray-700 mb-1",children:"Méthode de paiement *"}),e.jsxs("select",{id:"sortie-edit-methode-de-paiement",value:l.paymentMethod,onChange:t=>j({...l,paymentMethod:t.target.value}),className:"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[e.jsx("option",{value:"cash",children:"Espèces"}),e.jsx("option",{value:"card",children:"Carte"}),e.jsx("option",{value:"bank",children:"Virement bancaire"}),e.jsx("option",{value:"mpesa",children:"M-Pesa"}),e.jsx("option",{value:"other",children:"Autre"})]})]})]}),Ae(u)&&e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-edit-motif",className:"block text-sm font-medium text-gray-700 mb-1",children:"Raison de la modification *"}),e.jsx("textarea",{id:"sortie-edit-motif",value:l.updateReason,onChange:t=>j({...l,updateReason:t.target.value}),className:"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",rows:3,placeholder:"Expliquez pourquoi vous modifiez ce décaissement…",required:!0}),e.jsx("p",{className:"text-xs text-gray-500 mt-1",children:"Cette raison sera enregistrée dans l'historique du décaissement."})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"sortie-edit-notes",className:"block text-sm font-medium text-gray-700 mb-1",children:"Notes supplémentaires (optionnel)"}),e.jsx("textarea",{id:"sortie-edit-notes",value:l.notes,onChange:t=>j({...l,notes:t.target.value}),className:"w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",rows:3,placeholder:"Ajoutez des notes supplémentaires..."})]})]}),xe&&e.jsx("div",{className:"rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700",role:"alert",children:xe}),e.jsxs("div",{className:"flex flex-wrap gap-3 pt-4",children:[e.jsxs("button",{onClick:it,disabled:ne===`editing-${u._id}`,className:"flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2",children:[ne===`editing-${u._id}`?e.jsx(G,{className:"w-4 h-4 animate-spin"}):e.jsx(Et,{className:"w-4 h-4"}),"Enregistrer les modifications"]}),e.jsx("button",{onClick:H,className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Annuler"})]})]})]})}),ze&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:"Historique du décaissement"}),e.jsx("button",{onClick:we,className:"text-gray-400 hover:text-gray-600",children:e.jsx(J,{className:"w-6 h-6"})})]}),e.jsxs("div",{className:"p-6",children:[Oe?e.jsxs("div",{className:"text-center py-8",children:[e.jsx("div",{className:"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"}),e.jsx("p",{className:"text-gray-500 mt-2",children:"Chargement de l'historique..."})]}):le.length===0?e.jsxs("div",{className:"text-center py-8 text-gray-500",children:[e.jsx(K,{className:"w-12 h-12 mx-auto mb-4 opacity-50"}),e.jsx("p",{children:"Aucun historique disponible"}),e.jsx("p",{className:"text-sm",children:"pour ce décaissement"})]}):e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"bg-gray-50 rounded-lg p-4",children:[e.jsxs("p",{className:"text-sm font-medium text-gray-900",children:["Décaissement : ",a?.expenseId||"—"]}),e.jsxs("p",{className:"text-sm text-gray-600 mt-1",children:["Statut actuel:"," ",e.jsx("span",{className:`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${a?.status==="validated"?"bg-green-100 text-green-800":a?.status==="rejected"?"bg-red-100 text-red-800":"bg-yellow-100 text-yellow-800"}`,children:a?.status==="validated"?"Validé":a?.status==="rejected"?"Rejeté":"En attente"})]})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("h4",{className:"text-md font-medium text-gray-900",children:"Journal des modifications"}),e.jsx("div",{className:"space-y-3",children:le.map((t,s)=>e.jsxs("div",{className:"border-l-4 border-blue-500 pl-4 py-2",children:[e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsx("p",{className:"text-sm text-gray-900 font-medium",children:t.action}),e.jsx("span",{className:"text-xs text-gray-500",children:t.formattedDate})]}),e.jsx("p",{className:"text-xs text-gray-600 mt-1",children:Te(new Date(t.timestamp))})]},s))})]})]}),e.jsx("div",{className:"flex flex-wrap gap-3 pt-6",children:e.jsx("button",{onClick:we,className:"flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:"Fermer"})})]})]})})]})}export{Yt as default};
