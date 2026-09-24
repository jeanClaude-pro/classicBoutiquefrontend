import{O as Ae,z as c,F as Me,x as e,M as de,d as z,E as Ee,U as ce,c as qe,m as Ue,n as Le,q as ze,A as _,g as _e,p as Be,k as me}from"./index-ByhrFalG.js";import{a as Oe}from"./notify-6CY3UR_1.js";import{u as Ge,c as Je,r as We,b as Ke}from"./useConfirmAction-Dfqw_vpq.js";import{p as N}from"./labels-BYV0VG2_.js";import{d as h}from"./salePricing-TZJH2azO.js";import{S as Qe}from"./search-DMDKcIS5.js";import{C as pe}from"./calendar-BeCDayOi.js";import{P as xe}from"./printer-Cu0v-sDx.js";import{S as B}from"./square-pen-Cn1UF3ih.js";import{T as O}from"./trash-2-CKnDkHWn.js";import{C as ue}from"./circle-check-big-DCLAbJ_O.js";import{C as ge}from"./circle-x-DvbC9Ntf.js";import{P as Ve,M as Xe}from"./phone-DbU3fxwI.js";import{P as he}from"./plus-PHtOi2c-.js";import{M as Ye}from"./minus-D_SieZBv.js";const w=Me;function ut(){const{t:s}=Ae(),[H,f]=c.useState([]),[x,ve]=c.useState([]),[v,S]=c.useState(!0),[u,ye]=c.useState(""),[n,be]=c.useState(null),[fe,y]=c.useState(!1),k=Ge(),[G,J]=c.useState(null),[P,d]=c.useState(null),[g,je]=c.useState("all"),[C,Ne]=c.useState(""),[W,D]=c.useState(1),[b,we]=c.useState(null),[$,He]=c.useState(null),[ke,K]=c.useState(!1),[j,Q]=c.useState(null),[l,m]=c.useState({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",notes:"",reservationDate:"",reservationTime:""}),[I,V]=c.useState(!1);c.useEffect(()=>{T();const t=localStorage.getItem("user");let r="";try{r=t&&JSON.parse(t)?.role||""}catch{r=""}console.log("🔑 User Role:",r),Ne(r)},[]),c.useEffect(()=>{const t=window.setTimeout(()=>R(),250);return()=>window.clearTimeout(t)},[W,u,g]),c.useEffect(()=>{D(1)},[u,g]);const R=async()=>{try{S(!0),d(null),console.log("🔍 Fetching reservations from API...");const t=new URLSearchParams({page:String(W),limit:"50"});u.trim()&&t.set("search",u.trim()),g!=="all"&&t.set("status",g);const r=await fetch(`${w}/sales/reservations/all?${t}`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(r.ok){const a=await r.json();console.log("📦 Reservations API Response:",a),a?.success&&Array.isArray(a.data)?(console.log(`✅ Found ${a.length} reservations`),f(a.data),we(a.pagination||null),He(a.summary||null)):(console.warn("❌ Invalid data format from API"),d(s("reservationHistory.invalidFormat")),f([]))}else console.error("❌ Reservations endpoint failed, status:",r.status),d(s("reservationHistory.loadFailed")),f([])}catch(t){console.error("❌ Error loading reservations:",t),d(s("reservationHistory.loadError")),f([])}finally{S(!1)}},T=async()=>{try{V(!0);const t=await fetch(`${w}/products?limit=0`,{headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`}});if(t.ok){const r=await t.json();let a=[];Array.isArray(r)?a=r:r&&Array.isArray(r.products)?a=r.products:r&&typeof r=="object"&&(a=[r]),ve(a)}else console.error("Products API Error:",t.status,t.statusText)}catch(t){console.error("Error loading products:",t)}finally{V(!1)}},F=H.filter(t=>{const r=t.saleId.toLowerCase().includes(u.toLowerCase())||t.customer.name.toLowerCase().includes(u.toLowerCase())||t.customer.phone.includes(u)||t.customer.email&&t.customer.email.toLowerCase().includes(u.toLowerCase()),a=g==="all"||g==="pending"&&t.status==="pending"||g==="completed"&&t.status==="completed";return r&&a}),X=H.filter(t=>t.status==="pending"),Y=H.filter(t=>t.status==="completed"),A=t=>{const r=Ue(t);return r==="—"?s("common.invalidDate"):r},Z=t=>{const r=Le(t);return r==="—"?s("common.invalidDate"):r},ee=t=>{if(t.reservationDate){const r=String(t.reservationDate).trim(),a=/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(r)?r:A(r);return t.reservationTime?`${a} ${t.reservationTime}`:a}return A(t.createdAt)},te=t=>{if(t.reservationTime)return t.reservationTime;if(t.createdAt)try{const r=new Date(t.createdAt);if(!isNaN(r.getTime()))return ze(r)}catch{}return s("reservationHistory.timeNotSpecified")},Ce=t=>{be(t),y(!0),d(null)},M=async t=>{(t.isConflict||t.status===404||t.status===400)&&await R()},se=t=>{k.request({...Je(t),action:()=>_(`${w}/sales/${t._id}/complete`,{method:"PATCH",body:{}}),onSuccess:()=>Fe(t),onError:M})},re=t=>{k.request({...We(t),action:()=>_(`${w}/sales/${t._id}/pending`,{method:"PATCH",body:{}}),onSuccess:()=>{f(r=>r.map(a=>a._id===t._id?{...a,status:"pending",completedBy:void 0,completedAt:void 0}:a)),y(!1)},onError:M})},ae=t=>{const r=Ke({...t,type:"reservation"});if(r.blockedReason){Oe(r.blockedReason);return}k.request({...r,action:()=>_(`${w}/sales/${t._id}`,{method:"DELETE"}),onSuccess:async()=>{y(!1),await R()},onError:M})},E=C==="superadmin"||C==="manager",oe=C==="superadmin",ie=C==="superadmin",ne=async t=>{if(t.status==="cancelled"){d(s("reservationHistory.cannotEditCancelled"));return}if(t.status==="completed"&&C!=="superadmin"){d(s("reservationHistory.onlyAdminEditCompleted"));return}Q(t),m({customer:{...t.customer},items:t.items.map(r=>({...r})),paymentMethod:t.paymentMethod,reason:"",notes:t.notes||"",reservationDate:t.reservationDate||"",reservationTime:t.reservationTime||""}),K(!0),d(null),x.length===0&&await T()},q=()=>{K(!1),Q(null),m({customer:{name:"",phone:"",email:""},items:[],paymentMethod:"cash",reason:"",notes:"",reservationDate:"",reservationTime:""}),d(null)},U=(t,r)=>{if(r<1)return;const a=[...l.items],i=x.find(o=>o._id===a[t].productId);if(i&&r>i.stock+a[t].quantity){d(s("reservationHistory.insufficientStock",{stock:i.stock}));return}a[t].quantity=r,a[t].total=r*a[t].price,m(o=>({...o,items:a})),d(null)},$e=(t,r)=>{if(r<0)return;const a=[...l.items];a[t].price=r,a[t].enteredPrice=r,a[t].enteredCurrency="USD",a[t].priceUSD=r,a[t].priceFC=void 0,a[t].exchangeRate=void 0,a[t].total=r*a[t].quantity,m(i=>({...i,items:a}))},Re=t=>{const r=l.items.filter((a,i)=>i!==t);m(a=>({...a,items:r}))},Se=()=>{if(x.length===0){d(s("reservationHistory.noProducts"));return}const t=x[0],r={productId:t._id,name:t.name,quantity:1,price:t.price,total:t.price,_id:`temp-${Date.now()}`,enteredPrice:t.price,enteredCurrency:"USD",priceUSD:t.price};m(a=>({...a,items:[...a.items,r]}))},Pe=(t,r)=>{const a=x.find(o=>o._id===r);if(!a){d(s("reservationHistory.productNotFound"));return}const i=[...l.items];i[t].productId=r,i[t].name=a.name,i[t].price=a.price,i[t].enteredPrice=a.price,i[t].enteredCurrency="USD",i[t].priceUSD=a.price,i[t].priceFC=void 0,i[t].exchangeRate=void 0,i[t].total=a.price*i[t].quantity,m(o=>({...o,items:i})),d(null)},le=()=>{const t=l.items.reduce((r,a)=>r+a.total,0);return{subtotal:t,total:t}},Ie=async()=>{if(j){if(l.items.length===0){d(s("reservationHistory.needItem"));return}if(!l.customer.name||!l.customer.phone){d(s("reservationHistory.needCustomer"));return}if(!l.reason){d(s("reservationHistory.needReason"));return}try{S(!0);const{subtotal:t,total:r}=le(),a={customer:l.customer,items:l.items.map(o=>({productId:o.productId,name:o.name,quantity:o.quantity,price:o.price,total:o.total,enteredPrice:o.enteredPrice,enteredCurrency:o.enteredCurrency,priceUSD:o.priceUSD,priceFC:o.priceFC,exchangeRate:o.exchangeRate})),subtotal:t,total:r,paymentMethod:l.paymentMethod,reason:l.reason,notes:l.notes,reservationDate:l.reservationDate,reservationTime:l.reservationTime,_id:j._id,saleId:j.saleId};console.log("Sending reservation update data:",a);const i=await fetch(`${w}/sales/${j._id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("token")||""}`},body:JSON.stringify(a)});if(console.log("Update response status:",i.status),i.ok){const o=await i.json();console.log("Updated reservation:",o),J(s("reservationHistory.updated")),await R(),q(),y(!1)}else{const o=await i.json();console.error("Update error:",o),d(_e(i.status,o).message)}}catch(t){console.error("Error updating reservation:",t),d(s("reservationHistory.updateNetworkError"))}finally{S(!1)}}},{subtotal:De,total:Te}=le(),L=t=>{const r=window.open("","_blank","width=320,height=600");if(r){const a=localStorage.getItem("username")||s("reservationHistory.seller"),i=Be(),o=t.status==="completed";r.document.write(`
<html>
  <head>
    <title>${s("resHistoryReceipt.title")}</title>
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
        ${o?"background-color: #28a745; color: white;":"background-color: #ffc107; color: #000;"}
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
        ${o?"background-color: #d4edda; border: 2px solid #28a745;":"background-color: #fff3cd; border: 2px solid #ffc107;"}
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
        <div class="shop-details">${s("saleReceipt.tel")}: <strong>+243 836 017 031</strong></div>
        <div class="shop-details"><strong>LSH/RCCM/22-A-01266</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="status-badge">
        <strong>${s(o?"resHistoryReceipt.collected":"resHistoryReceipt.pending")}</strong>
      </div>
      
      <div class="receipt-info">
        <div class="shop-details">${s("saleReceipt.date")}: <strong>${i}</strong></div>
        <div class="shop-details">${s("resHistoryReceipt.reservationNo")}: <strong>${t.saleId}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">${s("saleReceipt.customer")}: <strong>${t.customer.name.toUpperCase()}</strong></div>
        <div class="customer-field">${s("saleReceipt.phone")}: <strong>${t.customer.phone}</strong></div>
        ${t.customer.email?`
          <div class="customer-field">${s("reservationReceipt.email")}: <strong>${t.customer.email}</strong></div>
        `:""}
      </div>
      
      ${t.notes?`
        <div class="notes">
          <strong>${s("reservationReceipt.notes")}:</strong> <strong>${t.notes}</strong>
        </div>
      `:""}
      
      <div class="receipt-title">${s("reservationReceipt.items")}</div>
      
      <div class="items-section">
      ${t.items.map(p=>`
        <div class="item-row">
          <div class="item-name"><strong>${p.name}</strong></div>
          <div class="item-details">
            <strong>${p.quantity}${s("resHistoryReceipt.pcs")} × ${p.enteredCurrency==="FC"&&p.enteredPrice!==void 0?`${p.enteredPrice.toLocaleString(me())} FC`:`$${(p.enteredPrice??p.price).toFixed(2)}`}</strong>
          </div>
        </div>
        <div class="item-row">
          <div class="item-name"><strong>${s("resHistoryReceipt.subtotal")}</strong></div>
          <div class="item-details">
            <strong>${p.enteredCurrency==="FC"&&p.enteredPrice!==void 0?`${(p.enteredPrice*p.quantity).toLocaleString(me())} FC<br/>${s("resHistoryReceipt.usdEquivalent")}: $${((p.priceUSD??p.price)*p.quantity).toFixed(2)}`:`$${p.total.toFixed(2)}`}</strong>
          </div>
        </div>
      `).join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>${s("resHistoryReceipt.totalAmount")}:</strong></div>
          <div><strong>$${t.total.toFixed(2)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>${s("reservationReceipt.depositReceived")}:</strong></div>
          <div><strong>$${t.total.toFixed(2)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>${s("receipt.paymentMethod")}:</strong></div>
          <div class="payment-method"><strong>${N(t.paymentMethod).toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="status-info">
        <div><strong>${s(o?"resHistoryReceipt.completedTitle":"resHistoryReceipt.pendingTitle")}</strong></div>
        <div><strong>${s(o?"resHistoryReceipt.handedOver":"resHistoryReceipt.present")}</strong></div>
        <div><strong>${o?s("resHistoryReceipt.pickupDate",{date:i}):s("resHistoryReceipt.reservationDate",{date:ee(t)})}</strong></div>
      </div>
      
      <div class="sales-person">
        ${s("saleReceipt.agent")}: <strong>${a.toUpperCase()}</strong>
      </div>
      
      <div class="footer">
        <div class="thank-you"><strong>${s(o?"resHistoryReceipt.pickedUp":"reservationReceipt.thanks")}</strong></div>
        ${o?"":`
          <div class="warning"><strong>${s("reservationReceipt.validity")}</strong></div>
          <div class="warning"><strong>${s("saleReceipt.noRefund")}</strong></div>
        `}
        <div class="warning"><strong>${s("resHistoryReceipt.seeYou")}</strong></div>
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
`),r.document.close()}},Fe=t=>{const r=localStorage.getItem("username")||"Admin",a=new Date().toISOString();f(i=>i.map(o=>o._id===t._id?{...o,status:"completed",completedBy:r,completedAt:a}:o)),y(!1),setTimeout(()=>L({...t,status:"completed"}),500)};return e.jsxs("div",{className:"space-y-6 p-6 flex-1 overflow-auto",children:[e.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-4",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl font-bold text-gray-900",children:de.reservationhistory.label}),e.jsx("p",{className:"text-gray-600",children:de.reservationhistory.description})]}),e.jsxs("div",{className:"flex gap-3 items-center",children:[e.jsx("div",{className:"bg-blue-50 px-4 py-2 rounded-lg border border-blue-200",children:e.jsxs("div",{className:"text-sm text-blue-600 font-medium",children:[s("reservationHistory.pendingCount")," ",e.jsx("span",{className:"font-bold",children:$?.pending??X.length})]})}),e.jsx("div",{className:"bg-green-50 px-4 py-2 rounded-lg border border-green-200",children:e.jsxs("div",{className:"text-sm text-green-600 font-medium",children:[s("reservationHistory.completedCount")," ",e.jsx("span",{className:"font-bold",children:Y.length})]})})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-4",children:[e.jsxs("div",{className:"bg-white p-4 rounded-lg shadow border",children:[e.jsx("div",{className:"text-2xl font-bold text-blue-600",children:$?.totalReservations??H.length}),e.jsx("div",{className:"text-sm text-gray-600",children:s("reservationHistory.totalReservations")})]}),e.jsxs("div",{className:"bg-white p-4 rounded-lg shadow border",children:[e.jsx("div",{className:"text-2xl font-bold text-orange-600",children:$?.pending??X.length}),e.jsx("div",{className:"text-sm text-gray-600",children:s("reservationHistory.pending")})]}),e.jsxs("div",{className:"bg-white p-4 rounded-lg shadow border",children:[e.jsx("div",{className:"text-2xl font-bold text-green-600",children:$?.completed??Y.length}),e.jsx("div",{className:"text-sm text-gray-600",children:s("reservationHistory.completed")})]}),e.jsxs("div",{className:"bg-white p-4 rounded-lg shadow border",children:[e.jsx("div",{className:"text-2xl font-bold text-purple-600",children:$?.itemQuantity??H.reduce((t,r)=>t+r.items.reduce((a,i)=>a+i.quantity,0),0)}),e.jsx("div",{className:"text-sm text-gray-600",children:s("reservationHistory.reservedItems")})]})]}),G&&e.jsxs("div",{className:"mb-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200",children:[G,e.jsx("button",{onClick:()=>J(null),className:"float-right text-green-700 hover:text-green-900","aria-label":s("reservationHistory.dismiss"),children:"×"})]}),P&&e.jsxs("div",{className:"mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200",children:[P,e.jsx("button",{onClick:()=>d(null),className:"float-right text-red-700 hover:text-red-900","aria-label":s("reservationHistory.dismiss"),children:"×"})]}),e.jsx("div",{className:"bg-white p-4 rounded-lg shadow",children:e.jsxs("div",{className:"flex flex-wrap gap-4 items-center",children:[e.jsxs("div",{className:"relative flex-1 min-w-0 w-full sm:min-w-[300px]",children:[e.jsx(Qe,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"}),e.jsx("input",{type:"text",placeholder:s("reservationHistory.searchPlaceholder"),"aria-label":s("reservationHistory.searchLabel"),className:"pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",value:u,onChange:t=>ye(t.target.value)})]}),e.jsxs("select",{value:g,onChange:t=>je(t.target.value),"aria-label":s("reservationHistory.statusFilter"),className:"px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",children:[e.jsx("option",{value:"all",children:s("reservationHistory.filters.all")}),e.jsx("option",{value:"pending",children:s("reservationHistory.filters.pending")}),e.jsx("option",{value:"completed",children:s("reservationHistory.filters.completed")})]}),e.jsx("div",{className:"flex gap-2",children:e.jsxs("button",{onClick:R,disabled:v,className:"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50",children:[e.jsx(z,{className:"w-4 h-4"}),s(v?"reservationHistory.loadingShort":"common.refresh")]})})]})}),e.jsxs("div",{className:"bg-white rounded-lg shadow",children:[e.jsx("div",{className:"px-6 py-4 border-b border-gray-200",children:e.jsxs("h2",{className:"text-lg font-semibold text-gray-900 flex items-center gap-2",children:[e.jsx(pe,{className:"w-5 h-5"}),s("reservationHistory.list",{count:F.length})]})}),e.jsx("div",{className:"overflow-x-auto",children:v?e.jsxs("div",{className:"text-center py-12",children:[e.jsx("div",{className:"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"}),e.jsx("p",{className:"text-gray-500 mt-2",children:s("reservationHistory.loading")})]}):F.length===0?e.jsxs("div",{className:"text-center py-12 text-gray-500",children:[e.jsx(pe,{className:"w-12 h-12 mx-auto mb-4 opacity-50"}),e.jsx("p",{children:s("reservationHistory.noneFound")}),e.jsx("p",{className:"text-sm",children:s("reservationHistory.noneFoundHint")})]}):e.jsxs("table",{className:"min-w-full divide-y divide-gray-200",children:[e.jsx("thead",{className:"bg-gray-50",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:s("reservationHistory.columns.id")}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:s("reservationHistory.columns.customer")}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:s("reservationHistory.columns.date")}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:s("reservationHistory.columns.items")}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:s("reservationHistory.columns.amount")}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:s("reservationHistory.columns.status")}),e.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:s("common.actions")})]})}),e.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:F.map(t=>e.jsxs("tr",{className:"hover:bg-gray-50",children:[e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:t.saleId}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap",children:[e.jsx("div",{className:"text-sm text-gray-900 font-medium",children:t.customer.name}),e.jsx("div",{className:"text-sm text-gray-500",children:t.customer.phone})]}),e.jsxs("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:[e.jsx("div",{children:ee(t)}),e.jsx("div",{className:"text-gray-500 text-xs",children:te(t)})]}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:s("reservationHistory.itemCount",{count:t.items.length})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:h(t.total)}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap",children:e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.status==="completed"?"bg-green-100 text-green-800":"bg-orange-100 text-orange-800"}`,children:t.status==="completed"?s("reservationHistory.statusCompleted"):s("reservationHistory.statusPending")})}),e.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium",children:e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{onClick:()=>Ce(t),className:"text-blue-600 hover:text-blue-900 p-1 rounded",title:s("reservationHistory.viewDetails"),"aria-label":s("reservationHistory.viewDetails"),children:e.jsx(Ee,{className:"w-4 h-4"})}),e.jsx("button",{onClick:()=>L(t),className:"text-purple-600 hover:text-purple-900 p-1 rounded",title:s("reservationHistory.printReceipt"),"aria-label":s("reservationHistory.printReceipt"),children:e.jsx(xe,{className:"w-4 h-4"})}),E&&e.jsx("button",{onClick:()=>ne(t),disabled:t.status==="cancelled",className:`p-1 rounded ${t.status==="cancelled"?"text-gray-400 cursor-not-allowed":"text-yellow-600 hover:text-yellow-900"}`,title:s("reservationHistory.edit"),"aria-label":s("reservationHistory.edit"),children:e.jsx(B,{className:"w-4 h-4"})}),oe&&t.status!=="completed"&&e.jsx("button",{onClick:()=>ae(t),className:"text-red-600 hover:text-red-900 p-1 rounded",title:s("reservationHistory.delete"),"aria-label":s("reservationHistory.delete"),children:e.jsx(O,{className:"w-4 h-4"})}),E&&e.jsx(e.Fragment,{children:t.status==="pending"?e.jsx("button",{onClick:()=>se(t),disabled:v||k.busy,className:"text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50",title:s("reservationHistory.complete"),"aria-label":s("reservationHistory.complete"),children:e.jsx(ue,{className:"w-4 h-4"})}):t.status==="completed"&&ie&&e.jsx("button",{onClick:()=>re(t),disabled:v,className:"text-orange-600 hover:text-orange-900 p-1 rounded disabled:opacity-50",title:s("reservationHistory.revert"),"aria-label":s("reservationHistory.revert"),children:e.jsx(ge,{className:"w-4 h-4"})})})]})})]},t._id))})]})})]}),b&&b.totalPages>1&&e.jsxs("div",{className:"flex items-center justify-between rounded-lg border bg-white px-4 py-3",children:[e.jsx("span",{className:"text-sm text-gray-600",children:s("reservationHistory.pageInfo",{page:b.page,pages:b.totalPages,count:b.totalRecords})}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{type:"button",disabled:!b.hasPreviousPage,onClick:()=>D(t=>Math.max(1,t-1)),className:"rounded border px-3 py-1.5 text-sm disabled:opacity-40",children:s("reservationHistory.previous")}),e.jsx("button",{type:"button",disabled:!b.hasNextPage,onClick:()=>D(t=>t+1),className:"rounded border px-3 py-1.5 text-sm disabled:opacity-40",children:s("reservationHistory.next")})]})]}),k.dialog,fe&&n&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:s("reservationHistory.detailsTitle",{id:n.saleId})}),e.jsx("button",{onClick:()=>y(!1),"aria-label":s("common.close"),className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.columns.id")}),e.jsx("p",{className:"text-sm text-gray-900",children:n.saleId})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.createdAt")}),e.jsx("p",{className:"text-sm text-gray-900",children:Z(n.createdAt)})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.reservationDate")}),e.jsx("p",{className:"text-sm text-gray-900",children:n.reservationDate?s("reservationHistory.dateAt",{date:A(n.reservationDate),time:n.reservationTime||te(n)}):s("reservationHistory.notSpecifiedF")})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.paymentMethod")}),e.jsx("p",{className:"text-sm text-gray-900",children:N(n.paymentMethod)})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.columns.status")}),e.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${n.status==="completed"?"bg-green-100 text-green-800":"bg-orange-100 text-orange-800"}`,children:n.status==="completed"?s("reservationHistory.statusCompleted"):s("reservationHistory.statusPending")})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.seller2")}),e.jsx("p",{className:"text-sm text-gray-900",children:n.salesPerson||s("reservationHistory.notSpecified")})]}),n.completedAt&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.completedOn")}),e.jsx("p",{className:"text-sm text-gray-900",children:Z(n.completedAt)})]}),e.jsxs("div",{children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.completedBy")}),e.jsx("p",{className:"text-sm text-gray-900",children:n.completedBy||s("common.unknown")})]})]})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(ce,{className:"w-4 h-4"}),s("reservationHistory.customerInfo")]}),e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(ce,{className:"w-4 h-4 text-gray-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-gray-700",children:s("reservationHistory.name")}),e.jsx("p",{className:"text-sm text-gray-900",children:n.customer.name})]})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(Ve,{className:"w-4 h-4 text-gray-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-gray-700",children:s("reservationHistory.phone")}),e.jsx("p",{className:"text-sm text-gray-900",children:n.customer.phone})]})]}),n.customer.email&&e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(Xe,{className:"w-4 h-4 text-gray-500"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-gray-700",children:s("reservationHistory.email")}),e.jsx("p",{className:"text-sm text-gray-900",children:n.customer.email})]})]})]})})]}),e.jsxs("div",{children:[e.jsxs("h4",{className:"text-md font-medium text-gray-900 mb-3 flex items-center gap-2",children:[e.jsx(qe,{className:"w-4 h-4"}),s("reservationHistory.reservedItemsCount",{count:n.items.length})]}),e.jsx("div",{className:"space-y-3",children:n.items.map((t,r)=>e.jsx("div",{className:"bg-gray-50 rounded-lg p-4",children:e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{children:[e.jsx("h5",{className:"font-medium text-gray-900",children:t.name}),e.jsx("p",{className:"text-sm text-gray-600",children:s("reservationHistory.quantityLine",{quantity:t.quantity,price:h(t.price)})})]}),e.jsx("div",{className:"text-right",children:e.jsx("p",{className:"font-medium text-gray-900",children:h(t.total)})})]})},r))})]}),n.notes&&e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:s("reservationHistory.notes")}),e.jsx("div",{className:"bg-yellow-50 rounded-lg p-4 border border-yellow-200",children:e.jsx("p",{className:"text-sm text-gray-700",children:n.notes})})]}),e.jsx("div",{className:"border-t border-gray-200 pt-4",children:e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:s("reservationHistory.totalAmount")}),e.jsx("span",{className:"text-gray-900",children:h(n.total)})]})}),e.jsxs("div",{className:"flex flex-wrap gap-3 pt-4",children:[e.jsxs("button",{onClick:()=>L(n),className:"px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(xe,{className:"w-4 h-4"}),s("reservationHistory.printReceiptButton")]}),E&&e.jsxs(e.Fragment,{children:[e.jsxs("button",{onClick:()=>ne(n),disabled:n.status==="cancelled",className:`px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 ${n.status==="cancelled"?"border-gray-300 text-gray-400 cursor-not-allowed":"border-yellow-300 text-yellow-600 hover:bg-yellow-50"}`,children:[e.jsx(B,{className:"w-4 h-4"}),s("reservationHistory.editButton")]}),n.status==="pending"?e.jsxs("button",{onClick:()=>se(n),className:"flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(ue,{className:"w-4 h-4"}),s("reservationHistory.complete")]}):n.status==="completed"&&ie&&e.jsxs("button",{onClick:()=>re(n),className:"flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(ge,{className:"w-4 h-4"}),s("reservationHistory.revertButton")]})]}),oe&&n.status!=="completed"&&e.jsxs("button",{onClick:()=>ae(n),className:"px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(O,{className:"w-4 h-4"}),s("reservationHistory.deleteButton")]}),e.jsx("button",{onClick:()=>y(!1),className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:s("common.close")})]})]})]})}),ke&&j&&e.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50",children:e.jsxs("div",{className:"bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-gray-200 flex items-center justify-between",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-900",children:s("reservationHistory.editTitle",{id:j.saleId})}),e.jsx("button",{onClick:q,"aria-label":s("common.close"),className:"text-gray-400 hover:text-gray-600",children:e.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),e.jsxs("div",{className:"p-6 space-y-6",children:[P&&e.jsx("div",{className:"p-3 bg-red-100 text-red-700 rounded-lg",children:P}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:s("reservationHistory.customerInfo")}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-edit-nom",className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.name")}),e.jsx("input",{id:"reservation-edit-nom",type:"text",value:l.customer.name,onChange:t=>m(r=>({...r,customer:{...r.customer,name:t.target.value}})),className:"w-full p-2 border rounded",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-edit-telephone",className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.phone")}),e.jsx("input",{id:"reservation-edit-telephone",type:"tel",value:l.customer.phone,onChange:t=>m(r=>({...r,customer:{...r.customer,phone:t.target.value}})),className:"w-full p-2 border rounded",required:!0})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-edit-email",className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.email")}),e.jsx("input",{id:"reservation-edit-email",type:"email",value:l.customer.email,onChange:t=>m(r=>({...r,customer:{...r.customer,email:t.target.value}})),className:"w-full p-2 border rounded"})]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-edit-date-de-reservation",className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.reservationDate")}),e.jsx("input",{id:"reservation-edit-date-de-reservation",type:"date",value:l.reservationDate,onChange:t=>m(r=>({...r,reservationDate:t.target.value})),className:"w-full p-2 border rounded"})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-edit-heure-de-reservation",className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.reservationTime")}),e.jsx("input",{id:"reservation-edit-heure-de-reservation",type:"time",value:l.reservationTime,onChange:t=>m(r=>({...r,reservationTime:t.target.value})),className:"w-full p-2 border rounded"})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-edit-methode-de-paiement",className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.paymentMethodEdit")}),e.jsxs("select",{id:"reservation-edit-methode-de-paiement",value:l.paymentMethod,onChange:t=>m(r=>({...r,paymentMethod:t.target.value})),className:"w-full p-2 border rounded",children:[e.jsx("option",{value:"cash",children:N("cash")}),e.jsx("option",{value:"card",children:N("card")}),e.jsx("option",{value:"transfer",children:N("transfer")}),e.jsx("option",{value:"other",children:N("other")})]})]})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"reservation-edit-notes",className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.notes")}),e.jsx("textarea",{id:"reservation-edit-notes",value:l.notes,onChange:t=>m(r=>({...r,notes:t.target.value})),placeholder:s("reservationHistory.notesPlaceholder"),className:"w-full p-2 border rounded h-20"})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex justify-between items-center mb-3",children:[e.jsx("h4",{className:"text-md font-medium text-gray-900",children:s("reservationHistory.items")}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("button",{onClick:T,disabled:I,className:"px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1",children:[e.jsx(z,{className:`w-3 h-3 ${I?"animate-spin":""}`})," ",s("reservationHistory.refreshProducts")]}),e.jsxs("button",{onClick:Se,disabled:x.length===0,className:"px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1",children:[e.jsx(he,{className:"w-3 h-3"})," ",s("reservationHistory.addItem")]})]})]}),x.length===0&&!I&&e.jsx("div",{className:"p-3 bg-yellow-100 text-yellow-700 rounded-lg mb-4",children:e.jsx("p",{className:"text-sm",children:s("reservationHistory.noItemsAvailable")})}),e.jsx("div",{className:"space-y-4",children:l.items.map((t,r)=>e.jsx("div",{className:"border rounded-lg p-4 bg-gray-50",children:e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-12 gap-4 items-end",children:[e.jsxs("div",{className:"md:col-span-4",children:[e.jsx("label",{htmlFor:`reservation-edit-item-${r}-article`,className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.item")}),I?e.jsx("div",{className:"p-2 border rounded bg-gray-200 text-gray-600 text-sm",children:s("reservationHistory.loadingProducts")}):x.length===0?e.jsx("input",{id:`reservation-edit-item-${r}-article`,type:"text",value:t.name,onChange:a=>{const i=[...l.items];i[r].name=a.target.value,m(o=>({...o,items:i}))},placeholder:s("reservationHistory.productName"),className:"w-full p-2 border rounded"}):e.jsx("select",{id:`reservation-edit-item-${r}-article`,value:t.productId,onChange:a=>Pe(r,a.target.value),className:"w-full p-2 border rounded",children:x.map(a=>e.jsx("option",{value:a._id,children:s("reservationHistory.productOption",{name:a.name,price:h(a.price),stock:a.stock})},a._id))})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{htmlFor:`reservation-edit-item-${r}-price`,className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.price")}),e.jsx("input",{id:`reservation-edit-item-${r}-price`,type:"number",min:"0",step:"0.01",value:t.price,onChange:a=>$e(r,parseFloat(a.target.value)||0),className:"w-full p-2 border rounded"})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("label",{htmlFor:`reservation-edit-item-${r}-quantity`,className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.quantity")}),e.jsxs("div",{className:"flex items-center border rounded",children:[e.jsx("button",{type:"button",onClick:()=>U(r,t.quantity-1),className:"p-2 hover:bg-gray-200",disabled:t.quantity<=1,"aria-label":s("reservationHistory.decrease"),children:e.jsx(Ye,{className:"w-3 h-3"})}),e.jsx("input",{id:`reservation-edit-item-${r}-quantity`,type:"number",min:"1",value:t.quantity,onChange:a=>U(r,parseInt(a.target.value)||1),className:"w-full p-2 text-center border-0"}),e.jsx("button",{type:"button",onClick:()=>U(r,t.quantity+1),"aria-label":s("reservationHistory.increase"),className:"p-2 hover:bg-gray-200",children:e.jsx(he,{className:"w-3 h-3"})})]})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("span",{className:"block text-sm font-medium text-gray-700 mb-1",children:s("reservationHistory.total")}),e.jsx("div",{className:"p-2 bg-white border rounded font-medium",children:h(t.total)})]}),e.jsx("div",{className:"md:col-span-2",children:e.jsxs("button",{type:"button",onClick:()=>Re(r),className:"w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-1",children:[e.jsx(O,{className:"w-3 h-3"})," ",s("reservationHistory.remove")]})})]})},t._id))})]}),e.jsxs("div",{className:"border-t border-gray-200 pt-4",children:[e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("span",{className:"text-sm text-gray-600",children:s("reservationHistory.subtotal")}),e.jsx("span",{className:"text-sm text-gray-900",children:h(De)})]}),e.jsxs("div",{className:"flex justify-between items-center text-lg font-semibold",children:[e.jsx("span",{className:"text-gray-900",children:s("reservationHistory.totalLabel")}),e.jsx("span",{className:"text-gray-900",children:h(Te)})]})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-md font-medium text-gray-900 mb-3",children:s("reservationHistory.editReason")}),e.jsx("textarea",{value:l.reason,onChange:t=>m(r=>({...r,reason:t.target.value})),placeholder:s("reservationHistory.editReasonPlaceholder"),"aria-label":s("reservationHistory.editReason"),className:"w-full p-2 border rounded h-20",required:!0})]}),e.jsxs("div",{className:"flex flex-wrap gap-3 pt-4",children:[e.jsx("button",{onClick:Ie,disabled:v||l.items.length===0,className:"flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2",children:v?e.jsxs(e.Fragment,{children:[e.jsx(z,{className:"w-4 h-4 animate-spin"})," ",s("reservationHistory.updating")]}):e.jsxs(e.Fragment,{children:[e.jsx(B,{className:"w-4 h-4"})," ",s("reservationHistory.update")]})}),e.jsx("button",{onClick:q,className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",children:s("common.cancel")})]})]})]})})]})}export{ut as default};
