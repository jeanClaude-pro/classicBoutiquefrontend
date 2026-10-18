import{q as l,H as c}from"./index-6e9lXuF8.js";import{e as u}from"./salePricing-suxLeAib.js";const b={title:"saleReceipt.title",stubTitle:"saleReceipt.stubTitle",tagline:"saleReceipt.tagline",tel:"saleReceipt.tel",date:"saleReceipt.date",receiptNo:"saleReceipt.receiptNo",customer:"saleReceipt.customer",phone:"saleReceipt.phone",email:"saleReceipt.email",itemsBought:"saleReceipt.itemsBought",itemsSold:"saleReceipt.itemsSold",item:"saleReceipt.columns.item",unitPrice:"saleReceipt.columns.unitPrice",qty:"saleReceipt.columns.qty",total:"saleReceipt.columns.total",subtotal:"saleReceipt.subtotal",saleTotal:"saleReceipt.saleTotal",payment:"saleReceipt.payment",agent:"saleReceipt.agent",thanks:"saleReceipt.thanks",noExchange:"saleReceipt.noExchange",noRefund:"saleReceipt.noRefund",stubNo:"saleReceipt.stubNo",stubNumber:"saleReceipt.stubNumberOfDay",stubFooter:"saleReceipt.stubFooter",keepStub:"saleReceipt.keepStub",receiptNoShort:"saleReceipt.receiptNoShort",dateShort:"saleReceipt.dateShort"};function h(t=l()){const e=c.getFixedT(t),n={};for(const[i,r]of Object.entries(b))n[i]=e(r,{number:"{{number}}"});return n}function f(t,e=l()){const n=String(t||"");return c.getFixedT(e)(`saleReceipt.payments.${n}`,{defaultValue:n.toUpperCase()})}function w(t,e){return t.map(n=>{const i=Number(n.quantity)||0,r=u(n,e);return{name:String(n.name??""),quantity:i,unitFC:r,totalFC:r===void 0?void 0:r*i}})}function v(t){if(!(!t.length||t.some(e=>e.totalFC===void 0)))return t.reduce((e,n)=>e+(n.totalFC??0),0)}function a(t){return t==null||!Number.isFinite(t)?"—":`${String(Math.round(t)).replace(/\B(?=(\d{3})+(?!\d))/g,",")} FC`}function N(t,e=l()){const n=w(t.items,t.exchangeRate),i=v(n);return{...t,language:e,labels:h(e),lines:n,subtotalFC:i,totalFC:i,paymentLabel:f(t.paymentMethod,e)}}function S(t){const{labels:e}=t;return{shopName:t.shopName,shopAddress:t.shopAddress,shopNumber:t.shopNumber,shopRegistration:t.shopRegistration,receiptFooter:t.receiptFooter,customerName:t.customerName,customerPhone:t.customerPhone??"",customerEmail:t.customerEmail,items:t.items,exchangeRate:t.exchangeRate,paymentMethod:t.paymentMethod,paymentLabel:t.paymentLabel,salesPerson:t.salesPerson,date:t.date,receiptNumber:t.receiptNumber,stubNumber:t.stubNumber??t.receiptNumber,language:t.language,labels:{tagline:e.tagline,date:e.dateShort,receiptNo:e.receiptNoShort,customer:e.customer,phone:e.phone,email:e.email,item:e.item,unitPrice:e.unitPrice,qty:e.qty,total:e.total,subtotal:e.subtotal,saleTotal:e.saleTotal,payment:e.payment,agent:e.agent,thanks:e.thanks,noExchange:`${e.noExchange} - ${e.noRefund}`,stubTitle:e.stubTitle.toUpperCase(),stubNumber:e.stubNumber}}}function o(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function m(t){return typeof t=="string"?o(t):Array.isArray(t)?t.map(e=>m(e)):t&&typeof t=="object"&&!(t instanceof Date)?Object.fromEntries(Object.entries(t).map(([e,n])=>[e,m(n)])):t}function x(t){let e=!1;const n=()=>{if(!e){e=!0;try{t.focus(),t.print()}catch(i){console.error("Print error:",i)}window.setTimeout(()=>{try{t.close()}catch{}},1e3)}};if(t.document?.readyState==="complete"){window.setTimeout(n,50);return}try{t.addEventListener?.("load",n,{once:!0})}catch{}window.setTimeout(n,1500)}const $=t=>`
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Courier New', Courier, monospace;
        margin: 0; padding: 0;
        font-size: 12px; font-weight: bold; line-height: 1.2;
        width: 80mm; background-color: white;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      .receipt-container { width: 78mm; margin: 0 auto; padding: 1mm 2mm; border: none; text-align: center; position: relative; }
      .logo-watermark {
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background-image: url('${t}/newlogo.png');
        background-repeat: no-repeat; background-position: center; background-size: 65%;
        opacity: 0.18; pointer-events: none; z-index: 0;
      }
      .content-wrapper { position: relative; z-index: 1; }
      .header { text-align: center; margin-bottom: 2mm; padding-bottom: 1mm; border-bottom: 2px double #000; }
      .shop-name { font-size: 14px; font-weight: bold; margin-bottom: 0.5mm; text-transform: uppercase; }
      .shop-details { font-size: 10px; margin-bottom: 0.3mm; line-height: 1.2; font-weight: bold; }
      .receipt-info { margin: 2mm 0; padding: 1mm 2mm; background-color: #f8f8f8; border-left: 3px solid #000; text-align: left; }
      .receipt-title {
        font-size: 11px; font-weight: bold; margin: 1mm 0; text-transform: uppercase;
        background-color: #000; color: white; padding: 1mm 2mm; border-radius: 2px; text-align: center;
      }
      .stub-number {
        font-size: 11px; font-weight: bold; margin: 2mm 0; text-transform: uppercase;
        background-color: #333; color: white; padding: 1mm 2mm; border-radius: 3px;
      }
      .items-table { width: 100%; border-collapse: collapse; font-size: 10px; background-color: #fafafa; }
      .items-table th {
        background-color: #e0e0e0; text-transform: uppercase; font-weight: bold;
        padding: 1mm 0.8mm; border-bottom: 1px solid #999;
      }
      .items-table td { padding: 0.6mm 0.8mm; border-bottom: 1px dotted #ddd; vertical-align: top; font-weight: bold; }
      .items-table .col-article { text-align: left; overflow-wrap: anywhere; word-break: break-word; }
      .items-table .col-pu, .items-table .col-total { text-align: right; white-space: nowrap; }
      .items-table .col-qte { text-align: center; white-space: nowrap; }
      .total-section { font-weight: bold; margin-top: 2mm; padding: 1mm 2mm; background-color: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; }
      .total-row { display: flex; justify-content: space-between; gap: 2mm; margin-bottom: 0.5mm; font-size: 11px; padding: 0 1mm; text-align: left; }
      .total-row > div:last-child { text-align: right; white-space: nowrap; }
      .payment-method { text-transform: uppercase; font-weight: bold; font-size: 11px; color: #000; }
      .footer { text-align: center; margin-top: 2mm; font-size: 10px; font-weight: bold; padding: 1mm 2mm; background-color: #f8f8f8; border-top: 1px dashed #000; }
      .stub-footer { text-align: center; margin-top: 2mm; font-size: 10px; font-weight: bold; padding: 1mm 2mm; background-color: #e8e8e8; border: 1px solid #ccc; border-radius: 3px; }
      .sales-person { margin-top: 2mm; text-align: center; font-weight: bold; font-size: 10px; padding: 1mm 2mm; background-color: #e8e8e8; border: 1px solid #ccc; border-radius: 2px; }
      .customer-info { margin: 2mm 0; padding: 1mm 2mm; font-weight: bold; text-align: left; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; font-size: 10px; }
      .customer-field { margin-bottom: 0.3mm; font-size: 10px; }
      .cut-line { text-align: center; margin: 2mm 0 0 0; font-weight: bold; font-size: 10px; color: #000; letter-spacing: 1px; }
      .thank-you { font-weight: bold; margin: 0.5mm 0; font-size: 10px; }
      .warning { font-size: 9px; color: #000; margin: 0.3mm 0; font-weight: bold; }
      .section-divider { height: 2px; background: linear-gradient(to right, transparent, #000, transparent); margin: 1mm 0; }
      @media print {
        @page { margin: 0 !important; size: 80mm auto !important; }
        body {
          margin: 0 !important; padding: 0 !important; width: 80mm !important; font-size: 12px !important;
          background: white !important; font-weight: bold !important; height: auto !important;
          -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
        }
        .receipt-container { border: none !important; box-shadow: none !important; margin: 0 auto !important; padding: 1mm 2mm !important; width: 78mm !important; }
        .cut-line { page-break-after: always !important; margin-bottom: 0 !important; }
        body::after, body::before { display: none !important; content: none !important; }
      }`;function y(t){const{labels:e}=t,n=t.lines.map(i=>`
          <tr>
            <td class="col-article">${o(i.name)}</td>
            <td class="col-pu">${a(i.unitFC)}</td>
            <td class="col-qte">${i.quantity}</td>
            <td class="col-total">${a(i.totalFC)}</td>
          </tr>`).join("");return`
      <table class="items-table">
        <thead>
          <tr>
            <th class="col-article">${o(e.item)}</th>
            <th class="col-pu">${o(e.unitPrice)}</th>
            <th class="col-qte">${o(e.qty)}</th>
            <th class="col-total">${o(e.total)}</th>
          </tr>
        </thead>
        <tbody>${n}
        </tbody>
      </table>`}const s=(t,e,n="")=>`<div class="total-row"><div><strong>${o(t)}:</strong></div><div${n?` class="${n}"`:""}><strong>${e}</strong></div></div>`;function C(t,e,n=typeof window>"u"?"":window.location.origin){const{labels:i}=t,r=e==="stub",p=`
      <div class="customer-info">
        <div class="customer-field">${o(i.customer)}: <strong>${o(String(t.customerName??"").toUpperCase())}</strong></div>
        ${t.customerPhone?`<div class="customer-field">${o(i.phone)}: <strong>${o(t.customerPhone)}</strong></div>`:""}
        ${!r&&t.customerEmail?`<div class="customer-field">${o(i.email)}: <strong>${o(t.customerEmail)}</strong></div>`:""}
      </div>`,d=r?s(i.saleTotal,a(t.totalFC)):s(i.subtotal,a(t.subtotalFC))+s(i.total,a(t.totalFC)),g=r?`
      <div class="stub-footer">
        <div class="thank-you"><strong>${o(i.stubFooter)}</strong></div>
        <div class="warning"><strong>${o(t.shopName)}</strong></div>
        <div class="warning"><strong>${o(i.keepStub)}</strong></div>
        <div class="warning">${o(i.receiptNoShort)}: <strong>${o(t.receiptNumber)}</strong></div>
        <div class="warning">${o(i.dateShort)}: <strong>${o(t.date)}</strong></div>
      </div>`:`
      <div class="footer">
        <div class="thank-you"><strong>${o(t.receiptFooter||i.thanks)}</strong></div>
        <div class="warning"><strong>${o(i.noExchange)}</strong></div>
        <div class="warning"><strong>${o(i.noRefund)}</strong></div>
      </div>`;return`<!DOCTYPE html>
<html lang="${t.language}">
  <head>
    <meta charset="utf-8">
    <title>${o(r?i.stubTitle:i.title)}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${$(n)}
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="logo-watermark"></div>
      <div class="content-wrapper">
      <div class="header">
        <div class="shop-name"><strong>${o(t.shopName)}</strong></div>
        <div class="shop-details"><strong>${o(t.shopAddress)}</strong></div>
        <div class="shop-details">${o(i.tel)}: <strong>${o(t.shopNumber)}</strong></div>
        ${r?"":`<div class="shop-details"><strong>${o(t.shopRegistration)}</strong></div>`}
      </div>

      <div class="section-divider"></div>

      <div class="receipt-info">
        <div class="shop-details">${o(i.date)}: <strong>${o(t.date)}</strong></div>
        <div class="shop-details">${o(i.receiptNo)}: <strong>${o(t.receiptNumber)}</strong></div>
      </div>
      ${r?`
      <div class="stub-number">${o(i.stubNo)}<strong>${o(t.stubNumber??t.receiptNumber)}</strong></div>`:""}
      ${p}

      <div class="receipt-title">${o(r?i.itemsSold:i.itemsBought)}</div>
      ${y(t)}

      <div class="total-section">
        ${d}
        ${s(i.payment,`${o(t.paymentLabel)}`,"payment-method")}
      </div>

      <div class="sales-person">
        ${o(i.agent)}: <strong>${o(String(t.salesPerson??"").toUpperCase())}</strong>
      </div>
      ${g}

      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
      </div>
    </div>
  </body>
</html>
`}function F(t){const e=window.open("","_blank","width=320,height=600");return e?(e.document.write(t),e.document.close(),x(e),!0):!1}export{m as a,N as b,S as e,a as f,F as o,x as p,C as r};
